
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Trip } from '../../types';

interface TripFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingTrip: Trip | null;
  tripFormData: any;
  setTripFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSuperAdmin: boolean;
}

export const TripForm = ({
  isOpen,
  onClose,
  editingTrip,
  tripFormData,
  setTripFormData,
  onSubmit,
  isSuperAdmin
}: TripFormProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            dir="rtl"
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-2xl font-black text-dark">
                  {editingTrip ? 'تعديل بيانات الرحلة' : 'إضافة رحلة جديدة'}
                </h3>
                <p className="text-gray-500 text-sm font-bold">أدخل تفاصيل الرحلة والبيانات المالية</p>
              </div>
              <button 
                onClick={onClose}
                className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-dark transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-8 overflow-y-auto space-y-8">
              <div className="grid md:grid-cols-5 gap-6">
                <div className="space-y-2 flex flex-col justify-end">
                  <label className="text-xs font-black text-gray-400 uppercase">رقم الحجز</label>
                  <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 font-mono font-bold text-gold text-center">
                    {tripFormData.bookingNumber || (editingTrip ? editingTrip.id.slice(-6).toUpperCase() : 'سيتولد تلقائياً')}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">نوع الحجز</label>
                  <select 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.bookingType}
                    onChange={e => setTripFormData({ ...tripFormData, bookingType: e.target.value as any })}
                  >
                    <option value="transfer">توصيل</option>
                    <option value="hourly">بالساعة</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">الاسم الأول</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.firstName}
                    onChange={e => setTripFormData({ ...tripFormData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">الاسم الأخير</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.lastName}
                    onChange={e => setTripFormData({ ...tripFormData, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.email}
                    onChange={e => setTripFormData({ ...tripFormData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">اسم العميل</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.customerName}
                    onChange={e => setTripFormData({ ...tripFormData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">رقم الهاتف</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.phone}
                    onChange={e => setTripFormData({ ...tripFormData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">رقم العميل (UID)</label>
                  <input 
                    type="text" 
                    placeholder="لربط الرحلة بحساب العميل"
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.userId || ''}
                    onChange={e => setTripFormData({ ...tripFormData, userId: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">الركاب</label>
                  <input 
                    type="number" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.passengers}
                    onChange={e => setTripFormData({ ...tripFormData, passengers: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">الحقائب</label>
                  <input 
                    type="number" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.bags}
                    onChange={e => setTripFormData({ ...tripFormData, bags: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">نوع السيارة</label>
                  <select 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.carType}
                    onChange={e => setTripFormData({ ...tripFormData, carType: e.target.value as any })}
                  >
                    <option value="Standard">Standard</option>
                    <option value="VIP">VIP</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">المسافة / الساعات</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.bookingType === 'hourly' ? tripFormData.hours : (tripFormData.distance || 0)}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      if (tripFormData.bookingType === 'hourly') {
                        setTripFormData({ ...tripFormData, hours: Math.floor(val) });
                      } else {
                        setTripFormData({ ...tripFormData, distance: val });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">مسار الرحلة</label>
                  <input 
                    type="text" 
                    placeholder="مثال: المطار ← الفندق"
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.direction}
                    onChange={e => setTripFormData({ ...tripFormData, direction: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">نقطة الاستلام</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.pickup}
                    onChange={e => setTripFormData({ ...tripFormData, pickup: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">نقطة التوصيل</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.dropoff}
                    onChange={e => setTripFormData({ ...tripFormData, dropoff: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">التاريخ</label>
                  <input 
                    type="date" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.date}
                    onChange={e => setTripFormData({ ...tripFormData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">الوقت</label>
                  <input 
                    type="time" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.time}
                    onChange={e => setTripFormData({ ...tripFormData, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">مبلغ الرحلة (BHD)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold text-gold"
                    value={tripFormData.amount}
                    onChange={e => setTripFormData({ ...tripFormData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">اسم السائق</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.driverName}
                    onChange={e => setTripFormData({ ...tripFormData, driverName: e.target.value })}
                  />
                </div>
                {isSuperAdmin && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">تكلفة السائق (BHD)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-white border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.driverCost}
                      onChange={e => {
                        const cost = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setTripFormData({ ...tripFormData, driverCost: cost, profit: (tripFormData.amount || 0) - cost });
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">حالة الرحلة</label>
                  <select 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.status}
                    onChange={e => setTripFormData({ ...tripFormData, status: e.target.value as any })}
                  >
                    <option value="Requested">طلب جديد</option>
                    <option value="Confirmed">مؤكدة</option>
                    <option value="Completed">مكتملة</option>
                    <option value="Cancelled">ملغاة</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">حالة الدفع</label>
                  <select 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                    value={tripFormData.paymentStatus}
                    onChange={e => setTripFormData({ ...tripFormData, paymentStatus: e.target.value as any })}
                  >
                    <option value="Pending">معلق</option>
                    <option value="Paid">مدفوع</option>
                    <option value="Unpaid">غير مدفوع</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">ملاحظات / طلبات خاصة</label>
                  <textarea 
                    rows={1}
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold resize-none"
                    value={tripFormData.notes}
                    onChange={e => setTripFormData({ ...tripFormData, notes: e.target.value })}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-gold text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-gold/20 hover:bg-dark hover:shadow-dark/10 transition-all transform hover:-translate-y-1"
              >
                {editingTrip ? 'تحديث بيانات الرحلة' : 'تأكيد وإضافة الرحلة'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
