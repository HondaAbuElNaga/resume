from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from django.contrib.auth import get_user_model, login as django_login
from django.shortcuts import redirect
from rest_framework.authtoken.models import Token
import uuid

User = get_user_model()

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    ✅ Adapter احترافي لـ Social Authentication (Google & LinkedIn
    """
    
    def is_auto_signup_allowed(self, request, sociallogin):
        """
        السماح بالتسجيل التلقائي دائماً
        """
        return True
    
    def pre_social_login(self, request, sociallogin):
        """
        تسجيل الدخول تلقائياً بعد OAuth
        """
        user = sociallogin.user
        if user.id:
            django_login(request, user, backend='allauth.account.auth_backends.AuthenticationBackend')
    
    def get_signup_redirect_url(self, request):
        """
        التحويل مباشرة بعد التسجيل مع Token
        """
        if request.user.is_authenticated:
            token, _ = Token.objects.get_or_create(user=request.user)
            return f'http://localhost:3000/auth/callback?token={token.key}'
        return 'http://localhost:3000/login'
    
    def populate_user(self, request, sociallogin, data):
        """
        ملء بيانات المستخدم من Google أو LinkedIn
        """
        user = super().populate_user(request, sociallogin, data)
        provider = sociallogin.account.provider
        
        # ✅ معالجة البيانات حسب المزود
        if provider == 'google':
            email = data.get('email', '')
            
            if email:
                base_username = email.split('@')[0].replace('.', '')
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                user.username = username
            else:
                user.username = f"user_{uuid.uuid4().hex[:8]}"
            
            if 'name' in data:
                name_parts = data['name'].split(' ', 1)
                user.first_name = name_parts[0] if len(name_parts) > 0 else ''
                user.last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        elif provider == 'linkedin_oauth2':
            # ✅ LinkedIn يستخدم هيكل مختلف
            email = data.get('email', '')
            
            if email:
                base_username = email.split('@')[0].replace('.', '')
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                user.username = username
            else:
                user.username = f"linkedin_{uuid.uuid4().hex[:8]}"
            
            # LinkedIn يرسل الاسم في localizedFirstName و localizedLastName
            user.first_name = data.get('localizedFirstName', data.get('firstName', ''))
            user.last_name = data.get('localizedLastName', data.get('lastName', ''))
        
        return user


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    ✅ Adapter للـ Account العادي
    """
    def is_open_for_signup(self, request):
        """
        السماح بالتسجيل
        """
        return True
    
    def get_login_redirect_url(self, request):
        """
        التحويل بعد تسجيل الدخول
        """
        if request.user.is_authenticated:
            token, _ = Token.objects.get_or_create(user=request.user)
            return f'http://localhost:3000/auth/callback?token={token.key}'
        return 'http://localhost:3000/login'