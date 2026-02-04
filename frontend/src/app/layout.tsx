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
import { Zain, Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/providers/QueryProvider";

// Modern typography pairing for Arabic + English
const zain = Zain({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800", "900"],
  variable: "--font-zain",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
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
          spaceGrotesk.variable,
          plusJakarta.variable,
          "font-zain antialiased bg-white text-slate-900 [&_.font-display]:font-space-grotesk [&_.font-body]:font-plus-jakarta [&_font-display]:font-space-grotesk [&_font-body]:font-plus-jakarta"
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