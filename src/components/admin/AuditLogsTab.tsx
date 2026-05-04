
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { FileText, Clock, User, Tag, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AuditLog {
  id: string;
  action: string;
  entityId: string;
  entityType: string;
  from?: any;
  to?: any;
  by: string;
  byEmail?: string;
  timestamp: any;
  metadata?: any;
}

export const AuditLogsTab = ({ lang }: { lang: 'ar' | 'en' }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString(lang === 'ar' ? 'ar-BH' : 'en-US');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-black text-dark flex items-center gap-2">
          <FileText className="text-gold w-6 h-6" />
          {lang === 'ar' ? 'سجلات النظام (Audit Logs)' : 'System Audit Logs'}
        </h4>
        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
          {lang === 'ar' ? 'آخر 100 عملية' : 'Last 100 actions'}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className={cn("bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest", lang === 'ar' ? "text-right" : "text-left")}>
                <th className="p-5 border-b">{lang === 'ar' ? 'الحدث' : 'Action'}</th>
                <th className="p-5 border-b">{lang === 'ar' ? 'بواسطة' : 'By'}</th>
                <th className="p-5 border-b">{lang === 'ar' ? 'التفاصيل' : 'Details'}</th>
                <th className="p-5 border-b">{lang === 'ar' ? 'الوقت' : 'Time'}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gold/10 rounded-xl flex items-center justify-center">
                        <Tag className="w-4 h-4 text-gold" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-dark">{log.action}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{log.entityType} #{log.entityId.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <div className="text-[10px] font-bold text-dark">{log.byEmail || log.by}</div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                      {log.from !== undefined && (
                        <span className="bg-red-50 text-red-500 px-2 py-1 rounded-lg line-through">{String(log.from)}</span>
                      )}
                      {log.from !== undefined && <ArrowRight className="w-3 h-3" />}
                      {log.to !== undefined && (
                        <span className="bg-green-50 text-green-500 px-2 py-1 rounded-lg font-black">{String(log.to)}</span>
                      )}
                      {log.metadata && !log.from && !log.to && (
                        <pre className="text-[8px] bg-gray-50 p-2 rounded-lg max-w-[200px] overflow-hidden truncate">
                          {JSON.stringify(log.metadata)}
                        </pre>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(log.timestamp)}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-gray-400 font-bold">
                    {lang === 'ar' ? 'لا يوجد سجلات حتى الآن' : 'No logs found yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
