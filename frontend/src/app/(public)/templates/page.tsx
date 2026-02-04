"use client";

import { useState, useCallback, memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

// --- Types ---

interface Template {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  image: string;
  category: "recommended" | "creative" | "minimal";
  features: string[];
}

interface TemplateSection {
  id: string;
  title: string;
  subtitle: string;
  items: Template[];
  locked?: boolean;
}

// --- Data ---

const templates: Template[] = [
  {
    id: "professional",
    name: "احترافي",
    nameEn: "Professional",
    description: "تصميم كلاسيكي ومحترف مناسب لجميع المجالات",
    image: "/templates/cv-1.png",
    category: "recommended",
    features: ["تنسيق احترافي", "ألوان هادئة", "مناسب للشركات التقنية"],
  },
  {
    id: "modern",
    name: "عصري",
    nameEn: "Modern",
    description: "تصميم حديث وأنيق مع لمسات إبداعية",
    image: "/templates/cv-2.png",
    category: "recommended",
    features: ["تصميم عصري", "أقسام ملونة", "مناسب للوظائف الناشئة"],
  },
  {
    id: "creative",
    name: "إبداعي",
    nameEn: "Creative",
    description: "مثالي للمصممين والمبدعين والفنانين",
    image: "/templates/cv-3.png",
    category: "creative",
    features: ["تصميم فريد", "مساحات إبداعية", "مناسب للأعمال الحرة"],
  },
  {
    id: "minimal",
    name: "بسيط",
    nameEn: "Minimal",
    description: "تصميم نظيف وبسيط يركز على المحتوى",
    image: "/templates/cv-4.png",
    category: "minimal",
    features: ["تصميم نظيف", "تخطوط واضحة", "مناسب للأكاديميين"],
  },
];

// --- Memoized Icons ---

const icons = {
  lock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  chevronLeft: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  sparkles: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m-2-2h4m5.657 5.657a4 4 0 111.414 1.414l-2.829 2.829a4 4 0 01-1.414 1.414L5.657 18.657z" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  crown: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v6c0 1.657 3.343 3 7.5 3S18.657 8.657 19 7v-6l-9-5z" />
    </svg>
  ),
};

// --- Memoized Components ---

