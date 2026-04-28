
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Clock, Users, ShoppingBag, Car, Star, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { BookingData, SiteSettings } from '../../types';
import { translations } from '../../translations';
import { cn } from '../../lib/utils';

interface BookingFormProps {
  lang: 'ar' | 'en';
  siteSettings: SiteSettings;
  bookingData: BookingData;
  setBookingData: (data: BookingData) => void;
  bookingMode: 'fixed' | 'custom' | 'realtime';
  setBookingMode: (mode: 'fixed' | 'custom' | 'realtime') => void;
  handleBooking: (e: React.FormEvent) => void;
  isBooking: boolean;
}

export const BookingForm = ({
  lang, siteSettings, bookingData, setBookingData, bookingMode, setBookingMode, handleBooking, isBooking
}: BookingFormProps) => {
  const t = (key: string) => (translations[lang] as any)[key] || key;

  return (
    <section id="booking" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -ml-48 -mb-48" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Star className="w-3 h-3 fill-gold" />
              {t('bookingSection')}
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-dark mb-6 leading-tight">
              {lang === 'ar' ? 'احجز رحلتك الفاخرة' : 'Book Your Luxury Trip'} <br />
              <span className="text-gray-300">{lang === 'ar' ? 'بلمسة واحدة' : 'With One Touch'}</span>
            </h2>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-lg">
              {lang === 'ar'
                ? 'نقدم لك أسهل طريقة لحجز تنقلاتك بين دول الخليج. اختر وجهتك ودع الباقي علينا.'
                : 'We offer you the easiest way to book your transfers between GCC countries. Choose your destination and leave the rest to us.'}
            </p>
            
            <div className="space-y-6">
              {[
                { label: lang === 'ar' ? 'توصيل من الباب للباب' : 'Door-to-door delivery', icon: ShieldCheck },
                { label: lang === 'ar' ? 'تتبع فوري للرحلة' : 'Real-time trip tracking', icon: MapPin },
                { label: lang === 'ar' ? 'دعم فني 24/7' : '24/7 support', icon: Users },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-dark">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-dark/5 border border-gray-100"
          >
            <div className="flex gap-4 p-2 bg-gray-50 rounded-2xl mb-8 overflow-x-auto">
              <button 
                onClick={() => setBookingMode('realtime')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap px-4",
                  bookingMode === 'realtime' ? "bg-white text-dark shadow-sm" : "text-gray-400 hover:text-dark"
                )}
              >
                {lang === 'ar' ? 'حجز فوري (تتبع مباشر)' : 'Instant (Live Tracking)'}
              </button>
              <button 
                onClick={() => setBookingMode('custom')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap px-4",
                  bookingMode === 'custom' ? "bg-white text-dark shadow-sm" : "text-gray-400 hover:text-dark"
                )}
              >
                {lang === 'ar' ? 'رحلة مخصصة (واتساب)' : 'Custom (WhatsApp)'}
              </button>
              <button 
                onClick={() => setBookingMode('fixed')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap px-4",
                  bookingMode === 'fixed' ? "bg-white text-dark shadow-sm" : "text-gray-400 hover:text-dark"
                )}
              >
                {lang === 'ar' ? 'مسارات ثابتة' : 'Fixed Routes'}
              </button>
            </div>

            <form onSubmit={handleBooking} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('name')}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="John Doe"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-bold placeholder:text-gray-300"
                    value={bookingData.customerName}
                    onChange={e => setBookingData({ ...bookingData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('phone')}</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+973 1234 5678"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-bold placeholder:text-gray-300"
                    value={bookingData.phone}
                    onChange={e => setBookingData({ ...bookingData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('pickup')}</label>
                  <div className="relative">
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gold w-5 h-5 pointer-events-none" />
                    <input 
                      type="text" 
                      required
                      placeholder="Manama, Bahrain"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-6 focus:ring-2 focus:ring-gold/20 transition-all font-bold placeholder:text-gray-300"
                      value={bookingData.pickup}
                      onChange={e => setBookingData({ ...bookingData, pickup: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('dropoff')}</label>
                  <div className="relative">
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 pointer-events-none" />
                    <input 
                      type="text" 
                      required
                      placeholder="Dammam, KSA"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-6 focus:ring-2 focus:ring-gold/20 transition-all font-bold placeholder:text-gray-300"
                      value={bookingData.dropoff}
                      onChange={e => setBookingData({ ...bookingData, dropoff: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('date')}</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-bold"
                    value={bookingData.date}
                    onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('time')}</label>
                  <input 
                    type="time" 
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-bold"
                    value={bookingData.time}
                    onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{t('passengers')}</label>
                  <div className="relative">
                    <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 pointer-events-none" />
                    <input 
                      type="number" 
                      min="1"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-10 pl-4 focus:ring-2 focus:ring-gold/20 transition-all font-bold"
                      value={bookingData.passengers}
                      onChange={e => setBookingData({ ...bookingData, passengers: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{t('bags')}</label>
                  <div className="relative">
                    <ShoppingBag className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 pointer-events-none" />
                    <input 
                      type="number" 
                      min="0"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-10 pl-4 focus:ring-2 focus:ring-gold/20 transition-all font-bold"
                      value={bookingData.bags}
                      onChange={e => setBookingData({ ...bookingData, bags: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{t('carType')}</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-gold/20 transition-all font-bold"
                    value={bookingData.carType}
                    onChange={e => setBookingData({ ...bookingData, carType: e.target.value as any })}
                  >
                    <option value="Standard">Standard</option>
                    <option value="VIP">VIP</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isBooking}
                className="w-full bg-dark text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-dark/20 hover:bg-gold hover:shadow-gold/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isBooking ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Star className="w-6 h-6 text-gold group-hover:text-white transition-colors" />
                )}
                {isBooking 
                  ? (lang === 'ar' ? 'جاري الحفظ...' : 'Booking...') 
                  : (bookingMode === 'realtime' ? (lang === 'ar' ? 'ابدأ البحث عن سائق' : 'Start Searching') : (bookingMode === 'fixed' ? t('confirmBooking') : t('sendRequest')))
                }
                {!isBooking && <ArrowRight className={cn("w-5 h-5", lang === 'ar' ? "rotate-180" : "")} />}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
