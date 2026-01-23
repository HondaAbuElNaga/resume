import openai
from typing import Type, Dict, Any
from pydantic import BaseModel
from django.conf import settings

class OpenAIService:
    """
    خدمة لاستخراج بيانات السيرة الذاتية من Prompt باستخدام OpenAI
    """
    
    def __init__(self):
        # استخدم API Key من Settings
        self.client = openai.OpenAI(
            api_key=getattr(settings, 'OPENAI_API_KEY', None)
        )
    
    def extract_cv_data(
        self,
        user_prompt: str,
        schema: Type[BaseModel],
        language: str = 'ar'
    ) -> BaseModel:
        """
        استخراج بيانات السيرة الذاتية من Prompt المستخدم (وضع الكتابة/التأليف)
        """
        system_prompt = self._build_system_prompt(schema, language)
        
        try:
            completion = self.client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format=schema,
                temperature=0.3  # إبداع بسيط لتحسين الصياغة
            )
            
            return completion.choices[0].message.parsed
            
        except Exception as e:
            raise Exception(f"OpenAI API Error: {str(e)}")
    
    def parse_resume_text(self, resume_text: str, schema: Type[BaseModel]) -> BaseModel:
        """
        ✅ استخراج البيانات من نص PDF (وضع التحليل الصارم)
        """
        system_prompt = """
        You are a precise Data Extraction Expert.
        Your task is to extract structured data from the provided Resume/CV text.
        
        Rules:
        1. Extract data EXACTLY as it appears. Do not invent or hallucinate information.
        2. Map the data strictly to the provided JSON Schema.
        3. If a field is missing in the text, leave it as null or empty list.
        4. Detect the language of the resume automatically.
        5. For 'skills', try to categorize them if possible, otherwise put them in a 'General' category.
        """

        try:
            completion = self.client.beta.chat.completions.parse(
                model="gpt-4o-mini", 
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Resume Text:\n{resume_text[:10000]}"}
                ],
                response_format=schema,
                temperature=0.0  # صفر إبداع = دقة نقل 100%
            )
            
            return completion.choices[0].message.parsed
            
        except Exception as e:
            raise Exception(f"Resume Parsing Error: {str(e)}")

    def _build_system_prompt(self, schema: Type[BaseModel], language: str) -> str:
        """
        بناء System Prompt قوي للحصول على أفضل نتائج في التوليد
        """
        lang_map = {
            'ar': 'العربية',
            'en': 'الإنجليزية'
        }
        
        prompt = f"""
أنت خبير دولي في صياغة السير الذاتية (Resume Expert) المتوافقة مع أنظمة الـ ATS.
مهمتك: تحويل مسودة المستخدم إلى سيرة ذاتية احترافية، مركزة على النتائج، ومناسبة لمجاله الوظيفي أيًا كان.

## القواعد الأساسية للصياغة لكل المهن:

### 1. الأسلوب والمنظور (Tone & Perspective):
- **ممنوع صيغة الغائب**: لا تستخدم "هو"، "لديه"، "يسعى".
- **استخدم الصيغة المباشرة**: ابدأ بالمسمى الوظيفي أو الفعل مباشرة (مثال: "محاسب قانوني.." بدل "هو يعمل كمحاسب").
- **تجنب العبارات الإنشائية**: بدلاً من "شخص مجتهد يحب العمل"، ركز على "محترف مخصص لتحقيق أهداف المؤسسة من خلال [مهارة معينة]".

### 2. الملخص المهني (Professional Summary):
- اجعل الصياغة قوية ومكثفة (2-4 جمل).
- الهيكل: [المسمى الوظيفي] + [عدد سنوات الخبرة] + [أبرز التخصصات/المهارات] + [القيمة التي تضيفها للشركة].

### 3. الخبرات والمسؤوليات (Experience):
- ابدأ كل نقطة (Bullet Point) بـ **فعل حركة قوي** (Action Verb).
- ركز على **الإنجازات** وليس فقط المهام الروتينية.

### 4. المهارات (Skills):
- المصطلحات التقنية بالإنجليزية.
- المهارات الناعمة بلغة الـ CV ({lang_map.get(language, 'العربية')}).

### 5. القواعد العامة:
- حافظ على الدقة الإملائية.
- لا تخترع بيانات واترك الحقول الفارغة null.
- نسق التواريخ بصيغة: "MMM YYYY - MMM YYYY".

الآن، استخرج البيانات من نص المستخدم وصغها باحترافية تامة وفقاً للـ Schema.
"""
        return prompt.strip()
    
    def check_missing_fields(self, cv_data: BaseModel) -> Dict[str, Any]:
        """
        فحص الحقول الناقصة لإعلام المستخدم
        """
        missing = []
        warnings = []
        
        if hasattr(cv_data, 'contact'):
            contact = cv_data.contact
            if not contact.email: missing.append('البريد الإلكتروني')
            if not contact.phone: missing.append('رقم الهاتف')
        
        if hasattr(cv_data, 'experience') and not cv_data.experience:
            warnings.append('لا توجد خبرات عملية')
        
        if hasattr(cv_data, 'projects') and not cv_data.projects:
            warnings.append('لا توجد مشاريع')
        
        return {
            'missing_critical': missing,
            'warnings': warnings
        }