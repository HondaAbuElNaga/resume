"use client";

import { useRef, useState, useCallback, useMemo, memo, startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import api from "@/lib/api";

// Performance: Dynamic imports for heavy components
const MagicButton = dynamic(() => import("@/components/ui/MagicButton"), { loading: () => null });
const CountUp = dynamic(() => import("@/components/ui/CountUp"), { ssr: false });
const LoadingMessage = dynamic(() => import("@/components/ui/LoadingMessage"), { ssr: false });

// Performance: Hoist static data outside component
const templateImages = [
  { src: "/templates/cv-1.png", name: "احترافي", tag: "Professional" },
  { src: "/templates/cv-2.png", name: "عصري", tag: "Modern" },
  { src: "/templates/cv-3.png", name: "إبداعي", tag: "Creative" },
  { src: "/templates/cv-4.png", name: "بسيط", tag: "Clean" },
] as const;

interface GenerateResponse {
  resume_id: string;
  status: string;
  message?: string;
}

// Performance: Memoized Template Card component
const TemplateCard = memo((
  { template, idx }: { template: typeof templateImages[number]; idx: number }
) => (
  <div
    className="w-[260px] sm:w-[300px] md:w-[340px] shrink-0 group"
    style={{ animationDelay: `${idx * 0.15}s` }}
  >
    <div className="mb-3 text-center">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {template.tag}
      </span>
      <h3 className="text-lg font-bold text-gray-900 mt-1">{template.name}</h3>
    </div>

    <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-500 cursor-pointer">
      <div className="aspect-[8.5/11] overflow-hidden bg-gray-50">
        <Image
          src={template.src}
          alt={template.name}
          width={380}
          height={500}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
          quality={100}
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 bg-gradient-to-t from-black/60 to-transparent">
          <Link
            href="/templates"
            className="block w-full text-center py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            استخدم هذا القالب
          </Link>
        </div>
      </div>
    </div>
  </div>
));
TemplateCard.displayName = "TemplateCard";

// Performance: Memoized Stat Card component
const StatCard = memo((
  { icon, value, suffix, label, delay }: {
    icon: React.ReactNode;
    value: number;
    suffix?: string;
    label: string;
    delay: number;
  }
) => (
  <div
    className="group relative bg-white rounded-2xl border border-gray-200 px-8 py-10 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-3 tracking-tight">
      <CountUp end={value} suffix={suffix} duration={2000} />
    </div>
    <p className="text-lg text-gray-600 font-medium">{label}</p>
  </div>
));
StatCard.displayName = "StatCard";

// Performance: Memoized Feature Card component
const FeatureCard = memo((
  { icon, title, description, delay }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay: number;
  }
) => (
  <div
    className="text-center group"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
));
FeatureCard.displayName = "FeatureCard";

