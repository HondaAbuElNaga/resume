"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query"; // ✅ 1. استيراد useQuery
import api from "@/lib/api"; // ✅ استيراد api

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // ✅ 2. التحقق من حالة المستخدم
  const { data: user } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        return (await api.get('/users/me/')).data;
      } catch (err) {
        return null;
      }
    },
    retry: false,
  });

  const isLoggedIn = !!user; // true لو مسجل

  const hideHeaderPaths = ["/login", "/register", "/signup"];
  
  if (hideHeaderPaths.includes(pathname)) {
    return null;
  }

  return (
    <header 
      dir="rtl" 
      className="w-full px-6 lg:px-12 py-4 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm"
    >
      <div className="flex items-center">
        <Link 
          href="/" 
          className="text-2xl font-bold text-black hover:text-gray-700 transition-colors"
          style={{ fontFamily: "'Zain', sans-serif" }}
        >
          EasyCV
        </Link>
      </div>
      
      <nav className="hidden md:flex items-center gap-2">
        <Link 
          href="/#about"
          className="px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
          style={{ fontFamily: "'Zain', sans-serif" }}
        >
          المميزات
        </Link>
        <Link 
          href="/templates"
          className="px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
          style={{ fontFamily: "'Zain', sans-serif" }}
        >
          القوالب
        </Link>
        <Link 
          href="/#features"
          className="px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
          style={{ fontFamily: "'Zain', sans-serif" }}
        >
          من نحن
        </Link>
        
        {/* ✅ 3. الشرط: اعرض أزرار الدخول فقط لو المستخدم مش مسجل */}
        {!isLoggedIn ? (
          <>
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            
            <Link 
              href="/login" 
              className="px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              تسجيل الدخول
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              ابدأ الآن
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </>
        ) : (
          // ✅ 4. (اختياري) لو مسجل، ممكن تعرض زرار للداشبورد بدالهم
          <Link 
            href="/dashboard" 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm mr-2"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            لوحة التحكم
          </Link>
        )}
      </nav>

      {/* زرار الموبايل */}
      <button 
        className="md:hidden p-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* منيو الموبايل (معدلة أيضاً) */}
      {mobileMenuOpen && (
        <div className="absolute top-full right-0 left-0 bg-white border-t border-gray-100 shadow-lg md:hidden">
          <nav className="flex flex-col p-4 gap-2" style={{ fontFamily: "'Zain', sans-serif" }}>
            <Link href="/#about" className="px-4 py-3 text-gray-700 hover:text-black text-right" onClick={() => setMobileMenuOpen(false)}>المميزات</Link>
            <Link href="/templates" className="px-4 py-3 text-gray-700 hover:text-black text-right" onClick={() => setMobileMenuOpen(false)}>القوالب</Link>
            
            {/* ✅ نفس الشرط للموبايل */}
            {!isLoggedIn ? (
              <>
                <Link href="/login" className="px-4 py-3 text-gray-700 hover:text-black text-right" onClick={() => setMobileMenuOpen(false)}>تسجيل الدخول</Link>
                <Link href="/register" className="px-4 py-3 bg-black text-white rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>ابدأ الآن</Link>
              </>
            ) : (
              <Link href="/dashboard" className="px-4 py-3 bg-blue-600 text-white rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>لوحة التحكم</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}