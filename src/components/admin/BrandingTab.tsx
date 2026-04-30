
import React from 'react';
import { Star, ImageIcon, Upload, Menu, Phone, Palette, Type, Layout, Eye, Check, Layers } from 'lucide-react';
import { SiteSettings } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { cn } from '../../lib/utils';

interface BrandingTabProps {
  siteSettings: SiteSettings;
  setSiteSettings: (settings: SiteSettings) => void;
  handleImageUpload: (file: File, collectionName: string, docId: string, fieldName: string) => Promise<void>;
  safeUpdateDoc: (ref: any, data: any) => Promise<void>;
}

export const BrandingTab = ({ siteSettings, setSiteSettings, handleImageUpload, safeUpdateDoc }: BrandingTabProps) => {
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

  return (
    <div className="space-y-12 pb-20">
      {/* Quick Themes */}
      <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gold/10 p-2 rounded-xl">
            <Palette className="w-5 h-5 text-gold" />
          </div>
          <h4 className="text-xl font-black text-dark">انماط جاهزة للثيم</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.name}
              onClick={() => updateSettings({ 
                primaryColor: theme.primary, 
                secondaryColor: theme.secondary, 
                accentColor: theme.accent 
              })}
              className="group relative bg-gray-50 p-4 rounded-[2rem] border border-gray-100 hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5 transition-all text-right"
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
              توازن الألوان
            </h5>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-gray-50/50 p-5 rounded-[2rem]">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">اللون الأساسي</label>
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
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">اللون الثانوي</label>
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
              تنسيق الخطوط والحواف
            </h5>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">نوع الخط الأساسي</label>
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
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">انحناء الحواف</label>
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
                  معاينة حية للمكونات
                </h6>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              
              {/* Components Preview */}
              <div className="space-y-6">
                {/* Heading Preview */}
                <div className="space-y-2">
                  <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">العناوين</span>
                  <h3 
                    className="text-2xl font-black text-white leading-tight" 
                    style={{ fontFamily: siteSettings.fontFamily }}
                  >
                    GCC TAXI <br/> 
                    <span className="text-gold" style={{ color: siteSettings.primaryColor }}>فخامة التنقل</span>
                  </h3>
                </div>

                {/* Button Preview */}
                <div className="space-y-3">
                  <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">الأزرار</span>
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
                      تأكيد الحجز الآن
                    </button>
                    <button 
                      className="w-full py-4 px-6 text-[10px] font-black uppercase tracking-widest border-2 transition-all"
                      style={{ 
                        borderColor: siteSettings.primaryColor,
                        color: siteSettings.primaryColor,
                        borderRadius: siteSettings.buttonStyle === 'pill' ? '9999px' : siteSettings.buttonStyle === 'sharp' ? '0' : siteSettings.borderRadius
                      }}
                    >
                      تعرف على خدماتنا
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
                     <span className="text-[10px] font-black text-white">بطاقة معلومات ذكية</span>
                   </div>
                   <p className="text-[10px] text-white/50 leading-relaxed font-bold">هذا مثال لكيفية ظهور البطاقات في الموقع عند تفعيل وضع الـ Glassmorphism.</p>
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
          <h4 className="text-xl font-black text-dark">تأثيرات الواجهة والعمق</h4>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-black text-dark uppercase tracking-widest block mb-1">تأثير الزجاج</label>
                <p className="text-[9px] text-gray-400 font-bold">يعطي خلفيات شفافة ومموهة للأقسام.</p>
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
          </div>

          <div className="space-y-6">
            <label className="text-[10px] font-black text-dark uppercase tracking-widest block">كثافة الظل للمكـونات</label>
            <input 
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-gold"
              value={siteSettings.shadowIntensity || 0.15}
              onChange={e => updateSettings({ shadowIntensity: parseFloat(e.target.value) })}
            />
            <div className="flex justify-between text-[8px] font-black text-gray-400">
              <span>خفيف (Flat)</span>
              <span>متوسط</span>
              <span>ثقيل (Floating)</span>
            </div>
          </div>

          <div className="space-y-6">
             <label className="text-[10px] font-black text-dark uppercase tracking-widest block">نمط الأزرار العام</label>
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

      {/* Hero & Content Management */}
      <section className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 p-2 rounded-xl">
            <Layout className="w-5 h-5 text-gold" />
          </div>
          <h4 className="text-xl font-black text-dark">نصوص الواجهة الرئيسية (Hero)</h4>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">العنوان العريـض (AR)</label>
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
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">العنوان الفرعي (AR)</label>
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
        </div>
      </section>

      {/* Social & Contact Card */}
      <section className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 p-2 rounded-xl">
            <Phone className="w-5 h-5 text-gold" />
          </div>
          <h4 className="text-xl font-black text-dark">بيانات التواصل والروابط</h4>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'رقم الهاتف الأساسي', field: 'phone', icon: Phone },
            { label: 'واتساب الحجوزات', field: 'whatsapp', icon: Phone },
            { label: 'واتساب الإشعارات (Admin)', field: 'notificationWhatsapp', icon: Phone },
            { label: 'رابط انستقرام', field: 'instagram', icon: Star },
            { label: 'رابط تيك توك', field: 'tiktok', icon: Star },
            { label: 'رابط تليجرام', field: 'telegram', icon: Star },
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
          <h4 className="text-xl font-black text-dark">إدارة الصور والوسائط</h4>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="relative aspect-[21/9] bg-gray-50 rounded-[3rem] overflow-hidden border border-gray-100 group">
               <img src={siteSettings.heroImage} alt="Hero" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
               <div className="absolute inset-0 bg-dark/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                 <label className="bg-white text-dark px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest cursor-pointer shadow-2xl active:scale-95 transition-all">
                   تغيير صورة الخلفية
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'settings', 'site', 'heroImage');
                   }} />
                 </label>
               </div>
            </div>
            <p className="text-[9px] text-gray-400 font-bold px-4">يفضل استخدام صور ذات جودة عالية (1920x1080) لإعطاء انطباع بالفخامة.</p>
          </div>

          <div className="space-y-8">
            <div className="grid gap-6">
               <div className="space-y-3">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">رابط صورة الواجهة المباشر</label>
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

