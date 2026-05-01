
import React from 'react';
import { Star, ImageIcon, Upload, Menu, Phone, Palette, Type, Layout, Eye, Check, Layers, ChevronRight } from 'lucide-react';
import { SiteSettings } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { cn } from '../../lib/utils';

interface BrandingTabProps {
  siteSettings: SiteSettings;
  setSiteSettings: (settings: SiteSettings) => void;
  handleImageUpload: (file: File, collectionName: string, docId: string, fieldName: string) => Promise<void>;
  safeUpdateDoc: (ref: any, data: any) => Promise<void>;
  lang: 'ar' | 'en';
}

export const BrandingTab = ({ siteSettings, setSiteSettings, handleImageUpload, safeUpdateDoc, lang }: BrandingTabProps) => {
  const updateSettings = (updates: Partial<SiteSettings>) => {
    const newSettings = { ...siteSettings, ...updates };
    setSiteSettings(newSettings);
    updateDoc(doc(db, 'settings', 'site'), updates);
  };

  const themes = [
    { name: 'Luxury Gold', primary: '#D4AF37', secondary: '#1A1A1A', accent: '#F5F5F5' },
    { name: 'Royal Silver', primary: '#A8A9AD', secondary: '#111827', accent: '#F9FAFB' },
    { name: 'Midnight', primary: '#6366F1', secondary: '#0F172A', accent: '#1E293B' },
    { name: 'Emerald', primary: '#10B981', secondary: '#064E3B', accent: '#F0FDF4' },
  ];

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...(siteSettings.sectionOrder || ['hero', 'services', 'specialized', 'about', 'cta'])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      updateSettings({ sectionOrder: newOrder });
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Quick Themes */}
      <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gold/10 p-2 rounded-xl">
            <Palette className="w-5 h-5 text-gold" />
          </div>
          <h4 className="text-xl font-black text-dark">{lang === 'ar' ? 'انماط جاهزة للثيم' : 'Ready Themes'}</h4>
        </div>
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", lang === 'ar' ? "text-right" : "text-left")}>
          {themes.map((theme) => (
            <button
              key={theme.name}
              onClick={() => updateSettings({ 
                primaryColor: theme.primary, 
                secondaryColor: theme.secondary, 
                accentColor: theme.accent 
              })}
              className={cn("group relative bg-gray-50 p-4 rounded-[2rem] border border-gray-100 hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5 transition-all text-right", lang === 'ar' ? "text-right" : "text-left")}
            >
              <div className="flex gap-1.5 mb-3">
                <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.primary }} />
                <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.secondary }} />
                <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.accent }} />
              </div>
              <span className="text-[10px] font-black text-gray-400 group-hover:text-gold transition-colors">{theme.name}</span>
              {siteSettings.primaryColor === theme.primary && (
                <div className="absolute top-4 left-4 bg-green-500 rounded-full p-1 shadow-lg">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Colors Card */}
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <h5 className="font-black text-dark mb-6 flex items-center gap-3 text-sm">
              <Palette className="w-4 h-4 text-gold" />
              {lang === 'ar' ? 'توازن الألوان' : 'Color Balance'}
            </h5>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-gray-50/50 p-5 rounded-[2rem]">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'اللون الأساسي' : 'Primary Color'}</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    className="w-14 h-14 rounded-2xl cursor-pointer border-4 border-white shadow-sm"
                    value={siteSettings.primaryColor}
                    onChange={e => updateSettings({ primaryColor: e.target.value })}
                  />
                  <input 
                    type="text" 
                    className="flex-1 bg-white border-gray-100 rounded-xl p-3 font-mono text-xs font-bold"
                    value={siteSettings.primaryColor}
                    onChange={e => updateSettings({ primaryColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-4 bg-gray-50/50 p-5 rounded-[2rem]">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'اللون الثانوي' : 'Secondary Color'}</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    className="w-14 h-14 rounded-2xl cursor-pointer border-4 border-white shadow-sm"
                    value={siteSettings.secondaryColor}
                    onChange={e => updateSettings({ secondaryColor: e.target.value })}
                  />
                  <input 
                    type="text" 
                    className="flex-1 bg-white border-gray-100 rounded-xl p-3 font-mono text-xs font-bold"
                    value={siteSettings.secondaryColor}
                    onChange={e => updateSettings({ secondaryColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography & Style Card */}
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <h5 className="font-black text-dark mb-6 flex items-center gap-3 text-sm">
              <Type className="w-4 h-4 text-gold" />
              {lang === 'ar' ? 'تنسيق الخطوط والحواف' : 'Typography & Radii'}
            </h5>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'نوع الخط الأساسي' : 'Primary Font'}</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black text-dark text-sm"
                  value={siteSettings.fontFamily}
                  onChange={e => updateSettings({ fontFamily: e.target.value })}
                >
                  <option value='"Inter", "Noto Sans Arabic", sans-serif'>Modern (Inter)</option>
                  <option value='"Cairo", sans-serif'>Corporate (Cairo)</option>
                  <option value='"Tajawal", sans-serif'>Clean (Tajawal)</option>
                  <option value='"Almarai", sans-serif'>Smooth (Almarai)</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'انحناء الحواف' : 'Border Radius'}</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black text-dark text-sm"
                  value={siteSettings.borderRadius}
                  onChange={e => updateSettings({ borderRadius: e.target.value })}
                >
                  <option value="0rem">Sharp</option>
                  <option value="0.75rem">Soft</option>
                  <option value="1.5rem">Modern</option>
                  <option value="2.5rem">Luxurious</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="space-y-8">
          <div className="sticky top-8 bg-dark p-8 rounded-[3.5rem] shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-gold/20 to-transparent" />
            <div className="relative space-y-8">
              <div className="flex items-center justify-between">
                <h6 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  {lang === 'ar' ? 'معاينة حية للمكونات' : 'Live UI Preview'}
                </h6>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              
              {/* Components Preview */}
              <div className="space-y-6">
                {/* Heading Preview */}
                <div className="space-y-2">
                  <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">{lang === 'ar' ? 'العناوين' : 'Headings'}</span>
                  <h3 
                    className="text-2xl font-black text-white leading-tight" 
                    style={{ fontFamily: siteSettings.fontFamily }}
                  >
                    GCC TAXI <br/> 
                    <span className="text-gold" style={{ color: siteSettings.primaryColor }}>{lang === 'ar' ? 'فخامة التنقل' : 'Luxury Travel'}</span>
                  </h3>
                </div>

                {/* Button Preview */}
                <div className="space-y-3">
                  <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">{lang === 'ar' ? 'الأزرار' : 'Buttons'}</span>
                  <div className="flex flex-col gap-3">
                    <button 
                      className="w-full py-4 px-6 text-xs font-black uppercase tracking-widest transition-all shadow-xl"
                      style={{ 
                        backgroundColor: siteSettings.primaryColor,
                        color: '#fff',
                        borderRadius: siteSettings.buttonStyle === 'pill' ? '9999px' : siteSettings.buttonStyle === 'sharp' ? '0' : siteSettings.borderRadius,
                        boxShadow: `0 10px 20px -5px ${siteSettings.primaryColor}40`
                      }}
                    >
                      {lang === 'ar' ? 'تأكيد الحجز الآن' : 'Confirm Ride Now'}
                    </button>
                    <button 
                      className="w-full py-4 px-6 text-[10px] font-black uppercase tracking-widest border-2 transition-all"
                      style={{ 
                        borderColor: siteSettings.primaryColor,
                        color: siteSettings.primaryColor,
                        borderRadius: siteSettings.buttonStyle === 'pill' ? '9999px' : siteSettings.buttonStyle === 'sharp' ? '0' : siteSettings.borderRadius
                      }}
                    >
                      {lang === 'ar' ? 'تعرف على خدماتنا' : 'Our Services'}
                    </button>
                  </div>
                </div>

                {/* UI Mode Card */}
                <div 
                  className={cn(
                    "p-5 border border-white/5 space-y-3",
                    siteSettings.glassmorphism ? "bg-white/10 backdrop-blur-md" : "bg-white/5"
                  )}
                  style={{ borderRadius: siteSettings.borderRadius }}
                >
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                       <Check className="w-4 h-4 text-gold" />
                     </div>
                     <span className="text-[10px] font-black text-white">{lang === 'ar' ? 'بطاقة معلومات ذكية' : 'Smart Info Card'}</span>
                   </div>
                   <p className="text-[10px] text-white/50 leading-relaxed font-bold">
                     {lang === 'ar' ? 'هذا مثال لكيفية ظهور البطاقات في الموقع عند تفعيل وضع الـ Glassmorphism.' : 'This is an example of how cards appear when Glassmorphism is enabled.'}
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Effects & Layout */}
      <section className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 p-2 rounded-xl">
            <Layers className="w-5 h-5 text-gold" />
          </div>
          <h4 className="text-xl font-black text-dark">{lang === 'ar' ? 'تأثيرات الواجهة والعمق' : 'UI Effects & Depth'}</h4>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-black text-dark uppercase tracking-widest block mb-1">{lang === 'ar' ? 'تأثير الزجاج' : 'Glass Effect'}</label>
                <p className="text-[9px] text-gray-400 font-bold">{lang === 'ar' ? 'يعطي خلفيات شفافة ومموهة للأقسام.' : 'Gives transparent and blurred backgrounds.'}</p>
              </div>
              <button 
                onClick={() => updateSettings({ glassmorphism: !siteSettings.glassmorphism })}
                className={cn(
                  "w-14 h-8 rounded-full transition-all relative p-1",
                  siteSettings.glassmorphism ? 'bg-gold shadow-lg shadow-gold/20' : 'bg-gray-200'
                )}
              >
                <div className={cn("w-6 h-6 rounded-full bg-white transition-all", siteSettings.glassmorphism ? 'translate-x-6' : 'translate-x-0')} />
              </button>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div>
                <label className="text-[10px] font-black text-dark uppercase tracking-widest block mb-1">{lang === 'ar' ? 'كثافة الواجهة' : 'Layout Density'}</label>
              </div>
              <select 
                className="bg-gray-50 border-none rounded-xl p-2 text-xs font-bold text-dark"
                value={siteSettings.layoutDensity || 'comfortable'}
                onChange={e => updateSettings({ layoutDensity: e.target.value as any })}
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-[10px] font-black text-dark uppercase tracking-widest block">{lang === 'ar' ? 'كثافة الظل للمكـونات' : 'Shadow Intensity'}</label>
            <input 
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-gold"
              value={siteSettings.shadowIntensity || 0.15}
              onChange={e => updateSettings({ shadowIntensity: parseFloat(e.target.value) })}
            />
            
            <div className="pt-4 border-t border-gray-50 space-y-4">
              <label className="text-[10px] font-black text-dark uppercase tracking-widest block">{lang === 'ar' ? 'عامل التباعد العام' : 'Global Spacing Factor'}</label>
              <input 
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-gold"
                value={siteSettings.spacingFactor || 1.0}
                onChange={e => updateSettings({ spacingFactor: parseFloat(e.target.value) })}
              />
              <div className="flex justify-between text-[8px] font-black text-gray-400">
                <span>0.5x</span>
                <span>Normal</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <label className="text-[10px] font-black text-dark uppercase tracking-widest block">{lang === 'ar' ? 'نمط الأزرار العام' : 'Global Button Style'}</label>
             <div className="flex bg-gray-50 p-1.5 rounded-2xl items-center gap-2">
               {(['rounded', 'sharp', 'pill'] as const).map((style) => (
                 <button
                   key={style}
                   onClick={() => updateSettings({ buttonStyle: style })}
                   className={cn(
                     "flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase transition-all",
                     siteSettings.buttonStyle === style 
                       ? 'bg-white text-gold shadow-sm' 
                       : 'text-gray-400 hover:text-dark'
                   )}
                 >
                   {style === 'rounded' ? 'Rounded' : style === 'sharp' ? 'Sharp' : 'Pill'}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* SEO & Global Context */}
      <section className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 p-2 rounded-xl">
            <Layers className="w-5 h-5 text-gold" />
          </div>
          <h4 className="text-xl font-black text-dark">{lang === 'ar' ? 'تحسين محركات البحث والبيانات العامة' : 'SEO & Global Meta'}</h4>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'عنوان الموقع (SEO)' : 'Site Title (SEO - AR)'}</label>
            <input 
              type="text" 
              className="w-full bg-white border-none rounded-2xl p-4 font-black text-dark"
              placeholder="مثال: ليموزين الخليج - خدمات نقل فاخرة"
              value={siteSettings.siteTitle || ''}
              onChange={e => updateSettings({ siteTitle: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Site Title (SEO - EN)</label>
            <input 
              type="text" 
              className="w-full bg-white border-none rounded-2xl p-4 font-black text-dark"
              placeholder="Example: GCC Taxi - Luxury Car Service"
              value={siteSettings.siteTitle_en || ''}
              onChange={e => updateSettings({ siteTitle_en: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem] md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'وصف الموقع (AR)' : 'Site Description (AR)'}</label>
            <textarea 
              className="w-full bg-white border-none rounded-2xl p-4 font-bold text-dark h-24"
              value={siteSettings.siteDescription || ''}
              onChange={e => updateSettings({ siteDescription: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem] md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Site Description (EN)</label>
            <textarea 
              className="w-full bg-white border-none rounded-2xl p-4 font-bold text-dark h-24"
              value={siteSettings.siteDescription_en || ''}
              onChange={e => updateSettings({ siteDescription_en: e.target.value })}
            />
          </div>

          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'نص زر الحجز (AR)' : 'Booking Button Text (AR)'}</label>
            <input 
              type="text" 
              className="w-full bg-white border-none rounded-2xl p-4 font-black text-dark"
              value={siteSettings.bookingButtonText || ''}
              onChange={e => updateSettings({ bookingButtonText: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Booking Button Text (EN)</label>
            <input 
              type="text" 
              className="w-full bg-white border-none rounded-2xl p-4 font-black text-dark"
              value={siteSettings.bookingButtonText_en || ''}
              onChange={e => updateSettings({ bookingButtonText_en: e.target.value })}
            />
          </div>
        </div>
      </section>
      {/* Section Management & Ordering */}
      <section className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gold/10 p-2 rounded-xl">
              <Menu className="w-5 h-5 text-gold" />
            </div>
            <h4 className="text-xl font-black text-dark">{lang === 'ar' ? 'ترتيب وإدارة أقسام الموقع' : 'Site Section Ordering & Visibility'}</h4>
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'اسحب للترتيب (قريباً)' : 'Drag to reorder (Coming soon)'}</span>
        </div>

        <div className="space-y-4">
          {(siteSettings.sectionOrder || ['hero', 'services', 'specialized', 'about', 'cta']).map((sectionId, index) => {
            const sectionInfo = {
              hero: { label: 'Hero Section', ar: 'قسم الواجهة', toggleId: 'showHeroSection' },
              services: { label: 'Services', ar: 'الخدمات الأساسية', toggleId: 'showServicesSection' },
              specialized: { label: 'Specialized', ar: 'الخدمات المتخصصة', toggleId: 'showSpecializedSection' },
              about: { label: 'About Us / Why Us', ar: 'لماذا نحن؟', toggleId: 'showAboutSection' },
              cta: { label: 'Call to Action', ar: 'صندوق العمل السريع', toggleId: 'showCTASection' },
            }[sectionId] || { label: sectionId, ar: sectionId, toggleId: '' };

            const isVisible = sectionInfo.toggleId ? (siteSettings as any)[sectionInfo.toggleId] : true;

            return (
              <div key={sectionId} className={cn(
                "flex items-center justify-between p-6 rounded-[2rem] border transition-all",
                isVisible ? "bg-white border-gold/20 shadow-lg shadow-gold/5" : "bg-gray-50 border-gray-200 opacity-60"
              )}>
                <div className="flex items-center gap-6">
                  {/* Reorder Controls */}
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 hover:bg-gold/10 rounded-lg transition-colors disabled:opacity-20"
                    >
                      <ChevronRight className="-rotate-90 w-4 h-4 text-gold" />
                    </button>
                    <button 
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === (siteSettings.sectionOrder?.length || 5) - 1}
                      className="p-1.5 hover:bg-gold/10 rounded-lg transition-colors disabled:opacity-20"
                    >
                      <ChevronRight className="rotate-90 w-4 h-4 text-gold" />
                    </button>
                  </div>

                  <div>
                     <h6 className="font-black text-dark uppercase text-sm tracking-tight">
                        {lang === 'ar' ? sectionInfo.ar : sectionInfo.label}
                     </h6>
                     <p className="text-[10px] text-gray-400 font-bold">{sectionId === 'hero' ? 'Main landing landing area' : 'Landing page component'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => {
                      if (sectionInfo.toggleId) {
                        updateSettings({ [sectionInfo.toggleId]: !isVisible });
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      isVisible ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-gray-200 text-gray-400"
                    )}
                   >
                     {isVisible ? <Check className="w-3 h-3" /> : null}
                     {isVisible ? (lang === 'ar' ? 'مرئي' : 'Visible') : (lang === 'ar' ? 'مخفي' : 'Hidden')}
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hero & Content Management */}
      <section className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 p-2 rounded-xl">
            <Layout className="w-5 h-5 text-gold" />
          </div>
          <h4 className="text-xl font-black text-dark">{lang === 'ar' ? 'نصوص الواجهة الرئيسية (Hero)' : 'Hero UI Texts'}</h4>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'اسم الشركة (AR)' : 'Company Name (AR)'}</label>
            <input 
              type="text" 
              className="w-full bg-white border-none rounded-2xl p-4 font-black text-dark text-lg"
              value={siteSettings.companyName || ''}
              onChange={e => updateSettings({ companyName: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Company Name (EN)</label>
            <input 
              type="text" 
              className="w-full bg-white border-none rounded-2xl p-4 font-black text-dark text-lg"
              value={siteSettings.companyName_en || ''}
              onChange={e => updateSettings({ companyName_en: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'العنوان العريـض (AR)' : 'Hero Title (AR)'}</label>
            <input 
              type="text" 
              className="w-full bg-white border-none rounded-2xl p-4 font-black text-dark text-lg"
              value={siteSettings.heroTitle}
              onChange={e => updateSettings({ heroTitle: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Main Heading (EN)</label>
            <input 
              type="text" 
              className="w-full bg-white border-none rounded-2xl p-4 font-black text-dark text-lg"
              value={siteSettings.heroTitle_en || ''}
              onChange={e => updateSettings({ heroTitle_en: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'العنوان الفرعي (AR)' : 'Hero Subtitle (AR)'}</label>
            <textarea 
              className="w-full bg-white border-none rounded-2xl p-4 font-bold text-dark h-24"
              value={siteSettings.heroSubtitle}
              onChange={e => updateSettings({ heroSubtitle: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Sub-heading (EN)</label>
            <textarea 
              className="w-full bg-white border-none rounded-2xl p-4 font-bold text-dark h-24"
              value={siteSettings.heroSubtitle_en || ''}
              onChange={e => updateSettings({ heroSubtitle_en: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem] md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'الوصف الرئيسي (AR)' : 'Hero Description (AR)'}</label>
            <textarea 
              className="w-full bg-white border-none rounded-2xl p-4 font-bold text-dark h-32"
              value={siteSettings.heroDescription}
              onChange={e => updateSettings({ heroDescription: e.target.value })}
            />
          </div>
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem] md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Hero Description (EN)</label>
            <textarea 
              className="w-full bg-white border-none rounded-2xl p-4 font-bold text-dark h-32"
              value={siteSettings.heroDescription_en || ''}
              onChange={e => updateSettings({ heroDescription_en: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Social & Contact Card */}
      <section className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 p-2 rounded-xl">
            <Phone className="w-5 h-5 text-gold" />
          </div>
          <h4 className="text-xl font-black text-dark">{lang === 'ar' ? 'بيانات التواصل والروابط' : 'Contact & Social Links'}</h4>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: lang === 'ar' ? 'رقم الهاتف الأساسي' : 'Primary Phone', field: 'phone', icon: Phone },
            { label: lang === 'ar' ? 'واتساب الحجوزات' : 'Booking WhatsApp', field: 'whatsapp', icon: Phone },
            { label: lang === 'ar' ? 'واتساب الإشعارات (Admin)' : 'Admin Notification WhatsApp', field: 'notificationWhatsapp', icon: Phone },
            { label: lang === 'ar' ? 'رابط انستقرام' : 'Instagram Link', field: 'instagram', icon: Star },
            { label: lang === 'ar' ? 'رابط تيك توك' : 'TikTok Link', field: 'tiktok', icon: Star },
            { label: lang === 'ar' ? 'رابط تليجرام' : 'Telegram Link', field: 'telegram', icon: Star },
          ].map((item) => (
            <div key={item.field} className="space-y-3 p-4 bg-gray-50/30 rounded-[2rem] border border-gray-100/50">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-2">{item.label}</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full bg-white border-none rounded-xl p-4 pl-10 font-bold text-dark text-sm shadow-sm"
                  value={(siteSettings as any)[item.field] || ''}
                  onChange={e => updateSettings({ [item.field]: e.target.value })}
                />
                <item.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Media & Hero Image */}
      <section className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-gold/10 p-2 rounded-xl">
            <ImageIcon className="w-5 h-5 text-gold" />
          </div>
          <h4 className="text-xl font-black text-dark">{lang === 'ar' ? 'إدارة الصور والوسائط' : 'Media & Assets'}</h4>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="relative aspect-[21/9] bg-gray-50 rounded-[3rem] overflow-hidden border border-gray-100 group">
               <img src={siteSettings.heroImage} alt="Hero" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
               <div className="absolute inset-0 bg-dark/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                 <label className="bg-white text-dark px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest cursor-pointer shadow-2xl active:scale-95 transition-all">
                   {lang === 'ar' ? 'تغيير صورة الخلفية' : 'Change Background Image'}
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'settings', 'site', 'heroImage');
                   }} />
                 </label>
               </div>
            </div>
            <p className="text-[9px] text-gray-400 font-bold px-4">{lang === 'ar' ? 'يفضل استخدام صور ذات جودة عالية (1920x1080) لإعطاء انطباع بالفخامة.' : 'Use high quality images (1920x1080) for a luxury feel.'}</p>
          </div>

          <div className="space-y-8">
            <div className="grid gap-6">
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{lang === 'ar' ? 'رابط صورة الواجهة المباشر' : 'Direct Hero Image URL'}</label>
                 <input 
                   type="text" 
                   className="w-full bg-gray-50 border-none rounded-2xl p-5 font-mono text-xs text-gray-400"
                   value={siteSettings.heroImage}
                   onChange={e => updateSettings({ heroImage: e.target.value })}
                 />
               </div>
               {/* Hero Overlay Opacity or Intensity if needed later */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

