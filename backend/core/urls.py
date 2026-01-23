from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken import views as auth_views
from django.conf import settings
from django.conf.urls.static import static
from . import cv_views
from .cv_views import parse_cv_from_pdf

# 1. Import ViewSets and Auth Views
from .views import (
    CustomAuthToken,
    ProjectViewSet, 
    TriggerCompileView, 
    RegisterView,
    SocialAuthCallbackView,
    CurrentUserView,
    custom_social_signup,
    CustomAuthToken,
)

# 2. Import CV Specific Views (Added new imports here)
from .cv_views import (
    generate_cv_with_ai,
    check_job_status,
    list_templates,
    update_cv_data,
    get_cv_data,
    user_stats,
    
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    # API Routes (Projects CRUD)
    path('api/', include(router.urls)),
    
    # Authentication & User Management
    path('api/api-token-auth/', CustomAuthToken.as_view(), name='api-token-auth'),    path('api/api-token-auth/', CustomAuthToken.as_view(), name='api-token-auth'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/user/', CurrentUserView.as_view(), name='current-user'),
    path('api/social-auth-callback/', SocialAuthCallbackView.as_view(), name='social-auth-callback'),
    path('accounts/social/signup/', custom_social_signup, name='socialaccount_signup'),
    
    # =============================================
    # ✅ CV Generation & AI Endpoints
    # =============================================
    
    # 1. AI Generation (Start)
    path('api/generate/', generate_cv_with_ai, name='generate-cv'),
    # في ملف urls.py

    # 2. Job Status Polling
    path('api/check-job-status/<uuid:job_id>/', check_job_status, name='check-job-status'),
    
    # 3. Templates List
    path('api/templates/', list_templates, name='list-templates'),
    
    # 4. Hybrid Editing Endpoints (New)
    path('api/get-cv-data/<uuid:job_id>/', get_cv_data, name='get-cv-data'),     # جلب البيانات
    path('api/update-cv-data/', update_cv_data, name='update-cv-data'),           # تحديث البيانات
    
    # 5. User Statistics
    path('api/user-stats/', user_stats, name='user-stats'),

    # Compile endpoint (Legacy/Manual Trigger)
    path('api/projects/<uuid:project_id>/compile/', TriggerCompileView.as_view(), name='compile'),
    # endpoint for user data
    path('api/users/me/', cv_views.get_current_user, name='current-user'),
    # New Endpoint for PDF Upload
    path('api/parse-cv-pdf/', parse_cv_from_pdf, name='parse-cv-pdf')

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)