import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * ✅ محرك الاتصال الأساسي (Axios Instance)
 * تم تحسينه ليتوافق مع معايير TypeScript و Django
 */
const api: AxiosInstance = axios.create({
    // الرابط الأساسي للسيرفر
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    // مهم جداً إذا كنت تستخدم الكوكيز أو الجلسات مع Django
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
    }
});

/**
 * ✅ إضافة التوكن (Auth Token) تلقائياً
 * نستخدم بادئة "Token" لأنها الافتراضية في Django Token Authentication
 */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            if (token && config.headers) {
                // ضبط الهيدر بالشكل الذي يتوقعه Django
                config.headers.Authorization = `Token ${token}`;
            }
        }
        
        // 🛠️ تحسين: التأكد من وجود الشرطة المائلة في نهاية الروابط (Django Trailing Slash)
        if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
            config.url += '/';
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * ✅ معالجة استجابات السيرفر
 * التعامل مع انتهاء الصلاحية (401) وإعادة التوجيه بذكاء
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // تحديد هل الخطأ 401 (غير مصرح)
        if (error.response?.status === 401) {
            
            // 🛑 الخطوة الجديدة: نتحقق هل الرابط هو "users/me"؟
            // لو كان هو، يبقى ده مجرد فحص روتيني من الهيدر لزائر، فمش لازم نطرده
            const isCheckUserRequest = error.config && error.config.url && error.config.url.includes('users/me');

            if (isCheckUserRequest) {
                // نرفض الطلب بهدوء عشان الـ React Query في الهيدر يعرف إن مفيش يوزر ويعرض زرار "دخول"
                return Promise.reject(error);
            }

            // ✅ في أي حالة تانية (مثلاً بيحاول يحفظ CV وهو مش مسجل)، نطرده لصفحة الدخول
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                
                // تجنب إعادة التوجيه اللانهائي إذا كان المستخدم بالفعل في صفحة الدخول
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;