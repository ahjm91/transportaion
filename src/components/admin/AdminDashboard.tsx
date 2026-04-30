
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Layout, Box, Globe, DollarSign, Users, PieChart, Star, 
  Settings, LogOut, Search, Bell, Menu, Shield, Loader2, Gift
} from 'lucide-react';
import { Trip, SiteSettings, Service, SpecializedService, UserProfile, FixedRoute, Booking, Driver } from '../../types';
import { AccountingTab } from './AccountingTab';
import { ContentTab } from './ContentTab';
import { BrandingTab } from './BrandingTab';
import { PricingTab } from './PricingTab';
import { UsersTab } from './UsersTab';
import { PayoutsTab } from './PayoutsTab';
import { PromoCodesTab } from './PromoCodesTab';
import { cn } from '../../lib/utils';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  siteSettings: SiteSettings;
  setSiteSettings: (settings: SiteSettings) => void;
  trips: Trip[];
  bookings: Booking[];
  users: UserProfile[];
  allDrivers: Driver[];
  services: Service[];
  specializedServices: SpecializedService[];
  fixedRoutes: FixedRoute[];
  isUsersLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: 'ar' | 'en';
  isSuperAdmin: boolean;
  
  // Trip management
  setEditingTrip: (trip: Trip) => void;
  setTripFormData: (data: any) => void;
  setIsTripFormOpen: (open: boolean) => void;
  setTripToDelete: (trip: Trip) => void;
  
  // Utilities
  handleSaveSettings: () => void;
  handleImageUpload: (file: File, collectionName: string, docId: string, fieldName: string) => Promise<void>;
  safeAddDoc: (ref: any, data: any) => Promise<any>;
  safeUpdateDoc: (ref: any, data: any) => Promise<void>;
  safeDeleteDoc: (ref: any) => Promise<void>;
}

export const AdminDashboard = ({
  isOpen, onClose, siteSettings, setSiteSettings, trips, bookings, users, allDrivers,
  services, specializedServices, fixedRoutes, isUsersLoading,
  activeTab, setActiveTab, lang, isSuperAdmin,
  setEditingTrip, setTripFormData, setIsTripFormOpen, setTripToDelete,
  handleSaveSettings, handleImageUpload, safeAddDoc, safeUpdateDoc, safeDeleteDoc
}: AdminDashboardProps) => {
  const [isAdminScheduleView, setIsAdminScheduleView] = React.useState(false);
  const [tripFilter, setTripFilter] = React.useState<'all' | 'requested' | 'pending_price' | 'unpaid' | 'paid'>('all');

  const menuItems = [
    { id: 'accounting', name: 'المحاسبة والرحلات', icon: PieChart },
    { id: 'payouts', name: 'طلبات السحب', icon: DollarSign },
    { id: 'promos', name: 'أكواد الخصم', icon: Gift },
    { id: 'content', name: 'إدارة المحتوى', icon: Layout },
    { id: 'pricing', name: 'التسعير والربط', icon: Settings },
    { id: 'users', name: 'إدارة المستخدمين', icon: Users },
    { id: 'branding', name: 'الهوية البصرية', icon: Star },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-6" dir="rtl">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-dark/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        className="relative bg-gray-50 w-full h-full md:max-w-[95vw] md:h-[90vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-dark rounded-2xl flex items-center justify-center shadow-lg shadow-dark/20">
                  <Box className="w-7 h-7 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-dark leading-none">لوحة التحكم</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">Admin Management System</p>
                </div>
             </div>
             
             <div className="hidden lg:flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100 overflow-x-auto max-w-[60vw] no-scrollbar">
               {menuItems.map((item) => (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={cn(
                     "px-4 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all whitespace-nowrap",
                     activeTab === item.id 
                       ? "bg-white text-gold shadow-lg shadow-gold/5" 
                       : "text-gray-400 hover:text-dark hover:bg-gray-100"
                   )}
                 >
                   <item.icon className="w-3.5 h-3.5" />
                   {item.name}
                 </button>
               ))}
             </div>
          </div>

          <div className="flex items-center gap-4">
             <button className="relative w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-dark transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
             </button>
             <div className="h-10 w-px bg-gray-100 mx-2" />
             <button 
               onClick={onClose}
               className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
             >
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Pro Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 mb-4 shrink-0">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm group hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-gold/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <PieChart className="w-5 h-5 text-gold" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">إجمالي الرحلات</div>
              <div className="text-lg font-black text-dark">{trips.length + bookings.filter(b => b.status === 'completed').length}</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm group hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">سائقين متصلين</div>
              <div className="text-lg font-black text-dark">{allDrivers.filter(d => d.status === 'online').length}</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm group hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">رحلات نشطة</div>
              <div className="text-lg font-black text-dark">{bookings.filter(b => !['completed', 'cancelled', 'no_driver_found'].includes(b.status)).length}</div>
            </div>
          </div>

        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 pt-4 lg:pt-4 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'accounting' && (
                <AccountingTab 
                  trips={trips}
                  bookings={bookings}
                  users={users}
                  tripFilter={tripFilter}
                  setTripFilter={setTripFilter}
                  isAdminScheduleView={isAdminScheduleView}
                  setIsAdminScheduleView={setIsAdminScheduleView}
                  lang={lang}
                  isSuperAdmin={isSuperAdmin}
                  setEditingTrip={setEditingTrip}
                  setTripFormData={setTripFormData}
                  setIsTripFormOpen={setIsTripFormOpen}
                  setTripToDelete={setTripToDelete}
                />
              )}

              {activeTab === 'payouts' && (
                <PayoutsTab />
              )}

              {activeTab === 'promos' && (
                <PromoCodesTab 
                  siteSettings={siteSettings}
                  setSiteSettings={setSiteSettings}
                />
              )}

              {activeTab === 'content' && (
                <ContentTab 
                  services={services}
                  specializedServices={specializedServices}
                  safeAddDoc={safeAddDoc}
                  safeUpdateDoc={safeUpdateDoc}
                  safeDeleteDoc={safeDeleteDoc}
                  handleImageUpload={handleImageUpload}
                />
              )}

              {activeTab === 'pricing' && (
                <PricingTab 
                  siteSettings={siteSettings}
                  setSiteSettings={setSiteSettings}
                  fixedRoutes={fixedRoutes}
                  handleSaveSettings={handleSaveSettings}
                  safeAddDoc={safeAddDoc}
                  safeDeleteDoc={safeDeleteDoc}
                  userProfile={null} // Will be handled in App.tsx if needed
                  lang={lang}
                />
              )}

              {activeTab === 'users' && (
                <UsersTab 
                  users={users}
                  allDrivers={allDrivers}
                  isUsersLoading={isUsersLoading}
                  safeUpdateDoc={safeUpdateDoc}
                  lang={lang}
                />
              )}

              {activeTab === 'branding' && (
                <BrandingTab 
                  siteSettings={siteSettings}
                  setSiteSettings={setSiteSettings}
                  handleImageUpload={handleImageUpload}
                  safeUpdateDoc={safeUpdateDoc}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-2 flex items-center justify-around z-20">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                activeTab === item.id ? "text-gold" : "text-gray-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase">{item.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="bg-white border-t border-gray-100 p-6 flex flex-wrap justify-between items-center gap-4 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">System Status: All Systems Operational</p>
           </div>
           <button 
             onClick={onClose}
             className="bg-dark text-white px-10 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gold transition-all shadow-xl shadow-dark/10"
           >
             خروج وحفظ الإعدادات
           </button>
        </div>
      </motion.div>
    </div>
  );
};
