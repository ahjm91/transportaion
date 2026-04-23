
import React from 'react';
import { Instagram, Twitter, Send, Phone, MapPin, Car } from 'lucide-react';
import { SiteSettings } from '../types';
import { translations } from '../translations';

interface FooterProps {
  lang: 'ar' | 'en';
  siteSettings: SiteSettings;
}

export const Footer = ({ lang, siteSettings }: FooterProps) => {
  const t = (key: keyof typeof translations.ar) => translations[lang][key] || key;
  
  return (
    <footer className="bg-dark text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
                <Car className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tighter text-white uppercase">{lang === 'ar' ? siteSettings.companyName : (siteSettings.companyName_en || siteSettings.companyName)}</span>
            </div>
            <p className="text-gray-400 max-w-sm leading-relaxed mb-8">
              {lang === 'ar' ? siteSettings.footerAbout : (siteSettings.footerAbout_en || siteSettings.footerAbout)}
            </p>
            {siteSettings.showFooterSocials && (
              <div className="flex gap-4">
                {siteSettings.instagram && (
                  <a href={siteSettings.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-gold transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {siteSettings.twitter && (
                  <a href={siteSettings.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-gold transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {siteSettings.telegram && (
                  <a href={siteSettings.telegram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-gold transition-colors">
                    <Send className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-gold">{lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">{t('home')}</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">{t('services')}</a></li>
              <li><a href="#specialized-services" className="hover:text-white transition-colors">{t('specializedServices')}</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">{t('whyUs')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-gold">{lang === 'ar' ? 'للتواصل' : 'Contact'}</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold" />
                <span>{siteSettings.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gold" />
                <span>{lang === 'ar' ? siteSettings.footerAddress : (siteSettings.footerAddress_en || siteSettings.footerAddress)}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} {siteSettings.companyName}. {t('rights')}
          </p>
          <div className="flex gap-8 text-sm text-gray-500">
            <button className="hover:text-gold transition-colors">{t('terms')}</button>
            <button className="hover:text-gold transition-colors">{t('privacy')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
