
import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Clock3, Star, MapPin, ChevronRight, Users, Bus, Clock, DollarSign, Loader2, ArrowUp, ArrowDown, Phone } from 'lucide-react';
import { SiteSettings, Service, SpecializedService, FixedRoute, BookingData } from '../types';
import { translations } from '../translations';
import { cn } from '../lib/utils';

export const Hero = ({ 
  lang, 
  siteSettings, 
  t,
  bookingMode,
  setBookingMode,
  fixedRoutes,
  bookingData,
  setBookingData,
  handleBookingSubmit,
  isBooking
}: { 
  key?: string | number,
  lang: 'ar' | 'en', 
  siteSettings: SiteSettings, 
  t: any,
  bookingMode: 'fixed' | 'custom' | 'realtime',
  setBookingMode: (mode: 'fixed' | 'custom' | 'realtime') => void,
  fixedRoutes: FixedRoute[],
  bookingData: BookingData,
  setBookingData: (data: BookingData) => void,
  handleBookingSubmit: (e: React.FormEvent) => void,
  isBooking: boolean
}) => (
  <section id="hero" className="relative pt-32 pb-44 overflow-hidden min-h-[90vh] flex items-center">
    {/* Main Background Image */}
    <div className="absolute inset-0 z-0">
      <img 
        src={siteSettings.heroImage} 
        alt="Luxury Fleet" 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={(e) => {
          console.error('Image load error (hero):', siteSettings.heroImage);
          const fallback = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1920';
          if ((e.target as HTMLImageElement).src !== fallback) {
            (e.target as HTMLImageElement).src = fallback;
          }
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-dark/70 via-dark/40 to-white" />
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
      <div className={cn(
        "grid gap-16 items-center",
        siteSettings.layoutDensity === 'compact' ? "lg:grid-cols-2" : "grid-cols-1 text-center"
      )}>
        {/* Text Side */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={cn(
            "text-white space-y-8", 
            siteSettings.layoutDensity === 'compact' ? (lang === 'ar' ? "text-right" : "text-left") : "max-w-4xl mx-auto"
          )}
        >
          <div className="inline-flex items-center gap-2 bg-gold/20 backdrop-blur-md px-4 py-2 rounded-full border border-gold/30 text-gold mb-4">
            <Star className="w-4 h-4 fill-gold" />
            <span className="text-xs font-black uppercase tracking-widest">{lang === 'ar' ? 'الخدمة رقم 1 في الخليج' : '#1 Service in GCC'}</span>
          </div>
          <h1 className="text-6xl lg:text-7xl font-black leading-tight">
            {lang === 'ar' ? siteSettings.heroTitle : (siteSettings.heroTitle_en || siteSettings.heroTitle)}
          </h1>
          <h2 className="text-3xl lg:text-4xl font-bold text-gold opacity-90">
            {lang === 'ar' ? siteSettings.heroSubtitle : (siteSettings.heroSubtitle_en || siteSettings.heroSubtitle)}
          </h2>
          <p className="text-xl text-gray-300 max-w-xl font-medium leading-relaxed">
            {lang === 'ar' ? siteSettings.heroDescription : (siteSettings.heroDescription_en || siteSettings.heroDescription)}
          </p>
          
          <div className={cn(
            "flex flex-wrap gap-4 pt-8",
            siteSettings.layoutDensity === 'compact' ? "" : "justify-center"
          )}>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <ShieldCheck className="text-green-400 w-5 h-5" />
              <span className="text-sm font-medium">{t('safeTrips')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <Clock3 className="text-blue-500 w-5 h-5" />
              <span className="text-sm font-medium">{t('available247')}</span>
            </div>
          </div>
        </motion.div>

        {/* Booking Card */}
        <motion.div
          id="booking-form"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={cn(
            "bg-white rounded-[2.5rem] shadow-3xl shadow-dark/10 border border-gray-100 overflow-hidden w-full mx-auto transition-all",
            siteSettings.layoutDensity === 'compact' ? "max-w-xl" : (siteSettings.layoutDensity === 'comfortable' ? "max-w-5xl" : "max-w-7xl")
          )}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setBookingMode('fixed')}
              className={cn(
                "flex-1 py-5 text-sm font-black transition-all flex items-center justify-center gap-2",
                bookingMode === 'fixed' ? "bg-gold text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              )}
            >
              <Star className="w-4 h-4" />
              {t('fixedBooking')}
            </button>
            <button 
              onClick={() => setBookingMode('custom')}
              className={cn(
                "flex-1 py-5 text-sm font-black transition-all flex items-center justify-center gap-2",
                bookingMode === 'custom' ? "bg-gold text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              )}
            >
              <MapPin className="w-4 h-4" />
              {t('customBooking')}
            </button>
          </div>

          <form 
            onSubmit={handleBookingSubmit}
            className="p-8 lg:p-10 space-y-6 text-right"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="space-y-4">
               {bookingMode === 'fixed' ? (
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('selectDropoff')} *</label>
                   <select 
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 font-bold text-dark appearance-none"
                      onChange={e => {
                        const route = fixedRoutes.find(r => r.id === e.target.value);
                        if (route) {
                          setBookingData({ 
                            ...bookingData, 
                            pickup: route.pickup, 
                            dropoff: route.dropoff, 
                            amount: route.price,
                            bookingType: 'transfer'
                          });
                        }
                      }}
                   >
                     <option value="">{t('selectDropoff')}</option>
                     {fixedRoutes.map(r => <option key={r.id} value={r.id}>{lang === 'ar' ? `${r.pickup} - ${r.dropoff}` : `${r.pickup_en || r.pickup} - ${r.dropoff_en || r.dropoff}`}</option>)}
                   </select>
                 </div>
               ) : (
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('pickupLocation')} *</label>
                      <input 
                        required
                        placeholder={t('pickupLocation')} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 font-bold" 
                        value={bookingData.pickup} 
                        onChange={e => setBookingData({...bookingData, pickup: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('dropoffLocation')} *</label>
                      <input 
                        required
                        placeholder={t('dropoffLocation')} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 font-bold" 
                        value={bookingData.dropoff} 
                        onChange={e => setBookingData({...bookingData, dropoff: e.target.value})} 
                      />
                    </div>
                 </div>
               )}
               
               <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('firstName')} *</label>
                    <input 
                      required 
                      placeholder={t('firstName')} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 font-bold" 
                      value={bookingData.firstName} 
                      onChange={e => {
                        const val = e.target.value;
                        const newFirstName = val;
                        const newLastName = bookingData.lastName || '';
                        setBookingData({
                          ...bookingData, 
                          firstName: newFirstName, 
                          customerName: `${newFirstName} ${newLastName}`.trim()
                        });
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('lastName')} *</label>
                    <input 
                      required 
                      placeholder={t('lastName')} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 font-bold" 
                      value={bookingData.lastName} 
                      onChange={e => {
                        const val = e.target.value;
                        const newFirstName = bookingData.firstName || '';
                        const newLastName = val;
                        setBookingData({
                          ...bookingData, 
                          lastName: newLastName, 
                          customerName: `${newFirstName} ${newLastName}`.trim()
                        });
                      }} 
                    />
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('emailAddress')} *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="email@example.com" 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 font-bold" 
                      value={bookingData.email} 
                      onChange={e => setBookingData({...bookingData, email: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('phone')} *</label>
                    <div className="flex gap-2">
                      <select 
                        className="bg-gray-50 border border-gray-100 rounded-2xl px-2 font-bold text-xs"
                        value={bookingData.countryCode}
                        onChange={e => setBookingData({...bookingData, countryCode: e.target.value})}
                      >
                        <option value="+973">+973</option>
                        <option value="+966">+966</option>
                        <option value="+971">+971</option>
                        <option value="+965">+965</option>
                        <option value="+968">+968</option>
                        <option value="+974">+974</option>
                      </select>
                      <input 
                        type="tel" 
                        required
                        placeholder="3232xxxx" 
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 font-bold" 
                        value={bookingData.phone} 
                        onChange={e => setBookingData({...bookingData, phone: e.target.value})} 
                      />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('date')} *</label>
                    <input 
                      type="date"
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-gold/20 font-bold text-sm" 
                      value={bookingData.date} 
                      onChange={e => setBookingData({...bookingData, date: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('time')} *</label>
                    <input 
                      type="time"
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-gold/20 font-bold text-sm" 
                      value={bookingData.time} 
                      onChange={e => setBookingData({...bookingData, time: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('carType')} *</label>
                    <select 
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-gold/20 font-bold text-sm" 
                      value={bookingData.carType} 
                      onChange={e => setBookingData({...bookingData, carType: e.target.value as any})} 
                    >
                      <option value="Standard">{t('standard')}</option>
                      <option value="VIP">{t('vip')}</option>
                      <option value="Van">{t('van')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('passengers')} *</label>
                    <input 
                      type="number"
                      min="1"
                      max="7"
                      required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-gold/20 font-bold text-sm" 
                      value={bookingData.passengers} 
                      onChange={e => setBookingData({...bookingData, passengers: parseInt(e.target.value)})} 
                    />
                  </div>
               </div>

               <button 
                type="submit"
                disabled={isBooking}
                className="w-full bg-dark text-white py-6 rounded-[2rem] font-black text-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-xl shadow-dark/10 group active:scale-95"
              >
                {isBooking ? <Loader2 className="animate-spin w-6 h-6 text-gold" /> : <Star className="w-6 h-6 text-gold group-hover:rotate-45 transition-transform" />}
                {isBooking ? (lang === 'ar' ? 'جاري الحفظ...' : 'Booking...') : (bookingMode === 'fixed' ? t('confirmBooking') : t('sendRequest'))}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  </section>
);

export const Services = ({ lang, services, t }: { key?: string | number, lang: 'ar' | 'en', services: Service[], t: any }) => (
  <section id="services" className="py-24 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-dark mb-4">{t('ourServices')}</h2>
        <p className="text-gray-500 text-lg">{t('ourServicesDesc')}</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <motion.div 
            key={service.id}
            whileHover={{ y: -10 }}
            className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-dark/5 border border-gray-100 group"
          >
            <div className="h-64 overflow-hidden relative">
              <img 
                src={service.image} 
                alt={service.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                crossOrigin="anonymous"
                onError={(e) => {
                   const fallback = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800';
                   (e.target as HTMLImageElement).src = fallback;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-dark">{lang === 'ar' ? service.name : (service.name_en || service.name)}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {lang === 'ar' ? service.description : (service.description_en || service.description)}
              </p>
              <ul className="space-y-3">
                {(lang === 'ar' ? service.features : (service.features_en || service.features)).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-medium text-gray-500">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export const SpecializedServices = ({ lang, specializedServices, t }: { key?: string | number, lang: 'ar' | 'en', specializedServices: SpecializedService[], t: any }) => (
  <section id="specialized-services" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-black text-dark mb-4">{t('specializedServices')}</h2>
          <p className="text-gray-500 text-lg">{t('specializedServicesDesc')}</p>
        </div>
        <div className="flex gap-2">
          <div className="w-12 h-1 bg-gold rounded-full" />
          <div className="w-4 h-1 bg-gray-200 rounded-full" />
          <div className="w-4 h-1 bg-gray-200 rounded-full" />
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {specializedServices.map((service) => (
          <div key={service.id} className="group cursor-pointer">
            <div className="relative h-80 rounded-[2.5rem] overflow-hidden mb-6 shadow-2xl shadow-dark/5">
              <img 
                src={service.image} 
                alt={service.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                crossOrigin="anonymous"
                onError={(e) => {
                  let fallback = 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=800';
                  if (service.title.includes('دبي') || service.title_en?.includes('Dubai')) fallback = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800';
                  if (service.title.includes('أبو ظبي') || service.title_en?.includes('Abu Dhabi')) fallback = 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800';
                  (e.target as HTMLImageElement).src = fallback;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center backdrop-blur-md">
                    {service.iconImage ? (
                      <img src={service.iconImage} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <MapPin className="text-white w-6 h-6" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{lang === 'ar' ? service.title : (service.title_en || service.title)}</h3>
                </div>
              </div>
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <ChevronRight className={cn("w-6 h-6 text-dark", lang === 'ar' ? "rotate-180" : "")} />
                </div>
              </div>
            </div>
            <p className="text-gray-500 leading-relaxed px-4">
              {lang === 'ar' ? service.desc : (service.desc_en || service.desc)}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const WhyUs = ({ lang, siteSettings, t }: { key?: string | number, lang: 'ar' | 'en', siteSettings: SiteSettings, t: any }) => (
  <section id="about" className="py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <img 
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800" 
            alt="Luxury Car Interior" 
            className="rounded-[2.5rem] shadow-2xl"
          />
          <div className="absolute -bottom-8 -left-8 bg-gold p-8 rounded-3xl text-white shadow-xl hidden md:block">
            <div className="text-4xl font-bold mb-1">10+</div>
            <div className="text-sm opacity-90">{lang === 'ar' ? 'سنوات من الخبرة' : 'Years of Experience'}</div>
          </div>
        </div>
        
        <div className="space-y-8">
          <div className={cn(lang === 'ar' ? "text-right" : "text-left")}>
            <h2 className="text-4xl font-bold text-dark mb-4">
              {lang === 'ar' 
                ? `لماذا تختار ${siteSettings.companyName}؟` 
                : `Why Choose ${siteSettings.companyName_en || siteSettings.companyName}?`}
            </h2>
            <p className="text-gray-600">
              {lang === 'ar'
                ? 'نحن نؤمن بأن الرحلة لا تقل أهمية عن الوجهة. لذلك نسعى جاهدين لتقديم أفضل تجربة ممكنة.'
                : 'We believe that the journey is as important as the destination. Therefore, we strive to provide the best possible experience.'}
            </p>
          </div>

          <div className="grid gap-6">
            {[
              { 
                icon: <ShieldCheck className="w-6 h-6" />, 
                title: lang === 'ar' ? "أمان وخصوصية تامة" : "Total Safety & Privacy", 
                desc: lang === 'ar' ? "جميع رحلاتنا مراقبة ونضمن لك خصوصية كاملة خلال تنقلك." : "All our trips are monitored and we guarantee total privacy during your travel."
              },
              { 
                icon: <Clock3 className="w-6 h-6" />, 
                title: lang === 'ar' ? "دقة متناهية في المواعيد" : "Extreme Punctuality", 
                desc: lang === 'ar' ? "نصل إليك قبل الموعد المحدد لضمان وصولك في الوقت المناسب." : "We arrive before the scheduled time to ensure you arrive on time."
              },
              { 
                icon: <Star className="w-6 h-6" />, 
                title: lang === 'ar' ? "سائقون محترفون" : "Professional Drivers", 
                desc: lang === 'ar' ? "نخبة من السائقين المدربين على أعلى معايير الضيافة والقيادة الآمنة." : "A selection of drivers trained to the highest standards of hospitality and safe driving."
              }
            ].map((item, i) => (
              <div key={i} className={cn("flex gap-4 p-6 rounded-2xl bg-gray-50 hover:bg-gold/5 transition-colors")}>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-gold shrink-0">
                  {item.icon}
                </div>
                <div className={cn(lang === 'ar' ? "text-right" : "text-left")}>
                  <h4 className="font-bold mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export const CTA = ({ lang, siteSettings, t }: { key?: string | number, lang: 'ar' | 'en', siteSettings: SiteSettings, t: any }) => (
  <section id="cta" className="py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-dark rounded-[3rem] p-12 lg:p-20 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">{lang === 'ar' ? 'جاهز لرحلتك القادمة؟' : 'Ready for your next trip?'}</h2>
          <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
            {lang === 'ar'
              ? 'احجز معنا الان واستمتع بخصم 20% على رحلاتك في شهرك الاول معنا'
              : 'Book with us now and enjoy a 20% discount on your trips during your first month with us'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href={`https://wa.me/${siteSettings.whatsapp}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gold text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gold/90 transition-all"
            >
              {lang === 'ar' ? (siteSettings.bookingButtonText || t('bookNow')) : (siteSettings.bookingButtonText_en || t('bookNow'))}
            </a>
            <a 
              href={`tel:${siteSettings.phone}`} 
              className="bg-white/10 text-white backdrop-blur border border-white/20 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              {t('contactUs')}
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);
