
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

  const t = (key: string) => translations[lang][key] || key;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError(lang === 'ar' 
          ? 'تسجيل الدخول عبر Google غير مفعل في إعدادات Firebase. يرجى تفعيله من لوحة التحكم.' 
          : 'Google Sign-in is not enabled in Firebase Console.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError(lang === 'ar' 
          ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.' 
          : 'This email is already in use. Please sign in instead.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: name });
        
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          name,
          email,
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
      }
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      const errorCode = err.code || '';
      
      if (errorCode === 'auth/operation-not-allowed') {
        setError(lang === 'ar' 
          ? 'خيار التسجيل عبر البريد الإلكتروني غير مفعل في Firebase. يرجى تفعيله من "Sign-in method" في لوحة تحكم Firebase.' 
          : 'Email/Password auth is not enabled in Firebase Console.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError(lang === 'ar' 
          ? 'هذا البريد الإلكتروني مسجل بالفعل. هل ترغب في تسجيل الدخول بدلاً من ذلك؟' 
          : 'This email is already in use. Would you like to login instead?');
        // Optionally suggest switching mode
        setTimeout(() => {
          if (window.confirm(lang === 'ar' ? 'هذا البريد مسجل بالفعل، هل تريد الانتقال لصفحة تسجيل الدخول؟' : 'Email exists. Switch to login?')) {
            setMode('login');
            setError(null);
          }
        }, 500);
      } else if (errorCode === 'auth/weak-password') {
        setError(lang === 'ar' ? 'كلمة المرور ضعيفة جداً.' : 'Password is too weak.');
      } else if (errorCode === 'auth/invalid-email') {
        setError(lang === 'ar' ? 'البريد الإلكتروني غير صالح.' : 'Invalid email format.');
      } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        setError(lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.');
      } else {
        setError(err.message || String(err));
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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'register' && (
            <>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="text"
                  placeholder={t('firstName') + ' ' + t('lastName')}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-12 focus:ring-2 focus:ring-gold/20 font-bold"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="tel"
                  placeholder={t('phone')}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-12 focus:ring-2 focus:ring-gold/20 font-bold"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              required
              type="email"
              placeholder={t('emailAddress')}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-12 focus:ring-2 focus:ring-gold/20 font-bold"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              required
              type="password"
              placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-12 focus:ring-2 focus:ring-gold/20 font-bold"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={isLoading}
            className="w-full bg-dark text-white py-5 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-dark/10 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-gold" /> : (mode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />)}
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
