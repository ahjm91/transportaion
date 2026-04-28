import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Car, ShieldCheck, FileText, Send, CheckCircle } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  lang: 'ar' | 'en';
}

export const DriverRegistrationModal: React.FC<Props> = ({ isOpen, onClose, userProfile, lang }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    carType: 'Standard',
    carModel: '',
    plateNumber: '',
    experience: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoading(true);

    try {
      // 1. Update user profile to indicate application sent
      await updateDoc(doc(db, 'users', userProfile.uid), {
        driverApplicationStatus: 'pending',
        driverApplicationData: {
          ...formData,
          appliedAt: new Date().toISOString()
        }
      });

      // 2. Create a driver profile in "drivers" but with status "offline" or a pending flag
      // Wait: Best to only create actual driver doc after admin approval.
      
      setStep('success');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-8 md:p-12">
              <button onClick={onClose} className="absolute top-8 left-8 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>

              {step === 'form' ? (
                <div className="space-y-8">
                  <div>
                    <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mb-6">
                      <Car className="w-8 h-8 text-gold" />
                    </div>
                    <h2 className="text-3xl font-black text-dark">
                      {lang === 'ar' ? 'كن شريكاً معنا' : 'Become a Partner'}
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">
                      {lang === 'ar' ? 'انضم إلى نخبة السائقين في البحرين وابدأ بجني الأرباح.' : 'Join the elite drivers in Bahrain and start earning.'}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'نوع السيارة' : 'Car Type'}</label>
                        <select 
                          value={formData.carType}
                          onChange={(e) => setFormData({...formData, carType: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all"
                        >
                          <option value="Standard">Standard</option>
                          <option value="VIP">VIP (Luxury)</option>
                          <option value="Van">Van (Family)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'موديل السيارة' : 'Car Model'}</label>
                        <input 
                          required
                          placeholder="e.g. Lexus LS 2024"
                          value={formData.carModel}
                          onChange={(e) => setFormData({...formData, carModel: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'رقم اللوحة' : 'Plate Number'}</label>
                      <input 
                        required
                        placeholder="123456"
                        value={formData.plateNumber}
                        onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'سنوات الخبرة' : 'Experience Years'}</label>
                      <input 
                        required
                        type="number"
                        placeholder="5"
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-dark text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gold hover:text-dark transition-all shadow-xl shadow-dark/10"
                    >
                      {loading ? '...' : (lang === 'ar' ? 'إرسال طلب الانضمام' : 'Submit Application')}
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-12 space-y-6">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
                    <CheckCircle className="w-16 h-16" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-dark">تم استلام طلبك بنجاح!</h2>
                    <p className="text-gray-500 mt-4 font-medium leading-relaxed">
                      شكراً لرغبتك في الانضمام إلينا. سيقوم فريقنا بمراجعة بياناتك والتواصل معك عبر الهاتف خلال 48 ساعة لتفعيل حسابك.
                    </p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="bg-dark text-white px-12 py-4 rounded-2xl font-black hover:bg-gold hover:text-dark transition-all"
                  >
                    إغلاق
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
