"""
API Views for CV Generation and Template Management
Updated with: Rate Limiting, Input Validation, Daily Limits, Edit Support
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.utils.html import strip_tags
from django_ratelimit.decorators import ratelimit
from django.core.cache import cache

from .models import LaTeXTemplate, CompileJob, Project
from .serializers import TemplateSerializer
from .services.openai_service import OpenAIService
from .services.latex_service import LaTeXService
from .tasks.compile_tasks import compile_latex_to_pdf

from rest_framework.permissions import AllowAny 
from django.core.cache import cache 
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_templates(request):
    """
    عرض جميع القوالب المتاحة
    مع Caching لتحسين الأداء
    """
    # Try cache first
    cache_key = 'active_templates_list_v1'
    templates_data = cache.get(cache_key)
    
    if templates_data is None:
        templates = LaTeXTemplate.objects.filter(is_active=True).order_by('-usage_count')
        
        templates_data = [{
            'id': str(t.id),
            'name': t.name,
            'slug': t.slug,
            'category': t.category,
            'description': t.description,
            'preview_image': request.build_absolute_uri(t.preview_image.url) if t.preview_image else None,
            'usage_count': t.usage_count,
            'rating': float(t.rating),
            'is_premium': t.is_premium,
        } for t in templates]
        
        # Cache for 1 hour
        cache.set(cache_key, templates_data, 3600)
        logger.info(f"Templates cached: {len(templates_data)} templates")
    
    return Response(templates_data)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    API: /api/users/me/
    وظيفته: يرجع بيانات المستخدم عشان الفرونت إند يعرف إنه مسجل
    """
    user = request.user
    return Response({
        'id': str(user.id),
        'username': user.username,
        'email': user.email,
        'is_premium': getattr(user, 'is_premium', False),
    })
# في ملف backend/core/cv_views.py

from rest_framework.parsers import MultiPartParser, FormParser
from pypdf import PdfReader
import io

# ... (الاستيرادات السابقة)

