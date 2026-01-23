"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// ==================== Types ====================
interface Project {
  id: string;
  name: string;
  latest_job_id: string | null;
  template_id: string | null; // من cv_data
  updated_at: string;
  latest_job_status: string | null;
  pdf_url: string | null;
}

interface UserStats {
  total_cvs: number;
  today_count: number;
  daily_limit: number;
  is_premium: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  is_premium: boolean;
}

// ==================== Icons ====================
const DashboardIcon = ({ className = "" }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const SparkleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const TemplateIcon = ({ className = "" }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const ReviewIcon = ({ className = "" }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TipsIcon = ({ className = "" }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

// ==================== Navigation ====================
const navItems = [
  { id: "dashboard", label: "لوحة التحكم", icon: DashboardIcon, href: "/dashboard" },
  { id: "ai-agent", label: "مساعد الذكاء الاصطناعي", icon: SparkleIcon, href: "/", badge: "جديد" },
  { id: "templates", label: "القوالب", icon: TemplateIcon, href: "/templates" },
  { id: "review", label: "مراجعة سيرتي", icon: ReviewIcon, href: "/review" },
  { id: "tips", label: "نصائح وإرشادات", icon: TipsIcon, href: "/tips" },
];

// ==================== Helper Functions ====================
const getTemplateImage = (templateId: string | null): string => {
  // Map template IDs to actual image files
  const templateMap: Record<string, string> = {
    "1": "/templates/cv-1.png",
    "2": "/templates/cv-2.png",
    "3": "/templates/cv-3.png",
    // أضف باقي القوالب هنا
  };
  
  return templateMap[templateId || "1"] || "/templates/cv-1.png";
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// ==================== Main Component ====================
export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("resumes");
  const [sortBy, setSortBy] = useState("created");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ==================== API Queries ====================
  
  // User Profile
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => (await api.get('/auth/users/me/')).data,
  });

  // User Stats
  const { data: userStats } = useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: async () => (await api.get('/user-stats/')).data,
  });

  // Projects List
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects/');
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}/`),
    onSuccess: () => {
      toast.success("تم حذف السيرة الذاتية");
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف")
  });

  // ==================== Event Handlers ====================
  
  const handleDeleteProject = (projectId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه السيرة الذاتية؟")) {
      deleteMutation.mutate(projectId);
    }
  };

  const handleEditProject = (jobId: string | null) => {
    if (!jobId) {
      toast.error("لم يتم العثور على نسخة قابلة للتعديل");
      return;
    }
    router.push(`/cv-editor/${jobId}`);
  };

  // ==================== Sorting ====================
  
  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // ==================== Render ====================
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-50/50 to-white flex" dir="rtl">
      
      {/* ==================== Sidebar ==================== */}
      <aside className="w-72 bg-white border-l border-gray-200 flex flex-col shadow-sm sticky top-0 h-screen">
        
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
              Easy<span className="text-blue-600">CV</span>
            </span>
          </Link>
        </div>

        {/* Create Button */}
        <div className="p-4">
          <button
            onClick={() => router.push("/create")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            إنشاء سيرة جديدة
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
                item.id === "dashboard"
                  ? "bg-blue-50 text-black border border-blue-100"
                  : "text-gray-600 hover:text-black hover:bg-gray-50"
              }`}
            >
              <item.icon className={item.id === "dashboard" ? "text-blue-600" : ""} />
              <span style={{ fontFamily: "'Zain', sans-serif" }}>{item.label}</span>
              {item.badge && (
                <span className="mr-auto px-2 py-0.5 bg-black text-white text-xs rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Stats */}
        <div className="p-4 border-t border-gray-100">
          <div className="mb-4 space-y-3">
            
            {/* Total CVs */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>السير الذاتية</span>
              <span className="text-black font-medium">{userStats?.total_cvs || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-black h-1.5 rounded-full"
                style={{ width: `${Math.min(((userStats?.total_cvs || 0) / 20) * 100, 100)}%` }}
              />
            </div>
            
            {/* AI Generation */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                <SparkleIcon className="w-4 h-4" />
                توليد بالذكاء الاصطناعي
              </span>
              <span className="text-black font-medium">
                {userStats?.today_count || 0} / {userStats?.daily_limit || 10}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${
                  userStats?.today_count === userStats?.daily_limit ? 'bg-red-500' : 'bg-blue-600'
                }`}
                style={{ width: `${((userStats?.today_count || 0) / (userStats?.daily_limit || 10)) * 100}%` }}
              />
            </div>
          </div>

          {/* Upgrade Button */}
          {!userProfile?.is_premium && (
            <button 
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              ترقية الخطة
            </button>
          )}
        </div>
      </aside>

      {/* ==================== Main Content ==================== */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
          
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { id: "resumes", label: "السير الذاتية" },
              { id: "covers", label: "خطابات التغطية" },
              { id: "letters", label: "خطابات أخرى" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-black shadow-sm"
                    : "text-gray-500 hover:text-black"
                }`}
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {userProfile?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
                    {userProfile?.username || "المستخدم"}
                  </p>
                  <p className="text-xs text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
                    {userProfile?.is_premium ? "الخطة الذهبية" : "الخطة المجانية"}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <p className="font-medium text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
                      {userProfile?.username}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{userProfile?.email}</p>
                  </div>
                  <div className="py-2">
                    <Link 
                      href="/settings" 
                      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span style={{ fontFamily: "'Zain', sans-serif" }}>الإعدادات</span>
                    </Link>
                    <hr className="my-2" />
                    <button 
                      onClick={() => {
                        localStorage.removeItem("auth_token");
                        router.push("/login");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span style={{ fontFamily: "'Zain', sans-serif" }}>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div 
              onClick={() => router.push('/')} 
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <SparkleIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-black font-semibold mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                    مساعد الذكاء الاصطناعي
                  </h3>
                  <p className="text-gray-500 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>
                    أقوى أداة لإنشاء السير الذاتية
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl p-5 opacity-70 cursor-not-allowed">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-black font-semibold mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                    البحث عن وظائف
                  </h3>
                  <p className="text-gray-500 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>قريباً..</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 opacity-70 cursor-not-allowed">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-black font-semibold mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                    مراجعة سيرتي
                  </h3>
                  <p className="text-gray-500 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>قريباً..</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumes Section */}
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-xl font-bold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
                السير الذاتية
              </h2>

              <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                
                {/* Sort Dropdown */}
                <div className="relative w-full sm:w-auto sm:min-w-[160px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-white text-black px-4 py-2 pr-10 rounded-lg text-sm border border-gray-200 focus:border-black focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    <option value="created">تاريخ الإنشاء</option>
                    <option value="modified">آخر تعديل</option>
                    <option value="name">الاسم</option>
                  </select>
                  <svg
                    className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "grid" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "list" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            {isProjectsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
              </div>
            ) : (
              <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                
                {/* Create New Card */}
                <div
                  onClick={() => router.push("/")}
                  className="group bg-white border-2 border-dashed border-gray-300 hover:border-black rounded-2xl cursor-pointer transition-all min-h-[320px] flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 bg-gray-100 group-hover:bg-black rounded-2xl flex items-center justify-center transition-colors mb-4">
                    <svg className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-500 group-hover:text-black font-medium transition-colors" style={{ fontFamily: "'Zain', sans-serif" }}>
                    إنشاء سيرة جديدة
                  </p>
                </div>

                {/* Resume Cards */}
                {sortedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group bg-white border border-gray-200 hover:border-black hover:shadow-lg rounded-2xl overflow-hidden cursor-pointer transition-all"
                    onClick={() => handleEditProject(project.latest_job_id)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[8.5/11] bg-gray-50 overflow-hidden">
                      <Image
                        src={getTemplateImage(project.template_id)}
                        alt={project.name}
                        fill
                        className="object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        
                        {/* Edit Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project.latest_job_id);
                          }}
                          className="p-3 bg-white hover:bg-gray-100 rounded-xl transition-colors"
                          title="تعديل"
                        >
                          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="p-3 bg-white hover:bg-red-100 rounded-xl transition-colors"
                          title="حذف"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        {/* Download PDF Button (if available) */}
                        {project.pdf_url && (
                          <a
                            href={project.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-3 bg-white hover:bg-green-100 rounded-xl transition-colors"
                            title="تحميل PDF"
                          >
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-black font-semibold mb-1 truncate w-40" style={{ fontFamily: "'Zain', sans-serif" }}>
                            {project.name || "سيرة ذاتية جديدة"}
                          </h3>
                          <p className="text-gray-400 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>
                            {formatDate(project.updated_at)}
                          </p>
                        </div>
                        
                        {/* Status Badge */}
                        {project.latest_job_status && (
                          <span 
                            className={`px-2 py-1 text-xs rounded-full ${
                              project.latest_job_status === 'SUCCESS' 
                                ? 'bg-green-100 text-green-700' 
                                : project.latest_job_status === 'FAILED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {project.latest_job_status === 'SUCCESS' ? '✓' : project.latest_job_status === 'FAILED' ? '✗' : '...'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}