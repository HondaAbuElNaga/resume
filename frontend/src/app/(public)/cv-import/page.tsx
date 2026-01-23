"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function CVImportPage() {
  const router = useRouter();
  const [status, setStatus] = useState("جاري استعادة بياناتك...");

  useEffect(() => {
    const processImport = async () => {
      // 1. استخراج البيانات من الشنطة (LocalStorage)
      const storedData = localStorage.getItem('pending_cv_data');
      
      if (!storedData) {
        // لو مفيش بيانات، نرجعه للصفحة الرئيسية
        router.push('/');
        return;
      }

      try {
        setStatus("جاري إنشاء المشروع...");
        const cvData = JSON.parse(storedData);

        // 2. إرسال البيانات للباك إند لحفظها في الداتابيز
        const { data } = await api.post('/save-imported-cv/', {
            cv_data: cvData
        });

        // 3. تنظيف الشنطة بعد النجاح
        localStorage.removeItem('pending_cv_data');

        // 4. التوجيه للمحرر
        router.push(`/cv-editor/${data.job_id}`);

      } catch (error) {
        console.error("Import failed", error);
        setStatus("حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.");
        // يمكن إضافة زر للعودة هنا
      }
    };

    // تشغيل الدالة بمجرد فتح الصفحة
    processImport();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
      <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Zain', sans-serif" }}>
        {status}
      </h2>
      <p className="text-gray-500 mt-2" style={{ fontFamily: "'Zain', sans-serif" }}>
        لا تغلق الصفحة، نحن نجهز مساحة العمل الخاصة بك.
      </p>
    </div>
  );
}