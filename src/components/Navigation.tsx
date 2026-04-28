
import React from 'react';
import { Car, Wallet, Settings, Users, LogOut, Menu, X, ShieldCheck, Clock3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings, UserProfile } from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';

interface NavigationProps {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  siteSettings: SiteSettings;
  user: User | null;
  isAdmin: boolean;
  isDriver: boolean;
  setIsDashboardOpen: (open: boolean) => void;
  setIsDriverDashboardOpen: (open: boolean) => void;
  setIsCustomerDashboardOpen: (open: boolean) => void;
  setIsPaymentOpen: (open: boolean) => void;
  handleLogin: () => void;
  handleLogout: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export const Navigation = ({
  lang,
  setLang,
  siteSettings,
  user,
  isAdmin,
  isDriver,
  setIsDashboardOpen,
  setIsDriverDashboardOpen,
  setIsCustomerDashboardOpen,
  setIsPaymentOpen,
  handleLogin,
  handleLogout,
  isMenuOpen,
  setIsMenuOpen
}: NavigationProps) => {
  const t = (key: keyof typeof translations.ar) => translations[lang][key] || key;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              {siteSettings.showHeaderLogo && (
                siteSettings.logo ? (
                  <img 
                    src={siteSettings.logo} 
                    alt="Logo" 
                    className="h-12 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <>
                    <div className="w-10 h-10 bg-dark rounded-xl flex items-center justify-center">
                      <Car className="text-gold w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-dark uppercase">{lang === 'ar' ? siteSettings.companyName : (siteSettings.companyName_en || siteSettings.companyName)}</span>
                  </>
                )
              )}
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 text-dark font-bold hover:bg-gray-100 transition-all border border-gray-200"
              >
                {lang === 'ar' ? 'English' : 'العربية'}
              </button>
              <a href="#" className="text-gray-600 hover:text-dark transition-colors">{t('home')}</a>
              <a href="#services" className="text-gray-600 hover:text-dark transition-colors">{t('services')}</a>
              <a href="#specialized-services" className="text-gray-600 hover:text-dark transition-colors">{t('specializedServices')}</a>
              <a href="#about" className="text-gray-600 hover:text-dark transition-colors">{t('whyUs')}</a>
              <button 
                onClick={() => setIsPaymentOpen(true)}
                className="flex items-center gap-2 text-dark font-bold hover:text-gold transition-colors"
              >
                <Wallet className="w-5 h-5" />
                {t('payTrip')}
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setIsDashboardOpen(true)}
                  className="flex items-center gap-2 text-gold font-bold hover:text-gold/80 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  {t('dashboard')}
                </button>
              )}
              {isDriver && (
                <button 
                  onClick={() => {
                    setIsDriverDashboardOpen(true);
                    setIsDashboardOpen(false);
                    setIsCustomerDashboardOpen(false);
                  }}
                  className="flex items-center gap-2 text-gold font-bold hover:text-gold/80 transition-colors"
                >
                  <Car className="w-5 h-5" />
                  {lang === 'ar' ? 'لوحة السائق' : 'Driver Panel'}
                </button>
              )}
              {user && !isAdmin && !isDriver && (
                <button 
                  onClick={() => setIsCustomerDashboardOpen(true)}
                  className="flex items-center gap-2 text-gold font-bold hover:text-gold/80 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  {t('customerDashboard')}
                </button>
              )}
              {!user ? (
                <button 
                  onClick={handleLogin}
                  className="bg-dark text-white px-6 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-all"
                >
                  {t('login')}
                </button>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
              <a 
                href="#booking-form" 
                className="bg-dark text-white px-6 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-all"
              >
                {t('bookNow')}
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden overflow-y-auto"
          >
            <div className="flex flex-col gap-6 text-xl font-medium">
              <div className="flex justify-center mb-4">
                {siteSettings.logo ? (
                  <img src={siteSettings.logo} alt="Logo" className="h-20 w-auto object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-dark rounded-2xl flex items-center justify-center">
                    <Car className="text-gold w-10 h-10" />
                  </div>
                )}
              </div>
              <a href="#" onClick={() => setIsMenuOpen(false)}>{t('home')}</a>
              <a href="#services" onClick={() => setIsMenuOpen(false)}>{t('services')}</a>
              <a href="#specialized-services" onClick={() => setIsMenuOpen(false)}>{t('specializedServices')}</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)}>{t('whyUs')}</a>
              
              {isDriver && (
                <button 
                  onClick={() => {
                    setIsDriverDashboardOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="text-right font-bold text-gold flex items-center gap-2"
                >
                  <Car className="w-5 h-5" />
                  {lang === 'ar' ? 'لوحة السائق' : 'Driver Panel'}
                </button>
              )}
              
              <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                <button 
                  onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setIsMenuOpen(false); }}
                  className="text-left font-bold text-gold"
                >
                  {lang === 'ar' ? 'English' : 'العربية'}
                </button>
                {!user ? (
                   <button 
                    onClick={() => { handleLogin(); setIsMenuOpen(false); }}
                    className="bg-dark text-white px-6 py-3 rounded-xl font-medium"
                  >
                    {t('login')}
                  </button>
                ) : (
                  <button 
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="text-red-500 font-bold"
                  >
                    {t('logout')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
