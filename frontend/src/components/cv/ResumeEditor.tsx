"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react"; 



interface ContactInfo {
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  location?: string;
}

interface EducationEntry {
  degree: string;
  institution: string;
  date_range?: string; // ✅ Correct naming instead of graduation_date
  location?: string;
  gpa?: string;
  details?: string[];
}

interface WorkExperienceEntry {
  role: string;      
  company: string;
  date_range?: string; 
  location?: string;
  responsibilities: string[];
}

interface ProjectEntry {
  name: string;
  description?: string;
  technologies?: string[];
  details?: string[];
}

interface SkillCategory {
  category_name: string;
  skills: string[];
}


interface CVData {
  full_name: string;
  professional_summary: string;
  contact: ContactInfo;
  education: EducationEntry[];
  experience: WorkExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillCategory[];
}

interface ResumeEditorProps {
  resume: CVData;
  onSave: (data: CVData) => void;
  isSaving: boolean;
}

export default function ResumeEditor({ resume, onSave, isSaving }: ResumeEditorProps) {
  const [formData, setFormData] = useState<CVData | null>(null);

  // تحديث البيانات عند تحميل الصفحة
  useEffect(() => {
    if (resume) {
      
      setFormData({
        ...resume,
        education: resume.education || [],
        experience: resume.experience || [],
        projects: resume.projects || [],
        skills: resume.skills || [],
        contact: resume.contact || {}
      });
    }
  }, [resume]);

  if (!formData) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  // --- دوال التحديث العامة ---
  
  const handleChange = (field: keyof CVData, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleContactChange = (field: keyof ContactInfo, value: string) => {
    setFormData(prev => prev ? ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }) : null);
  };

  // --- دوال تحديث المصفوفات ---

  const updateExperience = (index: number, field: keyof WorkExperienceEntry, value: any) => {
    if (!formData) return;
    const newExp = [...formData.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    handleChange('experience', newExp);
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: any) => {
    if (!formData) return;
    const newEdu = [...formData.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    handleChange('education', newEdu);
  };

  const updateSkill = (index: number, field: keyof SkillCategory, value: any) => {
    if (!formData) return;
    const newSkills = [...formData.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    handleChange('skills', newSkills);
  };

  return (
    <div className="space-y-8 font-['Tajawal'] text-right" dir="rtl">
      
      {/* 1. المعلومات الشخصية */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold border-b pb-2">المعلومات الشخصية</h3>
        <div>
            <label className="block text-sm font-medium mb-1">الاسم بالكامل</label>
            <input
              type="text"
              value={formData.full_name || ''}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الملخص المهني</label>
          <textarea
            rows={4}
            value={formData.professional_summary || ''}
            onChange={(e) => handleChange('professional_summary', e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </section>

      {/* 2. معلومات الاتصال */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold border-b pb-2">معلومات الاتصال</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="البريد الإلكتروني"
            value={formData.contact?.email || ''}
            onChange={(e) => handleContactChange('email', e.target.value)}
            className="p-2 border rounded-lg"
          />
          <input
            placeholder="رقم الهاتف"
            value={formData.contact?.phone || ''}
            onChange={(e) => handleContactChange('phone', e.target.value)}
            className="p-2 border rounded-lg"
          />
          <input
            placeholder="الموقع (المدينة، الدولة)"
            value={formData.contact?.location || ''}
            onChange={(e) => handleContactChange('location', e.target.value)}
            className="p-2 border rounded-lg"
          />
          <input
            placeholder="رابط LinkedIn"
            value={formData.contact?.linkedin || ''}
            onChange={(e) => handleContactChange('linkedin', e.target.value)}
            className="p-2 border rounded-lg"
          />
        </div>
      </section>

      {/* 3. الخبرات العملية */}
      <section className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
           <h3 className="text-xl font-bold">الخبرات العملية</h3>
           <button 
             onClick={() => handleChange('experience', [...formData.experience, { role: '', company: '', responsibilities: [] }])}
             className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100 flex items-center gap-1"
           >
             <Plus size={16} /> إضافة
           </button>
        </div>
        
        {formData.experience.map((exp, idx) => (
          <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 relative group">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <input
                 placeholder="المسمى الوظيفي (Role)"
                 value={exp.role || ''}
                 onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                 className="p-2 border rounded"
               />
               <input
                 placeholder="اسم الشركة"
                 value={exp.company || ''}
                 onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                 className="p-2 border rounded"
               />
               <input
                 placeholder="الفترة (مثال: 2020 - 2022)"
                 value={exp.date_range || ''} 
                 onChange={(e) => updateExperience(idx, 'date_range', e.target.value)}
                 className="p-2 border rounded"
               />
               <input
                 placeholder="الموقع"
                 value={exp.location || ''}
                 onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                 className="p-2 border rounded"
               />
             </div>
             
             <div>
               <label className="text-xs font-bold text-gray-500 mb-1 block">المسؤوليات (كل سطر مسؤولية)</label>
               <textarea
                 rows={3}
                 // نقوم بدمج المصفوفة لنص واحد للتعديل
                 value={Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n') : ''}
                 // عند التعديل، نقسم النص ليعود مصفوفة
                 onChange={(e) => updateExperience(idx, 'responsibilities', e.target.value.split('\n'))}
                 className="w-full p-2 border rounded text-sm"
                 placeholder="اكتب كل مسؤولية في سطر منفصل..."
               />
             </div>

             <button 
               onClick={() => {
                 const newExp = formData.experience.filter((_, i) => i !== idx);
                 handleChange('experience', newExp);
               }}
               className="text-red-500 text-xs flex items-center gap-1 hover:underline mt-2"
             >
               <Trash2 size={14} /> حذف الخبرة
             </button>
          </div>
        ))}
      </section>

      {/* 4. التعليم */}
      <section className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
           <h3 className="text-xl font-bold">التعليم</h3>
           <button 
             onClick={() => handleChange('education', [...formData.education, { degree: '', institution: '' }])}
             className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100 flex items-center gap-1"
           >
             <Plus size={16} /> إضافة
           </button>
        </div>
        
        {formData.education.map((edu, idx) => (
          <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <input
                 placeholder="الدرجة العلمية"
                 value={edu.degree || ''}
                 onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                 className="p-2 border rounded"
               />
               <input
                 placeholder="الجامعة / المؤسسة"
                 value={edu.institution || ''}
                 onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                 className="p-2 border rounded"
               />
               <input
                 placeholder="فترة الدراسة"
                 value={edu.date_range || ''} 
                 onChange={(e) => updateEducation(idx, 'date_range', e.target.value)}
                 className="p-2 border rounded"
               />
               <input
                 placeholder="المعدل (GPA)"
                 value={edu.gpa || ''}
                 onChange={(e) => updateEducation(idx, 'gpa', e.target.value)}
                 className="p-2 border rounded"
               />
             </div>
             <button 
               onClick={() => {
                 const newEdu = formData.education.filter((_, i) => i !== idx);
                 handleChange('education', newEdu);
               }}
               className="text-red-500 text-xs flex items-center gap-1 hover:underline"
             >
               <Trash2 size={14} /> حذف
             </button>
          </div>
        ))}
      </section>

      {/* 5. المهارات */}
      <section className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-xl font-bold">المهارات</h3>
            <button 
             onClick={() => handleChange('skills', [...formData.skills, { category_name: '', skills: [] }])}
             className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100 flex items-center gap-1"
           >
             <Plus size={16} /> إضافة فئة
           </button>
        </div>
        
        {formData.skills.map((cat, idx) => (
          <div key={idx} className="flex gap-2 items-start group relative">
             <input
               className="w-1/3 p-2 border rounded bg-gray-50 font-bold"
               value={cat.category_name || ''}
               onChange={(e) => updateSkill(idx, 'category_name', e.target.value)}
               placeholder="فئة (مثل: لغات البرمجة)"
             />
             <input
               className="w-2/3 p-2 border rounded"
               value={Array.isArray(cat.skills) ? cat.skills.join(', ') : ''}
               onChange={(e) => updateSkill(idx, 'skills', e.target.value.split(',').map(s => s.trim()))}
               placeholder="افصل بين المهارات بفاصلة (,)"
             />
              <button 
               onClick={() => {
                 const newSkills = formData.skills.filter((_, i) => i !== idx);
                 handleChange('skills', newSkills);
               }}
               className="absolute left-[-30px] top-2 text-red-500 hover:text-red-700"
               title="حذف الفئة"
             >
               <Trash2 size={16} />
             </button>
          </div>
        ))}
      </section>

      {/* زر الحفظ العائم */}
      <div className="sticky bottom-4 bg-white p-4 shadow-xl border-t rounded-2xl flex justify-between items-center z-10">
         <span className="text-sm text-gray-500">
            {isSaving ? "جاري الحفظ والتوليد..." : "تم إجراء تعديلات غير محفوظة"}
         </span>
         <button
           onClick={() => onSave(formData)}
           disabled={isSaving}
           className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-gray-200 flex items-center gap-2"
         >
           {isSaving && <Loader2 className="animate-spin" size={18} />}
           {isSaving ? "جاري المعالجة..." : "حفظ وتحديث الـ PDF"}
         </button>
      </div>

    </div>
  );
}