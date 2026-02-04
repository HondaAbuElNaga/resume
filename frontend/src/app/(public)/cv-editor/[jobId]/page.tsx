"use client";

import { useState, useCallback, useRef, useEffect, memo, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

// Performance: Dynamic imports
const PdfPreview = dynamic(() => import("@/components/cv/PdfPreview"), {
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
    </div>
  ),
  ssr: false,
});

// --- Types & Interfaces ---

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
  skills: SkillsSummary;
  volunteer_experience: VolunteerItem[];
  research?: any[];
  publications?: any[];
  awards?: any[];
  languages_list?: any[];
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
  title: string;
  description?: string;
  technologies: string[];
  date?: string;
}

export interface SkillsSummary {
  languages?: string[];
  frameworks?: string[];
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

const mapBackendSkillsToFrontend = (backendSkills: BackendSkillCategory[] = []): SkillsSummary => {
  const summary: SkillsSummary = {
    languages: [],
    frameworks: [],
    tools: [],
    platforms: [],
    soft_skills: [],
  };

  backendSkills.forEach((cat) => {
    const name = cat.category_name.toLowerCase();
    if (name.includes("لغات") || name.includes("languages") || name.includes("technologies")) {
      summary.languages = [...(summary.languages || []), ...cat.skills];
    } else if (name.includes("أدوات") || name.includes("tools")) {
      summary.tools = [...(summary.tools || []), ...cat.skills];
    } else if (name.includes("شخصية") || name.includes("soft")) {
      summary.soft_skills = [...(summary.soft_skills || []), ...cat.skills];
    } else if (name.includes("شهادات") || name.includes("cert")) {
      summary.platforms = [...(summary.platforms || []), ...cat.skills];
    } else {
      summary.languages = [...(summary.languages || []), ...cat.skills];
    }
  });
  return summary;
};

const mapFrontendSkillsToBackend = (summary: SkillsSummary): BackendSkillCategory[] => {
  const categories: BackendSkillCategory[] = [];
  if (summary.languages?.length)
    categories.push({ category_name: "المهارات التقنية", skills: summary.languages });
  if (summary.tools?.length)
    categories.push({ category_name: "الأدوات والبرامج", skills: summary.tools });
  if (summary.soft_skills?.length)
    categories.push({ category_name: "المهارات الشخصية", skills: summary.soft_skills });
  if (summary.platforms?.length)
    categories.push({ category_name: "الشهادات", skills: summary.platforms });
  if (summary.frameworks?.length)
    categories.push({ category_name: "اللغات", skills: summary.frameworks });

  return categories;
};

const mapBackendRespToVolunteer = (resps: BackendResponsibility[] = []): VolunteerItem[] => {
  return resps.map((r) => {
    const dates = r.date_range ? r.date_range.split(" - ") : ["", ""];
    return {
      organization: r.organization,
      role: r.title,
      start_date: dates[0] || "",
      end_date: dates[1] || "",
      description: r.details?.[0] || "",
    };
  });
};

const mapVolunteerToBackendResp = (vols: VolunteerItem[]): BackendResponsibility[] => {
  return vols.map((v) => ({
    title: v.role,
    organization: v.organization,
    date_range: `${v.start_date} - ${v.end_date}`,
    details: v.description ? [v.description] : [],
  }));
};

// --- Memoized Icons ---

const icons = {
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  briefcase: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  academic: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  ),
  skills: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  project: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  heart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  research: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  publication: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  award: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  language: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  ),
  course: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  chevronLeft: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  save: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
};

// --- Memoized Section Tab Component ---

