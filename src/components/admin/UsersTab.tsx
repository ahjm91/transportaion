
import React from 'react';
import { Users, Loader2, Plus, X, Search, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { doc } from 'firebase/firestore';
import { db } from '../../firebase';

interface UsersTabProps {
  users: UserProfile[];
  isUsersLoading: boolean;
  safeUpdateDoc: (ref: any, data: any) => Promise<void>;
  lang: 'ar' | 'en';
}

export const UsersTab = ({ users, isUsersLoading, safeUpdateDoc, lang }: UsersTabProps) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h4 className="text-xl font-black text-dark flex items-center gap-2">
          <Users className="text-gold w-6 h-6" />
          إدارة الأعضاء والولاء
        </h4>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="بحث في الأعضاء..."
              className="bg-gray-50 border-gray-100 rounded-xl py-2 pr-10 pl-4 text-xs font-bold focus:ring-2 focus:ring-gold/20 transition-all w-64"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
            الإجمالي: {users.length}
          </div>
        </div>
      </div>

      {isUsersLoading ? (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
          <Loader2 className="w-12 h-12 text-gold animate-spin" />
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">جاري تحميل قائمة الأعضاء...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="p-5 border-b">المستخدم</th>
                  <th className="p-5 border-b">العضوية</th>
                  <th className="p-5 border-b">التفعيل</th>
                  <th className="p-5 border-b">الكاش باك (BHD)</th>
                  <th className="p-5 border-b">الجوائز والخصومات</th>
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
                          <div className="text-dark font-black">{u.name}</div>
                          <div className="text-[10px] text-gray-300 font-mono mt-0.5">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <select 
                        className="bg-gray-100 border-none rounded-xl text-[10px] font-black p-2 focus:ring-2 focus:ring-gold/20"
                        value={u.membershipStatus}
                        onChange={e => safeUpdateDoc(doc(db, 'users', u.uid), { membershipStatus: e.target.value })}
                      >
                        <option value="Bronze">🥉 Bronze</option>
                        <option value="Silver">🥈 Silver</option>
                        <option value="Gold">🥇 Gold</option>
                        <option value="VIP">💎 VIP Member</option>
                      </select>
                    </td>
                    <td className="p-5">
                      <button 
                        onClick={() => safeUpdateDoc(doc(db, 'users', u.uid), { 
                          isVerified: !u.isVerified, 
                          verificationMessage: !u.isVerified ? 'تم تفعيل حسابك بنجاح! استمتع برحلاتك.' : 'جاري مراجعة طلب اشتراكك.' 
                        })}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black text-white flex items-center gap-2 transition-all",
                          u.isVerified ? "bg-green-500 shadow-lg shadow-green-500/20" : "bg-orange-500 shadow-lg shadow-orange-500/20"
                        )}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {u.isVerified ? 'عضو مفعل' : 'بانتظار التفعيل'}
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
                            const prize = prompt('أدخل اسم الجائزة الجديدة (مثال: رحلة مجانية للمطار):');
                            if (prize) {
                              const current = u.availableRewards || [];
                              safeUpdateDoc(doc(db, 'users', u.uid), { availableRewards: [...current, prize] });
                            }
                          }}
                          className="bg-gold/10 text-gold hover:bg-gold/20 p-2 rounded-xl transition-all"
                          title="إضافة جائزة"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {u.availableRewards && u.availableRewards.map((reward, rid) => (
                          <div key={rid} className="bg-dark text-white rounded-xl py-1 px-3 flex items-center gap-2 text-[10px] font-bold group animate-in zoom-in-95">
                            {reward}
                            <X 
                              className="w-3 h-3 cursor-pointer opacity-40 hover:opacity-100" 
                              onClick={() => {
                                if (confirm('حذف هذه الجائزة من حساب العميل؟')) {
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
    </div>
  );
};
