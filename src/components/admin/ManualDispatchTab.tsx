
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, User, MapPin, Calendar, Clock, 
  CheckCircle2, AlertCircle, ChevronDown, 
  Navigation, UserCheck, ShieldCheck, Zap
} from 'lucide-react';
import { Booking, Driver, UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

interface ManualDispatchTabProps {
  bookings: Booking[];
  allDrivers: Driver[];
  lang: 'ar' | 'en';
}

export const ManualDispatchTab = ({ bookings, allDrivers, lang }: ManualDispatchTabProps) => {
  const [selectedDriverForBooking, setSelectedDriverForBooking] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  const pendingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'searching_driver');
  const assignedBookings = bookings.filter(b => b.status === 'assigned' || b.status === 'accepted');

  const handleAssignDriver = async (bookingId: string) => {
    const driverId = selectedDriverForBooking[bookingId];
    if (!driverId) {
      alert(lang === 'ar' ? 'يرجى اختيار سائق أولاً' : 'Please select a driver first');
      return;
    }

    setIsUpdating(prev => ({ ...prev, [bookingId]: true }));
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        assignedDriverId: driverId,
        status: 'assigned',
        assignedAt: serverTimestamp()
      });
      alert(lang === 'ar' ? "تم إرسال الطلب للسائق المختار بنجاح!" : "Order sent to selected driver successfully!");
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? "حدث خطأ أثناء التحديث" : "Error during update");
    } finally {
      setIsUpdating(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-2xl font-black text-dark">{lang === 'ar' ? 'توزيع الطلبات اليدوي' : 'Manual Dispatch'}</h3>
          <p className="text-sm text-gray-400 font-bold">{lang === 'ar' ? 'إدارة وتوجيه الرحلات المعلقة إلى السائقين يدوياً' : 'Manage and route pending trips to drivers manually'}</p>
        </div>
        <div className="bg-gold/10 text-gold px-6 py-3 rounded-2xl flex items-center gap-2">
          <Zap className="w-5 h-5 fill-gold" />
          <span className="font-black text-xs uppercase tracking-widest">{pendingBookings.length} {lang === 'ar' ? 'طلبات قيد الانتظار' : 'Pending Requests'}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pending Orders Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-dark font-black">
            <div className="w-2 h-6 bg-orange-500 rounded-full" />
            {lang === 'ar' ? 'طلبات جديدة بانتظار التوزيع' : 'New Requests Waiting'}
          </div>
          
          {pendingBookings.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold">{lang === 'ar' ? 'لا توجد طلبات معلقة حالياً' : 'No pending requests at the moment'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map(booking => (
                <motion.div 
                  layout
                  key={booking.id}
                  className="bg-white p-6 rounded-[2rem] border-2 border-orange-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-black text-dark">{booking.customerName}</h4>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{booking.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-dark">{booking.price} <span className="text-[10px] text-gray-400">BHD</span></div>
                      <div className="text-[10px] font-black text-orange-500 uppercase">PENDING APPROVAL</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Pick up</div>
                      <div className="text-xs font-bold text-dark flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold" />
                        <span className="truncate">{booking.pickupAddress}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Drop off</div>
                      <div className="text-xs font-bold text-dark flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-dark" />
                        <span className="truncate">{booking.dropoffAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 pt-4 border-t border-gray-50">
                    <div className="relative">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block flex justify-between">
                        <span>{lang === 'ar' ? 'اختر السائق المتاح' : 'Select Available Driver'}</span>
                        <span className="text-orange-500">{lang === 'ar' ? 'يجب اختيار سائق' : 'Required'}</span>
                      </label>
                      <select 
                        className="w-full bg-gray-50 border-2 border-transparent rounded-xl py-4 px-4 text-xs font-black appearance-none cursor-pointer focus:ring-4 focus:ring-gold/10 focus:bg-white focus:border-gold/20 transition-all"
                        value={selectedDriverForBooking[booking.id] || ''}
                        onChange={(e) => setSelectedDriverForBooking(prev => ({ ...prev, [booking.id]: e.target.value }))}
                      >
                        <option value="">{lang === 'ar' ? '--- اختر من قائمة السائقين النشطين ---' : '--- Choose Active Driver ---'}</option>
                        {allDrivers
                          .filter(d => d.adminStatus === 'active' && d.registrationStatus === 'approved')
                          .sort((a, b) => {
                            if (a.status === 'online' && b.status !== 'online') return -1;
                            if (a.status !== 'online' && b.status === 'online') return 1;
                            return 0;
                          })
                          .map(driver => (
                            <option key={driver.id} value={driver.uid || driver.id} className="font-bold py-2">
                              {driver.status === 'online' ? '🟢' : driver.status === 'busy' ? '🟠' : '⚪'} 
                              {driver.name} | {driver.carType} | {lang === 'ar' ? (driver.status === 'online' ? 'متاح الآن' : driver.status === 'busy' ? 'في رحلة' : 'غير متصل') : driver.status}
                            </option>
                          ))
                        }
                      </select>
                      <div className="absolute right-4 bottom-4 pointer-events-none text-gray-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>

                    <button 
                      onClick={() => handleAssignDriver(booking.id)}
                      disabled={!selectedDriverForBooking[booking.id] || isUpdating[booking.id]}
                      className={cn(
                        "w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2",
                        !selectedDriverForBooking[booking.id] || isUpdating[booking.id]
                        ? "bg-gray-100 text-gray-400"
                        : "bg-orange-500 text-white shadow-orange-500/20 hover:scale-[1.02]"
                      )}
                    >
                      {isUpdating[booking.id] ? (
                        <>
                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           {lang === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4" />
                          {lang === 'ar' ? 'إرسال لـلسائق يـدوياً' : 'Dispatch to Driver Manually'}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Orders Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-dark font-black">
            <div className="w-2 h-6 bg-green-500 rounded-full" />
            {lang === 'ar' ? 'رحلات مخصصة وتعمل حالياً' : 'Assigned & Active Trips'}
          </div>

          <div className="space-y-4">
            {assignedBookings.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center opacity-50">
                 <Truck className="w-8 h-8 text-gray-200 mb-2" />
                 <p className="text-xs font-bold text-gray-400">No active dispatches</p>
              </div>
            ) : (
              assignedBookings.map(booking => {
                const driver = allDrivers.find(d => d.uid === booking.assignedDriverId || d.id === booking.assignedDriverId);
                return (
                  <div key={booking.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black",
                        booking.status === 'accepted' ? "bg-green-50 text-green-500" : "bg-blue-50 text-blue-500"
                      )}>
                        {booking.status === 'accepted' ? <ShieldCheck className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                      </div>
                      <div>
                         <div className="text-xs font-black text-dark mb-0.5">{booking.customerName}</div>
                         <div className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1">
                           <Truck className="w-2.5 h-2.5" />
                           {driver?.name || 'Unknown Driver'}
                         </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className={cn(
                         "px-2 py-1 rounded-lg text-[8px] font-black uppercase mb-1 inline-block",
                         booking.status === 'accepted' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                       )}>
                         {booking.status}
                       </div>
                       <div className="text-[10px] font-bold text-gray-400">
                         {booking.pickupAddress.split(',')[0]} → {booking.dropoffAddress.split(',')[0]}
                       </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
