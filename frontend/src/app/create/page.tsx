"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { Loader2, Upload, Sparkles, AlertCircle, FileText, Wand2, ChevronRight, CheckCircle2, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// ==================== Example Prompts ====================
const examplePrompts = [
  {
    title: "مهندس برمجيات",
    icon: "💻",
    prompt: "مهندس برمجيات متخصص في تطوير تطبيقات الويب باستخدام React و Node.js. لدي 5 سنوات خبرة في العمل مع شركات تقنية كبيرة. أجيد Python, JavaScript, TypeScript, و Django. حاصل على بكالوريوس علوم الحاسب من جامعة الملك فهد."
  },
  {
    title: "مصمم جرافيك",
    icon: "🎨",
    prompt: "مصمم جرافيك ومبدع بصري خبرة 4 سنوات في تصميم الهويات البصرية وواجهات المستخدم. أجيد Adobe Photoshop, Illustrator, Figma. عملت على أكثر من 50 مشروع مع شركات ناشئة وكبار العملاء."
  },
  {
    title: "محاسب",
    icon: "📊",
    prompt: "محاسب معتمد خبرة 6 سنوات في المحاسبة المالية وإعداد التقارير المالية. أجيد QuickBooks, Excel, و SAP. حاصل على شهادة CMA وخبرة في التدقيق المالي."
  },
  {
    title: "مسوق رقمي",
    icon: "📱",
    prompt: "أخصائي تسويق رقمي خبرة في إدارة حملات الإعلانات الممولة وتحسين محركات البحث. أجدد Google Ads, Facebook Ads, SEO/SEM. عملت على زيادة المبيعات بنسبة 150% للشركات التي تعاملت معها."
  },
];

