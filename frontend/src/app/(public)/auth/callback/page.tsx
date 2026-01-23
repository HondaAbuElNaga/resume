"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api"; // تأكد من استيراد الـ API client الخاص بك
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("جاري تأكيد تسجيل الدخول...");

  useEffect(() => {
    // 1. استخراج التوكن من الرابط
    // الباك اند عادة يرسله باسم 'token' أو 'key'
    const token = searchParams.get("token") || searchParams.get("key");

    if (token) {
      // 2. حفظ التوكن في localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
      }

      // 3. التحقق من وجود نص CV محفوظ (Visitor Logic)
      const pendingPrompt = localStorage.getItem("pending_cv_prompt");

      if (pendingPrompt) {
        setStatus("جاري إنشاء سيرتك الذاتية تلقائياً...");
        
        // 4. تنفيذ طلب الإنشاء فوراً
        api.post(
            "/generate-cv-with-ai/", // تأكد أن هذا هو الرابط الصحيح في backend urls
            { prompt: pendingPrompt },
            { headers: { Authorization: `Token ${token}` } } // نرسل التوكن يدوياً للتأكد
          )
          .then((res) => {
            // مسح النص المحفوظ وتوجيه للمحرر
            localStorage.removeItem("pending_cv_prompt");
            router.push(`/cv-editor/${res.data.resume_id}`);
          })
          .catch((err) => {
            console.error("فشل التوليد التلقائي", err);
            // لو فشل، نوجهه للوحة التحكم كحل بديل
            router.push("/dashboard");
          });
      } else {
        // 5. التوجيه الطبيعي للوحة التحكم
        router.push("/dashboard");
      }
    } else {
      // لو دخل الصفحة بدون توكن (خطأ)
      setStatus("فشل تسجيل الدخول. لم يتم استلام التوكن.");
      setTimeout(() => router.push("/login"), 3000);
    }
  }, [searchParams, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50">
      <Loader2 className="h-10 w-10 animate-spin text-black" />
      <h2 className="text-xl font-medium text-gray-700 font-['Tajawal']">
        {status}
      </h2>
    </div>
  );
}