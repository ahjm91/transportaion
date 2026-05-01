
import React from 'react';
import { Layout, Plus, Trash2, Edit3, Image as ImageIcon, ExternalLink, Box } from 'lucide-react';
import { Service, SpecializedService } from '../../types';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface ContentTabProps {
  services: Service[];
  specializedServices: SpecializedService[];
  safeAddDoc: (ref: any, data: any) => Promise<any>;
  safeUpdateDoc: (ref: any, data: any) => Promise<void>;
  safeDeleteDoc: (ref: any) => Promise<void>;
  handleImageUpload: (file: File, collectionName: string, docId: string, fieldName: string) => Promise<void>;
  lang: 'ar' | 'en';
}

export const ContentTab = ({
  services, specializedServices, safeAddDoc, safeUpdateDoc, safeDeleteDoc, handleImageUpload, lang
}: ContentTabProps) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'main' | 'specialized'>('main');

  return (
    <div className="space-y-12">
      <div className="flex gap-4 border-b border-gray-100 pb-6">
        <button 
          onClick={() => setActiveSubTab('main')}
          className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${
            activeSubTab === 'main' ? 'bg-gold text-white shadow-xl shadow-gold/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          {lang === 'ar' ? 'الخدمات الرئيسية' : 'Main Services'}
        </button>
        <button 
          onClick={() => setActiveSubTab('specialized')}
          className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${
            activeSubTab === 'specialized' ? 'bg-gold text-white shadow-xl shadow-gold/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          {lang === 'ar' ? 'الخدمات المتخصصة' : 'Specialized Services'}
        </button>
      </div>

      {activeSubTab === 'main' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
           {/* Add New Service Card */}
           <button 
            onClick={() => {
              const name = prompt(lang === 'ar' ? 'عنوان الخدمة (AR):' : 'Service Title (AR):');
              const name_en = prompt(lang === 'ar' ? 'Service Title (EN):' : 'Service Title (EN):');
              if (name) {
                safeAddDoc(collection(db, 'services'), {
                  name, name_en, description: '', description_en: '', icon: 'Car', image: 'https://images.unsplash.com/photo-1449965024614-23b7a491bc60?auto=format&fit=crop&q=80&w=800'
                });
              }
            }}
            className="group aspect-[4/5] bg-gray-50 border-4 border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 hover:border-gold/30 hover:bg-gold/5 transition-all outline-none"
           >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 group-hover:text-gold group-hover:scale-110 transition-all shadow-sm">
                <Plus className="w-8 h-8" />
              </div>
              <span className="font-black text-gray-400 uppercase tracking-widest text-xs">
                {lang === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service'}
              </span>
           </button>

            {services.map(service => (
             <div key={service.id} className="group relative bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all">
                <div className="aspect-video relative overflow-hidden group-hover:aspect-[4/3] transition-all">
                  <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <ImageIcon className="w-8 h-8 text-white" />
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'services', service.id, 'image');
                      }}
                    />
                  </label>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-black text-dark text-lg">{service.name}</h5>
                      <p className="text-[10px] text-gray-400 font-mono">{service.name_en}</p>
                    </div>
                    <button 
                      onClick={() => safeDeleteDoc(doc(db, 'services', service.id))}
                      className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold h-20 focus:ring-1 focus:ring-gold/20"
                    placeholder="وصف الخدمة (AR)"
                    value={service.description}
                    onChange={e => safeUpdateDoc(doc(db, 'services', service.id), { description: e.target.value })}
                  />
                  <textarea 
                    className="w-full bg-blue-50/30 border-none rounded-xl p-3 text-xs font-bold h-20 focus:ring-1 focus:ring-blue-500/20"
                    placeholder="Service Description (EN)"
                    value={service.description_en || ''}
                    onChange={e => safeUpdateDoc(doc(db, 'services', service.id), { description_en: e.target.value })}
                  />
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
           <button 
            onClick={() => {
              const title = prompt(lang === 'ar' ? 'عنوان الخدمة المتخصصة (AR):' : 'Specialized Title (AR):');
              const title_en = prompt(lang === 'ar' ? 'Specialized Title (EN):' : 'Specialized Title (EN):');
              if (title) {
                safeAddDoc(collection(db, 'specialized_services'), {
                  title, title_en, description: '', description_en: '', image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800', price: '0', price_en: 'Starting from 0'
                });
              }
            }}
            className="h-64 bg-gray-50 border-4 border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 hover:border-gold/30 hover:bg-gold/5 transition-all outline-none"
           >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 group-hover:text-gold group-hover:scale-110 transition-all shadow-sm">
                <Plus className="w-8 h-8" />
              </div>
              <span className="font-black text-gray-400 uppercase tracking-widest text-xs">
                {lang === 'ar' ? 'إضافة خدمة متخصصة' : 'Add Specialized Service'}
              </span>
           </button>

           {specializedServices.map(service => (
             <div key={service.id} className="bg-white border border-gray-100 rounded-[3rem] p-6 shadow-sm hover:shadow-xl transition-all">
                <div className="flex gap-6">
                  <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden group/img shrink-0">
                    <img src={service.image} alt="" className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                      <ImageIcon className="w-5 h-5 text-white" />
                      <input type="file" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'specialized_services', service.id, 'image');
                      }} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <input 
                          className="w-full bg-transparent border-none p-0 text-xl font-black text-dark focus:ring-0 mb-1"
                          value={service.title}
                          onChange={e => safeUpdateDoc(doc(db, 'specialized_services', service.id), { title: e.target.value })}
                        />
                        <input 
                          className="w-full bg-transparent border-none p-0 text-[10px] font-mono text-gray-400 focus:ring-0"
                          value={service.title_en}
                          onChange={e => safeUpdateDoc(doc(db, 'specialized_services', service.id), { title_en: e.target.value })}
                        />
                      </div>
                      <button 
                        onClick={() => safeDeleteDoc(doc(db, 'specialized_services', service.id))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-4">
                       <input 
                          placeholder="السعر (AR)"
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold"
                          value={service.price}
                          onChange={e => safeUpdateDoc(doc(db, 'specialized_services', service.id), { price: e.target.value })}
                       />
                       <input 
                          placeholder="Price (EN)"
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold"
                          value={service.price_en}
                          onChange={e => safeUpdateDoc(doc(db, 'specialized_services', service.id), { price_en: e.target.value })}
                       />
                    </div>
                  </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};
