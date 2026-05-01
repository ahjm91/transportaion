
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MapPin, Calendar, Clock, CreditCard, Star, Trophy, Gift, Check, Car, Copy, Share2 } from 'lucide-react';
import { Trip, SiteSettings, UserProfile, Booking } from '../../types';
import { cn } from '../../lib/utils';

interface CustomerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  t: (key: string) => string;
  siteSettings: SiteSettings;
  userProfile: UserProfile | null;
  customerTrips: Trip[];
  realtimeBookings: Booking[];
  customerTab: string;
  setCustomerTab: (tab: 'trips' | 'rewards' | 'referral') => void;
  onPayNow: (trip: Trip) => void;
}

export const CustomerDashboardModal = ({
  isOpen, onClose, lang, t, siteSettings, userProfile, customerTrips, realtimeBookings, customerTab, setCustomerTab, onPayNow
}: CustomerDashboardModalProps) => {
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
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
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
                    <button 
                      onClick={() => setCustomerTab('referral')}
                      className={cn(
                        "text-xs font-bold transition-colors border-r border-gray-200 pr-4",
                        customerTab === 'referral' ? "text-gold underline underline-offset-4" : "text-gray-400 hover:text-dark"
                      )}
                    >
                      {lang === 'ar' ? 'أرسل واكسب' : 'Referral'}
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
                [...customerTrips, ...realtimeBookings].length === 0 ? (
                  <div className="text-center py-20">
                    <Car className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-dark">{lang === 'ar' ? 'لا توجد رحلات' : 'No trips found'}</h4>
                    <p className="text-gray-400 text-sm">{lang === 'ar' ? 'لم تقم بحجز أي رحلات بعد.' : 'You haven\'t booked any trips yet.'}</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                     {[...customerTrips, ...realtimeBookings].sort((a: any, b: any) => {
                       const dateA = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                       const dateB = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                       return dateB - dateA;
                     }).map(tripEntry => {
                       const trip = tripEntry as any;
                       const isRealtime = trip.pickupLocation !== undefined;
                       return (
                         <div key={trip.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                               <div className="flex flex-col gap-1">
                                 <span className={cn(
                                   "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit",
                                   trip.status === 'Completed' || trip.status === 'completed' ? "bg-green-100 text-green-600" : 
                                   (trip.status === 'Cancelled' || trip.status === 'cancelled' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")
                                 )}>
                                   {trip.status === 'Requested' || trip.status === 'requested' ? (lang === 'ar' ? 'طلب جديد' : 'Requested') :
                                    trip.status === 'Confirmed' || trip.status === 'confirmed' ? (lang === 'ar' ? 'مؤكد' : 'Confirmed') :
                                    trip.status === 'Completed' || trip.status === 'completed' ? (lang === 'ar' ? 'مكتمل' : 'Completed') :
                                    (lang === 'ar' ? 'ملغي' : 'Cancelled')}
                                 </span>
                                 <span className="text-[10px] text-gray-400 font-bold">
                                   {isRealtime ? (lang === 'ar' ? 'حجز فوري' : 'Live Booking') : (lang === 'ar' ? 'حجز مسبق' : 'Scheduled')}
                                 </span>
                               </div>
                               <p className="text-xl font-black text-gold">{trip.amount || trip.price} BHD</p>
                            </div>
                            <h5 className="font-black text-dark">{isRealtime ? `${trip.pickupAddress} ➔ ${trip.dropoffAddress}` : trip.direction}</h5>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold text-gray-500">
                               <div className="flex items-center gap-2 truncate"><MapPin className="w-3 h-3 text-gold" /> {isRealtime ? trip.pickupAddress : trip.pickup}</div>
                               <div className="flex items-center gap-2"><Calendar className="w-3 h-3 text-gold" /> {trip.date}</div>
                               <div className="flex items-center gap-2"><Clock className="w-3 h-3 text-gold" /> {trip.time}</div>
                               <div className="flex items-center gap-2"><Star className="w-3 h-3 text-gold" /> {trip.rating || (lang === 'ar' ? 'بدون تقييم' : 'No rating')}</div>
                            </div>
                         </div>
                       );
                     })}
                  </div>
                )
              ) : customerTab === 'rewards' ? (
                <div className="space-y-8">
                  {/* Membership Card */}
                  <div className="bg-dark rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                     <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-right">
                           <p className="text-gold text-[10px] font-black uppercase tracking-widest mb-2">{lang === 'ar' ? 'فئة العضوية' : 'Member Tier'}</p>
                           <h4 className="text-4xl font-black flex items-center gap-4">
                             <Star className="w-10 h-10 fill-gold text-gold" />
                             {userProfile?.membershipStatus === 'Bronze' ? (lang === 'ar' ? 'برونزي' : 'Bronze') :
                              userProfile?.membershipStatus === 'Silver' ? (lang === 'ar' ? 'فضي' : 'Silver') :
                              userProfile?.membershipStatus === 'Gold' ? (lang === 'ar' ? 'ذهبي' : 'Gold') :
                              (userProfile?.membershipStatus || (lang === 'ar' ? 'برونزي' : 'Bronze'))}
                           </h4>
                        </div>
                        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-3xl text-center">
                           <p className="text-white/40 text-[10px] font-black uppercase mb-1">{lang === 'ar' ? 'رصيد الكاش باك' : 'Cashback Balance'}</p>
                           <p className="text-3xl font-black text-gold">{userProfile?.cashbackBalance || '0.00'} <span className="text-xs">BHD</span></p>
                        </div>
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                       <h5 className="font-black text-dark mb-6 flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-gold rounded-full" />
                         {lang === 'ar' ? 'الجوائز والشارات' : 'Rewards & Badges'}
                       </h5>
                       <div className="space-y-4">
                         {userProfile?.availableRewards?.length ? userProfile.availableRewards.map((reward, i) => (
                           <div key={i} className="flex items-center gap-4 p-4 bg-gold/5 rounded-2xl border border-gold/10">
                              <Trophy className="w-6 h-6 text-gold" />
                              <span className="font-bold text-dark text-sm">{reward}</span>
                           </div>
                         )) : (
                           <div className="text-center py-8">
                             <p className="text-xs font-bold text-gray-400">لا توجد جوائز حالياً</p>
                           </div>
                         )}
                       </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                       <h5 className="font-black text-dark mb-6 flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-gold rounded-full" />
                         {lang === 'ar' ? 'مميزات العضوية' : 'Benefits'}
                       </h5>
                       <ul className="space-y-4">
                          {[
                            { ar: 'أولوية الحجز', en: 'Priority Booking' },
                            { ar: 'كاش باك تصاعدي', en: 'Progressive Cashback' },
                            { ar: 'ترقية مجانية', en: 'Free Upgrades' }
                          ].map((benefit, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-dark">
                               <Check className="w-4 h-4 text-green-500" />
                               {lang === 'ar' ? benefit.ar : benefit.en}
                            </li>
                          ))}
                       </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-gradient-to-br from-gold to-dark rounded-[2.5rem] p-10 text-white relative overflow-hidden text-center">
                    <div className="relative z-10 space-y-6">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-6">
                        <Gift className="w-10 h-10 text-white" />
                      </div>
                      <h4 className="text-3xl font-black">{lang === 'ar' ? 'شارك واربح رصيد!' : 'Refer & Earn Credit!'}</h4>
                      <p className="text-white/70 max-w-sm mx-auto text-sm leading-relaxed">
                        {lang === 'ar' 
                          ? 'أرسل كود الإحالة لأصدقائك واحصل على 5 BHD رصيد في محفظتك لكل صديق يقوم برحلته الأولى.'
                          : 'Send your referral code to friends and get 5 BHD credit in your wallet for every friend who completes their first trip.'}
                      </p>
                      
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col items-center gap-4 max-w-sm mx-auto">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gold">{lang === 'ar' ? 'كود الإحالة الخاص بك' : 'Your Referral Code'}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-black tracking-widest">{userProfile?.referralCode || '------'}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(userProfile?.referralCode || '');
                              alert(lang === 'ar' ? 'تم نسخ الكود!' : 'Code copied!');
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gold" />
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          const message = lang === 'ar' 
                            ? `استخدم كودي ${userProfile?.referralCode} في GCC TAXI واحصل على خصم أول رحلة!`
                            : `Use my code ${userProfile?.referralCode} on GCC TAXI and get a discount on your first trip!`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="bg-white text-dark py-4 px-8 rounded-2xl font-black text-sm flex items-center justify-center gap-2 mx-auto hover:bg-gold transition-all"
                      >
                        <Share2 className="w-4 h-4" />
                        {lang === 'ar' ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}
                      </button>
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
