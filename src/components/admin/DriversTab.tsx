
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, Shield, Star, AlertTriangle, CheckCircle2, XCircle, 
  Search, Filter, MoreVertical, Eye, MapPin, Phone, 
  Trash2, RotateCw, Loader2, MessageSquare
} from 'lucide-react';
import { db } from '../../firebase';
import { 
  collection, query, where, getDocs, doc, 
  updateDoc, orderBy, limit, onSnapshot 
} from 'firebase/firestore';
import { Driver, UserProfile, Rating, SiteSettings } from '../../types';
import { cn } from '../../lib/utils';

interface DriversTabProps {
  allDrivers: Driver[];
  users: UserProfile[];
  safeUpdateDoc: (ref: any, data: any) => Promise<void>;
  lang: 'ar' | 'en';
}

export const DriversTab = ({ allDrivers, users, safeUpdateDoc, lang }: DriversTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'pending' | 'ratings'>('active');
  const [selectedDriverRatings, setSelectedDriverRatings] = useState<Rating[]>([]);
  const [isRatingsLoading, setIsRatingsLoading] = useState(false);
  const [viewingRatingsFor, setViewingRatingsFor] = useState<Driver | null>(null);
  const [viewingApplication, setViewingApplication] = useState<UserProfile | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const pendingApplications = users.filter(u => u.driverApplicationStatus === 'pending');
  
  const filteredDrivers = allDrivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.phone.includes(searchTerm) ||
    d.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchDriverRatings = async (driverId: string) => {
    setIsRatingsLoading(true);
    try {
      const q = query(
        collection(db, 'ratings'),
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const ratings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating));
      setSelectedDriverRatings(ratings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setIsRatingsLoading(false);
    }
  };

  const handleStatusChange = async (driverId: string, status: 'active' | 'suspended') => {
    if (!confirm(lang === 'ar' ? `هل أنت متأكد من ${status === 'suspended' ? 'إيقاف' : 'تفعيل'} هذا السائق؟` : `Are you sure you want to ${status} this driver?`)) return;
    
    try {
      await updateDoc(doc(db, 'drivers', driverId), { adminStatus: status });
      // Also update the user profile
      await updateDoc(doc(db, 'users', driverId), { driverStatus: status });
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
  };

  const handleVerifyDriver = async (driverId: string, isVerified: boolean, message?: string) => {
    try {
      await updateDoc(doc(db, 'drivers', driverId), { 
        isVerified, 
        verificationMessage: message || '' 
      });
      alert(lang === 'ar' ? 'تم تحديث حالة التوثيق!' : 'Verification status updated!');
    } catch (error) {
      console.error('Error verifying driver:', error);
    }
  };

  const handleApproveDriver = async (user: UserProfile) => {
    if (!user.driverApplicationData) return;
    setIsApproving(true);
    try {
      const driverData: any = {
        name: user.name,
        phone: user.phone,
        carType: user.driverApplicationData.carType,
        carModel: user.driverApplicationData.carModel,
        plateNumber: user.driverApplicationData.plateNumber,
        uid: user.uid,
        status: 'offline',
        adminStatus: 'active',
        registrationStatus: 'approved',
        carImage: user.driverApplicationData.profilePic || '',
        wallet: { balance: 0, totalEarnings: 0, pendingPayouts: 0 },
        averageRating: 5.0,
        ratingCount: 0,
        totalRating: 0,
        location: { lat: 26.2285, lng: 50.5860 }, // Default Bahrain
        lastUpdated: new Date().toISOString()
      };

      // 1. Create/Update driver doc
      await updateDoc(doc(db, 'drivers', user.uid), driverData);
      
      // 2. Update user profile docs
      await updateDoc(doc(db, 'users', user.uid), {
        role: 'driver',
        driverApplicationStatus: 'approved',
        driverStatus: 'active',
        plateNumber: user.driverApplicationData.plateNumber,
        carImage: user.driverApplicationData.profilePic || ''
      });

      setViewingApplication(null);
      alert(lang === 'ar' ? 'تم قبول السائق بنجاح!' : 'Driver approved successfully!');
    } catch (error) {
      console.error('Error approving driver:', error);
      alert('Error: ' + (error as any).message);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-6">
          <h4 className="text-xl font-black text-dark flex items-center gap-2">
            <Car className="text-gold w-6 h-6" />
            {lang === 'ar' ? 'إدارة السائقين' : 'Driver Management'}
          </h4>
          
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button 
              onClick={() => setActiveSubTab('active')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                activeSubTab === 'active' ? "bg-white text-dark shadow-sm" : "text-gray-400 hover:text-dark"
              )}
            >
              {lang === 'ar' ? 'السائقين النشطين' : 'Active Drivers'}
            </button>
            <button 
              onClick={() => setActiveSubTab('pending')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2",
                activeSubTab === 'pending' ? "bg-white text-dark shadow-sm" : "text-gray-400 hover:text-dark"
              )}
            >
              {lang === 'ar' ? 'طلبات التسجيل' : 'Requests'}
              {pendingApplications.length > 0 && (
                <span className="bg-red-500 text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center animate-pulse">
                  {pendingApplications.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400", lang === 'ar' ? "right-4" : "left-4")} />
          <input 
            type="text" 
            placeholder={lang === 'ar' ? "بحث بالاسم، الهاتف أو اللوحة..." : "Search by name, phone or plate..."}
            className={cn("bg-white border-gray-100 rounded-2xl py-3 text-xs font-bold focus:ring-2 focus:ring-gold/20 transition-all w-72 shadow-sm", lang === 'ar' ? "pr-10 pl-4" : "pl-10 pr-4")}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {activeSubTab === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map(driver => (
            <div key={driver.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              {/* Status Badge */}
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  driver.status === 'online' ? "bg-green-500 animate-pulse" : "bg-gray-300"
                )} />
                <span className="text-[10px] font-black uppercase text-gray-400">{driver.status}</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  {driver.carImage ? (
                    <img src={driver.carImage} className="w-16 h-16 rounded-2xl object-cover border-2 border-gold/10" alt={driver.name} />
                  ) : (
                    <div className="w-16 h-16 bg-dark/5 text-dark rounded-2xl flex items-center justify-center font-black text-xl">
                      {driver.name.charAt(0)}
                    </div>
                  )}
                  {driver.adminStatus === 'suspended' && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 p-1 rounded-lg border-2 border-white">
                      <XCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="font-black text-dark text-lg">{driver.name}</h5>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase mt-1">
                    <Car className="w-3 h-3" />
                    {driver.carType} • {driver.plateNumber || 'TBD'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <div className="text-[10px] text-gray-400 font-black uppercase mb-1">{lang === 'ar' ? 'التقييم' : 'Rating'}</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg font-black text-dark">{driver.averageRating || 5.0}</span>
                    <Star className="w-4 h-4 text-gold fill-gold" />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <div className="text-[10px] text-gray-400 font-black uppercase mb-1">{lang === 'ar' ? 'المحفظة' : 'Wallet'}</div>
                  <div className="text-lg font-black text-gold">{(driver.wallet?.balance || 0).toFixed(1)} <span className="text-[10px]">BHD</span></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setViewingRatingsFor(driver);
                    fetchDriverRatings(driver.id);
                  }}
                  className="flex-1 bg-dark text-white p-3 rounded-xl font-black text-[10px] uppercase hover:bg-gold transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'التقييمات' : 'Ratings'}
                </button>
                <button 
                  onClick={() => handleStatusChange(driver.id, driver.adminStatus === 'suspended' ? 'active' : 'suspended')}
                  className={cn(
                    "flex-1 p-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 border-2",
                    driver.adminStatus === 'suspended' 
                      ? "bg-green-50 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      : "bg-red-50 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  )}
                >
                  {driver.adminStatus === 'suspended' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'تفعيل' : 'Activate'}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'إيقاف' : 'Suspend'}
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => {
                    const message = prompt(lang === 'ar' ? 'رسالة التوثيق (اختياري):' : 'Verification message (optional):');
                    handleVerifyDriver(driver.id, true, message || undefined);
                  }}
                  className={cn(
                    "flex-1 p-2 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-1 border",
                    driver.isVerified ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-400 border-gray-100 hover:border-gold hover:text-gold"
                  )}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {driver.isVerified ? (lang === 'ar' ? 'موثق' : 'Verified') : (lang === 'ar' ? 'توثيق' : 'Verify')}
                </button>
                <button 
                  onClick={() => {
                    const message = prompt(lang === 'ar' ? 'سبب الرفض:' : 'Rejection reason:');
                    if (message) handleVerifyDriver(driver.id, false, message);
                  }}
                  className="flex-1 p-2 bg-white text-gray-400 border border-gray-100 rounded-xl font-black text-[9px] uppercase hover:border-red-500 hover:text-red-500 transition-all flex items-center justify-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  {lang === 'ar' ? 'رفض' : 'Reject'}
                </button>
              </div>

              {/* View Docs Button */}
              {(driver.licenseImage || driver.idCardImage) && (
                <button 
                  onClick={() => {
                    // Quick modal to view docs
                    const docsHtml = `
                      <div class="space-y-4 p-4 text-right" dir="rtl">
                        <h4 class="font-black text-lg mb-4">مستندات السائق: ${driver.name}</h4>
                        ${driver.profileImage ? `<div><p class="text-[10px] font-black text-gray-400 uppercase">الصورة الشخصية</p><img src="${driver.profileImage}" class="w-full rounded-2xl border" /></div>` : ''}
                        ${driver.licenseImage ? `<div class="mt-4"><p class="text-[10px] font-black text-gray-400 uppercase">رخصة القيادة</p><img src="${driver.licenseImage}" class="w-full rounded-2xl border" /></div>` : ''}
                        ${driver.idCardImage ? `<div class="mt-4"><p class="text-[10px] font-black text-gray-400 uppercase">الهوية</p><img src="${driver.idCardImage}" class="w-full rounded-2xl border" /></div>` : ''}
                        ${driver.carImage ? `<div class="mt-4"><p class="text-[10px] font-black text-gray-400 uppercase">صورة السيارة</p><img src="${driver.carImage}" class="w-full rounded-2xl border" /></div>` : ''}
                      </div>
                    `;
                    const w = window.open('', '_blank');
                    w?.document.write(`
                      <html>
                        <head>
                          <title>Driver Docs</title>
                          <script src="https://cdn.tailwindcss.com"></script>
                        </head>
                        <body class="bg-gray-50 p-8">${docsHtml}</body>
                      </html>
                    `);
                  }}
                  className="w-full mt-4 p-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {lang === 'ar' ? 'عرض المستندات المرفقة' : 'View Documents'}
                </button>
              )}
              {/* Special Badges for Promoted/Demoted */}
              <div className="mt-4 flex flex-wrap gap-2">
                {(driver.averageRating || 5) >= 4.5 && (
                  <div className="bg-green-50 text-green-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-green-100">
                    <Star className="w-2 h-2 fill-green-500" />
                    {lang === 'ar' ? 'سائق متميز (ترقية)' : 'Top Rated (Promoted)'}
                  </div>
                )}
                {(driver.averageRating || 5) < 3 && (driver.ratingCount || 0) > 0 && (
                  <div className="bg-red-50 text-red-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-red-100">
                    <AlertTriangle className="w-2 h-2" />
                    {lang === 'ar' ? 'تقييم منخفض (إنذار)' : 'Low Rating (Warning)'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'pending' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
          {pendingApplications.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-gray-300" />
              </div>
              <h5 className="text-xl font-black text-dark">{lang === 'ar' ? 'لا توجد طلبات معلقة' : 'No Pending Requests'}</h5>
              <p className="text-gray-400 text-sm">{lang === 'ar' ? 'تمت معالجة جميع طلبات التسجيل السابقة.' : 'All registration requests have been processed.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right min-w-[900px]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="p-6">{lang === 'ar' ? 'السائق' : 'Driver'}</th>
                    <th className="p-6">{lang === 'ar' ? 'السيارة واللوحة' : 'Vehicle & Plate'}</th>
                    <th className="p-6">{lang === 'ar' ? 'تاريخ التقديم' : 'Applied At'}</th>
                    <th className="p-6">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingApplications.map(u => (
                    <tr key={u.uid} className="hover:bg-gray-50/50 transition-all group">
                      <td className="p-6">
                        <div className="flex items-center gap-4 text-right">
                          <div className="w-12 h-12 bg-dark/5 rounded-2xl flex items-center justify-center font-black text-lg text-dark">
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-dark">{u.name}</div>
                            <div className="text-[10px] text-gray-400 font-bold">{u.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 font-bold text-xs text-dark">
                        {u.driverApplicationData?.carType} {u.driverApplicationData?.carModel}
                        <div className="text-[10px] text-gold font-mono uppercase mt-1">Plate: {u.driverApplicationData?.plateNumber}</div>
                      </td>
                      <td className="p-6 text-[10px] text-gray-400 font-black">
                        {u.driverApplicationData?.appliedAt ? new Date(u.driverApplicationData.appliedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-6">
                        <button 
                          onClick={() => setViewingApplication(u)}
                          className="bg-dark text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-gold hover:text-dark transition-all"
                        >
                          {lang === 'ar' ? 'مراجعة وقبول' : 'Review & Approve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ratings View Drawer/Modal overlay */}
      <AnimatePresence>
        {viewingRatingsFor && (
          <div className="fixed inset-0 z-[160] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingRatingsFor(null)}
              className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative bg-white h-full w-full max-w-lg shadow-2xl overflow-y-auto p-8"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-2xl font-black text-dark">{lang === 'ar' ? 'سجل التقييمات' : 'Rating History'}</h4>
                  <p className="text-gray-400 text-sm font-bold mt-1">{lang === 'ar' ? 'للسائق:' : 'For Driver:'} {viewingRatingsFor.name}</p>
                </div>
                <button 
                  onClick={() => setViewingRatingsFor(null)}
                  className="p-2 bg-gray-100 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {isRatingsLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <Loader2 className="w-10 h-10 text-gold animate-spin" />
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Loading reviews...</p>
                </div>
              ) : selectedDriverRatings.length === 0 ? (
                <div className="p-10 text-center space-y-4 bg-gray-50 rounded-3xl">
                  <MessageSquare className="w-12 h-12 text-gray-200 mx-auto" />
                  <p className="text-gray-400 font-bold">{lang === 'ar' ? 'لا توجد تقييمات مكتوبة بعد.' : 'No reviews written yet.'}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedDriverRatings.map(rating => (
                    <div key={rating.id} className="bg-gray-50 rounded-3xl p-6 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star 
                              key={s} 
                              className={cn(
                                "w-4 h-4",
                                s <= rating.rating ? "text-gold fill-gold" : "text-gray-200"
                              )} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400 font-black">{new Date(rating.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-dark font-bold text-sm leading-relaxed italic">"{rating.comment || (lang === 'ar' ? 'بدون تعليق' : 'No comment')}"</p>
                      <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        {lang === 'ar' ? 'رحلة تمت بنجاح' : 'Trip Completed'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingApplication && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingApplication(null)}
              className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-2xl font-black text-dark">{lang === 'ar' ? 'مراجعة طلب السائق' : 'Review Driver Request'}</h4>
                <button onClick={() => setViewingApplication(null)} className="p-2 bg-gray-100 rounded-full text-gray-400"><XCircle /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="flex gap-6">
                  <div className="w-32 h-32 bg-gray-100 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                    {viewingApplication.driverApplicationData?.profilePic ? (
                      <img src={viewingApplication.driverApplicationData.profilePic} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-300">{viewingApplication.name?.charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-2xl font-black text-dark">{viewingApplication.name}</h5>
                    <p className="text-gray-400 font-bold">{viewingApplication.email}</p>
                    <p className="text-gold font-black mt-2">{viewingApplication.phone}</p>
                    <div className="mt-4 flex gap-2">
                       <span className="bg-gold/10 text-gold px-3 py-1 rounded-full text-[10px] font-black uppercase">{viewingApplication.driverApplicationData?.carType}</span>
                       <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">Exp: {viewingApplication.driverApplicationData?.experience}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-3xl">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-2">Vehicle Details</p>
                    <p className="text-dark font-bold">{viewingApplication.driverApplicationData?.carModel}</p>
                    <p className="text-gold font-black text-xl mt-1">{viewingApplication.driverApplicationData?.plateNumber}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-2">License Expiry</p>
                    <p className="text-dark font-bold">{viewingApplication.driverApplicationData?.licenseExpiry}</p>
                  </div>
                </div>

                <div>
                   <p className="text-[10px] text-gray-400 font-black uppercase mb-4">Driving License</p>
                   <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200">
                     {viewingApplication.driverApplicationData?.licensePic && (
                       <img src={viewingApplication.driverApplicationData.licensePic} className="w-full h-full object-contain" />
                     )}
                   </div>
                </div>
              </div>
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                <button 
                  disabled={isApproving}
                  onClick={() => handleApproveDriver(viewingApplication)}
                  className="flex-1 bg-dark text-white py-4 rounded-2xl font-black text-lg hover:bg-gold hover:text-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isApproving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                  {lang === 'ar' ? 'قبول الطلب وتفعيل السائق' : 'Approve & Activate'}
                </button>
                <button className="px-8 border-2 border-red-100 text-red-500 py-4 rounded-2xl font-black text-lg hover:bg-red-500 hover:text-white transition-all">
                  {lang === 'ar' ? 'رفض' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
