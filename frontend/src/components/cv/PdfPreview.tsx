"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

interface PdfPreviewProps {
  resumeId: string;
}

/**
 * PDF preview component.
 * Updated to work with Django + Celery async workflow.
 */
export default function PdfPreview({ resumeId }: PdfPreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  /**
   * دالة فحص حالة الملف من السيرفر
   */
  const checkJobStatus = useCallback(async () => {
    try {
      // نستخدم الـ ID للتحقق من حالة المهمة في الـ Backend
      const { data } = await api.get(`/check-job-status/${resumeId}/`);
      
      if (data.status === 'SUCCESS' && data.pdf_url) {
        // تم الانتهاء بنجاح
        setPdfUrl(data.pdf_url); // حفظ الرابط القادم من السيرفر
        setPdfError(null);
        setIsChecking(false);
      } else if (data.status === 'FAILED') {
        // حدث خطأ في السيرفر
        setPdfError(data.error || "The PDF file could not be generated.");
        setIsChecking(false);
      } else {
        // ما زال قيد المعالجة (QUEUED أو PROCESSING)
        setIsChecking(true);
        // نعيد الفحص بعد ثانيتين
        setTimeout(checkJobStatus, 2000);
      }
    } catch (err) {
      console.error(err);
      setPdfError("Unable to check PDF availability");
      setIsChecking(false);
    }
  }, [resumeId]);

  // تشغيل الفحص عند التحميل أو عند الضغط على تحديث
  useEffect(() => {
    setIsChecking(true);
    checkJobStatus();
  }, [checkJobStatus, refreshKey]);

  /**
   * Handle refresh button click.
   */
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setPdfError(null);
    setIsChecking(true);
  };

  // إضافة Timestamp للرابط لمنع الكاش في المتصفح
  const displayUrl = pdfUrl ? `${pdfUrl}?t=${Date.now()}` : "";

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">PDF Preview</h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors text-sm"
          disabled={isChecking}
        >
          {isChecking ? "Checking..." : "Refresh"}
        </button>
      </div>
      
      {pdfError ? (
        <div className="border border-gray-300 rounded-lg p-8 bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              PDF Not Available
            </h3>
            <p className="text-gray-600 mb-4">
              {/* عرض رسالة الخطأ القادمة من السيرفر أو الرسالة الافتراضية */}
              {pdfError}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm text-gray-700">
              <p className="font-semibold mb-2">To enable PDF generation:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Install Tectonic (recommended) or a LaTeX distribution (MiKTeX on Windows, TeX Live on Linux/Mac)</li>
                <li>Ensure <code className="bg-gray-200 px-1 rounded">tectonic</code> or <code className="bg-gray-200 px-1 rounded">pdflatex</code> is in your system PATH</li>
                <li>Restart the backend server</li>
                <li>Click "Refresh" above or "Save & Recompile PDF" to trigger compilation</li>
              </ol>
              <p className="mt-3 font-semibold">Alternative:</p>
              <p className="text-xs">
                The LaTeX source file is saved at <code className="bg-gray-200 px-1 rounded">backend/storage/resume.tex</code>. 
                You can compile it manually using: <code className="bg-gray-200 px-1 rounded">tectonic resume.tex</code>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {displayUrl ? (
                <iframe
                src={displayUrl}
                className="w-full"
                style={{ height: "800px" }}
                title="Resume PDF Preview"
                onError={() => setPdfError("Failed to load PDF")}
                />
            ) : (
                <div className="w-full h-[800px] flex items-center justify-center bg-gray-50 text-gray-400">
                    Loading PDF...
                </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Click "Save & Recompile PDF" in the editor to update this preview.
          </p>
        </>
      )}
    </div>
  );
}