const SectionTab = memo((
  { section, isActive, onClick, onRemove, isRemovable }: {
    section: { id: SectionType; label: string; icon: React.ReactNode };
    isActive: boolean;
    onClick: () => void;
    onRemove: () => void;
    isRemovable: boolean;
  }
) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
        isActive
          ? "text-black border-black bg-gray-50"
          : "text-gray-500 border-transparent hover:text-black hover:bg-gray-50"
      }`}
    >
      {section.icon}
      {section.label}
    </button>
    {isRemovable && (
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-10"
        title="إزالة القسم"
      >
        ×
      </button>
    )}
  </div>
));
SectionTab.displayName = "SectionTab";

// --- Main Component ---

export default function CVEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [currentJobId, setCurrentJobId] = useState<string>((params.id as string) || (params.jobId as string));

  const [activeSection, setActiveSection] = useState<SectionType>("personal");
  const [enabledSections, setEnabledSections] = useState<SectionType[]>([]);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const addSectionRef = useRef<HTMLDivElement>(null);

  const [resumeData, setResumeData] = useState<Resume | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // API Query
  const { data: fullResponse, isLoading, isError } = useQuery({
    queryKey: ["cv-data", currentJobId],
    queryFn: async () => {
      const res = await api.get(`/get-cv-data/${currentJobId}/`);
      return res.data;
    },
    enabled: !!currentJobId,
    refetchOnWindowFocus: false,
  });

  // Sync Fetched Data
  useEffect(() => {
    if (fullResponse && fullResponse.cv_data) {
      const fetchedData = fullResponse.cv_data;

      if (fullResponse.pdf_url) {
        setPdfUrl(fullResponse.pdf_url);
      } else if (fullResponse.job && fullResponse.job.pdf_url) {
        setPdfUrl(fullResponse.job.pdf_url);
      }

      const mappedResume: Resume = {
        full_name: fetchedData.full_name || "",
        contact: fetchedData.contact || {},
        experience: fetchedData.experience || [],
        education: fetchedData.education || [],
        projects: (fetchedData.projects || []).map((p: any) => ({
          title: p.name,
          description: p.description,
          technologies: p.technologies,
          date: p.details?.[0],
        })),
        skills: mapBackendSkillsToFrontend(fetchedData.skills),
        volunteer_experience: mapBackendRespToVolunteer(fetchedData.responsibilities),
      };

      setResumeData(mappedResume);

      const active: SectionType[] = [];
      if (mappedResume.experience?.length > 0) active.push("experience");
      if (mappedResume.education?.length > 0) active.push("education");
      if (mappedResume.projects?.length > 0) active.push("projects");
      if (mappedResume.volunteer_experience?.length > 0) active.push("volunteer");
      active.push("skills");

      setEnabledSections((prev) => Array.from(new Set([...prev, ...active])));
    }
  }, [fullResponse]);

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedResume: Resume) => {
      const payload = {
        full_name: updatedResume.full_name,
        contact: updatedResume.contact,
        professional_summary: "Generated Summary...",
        experience: updatedResume.experience,
        education: updatedResume.education,
        projects: updatedResume.projects.map((p) => ({
          name: p.title,
          description: p.description,
          technologies: p.technologies,
          details: p.date ? [p.date] : [],
        })),
        skills: mapFrontendSkillsToBackend(updatedResume.skills),
        responsibilities: mapVolunteerToBackendResp(updatedResume.volunteer_experience),
      };

      const res = await api.post("/update-cv-data/", {
        job_id: currentJobId,
        cv_data: payload,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("تم حفظ التعديلات!");
      if (data.job_id) {
        setCurrentJobId(data.job_id);
        window.history.replaceState(null, "", `/cv-editor/${data.job_id}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "حدث خطأ أثناء الحفظ");
    },
  });

  // Performance: Memoized handlers
  const handleSave = useCallback(() => {
    if (resumeData) {
      saveMutation.mutate(resumeData);
    }
  }, [resumeData, saveMutation]);

  const updateField = useCallback((field: keyof Resume, value: unknown) => {
    setResumeData((prev) => (prev ? { ...prev, [field]: value } : null));
  }, []);

  const handleGoBack = useCallback(() => {
    router.push("/");
  }, [router]);

  // Close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addSectionRef.current && !addSectionRef.current.contains(event.target as Node)) {
        setIsAddSectionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Performance: Memoized sections
  const baseSections = useMemo(
    () => [
      { id: "personal" as SectionType, label: "المعلومات الشخصية", icon: icons.user },
      { id: "experience" as SectionType, label: "الخبرات العملية", icon: icons.briefcase },
      { id: "education" as SectionType, label: "التعليم", icon: icons.academic },
      { id: "skills" as SectionType, label: "المهارات", icon: icons.skills },
      { id: "projects" as SectionType, label: "المشاريع", icon: icons.project },
    ],
    []
  );

  const additionalSections = useMemo(
    (): AdditionalSection[] => [
      { id: "volunteer", label: "العمل التطوعي", labelEn: "Volunteering", icon: icons.heart, description: "أضف خبراتك التطوعية" },
      { id: "research", label: "الأبحاث", labelEn: "Research", icon: icons.research, description: "أضف أبحاثك العلمية" },
      { id: "publications", label: "المنشورات", labelEn: "Publications", icon: icons.publication, description: "أضف منشوراتك" },
      { id: "awards", label: "الجوائز", labelEn: "Awards", icon: icons.award, description: "أضف جوائزك" },
      { id: "languages", label: "اللغات", labelEn: "Languages", icon: icons.language, description: "أضف اللغات" },
      { id: "courses", label: "الدورات", labelEn: "Courses", icon: icons.course, description: "أضف دوراتك" },
    ],
    []
  );

  const visibleSections = useMemo(
    () => [
      ...baseSections,
      ...additionalSections.filter((s) => enabledSections.includes(s.id)).map((s) => ({ id: s.id, label: s.label, icon: s.icon })),
    ],
    [baseSections, additionalSections, enabledSections]
  );

  const addSection = useCallback((sectionId: SectionType) => {
    if (!enabledSections.includes(sectionId)) {
      setEnabledSections([...enabledSections, sectionId]);
      setActiveSection(sectionId);
    }
    setIsAddSectionOpen(false);
  }, [enabledSections]);

  const removeSection = useCallback((sectionId: SectionType) => {
    setEnabledSections(enabledSections.filter((s) => s !== sectionId));
    if (activeSection === sectionId) {
      setActiveSection("personal");
    }
  }, [enabledSections, activeSection]);

  // Loading State
  if (isLoading || !resumeData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">جاري تحميل بيانات السيرة الذاتية...</h2>
          <p className="text-gray-500">قد يستغرق هذا بضع ثوانٍ</p>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">لم نتمكن من العثور على السيرة الذاتية</h2>
            <p className="text-gray-500 mb-6">عذراً، حدث خطأ أثناء تحميل بيانات السيرة الذاتية المطلوبة.</p>
            <button onClick={handleGoBack} className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
              {icons.chevronLeft}
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                title="العودة"
              >
                {icons.chevronLeft}
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">تعديل السيرة الذاتية</h1>
                <p className="text-xs text-gray-500">ID: {currentJobId.slice(0, 8)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {saveMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : icons.save}
                {saveMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                >
                  {icons.download}
                  تحميل PDF
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto p-4 lg:p-6">
        <div className="flex flex-row-reverse gap-4 lg:gap-6 h-[calc(100vh-140px)]">
          {/* Left Side - PDF Preview */}
          <div className="w-1/2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">معاينة السيرة الذاتية</h2>
            </div>
            <div className="flex-1 bg-gray-50 overflow-hidden relative">
              {pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#toolbar=0`}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                      <p className="text-sm">جاري إنشاء النسخة الجديدة...</p>
                    </>
                  ) : (
                    <p className="text-sm">جاري تجهيز المعاينة... تأكد من حفظ التعديلات</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Editor */}
          <div className="w-1/2 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col relative">
            {/* Section Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto overflow-y-visible">
              <div className="flex items-center min-w-max" dir="rtl">
                {visibleSections.map((section) => (
                  <SectionTab
                    key={section.id}
                    section={section}
                    isActive={activeSection === section.id}
                    onClick={() => setActiveSection(section.id)}
                    onRemove={() => removeSection(section.id)}
                    isRemovable={additionalSections.some((s) => s.id === section.id)}
                  />
                ))}

                {/* Add Section Button */}
                <div className="relative ml-2" ref={addSectionRef}>
                  <button
                    onClick={() => setIsAddSectionOpen(!isAddSectionOpen)}
                    className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all rounded-xl mx-2 ${
                      isAddSectionOpen
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {icons.plus}
                    إضافة قسم
                  </button>

                  {/* Add Section Dropdown */}
                  {isAddSectionOpen && (
                    <div
                      className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                      dir="rtl"
                    >
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-900 text-sm">أقسام إضافية</h3>
                        <p className="text-xs text-gray-500 mt-1">اختر الأقسام التي تريد إضافتها</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {additionalSections.map((section) => {
                          const isEnabled = enabledSections.includes(section.id);
                          return (
                            <button
                              key={section.id}
                              onClick={() => !isEnabled && addSection(section.id)}
                              disabled={isEnabled}
                              className={`w-full px-4 py-3 flex items-start gap-3 transition-colors ${
                                isEnabled ? "bg-gray-50 cursor-not-allowed" : "hover:bg-gray-50"
                              }`}
                            >
                              <div className={isEnabled ? "text-green-500" : "text-gray-400 mt-0.5"}>
                                {isEnabled ? icons.check : section.icon}
                              </div>
                              <div className="text-right flex-1">
                                <p className="font-semibold text-sm text-gray-900">{section.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section Content */}
            <div className="flex-1 overflow-auto p-6" dir="rtl">
              {activeSection === "personal" && (
                <PersonalSection
                  resume={resumeData}
                  onChange={(updates) => setResumeData((prev) => (prev ? { ...prev, ...updates } : null))}
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
              {activeSection === "research" && <PlaceholderSection title="الأبحاث" description="قسم الأبحاث (قيد التطوير)" />}
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
              {activeSection === "languages" && <PlaceholderSection title="اللغات" description="قسم اللغات (قيد التطوير)" />}
              {activeSection === "courses" && <PlaceholderSection title="الدورات" description="قسم الدورات (قيد التطوير)" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Memoized Sub Components ---

const PlaceholderSection = memo(({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500">{description}</p>
  </div>
));
PlaceholderSection.displayName = "PlaceholderSection";

const PersonalSection = memo(({ resume, onChange }: { resume: Resume; onChange: (updates: Partial<Resume>) => void }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">الاسم الكامل</label>
      <input
        type="text"
        value={resume.full_name}
        onChange={(e) => onChange({ full_name: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
        dir="rtl"
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">البريد الإلكتروني</label>
        <input
          type="email"
          value={resume.contact?.email || ""}
          onChange={(e) => onChange({ contact: { ...resume.contact, email: e.target.value } })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">رقم الهاتف</label>
        <input
          type="tel"
          value={resume.contact?.phone || ""}
          onChange={(e) => onChange({ contact: { ...resume.contact, phone: e.target.value } })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          dir="ltr"
        />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">LinkedIn</label>
        <input
          type="url"
          value={resume.contact?.linkedin || ""}
          onChange={(e) => onChange({ contact: { ...resume.contact, linkedin: e.target.value } })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          dir="ltr"
          placeholder="https://linkedin.com/in/username"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">GitHub</label>
        <input
          type="text"
          value={resume.contact?.github || ""}
          onChange={(e) => onChange({ contact: { ...resume.contact, github: e.target.value } })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          dir="ltr"
          placeholder="github.com/username"
        />
      </div>
    </div>
  </div>
));
PersonalSection.displayName = "PersonalSection";

const ExperienceCard = memo((
  { exp, index, onUpdate, onRemove }: {
    exp: ExperienceItem;
    index: number;
    onUpdate: (index: number, field: keyof ExperienceItem, value: unknown) => void;
    onRemove: (index: number) => void;
  }
) => (
  <div className="bg-gray-50 rounded-2xl p-6 relative group">
    <button
      onClick={() => onRemove(index)}
      className="absolute top-4 left-4 w-8 h-8 bg-white border border-gray-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
    >
      {icons.close}
    </button>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">الشركة</label>
        <input
          type="text"
          value={exp.company}
          onChange={(e) => onUpdate(index, "company", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">المسمى الوظيفي</label>
        <input
          type="text"
          value={exp.position}
          onChange={(e) => onUpdate(index, "position", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
        />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">تاريخ البدء</label>
        <MonthYearPicker value={exp.start_date} onChange={(v) => onUpdate(index, "start_date", v)} placeholder="اختر التاريخ" />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">تاريخ الانتهاء</label>
        <MonthYearPicker value={exp.end_date || ""} onChange={(v) => onUpdate(index, "end_date", v)} placeholder="اختر التاريخ" allowPresent />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">الموقع</label>
        <input
          type="text"
          value={exp.location || ""}
          onChange={(e) => onUpdate(index, "location", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">الإنجازات</label>
      <textarea
        value={(exp.achievements || []).join("\n")}
        onChange={(e) => onUpdate(index, "achievements", e.target.value.split("\n"))}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all resize-none"
        rows={4}
        placeholder="أدخل إنجازك (كل إنجاز في سطر جديد)"
      />
    </div>
  </div>
));
ExperienceCard.displayName = "ExperienceCard";

const ExperienceSection = memo(({ experience, onChange }: { experience: ExperienceItem[]; onChange: (exp: ExperienceItem[]) => void }) => {
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
        <ExperienceCard key={index} exp={exp} index={index} onUpdate={updateExperience} onRemove={removeExperience} />
      ))}
      <button
        onClick={addExperience}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold hover:border-black hover:text-black hover:bg-gray-50 transition-all"
      >
        + إضافة خبرة عمل
      </button>
    </div>
  );
});
ExperienceSection.displayName = "ExperienceSection";

const EducationCard = memo((
  { edu, index, onUpdate, onRemove }: {
    edu: EducationItem;
    index: number;
    onUpdate: (index: number, field: keyof EducationItem, value: unknown) => void;
    onRemove: (index: number) => void;
  }
) => (
  <div className="bg-gray-50 rounded-2xl p-6 relative group">
    <button
      onClick={() => onRemove(index)}
      className="absolute top-4 left-4 w-8 h-8 bg-white border border-gray-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
    >
      {icons.close}
    </button>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">المؤسسة التعليمية</label>
        <input
          type="text"
          value={edu.institution}
          onChange={(e) => onUpdate(index, "institution", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">الدرجة العلمية</label>
        <input
          type="text"
          value={edu.degree}
          onChange={(e) => onUpdate(index, "degree", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
        />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">التخصص</label>
        <input
          type="text"
          value={edu.field}
          onChange={(e) => onUpdate(index, "field", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">تاريخ التخرج</label>
        <MonthYearPicker value={edu.graduation_date} onChange={(v) => onUpdate(index, "graduation_date", v)} placeholder="اختر التاريخ" allowPresent />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">المعدل</label>
        <input
          type="text"
          value={edu.gpa || ""}
          onChange={(e) => onUpdate(index, "gpa", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
          placeholder="اختياري"
        />
      </div>
    </div>
  </div>
));
EducationCard.displayName = "EducationCard";

const EducationSection = memo(({ education, onChange }: { education: EducationItem[]; onChange: (edu: EducationItem[]) => void }) => {
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
        <EducationCard key={index} edu={edu} index={index} onUpdate={updateEducation} onRemove={removeEducation} />
      ))}
      <button
        onClick={addEducation}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold hover:border-black hover:text-black hover:bg-gray-50 transition-all"
      >
        + إضافة تعليم
      </button>
    </div>
  );
});
EducationSection.displayName = "EducationSection";

const SkillsSection = memo(({ skills, onChange }: { skills: SkillsSummary; onChange: (skills: SkillsSummary) => void }) => {
  const update = useCallback((cat: keyof SkillsSummary, val: string) => {
    onChange({ ...skills, [cat]: val.split(",").map((s) => s.trim()).filter((s) => s) });
  }, [skills, onChange]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">المهارات التقنية</label>
        <input
          type="text"
          value={skills.languages?.join(", ") || ""}
          onChange={(e) => update("languages", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          dir="rtl"
          placeholder="Python, JavaScript, React..."
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">الأدوات والبرامج</label>
        <input
          type="text"
          value={skills.tools?.join(", ") || ""}
          onChange={(e) => update("tools", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          dir="ltr"
          placeholder="Git, Docker, VS Code..."
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">الشهادات</label>
        <input
          type="text"
          value={skills.platforms?.join(", ") || ""}
          onChange={(e) => update("platforms", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          dir="rtl"
          placeholder="AWS, Azure, GCP..."
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">اللغات</label>
        <input
          type="text"
          value={skills.frameworks?.join(", ") || ""}
          onChange={(e) => update("frameworks", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          dir="rtl"
          placeholder="العربية، الإنجليزية، الفرنسية..."
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">المهارات الشخصية</label>
        <input
          type="text"
          value={skills.soft_skills?.join(", ") || ""}
          onChange={(e) => update("soft_skills", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          dir="rtl"
          placeholder="القيادة، التواصل، العمل الجماعي..."
        />
      </div>
    </div>
  );
});
SkillsSection.displayName = "SkillsSection";

const ProjectsCard = memo((
  { proj, index, onUpdate, onRemove }: {
    proj: ProjectItem;
    index: number;
    onUpdate: (index: number, field: keyof ProjectItem, value: unknown) => void;
    onRemove: (index: number) => void;
  }
) => (
  <div className="bg-gray-50 rounded-2xl p-6 relative group">
    <button
      onClick={() => onRemove(index)}
      className="absolute top-4 left-4 w-8 h-8 bg-white border border-gray-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
    >
      {icons.close}
    </button>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">اسم المشروع</label>
        <input
          type="text"
          value={proj.title}
          onChange={(e) => onUpdate(index, "title", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">التاريخ</label>
        <input
          type="text"
          value={proj.date || ""}
          onChange={(e) => onUpdate(index, "date", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
          placeholder="اختياري"
        />
      </div>
    </div>
    <div className="mb-4">
      <label className="block text-sm font-bold text-gray-900 mb-2">الوصف</label>
      <textarea
        value={proj.description || ""}
        onChange={(e) => onUpdate(index, "description", e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all resize-none"
        rows={3}
        placeholder="صف مشروعك باختصار..."
      />
    </div>
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">التقنيات المستخدمة</label>
      <input
        type="text"
        value={proj.technologies.join(", ")}
        onChange={(e) => onUpdate(index, "technologies", e.target.value.split(","))}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
        placeholder="React, Node.js, MongoDB..."
      />
    </div>
  </div>
));
ProjectsCard.displayName = "ProjectsCard";

const ProjectsSection = memo(({ projects, onChange }: { projects: ProjectItem[]; onChange: (proj: ProjectItem[]) => void }) => {
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
        <ProjectsCard key={index} proj={proj} index={index} onUpdate={update} onRemove={remove} />
      ))}
      <button
        onClick={add}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold hover:border-black hover:text-black hover:bg-gray-50 transition-all"
      >
        + إضافة مشروع
      </button>
    </div>
  );
});
ProjectsSection.displayName = "ProjectsSection";

const VolunteerCard = memo((
  { vol, index, onUpdate, onRemove }: {
    vol: VolunteerItem;
    index: number;
    onUpdate: (index: number, field: keyof VolunteerItem, value: string) => void;
    onRemove: (index: number) => void;
  }
) => (
  <div className="bg-gray-50 rounded-2xl p-6 relative group">
    <button
      onClick={() => onRemove(index)}
      className="absolute top-4 left-4 w-8 h-8 bg-white border border-gray-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
    >
      {icons.close}
    </button>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">المنظمة</label>
        <input
          type="text"
          value={vol.organization}
          onChange={(e) => onUpdate(index, "organization", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">الدور</label>
        <input
          type="text"
          value={vol.role}
          onChange={(e) => onUpdate(index, "role", e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all"
        />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">تاريخ البدء</label>
        <MonthYearPicker value={vol.start_date} onChange={(v) => onUpdate(index, "start_date", v)} placeholder="اختر التاريخ" />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">تاريخ الانتهاء</label>
        <MonthYearPicker value={vol.end_date} onChange={(v) => onUpdate(index, "end_date", v)} placeholder="اختر التاريخ" allowPresent />
      </div>
    </div>
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">الوصف</label>
      <textarea
        value={vol.description}
        onChange={(e) => onUpdate(index, "description", e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white transition-all resize-none"
        rows={3}
        placeholder="صف دورك وتطوعك..."
      />
    </div>
  </div>
));
VolunteerCard.displayName = "VolunteerCard";

const VolunteerSection = memo(({ volunteer, onChange }: { volunteer: VolunteerItem[]; onChange: (vol: VolunteerItem[]) => void }) => {
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
        <VolunteerCard key={index} vol={vol} index={index} onUpdate={update} onRemove={remove} />
      ))}
      <button
        onClick={add}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold hover:border-black hover:text-black hover:bg-gray-50 transition-all"
      >
        + إضافة عمل تطوعي
      </button>
    </div>
  );
});
VolunteerSection.displayName = "VolunteerSection";

const PublicationsSection = memo(({ publications, onChange }: { publications: any[]; onChange: (pubs: any[]) => void }) => (
  <PlaceholderSection title="المنشورات" description="قسم المنشورات (قيد التطوير)" />
));
PublicationsSection.displayName = "PublicationsSection";

const AwardsSection = memo(({ awards, onChange }: { awards: any[]; onChange: (awards: any[]) => void }) => (
  <PlaceholderSection title="الجوائز والإنجازات" description="قسم الجوائز (قيد التطوير)" />
));
AwardsSection.displayName = "AwardsSection";

// --- Month Year Picker ---

const ARABIC_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const MonthYearPicker = memo(({
  value,
  onChange,
  placeholder,
  allowPresent = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allowPresent?: boolean;
}) => {
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

  const goToPreviousDecade = () => {
    if (decadeStart > minDecade) setDecadeStart(decadeStart - 10);
  };
  const goToNextDecade = () => {
    if (decadeStart < maxDecade) setDecadeStart(decadeStart + 10);
  };

  const handleSelect = useCallback((month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setIsPresent(false);
    onChange(`${ARABIC_MONTHS[month]} ${year}`);
    setIsOpen(false);
  }, [onChange]);

  const handlePresentClick = useCallback(() => {
    setIsPresent(true);
    setSelectedMonth(null);
    setSelectedYear(null);
    onChange("حالياً");
    setIsOpen(false);
  }, [onChange]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white text-right flex items-center justify-between transition-all"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={value ? "text-gray-900 font-medium" : "text-gray-400"}>{value || placeholder}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl right-0 overflow-hidden" dir="rtl">
          {allowPresent && (
            <button
              type="button"
              onClick={handlePresentClick}
              className={`w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors font-medium ${
                isPresent ? "bg-black text-white hover:bg-gray-800" : "text-gray-700"
              }`}
            >
              حالياً (أعمل هنا)
            </button>
          )}

          <div className="p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={goToNextDecade} disabled={decadeStart >= maxDecade} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">
                  {'>'}
                </button>
                <span className="text-sm font-bold text-gray-900">{decadeStart} - {decadeStart + 9}</span>
                <button type="button" onClick={goToPreviousDecade} disabled={decadeStart <= minDecade} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">
                  {'<'}
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {decadeYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    disabled={year > currentYear}
                    className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                      selectedYear === year ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="grid grid-cols-3 gap-2">
                {ARABIC_MONTHS.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setSelectedMonth(index)}
                    className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                      selectedMonth === index ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
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
                className="w-full mt-4 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-bold"
              >
                تأكيد: {ARABIC_MONTHS[selectedMonth]} {selectedYear}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
MonthYearPicker.displayName = "MonthYearPicker";
