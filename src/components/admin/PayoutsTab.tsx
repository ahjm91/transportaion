
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { PayoutRequest } from '../../types';
import { Check, X, Clock, Wallet, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const PayoutsTab = () => {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'payout_requests'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PayoutRequest));
      setRequests(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsub();
  }, []);

  const handleStatusUpdate = async (req: PayoutRequest, newStatus: 'completed' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'payout_requests', req.id), { status: newStatus });
      
      // If completed, double check wallet and maybe deduct if not already done?
      // Actually per driver balance logic, deduction should happen on completion of request.
      if (newStatus === 'completed') {
        const driverRef = doc(db, 'drivers', req.driverId);
        await updateDoc(driverRef, { wallet: increment(-req.amount) });
      }
      
      alert(newStatus === 'completed' ? 'تم تأكيد التحويل بنجاح' : 'تم رفض الطلب');
    } catch (err) {
      console.error('Error updating payout:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black text-dark">طلبات سحب الرصيد</h3>
          <p className="text-sm text-gray-500 mt-1">إدارة مستحقات السائقين وتحويلاتهم البنكية</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-gold/10 rounded-2xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">بانتظار المراجعة</p>
            <p className="text-lg font-black text-dark">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">السائق</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">المبلغ</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">تفاصيل البنك</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">الحالة</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-dark rounded-xl flex items-center justify-center font-black text-gold text-xs">
                      {req.driverName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-dark">{req.driverName}</p>
                      <p className="text-[10px] text-gray-400">{req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleString('ar-BH') : '---'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-center font-black text-dark text-lg">{req.amount} BHD</td>
                <td className="p-6">
                  <p className="text-xs text-gray-500 whitespace-pre-wrap max-w-xs">{req.bankDetails || 'لا يوجد تفاصيل'}</p>
                </td>
                <td className="p-6 text-center">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    req.status === 'completed' ? "bg-green-100 text-green-600" : (req.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")
                  )}>
                    {req.status === 'pending' ? 'بانتظار المراجعة' : (req.status === 'completed' ? 'تم اكتمال التحويل' : 'طلب مرفوض')}
                  </span>
                </td>
                <td className="p-6">
                  {req.status === 'pending' && (
                    <div className="flex justify-center gap-2">
                       <button 
                         onClick={() => handleStatusUpdate(req, 'completed')}
                         className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
                         title="تأكيد التحويل"
                       >
                         <Check className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleStatusUpdate(req, 'rejected')}
                         className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                         title="رفض الطلب"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  )}
                  {req.status === 'completed' && (
                    <div className="flex justify-center text-green-500"><Check className="w-5 h-5" /></div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-400 font-bold">لا توجد طلبات سحب حالياً</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
