from typing import List, Optional
from pydantic import BaseModel, Field

class ContactInfo(BaseModel):
    """معلومات الاتصال"""
    email: Optional[str] = Field(None, description="البريد الإلكتروني")
    phone: Optional[str] = Field(None, description="رقم الهاتف")
    linkedin: Optional[str] = Field(None, description="رابط LinkedIn")
    github: Optional[str] = Field(None, description="رابط GitHub")
    location: Optional[str] = Field(None, description="الموقع (المدينة، الدولة)")

class EducationEntry(BaseModel):
    """التعليم"""
    degree: str = Field(..., description="الدرجة العلمية")
    institution: str = Field(..., description="اسم الجامعة/المؤسسة")
    date_range: Optional[str] = Field(None, description="الفترة الزمنية")
    location: Optional[str] = Field(None, description="الموقع")
    gpa: Optional[str] = Field(None, description="المعدل")
    details: List[str] = Field(default_factory=list, description="تفاصيل إضافية")

class WorkExperienceEntry(BaseModel):
    """الخبرة العملية"""
    role: str = Field(..., description="المسمى الوظيفي")
    company: str = Field(..., description="اسم الشركة")
    date_range: Optional[str] = Field(None, description="الفترة الزمنية")
    location: Optional[str] = Field(None, description="الموقع")
    responsibilities: List[str] = Field(
        default_factory=list, 
        description="المسؤوليات والإنجازات"
    )

class ProjectEntry(BaseModel):
    """المشاريع"""
    name: str = Field(..., description="اسم المشروع")
    description: Optional[str] = Field(None, description="وصف المشروع")
    technologies: List[str] = Field(
        default_factory=list, 
        description="التقنيات المستخدمة (بالإنجليزي)"
    )
    details: List[str] = Field(default_factory=list, description="تفاصيل المشروع")

class SkillCategory(BaseModel):
    """فئة المهارات"""
    category_name: str = Field(..., description="اسم الفئة (عربي)")
    skills: List[str] = Field(
        ..., 
        description="قائمة المهارات (بالإنجليزي، مفصولة بفواصل)"
    )

class ResponsibilityEntry(BaseModel):
    """المسؤوليات والأنشطة"""
    title: str = Field(..., description="العنوان/المنصب")
    organization: str = Field(..., description="المنظمة/الجهة")
    date_range: Optional[str] = Field(None, description="الفترة الزمنية")
    location: Optional[str] = Field(None, description="الموقع")
    details: List[str] = Field(default_factory=list, description="التفاصيل")