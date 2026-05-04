
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Phone, User, Loader2, LogIn, UserPlus, Star } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { SiteSettings } from '../../types';
import { translations } from '../../translations';
import { cn } from '../../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  siteSettings: SiteSettings;
}

export const AuthModal = ({ isOpen, onClose, lang, siteSettings }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const t = (key: string) => translations[lang][key] || key;

  const formatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 15);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessInfo(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let errorMessage = err.message || String(err);
      if (errorMessage.includes('Firebase: Error')) {
        errorMessage = errorMessage.split('): ')[1] || errorMessage.split(': ')[1] || errorMessage;
      }

      if (err.code === 'auth/operation-not-allowed') {
        setError(lang === 'ar' 
          ? 'تسجيل الدخول عبر Google غير مفعل.' 
          : 'Google Sign-in is not enabled.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError(lang === 'ar' 
          ? 'هذا البريد مسجل مسبقاً ببيانات مختلفة. يرجى الدخول بالبريد وكلمة المرور.' 
          : 'This email is already in use with different credentials. Please use email/password.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Just clear loading, don't show error if they closed it
        setError(null);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const cleanEmail = email.toLowerCase().trim();
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        if (phone.length < 8) throw new Error(lang === 'ar' ? 'رقم الهاتف غير مكتمل' : 'Phone number too short');
        
        const { user } = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(user, { displayName: name });
        
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          name,
          email: cleanEmail,
          phone,
          role: 'customer',
          membershipStatus: 'Bronze',
          membershipNumber: Math.floor(1000 + Math.random() * 9000),
          createdAt: new Date().toISOString(),
          isVerified: false,
          cashbackBalance: 0,
          availableRewards: [],
          referralCode: Math.random().toString(36).substring(2, 8).toUpperCase()
        }, { merge: true });

        setSuccessInfo(lang === 'ar' ? 'تم إنشاء الحساب بنجاح! جاري التوجيه...' : 'Account created successfully! Redirecting...');
        setTimeout(onClose, 1500);
        return;
      }
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      let errorMessage = err.message || String(err);
      
      // Clean up Firebase: Error (auth/...) prefix if it exists
      if (errorMessage.includes('Firebase: Error')) {
        errorMessage = errorMessage.split('): ')[1] || errorMessage.split(': ')[1] || errorMessage;
      }

      const errorCode = err.code || '';
      
      if (errorCode === 'auth/operation-not-allowed') {
        setError(lang === 'ar' 
          ? 'خيار التسجيل عبر البريد الإلكتروني غير مفعل في Firebase.' 
          : 'Email settings are not enabled in Firebase.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError(lang === 'ar' 
          ? 'هذا البريد الإلكتروني مسجل مسبقاً. هل ترغب في الدخول لحسابك؟' 
          : 'Email already registered. Would you like to login instead?');
        setTimeout(() => {
          if (window.confirm(lang === 'ar' ? 'البريد مسجل بالفعل، الانتقال لصفحة الدخول؟' : 'Email exists. Switch to login?')) {
            setMode('login');
            setError(null);
          }
        }, 300);
      } else if (errorCode === 'auth/weak-password') {
        setError(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
      } else if (errorCode === 'auth/invalid-email') {
        setError(lang === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email format.');
      } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        setError(lang === 'ar' ? 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.' : 'Invalid login credentials. Please check your email and password.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>

        <div className="p-8 pb-4 text-center">
          <div className="w-16 h-16 bg-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-dark/20">
            <Star className="text-gold w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-dark tracking-tight">
            {mode === 'login' ? t('login') : t('register')}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {mode === 'login' ? (lang === 'ar' ? 'مرحباً بك مجدداً في GCC TAXI' : 'Welcome back to GCC TAXI') : (lang === 'ar' ? 'انضم إلينا واستمتع بمميزات العضوية' : 'Join us and enjoy membership benefits')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl text-[11px] font-bold border border-red-100 flex items-center gap-3"
              >
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <X className="w-3 h-3" />
                </div>
                {error}
              </motion.div>
            )}

            {successInfo && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 text-green-600 p-4 rounded-2xl text-[11px] font-bold border border-green-100 flex items-center gap-3"
              >
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Star className="w-3 h-3 fill-green-600" />
                </div>
                {successInfo}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="relative group">
                  <User className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-gold", lang === 'ar' ? 'right-4' : 'left-4')} />
                  <input
                    required
                    type="text"
                    placeholder={lang === 'ar' ? 'الاسم كاملاً' : 'Full Name'}
                    className={cn(
                      "w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 focus:ring-4 focus:ring-gold/10 focus:bg-white focus:border-gold/20 transition-all font-bold text-sm",
                      lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                    )}
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="relative group">
                  <Phone className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-gold", lang === 'ar' ? 'right-4' : 'left-4')} />
                  <input
                    required
                    type="tel"
                    placeholder={lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    className={cn(
                      "w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 focus:ring-4 focus:ring-gold/10 focus:bg-white focus:border-gold/20 transition-all font-bold text-sm",
                      lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                    )}
                    value={phone}
                    onChange={e => setPhone(formatPhoneNumber(e.target.value))}
                  />
                </div>
              </>
            )}

            <div className="relative group">
              <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-gold", lang === 'ar' ? 'right-4' : 'left-4')} />
              <input
                required
                type="email"
                placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                className={cn(
                  "w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 focus:ring-4 focus:ring-gold/10 focus:bg-white focus:border-gold/20 transition-all font-bold text-sm",
                  lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                )}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-gold", lang === 'ar' ? 'right-4' : 'left-4')} />
              <input
                required
                type="password"
                placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'}
                className={cn(
                  "w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 focus:ring-4 focus:ring-gold/10 focus:bg-white focus:border-gold/20 transition-all font-bold text-sm",
                  lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                )}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {mode === 'register' && password.length > 0 && password.length < 6 && (
                <div className={cn("absolute bottom-2 text-[8px] font-black text-red-400 transition-all", lang === 'ar' ? 'right-12' : 'left-12')}>
                  {lang === 'ar' ? 'كلمة المرور قصيرة' : 'Password too short'}
                </div>
              )}
            </div>
          </div>

          <button
            disabled={isLoading || !!successInfo}
            className="w-full bg-dark text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gold hover:text-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-dark/10 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gold" /> : (mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />)}
            {mode === 'login' ? t('login') : t('register')}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold">{lang === 'ar' ? 'أو عبر' : 'Or via'}</span></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 text-dark py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            {lang === 'ar' ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}
          </button>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-gold font-bold hover:underline"
            >
              {mode === 'login' 
                ? (lang === 'ar' ? 'لا تملك حساباً؟ سجل الآن' : "Don't have an account? Register now")
                : (lang === 'ar' ? 'لديك حساب بالفعل؟ سجل دخولك' : 'Already have an account? Login')
              }
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
