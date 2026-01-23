"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api"; 
import { Loader2, Mail, Lock, User, ArrowLeft, ShieldCheck } from "lucide-react";
import AnimatedTemplates from "@/components/ui/AnimatedTemplates";

/**
 * ✅ صفحة إنشاء الحساب (Register)
 * تتوافق مع نظام Django DRF وتدعم التصميم المتجاوب
 */
export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    setIsLoading(true);
    
    try {
      /** * إرسال طلب التسجيل
       * يتم إرسال fullName كـ username ليتوافق مع User Model في Django
       */
      const { data } = await api.post("/register/", {
        username: fullName,
        email: email,
        password: password
      });

      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        router.push("/dashboard");
      } else {
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      // استخراج رسالة الخطأ من السيرفر أو عرض رسالة افتراضية
      const serverError = err.response?.data?.error || "حدث خطأ أثناء إنشاء الحساب. تأكد من البيانات.";
      setError(serverError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-zain bg-white" dir="rtl">
      {/* الجانب الأيمن - Animated Templates (يختفي في الموبايل) */}
      <div className="hidden lg:flex lg:w-[60%] xl:w-[65%] bg-slate-50 relative overflow-hidden border-l border-gray-100">
        <AnimatedTemplates />
      </div>

      {/* الجانب الأيسر - نموذج التسجيل */}
      <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col bg-white shadow-2xl z-10 relative">
        {/* شعار الموقع (Logo) */}
        <div className="absolute top-8 right-8 lg:right-12">
          <Link href="/" className="text-3xl font-black tracking-tighter text-black">
            Easy<span className="text-green-600">CV</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-12 mt-10">
          <div className="mb-10 text-right">
            <h1 className="text-3xl font-black text-slate-900 mb-3">إنشاء حساب جديد</h1>
            <p className="text-slate-500 font-medium">ابدأ الآن في بناء سيرتك الذاتية باحترافية.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* حقل الاسم الكامل */}
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-slate-700 mr-1">الاسم الكامل</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pr-11 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all duration-200"
                  placeholder="أدخل اسمك الكامل"
                />
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={20} />
              </div>
            </div>

            {/* حقل البريد الإلكتروني */}
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-slate-700 mr-1">البريد الإلكتروني</label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-11 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all duration-200"
                  placeholder="name@example.com"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={20} />
              </div>
            </div>

            {/* حقل كلمة المرور */}
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-slate-700 mr-1">كلمة المرور</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-11 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={20} />
              </div>
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-slate-700 mr-1">تأكيد كلمة المرور</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pr-11 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all duration-200"
                  placeholder="أعد كتابة كلمة المرور"
                />
                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={20} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 mt-6 shadow-xl shadow-slate-200"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <>
                  <span className="text-lg">إنشاء الحساب</span>
                  <ArrowLeft size={20} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-green-700 font-bold hover:underline underline-offset-4 decoration-2">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}