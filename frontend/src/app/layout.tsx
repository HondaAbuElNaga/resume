// import type { Metadata, Viewport } from "next";
// import { Zain } from "next/font/google";
// import "./globals.css";
// import Header from "@/components/layout/Header";
// import Footer from "@/components/layout/Footer";
// import { cn } from "@/lib/utils"; 
// import QueryProvider from "@/providers/QueryProvider"; 

// // 1. إعداد الخط مع ربطه بمتغير CSS
// const zain = Zain({
//   subsets: ["arabic"],
//   weight: ["200", "300", "400", "700", "800", "900"],
//   variable: "--font-zain", 
// });

// export const viewport: Viewport = {
//   themeColor: "#ffffff",
//   width: "device-width",
//   initialScale: 1,
// };

// export const metadata: Metadata = {
//   title: {
//     template: "%s | EasyCV",
//     default: "EasyCV - أنشئ سيرتك الذاتية بالذكاء الاصطناعي",
//   },
//   description: "أنشئ سيرة ذاتية احترافية في ثوانٍ باستخدام الذكاء الاصطناعي.",
//   keywords: ["سيرة ذاتية", "CV", "الذكاء الاصطناعي", "عربي"],
//   authors: [{ name: "EasyCV" }],
// };

// interface RootLayoutProps {
//   children: React.ReactNode;
// }

// export default function RootLayout({ children }: RootLayoutProps) {
//   return (
//     <html lang="ar" dir="rtl" className="scroll-smooth">
//       <body
//         className={cn(
//           zain.variable, // تفعيل متغير الخط
//           "font-zain antialiased bg-white text-slate-900 min-h-screen flex flex-col"
//         )}
//       >
//         {/* ✅ التعديل الوحيد: تغليف المحتوى بـ QueryProvider */}
//         <QueryProvider>
//           {/* الهيدر موجود هنا مرة واحدة لكل الموقع */}
//           <Header />
          
//           <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             {children}
//           </main>

//           <Footer />
//         </QueryProvider>
//       </body>
//     </html>
//   );
// }
import type { Metadata, Viewport } from "next";
import { Zain } from "next/font/google";
import "./globals.css";
// ❌ حذفنا استيراد Header و Footer من هنا
import { cn } from "@/lib/utils"; 
import QueryProvider from "@/providers/QueryProvider"; 

const zain = Zain({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "700", "800", "900"],
  variable: "--font-zain", 
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | EasyCV",
    default: "EasyCV - أنشئ سيرتك الذاتية بالذكاء الاصطناعي",
  },
  description: "أنشئ سيرة ذاتية احترافية في ثوانٍ باستخدام الذكاء الاصطناعي.",
  keywords: ["سيرة ذاتية", "CV", "الذكاء الاصطناعي", "عربي"],
  authors: [{ name: "EasyCV" }],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body
        className={cn(
          zain.variable, 
          // حذفنا flex flex-col و min-h-screen من هنا لأن كل لايوت فرعي سيحدد ذلك بنفسه
          "font-zain antialiased bg-white text-slate-900"
        )}
      >
        <QueryProvider>
          {/* ✅ هذا الملف أصبح مجرد "قشرة" فارغة تحتوي على الخطوط والإعدادات فقط */}
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}