// Performance: Memoized Testimonial Card component
const TestimonialCard = memo((
  { name, role, content, initial, color, delay }: {
    name: string;
    role: string;
    content: string;
    initial: string;
    color: string;
    delay: number;
  }
) => (
  <div
    className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-1 mb-5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <p className="text-gray-700 mb-6 leading-relaxed text-lg">"{content}"</p>
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center`}>
        <span className="text-white font-bold">{initial}</span>
      </div>
      <div>
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-gray-500 text-sm">{role}</p>
      </div>
    </div>
  </div>
));
TestimonialCard.displayName = "TestimonialCard";

// SVG Icons - hoisted outside component
const icons = {
  document: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  sparkles: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  rocket: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
  bolt: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  clock: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  upload: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
};

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  // Performance: Cache localStorage reads
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthToken(localStorage.getItem("auth_token"));
    }
  }, []);

  const templatesScrollRef = useRef<HTMLDivElement>(null);

  // Performance: Hoist event handlers
  const scrollTemplates = useCallback((direction: "prev" | "next") => {
    const el = templatesScrollRef.current;
    if (!el) return;
    const delta = direction === "next" ? 560 : -560;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    if (prompt.length < 100) {
      setError("النص قصير جداً. يرجى كتابة 100 حرف على الأقل للحصول على سيرة ذاتية دقيقة.");
      return;
    }

    if (!authToken) {
      localStorage.setItem("pending_cv_prompt", prompt.trim());
      router.push("/login?redirect=cv-creation");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post<GenerateResponse>("/generate/", {
        prompt: prompt.trim(),
        language: "ar",
      });

      // Performance: Use startTransition for non-urgent navigation
      startTransition(() => {
        router.push(`/cv-editor/${data.resume_id}`);
      });
    } catch (err: any) {
      console.error("Error generating resume:", err);

      if (err.response?.status === 429) {
        setError("لقد تجاوزت الحد اليومي المسموح به لإنشاء السير الذاتية.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.setItem("pending_cv_prompt", prompt.trim());
        router.push("/login?redirect=cv-creation");
      } else {
        setError(err.response?.data?.error || "حدث خطأ غير متوقع أثناء المعالجة. حاول مرة أخرى.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, authToken, router]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("يرجى رفع ملف بصيغة PDF فقط.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post("/parse-cv-pdf/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (data.job_id) {
        router.push(`/cv-editor/${data.job_id}`);
      } else {
        localStorage.setItem("pending_cv_data", JSON.stringify(data.cv_data));
        router.push("/login?redirect=cv-import");
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      setError(error.response?.data?.error || "فشل تحليل الملف، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  }, [router]);

  // Performance: Memoize handlers
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  }, []);

  const scrollToFeatures = useCallback(() => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* Modern Hero Section - Asymmetric Layout */}
      <div className="container mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Left: Copy (60%) */}
            <div className="lg:col-span-3 text-center lg:text-right order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-8">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-gray-700">مدعوم بالذكاء الاصطناعي</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
                أنشئ سيرتك الذاتية
                <span className="block text-blue-600 mt-2">في ثوانٍ</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-2xl">
                صمّم سيرة ذاتية احترافية مع الذكاء الاصطناعي. سرعة، دقة، وتخصيص يناسب طموحك المهني
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/templates"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  استكشف القوالب
                  <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <button
                  onClick={scrollToFeatures}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black border-2 border-gray-200 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  تعرف على المزيد
                </button>
              </div>
            </div>

            {/* Right: Form (40%) */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-100/50">
                <form onSubmit={handleGenerate} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">حدّثنا عن نفسك</h2>
                    <textarea
                      value={prompt}
                      onChange={handlePromptChange}
                      rows={8}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="مثال: أنا مهندس برمجيات لدي 5 سنوات خبرة في تطوير تطبيقات الويب. عملت في شركة Google كمطور Full Stack. أجيد JavaScript, React, Node.js, Python. حاصل على بكالوريوس علوم حاسب من جامعة الملك سعود..."
                      disabled={isLoading}
                      required
                      dir="rtl"
                    />
                    <p className="mt-3 text-sm text-gray-500 text-center">
                      كن مفصلاً قدر الإمكان (100 حرف على الأقل)
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-sm font-medium text-gray-400">أو</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  <div className="text-center">
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf,.doc,.docx,.tex,.latex"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="resume-upload"
                      className="inline-flex items-center gap-3 px-6 py-4 bg-gray-50 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {icons.upload}
                      استيراد سيرة ذاتية
                    </label>
                    <p className="mt-2 text-xs text-gray-400">يدعم PDF و DOC و LaTeX</p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center font-semibold">
                      {error}
                    </div>
                  )}

                  {isLoading && <LoadingMessage />}

                  <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="w-full bg-black text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? "جاري الإنشاء..." : "أنشئ سيرتك الذاتية"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works - Minimalist */}
      <div className="container mx-auto px-6 lg:px-8 py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">كيف يعمل؟</h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <FeatureCard
              icon={icons.document}
              title="أخبرنا عن خبرتك"
              description="أدخل معلوماتك الأساسية أو ارفع سيرتك الذاتية الحالية"
              delay={0}
            />
            <FeatureCard
              icon={icons.sparkles}
              title="دع الذكاء الاصطناعي يبدع"
              description="نحلل بياناتك ونجهز سيرتك في القالب المناسب تلقائياً"
              delay={150}
            />
            <FeatureCard
              icon={icons.rocket}
              title="انطلق لمقابلتك القادمة"
              description="احصل على سيرة ذاتية متكاملة وجذابة، جاهزة لتخطي ATS"
              delay={300}
            />
          </div>
        </div>
      </div>

      {/* Social Proof - Bold & Clean */}
      <div className="container mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-2xl md:text-3xl text-gray-700 text-center mb-16 max-w-3xl mx-auto font-medium">
            انضم إلى آلاف المستخدمين الذين أنشأوا سيرهم الذاتية معنا
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={icons.document}
              value={10000}
              suffix="+"
              label="سيرة ذاتية تم إنشاؤها"
              delay={0}
            />
            <StatCard
              icon={icons.check}
              value={98}
              suffix="%"
              label="معدل الرضا"
              delay={150}
            />
            <StatCard
              icon={icons.clock}
              value={3}
              suffix=" دقائق"
              label="متوسط وقت الإنشاء"
              delay={300}
            />
          </div>

          <div className="mt-16 text-center">
            <MagicButton
              href="/signup"
              className="inline-flex items-center justify-center px-16 py-5 text-white rounded-2xl font-bold text-xl"
            >
              ابدأ الآن مجاناً
            </MagicButton>
          </div>
        </div>
      </div>

      {/* Templates Preview - Enhanced */}
      <div className="container mx-auto px-6 lg:px-8 py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">قوالب سيرة ذاتية مجرّبة</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              استخدم قوالب يحبها مسؤولو التوظيف — وابدأ الإنشاء فوراً
            </p>
          </div>

          <div className="relative mb-12" dir="rtl">
            <button
              type="button"
              onClick={() => scrollTemplates("prev")}
              className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:border-gray-300 transition-all items-center justify-center"
              aria-label="السابق"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollTemplates("next")}
              className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:border-gray-300 transition-all items-center justify-center"
              aria-label="التالي"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              ref={templatesScrollRef}
              className="overflow-x-auto scroll-smooth no-scrollbar"
            >
              <div className="flex gap-8 px-4 py-6 min-w-max">
                {templateImages.map((template, idx) => (
                  <TemplateCard key={template.src} template={template} idx={idx} />
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              عرض جميع القوالب
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Features - Clean & Modern */}
      <div id="features" className="container mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">لماذا تختار EasyCV؟</h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <FeatureCard
              icon={icons.bolt}
              title="ذكاء اصطناعي متقدم"
              description="ينشئ سيرات ذاتية احترافية مخصصة لك في ثوانٍ"
              delay={0}
            />
            <FeatureCard
              icon={icons.clock}
              title="سريع وسهل"
              description="أنشئ سيرة ذاتية كاملة في ثوانٍ، ليس ساعات"
              delay={150}
            />
            <FeatureCard
              icon={icons.check}
              title="تنسيق احترافي"
              description="ملفات PDF جميلة تبرز أمام مسؤولي التوظيف"
              delay={300}
            />
          </div>
        </div>
      </div>

      {/* Testimonials - Modern Cards */}
      <div className="bg-gray-50 py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">ماذا يقول مستخدمونا؟</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <TestimonialCard
                name="أحمد محمد"
                role="مهندس برمجيات"
                content="ساعدني EasyCV في الحصول على وظيفة أحلامي! السيرة الذاتية كانت احترافية جداً وحصلت على مقابلات أكثر."
                initial="أ"
                color="bg-blue-600"
                delay={0}
              />
              <TestimonialCard
                name="سارة علي"
                role="مديرة تسويق"
                content="أفضل أداة لإنشاء السير الذاتية استخدمتها. سريعة وسهلة والنتيجة مذهلة. أنصح بها بشدة!"
                initial="س"
                color="bg-green-600"
                delay={150}
              />
              <TestimonialCard
                name="خالد العمري"
                role="محاسب"
                content="كنت أقضي ساعات في تنسيق سيرتي الذاتية، الآن أنجزها في دقائق. توفير وقت رائع!"
                initial="خ"
                color="bg-purple-600"
                delay={300}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ - Clean Accordion */}
      <div className="container mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">الأسئلة الشائعة</h2>
          <div className="space-y-4">
            {[
              {
                q: "هل الخدمة مجانية؟",
                a: "نعم! يمكنك إنشاء سيرتك الذاتية الأولى مجاناً. نوفر خطة مجانية تتضمن قوالب أساسية، وخطط مدفوعة للمميزات المتقدمة والقوالب الاحترافية."
              },
              {
                q: "كم يستغرق إنشاء السيرة الذاتية؟",
                a: "في المتوسط، يستغرق إنشاء سيرة ذاتية كاملة حوالي 3 دقائق فقط! ما عليك سوى إدخال معلوماتك والذكاء الاصطناعي يتولى الباقي."
              },
              {
                q: "هل يمكنني تعديل السيرة بعد إنشائها؟",
                a: "بالتأكيد! يمكنك تعديل وتحديث سيرتك الذاتية في أي وقت. كما يمكنك تجربة قوالب مختلفة حتى تجد الأنسب لك."
              },
              {
                q: "ما هي صيغ التصدير المتاحة؟",
                a: "نوفر تصدير بصيغة PDF عالية الجودة، وهي الصيغة الأكثر قبولاً من قبل أصحاب العمل وأنظمة تتبع المتقدمين (ATS)."
              },
              {
                q: "هل السيرة الذاتية متوافقة مع أنظمة ATS؟",
                a: "نعم! جميع قوالبنا مصممة لتكون متوافقة مع أنظمة تتبع المتقدمين (ATS)، مما يضمن وصول سيرتك الذاتية إلى مسؤولي التوظيف."
              }
            ].map((faq, idx) => (
              <details key={idx} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors">
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-lg text-gray-900">{faq.q}</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
