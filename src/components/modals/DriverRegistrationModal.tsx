import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Car, ShieldCheck, FileText, Send, CheckCircle, Users } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../../types';
import { cn } from '../../lib/utils';

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
    experience: '',
    fullName: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    dob: '',
    profilePic: '',
    licensePic: '',
    licenseExpiry: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePic' | 'licensePic') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(lang === 'ar' ? 'حجم الصورة كبير جداً (الأقصى 2MB)' : 'Photo is too large (Max 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoading(true);

    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        driverApplicationStatus: 'pending',
        driverApplicationData: {
          ...formData,
          appliedAt: new Date().toISOString()
        }
      });
      
      setStep('success');
    } catch (error) {
      console.error(error);
      alert(lang === 'ar' ? 'حدث خطأ أثناء إرسال الطلب' : 'An error occurred while submitting');
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
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-8 md:p-12">
              <button 
                onClick={onClose} 
                className={cn(
                  "absolute top-8 p-2 hover:bg-gray-100 rounded-full transition-colors z-10",
                  lang === 'ar' ? "left-8" : "right-8"
                )}
              >
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
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                        <input 
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                        <input 
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                        <input 
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</label>
                        <input 
                          required
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({...formData, dob: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Car Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'نوع السيارة' : 'Car Type'}</label>
                        <select 
                          value={formData.carType}
                          onChange={(e) => setFormData({...formData, carType: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all text-black"
                        >
                          <option value="Standard">Standard</option>
                          <option value="VIP">VIP (Luxury)</option>
                          <option value="Van">Van (Family)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'موديل السيارة' : 'Car Model'}</label>
                        <input 
                          required
                          placeholder="e.g. Lexus LS 2024"
                          value={formData.carModel}
                          onChange={(e) => setFormData({...formData, carModel: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'رقم اللوحة' : 'Plate Number'}</label>
                        <input 
                          required
                          placeholder="123456"
                          value={formData.plateNumber}
                          onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 px-2 uppercase tracking-widest">{lang === 'ar' ? 'سنوات الخبرة' : 'Experience Years'}</label>
                        <input 
                          required
                          type="number"
                          placeholder="5"
                          value={formData.experience}
                          onChange={(e) => setFormData({...formData, experience: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-gold rounded-2xl p-4 font-bold outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Profile Pic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3 p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-gold" />
                          {lang === 'ar' ? 'الصورة الشخصية' : 'Profile Photo'}
                        </label>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'profilePic')}
                          className="hidden"
                          id="driver-photo"
                        />
                        <label 
                          htmlFor="driver-photo"
                          className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-gray-100 transition-colors rounded-2xl"
                        >
                          {formData.profilePic ? (
                            <img src={formData.profilePic} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" alt="Preview" />
                          ) : (
                            <div className="text-center">
                              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'رفع صور الشخصية' : 'Upload Profile'}</p>
                            </div>
                          )}
                        </label>
                        <p className="text-[9px] text-center text-gold font-bold bg-gold/5 p-2 rounded-lg">
                          {lang === 'ar' 
                            ? 'يجب أن تكون ببدلة رسمية أو الثوب العربي' 
                            : 'Must be in formal suit or Arabic dress'}
                        </p>
                      </div>

                      <div className="space-y-3 p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <FileText className="w-3 h-3 text-gold" />
                          {lang === 'ar' ? 'رخصة السياقة' : 'Driving License'}
                        </label>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'licensePic')}
                          className="hidden"
                          id="license-photo"
                        />
                        <label 
                          htmlFor="license-photo"
                          className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-gray-100 transition-colors rounded-2xl"
                        >
                          {formData.licensePic ? (
                            <img src={formData.licensePic} className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-lg" alt="Preview" />
                          ) : (
                            <div className="text-center">
                              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'رفع صورة الرخصة' : 'Upload License'}</p>
                            </div>
                          )}
                        </label>
                        <div className="space-y-2 pt-2 border-t border-gray-200">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block text-center">
                            {lang === 'ar' ? 'تاريخ انتهاء الرخصة' : 'License Expiry Date'}
                          </label>
                          <input 
                            required
                            type="date"
                            value={formData.licenseExpiry}
                            onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-[10px] font-bold outline-none focus:border-gold"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <p className="text-[9px] text-center text-red-500 font-bold">
                            {lang === 'ar' ? 'يجب أن تكون الرخصة سارية المفعول' : 'License must be valid/active'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-dark text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gold hover:text-dark transition-all shadow-xl shadow-dark/10"
                    >
                      {loading ? '...' : (lang === 'ar' ? 'إرسال طلب الانضمام' : 'Submit Application')}
                      <Send className="w-5 h-5" />
                    </button>
                    
                    <p className="text-[10px] text-center text-gray-400 font-bold">
                       {lang === 'ar' 
                         ? 'عند تقديم الطلب، سيتم مراجعته من قبل الإدارة وسيتم التواصل معك عند الموافقة.' 
                         : 'After submitting, your application will be reviewed by admin. You will be contacted upon approval.'}
                    </p>
                  </form>
                </div>
              ) : (
                <div className="text-center py-12 space-y-6">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
                    <CheckCircle className="w-16 h-16" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-dark">
                      {lang === 'ar' ? 'تم استلام طلبك بنجاح!' : 'Application Received!'}
                    </h2>
                    <p className="text-gray-500 mt-4 font-medium leading-relaxed">
                      {lang === 'ar' 
                        ? 'شكراً لرغبتك في الانضمام إلينا. سيقوم فريقنا بمراجعة بياناتك والتواصل معك عبر الهاتف خلال 48 ساعة لتفعيل حسابك.' 
                        : 'Thank you for your interest. Our team will review your application and contact you within 48 hours to activate your account.'}
                    </p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="bg-dark text-white px-12 py-4 rounded-2xl font-black hover:bg-gold hover:text-dark transition-all"
                  >
                    {lang === 'ar' ? 'إغلاق' : 'Close'}
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
