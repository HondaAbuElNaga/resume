"use client";

import { useState, useCallback, memo, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Performance: Dynamic imports for heavy components
const MagicButton = dynamic(() => import("@/components/ui/MagicButton"), { loading: () => null });

// SVG Icons - hoisted outside component
const icons = {
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  cross: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
};

// Performance: Memoized Feature Item component
const FeatureItem = memo((
  { included, text, popular }: { included: boolean; text: string; popular?: boolean }
) => (
  <li className="flex items-start gap-3">
    <span className={`flex-shrink-0 mt-0.5 ${included ? "text-green-500" : "text-gray-300"}`}>
      {included ? icons.check : icons.cross}
    </span>
    <span className={`text-sm ${included ? (popular ? "text-white" : "text-gray-700") : "text-gray-400"}`}>{text}</span>
  </li>
));
FeatureItem.displayName = "FeatureItem";

// Performance: Memoized Pricing Card component
const PricingCard = memo((
  {
    name,
    description,
    price,
    period,
    features,
    popular,
    cta,
    href,
    delay,
  }: {
    name: string;
    description: string;
    price: string;
    period: string;
    features: Array<{ included: boolean; text: string }>;
    popular?: boolean;
    cta: string;
    href: string;
    delay: number;
  }
) => (
  <div
    className={`relative rounded-3xl p-8 transition-all duration-300 ${
      popular
        ? "bg-black text-white shadow-2xl shadow-gray-200 scale-105 border-2 border-black"
        : "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl"
    }`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {popular && (
      <div className="absolute -top-4 right-6 inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-semibold">
        {icons.star}
        الأكثر شعبية
      </div>
    )}

    <div className="mb-8">
      <h3 className={`text-2xl font-bold mb-2 ${popular ? "text-white" : "text-gray-900"}`}>{name}</h3>
      <p className={`text-sm mb-6 ${popular ? "text-gray-300" : "text-gray-600"}`}>{description}</p>

      <div className="mb-2">
        {price !== "0" && (
          <span className={`text-2xl font-bold ${popular ? "text-white" : "text-gray-900"}`}>ر.س</span>
        )}
        <span className={`text-5xl font-bold tracking-tight ${popular ? "text-white" : "text-gray-900"}`}>
          {price}
        </span>
        {period && (
          <span className={`text-sm ${popular ? "text-gray-300" : "text-gray-500"}`}>/{period}</span>
        )}
      </div>
    </div>

    <ul className="space-y-4 mb-8">
      {features.map((feature, idx) => (
        <FeatureItem key={idx} included={feature.included} text={feature.text} popular={popular} />
      ))}
    </ul>

    <Link
      href={href}
      className={`block w-full text-center py-4 px-6 rounded-xl font-semibold transition-all ${
        popular
          ? "bg-white text-black hover:bg-gray-100"
          : "bg-black text-white hover:bg-gray-800"
      }`}
    >
      {cta}
    </Link>
  </div>
));
PricingCard.displayName = "PricingCard";

// Performance: Memoized FAQ Item component
const FAQItem = memo((
  { question, answer, idx }: { question: string; answer: string; idx: number }
) => (
  <details className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors">
    <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors">
      <span className="font-semibold text-lg text-gray-900">{question}</span>
      <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </summary>
    <p className="px-6 pb-6 text-gray-600 leading-relaxed">{answer}</p>
  </details>
));
FAQItem.displayName = "FAQItem";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Performance: Memoized pricing plans
  const pricingPlans = useMemo(
    () => [
      {
        name: "مجاني",
        description: "للبدء واستكشاف المنصة",
        price: "0",
        period: billingCycle === "yearly" ? "سنة" : "شهر",
        features: [
          { included: true, text: "سيرة ذاتية واحدة" },
          { included: true, text: "3 قوالب أساسية" },
          { included: true, text: "تصدير PDF" },
          { included: true, text: "دعم عبر البريد" },
          { included: false, text: "قوالب احترافية" },
          { included: false, text: "تخصيص متقدم" },
          { included: false, text: "دعم أولوية" },
          { included: false, text: "إزالة العلامة المائية" },
        ],
        cta: "ابدأ مجاناً",
        href: "/register",
        popular: false,
      },
      {
        name: "احترافي",
        description: "للباحثين عن عمل الجادين",
        price: billingCycle === "yearly" ? "25" : "35",
        period: billingCycle === "yearly" ? "سنة" : "شهر",
        features: [
          { included: true, text: "سيرات ذاتية غير محدودة" },
          { included: true, text: "جميع القوالب (+50)" },
          { included: true, text: "تصدير PDF عالي الجودة" },
          { included: true, text: "دعم عبر البريد والدردشة" },
          { included: true, text: "قوالب احترافية حصرية" },
          { included: true, text: "تخصيص متقدم للألوان والخطوط" },
          { included: true, text: "إزالة العلامة المائية" },
          { included: false, text: "دعم الأولوية (24/7)" },
          { included: false, text: "إدارة فريق" },
        ],
        cta: "اشترك الآن",
        href: "/register?plan=pro",
        popular: true,
      },
      {
        name: "الباقة المهنية",
        description: "كل ما تحتاجه لتطوير مسارك المهني",
        price: billingCycle === "yearly" ? "70" : "90",
        period: billingCycle === "yearly" ? "سنة" : "شهر",
        features: [
          { included: true, text: "كل مميزات الاحترافي" },
          { included: true, text: "مولد خطابات التغطية بالذكاء الاصطناعي" },
          { included: true, text: "تحسين ملف LinkedIn بالكامل" },
          { included: true, text: "إعداد المقابلات مع أسئلة شائعة" },
          { included: true, text: "تحليل السيرة الذاتية مع توصيات" },
          { included: true, text: "قوالب حصرية للمسارات المهنية" },
          { included: true, text: "تنبيهات الوظائف المطابقة" },
          { included: true, text: "دعم أولوية عبر الدردشة" },
          { included: true, text: "تحديثات مجانية للأبد" },
        ],
        cta: "احصل على الباقة",
        href: "/register?plan=career",
        popular: false,
      },
    ],
    [billingCycle]
  );

  // Performance: Memoized FAQ items
  const faqItems = useMemo(
    () => [
      {
        question: "هل يمكنني تغيير خطتي لاحقاً؟",
        answer: "نعم! يمكنك ترقية أو تخفيض خطتك في أي وقت. سيتم تطبيق التغيير فوراً وسيتم تحويل الفرق بشكل نسبي.",
      },
      {
        question: "ما الفرق بين الاحترافي والباقة المهنية؟",
        answer: "الخطة الاحترافية تركز على السيرة الذاتية فقط. الباقة المهنية تشمل كل مميزات الاحترافي بالإضافة إلى مولد خطابات التغطية، تحسين ملف LinkedIn، إعداد المقابلات، والمزيد من الأدوات لتطوير مسارك المهني.",
      },
      {
        question: "ما هي طرق الدفع المتاحة؟",
        answer: "نقبل جميع البطاقات الائتمانية الرئيسية (Visa, MasterCard, American Express) و PayPal. للمدفوعات البنكية، يرجى التواصل معنا.",
      },
      {
        question: "هل هناك فترة تجريبية مجانية؟",
        answer: "نعم! نقدم فترة تجريبية مجانية لمدة 14 يوماً للخطط المدفوعة. يمكنك إلغاء اشتراكك في أي وقت خلال الفترة التجريبية ولن يتم تحصيل أي رسوم منك.",
      },
      {
        question: "هل يمكنني إلغاء اشتراكي في أي وقت؟",
        answer: "بالتأكيد. يمكنك إلغاء اشتراكك في أي وقت من خلال لوحة التحكم. ستظل تمتاك الوصول إلى خطتك حتى نهاية فترة الفوترة.",
      },
    ],
    []
  );

  // Performance: Memoized handler
  const handleBillingToggle = useCallback(() => {
    setBillingCycle((prev) => (prev === "monthly" ? "yearly" : "monthly"));
  }, []);

  const savings = billingCycle === "yearly" ? "وفِّر 29%" : "";

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            خطط تناسب احتياجاتك
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
            اختر الخطة المناسبة لك وابدأ في إنشاء سيرة ذاتية احترافية اليوم
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-100 rounded-2xl p-2 mb-16">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              شهري
            </button>
            <button
              onClick={handleBillingToggle}
              className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
                billingCycle === "yearly"
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              سنوي
              {savings && (
                <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  {savings}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-6 lg:px-8 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {pricingPlans.map((plan, idx) => (
              <PricingCard key={plan.name} {...plan} delay={idx * 100} />
            ))}
          </div>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="bg-gray-50 py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
              مقارنة المميزات
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-3xl overflow-hidden shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-right font-semibold text-gray-900">الميزة</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">مجاني</th>
                    <th className="px-6 py-4 text-center font-semibold text-black bg-blue-50">احترافي</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">الباقة المهنية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { feature: "عدد السير الذاتية", free: "1", pro: "غير محدود", enterprise: "غير محدود" },
                    { feature: "القوالب المتاحة", free: "3 أساسية", pro: "+50 قالب", enterprise: "+70 قالب" },
                    { feature: "تصدير PDF", free: icons.check, pro: icons.check, enterprise: icons.check },
                    { feature: "إزالة العلامة المائية", free: icons.cross, pro: icons.check, enterprise: icons.check },
                    { feature: "تخصيص متقدم", free: icons.cross, pro: icons.check, enterprise: icons.check },
                    { feature: "خطابات التغطية", free: icons.cross, pro: icons.cross, enterprise: "مولد بالذكاء الاصطناعي" },
                    { feature: "تحسين LinkedIn", free: icons.cross, pro: icons.cross, enterprise: icons.check },
                    { feature: "إعداد المقابلات", free: icons.cross, pro: icons.cross, enterprise: icons.check },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {typeof row.free === "string" ? row.free : row.free}
                      </td>
                      <td className="px-6 py-4 text-center text-black font-medium bg-blue-50/50">
                        {typeof row.pro === "string" ? row.pro : row.pro}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {typeof row.enterprise === "string" ? row.enterprise : row.enterprise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            الأسئلة الشائعة
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <FAQItem key={idx} question={item.question} answer={item.answer} idx={idx} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              جاهز للبدء؟
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              انضم إلى آلاف المستخدمين الذين أنشأوا سيرهم الذاتية معنا
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MagicButton
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                ابدأ مجاناً
                <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </MagicButton>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white border-2 border-gray-700 rounded-xl font-semibold hover:bg-gray-800 hover:border-gray-600 transition-colors"
              >
                تواصل معنا
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
