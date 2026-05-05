
import React from 'react';
import { motion } from 'motion/react';
import { DollarSign, Search, Calendar, Phone, Truck, ShieldCheck, Wallet, Copy, Settings, Trash2, CheckCircle, Loader2, Zap, X } from 'lucide-react';
import { Trip, SiteSettings, Booking, UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface AccountingTabProps {
  trips: Trip[];
  bookings: Booking[];
  users: UserProfile[];
  tripFilter: string;
  setTripFilter: (filter: any) => void;
  isAdminScheduleView: boolean;
  setIsAdminScheduleView: (view: boolean) => void;
  lang: 'ar' | 'en';
  isSuperAdmin: boolean;
  setEditingTrip: (trip: Trip) => void;
  setTripFormData: (data: any) => void;
  setIsTripFormOpen: (open: boolean) => void;
  setTripToDelete: (trip: Trip) => void;
}

export const AccountingTab = ({
  trips, bookings, users, tripFilter, setTripFilter, isAdminScheduleView, setIsAdminScheduleView,
  lang, isSuperAdmin, setEditingTrip, setTripFormData, setIsTripFormOpen, setTripToDelete
}: AccountingTabProps) => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  
  // Convert bookings to trip-like items for display
  const bookingTrips: any[] = bookings.map(b => {
    const userProfile = users.find(u => u.uid === b.userId);
    return {
      id: b.id,
      customerName: b.customerName,
      phone: b.phone,
      direction: `${b.pickupAddress} ← ${b.dropoffAddress}`,
      pickup: b.pickupAddress,
      dropoff: b.dropoffAddress,
      carType: b.carType,
      status: b.status === 'searching_driver' ? 'Requested' : 
              (b.status === 'driver_assigned' || b.status === 'driver_arriving' || b.status === 'trip_started') ? 'Confirmed' :
              b.status === 'completed' ? 'Completed' : 'Cancelled',
      amount: b.price,
      commission: b.commission || 0,
      date: b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000).toISOString().split('T')[0] : '---',
      time: b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000).toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' }) : '---',
      driverName: (b as any).driverName || '',
      paymentStatus: 'Pending',
      isRealtime: true,
      membershipNumber: userProfile?.membershipNumber
    };
  });

  const combinedItems = [...trips.map(t => {
    const userProfile = users.find(u => u.uid === t.userId);
    return { ...t, commission: t.profit, membershipNumber: t.membershipNumber || userProfile?.membershipNumber };
  }), ...bookingTrips];

  const filteredTrips = combinedItems.filter(t => {
    if (tripFilter === 'all') return true;
    if (tripFilter === 'requested') return t.status === 'Requested';
    if (tripFilter === 'pending_price') return !t.amount || t.amount <= 0;
    if (tripFilter === 'unpaid') return t.paymentStatus === 'Unpaid';
    if (tripFilter === 'paid') return t.paymentStatus === 'Paid';
    return true;
  });

  const totalCommission = combinedItems.reduce((acc, t) => acc + (t.commission || 0), 0);
  const totalAmount = combinedItems.reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gold/5 p-6 rounded-3xl border border-gold/10">
          <p className="text-xs font-black text-gold uppercase mb-1">{lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
          <h4 className="text-2xl font-black text-dark">{totalAmount.toFixed(2)} BHD</h4>
        </div>
        {isSuperAdmin && (
          <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
            <p className="text-xs font-black text-green-600 uppercase mb-1">{lang === 'ar' ? 'إجمالي العمولات' : 'Total Commissions'}</p>
            <h4 className="text-2xl font-black text-dark">{totalCommission.toFixed(2)} BHD</h4>
          </div>
        )}
        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
          <p className="text-xs font-black text-blue-600 uppercase mb-1">{lang === 'ar' ? 'إجمالي الرحلات' : 'Total Trips'}</p>
          <h4 className="text-2xl font-black text-dark">{trips.length}</h4>
        </div>
        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
          <p className="text-xs font-black text-orange-600 uppercase mb-1">{lang === 'ar' ? 'بانتظار التحصيل' : 'Pending Collection'}</p>
          <h4 className="text-2xl font-black text-dark">
            {trips.filter(t => t.paymentStatus !== 'Paid').reduce((acc, t) => acc + (t.amount || 0), 0).toFixed(2)} BHD
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {['all', 'requested', 'pending_price', 'unpaid', 'paid'].map((f) => (
              <button
                key={f}
                onClick={() => setTripFilter(f as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  tripFilter === f ? "bg-dark text-white shadow-lg" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                )}
              >
                {f === 'all' && (lang === 'ar' ? 'الكل' : 'All')}
                {f === 'requested' && (lang === 'ar' ? 'طلبات جديدة' : 'New Requests')}
                {f === 'pending_price' && (lang === 'ar' ? 'بانتظار السعر' : 'Pending Price')}
                {f === 'unpaid' && (lang === 'ar' ? 'غير مدفوع' : 'Unpaid')}
                {f === 'paid' && (lang === 'ar' ? 'مدفوع' : 'Paid')}
              </button>
            ))}
          </div>

          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-xs font-black"
            >
              <span>{lang === 'ar' ? `تم تحديد ${selectedIds.length}` : `Selected ${selectedIds.length}`}</span>
              <button 
                onClick={async () => {
                  if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الرحلات؟' : 'Are you sure you want to delete these trips?')) {
                    alert(lang === 'ar' ? 'هذه الميزة ستتوفر قريباً' : 'Bulk delete coming soon');
                  }
                }}
                className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors"
                title={lang === 'ar' ? "حذف المحدد" : "Delete Selected"}
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </div>
        
        <button 
          onClick={() => setIsAdminScheduleView(!isAdminScheduleView)}
          className="bg-gold/10 text-gold px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-gold/20 transition-all"
        >
          <Calendar className="w-4 h-4" />
          {isAdminScheduleView ? (lang === 'ar' ? 'عرض الجدول المحاسبي' : 'Show Accounting Table') : (lang === 'ar' ? 'عرض جدول المواعيد' : 'Show Schedule View')}
        </button>
      </div>

      {!isAdminScheduleView ? (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead>
                <tr className={cn("bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest", lang === 'ar' ? "text-right" : "text-left")}>
                  <th className="p-4 border-b w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
                      checked={selectedIds.length === filteredTrips.length && filteredTrips.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredTrips.map(t => t.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-4 border-b">{lang === 'ar' ? 'رقم الحجز / التاريخ' : 'Booking ID / Date'}</th>
                  <th className="p-4 border-b">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th className="p-4 border-b">{lang === 'ar' ? 'المسار' : 'Route'}</th>
                  <th className="p-4 border-b">{lang === 'ar' ? 'السيارة' : 'Vehicle'}</th>
                  <th className="p-4 border-b">{lang === 'ar' ? 'السائق' : 'Driver'}</th>
                  <th className="p-4 border-b text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="p-4 border-b text-center">{lang === 'ar' ? 'الدفع' : 'Payment'}</th>
                  <th className="p-4 border-b text-center">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                  {isSuperAdmin && <th className="p-4 border-b text-center">{lang === 'ar' ? 'العمولة' : 'Commission'}</th>}
                  <th className="p-4 border-b text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map(trip => (
                  <tr key={trip.id} className={cn(
                    "border-b border-gray-50 hover:bg-gray-50/50 transition-all font-bold text-xs",
                    selectedIds.includes(trip.id) && "bg-gold/5"
                  )}>
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
                        checked={selectedIds.includes(trip.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, trip.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== trip.id));
                          }
                        }}
                      />
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="text-[10px] text-gold font-black mb-0.5">{trip.bookingNumber || trip.id.slice(-6).toUpperCase()}</div>
                      <div>{trip.date}</div>
                      <div className="text-[10px] text-gray-400">{trip.time}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {trip.isRealtime && <Zap className="w-3 h-3 text-orange-500 fill-orange-500" title="طلب فوري" />}
                        <div className="text-dark">
                          {trip.customerName}
                          {trip.membershipNumber && (
                            <span className="mr-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-md font-bold">
                              #{trip.membershipNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400">{trip.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="line-clamp-1">{trip.direction}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px]">
                        {trip.carType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-dark font-black">{trip.driverName || '---'}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[9px]",
                        trip.status === 'Confirmed' ? "bg-green-100 text-green-600" :
                        trip.status === 'Requested' ? "bg-orange-100 text-orange-600" :
                        trip.status === 'Completed' ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
                      )}>
                        {trip.status === 'Requested' ? (lang === 'ar' ? 'طلب جديد' : 'New Request') : 
                         trip.status === 'Confirmed' ? (lang === 'ar' ? 'مؤكد' : 'Confirmed') :
                         trip.status === 'Completed' ? (lang === 'ar' ? 'مكتمل' : 'Completed') : (lang === 'ar' ? 'ملغي' : 'Cancelled')}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[9px]",
                        trip.paymentStatus === 'Paid' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                      )}>
                        {trip.paymentStatus === 'Paid' ? (lang === 'ar' ? 'مدفوع' : 'Paid') : (lang === 'ar' ? 'غير مدفوع' : 'Unpaid')}
                      </span>
                    </td>
                    <td className="p-4 text-center text-dark">{trip.amount}</td>
                    {isSuperAdmin && <td className="p-4 text-center text-green-600 font-black">{(trip as any).commission?.toFixed(2)}</td>}
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {trip.status === 'Requested' && (
                          <button 
                            onClick={() => updateDoc(doc(db, 'trips', trip.id), { status: 'Confirmed' })}
                            className="p-2 hover:bg-green-50 text-green-600 rounded-xl transition-colors"
                            title="قبول الرحلة"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            const message = `*تفاصيل رحلة جديدة* 🚖\n\n` +
                              `👤 *العميل:* ${trip.customerName}\n` +
                              `📞 *رقم العميل:* ${trip.phone}\n` +
                              `📅 *التاريخ:* ${trip.date}\n` +
                              `⏰ *الوقت:* ${trip.time}\n` +
                              `📍 *الاستلام:* ${trip.pickup}\n` +
                              `🏁 *الوجهة:* ${trip.dropoff}\n` +
                              `🚗 *نوع السيارة:* ${trip.carType}\n` +
                              `💰 *المبلغ:* ${trip.amount || 'يحدد لاحقاً'} BHD`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"
                          title="إرسال للسائق"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingTrip(trip);
                            setTripFormData(trip);
                            setIsTripFormOpen(true);
                          }}
                          className="p-2 hover:bg-gray-50 text-gray-600 rounded-xl transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setTripToDelete(trip)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Schedule View Implementation */}
          {/* Grouped by date */}
          {(Object.entries(
            filteredTrips.reduce((acc, t) => {
              if (!acc[t.date]) acc[t.date] = [];
              acc[t.date].push(t);
              return acc;
            }, {} as Record<string, any[]>)
          ) as [string, any[]][]).sort().map(([date, dateTrips]) => (
            <div key={date} className="space-y-4">
              <h5 className="font-black text-dark flex items-center gap-2">
                <div className="w-2 h-8 bg-gold rounded-full" />
                {date === new Date().toISOString().split('T')[0] ? (lang === 'ar' ? 'اليوم' : 'Today') : date}
              </h5>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {dateTrips.map(trip => (
                  <div key={trip.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gold opacity-30" />
                    <div className="flex justify-between items-start mb-2">
                       <div className="text-[9px] font-black text-gold uppercase tracking-tighter">
                         #{trip.bookingNumber || trip.id.slice(-6).toUpperCase()}
                       </div>
                       <span className={cn(
                         "px-2 py-1 rounded-lg text-[9px] font-black uppercase text-white shadow-sm",
                         trip.status === 'Confirmed' ? "bg-green-500" :
                         trip.status === 'Requested' ? "bg-orange-500" : "bg-gray-400"
                       )}>
                         {trip.status}
                       </span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-dark font-black text-xs">
                        {trip.time}
                      </div>
                    </div>
                    <h6 className="font-black text-dark mb-1 line-clamp-1">{trip.customerName}</h6>
                    <p className="text-[10px] text-gray-400 font-bold mb-4 line-clamp-1">{trip.direction}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <span className="text-gold font-black">{trip.amount} BHD</span>
                      <button 
                         onClick={() => {
                           setEditingTrip(trip);
                           setTripFormData(trip);
                           setIsTripFormOpen(true);
                         }}
                         className="p-2 hover:bg-gray-50 rounded-xl transition-all"
                      >
                         <Settings className="w-4 h-4 text-gray-300" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
