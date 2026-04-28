
import React, { useState } from 'react';
import { SiteSettings } from '../../types';
import { Plus, Trash2, Tag, Gift, Percent, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface PromoCodesTabProps {
  siteSettings: SiteSettings;
  setSiteSettings: (s: SiteSettings) => void;
}

export const PromoCodesTab = ({ siteSettings, setSiteSettings }: PromoCodesTabProps) => {
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('10');

  const handleAddCode = async () => {
    if (!newCode) return;
    const codes = siteSettings.promoCodes || [];
    const updatedCodes = [...codes, { code: newCode.toUpperCase(), discountPercent: Number(newDiscount) }];
    
    try {
      await updateDoc(doc(db, 'settings', 'site'), { promoCodes: updatedCodes });
      setSiteSettings({ ...siteSettings, promoCodes: updatedCodes });
      setNewCode('');
    } catch (err) {
      console.error('Error adding promo code:', err);
    }
  };

  const handleRemoveCode = async (index: number) => {
    const codes = [...(siteSettings.promoCodes || [])];
    codes.splice(index, 1);
    
    try {
      await updateDoc(doc(db, 'settings', 'site'), { promoCodes: codes });
      setSiteSettings({ ...siteSettings, promoCodes: codes });
    } catch (err) {
      console.error('Error removing promo code:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black text-dark">أكواد الخصم</h3>
          <p className="text-sm text-gray-500 mt-1">إدارة الحملات الترويجية والخصومات الخاصة</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Add New Code Form */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center">
            <Plus className="text-gold w-6 h-6" />
          </div>
          <h4 className="text-lg font-black text-dark">كود جديد</h4>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">كود الخصم</label>
              <input 
                type="text"
                placeholder="PROMO2026"
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-black uppercase tracking-widest"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">نسبة الخصم (%)</label>
              <div className="relative">
                <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="number"
                  className="w-full bg-gray-50 border-none rounded-xl py-3 pr-12 pl-4 font-bold"
                  value={newDiscount}
                  onChange={e => setNewDiscount(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              onClick={handleAddCode}
              className="w-full bg-dark text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gold transition-all shadow-xl shadow-dark/10"
            >
              <Save className="w-4 h-4" />
              إضافة الكود
            </button>
          </div>
        </div>

        {/* Active Codes List */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h4 className="text-lg font-black text-dark mb-6 flex items-center gap-3">
             <div className="w-1.5 h-6 bg-gold rounded-full" />
             الأكواد الحالية
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            {(siteSettings.promoCodes || []).map((code, index) => (
              <div key={index} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200 group hover:border-gold/30 hover:bg-gold/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Tag className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-black text-dark tracking-widest">{code.code}</p>
                    <p className="text-[10px] font-black text-gold uppercase">{code.discountPercent}% خصم</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveCode(index)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(siteSettings.promoCodes || []).length === 0 && (
              <div className="md:col-span-2 text-center py-12">
                 <Gift className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                 <p className="text-gray-400 font-bold">لا توجد أكواد خصم نشطة حالياً</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