// ==================== Main Component ====================
export default function CreateResumePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);

  // Character count effect
  useEffect(() => {
    setCharCount(prompt.length);
  }, [prompt]);

  // --- AI Generation Handler ---
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    if (prompt.length < 50) {
      setError("يرجى كتابة تفاصيل أكثر (50 حرف على الأقل) للحصول على نتيجة جيدة.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post("/generate", {
        prompt: prompt.trim(),
        language: 'ar',
      });

      toast.success("تم إنشاء السيرة الذاتية بنجاح!");
      router.push(`/cv-editor/${data.resume_id}`);

    } catch (err: any) {
      console.error("Error generating resume:", err);
      setError(err.response?.data?.error || "حدث خطأ أثناء المعالجة، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- File Upload Handler ---
  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error("يرجى رفع ملف بصيغة PDF فقط.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/parse-cv-pdf/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("تم استيراد الملف بنجاح!");

      if (data.job_id) {
        router.push(`/cv-editor/${data.job_id}`);
      } else {
        router.push('/login');
      }

    } catch (err: any) {
      console.error("Upload Error:", err);
      setError("فشل تحليل الملف. تأكد أن الملف نصي وليس صورة ممسوحة ضوئياً.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // --- Use Example Prompt ---
  const useExample = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    setSelectedExample(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex" dir="rtl">

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 lg:p-12 overflow-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-black transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium" style={{ fontFamily: "'Zain', sans-serif" }}>العودة</span>
          </button>

          <h1
            className="text-4xl lg:text-5xl font-bold text-black mb-3"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            أنشئ سيرتك الذاتية في دقائق
          </h1>
          <p className="text-lg text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
            فقط أخبرنا عن نفسك، وسيتكفل الذكاء الاصطناعي ببناء سيرة ذاتية احترافية لك
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 lg:p-8 mb-6">

          <form onSubmit={handleGenerate} className="space-y-6">

            {/* Textarea */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: "'Zain', sans-serif" }}>
                أخبرنا عن خبراتك ومهاراتك
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={8}
                  className="w-full px-5 py-4 bg-gradient-to-br from-gray-50 to-gray-50/50 border-2 border-gray-100 focus:border-blue-500 rounded-2xl resize-none text-black placeholder-gray-400 text-base transition-all outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="مثال: أنا مهندس برمجيات لدي 5 سنوات خبرة في تطوير تطبيقات الويب. عملت في شركة Google كمطور Full Stack. أجيد JavaScript, React, Node.js..."
                  disabled={isLoading}
                  required
                  style={{ fontFamily: "'Zain', sans-serif" }}
                />
                <div className="absolute top-4 left-4">
                  <Wand2 className={`w-5 h-5 transition-colors ${prompt.length > 0 ? 'text-blue-500' : 'text-gray-300'}`} />
                </div>

                {/* Character Count */}
                <div className="absolute bottom-3 left-4">
                  <span className={`text-xs font-medium transition-colors ${
                    charCount >= 50 ? 'text-green-600' : 'text-gray-400'
                  }`} style={{ fontFamily: "'Zain', sans-serif" }}>
                    {charCount} / 50
                  </span>
                </div>
              </div>
            </div>

            {/* Example Prompts */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-3" style={{ fontFamily: "'Zain', sans-serif" }}>
                أمثلة للإلهام:
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedExample(index)}
                    className={`p-3 rounded-xl border-2 transition-all text-right hover:scale-105 hover:shadow-lg ${
                      selectedExample === index
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{example.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 block" style={{ fontFamily: "'Zain', sans-serif" }}>
                      {example.title}
                    </span>
                  </button>
                ))}
              </div>

              {selectedExample !== null && (
                <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{examplePrompts[selectedExample].icon}</span>
                      <span className="font-bold text-blue-900" style={{ fontFamily: "'Zain', sans-serif" }}>
                        {examplePrompts[selectedExample].title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedExample(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-blue-800 mb-3 leading-relaxed" style={{ fontFamily: "'Zain', sans-serif" }}>
                    {examplePrompts[selectedExample].prompt}
                  </p>
                  <button
                    type="button"
                    onClick={() => useExample(examplePrompts[selectedExample].prompt)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    استخدام هذا المثال
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium" style={{ fontFamily: "'Zain', sans-serif" }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="group w-full bg-gradient-to-l from-black via-gray-900 to-black hover:from-gray-800 hover:via-gray-800 hover:to-gray-800 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-3"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  إنشاء سيرة ذاتية
                  <ChevronRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-200 to-transparent"></div>
            <span className="text-gray-400 text-sm font-medium px-4" style={{ fontFamily: "'Zain', sans-serif" }}>
              أو استورد ملف موجود
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-200 to-transparent"></div>
          </div>

          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={isLoading}
            />

            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>

            <h3 className="text-lg font-bold text-black mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>
              اسحب وأفلت ملف PDF هنا
            </h3>
            <p className="text-gray-500 text-sm mb-4" style={{ fontFamily: "'Zain', sans-serif" }}>
              أو انقر لاختيار ملف من جهازك
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              <Upload className="w-5 h-5" />
              اختر ملف
            </button>

            <p className="mt-4 text-xs text-gray-400" style={{ fontFamily: "'Zain', sans-serif" }}>
              يدعم ملفات PDF النصية فقط (ليست صور ممسوحة ضوئياً)
            </p>
          </div>

        </div>
      </div>

      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 via-blue-100/30 to-purple-50 items-center justify-center p-12 relative overflow-hidden">

        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-200 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-8 max-w-lg">

          {/* Floating CV Preview */}
          <div className="relative mx-auto w-64 h-80">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl transform rotate-6 opacity-20"></div>
            <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <div className="p-4 text-right space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                <div className="pt-4 space-y-2">
                  <div className="h-2 bg-blue-100 rounded w-full"></div>
                  <div className="h-2 bg-blue-100 rounded w-5/6"></div>
                  <div className="h-2 bg-blue-100 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4 text-right">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
                  إنشاء بالذكاء الاصطناعي
                </h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: "'Zain', sans-serif" }}>
                  فقط اكتب عن نفسك وسيتكفل الباقي
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
                  قوالب احترافية
                </h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: "'Zain', sans-serif" }}>
                  أكثر من 50 قالب جاهز للاستخدام
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
                  تصدير فوري كـ PDF
                </h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: "'Zain', sans-serif" }}>
                  حمّل سيرتك الذاتية بجودة عالية
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
