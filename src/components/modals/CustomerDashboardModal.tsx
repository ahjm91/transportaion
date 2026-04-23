
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MapPin, Calendar, Clock, CreditCard, Star, Trophy, Gift, Check, Car } from 'lucide-react';
import { Trip, SiteSettings, UserProfile } from '../../types';
import { cn } from '../../lib/utils';

interface CustomerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  t: (key: string) => string;
  siteSettings: SiteSettings;
  userProfile: UserProfile | null;
  customerTrips: Trip[];
  customerTab: string;
  setCustomerTab: (tab: 'trips' | 'rewards') => void;
  onPayNow: (trip: Trip) => void;
}

export const CustomerDashboardModal = ({
  isOpen, onClose, lang, t, siteSettings, userProfile, customerTrips, customerTab, setCustomerTab, onPayNow
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
                    <Car className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-dark">{lang === 'ar' ? 'لا توجد رحلات' : 'No trips found'}</h4>
                    <p className="text-gray-400 text-sm">{lang === 'ar' ? 'لم تقم بحجز أي رحلات بعد.' : 'You haven\'t booked any trips yet.'}</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                     {customerTrips.map(trip => (
                       <div key={trip.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <div className="flex justify-between items-start">
                             <span className={cn(
                               "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                               trip.paymentStatus === 'Paid' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                             )}>
                               {trip.paymentStatus}
                             </span>
                             <p className="text-xl font-black text-gold">{trip.amount} BHD</p>
                          </div>
                          <h5 className="font-black text-dark">{trip.direction}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-gray-500">
                             <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {trip.pickup}</div>
                             <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {trip.date}</div>
                             <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> {trip.time}</div>
                             <div className="flex items-center gap-2"><Users className="w-3 h-3" /> {trip.passengers} pax</div>
                          </div>
                          {trip.amount > 0 && trip.paymentStatus !== 'Paid' && (
                            <button 
                              onClick={() => onPayNow(trip)}
                              className="w-full bg-dark text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gold transition-all"
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
                  <div className="bg-dark rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                     <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-right">
                           <p className="text-gold text-[10px] font-black uppercase tracking-widest mb-2">Member Tier</p>
                           <h4 className="text-4xl font-black flex items-center gap-4">
                             <Star className="w-10 h-10 fill-gold text-gold" />
                             {userProfile?.membershipStatus || 'Bronze'}
                           </h4>
                        </div>
                        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-3xl text-center">
                           <p className="text-white/40 text-[10px] font-black uppercase mb-1">Cashback Balance</p>
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
                          {['أولوية الحجز', 'كاش باك تصاعدي', 'ترقية مجانية'].map((benefit, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-dark">
                               <Check className="w-4 h-4 text-green-500" />
                               {benefit}
                            </li>
                          ))}
                       </ul>
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
