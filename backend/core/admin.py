from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Project, ProjectFile, CompileJob ,LaTeXTemplate

# 1. تسجيل موديل المستخدم المخصص
# نستخدم UserAdmin الافتراضي لأنه يوفر واجهة تغيير كلمة المرور والصلاحيات جاهزة
admin.site.register(User, UserAdmin)

# 2. إعداد لوحة تحكم المشاريع
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    # الأعمدة التي تظهر في الجدول
    list_display = ('name', 'owner', 'is_public', 'created_at')
    # حقول البحث (يمكنك البحث باسم المشروع أو اسم المالك)
    search_fields = ('name', 'owner__username', 'description')
    # فلاتر جانبية (لفرز المشاريع العامة/الخاصة أو حسب التاريخ)
    list_filter = ('is_public', 'created_at')
    # ترتيب العرض (الأحدث أولاً)
    ordering = ('-created_at',)

# 3. إعداد لوحة تحكم الملفات
@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    list_display = ('path', 'project', 'is_binary', 'updated_at')
    # تحسين الأداء: عند اختيار المشروع، لا تقم بتحميل كل المشاريع دفعة واحدة
    autocomplete_fields = ['project']
    list_filter = ('is_binary',)
    search_fields = ('path', 'project__name')

# 4. إعداد لوحة تحكم وظائف الترجمة (Compilation Jobs)
@admin.register(CompileJob)
class CompileJobAdmin(admin.ModelAdmin):
    list_display = ('short_id', 'project', 'triggered_by', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    # نجعل السجلات للقراءة فقط لمنع التلاعب بها يدوياً
    readonly_fields = ('logs', 'pdf_url', 'created_at')
    
    # دالة صغيرة لعرض جزء من الـ UUID بدلاً من عرضه كاملاً
    def short_id(self, obj):
        return str(obj.id)[:8]
    short_id.short_description = 'Job ID'

# configration of latex templates
@admin.register(LaTeXTemplate)
class LaTeXTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'usage_count', 'rating', 'is_active', 'created_at')
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('usage_count', 'created_at', 'updated_at')
    
    fieldsets = (
        ('معلومات أساسية', {
            'fields': ('name', 'slug', 'category', 'description')
        }),
        ('إعدادات LaTeX', {
            'fields': ('latex_file_name', 'schema_class_name')
        }),
        ('المعاينة', {
            'fields': ('preview_image',)
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',)
        }),
        ('إحصائيات', {
            'fields': ('usage_count', 'rating', 'is_active', 'created_at', 'updated_at')
        }),
    )