
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { PayoutRequest } from '../../types';
import { Check, X, Clock, Wallet, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const PayoutsTab = ({ lang }: { lang: 'ar' | 'en' }) => {
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
      
      if (newStatus === 'completed') {
        const driverProfileRef = doc(db, 'users', req.driverId);
        const driverActiveRef = doc(db, 'drivers', req.driverId);
        
        const update = {
          "wallet.pendingPayouts": increment(-req.amount),
          "wallet.lastUpdate": serverTimestamp()
        };

        await updateDoc(driverProfileRef, update);
        const activeSnap = await getDoc(driverActiveRef);
        if (activeSnap.exists()) {
          await updateDoc(driverActiveRef, update);
        }
      }
      
      alert(newStatus === 'completed' 
        ? (lang === 'ar' ? 'تم تأكيد التحويل بنجاح' : 'Bank transfer confirmed successfully') 
        : (lang === 'ar' ? 'تم رفض الطلب' : 'Request rejected'));
    } catch (err) {
      console.error('Error updating payout:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <h3 className="text-2xl font-black text-dark">{lang === 'ar' ? 'طلبات سحب الرصيد' : 'Payout Requests'}</h3>
          <p className="text-sm text-gray-500 mt-1">{lang === 'ar' ? 'إدارة مستحقات السائقين وتحويلاتهم البنكية' : 'Manage driver payouts and bank transfers'}</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-gold/10 rounded-2xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">{lang === 'ar' ? 'بانتظار المراجعة' : 'Pending Review'}</p>
            <p className="text-lg font-black text-dark">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <table className={cn("w-full", lang === 'ar' ? "text-right" : "text-left")}>
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="uppercase tracking-widest text-[10px] font-black text-gray-400">
              <th className="p-6">{lang === 'ar' ? 'السائق' : 'Driver'}</th>
              <th className="p-6 text-center">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
              <th className="p-6">{lang === 'ar' ? 'تفاصيل البنك' : 'Bank Details'}</th>
              <th className="p-6 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="p-6 text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
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
                      <p className="text-[10px] text-gray-400">{req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleString(lang === 'ar' ? 'ar-BH' : 'en-US') : '---'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-center font-black text-dark text-lg">{req.amount} BHD</td>
                <td className="p-6">
                  <p className="text-xs text-gray-500 whitespace-pre-wrap max-w-xs">{req.bankDetails || (lang === 'ar' ? 'لا يوجد تفاصيل' : 'No details')}</p>
                </td>
                <td className="p-6 text-center">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    req.status === 'completed' ? "bg-green-100 text-green-600" : (req.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")
                  )}>
                    {req.status === 'pending' ? (lang === 'ar' ? 'بانتظار المراجعة' : 'Pending') : 
                     (req.status === 'completed' ? (lang === 'ar' ? 'تم اكتمال التحويل' : 'Completed') : 
                     (lang === 'ar' ? 'طلب مرفوض' : 'Rejected'))}
                  </span>
                </td>
                <td className="p-6">
                  {req.status === 'pending' && (
                    <div className="flex justify-center gap-2">
                       <button 
                         onClick={() => handleStatusUpdate(req, 'completed')}
                         className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
                         title={lang === 'ar' ? "تأكيد التحويل" : "Confirm Payout"}
                       >
                         <Check className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleStatusUpdate(req, 'rejected')}
                         className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                         title={lang === 'ar' ? "رفض الطلب" : "Reject Request"}
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
                <td colSpan={5} className="p-12 text-center text-gray-400 font-bold">{lang === 'ar' ? 'لا توجد طلبات سحب حالياً' : 'No payout requests at the moment'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
