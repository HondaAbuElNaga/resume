"use client";

import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white" dir="rtl">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              EasyCV
            </h3>
            <p 
              className="text-gray-400 text-sm leading-relaxed"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              أنشئ سيرتك الذاتية الاحترافية في ثوانٍ باستخدام الذكاء الاصطناعي.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 
              className="text-lg font-semibold mb-4"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              روابط سريعة
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link 
                  href="/templates" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  القوالب
                </Link>
              </li>
              <li>
                <Link 
                  href="/#features" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  المميزات
                </Link>
              </li>
              <li>
                <Link 
                  href="/#faq" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  الأسئلة الشائعة
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 
              className="text-lg font-semibold mb-4"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              قانوني
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  style={{ fontFamily: "'Zain', sans-serif" }}
                >
                  شروط الاستخدام
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 
              className="text-lg font-semibold mb-4"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              تواصل معنا
            </h4>
            <div className="flex gap-4 mb-4">
              {/* Twitter/X */}
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* Email */}
              <a 
                href="mailto:contact@easycv.com"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
            <p 
              className="text-gray-400 text-sm"
              style={{ fontFamily: "'Zain', sans-serif" }}
            >
              contact@easycv.com
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-8 text-center">
          <p 
            className="text-gray-500 text-sm"
            style={{ fontFamily: "'Zain', sans-serif" }}
          >
            © {currentYear} EasyCV. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

