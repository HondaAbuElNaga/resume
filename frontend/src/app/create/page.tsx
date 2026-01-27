"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api"; 
import { Loader2, Upload, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner"; // لعرض التنبيهات بشكل جميل

export default function CreateResumePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  // --- 1. معالجة النص (AI Generation) ---
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    if (prompt.length < 50) {
        setError("يرجى كتابة تفاصيل أكثر (100 حرف على الأقل) للحصول على نتيجة جيدة.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // إرسال النص للباك إند
      const { data } = await api.post("/generate", { 
        prompt: prompt.trim(),
        language: 'ar', 
      });

      toast.success("تم إنشاء السيرة الذاتية بنجاح!");
      // توجيه للمحرر
      router.push(`/cv-editor/${data.resume_id}`);

    } catch (err: any) {
      console.error("Error generating resume:", err);
      setError(err.response?.data?.error || "حدث خطأ أثناء المعالجة، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. معالجة رفع الملف (PDF Import) ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      
      // التوجيه للمحرر بالـ Job ID الجديد
      if (data.job_id) {
          router.push(`/cv-editor/${data.job_id}`);
      } else {
          // حالة نادرة لو المستخدم مش مسجل (بس المفروض الصفحة دي محمية)
          router.push('/login');
      }

    } catch (err: any) {
      console.error("Upload Error:", err);
      setError("فشل تحليل الملف. تأكد أن الملف نصي وليس صورة ممسوحة ضوئياً.");
    } finally {
      setIsLoading(false);
      // تصفير الإنبوت
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" dir="rtl">
      
      {/* Container Card */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-white p-8 pb-0 text-center">
          <h1 
            className="text-3xl md:text-4xl font-bold text-black mb-2"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            حدثنا عن نفسك
          </h1>
          <p className="text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
            سنقوم ببناء سيرة ذاتية احترافية لك بناءً على معلوماتك
          </p>
        </div>

        <div className="p-8 pt-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            
            {/* Textarea Area */}
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                className="w-full px-5 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-black resize-none text-black placeholder-gray-400 text-lg transition-all outline-none"
                placeholder="مثال: أنا مهندس برمجيات لدي 5 سنوات خبرة في تطوير تطبيقات الويب. عملت في شركة Google كمطور Full Stack. أجيد JavaScript, React, Node.js..."
                disabled={isLoading}
                required
                style={{ fontFamily: "'Zain', sans-serif" }}
              />
              {/* Hint Icon */}
              <div className="absolute top-4 left-4 text-gray-400">
                <Sparkles className="w-5 h-5 opacity-50" />
              </div>
            </div>

            {/* Hint Text */}
            <p className="text-center text-sm text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
              كن مفصلاً قدر الإمكان (50 حرف على الأقل). اذكر خبراتك، الشركات، التعليم، والمهارات.
            </p>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-gray-400 text-sm font-medium" style={{ fontFamily: "'Zain', sans-serif" }}>أو</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Upload Button */}
            <div className="text-center">
              <input
                type="file"
                id="resume-upload"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
              <label
                htmlFor="resume-upload"
                className={`inline-flex items-center gap-3 px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                <Upload className="w-5 h-5" />
                استيراد سيرة ذاتية موجودة
              </label>
              <p className="mt-2 text-xs text-gray-400" style={{ fontFamily: "'Zain', sans-serif" }}>
                يدعم PDF (يتم استخراج النصوص تلقائياً)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full bg-black text-white py-4 px-6 rounded-xl font-bold text-xl hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/5"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                "انشئ سيرتك الذاتية"
              )}
            </button>

          </form>
        </div>
      </div>
      
      {/* Back Link */}
      <button 
        onClick={() => router.back()}
        className="mt-6 text-gray-400 hover:text-black transition-colors text-sm font-medium"
        style={{ fontFamily: "'Zain', sans-serif" }}
      >
        العودة للخلف
      </button>

    </div>
  );
}