const TemplateCard = memo((
  { template, locked }: { template: Template; locked?: boolean }
) => (
  <div className="group relative bg-white rounded-3xl overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-all duration-500 hover:shadow-xl">
    {/* Image Container */}
    <div className="relative aspect-[8.5/11] bg-gray-100 overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <Image
        src={template.image}
        alt={template.name}
        fill
        className="w-full h-full object-contain object-top p-4 transition-transform duration-700 group-hover:scale-105"
        quality={100}
        loading="lazy"
      />

      {/* Badge */}
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-900 shadow-sm">
        {template.category === "recommended" && "موصى به"}
      </div>

      {/* Hover CTA */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
        {locked ? (
          <Link
            href="/login?redirect=/templates"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
          >
            {icons.lock}
            سجّل الدخول
          </Link>
        ) : (
          <Link
            href={`/?template=${template.id}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-xl"
          >
            استخدم هذا القالب
            {icons.arrowRight}
          </Link>
        )}
      </div>

      {/* Features tags */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {template.features.slice(0, 2).map((feature, idx) => (
          <span key={idx} className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-900 shadow-sm">
            {feature}
          </span>
        ))}
      </div>
    </div>

    {/* Info Section */}
    <div className="p-6" dir="rtl">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{template.description}</p>

      {/* Features list */}
      <ul className="flex flex-wrap gap-2 mb-5">
        {template.features.map((feature, idx) => (
          <li key={idx} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            {icons.check}
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      {locked ? (
        <Link
          href="/login?redirect=/templates"
          className="block w-full text-center py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          {icons.lock}
          يتطلب تسجيل الدخول
        </Link>
      ) : (
        <Link
          href={`/?template=${template.id}`}
          className="block w-full text-center py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
        >
          استخدم هذا القالب
        </Link>
      )}
    </div>
  </div>
));
TemplateCard.displayName = "TemplateCard";

const SectionHeader = memo((
  { title, subtitle, locked }: { title: string; subtitle?: string; locked?: boolean }
) => (
  <div className="flex items-end justify-between gap-4 mb-6">
    <div>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-gray-600 mt-2 text-lg">{subtitle}</p>}
    </div>
    {locked && (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
        {icons.lock}
        premium
      </span>
    )}
  </div>
));
SectionHeader.displayName = "SectionHeader";

const LoginCTA = memo(() => (
  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-3xl p-8 md:p-10 text-center relative overflow-hidden">
    {/* Decorative background pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, transparent 10px, #000 1px)" }}></div>
    </div>

    <div className="relative z-10">
      <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        {icons.crown}
      </div>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">قوالب متقدمة</h2>
      <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
        سجّل دخولك للحصول على قوالب إضافية مميزة
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/login?redirect=/templates"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
        >
          سجّل الدخول
          {icons.chevronLeft}
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black border-2 border-black rounded-xl font-bold hover:bg-gray-50 transition-all"
        >
          إنشاء حساب
        </Link>
      </div>
    </div>
  </div>
));
LoginCTA.displayName = "LoginCTA";

// --- Main Page ---

export default function TemplatesPage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      try {
        return (await api.get("/users/me/")).data;
      } catch (err) {
        return null;
      }
    },
    retry: false,
  });

  const isLoggedIn = !!user;

  // Performance: Memoized sections
  const templateSections: TemplateSection[] = useMemo(
    () => [
      {
        id: "recommended",
        title: "القوالب الأكثر استخداماً",
        subtitle: "اختيارات جاهزة لمعظم الوظائف والتخصصات",
        items: [templates[0], templates[1]],
      },
      {
        id: "creative",
        title: "قوالب إبداعية",
        subtitle: "مناسبة للأعمال التي تحتاج طابعاً بصرياً مميزاً",
        items: [templates[2]],
        locked: !isLoggedIn,
      },
      {
        id: "minimal",
        title: "قوالب بسيطة",
        subtitle: "تصميم نظيف يركز على المحتوى والوضوح",
        items: [templates[3]],
        locked: !isLoggedIn,
      },
    ],
    [isLoggedIn]
  );

  // Performance: Find first locked section index
  const firstLockedSectionIndex = useMemo(
    () => templateSections.findIndex((s) => s.locked && !isLoggedIn),
    [templateSections, isLoggedIn]
  );

  // Performance: Memoized scroll handlers
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">جاري تحميل القوالب...</h2>
          <p className="text-gray-500">قد يستغرق هذا بضع ثوانٍ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20 lg:py-32">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-gray-700">قوالب احترافية</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              اختر قالباً من <span className="text-blue-600">مجموعة القوالب</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-10">
              أكثر من 50 قالب سيرة ذاتية احترافي، جاهزة للاستخدام الفوري مع إمكانية التخصيص الكاملة
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
              >
                {icons.sparkles}
                ابدأ الآن
              </Link>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                عرض كل القوالب
                {icons.arrowRight}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Sections */}
      <div className="container mx-auto px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto space-y-20">
          {templateSections.map((section, idx) => {
            const isSectionLocked = section.locked;
            const showLoginCTA = isSectionLocked && idx === firstLockedSectionIndex;

            return (
              <div key={section.id} className={isSectionLocked ? "relative" : ""}>
                {showLoginCTA && <LoginCTA />}

                <SectionHeader
                  title={section.title}
                  subtitle={section.subtitle}
                  locked={isSectionLocked}
                />

                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${
                    isSectionLocked ? "opacity-60 blur-[1px] select-none pointer-events-none" : ""
                  }`}
                >
                  {section.items.map((template) => (
                    <TemplateCard key={template.id} template={template} locked={isSectionLocked} />
                  ))}
                </div>

                {/* Overlay for locked sections */}
                {isSectionLocked && (
                  <div className="absolute inset-0 rounded-inherit" aria-hidden="true"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">لماذا تستخدم قوالبنا؟</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                قوالب مصممة بعناية لتناسب معايير التوظيف وتزيد من فرص قبولك
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  {icons.check}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">متوافقة مع ATS</h3>
                <p className="text-gray-600 leading-relaxed">
                  جميع قوالبنا مصممة لاجتياز أنظمة تتبع المتقدمين بسهولة
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                  {icons.sparkles}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">تخصيص كامل</h3>
                <p className="text-gray-600 leading-relaxed">
                  غيّر ألوان وخطوط وتخطيط حسب تفضيلاتك الشخصية
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  {icons.download}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">تصدير فوري</h3>
                <p className="text-gray-600 leading-relaxed">
                  حمّل سيرتك الذاتية كـ PDF عالي الجودة في ثوانٍ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-10 md:p-12 text-center border border-gray-200 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white to-transparent opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white to-transparent opacity-50"></div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">لم تجد القالب الذي تريد؟</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
                يمكنك دائماً العودة وتعديل اختيارك لاحقاً. نحن نضيف باستمرار المزيد من القوالب الحصرية.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                >
                  {icons.sparkles}
                  ابدأ الآن
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  أو سجّل دخولك
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
