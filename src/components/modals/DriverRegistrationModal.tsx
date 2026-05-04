
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Car, Phone, User, Loader2, FileText, Camera, Send, CheckCircle } from 'lucide-react';
import { auth, db, storage } from '../../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SiteSettings } from '../../types';
import { translations } from '../../translations';
import { sendAdminNotification, NotificationType } from '../../services/notificationService';

interface DriverRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  siteSettings: SiteSettings;
}

export const DriverRegistrationModal = ({ isOpen, onClose, lang, siteSettings }: DriverRegistrationModalProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    carType: 'Standard',
    carModel: '',
    plateNumber: '',
    experience: '',
    licenseExpiry: ''
  });

  const [files, setFiles] = useState<{ profilePic?: File; licensePic?: File }>({});

  const t = (key: string) => translations[lang][key] || key;

  const handleFileUpload = async (file: File, path: string) => {
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let profileUrl = '';
      let licenseUrl = '';

      if (files.profilePic) {
        profileUrl = await handleFileUpload(files.profilePic, `drivers/${auth.currentUser.uid}/profile_${Date.now()}`);
      }
      if (files.licensePic) {
        licenseUrl = await handleFileUpload(files.licensePic, `drivers/${auth.currentUser.uid}/license_${Date.now()}`);
      }

      const applicationData = {
        ...formData,
        profilePic: profileUrl,
        licensePic: licenseUrl,
        appliedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        driverApplicationStatus: 'pending',
        driverApplicationData: applicationData,
        role: 'customer' // Keep as customer until approved
      });

      // Notify Admin
      sendAdminNotification(NotificationType.NEW_DRIVER, {
        uid: auth.currentUser.uid,
        name: formData.fullName,
        phone: formData.phone,
        carType: formData.carType,
        carModel: formData.carModel
      });

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setStep(1);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
        className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>

        <div className="grid lg:grid-cols-5 h-full">
          {/* Sidebar Info */}
          <div className="lg:col-span-2 bg-dark p-10 text-white hidden lg:flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-32 -mt-32" />
             <div className="relative z-10">
                <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-gold/20">
                  <Car className="text-dark w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black mb-4 leading-tight">
                  {lang === 'ar' ? 'كن شريكاً معنا في النجاح' : 'Partner with Us for Success'}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  {lang === 'ar' 
                    ? 'انضم إلى أسطولنا الفاخر وقدم خدماتك لأرقى العملاء في المملكة.' 
                    : 'Join our luxury fleet and provide services to the most prestigious clients in the kingdom.'}
                </p>
                
                <div className="space-y-4">
                  {[
                    { icon: CheckCircle, t: lang === 'ar' ? 'دخل مادي ممتاز' : 'Excellent Income' },
                    { icon: CheckCircle, t: lang === 'ar' ? 'مرونة في الوقت' : 'Flexible Hours' },
                    { icon: CheckCircle, t: lang === 'ar' ? 'بيئة عمل فاخرة' : 'Luxury Environment' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gold" />
                      <span className="text-xs font-bold uppercase tracking-widest">{item.t}</span>
                    </div>
                  ))}
                </div>
             </div>
             
             <div className="relative z-10 pt-10">
               <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                 <p className="text-[10px] font-black uppercase text-gold mb-1">Support</p>
                 <p className="text-xs text-gray-300 font-bold">drivers@gcctaxi.com</p>
               </div>
             </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3 p-10 overflow-y-auto max-h-[85vh]">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-10">
                <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-dark">
                  {lang === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Application Sent Successfully!'}
                </h3>
                <p className="text-gray-500 font-medium max-w-xs">
                  {lang === 'ar' 
                    ? 'سيقوم فريقنا بمراجعة طلبك والتواصل معك عبر الهاتف خلال 24 ساعة.' 
                    : 'Our team will review your application and contact you via phone within 24 hours.'}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-dark">{t('driverApplication')}</h3>
                  <div className="flex gap-2 mt-4">
                    {[1, 2].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? 'bg-gold' : 'bg-gray-100'}`} />
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {step === 1 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</label>
                          <div className="relative">
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              required
                              type="text"
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-10 focus:ring-2 focus:ring-gold/20 font-bold text-sm"
                              value={formData.fullName}
                              onChange={e => setFormData({...formData, fullName: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('phone')}</label>
                          <div className="relative">
                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              required
                              type="tel"
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-10 focus:ring-2 focus:ring-gold/20 font-bold text-sm"
                              value={formData.phone}
                              onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('carType')}</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['Standard', 'VIP', 'Van'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFormData({...formData, carType: type})}
                              className={`py-4 rounded-2xl border-2 transition-all font-black text-xs uppercase ${
                                formData.carType === type 
                                ? 'border-gold bg-gold/5 text-gold' 
                                : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                              }`}
                            >
                              {t(type.toLowerCase())}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('carModel')}</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. Lexus LS 500"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-gold/20 font-bold text-sm"
                            value={formData.carModel}
                            onChange={e => setFormData({...formData, carModel: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('plateNumber')}</label>
                          <input
                            required
                            type="text"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-gold/20 font-bold text-sm"
                            value={formData.plateNumber}
                            onChange={e => setFormData({...formData, plateNumber: e.target.value})}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-full bg-dark text-white py-5 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3"
                      >
                        {lang === 'ar' ? 'التالي' : 'Next Step'}
                        <Send className="w-5 h-5 rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('profilePhoto')}</label>
                          <div className="flex items-center gap-4">
                             <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200">
                                {files.profilePic ? (
                                  <img src={URL.createObjectURL(files.profilePic)} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                  <Camera className="text-gray-300 w-8 h-8" />
                                )}
                             </div>
                             <label className="flex-1">
                               <div className="bg-white border-2 border-gold/30 text-gold px-6 py-4 rounded-2xl font-black text-xs uppercase cursor-pointer hover:bg-gold hover:text-white transition-all text-center">
                                 {lang === 'ar' ? 'رفع الصورة الشخصية' : 'Upload Profile Photo'}
                               </div>
                               <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && setFiles({...files, profilePic: e.target.files[0]})} />
                             </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('licensePhoto')}</label>
                          <div className="flex items-center gap-4">
                             <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200">
                                {files.licensePic ? (
                                  <img src={URL.createObjectURL(files.licensePic)} className="w-full h-full object-cover" alt="License" />
                                ) : (
                                  <FileText className="text-gray-300 w-8 h-8" />
                                )}
                             </div>
                             <label className="flex-1">
                               <div className="bg-white border-2 border-gold/30 text-gold px-6 py-4 rounded-2xl font-black text-xs uppercase cursor-pointer hover:bg-gold hover:text-white transition-all text-center">
                                 {lang === 'ar' ? 'رفع صورة الرخصة' : 'Upload License Photo'}
                               </div>
                               <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && setFiles({...files, licensePic: e.target.files[0]})} />
                             </label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="bg-gray-100 text-gray-400 py-5 rounded-2xl font-black text-lg hover:bg-gray-200 transition-all"
                        >
                          {lang === 'ar' ? 'رجوع' : 'Back'}
                        </button>
                        <button
                          disabled={isLoading}
                          className="bg-dark text-white py-5 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-dark/10 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-gold" /> : <CheckCircle className="w-6 h-6" />}
                          {lang === 'ar' ? 'تقديم الطلب' : 'Submit Application'}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
