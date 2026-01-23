"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// --- Types & Interfaces ---

// واجهة البيانات كما يتوقعها الـ Backend (مطابقة لملف models.py & schemas)
interface BackendSkillCategory {
  category_name: string;
  skills: string[];
}

interface BackendResponsibility {
  title: string;
  organization: string;
  date_range?: string;
  location?: string;
  details: string[];
}

// واجهة البيانات في الواجهة الأمامية (Frontend State)
export interface Resume {
  id?: string;
  full_name: string;
  contact: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    location?: string;
  };
  professional_summary?: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  // نستخدم المسميات المتوافقة مع الـ UI
  skills: SkillsSummary; 
  volunteer_experience: VolunteerItem[]; 
  // أقسام إضافية (يتم تخزينها في الـ Frontend حالياً، وقد تحتاج تحديث Backend لدعمها)
  research?: any[]; 
  publications?: any[];
  awards?: any[];
  languages_list?: any[]; // لمنع التضارب مع skills.languages
  courses?: any[];
}

export interface ExperienceItem {
  company: string;
  position: string;
  location?: string;
  start_date: string;
  end_date?: string;
  achievements: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  graduation_date: string;
  gpa?: string;
  location?: string;
}

export interface ProjectItem {
  title: string; // name in backend
  description?: string;
  technologies: string[];
  date?: string;
}

export interface SkillsSummary {
  languages?: string[]; // Technical Languages
  frameworks?: string[]; // Spoken Languages in UI or Frameworks? UI says "Spoken Languages"
  tools?: string[];
  platforms?: string[];
  soft_skills?: string[];
}

export interface VolunteerItem {
  organization: string;
  role: string;
  start_date: string;
  end_date: string;
  description: string;
}

type SectionType = "personal" | "experience" | "education" | "skills" | "projects" | "volunteer" | "research" | "publications" | "awards" | "languages" | "courses";

interface AdditionalSection {
  id: SectionType;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  description: string;
}

// --- Helpers & Mappers ---

// تحويل المهارات من صيغة الباك اند (قائمة فئات) إلى صيغة الواجهة (كائن محدد)
const mapBackendSkillsToFrontend = (backendSkills: BackendSkillCategory[] = []): SkillsSummary => {
  const summary: SkillsSummary = {
    languages: [],
    frameworks: [],
    tools: [],
    platforms: [],
    soft_skills: []
  };

  backendSkills.forEach(cat => {
    // محاولة تخمين الفئة بناءً على الاسم
    const name = cat.category_name.toLowerCase();
    if (name.includes('لغات') || name.includes('languages') || name.includes('technologies')) {
        summary.languages = [...(summary.languages || []), ...cat.skills];
    } else if (name.includes('أدوات') || name.includes('tools')) {
        summary.tools = [...(summary.tools || []), ...cat.skills];
    } else if (name.includes('شخصية') || name.includes('soft')) {
        summary.soft_skills = [...(summary.soft_skills || []), ...cat.skills];
    } else if (name.includes('شهادات') || name.includes('cert')) {
        summary.platforms = [...(summary.platforms || []), ...cat.skills];
    } else {
        // الافتراضي نضعه في اللغات التقنية
        summary.languages = [...(summary.languages || []), ...cat.skills];
    }
  });
  return summary;
};

// تحويل المهارات من الواجهة إلى الباك اند
const mapFrontendSkillsToBackend = (summary: SkillsSummary): BackendSkillCategory[] => {
  const categories: BackendSkillCategory[] = [];
  if (summary.languages?.length) categories.push({ category_name: "المهارات التقنية", skills: summary.languages });
  if (summary.tools?.length) categories.push({ category_name: "الأدوات والبرامج", skills: summary.tools });
  if (summary.soft_skills?.length) categories.push({ category_name: "المهارات الشخصية", skills: summary.soft_skills });
  if (summary.platforms?.length) categories.push({ category_name: "الشهادات", skills: summary.platforms });
  // Spoken languages handled separately or put here
  if (summary.frameworks?.length) categories.push({ category_name: "اللغات", skills: summary.frameworks }); 
  
  return categories;
};

