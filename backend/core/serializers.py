"""
Serializers for API
Updated with: Optimized fields to avoid N+1 queries
"""
from rest_framework import serializers
from .models import Project, ProjectFile, LaTeXTemplate, CompileJob



class ProjectFileSerializer(serializers.ModelSerializer):
    """
    Serializer for ProjectFile model
    """
    class Meta:
        model = ProjectFile
        fields = ['id', 'project', 'path', 'is_binary', 'content', 'attachment', 'updated_at']  # ✅ استخدم 'path' مش 'file_name'
        read_only_fields = ['id', 'updated_at']

class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for Project model
    Optimized with annotated fields from queryset
    """
    files = ProjectFileSerializer(many=True, read_only=True)
    
    # Annotated fields (من الـ queryset annotations)
    latest_job_id = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()
    latest_job_status = serializers.SerializerMethodField()
    total_jobs = serializers.SerializerMethodField()
    successful_jobs = serializers.SerializerMethodField()
    template_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'main_document_name',
            'owner', 'files', 'created_at', 'updated_at',
            # Computed fields
            'latest_job_id', 'pdf_url', 'latest_job_status',
            'total_jobs', 'successful_jobs', 'template_id'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_latest_job_id(self, obj):
        """
        Get latest job ID from annotation
        No additional query!
        """
        job_id = getattr(obj, '_latest_job_id', None)
        return str(job_id) if job_id else None

    def get_pdf_url(self, obj):
        """
        Get PDF URL from annotation
        No additional query!
        """
        return getattr(obj, '_latest_pdf_url', None)

    def get_latest_job_status(self, obj):
        """
        Get latest job status from annotation
        No additional query!
        """
        return getattr(obj, '_latest_job_status', None)

    def get_total_jobs(self, obj):
        """
        Get total jobs count from annotation
        No additional query!
        """
        return getattr(obj, '_total_jobs', 0)

    def get_successful_jobs(self, obj):
        """
        Get successful jobs count from annotation
        No additional query!
        """
        return getattr(obj, '_successful_jobs', 0)

    def get_template_id(self, obj):
        """
        Extract template_id from latest job's cv_data
        """
        # Try to get from latest job annotation
        try:
            latest_job = obj.compile_jobs.order_by('-created_at').first()
            if latest_job and latest_job.cv_data:
                cv_data = latest_job.cv_data
                if isinstance(cv_data, dict):
                    return cv_data.get('template_id')
        except:
            pass
        return None


class TemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for LaTeXTemplate model
    """
    preview_image_url = serializers.SerializerMethodField()
    preview_pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = LaTeXTemplate
        fields = [
            'id', 'name', 'slug', 'category', 'description',
            'preview_image', 'preview_image_url',
            'preview_pdf', 'preview_pdf_url',
            'usage_count', 'rating', 'is_active', 'is_premium',
            'is_featured', 'created_at'
        ]
        read_only_fields = ['id', 'usage_count', 'rating', 'created_at']

    def get_preview_image_url(self, obj):
        """
        Get full URL for preview image
        """
        request = self.context.get('request')
        if obj.preview_image and request:
            return request.build_absolute_uri(obj.preview_image.url)
        return None

    def get_preview_pdf_url(self, obj):
        """
        Get full URL for preview PDF
        """
        request = self.context.get('request')
        if obj.preview_pdf and request:
            return request.build_absolute_uri(obj.preview_pdf.url)
        return None


class CompileJobSerializer(serializers.ModelSerializer):
    """
    Serializer for CompileJob model
    """
    project_name = serializers.CharField(source='project.name', read_only=True)
    user_email = serializers.CharField(source='triggered_by.email', read_only=True)
    
    class Meta:
        model = CompileJob
        fields = [
            'id', 'project', 'project_name', 'triggered_by', 'user_email',
            'status', 'logs', 'pdf_url', 'pdf_size_bytes',
            'started_at', 'completed_at', 'duration_seconds',
            'cv_data', 'error_message', 'retry_count',
            'celery_task_id', 'created_at'
        ]
        read_only_fields = [
            'id', 'status', 'logs', 'pdf_url', 'pdf_size_bytes',
            'started_at', 'completed_at', 'duration_seconds',
            'error_message', 'retry_count', 'celery_task_id', 'created_at'
        ]


class CompileJobListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for job lists
    """
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = CompileJob
        fields = [
            'id', 'project', 'project_name', 'status',
            'pdf_url', 'created_at', 'completed_at'
        ]