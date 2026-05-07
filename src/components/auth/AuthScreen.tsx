
import React, { useState } from 'react';
import { Mail, Lock, Phone, User, ArrowRight, Car, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { auth, db } from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthScreenProps {
  onClose: () => void;
  lang: 'ar' | 'en';
  defaultMode?: 'customer' | 'driver';
  onAuthSuccess: (user: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onClose, lang, defaultMode = 'customer', onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState<'customer' | 'driver'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          onAuthSuccess({ ...userCredential.user, ...userData });
        } else {
          // If profile missing, create a default one
          const newData = {
            uid: userCredential.user.uid,
            name: userCredential.user.displayName || 'User',
            email: userCredential.user.email,
            role: 'customer',
            createdAt: new Date().toISOString(),
            isVerified: false
          };
          await setDoc(doc(db, 'users', userCredential.user.uid), newData);
          onAuthSuccess({ ...userCredential.user, ...newData });
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });

        const userData = {
          uid: userCredential.user.uid,
          name,
          email,
          phone,
          role: userRole,
          createdAt: new Date().toISOString(),
          isVerified: false,
          membershipStatus: 'Bronze',
          membershipNumber: Math.floor(100000 + Math.random() * 900000),
          cashbackBalance: 0,
          availableRewards: [],
          referralCode: Math.random().toString(36).substring(2, 8).toUpperCase()
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        onAuthSuccess({ ...userCredential.user, ...userData });
      }
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError(lang === 'ar' 
          ? 'خيار الدخول بالبريد الرقمي غير مفعل في Firebase. يرجى تفعيله من لوحة التحكم.' 
          : 'Email/Password auth is not enabled in Firebase Console.');
      } else {
        setError(lang === 'ar' ? 'فشل التحقق من البيانات. تأكد من البريد وكلمة المرور.' : 'Authentication failed. Please check your credentials.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors z-10"
        >
          <ChevronRight className={cn("w-5 h-5", lang === 'en' && "rotate-180")} />
        </button>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-dark mb-2">
              {isLogin 
                ? (lang === 'ar' ? 'مرحباً بعودتك!' : 'Welcome Back!') 
                : (lang === 'ar' ? 'إنشاء حساب جديد' : 'Create Account')}
            </h2>
            <p className="text-gray-400 font-bold">
              {isLogin 
                ? (lang === 'ar' ? 'سجل دخولك لمتابعة رحلاتك' : 'Sign in to manage your trips') 
                : (lang === 'ar' ? 'انضم إلينا اليوم وابدأ رحلتك' : 'Join us today and start your journey')}
            </p>
          </div>

          {/* Role Selector */}
          {!isLogin && (
            <div className="flex p-1 bg-gray-50 rounded-2xl mb-8">
              <button 
                onClick={() => setUserRole('customer')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2",
                  userRole === 'customer' ? "bg-white text-gold shadow-sm" : "text-gray-400"
                )}
              >
                <User className="w-4 h-4" />
                {lang === 'ar' ? 'زبون' : 'Customer'}
              </button>
              <button 
                onClick={() => setUserRole('driver')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2",
                  userRole === 'driver' ? "bg-white text-gold shadow-sm" : "text-gray-400"
                )}
              >
                <Car className="w-4 h-4" />
                {lang === 'ar' ? 'سائق' : 'Driver'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-500 text-sm font-bold animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gold transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  required
                  type="text"
                  placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-dark focus:ring-2 focus:ring-gold/20 transition-all"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gold transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                required
                type="email"
                placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-dark focus:ring-2 focus:ring-gold/20 transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gold transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <input 
                  required
                  type="tel"
                  placeholder={lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-dark focus:ring-2 focus:ring-gold/20 transition-all"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            )}

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gold transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                required
                type="password"
                placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-dark focus:ring-2 focus:ring-gold/20 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-gold hover:bg-gold-dark text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 shadow-lg shadow-gold/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? (lang === 'ar' ? 'دخول' : 'Sign In') : (lang === 'ar' ? 'إنشاء حساب' : 'Sign Up')}
                  <ArrowRight className={cn("w-5 h-5", lang === 'ar' && "rotate-180")} />
                </>
              )}
            </button>
          </form>

          {/* Footer Social / Alternative */}
          <div className="mt-8 text-center">
             <button 
               onClick={() => setIsLogin(!isLogin)}
               className="text-sm font-bold text-gray-400 hover:text-gold transition-colors underline underline-offset-4"
             >
               {isLogin 
                 ? (lang === 'ar' ? 'ليس لديك حساب؟ سجل الآن' : "Don't have an account? Join us")
                 : (lang === 'ar' ? 'لديك حساب بالفعل؟ سجل دخولك' : 'Already have an account? Sign in')}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