// تحويل المسؤوليات (Backend) إلى تطوع (Frontend)
const mapBackendRespToVolunteer = (resps: BackendResponsibility[] = []): VolunteerItem[] => {
  return resps.map(r => {
    // محاولة فصل التاريخ
    const dates = r.date_range ? r.date_range.split(' - ') : ['', ''];
    return {
      organization: r.organization,
      role: r.title,
      start_date: dates[0] || '',
      end_date: dates[1] || '',
      description: r.details?.[0] || '' // نأخذ أول عنصر كوصف
    };
  });
};

// تحويل التطوع إلى مسؤوليات
const mapVolunteerToBackendResp = (vols: VolunteerItem[]): BackendResponsibility[] => {
  return vols.map(v => ({
    title: v.role,
    organization: v.organization,
    date_range: `${v.start_date} - ${v.end_date}`,
    details: v.description ? [v.description] : []
  }));
};

// --- Main Component ---

export default function CVEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [currentJobId, setCurrentJobId] = useState<string>((params.id as string) || (params.jobId as string));

  // --- State for Editor Logic ---
  const [activeSection, setActiveSection] = useState<SectionType>("personal");
  const [enabledSections, setEnabledSections] = useState<SectionType[]>([]);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const addSectionRef = useRef<HTMLDivElement>(null);
  
  // الحالة المحلية للبيانات (يتم تحديثها عند الجلب من الـ API)
  const [resumeData, setResumeData] = useState<Resume | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  // --- API Queries ---
  
  const { data: fullResponse, isLoading, isError } = useQuery({
    queryKey: ['cv-data', currentJobId],
    queryFn: async () => {
      // ✅ Fetch the FULL response object
      const res = await api.get(`/get-cv-data/${currentJobId}/`);
      return res.data;
    },
    enabled: !!currentJobId,
    refetchOnWindowFocus: false,
  });

  // Sync Fetched Data to Local State & Determine Enabled Sections
  useEffect(() => {
    if (fullResponse && fullResponse.cv_data) {
      const fetchedData = fullResponse.cv_data;

      // ✅ Update PDF URL from the root response or job object
      // (Adjust based on your exact API response structure)
      if (fullResponse.pdf_url) {
        setPdfUrl(fullResponse.pdf_url);
      } else if (fullResponse.job && fullResponse.job.pdf_url) {
        setPdfUrl(fullResponse.job.pdf_url);
      }
      // 1. Transform Backend Data to Frontend Interface
      const mappedResume: Resume = {
        full_name: fetchedData.full_name || "",
        contact: fetchedData.contact || {},
        experience: fetchedData.experience || [],
        education: fetchedData.education || [],
        projects: (fetchedData.projects || []).map((p: any) => ({
            title: p.name, // backend uses 'name'
            description: p.description,
            technologies: p.technologies,
            date: p.details?.[0] // trying to extract date if stored in details
        })),
        skills: mapBackendSkillsToFrontend(fetchedData.skills),
        volunteer_experience: mapBackendRespToVolunteer(fetchedData.responsibilities),
        // Other fields might be empty initially
      };

      setResumeData(mappedResume);

      // 2. Determine Enabled Sections Dynamically
      const active: SectionType[] = [];
      if (mappedResume.experience?.length > 0) active.push("experience");
      if (mappedResume.education?.length > 0) active.push("education");
      if (mappedResume.projects?.length > 0) active.push("projects");
      if (mappedResume.volunteer_experience?.length > 0) active.push("volunteer");
      // Always have skills?
      active.push("skills");

      setEnabledSections(prev => Array.from(new Set([...prev, ...active])));
    }
  }, [fullResponse]);


  // --- Mutations ---

  const saveMutation = useMutation({
    mutationFn: async (updatedResume: Resume) => {
      // Transform back to Backend Schema
      const payload = {
        full_name: updatedResume.full_name,
        contact: updatedResume.contact,
        professional_summary: "Generated Summary...", // Or from state if added
        experience: updatedResume.experience,
        education: updatedResume.education,
        projects: updatedResume.projects.map(p => ({
            name: p.title,
            description: p.description,
            technologies: p.technologies,
            details: p.date ? [p.date] : []
        })),
        skills: mapFrontendSkillsToBackend(updatedResume.skills),
        responsibilities: mapVolunteerToBackendResp(updatedResume.volunteer_experience),
        // Note: publications, awards, etc. will be ignored by backend unless schema is updated
      };

      const res = await api.post('/update-cv-data/', { 
        job_id: currentJobId, 
        cv_data: payload 
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("تم حفظ التعديلات!");
      if (data.job_id) {
        setCurrentJobId(data.job_id);
        window.history.replaceState(null, '', `/cv-editor/${data.job_id}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "حدث خطأ أثناء الحفظ");
    }
  });

  const handleSave = useCallback(() => {
    if (resumeData) {
      saveMutation.mutate(resumeData);
    }
  }, [resumeData, saveMutation]);


  // --- Editor Logic (Add/Remove Sections) ---

  const updateField = useCallback((field: keyof Resume, value: unknown) => {
    setResumeData(prev => prev ? ({ ...prev, [field]: value }) : null);
  }, []);

  const addSection = (sectionId: SectionType) => {
    if (!enabledSections.includes(sectionId)) {
      setEnabledSections([...enabledSections, sectionId]);
      setActiveSection(sectionId);
    }
    setIsAddSectionOpen(false);
  };

  const removeSection = (sectionId: SectionType) => {
    setEnabledSections(enabledSections.filter(s => s !== sectionId));
    if (activeSection === sectionId) {
      setActiveSection("personal");
    }
  };

  // Close dropdown logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addSectionRef.current && !addSectionRef.current.contains(event.target as Node)) {
        setIsAddSectionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // --- Loading & Error States ---

  if (isLoading || !resumeData) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-black w-12 h-12" />
        <p className="text-gray-500 font-medium">جاري تحميل بيانات السيرة الذاتية...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500 font-bold">
        عذراً، لم نتمكن من العثور على السيرة الذاتية المطلوبة.
      </div>
    );
  }

  // --- Configuration ---

  const baseSections: { id: SectionType; label: string; icon: React.ReactNode }[] = [
    { id: "personal", label: "المعلومات الشخصية", icon: <UserIcon /> },
    { id: "experience", label: "الخبرات العملية", icon: <BriefcaseIcon /> },
    { id: "education", label: "التعليم", icon: <AcademicIcon /> },
    { id: "skills", label: "المهارات", icon: <SkillsIcon /> },
    { id: "projects", label: "المشاريع", icon: <ProjectIcon /> },
  ];

  const additionalSections: AdditionalSection[] = [
    { id: "volunteer", label: "العمل التطوعي", labelEn: "Volunteering", icon: <HeartIcon />, description: "أضف خبراتك التطوعية وخدمة المجتمع" },
    { id: "research", label: "الأبحاث", labelEn: "Research", icon: <ResearchIcon />, description: "أضف أبحاثك العلمية والأكاديمية" },
    { id: "publications", label: "المنشورات", labelEn: "Publications", icon: <PublicationIcon />, description: "أضف مقالاتك ومنشوراتك" },
    { id: "awards", label: "الجوائز والإنجازات", labelEn: "Awards", icon: <AwardIcon />, description: "أضف جوائزك وإنجازاتك البارزة" },
    { id: "languages", label: "اللغات", labelEn: "Languages", icon: <LanguageIcon />, description: "أضف اللغات التي تتحدثها ومستواك فيها" },
    { id: "courses", label: "الدورات التدريبية", labelEn: "Courses", icon: <CourseIcon />, description: "أضف الدورات والتدريبات التي حصلت عليها" },
  ];

  // Combine visible sections (Base + Enabled Additional)
  // Note: We check if base sections are enabled or always show them.
  // Requirement: "sections increase and decrease dynamically". 
  // We will assume base sections are always available but "enabled" logic applies to optional ones mostly, 
  // OR we filter everything by `enabledSections` if we want full dynamism.
  // For better UX, we'll Keep Base Sections ALWAYS Visible, and only optional ones toggle.
  const visibleSections = [
    ...baseSections, 
    ...additionalSections.filter(s => enabledSections.includes(s.id)).map(s => ({ id: s.id, label: s.label, icon: s.icon }))
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* Top action bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[65px] z-40">
        <div className="max-w-[1800px] mx-auto px-3 py-2 flex items-center justify-between" dir="rtl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              title="العودة"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700" style={{ fontFamily: "'Zain', sans-serif" }}>
              تعديل السيرة الذاتية (ID: {currentJobId.slice(0, 8)})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saveMutation.isPending} className="px-3 py-1.5 bg-black text-white rounded-md text-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center gap-1.5" style={{ fontFamily: "'Zain', sans-serif" }}>
              {saveMutation.isPending ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
              حفظ
            </button>
            {/* ✅ Button to Open PDF if URL exists */}
            {pdfUrl && (
                <a href={pdfUrl} target="_blank" className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors flex items-center gap-1.5" style={{ fontFamily: "'Zain', sans-serif" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                PDF
                </a>
            )}
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="max-w-[1800px] mx-auto p-3">
        <div className="flex flex-row-reverse gap-3 h-[calc(100vh-160px)]">
          {/* Left side - PDF Preview */}
          <div className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between" dir="rtl">
              <h2 className="font-semibold" style={{ fontFamily: "'Zain', sans-serif" }}>معاينة السيرة الذاتية</h2>
            </div>
            {/* PdfPreview component integrated here. 
                We use an iframe or the PdfPreview component from previous code.
                For this file completeness, I'll use an iframe pointing to the PDF URL 
            */}
            <div className="flex-1 bg-gray-100 overflow-hidden relative">
                {pdfUrl ? (
                     <iframe 
                        src={`${pdfUrl}#toolbar=0`} 
                        className="w-full h-full"
                        title="PDF Preview"
                     />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                         {saveMutation.isPending ? (
                            <>
                                <Loader2 className="w-8 h-8 animate-spin text-black" />
                                <span style={{ fontFamily: "'Zain', sans-serif" }}>جاري إنشاء النسخة الجديدة...</span>
                            </>
                         ) : (
                             <span style={{ fontFamily: "'Zain', sans-serif" }}>جاري تجهيز المعاينة... تأكد من حفظ التعديلات</span>
                         )}
                    </div>
                )}
            </div>
          </div>

          {/* Right side - Editor */}
          <div className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col relative">
            {/* Section tabs */}
            <div className="border-b border-gray-200 overflow-x-auto overflow-y-visible custom-scrollbar">
              <div className="flex items-center" dir="rtl">
                {visibleSections.map((section) => (
                  <div key={section.id} className="relative group">
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeSection === section.id
                          ? "text-black border-b-2 border-black bg-gray-50"
                          : "text-gray-500 hover:text-black hover:bg-gray-50"
                      }`}
                      style={{ fontFamily: "'Zain', sans-serif" }}
                    >
                      {section.icon}
                      {section.label}
                    </button>
                    {/* Remove button for additional sections */}
                    {additionalSections.some(s => s.id === section.id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(section.id);
                        }}
                        className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                        title="إزالة القسم"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Add Section Button */}
                <div className="relative mr-2" ref={addSectionRef}>
                  <button
                    onClick={() => setIsAddSectionOpen(!isAddSectionOpen)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all rounded-lg mx-2 ${
                      isAddSectionOpen
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black"
                    }`}
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    <PlusIcon />
                    إضافة قسم
                  </button>
                </div>
              </div>
            </div>
            
            {/* Add Section Dropdown */}
            {isAddSectionOpen && (
              <div 
                className="absolute top-14 left-4 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100]" 
                dir="rtl"
                ref={addSectionRef}
              >
                <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <h3 className="font-semibold text-gray-900" style={{ fontFamily: "'Zain', sans-serif" }}>أقسام إضافية</h3>
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: "'Zain', sans-serif" }}>اختر الأقسام التي تريد إضافتها لسيرتك الذاتية</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {additionalSections.map((section) => {
                    const isEnabled = enabledSections.includes(section.id);
                    return (
                      <button
                        key={section.id}
                        onClick={() => !isEnabled && addSection(section.id)}
                        disabled={isEnabled}
                        className={`w-full px-4 py-3 flex items-start gap-3 transition-colors ${
                          isEnabled
                            ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className={`mt-0.5 ${isEnabled ? "text-green-500" : "text-gray-400"}`}>
                          {isEnabled ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            section.icon
                          )}
                        </div>
                        <div className="text-right flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>{section.label}</span>
                            <span className="text-xs text-gray-400">{section.labelEn}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "'Zain', sans-serif" }}>{section.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section content */}
            <div className="flex-1 overflow-auto p-6" dir="rtl">
              {activeSection === "personal" && (
                <PersonalSection
                  resume={resumeData}
                  onChange={(updates) => setResumeData(prev => prev ? ({ ...prev, ...updates }) : null)}
                />
              )}
              {activeSection === "experience" && (
                <ExperienceSection
                  experience={resumeData.experience}
                  onChange={(experience) => updateField("experience", experience)}
                />
              )}
              {activeSection === "education" && (
                <EducationSection
                  education={resumeData.education}
                  onChange={(education) => updateField("education", education)}
                />
              )}
              {activeSection === "skills" && (
                <SkillsSection
                  skills={resumeData.skills}
                  onChange={(skills) => updateField("skills", skills)}
                />
              )}
              {activeSection === "projects" && (
                <ProjectsSection
                  projects={resumeData.projects}
                  onChange={(projects) => updateField("projects", projects)}
                />
              )}
              {activeSection === "volunteer" && (
                <VolunteerSection
                  volunteer={resumeData.volunteer_experience || []}
                  onChange={(volunteer) => updateField("volunteer_experience", volunteer)}
                />
              )}
              
              {/* Optional Sections (Only Frontend state for now if backend doesn't support) */}
              {activeSection === "research" && <ResearchSection />}
              {activeSection === "publications" && (
                <PublicationsSection
                  publications={resumeData.publications || []}
                  onChange={(publications) => updateField("publications", publications)}
                />
              )}
              {activeSection === "awards" && (
                <AwardsSection
                  awards={resumeData.awards || []}
                  onChange={(awards) => updateField("awards", awards)}
                />
              )}
              {activeSection === "languages" && <LanguagesSection />}
              {activeSection === "courses" && <CoursesSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub Components (Same as your demo, just kept for completeness) ---

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

function MonthYearPicker({ 
  value, 
  onChange, 
  placeholder,
  allowPresent = false 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string;
  allowPresent?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isPresent, setIsPresent] = useState(value === "حالياً");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentYear = new Date().getFullYear();
  const currentDecadeStart = Math.floor(currentYear / 10) * 10;
  const [decadeStart, setDecadeStart] = useState(currentDecadeStart);

  useEffect(() => {
    if (value && value !== "حالياً") {
      const parts = value.split(" ");
      if (parts.length === 2) {
        const monthIndex = ARABIC_MONTHS.indexOf(parts[0]);
        const year = parseInt(parts[1]);
        if (monthIndex !== -1) setSelectedMonth(monthIndex);
        if (!isNaN(year)) {
          setSelectedYear(year);
          setDecadeStart(Math.floor(year / 10) * 10);
        }
      }
    } else if (value === "حالياً") {
      setIsPresent(true);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const decadeYears = Array.from({ length: 10 }, (_, i) => decadeStart + 9 - i);
  const minDecade = 1970;
  const maxDecade = currentDecadeStart;

  const goToPreviousDecade = () => { if (decadeStart > minDecade) setDecadeStart(decadeStart - 10); };
  const goToNextDecade = () => { if (decadeStart < maxDecade) setDecadeStart(decadeStart + 10); };

  const handleSelect = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setIsPresent(false);
    onChange(`${ARABIC_MONTHS[month]} ${year}`);
    setIsOpen(false);
  };

  const handlePresentClick = () => {
    setIsPresent(true);
    setSelectedMonth(null);
    setSelectedYear(null);
    onChange("حالياً");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-right flex items-center justify-between"
        style={{ fontFamily: "'Zain', sans-serif" }}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl right-0" dir="rtl">
          {allowPresent && (
            <button
              type="button"
              onClick={handlePresentClick}
              className={`w-full px-4 py-3 text-right border-b border-gray-100 hover:bg-gray-50 transition-colors ${isPresent ? 'bg-black text-white hover:bg-gray-800' : ''}`}
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
               حالياً (أعمل هنا)
            </button>
          )}
          
          <div className="p-3">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={goToNextDecade} disabled={decadeStart >= maxDecade} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">{'>'}</button>
                <span className="text-sm font-medium text-gray-700">{decadeStart} - {decadeStart + 9}</span>
                <button type="button" onClick={goToPreviousDecade} disabled={decadeStart <= minDecade} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">{'<'}</button>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {decadeYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    disabled={year > currentYear}
                    className={`px-2 py-2 text-sm rounded-lg ${selectedYear === year ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="grid grid-cols-3 gap-1">
                {ARABIC_MONTHS.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setSelectedMonth(index)}
                    className={`px-2 py-1.5 text-sm rounded-lg ${selectedMonth === index ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>

            {selectedMonth !== null && selectedYear && (
              <button
                type="button"
                onClick={() => handleSelect(selectedMonth, selectedYear)}
                className="w-full mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                تأكيد: {ARABIC_MONTHS[selectedMonth]} {selectedYear}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonalSection({ resume, onChange }: { resume: Resume; onChange: (updates: Partial<Resume>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>الاسم الكامل</label>
        <input type="text" value={resume.full_name} onChange={(e) => onChange({ full_name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" style={{ fontFamily: "'Zain', sans-serif" }} dir="rtl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>البريد الإلكتروني</label>
          <input type="email" value={resume.contact?.email || ""} onChange={(e) => onChange({ contact: { ...resume.contact, email: e.target.value } })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>رقم الهاتف</label>
          <input type="tel" value={resume.contact?.phone || ""} onChange={(e) => onChange({ contact: { ...resume.contact, phone: e.target.value } })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" dir="ltr" />
        </div>
      </div>
       <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>LinkedIn</label>
          <input type="url" value={resume.contact?.linkedin || ""} onChange={(e) => onChange({ contact: { ...resume.contact, linkedin: e.target.value } })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>GitHub</label>
          <input type="text" value={resume.contact?.github || ""} onChange={(e) => onChange({ contact: { ...resume.contact, github: e.target.value } })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" dir="ltr" />
        </div>
      </div>
    </div>
  );
}

function ExperienceSection({ experience, onChange }: { experience: ExperienceItem[]; onChange: (exp: ExperienceItem[]) => void }) {
  const addExperience = () => onChange([...experience, { company: "", position: "", start_date: "", achievements: [] }]);
  const updateExperience = (index: number, field: keyof ExperienceItem, value: unknown) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };
  const removeExperience = (index: number) => onChange(experience.filter((_, i) => i !== index));

  return (
    <div className="space-y-6">
      {experience.map((exp, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-5 relative">
          <button onClick={() => removeExperience(index)} className="absolute top-3 left-3 text-red-500">×</button>
          <div className="grid grid-cols-2 gap-4 mb-4">
             <div><label className="block text-sm mb-1">الشركة</label><input type="text" value={exp.company} onChange={(e) => updateExperience(index, "company", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
             <div><label className="block text-sm mb-1">المسمى</label><input type="text" value={exp.position} onChange={(e) => updateExperience(index, "position", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><label className="block text-sm mb-1">البدء</label><MonthYearPicker value={exp.start_date} onChange={(v) => updateExperience(index, "start_date", v)} placeholder="اختر" /></div>
            <div><label className="block text-sm mb-1">الانتهاء</label><MonthYearPicker value={exp.end_date || ""} onChange={(v) => updateExperience(index, "end_date", v)} placeholder="اختر" allowPresent /></div>
             <div><label className="block text-sm mb-1">الموقع</label><input type="text" value={exp.location || ""} onChange={(e) => updateExperience(index, "location", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div>
            <label className="block text-sm mb-1">الإنجازات</label>
            <textarea value={(exp.achievements || []).join("\n")} onChange={(e) => updateExperience(index, "achievements", e.target.value.split("\n"))} className="w-full px-3 py-2 border rounded-lg" rows={4} />
          </div>
        </div>
      ))}
      <button onClick={addExperience} className="w-full py-3 border-2 border-dashed rounded-lg text-gray-600 hover:border-black">+ إضافة خبرة</button>
    </div>
  );
}

function EducationSection({ education, onChange }: { education: EducationItem[]; onChange: (edu: EducationItem[]) => void }) {
    const addEducation = () => onChange([...education, { institution: "", degree: "", field: "", graduation_date: "" }]);
    const updateEducation = (index: number, field: keyof EducationItem, value: unknown) => {
        const updated = [...education];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };
    const removeEducation = (index: number) => onChange(education.filter((_, i) => i !== index));

    return (
        <div className="space-y-6">
            {education.map((edu, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-5 relative">
                    <button onClick={() => removeEducation(index)} className="absolute top-3 left-3 text-red-500">×</button>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-sm mb-1">المؤسسة</label><input type="text" value={edu.institution} onChange={(e) => updateEducation(index, "institution", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                        <div><label className="block text-sm mb-1">الدرجة</label><input type="text" value={edu.degree} onChange={(e) => updateEducation(index, "degree", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                         <div><label className="block text-sm mb-1">التخصص</label><input type="text" value={edu.field} onChange={(e) => updateEducation(index, "field", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                         <div><label className="block text-sm mb-1">التخرج</label><MonthYearPicker value={edu.graduation_date} onChange={(v) => updateEducation(index, "graduation_date", v)} placeholder="اختر" allowPresent /></div>
                         <div><label className="block text-sm mb-1">المعدل</label><input type="text" value={edu.gpa || ""} onChange={(e) => updateEducation(index, "gpa", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                    </div>
                </div>
            ))}
            <button onClick={addEducation} className="w-full py-3 border-2 border-dashed rounded-lg text-gray-600 hover:border-black">+ إضافة تعليم</button>
        </div>
    );
}

function SkillsSection({ skills, onChange }: { skills: SkillsSummary; onChange: (skills: SkillsSummary) => void }) {
    const update = (cat: keyof SkillsSummary, val: string) => onChange({ ...skills, [cat]: val.split(",").map(s => s.trim()).filter(s => s) });
    return (
        <div className="space-y-6">
            <div><label className="block text-sm mb-2">المهارات التقنية</label><input type="text" value={skills.languages?.join(", ") || ""} onChange={(e) => update("languages", e.target.value)} className="w-full px-4 py-3 border rounded-lg" dir="rtl" /></div>
            <div><label className="block text-sm mb-2">الأدوات</label><input type="text" value={skills.tools?.join(", ") || ""} onChange={(e) => update("tools", e.target.value)} className="w-full px-4 py-3 border rounded-lg" dir="ltr" /></div>
            <div><label className="block text-sm mb-2">الشهادات</label><input type="text" value={skills.platforms?.join(", ") || ""} onChange={(e) => update("platforms", e.target.value)} className="w-full px-4 py-3 border rounded-lg" dir="rtl" /></div>
            <div><label className="block text-sm mb-2">اللغات</label><input type="text" value={skills.frameworks?.join(", ") || ""} onChange={(e) => update("frameworks", e.target.value)} className="w-full px-4 py-3 border rounded-lg" dir="rtl" /></div>
            <div><label className="block text-sm mb-2">المهارات الشخصية</label><input type="text" value={skills.soft_skills?.join(", ") || ""} onChange={(e) => update("soft_skills", e.target.value)} className="w-full px-4 py-3 border rounded-lg" dir="rtl" /></div>
        </div>
    );
}

function ProjectsSection({ projects, onChange }: { projects: ProjectItem[]; onChange: (proj: ProjectItem[]) => void }) {
    const add = () => onChange([...projects, { title: "", description: "", technologies: [] }]);
    const update = (index: number, field: keyof ProjectItem, value: unknown) => {
        const up = [...projects];
        up[index] = { ...up[index], [field]: value };
        onChange(up);
    };
    const remove = (i: number) => onChange(projects.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-6">
            {projects.map((proj, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-5 relative">
                    <button onClick={() => remove(index)} className="absolute top-3 left-3 text-red-500">×</button>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-sm mb-1">اسم المشروع</label><input type="text" value={proj.title} onChange={(e) => update(index, "title", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                        <div><label className="block text-sm mb-1">التاريخ</label><input type="text" value={proj.date || ""} onChange={(e) => update(index, "date", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                    </div>
                    <div className="mb-4"><label className="block text-sm mb-1">الوصف</label><textarea value={proj.description || ""} onChange={(e) => update(index, "description", e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} /></div>
                    <div><label className="block text-sm mb-1">التقنيات</label><input type="text" value={proj.technologies.join(", ")} onChange={(e) => update(index, "technologies", e.target.value.split(","))} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div>
            ))}
            <button onClick={add} className="w-full py-3 border-2 border-dashed rounded-lg text-gray-600 hover:border-black">+ إضافة مشروع</button>
        </div>
    );
}

function VolunteerSection({ volunteer, onChange }: { volunteer: VolunteerItem[]; onChange: (vol: VolunteerItem[]) => void }) {
    const add = () => onChange([...volunteer, { organization: "", role: "", start_date: "", end_date: "", description: "" }]);
    const update = (index: number, field: keyof VolunteerItem, value: string) => {
        const up = [...volunteer];
        up[index] = { ...up[index], [field]: value };
        onChange(up);
    };
    const remove = (i: number) => onChange(volunteer.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-6">
            {volunteer.map((vol, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-5 relative">
                    <button onClick={() => remove(index)} className="absolute top-3 left-3 text-red-500">×</button>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-sm mb-1">المنظمة</label><input type="text" value={vol.organization} onChange={(e) => update(index, "organization", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                        <div><label className="block text-sm mb-1">الدور</label><input type="text" value={vol.role} onChange={(e) => update(index, "role", e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-sm mb-1">البدء</label><MonthYearPicker value={vol.start_date} onChange={(v) => update(index, "start_date", v)} placeholder="اختر" /></div>
                        <div><label className="block text-sm mb-1">الانتهاء</label><MonthYearPicker value={vol.end_date} onChange={(v) => update(index, "end_date", v)} placeholder="اختر" allowPresent /></div>
                    </div>
                    <div><label className="block text-sm mb-1">الوصف</label><textarea value={vol.description} onChange={(e) => update(index, "description", e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} /></div>
                </div>
            ))}
            <button onClick={add} className="w-full py-3 border-2 border-dashed rounded-lg text-gray-600 hover:border-black">+ إضافة تطوع</button>
        </div>
    );
}

// Placeholder Sections for additional features not yet fully mapped to backend
function ResearchSection() { return <div className="p-4 text-center text-gray-500">قسم الأبحاث (سيتم حفظه محلياً في الوقت الحالي)</div>; }
function PublicationsSection({ publications, onChange }: any) { return <div className="p-4 text-center text-gray-500">قسم المنشورات (قيد التطوير)</div>; }
function AwardsSection({ awards, onChange }: any) { return <div className="p-4 text-center text-gray-500">قسم الجوائز (قيد التطوير)</div>; }
function LanguagesSection() { return <div className="p-4 text-center text-gray-500">قسم اللغات الإضافية (قيد التطوير)</div>; }
function CoursesSection() { return <div className="p-4 text-center text-gray-500">قسم الدورات (قيد التطوير)</div>; }

// Icons
function UserIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
function BriefcaseIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function AcademicIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>; }
function SkillsIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>; }
function ProjectIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>; }
function HeartIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>; }
function ResearchIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function PublicationIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>; }
function AwardIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>; }
function LanguageIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>; }
function CourseIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>; }
function PlusIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>; }