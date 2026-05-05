
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Layout, Box, Globe, DollarSign, Users, PieChart, Star, 
  Settings, LogOut, Search, Bell, Menu, Shield, Loader2, Gift, Car, BarChart3, Truck, ChevronRight, Save, Check
} from 'lucide-react';
import { Trip, SiteSettings, Service, SpecializedService, UserProfile, FixedRoute, Booking, Driver } from '../../types';
import { AccountingTab } from './AccountingTab';
import { ContentTab } from './ContentTab';
import { BrandingTab } from './BrandingTab';
import { PricingTab } from './PricingTab';
import { UsersTab } from './UsersTab';
import { DriversTab } from './DriversTab';
import { PayoutsTab } from './PayoutsTab';
import { PromoCodesTab } from './PromoCodesTab';
import { ReportsTab } from './ReportsTab';
import { AuditLogsTab } from './AuditLogsTab';
import { ManualDispatchTab } from './ManualDispatchTab';
import { OverviewTab } from './OverviewTab';
import { FileText, ChevronLeft } from 'lucide-react';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = React.useMemo(() => [
    { id: 'overview', name: lang === 'ar' ? 'نظرة عامة' : 'Overview', icon: Layout },
    { id: 'dispatch', name: lang === 'ar' ? 'توزيع الطلبات' : 'Manual Dispatch', icon: Truck },
    { id: 'accounting', name: lang === 'ar' ? 'المحاسبة والرحلات' : 'Accounting & Trips', icon: PieChart },
    { id: 'reports', name: lang === 'ar' ? 'التقارير والإغلاق' : 'Reports & Closure', icon: BarChart3 },
    { id: 'payouts', name: lang === 'ar' ? 'طلبات السحب' : 'Payout Requests', icon: DollarSign },
    { id: 'promos', name: lang === 'ar' ? 'أكواد الخصم' : 'Promo Codes', icon: Gift },
    { id: 'content', name: lang === 'ar' ? 'إدارة المحتوى' : 'Content Management', icon: Box },
    { id: 'pricing', name: lang === 'ar' ? 'التسعير والربط' : 'Pricing & Routes', icon: Settings },
    { id: 'drivers', name: lang === 'ar' ? 'إدارة السائقين' : 'Driver Management', icon: Car },
    { id: 'users', name: lang === 'ar' ? 'إدارة المستخدمين' : 'User Management', icon: Users },
    { id: 'audit', name: lang === 'ar' ? 'سجلات النظام' : 'Audit Logs', icon: FileText },
    { id: 'branding', name: lang === 'ar' ? 'الهوية البصرية' : 'Brand Identity', icon: Star },
  ], [lang]);

  const filteredMenuItems = React.useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const query = searchQuery.toLowerCase();
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.id.toLowerCase().includes(query)
    );
  }, [menuItems, searchQuery]);

  // Set default tab to overview if none selected or on first open
  React.useEffect(() => {
    if (!activeTab || activeTab === 'content') {
      setActiveTab('overview');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-dark/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="relative bg-gray-50 w-full h-full shadow-2xl flex flex-col md:flex-row overflow-hidden"
      >
        {/* Mobile Top Header */}
        {isMobile && (
          <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-50">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dark rounded-xl flex items-center justify-center">
                  <Box className="w-5 h-5 text-gold" />
                </div>
                <h1 className="text-sm font-black text-dark truncate max-w-[150px]">
                  {menuItems.find(i => i.id === activeTab)?.name}
                </h1>
             </div>
             <button 
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-dark"
             >
               <Menu className="w-5 h-5" />
             </button>
          </div>
        )}

        {/* Vertical Sidebar */}
        <motion.div 
          animate={{ 
            width: isMobile ? (isMobileMenuOpen ? '100%' : '0%') : (isSidebarCollapsed ? 88 : 320),
            x: isMobile && !isMobileMenuOpen ? (lang === 'ar' ? 320 : -320) : 0
          }}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          className={cn(
            "bg-white border-gray-100 flex flex-col shrink-0 z-40 shadow-xl overflow-hidden",
            isMobile ? "fixed inset-0" : "relative",
            lang === 'ar' ? "border-l" : "border-r"
          )}
        >
          {/* Mobile Sidebar Close Button */}
          {isMobile && (
            <div className="flex justify-end p-4">
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {/* Sidebar Header */}
          <div className={cn("p-8 pb-4 transition-all duration-300", isSidebarCollapsed && "p-4 text-center")}>
             <motion.div 
               className={cn("flex items-center gap-3 mb-8 transition-all", isSidebarCollapsed && "justify-center")}
             >
                <div className="w-12 h-12 bg-dark rounded-2xl flex items-center justify-center shadow-lg shadow-dark/20 shrink-0">
                  <Box className="w-7 h-7 text-gold" />
                </div>
                {!isSidebarCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="overflow-hidden"
                  >
                    <h2 className="text-xl font-black text-dark leading-none whitespace-nowrap">{lang === 'ar' ? 'لوحة التحكم' : 'Control Panel'}</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 whitespace-nowrap">Admin System</p>
                  </motion.div>
                )}
             </motion.div>

             {!isSidebarCollapsed && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mb-6"
               >
                 <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Search className={cn("w-4 h-4 transition-colors", searchQuery ? "text-gold" : "text-gray-400")} />
                   </div>
                   <input
                     type="text"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder={lang === 'ar' ? 'بحث في القائمة...' : 'Search menu...'}
                     className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                   />
                   {searchQuery && (
                     <button 
                       onClick={() => setSearchQuery('')}
                       className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-dark"
                     >
                       <X className="w-3 h-3" />
                     </button>
                   )}
                 </div>

                 <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                      <span className="text-[7px] font-black text-blue-400 uppercase tracking-tighter mb-0.5 line-clamp-1">{lang === 'ar' ? 'إجمالي الرحلات' : 'Total Trips'}</span>
                      <span className="text-xs font-black text-dark leading-none">{trips.length + (bookings?.filter(b => b.status === 'completed').length || 0)}</span>
                    </div>
                    <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                      <span className="text-[7px] font-black text-green-400 uppercase tracking-tighter mb-0.5 line-clamp-1">{lang === 'ar' ? 'سائقين متصلين' : 'Online Drivers'}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-black text-dark leading-none">{allDrivers?.filter(d => d.status === 'online').length || 0}</span>
                      </div>
                    </div>
                  </div>
               </motion.div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-1 no-scrollbar py-2">
            {filteredMenuItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: lang === 'ar' ? -5 : 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobile) setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full rounded-2xl text-xs font-black flex items-center gap-4 transition-all duration-150 group",
                  activeTab === item.id 
                    ? "bg-gold text-white shadow-lg shadow-gold/20 py-4 px-5" 
                    : "text-gray-400 hover:text-dark hover:bg-gray-50 py-4 px-5",
                  isSidebarCollapsed && !isMobile && "justify-center px-0 py-4"
                )}
                title={isSidebarCollapsed && !isMobile ? item.name : ""}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform group-hover:scale-110", 
                  activeTab === item.id ? "text-white" : "text-gray-400 group-hover:text-gold"
                )} />
                {(!isSidebarCollapsed || isMobile) && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-50 space-y-3 bg-white mt-auto">
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
               className="hidden md:flex w-full h-12 bg-gray-50 text-gray-400 rounded-2xl items-center justify-center hover:bg-gray-100 hover:text-gold transition-all"
             >
               <ChevronRight className={cn(
                 "w-5 h-5 transition-transform duration-300", 
                 isSidebarCollapsed ? (lang === 'ar' ? "rotate-0 text-gold" : "rotate-180 text-gold") : (lang === 'ar' ? "rotate-180" : "rotate-0")
               )} />
             </motion.button>

             <div className="flex items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: '#212121' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full bg-gold text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
                >
                  <Save className="w-4 h-4" />
                  {lang === 'ar' ? 'حفظ الحالات' : 'Save & Exit'}
                </motion.button>
             </div>
             
             {!isSidebarCollapsed && (
               <div className="flex items-center gap-3 px-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">System Operational</p>
               </div>
             )}
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full bg-gray-50/50 overflow-hidden relative">
          {/* Content Header */}
          <div className="h-20 md:h-24 bg-white/50 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 md:px-12 shrink-0">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.1 }}
               className="hidden md:block"
             >
                <h1 className="text-xl md:text-2xl font-black text-dark">
                  {menuItems.find(item => item.id === activeTab)?.name}
                </h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  Management Dashboard / {activeTab}
                </p>
             </motion.div>

             <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto justify-end md:justify-end">
                {/* Desktop Quick Stats */}
                <div className="hidden xl:flex items-center gap-4 mr-2">
                   <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                      <PieChart className="w-4 h-4 text-blue-600" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">{lang === 'ar' ? 'إجمالي الرحلات' : 'Total Trips'}</span>
                        <span className="text-[12px] font-black text-dark leading-none">{trips.length + bookings.filter(b => b.status === 'completed').length}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                      <div className="relative">
                        <Users className="w-4 h-4 text-green-600" />
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-green-400 uppercase tracking-widest leading-none mb-0.5">{lang === 'ar' ? 'سائقين متصلين' : 'Online Drivers'}</span>
                        <span className="text-[12px] font-black text-dark leading-none">{allDrivers.filter(d => d.status === 'online').length}</span>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={onClose}
                  className="bg-gold text-white px-4 md:px-8 h-10 md:h-12 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-dark transition-all shadow-lg shadow-gold/20 active:scale-95 duration-150"
                >
                  <Save className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="inline">{lang === 'ar' ? 'حفظ وخروج' : 'Save & Exit'}</span>
                </button>

                <div className="hidden sm:flex bg-white p-2 px-4 rounded-xl md:rounded-2xl border border-gray-100 items-center gap-3 shadow-sm h-10 md:h-12">
                   <Star className="w-4 h-4 text-gold fill-gold" />
                   <span className="text-xs md:text-sm font-black text-dark">
                     {allDrivers.length > 0 
                       ? (allDrivers.reduce((acc, d) => acc + (d.rating || 5), 0) / allDrivers.length).toFixed(1)
                       : '5.0'}
                   </span>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                   <button className="relative w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-100 rounded-xl md:rounded-2xl flex items-center justify-center text-gray-400 hover:text-dark transition-all shadow-sm hover:scale-105 active:scale-95 duration-150">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full border-2 border-white" />
                   </button>
                   <button 
                     onClick={onClose}
                     className="w-10 h-10 md:w-12 md:h-12 bg-dark text-white rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-gold transition-all shadow-lg shadow-dark/10 hover:scale-105 active:scale-95 duration-150"
                   >
                     <X className="w-5 h-5 md:w-6 md:h-6" />
                   </button>
                </div>
              </div>
            </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="p-4 md:p-8 lg:p-12 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.1 }}
                  className="w-full max-w-[1600px] mx-auto"
                >
                {activeTab === 'overview' && (
                <OverviewTab 
                  trips={trips}
                  bookings={bookings}
                  allDrivers={allDrivers}
                  users={users}
                  lang={lang}
                />
              )}

              {activeTab === 'dispatch' && (
                <ManualDispatchTab 
                  bookings={bookings}
                  allDrivers={allDrivers}
                  lang={lang}
                />
              )}

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
                <PayoutsTab lang={lang} />
              )}

              {activeTab === 'reports' && (
                <ReportsTab lang={lang} />
              )}

              {activeTab === 'promos' && (
                <PromoCodesTab 
                  siteSettings={siteSettings}
                  setSiteSettings={setSiteSettings}
                  lang={lang}
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
                  lang={lang}
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

              {activeTab === 'drivers' && (
                <DriversTab 
                  allDrivers={allDrivers}
                  users={users}
                  safeUpdateDoc={safeUpdateDoc}
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
                  isSuperAdmin={isSuperAdmin}
                />
              )}

              {activeTab === 'audit' && (
                <AuditLogsTab lang={lang} />
              )}

              {activeTab === 'branding' && (
                <BrandingTab 
                  siteSettings={siteSettings}
                  setSiteSettings={setSiteSettings}
                  handleImageUpload={handleImageUpload}
                  safeUpdateDoc={safeUpdateDoc}
                  lang={lang}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  </motion.div>
</div>
  );
};
