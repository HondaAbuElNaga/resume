"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
// ✅ استيراد مكتبة الاتصال بالباك اند بدلاً من الـ fetch العادي
import api from "@/lib/api"; 
import MagicButton from "@/components/ui//MagicButton";
import CountUp from "@/components/ui/CountUp";
import LoadingMessage from "@/components/ui/LoadingMessage";


// Template images configuration
const templateImages = [
  { src: "/templates/cv-1.png", name: "احترافي", tag: "Professional" },
  { src: "/templates/cv-2.png", name: "عصري", tag: "Modern" },
  { src: "/templates/cv-3.png", name: "إبداعي", tag: "Creative" },
  { src: "/templates/cv-4.png", name: "بسيط", tag: "Clean" },
];

/**
 * Interface for the API Response
 */
interface GenerateResponse {
  resume_id: string;
  status: string;
  message?: string;
}

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const templatesScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollTemplates = (direction: "prev" | "next") => {
    const el = templatesScrollRef.current;
    if (!el) return;
    const delta = direction === "next" ? 520 : -520;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  /**
   * Handle form submission.
   * Connects to Django Backend: POST /api/generate-cv-with-ai/
   */
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Basic Validation
    if (!prompt.trim()) return;

    // 2. Length Validation (Matching Backend Rule: 100 chars)
    if (prompt.length < 100) {
        setError("النص قصير جداً. يرجى كتابة 100 حرف على الأقل للحصول على سيرة ذاتية دقيقة.");
        return;
    }

    // 3. Auth Check (Visitor Pattern)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
        // حفظ النص للمستخدم غير المسجل وتوجيهه للدخول
        localStorage.setItem('pending_cv_prompt', prompt.trim());
        router.push('/login?redirect=cv-creation');
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // 4. API Call to Django
      // Endpoint mapped from cv_views.py
      const { data } = await api.post<GenerateResponse>("/generate-cv-with-ai/", { 
        prompt: prompt.trim(),
        language: 'ar', // Default to Arabic based on UI direction
        // template_id: can be passed if a specific template is selected
      });

      // 5. Success Redirect
      // Redirect to the Editor with the job/resume ID returned by Celery task logic
      router.push(`/cv-editor/${data.resume_id}`);

    } catch (err: any) {
      console.error("Error generating resume:", err);

      // 6. Advanced Error Handling
      if (err.response?.status === 429) {
          setError("لقد تجاوزت الحد اليومي المسموح به لإنشاء السير الذاتية.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
          // Token expired or invalid
          localStorage.setItem('pending_cv_prompt', prompt.trim());
          router.push('/login?redirect=cv-creation');
      } else {
          // General errors from Backend (validation, server error)
          setError(err.response?.data?.error || "حدث خطأ غير متوقع أثناء المعالجة. حاول مرة أخرى.");
      }
    } finally {
      setIsLoading(false);
    }
  };
    // handel file upload for pdf parsing
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      // 1. إرسال الملف للباك إند
      const { data } = await api.post('/parse-cv-pdf/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 2. النجاح! البيانات رجعت
      console.log("Extracted Data:", data.cv_data);

      // 3. التوجيه لصفحة المحرر مع الـ ID
      // صفحة المحرر هتفتح وتسحب البيانات دي من الـ Job ID
      router.push(`/cv-editor/${data.job_id}`);

    } catch (error) {
      alert("فشل تحليل الملف، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-50/50 to-white">

      
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center mb-16">
          {/* Arabic Headline */}
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            انشأ سيرتك الذاتية في ثواني باستخدام الذكاء الاصطناعي
          </h1>
          
          {/* English Tagline */}
          <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto"
              style={{ fontFamily: "'Zain', sans-serif" }}>
          صمّم سيرة ذاتية احترافية في ثوانٍ بالذكاء الاصطناعي. سرعة، دقة، وتخصيص يناسب طموحك المهني
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/templates"
              className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              استكشف القوالب الجاهزة
            </Link>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3 bg-white text-black border border-black rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              
              تعرف على المزيد 
            </button>
          </div>
        </div>

        {/* Resume Form Section / Templates */}
        <div id="templates" className="max-w-3xl mx-auto">
          <div className="bg-[#FAF9F6] border border-black rounded-2xl p-6 md:p-8 shadow-lg">
            {/* Form */}
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label 
                  htmlFor="prompt" 
                  className="block text-center text-black font-bold mb-4 text-2xl md:text-3xl"
                  dir="rtl"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  حدثنا عن نفسك
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-4 bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none text-black placeholder-gray-400"
                    placeholder="مثال: أنا مهندس برمجيات لدي 5 سنوات خبرة في تطوير تطبيقات الويب. عملت في شركة Google كمطور Full Stack. أجيد JavaScript, React, Node.js, Python. حاصل على بكالوريوس علوم حاسب من جامعة الملك سعود..."
                    disabled={isLoading}
                    required
                    dir="rtl"
                  />
                </div>
                <p 
                  className="mt-2 text-sm text-gray-600 text-center" 
                  dir="rtl"
                  style={{ fontFamily: "'Zain', sans-serif", fontSize: "14px" }}
                >
                  كن مفصلاً قدر الإمكان (100 حرف على الأقل). اذكر خبراتك، الشركات، التعليم، والمهارات.
                </p>

                {/* Divider */}
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span 
                    className="text-gray-500 text-sm"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    أو
                  </span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* Import Resume Button */}
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-colors"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
                      />
                    </svg>
                    استيراد سيرة ذاتية موجودة
                  </label>
                  <p 
                    className="mt-2 text-xs text-gray-400"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                    dir="rtl"
                  >
                    يدعم PDF و DOC و LaTeX
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center font-bold">
                  {error}
                </div>
              )}

              {isLoading && <LoadingMessage />}

              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-black text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                {isLoading ? (
                  <span className="text-gradient-animate text-lg font-bold">
                    جاري إنشاء سيرتك الذاتية ...
                  </span>
                ) : (
                  "انشئ سيرتك الذاتية"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-6 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto" dir="rtl">
          <h2 
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-black"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            كيف يعمل؟
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="relative">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 
                className="font-bold text-lg mb-2 text-black"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                أخبرنا عن خبرتك
              </h3>
              <p 
                className="text-gray-600 text-sm leading-relaxed"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                أدخل معلوماتك الأساسية أو ارفع سيرتك الذاتية 
              </p>
            </div>
            <div className="relative">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 
                className="font-bold text-lg mb-2 text-black"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                دع الذكاء الاصطناعي يبدع
              </h3>
              <p 
                className="text-gray-600 text-sm leading-relaxed"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                نقوم بتحليل بياناتك، وتجهيز سيرتك في القالب المناسب تلقائياً
              </p>
            </div>
            <div className="relative">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <h3 
                className="font-bold text-lg mb-2 text-black"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                انطلق لمقابلتك القادمة
              </h3>
              <p 
                className="text-gray-600 text-sm leading-relaxed"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                احصل على سيرة ذاتية متكاملة وجذابة ، جاهزة لتخطي  (ATS)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div id="about" className="container mx-auto px-6 py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto text-center" dir="rtl">
          <p 
            className="text-gray-700 mb-10 md:mb-12 text-xl md:text-2xl"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            انضم إلى آلاف المستخدمين الذين أنشأوا سيرهم الذاتية معنا
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-7 md:px-8 md:py-9 flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <CountUp 
                end={10000}
                prefix="+"
                duration={2000}
                className="text-4xl md:text-5xl font-bold text-black block"
                style={{ fontFamily: "'Zain', sans-serif" }}
              />
              <p 
                className="text-base md:text-lg text-gray-600 mt-2"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                سيرة ذاتية تم إنشاؤها
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-7 md:px-8 md:py-9 flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CountUp 
                end={98}
                suffix="%"
                duration={1500}
                className="text-4xl md:text-5xl font-bold text-black block"
                style={{ fontFamily: "'Zain', sans-serif" }}
              />
              <p 
                className="text-base md:text-lg text-gray-600 mt-2"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                معدل الرضا
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-7 md:px-8 md:py-9 flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-black block" style={{ fontFamily: "'Zain', sans-serif" }}>
                <CountUp 
                  end={3}
                  duration={1000}
                  suffix=" دقائق"
                />
              </div>
              <p 
                className="text-base md:text-lg text-gray-600 mt-2"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                متوسط وقت الإنشاء
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-14 md:mt-16">
            <MagicButton
              href="/signup"
              className="inline-flex items-center justify-center px-14 py-5 text-white rounded-2xl font-bold text-xl"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              <span className="relative z-10">ابدأ الآن مجاناً</span>
            </MagicButton>
          </div>
        </div>
      </div>

      {/* Templates Preview Section */}
      <div id="templates-preview" className="container mx-auto px-6 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12" dir="rtl">
            <h2 
              className="text-3xl md:text-4xl font-bold text-black mb-4"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              قوالب سيرة ذاتية مجرّبة
            </h2>
            <p 
              className="text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              استخدم قوالب يحبها مسؤولو التوظيف — وابدأ الإنشاء فوراً.
            </p>
          </div>

          {/* Templates Carousel (like your screenshot) */}
          <div className="relative mb-10" dir="rtl">
            {/* Controls */}
            <button
              type="button"
              onClick={() => scrollTemplates("prev")}
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all items-center justify-center text-gray-700 hover:text-black"
              aria-label="السابق"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollTemplates("next")}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all items-center justify-center text-gray-700 hover:text-black"
              aria-label="التالي"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              ref={templatesScrollRef}
              className="overflow-x-auto scroll-smooth no-scrollbar"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex gap-6 md:gap-8 px-2 py-4 min-w-max">
                {templateImages.map((template, idx) => (
                  <div
                    key={template.src}
                    className="w-[220px] sm:w-[260px] md:w-[300px] shrink-0 template-card-motion"
                    style={{
                      animationDelay: `${idx * 0.25}s, ${idx * 0.45}s`,
                    }}
                  >
                    <div className="mb-2 text-center">
                      <div className="text-xs text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
                        {template.tag}
                      </div>
                      <div className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Zain', sans-serif" }}>
                        {template.name}
                      </div>
                    </div>

                    <div className="group bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer relative">
                      <div className="aspect-[8.5/11] overflow-hidden bg-gray-50 relative">
                        <Image
                          src={template.src}
                          alt={template.name}
                          width={340}
                          height={460}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          quality={100}
                        />
                        {/* Hover CTA */}
                        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <Link
                            href="/templates"
                            className="block w-full text-center py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg"
                            style={{ fontFamily: "'Zain', sans-serif" }}
                          >
                            استخدم هذا القالب
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              عرض جميع القوالب
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto" dir="rtl">
          <h2 
            className="text-3xl font-bold text-center mb-12 text-black"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            لماذا تختار EasyCV؟
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>ذكاء اصطناعي متقدم</h3>
              <p className="text-gray-600 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>الذكاء الاصطناعي ينشئ سيرات ذاتية احترافية مخصصة لك.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>سريع وسهل</h3>
              <p className="text-gray-600 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>أنشئ سيرة ذاتية كاملة في ثوانٍ، وليس ساعات.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>تنسيق احترافي</h3>
              <p className="text-gray-600 text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>ملفات PDF جميلة تبرز أمام مسؤولي التوظيف.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto" dir="rtl">
            <h2 
              className="text-3xl font-bold text-center mb-12 text-black"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              ماذا يقول مستخدمونا؟
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Testimonial 1 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p 
                  className="text-gray-600 text-sm mb-4 leading-relaxed"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  "ساعدني EasyCV في الحصول على وظيفة أحلامي! السيرة الذاتية كانت احترافية جداً وحصلت على مقابلات أكثر."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">أ</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>أحمد محمد</p>
                    <p className="text-gray-500 text-xs" style={{ fontFamily: "'Zain', sans-serif" }}>مهندس برمجيات</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p 
                  className="text-gray-600 text-sm mb-4 leading-relaxed"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  "أفضل أداة لإنشاء السير الذاتية استخدمتها. سريعة وسهلة والنتيجة مذهلة. أنصح بها بشدة!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">س</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>سارة علي</p>
                    <p className="text-gray-500 text-xs" style={{ fontFamily: "'Zain', sans-serif" }}>مديرة تسويق</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p 
                  className="text-gray-600 text-sm mb-4 leading-relaxed"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  "كنت أقضي ساعات في تنسيق سيرتي الذاتية، الآن أنجزها في دقائق. توفير وقت رائع!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">خ</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ fontFamily: "'Zain', sans-serif" }}>خالد العمري</p>
                    <p className="text-gray-500 text-xs" style={{ fontFamily: "'Zain', sans-serif" }}>محاسب</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto" dir="rtl">
          <h2 
            className="text-3xl font-bold text-center mb-12 text-black"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            الأسئلة الشائعة
          </h2>
          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
              <summary 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                <span className="font-semibold text-gray-900">هل الخدمة مجانية؟</span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p 
                className="px-5 pb-5 text-gray-600 text-sm leading-relaxed"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                نعم! يمكنك إنشاء سيرتك الذاتية الأولى مجاناً. نوفر خطة مجانية تتضمن قوالب أساسية، وخطط مدفوعة للمميزات المتقدمة والقوالب الاحترافية.
              </p>
            </details>

            {/* FAQ Item 2 */}
            <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
              <summary 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                <span className="font-semibold text-gray-900">كم يستغرق إنشاء السيرة الذاتية؟</span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p 
                className="px-5 pb-5 text-gray-600 text-sm leading-relaxed"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                في المتوسط، يستغرق إنشاء سيرة ذاتية كاملة حوالي 3 دقائق فقط! ما عليك سوى إدخال معلوماتك والذكاء الاصطناعي يتولى الباقي.
              </p>
            </details>

            {/* FAQ Item 3 */}
            <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
              <summary 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                <span className="font-semibold text-gray-900">هل يمكنني تعديل السيرة بعد إنشائها؟</span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p 
                className="px-5 pb-5 text-gray-600 text-sm leading-relaxed"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                بالتأكيد! يمكنك تعديل وتحديث سيرتك الذاتية في أي وقت. كما يمكنك تجربة قوالب مختلفة حتى تجد الأنسب لك.
              </p>
            </details>

            {/* FAQ Item 4 */}
            <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
              <summary 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                <span className="font-semibold text-gray-900">ما هي صيغ التصدير المتاحة؟</span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p 
                className="px-5 pb-5 text-gray-600 text-sm leading-relaxed"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                نوفر تصدير بصيغة PDF عالية الجودة، وهي الصيغة الأكثر قبولاً من قبل أصحاب العمل وأنظمة تتبع المتقدمين (ATS).
              </p>
            </details>

            {/* FAQ Item 5 */}
            <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
              <summary 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                <span className="font-semibold text-gray-900">هل السيرة الذاتية متوافقة مع أنظمة ATS؟</span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p 
                className="px-5 pb-5 text-gray-600 text-sm leading-relaxed"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                نعم! جميع قوالبنا مصممة لتكون متوافقة مع أنظمة تتبع المتقدمين (ATS)، مما يضمن وصول سيرتك الذاتية إلى مسؤولي التوظيف.
              </p>
            </details>
          </div>
        </div>
      </div>

    </div>
  );
}