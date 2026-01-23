"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

/**
 * Templates page component.
 * 
 * Displays all available CV templates for users to preview and select.
 */

// Template data - Real templates available
const templates = [
  {
    id: "professional",
    name: "احترافي",
    description: "تصميم كلاسيكي ومحترف مناسب لجميع المجالات",
    image: "/templates/cv-1.png",
  },
  {
    id: "modern",
    name: "عصري",
    description: "تصميم حديث وأنيق مع لمسات إبداعية",
    image: "/templates/cv-2.png",
  },
  {
    id: "creative",
    name: "إبداعي",
    description: "مثالي للمصممين والمبدعين والفنانين",
    image: "/templates/cv-3.png",
  },
  {
    id: "minimal",
    name: "بسيط",
    description: "تصميم نظيف وبسيط يركز على المحتوى",
    image: "/templates/cv-4.png",
  },
];

const templateSections: {
  id: string;
  title: string;
  subtitle?: string;
  items: typeof templates;
  locked?: boolean;
}[] = [
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
    locked: true,
  },
  {
    id: "minimal",
    title: "قوالب بسيطة",
    subtitle: "تصميم نظيف يركز على المحتوى والوضوح",
    items: [templates[3]],
    locked: true,
  },
];

export default function TemplatesPage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        return (await api.get('/users/me/')).data;
      } catch (err) {
        return null; // لو فشل (مش مسجل) يرجع null
      }
    },
    retry: false, // عشان ما يحاولش كتير لو هو مش مسجل
  });

  const isLoggedIn = !!user;
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
  
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 
            className="text-4xl md:text-5xl font-bold text-black mb-4"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            قوالب السيرة الذاتية
          </h1>
          <p 
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            اختر قالباً مناسباً، ثم ابدأ إنشاء سيرتك بسهولة.
          </p>
        </div>

        {/* Template Sections (stacked, RTL) */}
        <div className="max-w-7xl mx-auto space-y-10" dir="rtl">
          {templateSections.map((section, idx) => {
            const isSectionLocked = section.locked && !isLoggedIn;
            const showLoginCTA = isSectionLocked && templateSections.findIndex((s) => s.locked && !isLoggedIn) === idx;

            return (
              <div key={section.id}>
                {/* CTA right above first locked/blurred section */}
                {showLoginCTA && (
                  <div className="mb-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm text-center">
                      <h2
                        className="text-2xl md:text-3xl font-bold text-black mb-2"
                        style={{ fontFamily: "'Zain', sans-serif" }}
                      >
                        سجّل دخولك لفتح جميع القوالب
                      </h2>
                      <p
                        className="text-gray-600 mb-5"
                        style={{ fontFamily: "'Zain', sans-serif" }}
                      >
                        بعض القوالب المتقدمة متاحة بعد تسجيل الدخول فقط.
                      </p>
                      <Link
                        href="/login?redirect=/templates"
                        className="inline-flex items-center justify-center px-10 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                        style={{ fontFamily: "'Zain', sans-serif" }}
                      >
                        تسجيل الدخول
                      </Link>
                    </div>
                  </div>
                )}

                <div className="flex items-end justify-between gap-4 mb-5">
                  <div>
                    <h2
                      className="text-2xl md:text-3xl font-bold text-black"
                      style={{ fontFamily: "'Zain', sans-serif" }}
                    >
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p
                        className="text-gray-600 mt-1"
                        style={{ fontFamily: "'Zain', sans-serif" }}
                      >
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                  {isSectionLocked && (
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm"
                      style={{ fontFamily: "'Zain', sans-serif" }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.654 0 3 .895 3 2v2a3 3 0 01-6 0v-2c0-1.105 1.346-2 3-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 11V8a5 5 0 00-10 0v3" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 11h12v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8z" />
                      </svg>
                      يتطلب تسجيل الدخول
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div
                    className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 ${
                      isSectionLocked? "opacity-70 blur-[2px] select-none" : ""
                    }`}
                  >
                    {section.items.map((template) => (
                      <TemplateCard key={template.id} template={template} locked={isSectionLocked} />
                    ))}
                  </div>

                  {/* Prevent interactions on blurred sections */}
                  {isSectionLocked && (
                    <div className="absolute inset-0" aria-hidden="true" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 max-w-4xl mx-auto">
            <h2
              className="text-2xl md:text-3xl font-bold text-black mb-3"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              جاهز لإنشاء سيرتك الذاتية؟
            </h2>
            <p
              className="text-gray-600 mb-6 max-w-xl mx-auto"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              اختر قالباً ثم ابدأ الإنشاء في دقائق.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                ابدأ الآن
              </Link>
            </div>
          </div>
        </div>
      </div>
      

    </div>
  );
}

/**
 * Template Card Component
 */
function TemplateCard({ template, locked = false }: { template: typeof templates[0]; locked?: boolean }) {
  return (
    <div className="group bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[8.5/11] bg-gray-50 overflow-hidden">
        <Image
          src={template.image}
          alt={template.name}
          fill
          className="object-contain object-top p-3"
          quality={100}
        />
      </div>

      {/* Template Info */}
      <div className="p-5" dir="rtl">
        <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>
          {template.name}
        </h3>
        <p 
          className="text-sm text-gray-600 mb-4"
          style={{ fontFamily: "'Zain', sans-serif" }}
        >
          {template.description}
        </p>

        {locked ? (
          <Link
            href="/login"
            className="block w-full text-center py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            سجّل الدخول لاستخدامه
          </Link>
        ) : (
          <Link
            href={`/?template=${template.id}`}
            className="block w-full text-center py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            استخدم هذا القالب
          </Link>
        )}
      </div>
    </div>
  );
}

