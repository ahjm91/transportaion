
import React from 'react';
import { Users, Loader2, Plus, X, Search, ShieldCheck, Car, UserPlus, Eye, Calendar, Mail, Phone, Briefcase, Camera, FileText } from 'lucide-react';
import { Trip, UserProfile, Driver } from '../../types';
import { cn } from '../../lib/utils';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface UsersTabProps {
  users: UserProfile[];
  allDrivers: Driver[];
  isUsersLoading: boolean;
  safeUpdateDoc: (ref: any, data: any) => Promise<void>;
  lang: 'ar' | 'en';
  isSuperAdmin?: boolean;
}

export const UsersTab = ({ users, allDrivers, isUsersLoading, safeUpdateDoc, lang, isSuperAdmin }: UsersTabProps) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewingApp, setViewingApp] = React.useState<UserProfile | null>(null);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  const handleApproveDriver = async (u: UserProfile) => {
    if (!confirm(lang === 'ar' ? `هل أنت متأكد من الموافقة على طلب ${u.name} كشريك سائق؟` : `Are you sure you want to approve ${u.name}'s driver application?`)) return;
    
    try {
      await safeUpdateDoc(doc(db, 'users', u.uid), { 
        role: 'driver', 
        driverApplicationStatus: 'approved',
        isVerified: true,
        verificationMessage: lang === 'ar' ? 'تمت الموافقة على طلبك كشريك سائق! يمكنك الآن البدء بالعمل.' : 'Your driver application has been approved! You can now start working.'
      });
      
      // Initialize driver tracking document
      const appData = u.driverApplicationData;
      await setDoc(doc(db, 'drivers', u.uid), {
        id: u.uid,
        name: appData?.fullName || u.name || 'Driver',
        phone: appData?.phone || u.phone || '',
        carType: appData?.carType || 'Standard',
        carImage: appData?.profilePic || '',
        plateNumber: appData?.plateNumber || '',
        status: 'offline',
        location: { lat: 26.2, lng: 50.5 },
        lastUpdated: serverTimestamp(),
        wallet: 0,
        rating: 5,
        totalRatings: 0
      });

      setViewingApp(null);
      alert(lang === 'ar' ? 'تمت الموافقة وتفعيل حساب السائق بنجاح' : 'Driver application approved and activated successfully');
    } catch (err) {
      console.error('Error approving driver:', err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء الموافقة' : 'Error during approval');
    }
  };

  const handleRejectDriver = async (u: UserProfile) => {
    const reason = prompt(lang === 'ar' ? 'سبب الرفض (اختياري):' : 'Rejection reason (optional):');
    if (reason === null) return;

    try {
      await safeUpdateDoc(doc(db, 'users', u.uid), { 
        driverApplicationStatus: 'rejected',
        verificationMessage: lang === 'ar' ? `نعتذر، تم رفض طلبك. السبب: ${reason}` : `Sorry, your application was rejected. Reason: ${reason}`
      });
      setViewingApp(null);
      alert(lang === 'ar' ? 'تم رفض الطلب' : 'Application rejected');
    } catch (err) {
      console.error('Error rejecting driver:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h4 className="text-xl font-black text-dark flex items-center gap-2">
          <Users className="text-gold w-6 h-6" />
          {lang === 'ar' ? 'إدارة الأعضاء والولاء' : 'Member & Loyalty Management'}
        </h4>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400", lang === 'ar' ? "right-4" : "left-4")} />
            <input 
              type="text" 
              placeholder={lang === 'ar' ? "بحث في الأعضاء..." : "Search members..."}
              className={cn("bg-gray-50 border-gray-100 rounded-xl py-2 text-xs font-bold focus:ring-2 focus:ring-gold/20 transition-all w-64", lang === 'ar' ? "pr-10 pl-4" : "pl-10 pr-4")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
            {lang === 'ar' ? 'الإجمالي' : 'Total'}: {users.length}
          </div>
        </div>
      </div>

      {isUsersLoading ? (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
          <Loader2 className="w-12 h-12 text-gold animate-spin" />
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{lang === 'ar' ? 'جاري تحميل قائمة الأعضاء...' : 'Loading members list...'}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-[1100px]">
              <thead>
                <tr className={cn("bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest", lang === 'ar' ? "text-right" : "text-left")}>
                  <th className="p-5 border-b">{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th className="p-5 border-b">{lang === 'ar' ? 'كود الإحالة' : 'Referral Code'}</th>
                  <th className="p-5 border-b">{lang === 'ar' ? 'العضوية' : 'Membership'}</th>
                  <th className="p-5 border-b">{lang === 'ar' ? 'المحفظة (Wallet)' : 'Wallet balance'}</th>
                  <th className="p-5 border-b">{lang === 'ar' ? 'التفعيل' : 'Status'}</th>
                  <th className="p-5 border-b">{lang === 'ar' ? 'الكاش باك (BHD)' : 'Cashback (BHD)'}</th>
                  <th className="p-5 border-b">{lang === 'ar' ? 'الجوائز والخصومات' : 'Rewards & Discounts'}</th>
                </tr>
              </thead>
              <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.uid} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all font-bold text-xs">
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="w-12 h-12 rounded-2xl border-2 border-gold/10 object-cover" />
                            ) : (
                              <div className="w-12 h-12 bg-dark/5 text-dark rounded-2xl flex items-center justify-center font-black text-sm">
                                {u.name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-dark font-black">{u.name}</div>
                                <div className="bg-gold/10 text-gold text-[8px] px-2 py-0.5 rounded-full font-bold">#{u.membershipNumber || '...'}</div>
                                {u.role === 'driver' && <Car className="w-3 h-3 text-gold" />}
                              </div>
                              <div className="text-[10px] text-gray-300 font-mono mt-0.5">{u.email}</div>
                              <div className="mt-1 flex items-center gap-2">
                                {u.driverApplicationStatus === 'pending' ? (
                                  <button 
                                    onClick={() => setViewingApp(u)}
                                    className="flex items-center gap-1 px-2 py-1 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-all text-[8px] font-black uppercase"
                                  >
                                    <ShieldCheck className="w-2 h-2" />
                                    {lang === 'ar' ? 'مراجعة الطلب' : 'Review App'}
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => setViewingApp(u)}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-all text-[8px] font-black uppercase"
                                  >
                                    <FileText className="w-2.5 h-2.5" />
                                    {lang === 'ar' ? 'عرض المستندات' : 'View Documents'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                             <div className="p-2 bg-gray-50 rounded-lg">
                               <input 
                                  type="text"
                                  className="w-20 bg-transparent border-none text-center font-black text-gold focus:ring-0 p-0 uppercase tracking-widest"
                                  value={u.referralCode || ''}
                                  onChange={async e => {
                                    const val = e.target.value.toUpperCase();
                                    await safeUpdateDoc(doc(db, 'users', u.uid), { referralCode: val });
                                  }}
                               />
                             </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="space-y-2">
                            <select 
                              className="bg-gray-100 border-none rounded-xl text-[10px] font-black p-2 focus:ring-2 focus:ring-gold/20 block w-full"
                              value={u.membershipStatus}
                              onChange={e => safeUpdateDoc(doc(db, 'users', u.uid), { membershipStatus: e.target.value })}
                            >
                              <option value="Bronze">🥉 Bronze</option>
                              <option value="Silver">🥈 Silver</option>
                              <option value="Gold">🥇 Gold</option>
                              <option value="VIP">💎 VIP Member</option>
                            </select>

                            {u.role !== 'driver' && (
                              <button 
                                onClick={async () => {
                                  if (confirm(lang === 'ar' ? `تحويل ${u.name} إلى سائق؟` : `Promote ${u.name} to driver?`)) {
                                    try {
                                      await safeUpdateDoc(doc(db, 'users', u.uid), { 
                                        role: 'driver', 
                                        driverApplicationStatus: 'approved' 
                                      });
                                      
                                      // Initialize driver tracking document with wallet
                                      await setDoc(doc(db, 'drivers', u.uid), {
                                        name: u.name || 'Driver',
                                        phone: u.phone || '',
                                        carType: u.driverApplicationData?.carType || 'Standard',
                                        status: 'offline',
                                        location: { lat: 26.2, lng: 50.5 },
                                        lastUpdated: serverTimestamp(),
                                        wallet: 0
                                      });
                                      alert(lang === 'ar' ? 'تم تعيين المستخدم كسائق بنجاح' : 'User promoted to driver successfully');
                                    } catch (err) {
                                      console.error('Error promoting driver:', err);
                                      alert(lang === 'ar' ? 'فشل تعيين السائق. تأكد من الصلاحيات.' : 'Failed to promote driver. Check permissions.');
                                    }
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-1 p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-[9px] font-black uppercase"
                              >
                                <UserPlus className="w-3 h-3" />
                                {lang === 'ar' ? 'تعيين كسائق' : 'Set as Driver'}
                              </button>
                            )}
                            
                            {isSuperAdmin && u.role !== 'admin' && (
                              <button 
                                onClick={async () => {
                                  if (confirm(lang === 'ar' ? `تعيين ${u.name} كمدير للنظام؟` : `Promote ${u.name} to Admin?`)) {
                                    try {
                                      await safeUpdateDoc(doc(db, 'users', u.uid), { role: 'admin' });
                                      alert(lang === 'ar' ? 'تم تعيين المدير بنجاح' : 'User promoted to Admin successfully');
                                    } catch (err) {
                                      console.error('Error promoting admin:', err);
                                      alert(lang === 'ar' ? 'فشل الترقية' : 'Failed to promote');
                                    }
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-1 p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all text-[9px] font-black uppercase mt-1"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                {lang === 'ar' ? 'تعيين كمدير' : 'Set as Admin'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                             <div className="p-2 bg-gray-50 rounded-lg">
                               <input 
                                  type="number"
                                  step="0.1"
                                  className="w-16 bg-transparent border-none text-center font-black text-dark focus:ring-0 p-0"
                                  value={(u.role === 'driver' ? allDrivers.find(d => d.id === u.uid)?.wallet : u.wallet) || 0}
                                  onChange={async e => {
                                    const val = parseFloat(e.target.value) || 0;
                                    if (u.role === 'driver') {
                                      await updateDoc(doc(db, 'drivers', u.uid), { wallet: val });
                                    } else {
                                      await safeUpdateDoc(doc(db, 'users', u.uid), { wallet: val });
                                    }
                                  }}
                               />
                             </div>
                             <span className="text-[10px] text-gray-400 font-black uppercase">BHD</span>
                          </div>
                        </td>
                    <td className="p-5">
                      <button 
                        onClick={() => safeUpdateDoc(doc(db, 'users', u.uid), { 
                          isVerified: !u.isVerified, 
                          verificationMessage: !u.isVerified 
                            ? (lang === 'ar' ? 'تم تفعيل حسابك بنجاح! استمتع برحلاتك.' : 'Account activated successfully! Enjoy your trips.')
                            : (lang === 'ar' ? 'جاري مراجعة طلب اشتراكك.' : 'Your account is under review.')
                        })}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black text-white flex items-center gap-2 transition-all",
                          u.isVerified ? "bg-green-500 shadow-lg shadow-green-500/20" : "bg-orange-500 shadow-lg shadow-orange-500/20"
                        )}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {u.isVerified 
                          ? (lang === 'ar' ? 'عضو مفعل' : 'Verified Member') 
                          : (lang === 'ar' ? 'بانتظار التفعيل' : 'Pending Verification')}
                      </button>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                         <div className="p-2 bg-gray-50 rounded-lg">
                           <input 
                              type="number"
                              step="0.1"
                              className="w-16 bg-transparent border-none text-center font-black text-dark focus:ring-0 p-0"
                              value={u.cashbackBalance || 0}
                              onChange={e => safeUpdateDoc(doc(db, 'users', u.uid), { cashbackBalance: parseFloat(e.target.value) || 0 })}
                           />
                         </div>
                         <span className="text-[10px] text-gray-400 font-black uppercase">BHD</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => {
                            const prize = prompt(lang === 'ar' ? 'أدخل اسم الجائزة الجديدة (مثال: رحلة مجانية للمطار):' : 'Enter new prize name (e.g. Free airport trip):');
                            if (prize) {
                              const current = u.availableRewards || [];
                              safeUpdateDoc(doc(db, 'users', u.uid), { availableRewards: [...current, prize] });
                            }
                          }}
                          className="bg-gold/10 text-gold hover:bg-gold/20 p-2 rounded-xl transition-all"
                          title={lang === 'ar' ? "إضافة جائزة" : "Add reward"}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {u.availableRewards && u.availableRewards.map((reward, rid) => (
                          <div key={rid} className="bg-dark text-white rounded-xl py-1 px-3 flex items-center gap-2 text-[10px] font-bold group animate-in zoom-in-95">
                            {reward}
                            <X 
                              className="w-3 h-3 cursor-pointer opacity-40 hover:opacity-100" 
                              onClick={() => {
                                if (confirm(lang === 'ar' ? 'حذف هذه الجائزة من حساب العميل؟' : 'Delete this reward from customer account?')) {
                                  const filtered = u.availableRewards?.filter((_, idx) => idx !== rid);
                                  safeUpdateDoc(doc(db, 'users', u.uid), { availableRewards: filtered });
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application & Document Review Modal */}
      {viewingApp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 md:p-12 space-y-8 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center">
                      <Car className="w-8 h-8 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-dark">
                        {viewingApp.driverApplicationStatus === 'pending' 
                          ? (lang === 'ar' ? 'مراجعة طلب الانضمام' : 'Review Driver Application')
                          : (lang === 'ar' ? 'مستندات العضو' : 'Member Documents')}
                      </h3>
                      <p className="text-gray-400 text-xs font-bold">
                        {viewingApp.name} - {viewingApp.email}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setViewingApp(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                {/* Document Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Profile Photo */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Camera className="w-3 h-3" />
                       {lang === 'ar' ? 'الصورة الشخصية' : 'Profile Photo'}
                    </label>
                    <div className="aspect-square rounded-3xl bg-gray-50 overflow-hidden border-4 border-white shadow-lg relative group">
                       {(viewingApp.driverApplicationData?.profilePic || viewingApp.photoURL || allDrivers.find(d => d.id === viewingApp.uid)?.profileImage) ? (
                         <>
                           <img 
                            src={viewingApp.driverApplicationData?.profilePic || viewingApp.photoURL || allDrivers.find(d => d.id === viewingApp.uid)?.profileImage} 
                            className="w-full h-full object-cover" 
                            alt="Profile" 
                           />
                           <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button 
                               onClick={() => window.open(viewingApp.driverApplicationData?.profilePic || viewingApp.photoURL || allDrivers.find(d => d.id === viewingApp.uid)?.profileImage)}
                               className="bg-white text-dark px-3 py-1 rounded-lg text-[8px] font-black uppercase"
                             >
                               {lang === 'ar' ? 'فتح' : 'Open'}
                             </button>
                           </div>
                         </>
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 font-bold p-4 text-center">
                           <Camera className="w-6 h-6 mb-2" />
                           <span className="text-[8px]">{lang === 'ar' ? 'لا توجد صورة' : 'No Photo'}</span>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* License Photo */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <FileText className="w-3 h-3 text-gold" />
                       {lang === 'ar' ? 'رخصة السياقة' : 'Driving License'}
                    </label>
                    <div className="aspect-square rounded-3xl bg-gray-50 overflow-hidden border-4 border-white shadow-lg relative group">
                       {(viewingApp.driverApplicationData?.licensePic || allDrivers.find(d => d.id === viewingApp.uid)?.licenseImage) ? (
                         <>
                           <img 
                            src={viewingApp.driverApplicationData?.licensePic || allDrivers.find(d => d.id === viewingApp.uid)?.licenseImage} 
                            className="w-full h-full object-cover" 
                            alt="License" 
                           />
                           <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button 
                               onClick={() => window.open(viewingApp.driverApplicationData?.licensePic || allDrivers.find(d => d.id === viewingApp.uid)?.licenseImage)}
                               className="bg-white text-dark px-3 py-1 rounded-lg text-[8px] font-black uppercase"
                             >
                               {lang === 'ar' ? 'فتح' : 'Open'}
                             </button>
                           </div>
                         </>
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 font-bold p-4 text-center">
                           <FileText className="w-6 h-6 mb-2" />
                           <span className="text-[8px]">{lang === 'ar' ? 'لا يوجدمستند' : 'No Document'}</span>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* ID Card / CPR */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck className="w-3 h-3 text-blue-500" />
                       {lang === 'ar' ? 'البطاقة السكانية' : 'ID Card / CPR'}
                    </label>
                    <div className="aspect-square rounded-3xl bg-gray-50 overflow-hidden border-4 border-white shadow-lg relative group">
                       {(allDrivers.find(d => d.id === viewingApp.uid)?.idCardImage) ? (
                         <>
                           <img 
                            src={allDrivers.find(d => d.id === viewingApp.uid)?.idCardImage} 
                            className="w-full h-full object-cover" 
                            alt="ID Card" 
                           />
                           <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button 
                               onClick={() => window.open(allDrivers.find(d => d.id === viewingApp.uid)?.idCardImage)}
                               className="bg-white text-dark px-3 py-1 rounded-lg text-[8px] font-black uppercase"
                             >
                               {lang === 'ar' ? 'فتح' : 'Open'}
                             </button>
                           </div>
                         </>
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 font-bold p-4 text-center">
                           <ShieldCheck className="w-6 h-6 mb-2" />
                           <span className="text-[8px]">{lang === 'ar' ? 'لا يوجدمستند' : 'No Document'}</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                {/* Edit Links (If documents missing) */}
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{lang === 'ar' ? 'إدارة روابط المستندات' : 'Manage Document Links'}</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400">رابط الرخصة</label>
                      <input 
                        type="text" 
                        placeholder="https://..."
                        className="w-full bg-white border-none rounded-lg p-2 text-[10px] font-bold"
                        value={viewingApp.driverApplicationData?.licensePic || allDrivers.find(d => d.id === viewingApp.uid)?.licenseImage || ''}
                        onChange={async (e) => {
                          const val = e.target.value;
                          const driverRef = doc(db, 'drivers', viewingApp.uid);
                          await updateDoc(driverRef, { licenseImage: val });
                          await updateDoc(doc(db, 'users', viewingApp.uid), { "driverApplicationData.licensePic": val });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400">رابط الهوية</label>
                      <input 
                        type="text" 
                        placeholder="https://..."
                        className="w-full bg-white border-none rounded-lg p-2 text-[10px] font-bold"
                        value={allDrivers.find(d => d.id === viewingApp.uid)?.idCardImage || ''}
                        onChange={async (e) => {
                          const val = e.target.value;
                          const driverRef = doc(db, 'drivers', viewingApp.uid);
                          await updateDoc(driverRef, { idCardImage: val });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 rounded-3xl p-6 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase">{lang === 'ar' ? 'الاسم كاملاً' : 'Full Name'}</label>
                    <p className="text-xs font-black text-dark">{viewingApp.driverApplicationData?.fullName || viewingApp.name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                    <p className="text-xs font-black text-dark" dir="ltr">{viewingApp.driverApplicationData?.phone || viewingApp.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase">{lang === 'ar' ? 'رقم اللوحة' : 'Plate Number'}</label>
                    <p className="text-xs font-black text-dark">{viewingApp.driverApplicationData?.plateNumber || allDrivers.find(d => d.id === viewingApp.uid)?.plateNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase">{lang === 'ar' ? 'نوع السيارة' : 'Car Type'}</label>
                    <p className="text-xs font-black text-dark">{viewingApp.driverApplicationData?.carType || allDrivers.find(d => d.id === viewingApp.uid)?.carType || 'Standard'}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {viewingApp.driverApplicationStatus === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleRejectDriver(viewingApp)}
                        className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all"
                      >
                        {lang === 'ar' ? 'رفض الطلب' : 'Reject Application'}
                      </button>
                      <button 
                        onClick={() => handleApproveDriver(viewingApp)}
                        className="flex-1 py-4 bg-dark text-white rounded-2xl font-black text-xs hover:bg-gold hover:text-dark transition-all"
                      >
                        {lang === 'ar' ? 'الموافقة والتعيين' : 'Approve & Assign'}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setViewingApp(null)}
                      className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs hover:bg-gray-200 transition-all font-black uppercase tracking-widest"
                    >
                      {lang === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                  )}
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
