
import React from 'react';
import { DollarSign, CreditCard, Copy, Wallet, Trash2, Mail, CheckCircle, Smartphone } from 'lucide-react';
import { SiteSettings, FixedRoute, UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { doc, updateDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface PricingTabProps {
  siteSettings: SiteSettings;
  setSiteSettings: (settings: SiteSettings) => void;
  fixedRoutes: FixedRoute[];
  handleSaveSettings: () => void;
  safeAddDoc: (ref: any, data: any) => Promise<any>;
  safeDeleteDoc: (ref: any) => Promise<void>;
  userProfile: UserProfile | null;
  lang: 'ar' | 'en';
}

export const PricingTab = ({
  siteSettings, setSiteSettings, fixedRoutes, handleSaveSettings, safeAddDoc, safeDeleteDoc, userProfile, lang
}: PricingTabProps) => {
  return (
    <div className="space-y-12">
      {/* Auto Pricing Setup */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-black text-dark">نظام التسعير التلقائي</h4>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">إعدادات الكيلومتر والرسوم</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">سعر الكيلو (BHD)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full bg-gray-50 border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-black text-dark"
                value={siteSettings.pricePerKm}
                onChange={e => setSiteSettings({...siteSettings, pricePerKm: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">رسوم البداية (BHD)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full bg-gray-50 border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-black text-dark"
                value={siteSettings.baseFee}
                onChange={e => setSiteSettings({...siteSettings, baseFee: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">إضافة VIP (BHD)</label>
              <input 
                type="number" 
                className="w-full bg-gray-50 border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-black text-dark"
                value={siteSettings.vipSurcharge}
                onChange={e => setSiteSettings({...siteSettings, vipSurcharge: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">إضافة Van (BHD)</label>
              <input 
                type="number" 
                className="w-full bg-gray-50 border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-black text-dark"
                value={siteSettings.vanSurcharge}
                onChange={e => setSiteSettings({...siteSettings, vanSurcharge: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <h5 className="text-xs font-black text-blue-600 uppercase mb-2">معادلة الحساب الحالية:</h5>
            <p className="text-sm font-bold text-blue-800 leading-relaxed">
              (المسافة بالكيلو × <span className="text-gold">{siteSettings.pricePerKm}</span>) + رسوم البداية <span className="text-gold">{siteSettings.baseFee}</span>
              {siteSettings.vipSurcharge > 0 && <span> + رسوم الفئة المختارة </span>}
            </p>
          </div>

          <button 
            onClick={handleSaveSettings}
            className="w-full bg-dark text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gold transition-all shadow-xl shadow-dark/10"
          >
            تحديث نظام التسعير
          </button>
        </div>

        {/* Payment Gateways */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-black text-dark">نظام الدفع المعتمد</h4>
              <select 
                className="bg-transparent border-none p-0 text-xs font-black text-gold uppercase tracking-widest focus:ring-0 cursor-pointer"
                value={siteSettings.paymentGateway}
                onChange={e => {
                  const val = e.target.value as any;
                  setSiteSettings({...siteSettings, paymentGateway: val});
                  updateDoc(doc(db, 'settings', 'site'), { paymentGateway: val });
                }}
              >
                <option value="WhatsApp">تأكيد عبر واتساب (افتراضي)</option>
                <option value="Crypto">عملات رقمية (Manual)</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {siteSettings.paymentGateway === 'WhatsApp' && (
              <div className="p-6 bg-green-50 rounded-3xl border border-green-100 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h5 className="font-black text-green-700 text-sm">نظام التحويل اليدوي</h5>
                </div>
                <p className="text-xs font-bold text-green-600 leading-relaxed">
                  هذا الخيار يتخطى بوابات الدفع الإلكترونية حالياً. سيتم تحويل العميل مباشرة إلى الواتساب لتأكيد الحجز معك يدوياً.
                </p>
              </div>
            )}

            {siteSettings.paymentGateway === 'Crypto' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">عنوان المحفظة (Wallet Address)</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-gray-100 rounded-2xl py-4 px-6 font-bold font-mono text-xs"
                    value={siteSettings.cryptoWalletAddress || ''}
                    onChange={e => setSiteSettings({...siteSettings, cryptoWalletAddress: e.target.value})}
                    placeholder="مثال: USDT (TRC20) address"
                  />
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
              <button 
                onClick={async () => {
                   if (confirm('إرسال إيميل تجريبي لنظام التنبيهات؟')) {
                     try {
                        const res = await fetch('/api/send-test-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: userProfile?.email || 'ahjm91@gmail.com', companyName: siteSettings.companyName })
                        });
                        alert('تم إرسال الإيميل التجريبي بنجاح!');
                     } catch (e) { alert('فشل الإرسال'); }
                   }
                }}
                className="flex-1 bg-gray-50 text-dark py-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
              >
                <Mail className="w-4 h-4" />
                اختبار التنبيهات
              </button>
              <button 
                onClick={handleSaveSettings}
                className="flex-1 bg-gold text-white py-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-dark transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Routes Section */}
      <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div>
            <h4 className="text-2xl font-black text-dark">المسارات والأسعار الثابتة</h4>
            <p className="text-gray-400 text-sm font-bold mt-1">تحديد أسعار مسبقة للوجهات الأكثر طلباً</p>
          </div>
          <button 
            onClick={() => {
              const pickup = prompt('نقطة الانطلاق (مثال: مطار البحرين):');
              const dropoff = prompt('نقطة الوصول (مثال: الدمام):');
              const price = parseFloat(prompt('السعر الثابت بالدينار البحريني:') || '0');
              if (pickup && dropoff && !isNaN(price)) {
                safeAddDoc(collection(db, 'fixed_routes'), { pickup, dropoff, price });
              }
            }}
            className="bg-dark text-white px-8 py-4 rounded-2xl text-sm font-black hover:bg-gold transition-all shadow-xl shadow-dark/10"
          >
            إضافة مسار ثابت جديد +
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fixedRoutes.map(route => (
            <div key={route.id} className="group bg-gray-50/50 p-6 rounded-[2rem] border border-transparent hover:border-gold/20 hover:bg-white hover:shadow-xl transition-all flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                  <p className="text-sm font-black text-dark">{route.pickup} ← {route.dropoff}</p>
                </div>
                <p className="text-2xl font-black text-gold">{route.price} <span className="text-[10px] uppercase">BHD</span></p>
              </div>
              <button 
                onClick={() => safeDeleteDoc(doc(db, 'fixed_routes', route.id))}
                className="w-10 h-10 bg-white text-red-500 rounded-xl flex items-center justify-center border border-gray-100 hover:bg-red-50 transition-colors shadow-sm relative z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {fixedRoutes.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">لاتوجد مسارات ثابتة مسجلة بعد.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
