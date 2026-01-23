from django.db import models

# Create your models here.
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# ELI-Experienced: Standard Custom User model to allow future-proofing auth (e.g., social login).
class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    is_premium = models.BooleanField(default=False)

class Project(models.Model):
    """
    Represents a LaTeX project.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects',null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Root doc for compilation entry point
    main_document_name = models.CharField(max_length=255, default="main.tex")

    def __str__(self):
        return self.name

class ProjectFile(models.Model):
    """
    Represents a file within a project.
    Stores text content directly or references S3 for binary files.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    path = models.CharField(max_length=512, help_text="Relative path e.g. 'chapters/intro.tex'")
    
    # Simple boolean to distinguish asset vs source code
    is_binary = models.BooleanField(default=False)
    
    # If text:
    content = models.TextField(blank=True, default="")
    
    # If binary (image/pdf imports):
    attachment = models.FileField(upload_to='project_assets/%Y/%m/', null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'path')
        indexes = [
            models.Index(fields=['project', 'path']),
        ]

"""
CompileJob Model with Database Indexes
أضف هذا الكود بدلاً من CompileJob الموجود في models.py
"""
import uuid
from django.db import models
from django.utils import timezone


class CompileJob(models.Model):
    """
    Model لتتبع مهام تحويل LaTeX إلى PDF
    Updated with: Database indexes for better performance
    """
    
    STATUS_CHOICES = [
        ('QUEUED', 'Queued'),
        ('PROCESSING', 'Processing'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relations
    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        related_name='compile_jobs',
        db_index=True
    )
    triggered_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='compile_jobs',
        db_index=True
    )
    
    # Job Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='QUEUED',
        db_index=True
    )
    celery_task_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        db_index=True
    )
    
    # Results
    logs = models.TextField(blank=True, default='')
    pdf_url = models.URLField(max_length=500, blank=True, null=True)
    pdf_size_bytes = models.IntegerField(null=True, blank=True)
    
    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    
    # CV Data (JSON)
    cv_data = models.JSONField(null=True, blank=True)
    
    # Error Tracking
    error_message = models.TextField(blank=True, default='')
    retry_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        # ✅ Database Indexes للأداء
        indexes = [
            # Most common query patterns
            models.Index(fields=['status', '-created_at'], name='job_status_date_idx'),
            models.Index(fields=['triggered_by', '-created_at'], name='job_user_date_idx'),
            models.Index(fields=['project', '-created_at'], name='job_project_date_idx'),
            
            # For successful jobs
            models.Index(
                fields=['-created_at'],
                name='job_recent_success_idx',
                condition=models.Q(status='SUCCESS')
            ),
        ]
        ordering = ['-created_at']
        verbose_name = 'Compile Job'
        verbose_name_plural = 'Compile Jobs'
    
    def __str__(self):
        return f"Job {self.id} - {self.status}"
    
    def save(self, *args, **kwargs):
        """
        Override save to calculate duration
        """
        # Calculate duration if both timestamps exist
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            self.duration_seconds = delta.total_seconds()
        
        super().save(*args, **kwargs)
    
    @property
    def is_complete(self):
        """
        Check if job is in a terminal state
        """
        return self.status in ['SUCCESS', 'FAILED', 'CANCELLED']
    
    @property
    def is_pending(self):
        """
        Check if job is still processing
        """
        return self.status in ['QUEUED', 'PROCESSING']

# Scientific Explanation:
# 1. UUIDs: Used for all PKs to prevent URL enumeration (e.g., guessing project ID /project/5).
# 2. Denormalization: We store content in `ProjectFile` for simplicity. For scale >1TB, text content 
#    might move to S3 or a specialized object store, but DB is ACID compliant and fast for text <1MB.
# 3. Indexes: The unique_together on (project, path) ensures file system integrity and creates 
#    a composite B-Tree index for fast file lookups within a project.

class LaTeXTemplate(models.Model):
    """
    نموذج لتخزين قوالب LaTeX للسير الذاتية
    """
    CATEGORY_CHOICES = [
        ('classic', 'كلاسيكي'),
        ('professional', 'احترافي'),
        ('creative', 'إبداعي'),
        ('graduate', 'خريجين'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name="اسم القالب")
    slug = models.SlugField(unique=True, max_length=200, verbose_name="الرابط")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name="الفئة")
    description = models.TextField(blank=True, verbose_name="الوصف")
    is_premium = models.BooleanField(default=False)
    
    # LaTeX Configuration
    latex_file_name = models.CharField(
        max_length=200, 
        help_text="مثال: classic_arabic_v1.tex"
    )
    schema_class_name = models.CharField(
        max_length=100,
        help_text="مثال: ClassicArabicCVSchema"
    )
    
    # Preview
    preview_image = models.ImageField(
        upload_to='template_previews/', 
        null=True, 
        blank=True,
        verbose_name="صورة المعاينة"
    )
    
    # SEO Fields
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    meta_keywords = models.CharField(max_length=500, blank=True)
    
    # Statistics
    usage_count = models.IntegerField(default=0, verbose_name="عدد الاستخدامات")
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=5.0,
        verbose_name="التقييم"
    )
    
    # Status
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "LaTeX templates"
        verbose_name_plural = "LaTeX templates"
        ordering = ['-usage_count', '-rating']
    
    def __str__(self):
        return f"{self.name} ({self.category})"