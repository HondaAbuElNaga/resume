"""
Celery Tasks for LaTeX Compilation
Updated with: Sentry error tracking, Better retry logic
"""
from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from django.utils import timezone
import subprocess
import tempfile
from pathlib import Path
import logging
import sentry_sdk

logger = logging.getLogger(__name__)


def update_job_failed(job_id: str, error_message: str):
    """
    Helper للتعامل مع الأخطاء
    """
    from core.models import CompileJob
    try:
        job = CompileJob.objects.get(id=job_id)
        job.status = 'FAILED'
        job.error_message = error_message[:1000]  # Limit length
        job.completed_at = timezone.now()
        job.save(update_fields=['status', 'error_message', 'completed_at'])
        logger.error(f"Job {job_id} failed: {error_message}")
    except Exception as e:
        logger.error(f"Failed to update job {job_id}: {str(e)}")


@shared_task(
    bind=True,
    name='core.tasks.compile_latex_to_pdf',
    max_retries=3,
    soft_time_limit=180,  # 3 minutes soft limit
    time_limit=240,       # 4 minutes hard limit
    autoretry_for=(subprocess.TimeoutExpired,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def compile_latex_to_pdf(self, latex_content: str, job_id: str, font_path: str = None):
    """
    Compile LaTeX to PDF using Tectonic
    
    Args:
        latex_content: LaTeX source code
        job_id: CompileJob UUID
        font_path: Optional path to custom font
        
    Returns:
        dict with status and pdf_url
        
    Raises:
        Exception: If compilation fails
    """
    from core.models import CompileJob
    
    logger.info(f"Starting compilation for job {job_id}")
    
    try:
        # Get job from database
        job = CompileJob.objects.get(id=job_id)
        job.status = 'PROCESSING'
        job.started_at = timezone.now()
        job.celery_task_id = self.request.id
        job.save(update_fields=['status', 'started_at', 'celery_task_id'])
        
        # Create temporary directory
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            logger.info(f"Created temp dir: {tmpdir}")
            
            # Write LaTeX file
            tex_file = tmpdir / "cv.tex"
            tex_file.write_text(latex_content, encoding='utf-8')
            logger.info(f"Written LaTeX file: {tex_file}")
            
            # Copy font if provided
            if font_path and Path(font_path).exists():
                import shutil
                font_file = Path(font_path)
                dest_font = tmpdir / font_file.name
                shutil.copy(font_file, dest_font)
                logger.info(f"Copied font: {font_file.name}")
            
            # Run Tectonic compiler
            logger.info(f"Running Tectonic for job {job_id}")
            result = subprocess.run(
                ['tectonic', str(tex_file)],
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=120  # 2 minutes for compilation
            )
            
            # Log output
            if result.stdout:
                logger.info(f"Tectonic stdout: {result.stdout[:500]}")
            if result.stderr:
                logger.warning(f"Tectonic stderr: {result.stderr[:500]}")
            
            # Check if compilation succeeded
            if result.returncode != 0:
                error_msg = f"Tectonic failed with code {result.returncode}"
                if result.stderr:
                    error_msg += f": {result.stderr[:500]}"
                elif result.stdout:
                    error_msg += f": {result.stdout[:500]}"
                
                logger.error(f"Compilation failed for job {job_id}: {error_msg}")
                raise Exception(error_msg)
            
            # Check if PDF was created
            pdf_file = tmpdir / "cv.pdf"
            if not pdf_file.exists():
                error_msg = "PDF file was not generated"
                logger.error(f"Job {job_id}: {error_msg}")
                raise Exception(error_msg)
            
            # Read PDF content
            pdf_content = pdf_file.read_bytes()
            pdf_size = len(pdf_content)
            logger.info(f"PDF generated: {pdf_size} bytes")
            
            # TODO: Upload to S3 or storage
            # For now, save locally or return base64
            # You should implement proper storage here
            
            # Example: Save to media folder (temporary solution)
            from django.conf import settings
            from django.core.files.base import ContentFile
            from django.core.files.storage import default_storage
            
            pdf_filename = f"cvs/{job_id}/cv.pdf"
            saved_path = default_storage.save(pdf_filename, ContentFile(pdf_content))
            pdf_url = default_storage.url(saved_path)
            
            logger.info(f"PDF saved: {pdf_url}")
            
            # Update job with success
            job.status = 'SUCCESS'
            job.pdf_url = pdf_url
            job.pdf_size_bytes = pdf_size
            job.logs = result.stdout[:5000] if result.stdout else ''
            job.completed_at = timezone.now()
            job.save(update_fields=[
                'status', 'pdf_url', 'pdf_size_bytes', 
                'logs', 'completed_at'
            ])
            
            logger.info(f"Job {job_id} completed successfully")
            
            return {
                'status': 'success',
                'job_id': str(job_id),
                'pdf_url': pdf_url,
                'pdf_size': pdf_size
            }
    
    except subprocess.TimeoutExpired as e:
        error_msg = "Compilation timed out (exceeded 2 minutes)"
        logger.error(f"Job {job_id}: {error_msg}")
        
        # Track in Sentry
        sentry_sdk.capture_exception(e)
        sentry_sdk.capture_message(
            f"LaTeX compilation timeout for job {job_id}",
            level='warning'
        )
        
        update_job_failed(job_id, error_msg)
        
        # Retry with exponential backoff
        raise self.retry(
            exc=e,
            countdown=2 ** self.request.retries * 10,  # 10s, 20s, 40s
            max_retries=2
        )
    
    except SoftTimeLimitExceeded as e:
        error_msg = "Task exceeded soft time limit (3 minutes)"
        logger.error(f"Job {job_id}: {error_msg}")
        
        # Track in Sentry
        sentry_sdk.capture_exception(e)
        
        update_job_failed(job_id, error_msg)
        raise
    
    except Exception as e:
        error_msg = str(e)[:1000]
        logger.error(f"Job {job_id} failed: {error_msg}", exc_info=True)
        
        # Track in Sentry with context
        sentry_sdk.capture_exception(e)
        sentry_sdk.set_context("job", {
            "job_id": job_id,
            "latex_length": len(latex_content),
            "has_font": font_path is not None,
        })
        
        update_job_failed(job_id, error_msg)
        
        # Don't retry on non-timeout errors
        raise


@shared_task(name='core.tasks.cleanup_old_jobs')
def cleanup_old_jobs(days: int = 30):
    """
    Cleanup old compilation jobs
    Run daily via Celery Beat
    """
    from core.models import CompileJob
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=days)
    
    # Delete old failed jobs
    failed_jobs = CompileJob.objects.filter(
        status='FAILED',
        created_at__lt=cutoff_date
    )
    
    failed_count = failed_jobs.count()
    failed_jobs.delete()
    
    logger.info(f"Cleaned up {failed_count} old failed jobs")
    
    return {
        'cleaned_failed_jobs': failed_count,
        'cutoff_date': cutoff_date.isoformat()
    }


@shared_task(name='core.tasks.update_template_stats')
def update_template_stats():
    """
    Update template usage statistics
    Run hourly via Celery Beat
    """
    from core.models import LaTeXTemplate, CompileJob
    from django.db.models import Count, Q
    
    templates = LaTeXTemplate.objects.all()
    
    for template in templates:
        # Count successful compilations using this template
        usage = CompileJob.objects.filter(
            cv_data__template_id=str(template.id),
            status='SUCCESS'
        ).count()
        
        if template.usage_count != usage:
            template.usage_count = usage
            template.save(update_fields=['usage_count'])
            logger.info(f"Updated template {template.name}: {usage} uses")
    
    logger.info("Template stats updated")
    return {'templates_updated': templates.count()}
# @shared_task(name='core.tasks.update_template_stats')
# def update_template_stats():
#     """
#     Update template usage statistics
#     Run hourly via Celery Beat
#     """
#     from core.models import LaTeXTemplate, CompileJob
#     from django.db.models import Count, Q
    
#     templates = LaTeXTemplate.objects.all()
    
#     for template in templates:
#         # Count successful compilations using this template
#         usage = CompileJob.objects.filter(
#             cv_data__template_id=str(template.id),
#             status='SUCCESS'
#         ).count()
        
#         if template.usage_count != usage:
#             template.usage_count = usage
#             template.save(update_fields=['usage_count'])
#             logger.info(f"Updated template {template.name}: {usage} uses")
    
#     logger.info("Template stats updated")
#     return {'templates_updated': templates.count()}
@shared_task(name='core.tasks.full_ai_cv_pipeline')
def full_ai_cv_pipeline(job_id):
    # استدعاء الخدمات داخل التاسك لضمان الـ Speed
    from core.models import CompileJob, LaTeXTemplate
    from core.services.openai_service import OpenAIService
    from core.services.latex_service import LaTeXService
    from core.schemas import get_schema_by_name

    job = CompileJob.objects.get(id=job_id)
    job.status = 'PROCESSING'
    job.save()

    try:
        # أ. استخراج البيانات (AI Accuracy)
        template = LaTeXTemplate.objects.get(id=job.cv_data['template_id'])
        ai_service = OpenAIService()
        schema_class = get_schema_by_name(template.schema_class_name)
        
        cv_data_obj = ai_service.extract_cv_data(job.cv_data['raw_prompt'], schema_class, job.cv_data['language'])
        cv_data = cv_data_obj.model_dump()
        cv_data['template_id'] = str(template.id)

        # ب. حقن البيانات (Latex Injection)
        latex_service = LaTeXService()
        latex_content = latex_service.render_latex(template.latex_file_name, cv_data)

        # ج. التحديث والتحويل النهائي
        job.cv_data = cv_data # حفظ الداتا الحقيقية بدلاً من البرومبت
        job.save()
        
        compile_latex_to_pdf(latex_content, str(job.id), latex_service.get_arabic_font_path())

    except Exception as e:
        update_job_failed(job_id, str(e))