
import React, { useState } from 'react';
import { Users, X, Car, MapPin, Clock, CreditCard, Star, Trophy, Gift, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings, UserProfile, Trip } from '../types';
import { translations } from '../translations';
import { cn } from '../lib/utils';

interface CustomerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  siteSettings: SiteSettings;
  userProfile: UserProfile | null;
  customerTrips: Trip[];
  setIsPaymentOpen: (open: boolean) => void;
  setPaymentTrip: (trip: Trip) => void;
}

export const CustomerDashboard = ({
  isOpen,
  onClose,
  lang,
  siteSettings,
  userProfile,
  customerTrips,
  setIsPaymentOpen,
  setPaymentTrip
}: CustomerDashboardProps) => {
  const [customerTab, setCustomerTab] = useState<'trips' | 'rewards'>('trips');
  const t = (key: keyof typeof translations.ar) => translations[lang][key] || key;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center">
                  <Users className="text-gold w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-dark">{t('customerDashboard')}</h3>
                  <div className="flex gap-4 mt-1">
                    <button 
                      onClick={() => setCustomerTab('trips')}
                      className={cn(
                        "text-xs font-bold transition-colors",
                        customerTab === 'trips' ? "text-gold underline underline-offset-4" : "text-gray-400 hover:text-dark"
                      )}
                    >
                      {lang === 'ar' ? 'رحلاتي' : 'My Trips'}
                    </button>
                    <button 
                      onClick={() => setCustomerTab('rewards')}
                      className={cn(
                        "text-xs font-bold transition-colors border-r border-gray-200 pr-4",
                        customerTab === 'rewards' ? "text-gold underline underline-offset-4" : "text-gray-400 hover:text-dark"
                      )}
                    >
                      {lang === 'ar' ? 'العضوية والجوائز' : 'Membership & Rewards'}
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-gray-50/50">
              {customerTab === 'trips' ? (
                customerTrips.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Car className="w-10 h-10 text-gray-300" />
                    </div>
                    <h4 className="text-xl font-bold text-dark mb-2">{lang === 'ar' ? 'لا توجد رحلات مسجلة' : 'No trips recorded'}</h4>
                    <p className="text-gray-500">
                      {lang === 'ar' 
                        ? `لم تقم بأي رحلات مع ${siteSettings.companyName} بعد.` 
                        : `You haven't taken any trips with ${siteSettings.companyName_en || siteSettings.companyName} yet.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {customerTrips.map((trip) => (
                      <div key={trip.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                trip.paymentStatus === 'Paid' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                              )}>
                                {trip.paymentStatus === 'Paid' ? (lang === 'ar' ? 'مدفوع' : 'Paid') : (lang === 'ar' ? 'معلق' : 'Pending')}
                              </span>
                              <span className="text-xs font-bold text-gray-400">#{trip.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <h4 className="text-lg font-bold text-dark">{trip.direction}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-gold">{trip.amount} {t('bhd')}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase">{trip.date}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-50">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase">{t('pickup')}</p>
                            <p className="text-sm font-bold text-dark flex items-center gap-2 line-clamp-1">
                              <MapPin className="w-3 h-3 text-gold" />
                              {trip.pickup}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase">{t('dropoff')}</p>
                            <p className="text-sm font-bold text-dark flex items-center gap-2 line-clamp-1">
                              <MapPin className="w-3 h-3 text-gold" />
                              {trip.dropoff}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase">{lang === 'ar' ? 'الوقت' : 'Time'}</p>
                            <p className="text-sm font-bold text-dark flex items-center gap-2">
                              <Clock className="w-3 h-3 text-gold" />
                              {trip.time}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase">{lang === 'ar' ? 'الركاب' : 'Passengers'}</p>
                            <p className="text-sm font-bold text-dark flex items-center gap-2">
                              <Users className="w-3 h-3 text-gold" />
                              {trip.passengers}
                            </p>
                          </div>
                        </div>
                        
                        {trip.amount > 0 && trip.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => {
                              setPaymentTrip(trip);
                              setIsPaymentOpen(true);
                              onClose();
                            }}
                            className="mt-6 w-full bg-dark text-white py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-dark/10"
                          >
                            <CreditCard className="w-4 h-4" />
                            {lang === 'ar' ? 'دفع الآن' : 'Pay Now'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-8">
                  {/* Membership Card */}
                  <div className="relative bg-dark rounded-[2.5rem] p-8 text-white overflow-hidden shadow-2xl shadow-dark/20 border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-2xl -ml-24 -mb-24" />
                    
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                      <div className="space-y-2">
                        <p className="text-gold font-black uppercase tracking-widest text-xs">{lang === 'ar' ? 'مستوى العضوية' : 'Membership Level'}</p>
                        <h4 className="text-4xl font-black flex items-center gap-3">
                          <Star className="text-gold w-10 h-10 fill-gold" />
                          {userProfile?.membershipStatus || 'Bronze'}
                        </h4>
                        <p className="text-white/40 text-[10px] font-mono uppercase">Member since {userProfile?.createdAt ? new Date(userProfile.createdAt).getFullYear() : '2024'}</p>
                      </div>
                      
                      <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center min-w-[200px]">
                        <p className="text-white/60 text-xs font-bold mb-1">{lang === 'ar' ? 'رصيد الكاش باك' : 'Cashback Balance'}</p>
                        <p className="text-3xl font-black text-gold">{userProfile?.cashbackBalance || '0.00'} <span className="text-xs font-bold text-white/40">BHD</span></p>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          userProfile?.isVerified ? "bg-green-500 animate-pulse" : "bg-orange-500"
                        )} />
                        <p className="text-sm font-bold text-white/80">
                          {userProfile?.verificationMessage || (userProfile?.isVerified ? (lang === 'ar' ? 'حسابك مفعل وجاهز' : 'Your account is verified') : (lang === 'ar' ? 'جاري التحقق من بياناتك' : 'Verifying your account details'))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rewards & Prizes Grid */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                          <Gift className="text-gold w-6 h-6" />
                        </div>
                        <h5 className="text-xl font-bold text-dark">{lang === 'ar' ? 'الجوائز المتاحة' : 'Available Prizes'}</h5>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        {!userProfile?.availableRewards || userProfile.availableRewards.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <Trophy className="w-12 h-12 text-gray-200 mb-3" />
                            <p className="text-xs font-bold text-gray-400">{lang === 'ar' ? 'خدمة الجوائز ستتوفر قريباً' : 'Rewards coming soon'}</p>
                          </div>
                        ) : (
                          userProfile.availableRewards.map((reward, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gold/5 rounded-2xl border border-gold/10 group hover:bg-gold/10 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                  <Trophy className="w-4 h-4 text-gold" />
                                </div>
                                <span className="font-bold text-dark text-sm">{reward}</span>
                              </div>
                              <button className="text-[10px] font-black uppercase text-gold hover:text-dark transition-colors">
                                {lang === 'ar' ? 'عرض التفاصيل' : 'Details'}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <p className="mt-6 text-[10px] text-gray-400 font-bold leading-relaxed">
                        {lang === 'ar' 
                          ? 'سيتم تحديث الجوائز بناءً على نشاطك وحجوزاتك المؤكدة. يرجى مراجعة هذه الصفحة باستمرار.' 
                          : 'Prizes will be updated based on your activity and confirmed bookings. Check back regularly.'}
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                        <h5 className="text-lg font-bold text-dark mb-4">{lang === 'ar' ? 'مميزات العضوية' : 'Membership Benefits'}</h5>
                        <ul className="space-y-4">
                          {[
                            { label: lang === 'ar' ? 'أولوية الحجز في المناسبات' : 'Priority Booking', active: true },
                            { label: lang === 'ar' ? 'خصومات حصرية للأعضاء' : 'Exclusive Discounts', active: true },
                            { label: lang === 'ar' ? 'خدمة عملاء VIP مخصصة' : 'Dedicated VIP Support', active: userProfile?.membershipStatus === 'VIP' },
                            { label: lang === 'ar' ? 'ترقية فئة السيارة مجاناً' : 'Free Vehicle Upgrades', active: ['Gold', 'VIP'].includes(userProfile?.membershipStatus || '') },
                          ].map((benefit, i) => (
                            <li key={i} className={cn(
                              "flex items-center gap-3 text-sm font-bold transition-all",
                              benefit.active ? "text-dark" : "text-gray-300 line-through opacity-50"
                            )}>
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center",
                                benefit.active ? "bg-gold/20 text-gold" : "bg-gray-100 text-gray-300"
                              )}>
                                <Check className="w-3 h-3" />
                              </div>
                              {benefit.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-gold p-6 rounded-[2rem] text-white">
                        <p className="text-xs font-black uppercase tracking-wider mb-2">{lang === 'ar' ? 'نصيحة' : 'Tip'}</p>
                        <p className="text-sm font-bold leading-relaxed">
                          {lang === 'ar' 
                            ? 'كلما زادت حجوزاتك، زادت فرصك في الحصول على كاش باك أعلى وجوائز VIP حصرية.' 
                            : 'The more you book, the better your chances for higher cashback and exclusive VIP prizes.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
