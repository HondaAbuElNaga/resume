"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2, FileText, Briefcase, Mail, Crown, Settings, LogOut, Bell, Plus, Grid3X3, List, MoreVertical, Download, Trash2, Edit3, Sparkles, Search, Clock, TrendingUp, Award, Zap } from "lucide-react";
import { toast } from "sonner";

// ==================== Types ====================
interface Project {
  id: string;
  name: string;
  latest_job_id: string | null;
  template_id: string | null;
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
const icons = {
  dashboard: <Grid3X3 className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  template: <FileText className="w-5 h-5" />,
  review: <Award className="w-5 h-5" />,
  tips: <Zap className="w-5 h-5" />,
};

// ==================== Navigation ====================
const navItems = [
  { id: "dashboard", label: "لوحة التحكم", icon: "dashboard", href: "/dashboard" },
  { id: "ai-agent", label: "مساعد الذكاء الاصطناعي", icon: "sparkles", href: "/", badge: "جديد" },
  { id: "templates", label: "القوالب", icon: "template", href: "/templates" },
  { id: "review", label: "مراجعة سيرتي", icon: "review", href: "/review" },
  { id: "tips", label: "نصائح وإرشادات", icon: "tips", href: "/tips" },
];

// ==================== Helper Functions ====================
const getTemplateImage = (templateId: string | null): string => {
  const templateMap: Record<string, string> = {
    "1": "/templates/cv-1.png",
    "2": "/templates/cv-2.png",
    "3": "/templates/cv-3.png",
    "4": "/templates/cv-4.png",
  };
  return templateMap[templateId || "1"] || "/templates/cv-1.png";
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "أمس";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;

  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// ==================== Skeleton Components ====================
const ProjectCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="aspect-[8.5/11] bg-gradient-to-br from-gray-100 to-gray-50"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-100 rounded-lg w-3/4"></div>
      <div className="h-3 bg-gray-50 rounded-lg w-1/2"></div>
    </div>
  </div>
);

// ==================== Main Component ====================
export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("resumes");
  const [sortBy, setSortBy] = useState("created");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ==================== API Queries ====================

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => (await api.get('/auth/users/me/')).data,
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: async () => (await api.get('/user-stats/')).data,
  });

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects/');
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });

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
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // ==================== Render ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex" dir="rtl">

      {/* ==================== Sidebar ==================== */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-l border-gray-100 flex flex-col shadow-sm sticky top-0 h-screen">

        {/* Logo */}
        <div className="p-6 border-b border-gray-100/50">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <span className="text-xl font-bold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
                Easy<span className="text-blue-600">CV</span>
              </span>
              <p className="text-xs text-gray-400" style={{ fontFamily: "'Zain', sans-serif" }}>لوحة التحكم</p>
            </div>
          </Link>
        </div>

        {/* Create Button */}
        <div className="p-4">
          <button
            onClick={() => router.push("/")}
            className="group relative w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-black hover:bg-gray-900 text-white rounded-2xl font-medium transition-all hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            إنشاء سيرة جديدة
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  item.id === "dashboard"
                    ? "bg-gradient-to-l from-blue-50 to-blue-50/50 text-black border border-blue-100 shadow-sm"
                    : "text-gray-500 hover:text-black hover:bg-gray-50"
                }`}
              >
                <span className={item.id === "dashboard" ? "text-blue-600" : "text-gray-400 group-hover:text-black transition-colors"}>
                  {Icon}
                </span>
                <span className="font-medium" style={{ fontFamily: "'Zain', sans-serif" }}>{item.label}</span>
                {item.badge && (
                  <span className="mr-auto px-2.5 py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs rounded-full font-medium shadow-sm shadow-blue-200">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Stats */}
        <div className="p-5 border-t border-gray-100/50 space-y-5">

          {/* Usage Stats Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-4">

            {/* Total CVs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 flex items-center gap-2" style={{ fontFamily: "'Zain', sans-serif" }}>
                  <FileText className="w-4 h-4" />
                  السير الذاتية
                </span>
                <span className="text-black font-bold">{userStats?.total_cvs || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-l from-blue-600 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((userStats?.total_cvs || 0) / 20) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* AI Generation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 flex items-center gap-2" style={{ fontFamily: "'Zain', sans-serif" }}>
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  التوليد بالذكاء الاصطناعي
                </span>
                <span className="text-black font-bold">
                  {userStats?.today_count || 0} / {userStats?.daily_limit || 10}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (userStats?.today_count || 0) >= (userStats?.daily_limit || 10)
                      ? 'bg-gradient-to-r from-red-500 to-red-400'
                      : 'bg-gradient-to-r from-purple-600 to-purple-500'
                  }`}
                  style={{ width: `${((userStats?.today_count || 0) / (userStats?.daily_limit || 10)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Upgrade Button */}
          {!userProfile?.is_premium && (
            <button
              className="group relative w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-l from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:via-amber-500 hover:to-yellow-600 text-white rounded-2xl font-medium transition-all shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 hover:-translate-y-0.5 overflow-hidden"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <Crown className="w-5 h-5 relative z-10" />
              <span className="relative z-10">ترقية للخطة المميزة</span>
            </button>
          )}
        </div>
      </aside>

      {/* ==================== Main Content ==================== */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Header */}
        <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-gray-100/50 flex items-center justify-between px-8 sticky top-0 z-40">

          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
              مرحباً، {userProfile?.username || "عودتك"} 👋
            </h1>
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
              {userStats?.total_cvs || 0} سيرة ذاتية • ماذا تريد أن تصنع اليوم؟
            </p>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">

            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث..."
                className="w-64 pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                style={{ fontFamily: "'Zain', sans-serif" }}
              />
            </div>

            {/* Notifications */}
            <button className="relative p-3 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  {userProfile?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
                    {userProfile?.username || "المستخدم"}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                    {userProfile?.is_premium ? (
                      <><Crown className="w-3 h-3 text-amber-500" /> الخطة المميزة</>
                    ) : (
                      "الخطة المجانية"
                    )}
                  </p>
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 bg-gradient-to-b from-gray-50 to-white">
                      <p className="font-semibold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
                        {userProfile?.username}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{userProfile?.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        <span style={{ fontFamily: "'Zain', sans-serif" }}>الإعدادات</span>
                      </Link>
                      <button
                        onClick={() => {
                          localStorage.removeItem("auth_token");
                          router.push("/login");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span style={{ fontFamily: "'Zain', sans-serif" }}>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <button
              onClick={() => router.push('/')}
              className="group bg-white border-2 border-gray-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 rounded-3xl p-6 transition-all duration-300 text-right"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-200">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-black font-bold text-lg mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                    مساعد الذكاء الاصطناعي
                  </h3>
                  <p className="text-gray-500 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>
                    أقوى أداة لإنشاء السير الذاتية
                  </p>
                </div>
              </div>
            </button>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 opacity-60">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-black font-bold text-lg mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                    البحث عن وظائف
                  </h3>
                  <p className="text-gray-500 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>قريباً</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 opacity-60">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-black font-bold text-lg mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                    خطابات التغطية
                  </h3>
                  <p className="text-gray-500 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>قريباً</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumes Section */}
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-black mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                  السير الذاتية
                </h2>
                <p className="text-gray-500 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>
                  {projects.length} سيرة ذاتية
                </p>
              </div>

              <div className="flex items-center gap-3">

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white text-black px-4 py-2.5 pr-10 rounded-xl text-sm border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all hover:border-gray-300"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  <option value="created">تاريخ الإنشاء</option>
                  <option value="modified">آخر تعديل</option>
                  <option value="name">الاسم</option>
                </select>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2.5 rounded-xl transition-all ${
                      viewMode === "grid" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black"
                    }`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 rounded-xl transition-all ${
                      viewMode === "list" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black"
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            {isProjectsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>

                {/* Create New Card */}
                <div
                  onClick={() => router.push("/")}
                  className="group relative bg-white border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 rounded-3xl cursor-pointer transition-all duration-300 min-h-[360px] flex flex-col items-center justify-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="w-20 h-20 bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-blue-600 rounded-3xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-90 mb-5 shadow-lg">
                    <Plus className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-gray-500 group-hover:text-black font-semibold text-lg transition-colors relative z-10" style={{ fontFamily: "'Zain', sans-serif" }}>
                    إنشاء سيرة جديدة
                  </p>
                </div>

                {/* Resume Cards */}
                {sortedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 border border-gray-100 hover:border-gray-200"
                    onClick={() => handleEditProject(project.latest_job_id)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[8.5/11] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      <Image
                        src={getTemplateImage(project.template_id)}
                        alt={project.name}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6 gap-3">

                        {/* Edit Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project.latest_job_id);
                          }}
                          className="p-3 bg-white hover:bg-blue-50 rounded-2xl transition-all hover:scale-110 shadow-lg"
                          title="تعديل"
                        >
                          <Edit3 className="w-5 h-5 text-black" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="p-3 bg-white hover:bg-red-50 rounded-2xl transition-all hover:scale-110 shadow-lg"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>

                        {/* Download PDF */}
                        {project.pdf_url && (
                          <a
                            href={project.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-3 bg-white hover:bg-green-50 rounded-2xl transition-all hover:scale-110 shadow-lg"
                            title="تحميل PDF"
                          >
                            <Download className="w-5 h-5 text-green-500" />
                          </a>
                        )}
                      </div>

                      {/* Status Badge */}
                      {project.latest_job_status && (
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-md shadow-lg ${
                              project.latest_job_status === 'SUCCESS'
                                ? 'bg-green-500/90 text-white'
                                : project.latest_job_status === 'FAILED'
                                ? 'bg-red-500/90 text-white'
                                : 'bg-yellow-500/90 text-white'
                            }`}
                            style={{ fontFamily: "'Zain', sans-serif" }}
                          >
                            {project.latest_job_status === 'SUCCESS' ? '✓ مكتمل' : project.latest_job_status === 'FAILED' ? '✗ فشل' : '⏳ قيد المعالجة'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-black font-bold mb-2 truncate text-lg"
                            style={{ fontFamily: "'Zain', sans-serif" }}
                          >
                            {project.name || "سيرة ذاتية جديدة"}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-400 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>
                            <Clock className="w-4 h-4" />
                            {formatDate(project.updated_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isProjectsLoading && projects.length === 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>
                  لا توجد سير ذاتية بعد
                </h3>
                <p className="text-gray-500 mb-6" style={{ fontFamily: "'Zain', sans-serif" }}>
                  ابدأ في إنشاء سيرتك الذاتية الأولى باستخدام الذكاء الاصطناعي
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-2xl font-medium transition-all hover:shadow-xl"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  <Sparkles className="w-5 h-5" />
                  إنشاء سيرة ذاتية
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
