from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path
from typing import Dict, Any
import re

class LaTeXService:
    """
    خدمة لملء قوالب LaTeX باستخدام Jinja2
    """
    
    def __init__(self):
        # مسار مجلد Templates
        template_dir = Path(__file__).parent.parent / 'latex_templates'
        
        # إنشاء Jinja2 Environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=False,  # مهم: لا نريد HTML escaping
            trim_blocks=True,
            lstrip_blocks=True,
            comment_start_string='<#', 
            comment_end_string='#>'
        )
        
        # إضافة Custom Filters
        self.jinja_env.filters['escape_latex'] = self.escape_latex_chars
        self.jinja_env.filters['format_date'] = self.format_date_range
    
    def render_template(
        self, 
        template_filename: str, 
        cv_data: Dict[str, Any]
    ) -> str:
        """
        ملء قالب LaTeX بالبيانات
        
        Args:
            template_filename: اسم ملف القالب (مثل: classic_arabic_v1.tex)
            cv_data: بيانات السيرة الذاتية (dict)
        
        Returns:
            محتوى LaTeX الكامل جاهز للتحويل لـ PDF
        """
        try:
            template = self.jinja_env.get_template(template_filename)
            latex_content = template.render(**cv_data)
            return latex_content
            
        except Exception as e:
            raise Exception(f"Template rendering error: {str(e)}")
    
    def render_latex(self, template_name: str, data: Dict[str, Any]) -> str:
        """
        Alias for render_template (for compatibility with cv_views.py)
        """
        return self.render_template(template_name, data)
    
    def get_schema_class(self, schema_class_name: str):
        """
        Get schema class by name
        
        Args:
            schema_class_name: Name of schema class (e.g., 'ClassicArabicCVSchema')
        
        Returns:
            Schema class for validation
        """
        from core.schemas import get_schema_by_name
        return get_schema_by_name(schema_class_name)
    
    def get_arabic_font_path(self) -> str:
        """
        Get path to Arabic font file
        
        Returns:
            Path to font file or None if not found
        """
        base_path = Path(__file__).resolve().parent.parent
        font_path = base_path / 'latex_templates' / 'Tajawal-Medium 500.ttf'  
        if font_path.exists():
            return str(font_path)

    
    @staticmethod
    def escape_latex_chars(text: str) -> str:
        """
        معالجة الأحرف الخاصة في LaTeX
        
        الأحرف الخاصة في LaTeX: & % $ # _ { } ~ ^ \
        """
        if not text:
            return ""
        
        # تحويل النص لـ string (لو كان int أو float)
        text = str(text)
        
        # الأحرف التي تحتاج escape
        replacements = {
            '\\': r'\textbackslash{}',  # يجب أن يكون الأول
            '&': r'\&',
            '%': r'\%',
            '$': r'\$',
            '#': r'\#',
            '_': r'\_',
            '{': r'\{',
            '}': r'\}',
            '~': r'\textasciitilde{}',
            '^': r'\textasciicircum{}',
        }
        
        for char, replacement in replacements.items():
            text = text.replace(char, replacement)
        
        return text
    
    @staticmethod
    def format_date_range(date_str: str) -> str:
        """
        تنسيق نطاق التاريخ (اختياري - للتحسين المستقبلي)
        """
        if not date_str:
            return ""
        
        # تنظيف المسافات الزائدة
        date_str = date_str.strip()
        
        # استبدال "حتى الآن" بـ "Present"
        date_str = re.sub(
            r'(حتى الآن|الآن|حالياً|حاليا)', 
            'Present', 
            date_str, 
            flags=re.IGNORECASE
        )
        
        return date_str
    
    def validate_template_exists(self, template_filename: str) -> bool:
        """
        التحقق من وجود Template
        """
        template_path = Path(__file__).parent.parent / 'latex_templates' / template_filename
        return template_path.exists()