@api_view(['POST'])
@permission_classes([AllowAny]) # نسمح للزوار بتجربة الميزة
def parse_cv_from_pdf(request):
    """
    استلام ملف PDF واستخراج البيانات منه وتحويلها لـ JSON
    """
    # 1. التحقق من وجود الملف
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    pdf_file = request.FILES['file']
    
    # 2. التحقق من الامتداد
    if not pdf_file.name.endswith('.pdf'):
        return Response({'error': 'File must be a PDF'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 3. استخراج النص من الـ PDF
        reader = PdfReader(io.BytesIO(pdf_file.read()))
        raw_text = ""
        for page in reader.pages:
            raw_text += page.extract_text() + "\n"
            
        if len(raw_text.strip()) < 50:
            return Response({'error': 'لم نتمكن من قراءة النص من الملف. قد يكون صورة.'}, status=400)

        # 4. استدعاء OpenAI لتحليل النص
        openai_service = OpenAIService()
        
        # نستخدم الـ Schema الافتراضية
        from core.schemas.classic import ClassicArabicCVSchema
        
        structured_data = openai_service.parse_resume_text(raw_text, ClassicArabicCVSchema)
        
        # 5. تحويل البيانات لـ Dict
        cv_data = structured_data.model_dump()
        
        # إضافة ID القالب الافتراضي لو مش موجود
        default_template = LaTeXTemplate.objects.filter(is_active=True).first()
        cv_data['template_id'] = str(default_template.id) if default_template else None

        # 6. إنشاء Job مؤقت (اختياري) أو إرجاع البيانات للفرونت فوراً
        # هنا سنقوم بإنشاء مشروع وسجل فوراً لتسهيل الأمر
        
        is_auth = request.user.is_authenticated
        
        project = Project.objects.create(
            name=f"Imported CV - {cv_data.get('full_name', 'Unknown')}",
            owner=request.user if is_auth else None
        )
        
        job = CompileJob.objects.create(
            project=project,
            triggered_by=request.user if is_auth else None,
            status='SUCCESS', # نعتبرها ناجحة كبيانات
            cv_data=cv_data
        )

        return Response({
            'success': True,
            'job_id': str(job.id),
            'cv_data': cv_data,
            'message': 'تم استخراج البيانات بنجاح'
        })

    except Exception as e:
        logger.error(f"PDF Parsing Failed: {str(e)}")
        return Response({'error': f'فشل تحليل الملف: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_template(request, template_id):
    """
    عرض تفاصيل قالب محدد
    """
    try:
        template = LaTeXTemplate.objects.get(id=template_id, is_active=True)
        serializer = TemplateSerializer(template, context={'request': request})
        return Response(serializer.data)
    except LaTeXTemplate.DoesNotExist:
        return Response(
            {'error': 'Template not found or inactive'},
            status=status.HTTP_404_NOT_FOUND
        )


@ratelimit(key='user', rate='5/h', method='POST', block=True) # حماية السيرفر من الـ Spam
@api_view(['POST'])
@permission_classes([AllowAny]) # تغيير الصلاحية لتشمل الضيوف والمستخدمين
def generate_cv_with_ai(request):
    """
    توليد سيرة ذاتية ذكي: يدعم الضيوف لمرة واحدة والمستخدمين حسب حدودهم اليومية.
    """
    # 1. تتبع الضيوف عن طريق الـ IP (Guest Trial Logic)
    user_ip = request.META.get('REMOTE_ADDR')
    is_authenticated = request.user.is_authenticated
    
    if not is_authenticated:
        cache_key = f"guest_trial_{user_ip}"
        if cache.get(cache_key):
            return Response({
                'error': 'لقد استنفدت تجربتك المجانية. يرجى تسجيل الدخول للمتابعة وحفظ عملك.',
                'requires_auth': True
            }, status=status.HTTP_401_UNAUTHORIZED)

    # 2. استقبال البيانات (دعم prompt و user_prompt لضمان التوافق)
    user_prompt = strip_tags(request.data.get('prompt') or request.data.get('user_prompt', ''))
    template_id = request.data.get('template_id')
    language = request.data.get('language', 'ar')
    print(f"DEBUG: Received prompt: '{user_prompt}' | Length: {len(user_prompt)}")
    # 3. اختيار القالب الافتراضي بذكاء إذا لم يتم إرساله
    if not template_id:
        default_template = LaTeXTemplate.objects.filter(latex_file_name='classic_arabic_v1.tex', is_active=True).first()
        if not default_template:
            return Response({'error': 'النظام غير جاهز: القالب الافتراضي مفقود.'}, status=404)
        template_id = str(default_template.id)

    # 4. الحفاظ على الـ Validations الأصلية (Accuracy Guard)
    if not user_prompt or len(user_prompt) < 100:
        return Response({'error': 'النص قصير جداً. يجب أن يكون 100 حرف على الأقل لتوليد بيانات دقيقة.'}, status=400)
    
    if len(user_prompt) > 3000:
        return Response({'error': 'النص طويل جداً. الحد الأقصى 3000 حرف.'}, status=400)

    # 5. التحقق من الحدود اليومية للمستخدمين المسجلين فقط
    if is_authenticated:
        today = timezone.now().date()
        daily_count = CompileJob.objects.filter(triggered_by=request.user, created_at__date=today).count()
        max_daily = 50 if request.user.is_premium else 10
        if daily_count >= max_daily:
            return Response({'error': f'لقد وصلت للحد اليومي ({max_daily} سيرة ذاتية)'}, status=429)

    # 6. إنشاء السجل بربطه بالمستخدم أو تركه فارغاً للضيف
    try:
        project = Project.objects.create(
            name=f"CV - {timezone.now().strftime('%Y-%m-%d')}",
            owner=request.user if is_authenticated else None # دعم الضيوف
        )
        
        job = CompileJob.objects.create(
            project=project,
            triggered_by=request.user if is_authenticated else None,
            status='QUEUED',
            cv_data={'raw_prompt': user_prompt, 'template_id': template_id, 'language': language}
        )

        # 7. تفعيل الحظر للضيف في الـ Cache بعد نجاح البدء
        if not is_authenticated:
            cache.set(f"guest_trial_{user_ip}", True, 86400) # منع الـ IP لمدة 24 ساعة

        # 8. إطلاق الـ Pipeline الخلفي (AI + LaTeX + PDF)
        from core.tasks.compile_tasks import full_ai_cv_pipeline
        full_ai_cv_pipeline.delay(str(job.id))

        # 9. رد فوري للفرونت إند (Speed & SEO Compatibility)
        return Response({
            'resume_id': str(job.id), # المفتاح الأساسي للتوجيه في الفرونت إند
            'status': 'QUEUED',
            'is_guest': not is_authenticated,
            'message': 'بدأت عملية المعالجة الذكية بنجاح'
        }, status=202)

    except Exception as e:
        return Response({'error': f'فشل في بدء العملية: {str(e)}'}, status=500)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cv_data(request, job_id):
    """
    ✅ جلب بيانات السيرة الذاتية للتعديل
    
    GET /api/get-cv-data/<job_id>/
    """
    try:
        job = CompileJob.objects.get(id=job_id, triggered_by=request.user)
        
        if not job.cv_data:
            return Response(
                {'error': 'No CV data found for this job'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'success': True,
            'cv_data': job.cv_data,
            'template_id': job.cv_data.get('template_id'),
            'status': job.status,
            'pdf_url': job.pdf_url
        })
        
    except CompileJob.DoesNotExist:
        return Response(
            {'error': 'Job not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_cv_data(request):
    """
    ✅ تحديث بيانات السيرة الذاتية وإعادة توليد PDF
    
    POST /api/update-cv-data/
    Body:
    {
        "job_id": "uuid",
        "cv_data": {...},
        "template_id": "uuid"
    }
    """
    
    job_id = request.data.get('job_id')
    cv_data = request.data.get('cv_data')
    template_id = request.data.get('template_id')
    
    # Validation
    if not job_id or not cv_data:
        return Response(
            {'error': 'job_id and cv_data are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get original job
        old_job = CompileJob.objects.get(id=job_id, triggered_by=request.user)
        
        # Get template
        template_id = template_id or cv_data.get('template_id')
        template = LaTeXTemplate.objects.get(id=template_id, is_active=True)
        
        # Generate new LaTeX
        latex_service = LaTeXService()
        latex_content = latex_service.render_latex(
            template_name=template.latex_file_name,
            data=cv_data
        )
        
        # Create new CompileJob
        new_job = CompileJob.objects.create(
            project=old_job.project,
            triggered_by=request.user,
            status='QUEUED',
            cv_data=cv_data
        )
        
        # Queue compilation
        font_path = latex_service.get_arabic_font_path()
        task = compile_latex_to_pdf.apply_async(
            args=[latex_content, str(new_job.id), font_path],
            countdown=2
        )
        
        new_job.celery_task_id = task.id
        new_job.save(update_fields=['celery_task_id'])
        
        logger.info(f"CV updated: new job {new_job.id} created from old job {job_id}")
        
        return Response({
            'success': True,
            'job_id': str(new_job.id),
            'status': 'QUEUED',
            'message': 'CV update queued successfully'
        }, status=status.HTTP_202_ACCEPTED)
        
    except CompileJob.DoesNotExist:
        return Response(
            {'error': 'Original job not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except LaTeXTemplate.DoesNotExist:
        return Response(
            {'error': 'Template not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"CV update failed: {str(e)}")
        return Response(
            {'error': f'Failed to update CV: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_job_status(request, job_id):
    """
    التحقق من حالة توليد السيرة الذاتية
    """
    try:
        job = CompileJob.objects.get(id=job_id, triggered_by=request.user)
        
        response_data = {
            'job_id': str(job.id),
            'status': job.status,
            'created_at': job.created_at,
        }
        
        if job.status == 'SUCCESS':
            response_data.update({
                'pdf_url': job.pdf_url,
                'completed_at': job.completed_at,
                'duration_seconds': job.duration_seconds,
            })
        elif job.status == 'FAILED':
            response_data['error'] = job.error_message
        elif job.status == 'PROCESSING':
            response_data['message'] = 'جاري توليد السيرة الذاتية...'
        
        return Response(response_data)
        
    except CompileJob.DoesNotExist:
        return Response(
            {'error': 'Job not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_cv_history(request):
    """
    عرض تاريخ السير الذاتية للمستخدم
    """
    # Get last 30 days
    cutoff_date = timezone.now() - timezone.timedelta(days=30)
    
    jobs = CompileJob.objects.filter(
        triggered_by=request.user,
        created_at__gte=cutoff_date
    ).select_related('project').order_by('-created_at')[:50]
    
    history = [{
        'job_id': str(job.id),
        'project_name': job.project.name if job.project else 'Unknown',
        'status': job.status,
        'created_at': job.created_at,
        'pdf_url': job.pdf_url if job.status == 'SUCCESS' else None,
    } for job in jobs]
    
    return Response({
        'total': len(history),
        'history': history
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stats(request):
    """
    إحصائيات المستخدم
    """
    today = timezone.now().date()
    
    stats = {
        'total_cvs': CompileJob.objects.filter(triggered_by=request.user).count(),
        'successful_cvs': CompileJob.objects.filter(
            triggered_by=request.user, 
            status='SUCCESS'
        ).count(),
        'today_count': CompileJob.objects.filter(
            triggered_by=request.user,
            created_at__date=today
        ).count(),
        'daily_limit': 50 if request.user.is_premium else 10,
        'is_premium': request.user.is_premium,
    }
    
    stats['remaining_today'] = max(0, stats['daily_limit'] - stats['today_count'])
    
    return Response(stats)