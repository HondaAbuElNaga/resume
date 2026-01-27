"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AnimatedTemplates from "@/components/ui/AnimatedTemplates";
import api from "@/lib/api"; // ✅ استيراد مكتبة الاتصال

/**
 * Login page component.
 * Integrated with Django Backend Logic.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ State Management
  const [email, setEmail] = useState(""); // Will be sent as 'username' to Django
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("تسجيل الدخول");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // ✅ 1. Check for redirect messages (e.g. from CV creation page)
  useEffect(() => {
    if (searchParams.get('redirect') === 'cv-creation') {
        setInfoMessage("يرجى تسجيل الدخول لحفظ سيرتك الذاتية وإكمال التعديل.");
    }
  }, [searchParams]);

  // ✅ 2. Handle Login Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setLoadingText("جاري التحقق...");
    
    try {
      // A. Authenticate with Django
      // Note: We send 'email' as 'username' because Django's default auth expects 'username'
      const { data } = await api.post("/api-token-auth/", {
        username: email, 
        password: password
      });

      const token = data.token;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem("auth_token", token);
      }

      // B. Check for pending CV prompt (The Visitor Pattern)
      const pendingPrompt = localStorage.getItem("pending_cv_prompt");

      if (pendingPrompt) {
        setLoadingText("جاري إنشاء سيرتك الذاتية...");
        
        try {
          // Call Generation API immediately
          const genResponse = await api.post("/generate", 
            { prompt: pendingPrompt },
            { 
               headers: { 
                 Authorization: `Token ${token}` // Pass token manually to avoid race conditions
               } 
            }
          );

          // Success: Clear prompt and redirect to editor
          localStorage.removeItem("pending_cv_prompt");
          router.push(`/cv-editor/${genResponse.data.resume_id}`);
          return;

        } catch (genError) {
          console.error("Auto-generation failed:", genError);
          // Fallback redirect
          router.push("/dashboard");
        }
      } else {
        // Normal Flow (With Intelligent Redirect)
        // 1. look for redirect parameter in URL (searchParams) 
        const redirectUrl = searchParams.get('redirect');
        
        // 2.if dosentt exist redirect to dashboard
        if (redirectUrl) {
            router.push(redirectUrl);
        } else {
            router.push("/dashboard");
        }
      }

    } catch (err: any) {
      console.error(err);
      setError("بريد إلكتروني أو كلمة مرور غير صحيحة. حاول مرة أخرى.");
      setIsLoading(false);
      setLoadingText("تسجيل الدخول");
    }
  };

const handleGoogleLogin = () => {
    // 1. نأخذ الرابط من المتغير، أو نستخدم الافتراضي
    const apiVar = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    try {
        // 2. نستخدم دالة URL لاستخراج الدومين فقط (بدون /api أو أي زيادات)
        // هذا يضمن أننا سنحصل على http://localhost:8000 أو http://127.0.0.1:8000 "نظيف"
        const urlObj = new URL(apiVar);
        const rootUrl = `${urlObj.protocol}//${urlObj.host}`;

        // 3. التوجيه
        window.location.href = `${rootUrl}/accounts/google/login/`;
    } catch (e) {
        // Fallback لو الرابط فيه مشكلة
        console.error("Invalid API URL", e);
        window.location.href = "http://localhost:8000/accounts/google/login/";
    }
  };

  const handleLinkedInLogin = () => {
    // 1. هات الـ Client ID اللي طلعته من موقع LinkedIn Developers
    // ممكن تحطه هنا مباشرة كنص (String) للتجربة، بس الأفضل تستخدم process.env
    const clientID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID 

    // 2. ده الرابط اللي LinkedIn هيرجع المستخدم عليه (لازم يطابق اللي في LinkedIn Developers)
    const redirectUri = "http://localhost:8000/accounts/linkedin_oauth2/login/callback/";
    
    // 3. الصلاحيات المطلوبة (مهمة جداً عشان الايميل والاسم)
    const scope = encodeURIComponent("openid profile email");
    
    // 4. رقم عشوائي للحماية (ممكن تثبته مؤقتاً)
    const state = "random_string_123";

    // 5. بناء الرابط وتوجيه المستخدم
    const linkedInUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientID}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
    
    window.location.href = linkedInUrl;
  };
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-[35%] xl:w-[30%] flex flex-col bg-white border-r border-gray-100 shadow-xl z-10 relative">
        {/* Logo - Top Left Corner */}
        <div className="absolute top-6 left-6">
          <Link href="/" className="text-2xl font-bold text-black hover:text-gray-700 transition-colors">
            EasyCV
          </Link>
        </div>

        {/* Form Container - Centered */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md" dir="rtl">
            {/* Headline */}
            <div className="text-center mb-8">
              <h1 
                className="text-2xl font-bold text-black mb-2"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                مرحبا بك مرة أخرى
              </h1>
              <p 
                className="text-gray-600"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                سجّل دخولك للمتابعة
              </p>
            </div>

            {/* ✅ Alerts Section */}
            <div className="space-y-4 mb-6">
                {infoMessage && (
                    <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-sm font-medium flex items-center gap-2">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {infoMessage}
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {error}
                    </div>
                )}
            </div>

            {/* Login Form */}
            <div className="bg-white">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-black font-medium mb-2"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    type="text" // Using text to allow username or email
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent text-black placeholder-gray-400"
                    dir="ltr"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-black font-medium mb-2"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    كلمة المرور
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent text-black placeholder-gray-400"
                    dir="ltr"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Forgot Password Link */}
                <div className="text-left">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  {isLoading && (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {isLoading ? loadingText : "تسجيل الدخول"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-200"></div>
                <span 
                  className="px-4 text-sm text-gray-500"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  أو المتابعة باستخدام
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                {/* Google Login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span 
                    className="text-gray-700 font-medium"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    المتابعة مع جوجل
                  </span>
                </button>

                {/* LinkedIn Login */}
                <button
                  type="button"
                  onClick={handleLinkedInLogin}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0A66C2] border border-[#0A66C2] rounded-xl hover:bg-[#004182] focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span 
                    className="text-white font-medium"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    المتابعة مع لينكد إن
                  </span>
                </button>
              </div>

              {/* Sign Up Link */}
              <p 
                className="text-center text-gray-600 mt-6"
                style={{ fontFamily: "'Zain', sans-serif" }}
              >
                ليس لديك حساب؟{" "}
                <Link 
                  href="/register" 
                  className="text-black font-medium hover:underline"
                >
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Animated Templates */}
      <div className="hidden lg:block lg:w-[65%] xl:w-[70%]">
        <AnimatedTemplates />
      </div>
    </div>
  );
}














