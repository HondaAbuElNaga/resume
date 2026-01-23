from typing import List, Optional
from pydantic import BaseModel, Field
from .base import (
    ContactInfo, 
    EducationEntry, 
    WorkExperienceEntry, 
    ProjectEntry,
    SkillCategory,
    ResponsibilityEntry
)

class ClassicArabicCVSchema(BaseModel):
    """
    Schema للقالب الكلاسيكي العربي
    يحتوي على: Header, Summary, Education, Projects, Experience, Skills, Responsibilities
    """
    
    # المعلومات الأساسية
    full_name: str = Field(..., description="الاسم الكامل بالعربي")
    
    # معلومات الاتصال
    contact: ContactInfo = Field(..., description="بيانات الاتصال")
    
    # الملخص المهني (إجباري في القالب الكلاسيكي)
    professional_summary: str = Field(
        ..., 
        description="ملخص احترافي 3-4 أسطر. إذا لم يُقدّم، يجب توليده من الخبرات والمهارات"
    )
    
    # التعليم
    education: List[EducationEntry] = Field(
        ..., 
        min_items=1,
        description="قائمة المؤهلات الدراسية (على الأقل واحد)"
    )
    
    # المشاريع
    projects: List[ProjectEntry] = Field(
        default_factory=list,
        description="المشاريع الشخصية أو الأكاديمية"
    )
    
    # الخبرة العملية
    experience: List[WorkExperienceEntry] = Field(
        default_factory=list,
        description="الخبرات العملية والتدريبات"
    )
    
    # المهارات
    skills: List[SkillCategory] = Field(
        ...,
        min_items=1,
        description="المهارات مقسمة حسب الفئات (لغات البرمجة، الأدوات، إلخ)"
    )
    
    # المسؤوليات والأنشطة
    responsibilities: List[ResponsibilityEntry] = Field(
        default_factory=list,
        description="المناصب القيادية أو الأنشطة التطوعية"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "محمد يحيى",
                "contact": {
                    "email": "mohamed@example.com",
                    "phone": "+966-xxx-xxx-xxxx",
                    "linkedin": "https://linkedin.com/in/mohamed",
                    "location": "الرياض، السعودية"
                },
                "professional_summary": "مهندس ذكاء اصطناعي بخبرة 3 سنوات...",
                "education": [{
                    "degree": "بكالوريوس هندسة حاسبات",
                    "institution": "جامعة الملك سعود",
                    "date_range": "2018 - 2022",
                    "gpa": "4.5/5.0"
                }],
                "skills": [{
                    "category_name": "لغات البرمجة",
                    "skills": ["Python", "JavaScript", "C++"]
                }]
            }
        }