"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { User, Mail, Lock, Bell, Globe, Moon, Sun, Shield, Trash2, ChevronLeft, Save, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

// ==================== Types ====================
interface UserProfile {
  id: string;
  username: string;
  email: string;
  is_premium: boolean;
}

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

// ==================== Helper Components ====================
const SettingsSection = ({ title, description, icon, children }: SettingsSectionProps) => (
  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
    <div className="p-6 border-b border-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const FormField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  dir = "rtl",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  dir?: string;
}) => (
  <div className="mb-5">
    <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      dir={dir}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
      style={{ fontFamily: "'Zain', sans-serif" }}
    />
  </div>
);

// ==================== Main Component ====================
export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Form State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading States
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // ==================== API Queries ====================

  const { data: userProfile, isLoading } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => (await api.get('/auth/users/me/')).data,
    onSuccess: (data) => {
      setUsername(data.username);
      setEmail(data.email);
    },
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username: string; email: string }) => {
      return api.patch('/auth/users/me/', data);
    },
    onSuccess: () => {
      toast.success("تم تحديث الملف الشخصي بنجاح");
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsUpdatingProfile(false);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الملف الشخصي");
      setIsUpdatingProfile(false);
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      return api.post('/auth/users/set_password/', data);
    },
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsUpdatingPassword(false);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || "حدث خطأ أثناء تغيير كلمة المرور";
      toast.error(errorMessage);
      setIsUpdatingPassword(false);
    },
  });

  // Delete Account Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return api.delete('/auth/users/me/');
    },
    onSuccess: () => {
      localStorage.removeItem("auth_token");
      toast.success("تم حذف الحساب بنجاح");
      router.push("/");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الحساب");
      setIsDeletingAccount(false);
    },
  });

  // ==================== Event Handlers ====================

  const handleUpdateProfile = () => {
    if (!username.trim() || !email.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setIsUpdatingProfile(true);
    updateProfileMutation.mutate({ username, email });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setIsUpdatingPassword(true);
    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const handleDeleteAccount = () => {
    const confirmation = prompt(
      "هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه. اكتب 'تأكيد' للمتابعة:"
    );

    if (confirmation === "تأكيد") {
      setIsDeletingAccount(true);
      deleteAccountMutation.mutate();
    }
  };

  // ==================== Tabs ====================

  const tabs = [
    { id: "profile", label: "الملف الشخصي", icon: <User className="w-4 h-4" /> },
    { id: "security", label: "الأمان", icon: <Lock className="w-4 h-4" /> },
    { id: "notifications", label: "الإشعارات", icon: <Bell className="w-4 h-4" /> },
    { id: "danger", label: "منطقة الخطر", icon: <AlertCircle className="w-4 h-4" /> },
  ];

  // ==================== Render ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex" dir="rtl">

      {/* Sidebar - Simplified version */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-l border-gray-100 flex flex-col shadow-sm sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <span className="text-xl font-bold text-black" style={{ fontFamily: "'Zain', sans-serif" }}>
                Easy<span className="text-blue-600">CV</span>
              </span>
              <p className="text-xs text-gray-400" style={{ fontFamily: "'Zain', sans-serif" }}>الإعدادات</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-gray-500 hover:text-black hover:bg-gray-50 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium" style={{ fontFamily: "'Zain', sans-serif" }}>العودة للوحة التحكم</span>
          </Link>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-l from-blue-50 to-blue-50/50 text-black border border-blue-100 shadow-sm"
                  : "text-gray-500 hover:text-black hover:bg-gray-50"
              }`}
            >
              <span className={activeTab === tab.id ? "text-blue-600" : "text-gray-400"}>
                {tab.icon}
              </span>
              <span className="font-medium" style={{ fontFamily: "'Zain', sans-serif" }}>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>
            الإعدادات
          </h1>
          <p className="text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
            إدارة حسابك وإعدادات التطبيق
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="max-w-4xl space-y-6">

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <>
                <SettingsSection
                  title="معلومات الحساب"
                  description="تحديث معلوماتك الشخصية"
                  icon={<User className="w-5 h-5" />}
                >
                  <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-br from-blue-50 to-blue-50/30 rounded-2xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {userProfile?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-bold text-black text-lg" style={{ fontFamily: "'Zain', sans-serif" }}>
                        {userProfile?.username}
                      </p>
                      <p className="text-gray-500 text-sm">{userProfile?.email}</p>
                      {userProfile?.is_premium && (
                        <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          الخطة المميزة
                        </span>
                      )}
                    </div>
                  </div>

                  <FormField
                    label="الاسم الكامل"
                    value={username}
                    onChange={setUsername}
                    placeholder="أدخل اسمك الكامل"
                  />

                  <FormField
                    label="البريد الإلكتروني"
                    value={email}
                    onChange={setEmail}
                    type="email"
                    placeholder="example@email.com"
                    dir="ltr"
                  />

                  <button
                    onClick={handleUpdateProfile}
                    disabled={isUpdatingProfile}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-black hover:bg-gray-900 text-white rounded-2xl font-medium transition-all hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'Zain', sans-serif" }}
                  >
                    {isUpdatingProfile ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        جاري التحديث...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                </SettingsSection>

                <SettingsSection
                  title="التفضيلات"
                  description="تخصيص تجربتك في التطبيق"
                  icon={<Globe className="w-5 h-5" />}
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-black mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                          اللغة
                        </p>
                        <p className="text-sm text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
                          اختر لغة الواجهة
                        </p>
                      </div>
                      <select
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        style={{ fontFamily: "'Zain', sans-serif" }}
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-black mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                          المظهر
                        </p>
                        <p className="text-sm text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
                          اختر مظهر التطبيق
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
                          <Sun className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
                          <Moon className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </SettingsSection>
              </>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <>
                <SettingsSection
                  title="تغيير كلمة المرور"
                  description="تحديث كلمة المرور الخاصة بحسابك"
                  icon={<Lock className="w-5 h-5" />}
                >
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>
                        كلمة المرور الحالية
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور الحالية"
                          dir="ltr"
                          className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          style={{ fontFamily: "'Zain', sans-serif" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>
                        كلمة المرور الجديدة
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور الجديدة"
                          dir="ltr"
                          className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          style={{ fontFamily: "'Zain', sans-serif" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>
                        تأكيد كلمة المرور الجديدة
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="أعد إدخال كلمة المرور الجديدة"
                          dir="ltr"
                          className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          style={{ fontFamily: "'Zain', sans-serif" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="p-4 bg-blue-50 rounded-2xl space-y-2">
                      <p className="text-sm font-medium text-blue-900" style={{ fontFamily: "'Zain', sans-serif" }}>
                        متطلبات كلمة المرور:
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          8 أحرف على الأقل
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          تحتوي على أرقام وأحرف خاصة
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={isUpdatingPassword}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-black hover:bg-gray-900 text-white rounded-2xl font-medium transition-all hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
                      style={{ fontFamily: "'Zain', sans-serif" }}
                    >
                      {isUpdatingPassword ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          جاري التحديث...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          تغيير كلمة المرور
                        </>
                      )}
                    </button>
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="الأمان"
                  description="إعدادات إضافية لحماية حسابك"
                  icon={<Shield className="w-5 h-5" />}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-black mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                          المصادقة الثنائية
                        </p>
                        <p className="text-sm text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
                          إضافة طبقة إضافية من الأمان
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
                        تفعيل
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-black mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                          الجلسات النشطة
                        </p>
                        <p className="text-sm text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
                          إدارة الأجهزة المتصلة بحسابك
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium transition-colors">
                        إدارة
                      </button>
                    </div>
                  </div>
                </SettingsSection>
              </>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <>
                <SettingsSection
                  title="إشعارات البريد الإلكتروني"
                  description="اختر الإشعارات التي تريد استلامها"
                  icon={<Mail className="w-5 h-5" />}
                >
                  <div className="space-y-4">
                    {[
                      { id: "updates", label: "تحديثات المنتج", desc: "أخبار وميزات جديدة" },
                      { id: "tips", label: "نصائح وأدلة", desc: "نصائح لتحسين سيرتك الذاتية" },
                      { id: "marketing", label: "عروض ترويجية", desc: "خصومات وعروض خاصة" },
                      { id: "security", label: "تنبيهات الأمان", desc: "نشاط غير عادي على حسابك" },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-black mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                            {item.label}
                          </p>
                          <p className="text-sm text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
                            {item.desc}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={item.id === "security"} />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="إشعارات المتصفح"
                  description="إشعارات فورية في متصفحك"
                  icon={<Bell className="w-5 h-5" />}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-black mb-1" style={{ fontFamily: "'Zain', sans-serif" }}>
                          تفعيل الإشعارات الفورية
                        </p>
                        <p className="text-sm text-gray-500" style={{ fontFamily: "'Zain', sans-serif" }}>
                          احصل على إشعارات فورية عند اكتمال المعالجة
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </SettingsSection>
              </>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <SettingsSection
                title="منطقة الخطر"
                description="إجراءات خطيرة لا يمكن التراجع عنها"
                icon={<AlertCircle className="w-5 h-5 text-red-600" />}
              >
                <div className="p-6 bg-gradient-to-br from-red-50 to-red-50/30 border-2 border-red-100 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-black mb-2" style={{ fontFamily: "'Zain', sans-serif" }}>
                        حذف الحساب
                      </h4>
                      <p className="text-gray-600 text-sm mb-4" style={{ fontFamily: "'Zain', sans-serif" }}>
                        سيؤدي هذا الإجراء إلى حذف حسابك وجميع سيرك الذاتية بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                      </p>
                      <ul className="text-sm text-gray-500 space-y-2 mb-4" style={{ fontFamily: "'Zain', sans-serif" }}>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                          حذف جميع السير الذاتية
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                          حذف جميع البيانات الشخصية
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                          إلغاء جميع الاشتراكات
                        </li>
                      </ul>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all disabled:bg-red-400 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{ fontFamily: "'Zain', sans-serif" }}
                      >
                        {isDeletingAccount ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            جاري الحذف...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-5 h-5" />
                            حذف حسابي
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </SettingsSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
