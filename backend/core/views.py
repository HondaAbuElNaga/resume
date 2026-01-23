from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from rest_framework import viewsets, permissions, status, views, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.serializers import ModelSerializer
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken

# استيراد النماذج والمهام الخاصة بمشروعنا
from .models import Project, ProjectFile, CompileJob
from .serializers import ProjectSerializer, ProjectFileSerializer
from .tasks.compile_tasks import compile_latex_to_pdf

User = get_user_model()

# ==========================================
# 1. Authentication & Registration Views
# ==========================================

class RegisterSerializer(ModelSerializer):
    """
    Serializer داخلي لمعالجة بيانات إنشاء الحساب.
    يقوم بالتحقق من البيانات وتشفير كلمة المرور.
    """
    class Meta:
        model = User
        fields = ('username', 'password', 'email')
        # write_only: تضمن أن كلمة المرور لا تُرسل أبداً في الرد (للأمان)
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # استخدام دالة create_user لضمان تشفير الباسورد (Hashing)
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', '')
        )
        return user


class RegisterView(generics.CreateAPIView):
    """
    API Endpoint: لإنشاء مستخدم جديد.
    يسمح لأي شخص (AllowAny) بالوصول لهذا الرابط.
    
    POST /api/register/
    Body: {
        "username": "user123",
        "password": "securepass",
        "email": "user@example.com"
    }
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # ✅ إنشاء Token للمستخدم الجديد (للدخول التلقائي)
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'تم إنشاء الحساب بنجاح',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'token': token.key  # يمكن استخدامه للدخول التلقائي
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)



# في ملف backend/core/views.py

class CustomAuthToken(ObtainAuthToken):
    """
    Login View مخصص ذكي:
    يعالج مشكلة تكرار الإيميلات عن طريق تجربة الباسورد مع كل الحسابات المرتبطة بالإيميل.
    """
    def post(self, request, *args, **kwargs):
        print("\n" + "="*30)
        print("DEBUG: CustomAuthToken called (Multi-User Safe Version)")
        
        incoming_username = request.data.get('username')
        password = request.data.get('password')

        if not incoming_username or not password:
            return Response({'error': 'Please provide both username/email and password'}, 
                            status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        actual_username = None

        # 1. البحث باستخدام الإيميل (جلب القائمة كاملة لتجنب خطأ التكرار)
        users_by_email = User.objects.filter(email=incoming_username)
        
        if users_by_email.exists():
            print(f"DEBUG: Found {users_by_email.count()} users with email '{incoming_username}'")
            # 2. حلقة تكرارية: جرب الباسورد مع كل يوزر نلاقيه
            for user in users_by_email:
                if user.check_password(password):
                    actual_username = user.username
                    print(f"DEBUG: Password match found for user: {actual_username}")
                    break
            
            # لو خلصنا اللفة وملقيناش باسورد صح، هناخد أول واحد وخلاص عشان السيستم يرد بـ Invalid Credentials
            if not actual_username:
                 print("DEBUG: No user matched the password, defaulting to first found.")
                 actual_username = users_by_email.first().username
        else:
            # لو مفيش إيميل، نعتبره username عادي
            print("DEBUG: No email found, treating as username.")
            actual_username = incoming_username

        # 3. المصادقة النهائية
        serializer = self.serializer_class(data={'username': actual_username, 'password': password},
                                           context={'request': request})
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = Token.objects.get_or_create(user=user)
            print("DEBUG: Login Success!")
            print("="*30 + "\n")
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email,
                'username': user.username
            })
            
        print("DEBUG: Login Failed")
        print("="*30 + "\n")
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

# ==========================================
# 2. Social Authentication Views
# ==========================================

class SocialAuthCallbackView(views.APIView):
    """
    ✅ Endpoint لاستقبال البيانات بعد نجاح Social Login
    
    هذا الـ endpoint يتم استدعاؤه بعد ما المستخدم يسجل دخول من Google/Apple
    ويرجع Token للفرونت إند
    
    POST /api/social-auth-callback/
    Body: {
        "user_id": 123
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({
                'error': 'user_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)


class CurrentUserView(views.APIView):
    """
    ✅ Endpoint لجلب بيانات المستخدم الحالي
    
    GET /api/user/
    Headers: Authorization: Token <your_token>
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name
        })


# ==========================================
# ✅ Custom Social Signup Handler
# ==========================================

from django.contrib.auth import login
from rest_framework.authtoken.models import Token

def custom_social_signup(request):
    """
    معالج احترافي لـ Social Login
    يقوم بإنشاء Token وإرساله مع الـ Redirect
    """
    if request.user.is_authenticated:
        # إنشاء أو جلب Token
        token, created = Token.objects.get_or_create(user=request.user)
        
        # التحويل للـ React مع Token في URL
        return redirect(f'http://localhost:3000/auth/callback?token={token.key}&user_id={request.user.id}')
    
    # إذا لم يكن مسجل دخول، التحويل للـ Login
    return redirect('http://localhost:3000/login?error=auth_failed')

# ==========================================
# 3. Project Management Views
# ==========================================

class ProjectViewSet(viewsets.ModelViewSet):
    """
    CRUD for Projects (إنشاء، عرض، تعديل، حذف المشاريع).
    يقوم بفلترة المشاريع بحيث يرى كل مستخدم مشاريعه فقط.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        # Security: يرجع فقط المشاريع الخاصة بالمستخدم الحالي
        return Project.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        # عند إنشاء مشروع جديد، نربطه تلقائياً بالمستخدم المسجل دخول
        serializer.save(owner=self.request.user)


# ==========================================
# 4. Compilation Logic (Heavy Tasks)
# ==========================================

class TriggerCompileView(views.APIView):
    """
    Endpoint لإرسال أمر الترجمة (Compilation) إلى الخلفية.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id):
        # 1. التحقق من أن المشروع يخص المستخدم الحالي
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found or you don't have access"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 2. إنشاء سجل Job في قاعدة البيانات لتتبع الحالة
        job = CompileJob.objects.create(
            project=project,
            triggered_by=request.user
        )
        
        # 3. إرسال المهمة إلى Celery Worker (في الخلفية)
        # نستخدم .delay() لكي لا يتوقف السيرفر عن العمل أثناء الانتظار
        compile_latex_to_pdf.delay(job.id)
        
        return Response(
            {"job_id": job.id, "status": "QUEUED"}, 
            status=status.HTTP_202_ACCEPTED
        )