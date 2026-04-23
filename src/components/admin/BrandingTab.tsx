
import React from 'react';
import { Star, ImageIcon, Upload, Menu, Phone } from 'lucide-react';
import { SiteSettings } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

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

  return (
    <div className="space-y-16">
      {/* Colors & Visual Identity */}
      <section>
        <h4 className="text-xl font-black text-dark mb-8 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-gold rounded-full" />
          الهوية البصرية والألوان
        </h4>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">اللون الرئيسي (Corporate Gold)</label>
            <div className="flex gap-4">
              <input 
                type="color" 
                className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-gray-50 shadow-inner"
                value={siteSettings.primaryColor}
                onChange={e => updateSettings({ primaryColor: e.target.value })}
              />
              <div className="flex-1 space-y-2">
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded-xl p-3 font-mono text-xs font-bold"
                  value={siteSettings.primaryColor}
                  onChange={e => updateSettings({ primaryColor: e.target.value })}
                />
                <p className="text-[9px] text-gray-400 font-bold">يستخدم في الأيقونات، الأزرار، واللمسات الجمالية.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">اللون الثانوي (Deep Dark)</label>
            <div className="flex gap-4">
              <input 
                type="color" 
                className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-gray-50 shadow-inner"
                value={siteSettings.secondaryColor}
                onChange={e => updateSettings({ secondaryColor: e.target.value })}
              />
              <div className="flex-1 space-y-2">
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded-xl p-3 font-mono text-xs font-bold"
                  value={siteSettings.secondaryColor}
                  onChange={e => updateSettings({ secondaryColor: e.target.value })}
                />
                <p className="text-[9px] text-gray-400 font-bold">لون النصوص الرئيسية والخلفيات الداكنة.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">انحناء الحواف (Border Radius)</label>
            <select 
              className="w-full bg-gray-50 border-none rounded-xl p-4 font-black text-dark focus:ring-2 focus:ring-gold/20"
              value={siteSettings.borderRadius}
              onChange={e => updateSettings({ borderRadius: e.target.value })}
            >
              <option value="0rem">Sharp Edge (0px)</option>
              <option value="0.5rem">Standard (8px)</option>
              <option value="1rem">Modern (16px)</option>
              <option value="1.5rem">Rounded (24px)</option>
              <option value="2.5rem">Luxurious (40px)</option>
            </select>
            <p className="text-[9px] text-gray-400 font-bold">يؤثر على جميع الكروت، الأزرار، وحقول الإدخال.</p>
          </div>
        </div>
      </section>

      {/* Hero Management */}
      <section>
        <h4 className="text-xl font-black text-dark mb-8 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-gold rounded-full" />
          إدارة الواجهة الرئيسية (Hero)
        </h4>
        <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="relative aspect-video bg-gray-50 rounded-[2.5rem] overflow-hidden border-2 border-dashed border-gray-200 group/hero shadow-inner">
                 <img src={siteSettings.heroImage} alt="Hero" className="w-full h-full object-cover transition-transform duration-700 group-hover/hero:scale-110" />
                 <label className="absolute inset-0 bg-dark/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-all cursor-pointer text-white">
                    <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mb-4 shadow-xl shadow-gold/20">
                      <Upload className="w-8 h-8" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-xs">رفع صورة جديدة</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'settings', 'site', 'heroImage');
                    }} />
                 </label>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">رابط الصورة المباشر</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded-xl p-4 font-mono text-xs text-gray-500"
                  value={siteSettings.heroImage}
                  onChange={e => updateSettings({ heroImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">اسم الشركة (AR)</label>
                  <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-black text-dark" value={siteSettings.companyName || ''} onChange={e => updateSettings({ companyName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Name (EN)</label>
                  <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-black text-dark" value={siteSettings.companyName_en || ''} onChange={e => updateSettings({ companyName_en: e.target.value })} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">العنوان الرئيسي (AR)</label>
                  <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-black text-dark" value={siteSettings.heroTitle} onChange={e => updateSettings({ heroTitle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hero Title (EN)</label>
                  <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-black text-dark" value={siteSettings.heroTitle_en || ''} onChange={e => updateSettings({ heroTitle_en: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">العنوان الفرعي (AR)</label>
                <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-dark" value={siteSettings.heroSubtitle} onChange={e => updateSettings({ heroSubtitle: e.target.value })} />
              </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hero Subtitle (EN)</label>
                 <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-dark" value={siteSettings.heroSubtitle_en || ''} onChange={e => updateSettings({ heroSubtitle_en: e.target.value })} />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Social */}
      <section>
         <h4 className="text-xl font-black text-dark mb-8 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-gold rounded-full" />
          معلومات التواصل والشبكات الاجتماعية
        </h4>
        <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">رقم الهاتف الأساسي</label>
              <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-black text-dark" value={siteSettings.phone} onChange={e => updateSettings({ phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">واتساب الحجوزات</label>
              <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-black text-dark" value={siteSettings.whatsapp} onChange={e => updateSettings({ whatsapp: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">واتساب التنبيهات (Admin)</label>
              <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-black text-dark" value={siteSettings.notificationWhatsapp} onChange={e => updateSettings({ notificationWhatsapp: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">رابط انستقرام</label>
              <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-dark" value={siteSettings.instagram} onChange={e => updateSettings({ instagram: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">رابط تيك توك</label>
              <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-dark" value={siteSettings.tiktok} onChange={e => updateSettings({ tiktok: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">رابط تليجرام</label>
              <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-dark" value={siteSettings.telegram} onChange={e => updateSettings({ telegram: e.target.value })} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
