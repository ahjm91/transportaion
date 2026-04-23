
import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Clock3, Star, MapPin, ChevronRight, Users, Bus, Clock, DollarSign, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { SiteSettings, Service, SpecializedService } from '../types';
import { translations } from '../translations';
import { cn } from '../lib/utils';

export const Hero = ({ lang, siteSettings, t }: { lang: 'ar' | 'en', siteSettings: SiteSettings, t: any }) => (
  <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
    <div 
      className="absolute inset-0 -z-20 bg-cover bg-center"
      style={{ backgroundImage: `url(${siteSettings.heroImage})` }}
    />
    <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] -z-10" />
    <div className="absolute top-0 right-0 w-1/2 h-full bg-gold/5 -skew-x-12 transform translate-x-1/4 -z-10" />
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-dark mb-6">
            {lang === 'ar' ? siteSettings.heroTitle : (siteSettings.heroTitle_en || siteSettings.heroTitle)} <br />
            <span className="text-gold">{lang === 'ar' ? siteSettings.heroSubtitle : (siteSettings.heroSubtitle_en || siteSettings.heroSubtitle)}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-lg">
            {lang === 'ar' ? siteSettings.heroDescription : (siteSettings.heroDescription_en || siteSettings.heroDescription)}
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white shadow-sm border border-gray-100 px-4 py-2 rounded-full">
              <ShieldCheck className="text-green-500 w-5 h-5" />
              <span className="text-sm font-medium">{t('safeTrips')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white shadow-sm border border-gray-100 px-4 py-2 rounded-full">
              <Clock3 className="text-blue-500 w-5 h-5" />
              <span className="text-sm font-medium">{t('available247')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export const Services = ({ lang, services, t }: { lang: 'ar' | 'en', services: Service[], t: any }) => (
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

export const SpecializedServices = ({ lang, specializedServices, t }: { lang: 'ar' | 'en', specializedServices: SpecializedService[], t: any }) => (
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
