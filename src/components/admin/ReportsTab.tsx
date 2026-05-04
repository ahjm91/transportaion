import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, Download, RefreshCw, Star, 
  TrendingUp, TrendingDown, DollarSign, Package,
  CheckCircle2, XCircle, Clock, Loader2, FileText, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getTodayRange, getWeekRange, getMonthRange, 
  generateReport, fetchRecentReports 
} from '../../services/reportService';
import { Report } from '../../types';
import { cn } from '../../lib/utils';
import { auth } from '../../firebase';

interface ReportsTabProps {
  lang: 'ar' | 'en';
}

export const ReportsTab = ({ lang }: ReportsTabProps) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRecentReports();
      setReports(data);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async (type: 'daily' | 'weekly' | 'monthly') => {
    if (!auth.currentUser) return;
    
    setIsGenerating(type);
    try {
      let range;
      if (type === 'daily') range = getTodayRange();
      else if (type === 'weekly') range = getWeekRange();
      else range = getMonthRange();

      await generateReport(range.start, range.end, type, auth.currentUser.uid);
      await loadReports();
      alert(t("تم إنشاء التقرير بنجاح", "Report generated successfully"));
    } catch (error: any) {
      alert(error.message || t("حدث خطأ أثناء إنشاء التقرير", "Error generating report"));
    } finally {
      setIsGenerating(null);
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'weekly': return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'monthly': return <BarChart3 className="w-4 h-4 text-gold" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Generation */}
      <div className="flex flex-wrap justify-between items-center gap-6">
        <div>
          <h4 className="text-2xl font-black text-dark flex items-center gap-3">
            <BarChart3 className="text-gold w-8 h-8" />
            {t("نظام التقارير والإغلاق", "Reports & Closure System")}
          </h4>
          <p className="text-gray-400 text-sm font-bold mt-1">
            {t("إدارة الحسابات وتحليل الأداء للفترات الزمنية المختلفة", "Manage accounting and performance analysis for different periods")}
          </p>
        </div>

        <div className="flex gap-3">
          {[
            { type: 'daily', label: t("إغلاق يومي", "Daily Closure"), color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
            { type: 'weekly', label: t("إغلاق أسبوعي", "Weekly Closure"), color: "bg-purple-50 text-purple-600 hover:bg-purple-100" },
            { type: 'monthly', label: t("إغلاق شهري", "Monthly Closure"), color: "bg-gold/10 text-gold hover:bg-gold/20" },
          ].map((btn) => (
            <button
              key={btn.type}
              onClick={() => handleGenerate(btn.type as any)}
              disabled={!!isGenerating}
              className={cn(
                "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                btn.color,
                isGenerating === btn.type && "opacity-50 cursor-not-allowed"
              )}
            >
              {isGenerating === btn.type ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h5 className="text-lg font-black text-dark">{t("التقارير الأخيرة", "Recent Reports")}</h5>
          <button 
            onClick={loadReports}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <RefreshCw className={cn("w-5 h-5 text-gray-400", isLoading && "animate-spin")} />
          </button>
        </div>

        {isLoading && reports.length === 0 ? (
          <div className="p-20 text-center">
            <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{t("جاري تحميل البيانات...", "Loading report data...")}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-20 text-center">
            <FileText className="w-16 h-16 text-gray-100 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">{t("لا توجد تقارير منشأة حالياً", "No reports generated yet")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="p-6">{t("النوع والتاريخ", "Type & Date")}</th>
                  <th className="p-6 text-center">{t("الطلبات", "Orders")}</th>
                  <th className="p-6 text-center">{t("الدخل", "Income")}</th>
                  <th className="p-6 text-center">{t("المصاريف", "Expenses")}</th>
                  <th className="p-6 text-center">{t("الصافي", "Net Profit")}</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-right">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                          {getReportTypeIcon(report.type)}
                        </div>
                        <div>
                          <div className="font-black text-dark text-sm uppercase">
                            {lang === 'ar' 
                              ? { daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري' }[report.type]
                              : report.type 
                            }
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold">
                            {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="font-black text-dark">{report.totalOrders}</div>
                      <div className="text-[8px] text-green-500 font-black uppercase">{report.completedOrders} {t("ناجحة", "Done")}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="font-black text-green-600">{(report.totalIncome || 0).toFixed(2)}</div>
                      <div className="text-[8px] text-gray-400 font-bold uppercase">BHD</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="font-black text-red-500">{(report.totalExpenses || 0).toFixed(2)}</div>
                      <div className="text-[8px] text-gray-400 font-bold uppercase">BHD</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-xs",
                        report.netProfit >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}>
                        {report.netProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {(report.netProfit || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="p-6">
                      <button className="p-2 hover:bg-gold/10 hover:text-gold text-gray-400 rounded-lg transition-all">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
