
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Car, CheckCircle, Clock, 
  ArrowUpRight, ArrowDownRight, Activity, DollarSign
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { Trip, Booking, Driver, UserProfile } from '../../types';
import { cn } from '../../lib/utils';

interface OverviewTabProps {
  trips: Trip[];
  bookings: Booking[];
  allDrivers: Driver[];
  users: UserProfile[];
  lang: 'ar' | 'en';
}

export const OverviewTab = ({ trips, bookings, allDrivers, users, lang }: OverviewTabProps) => {
  // Memoized stats calculation for speed
  const stats = useMemo(() => {
    const totalRevenue = trips.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const activeBookings = bookings.filter(b => !['completed', 'cancelled', 'no_driver_found'].includes(b.status)).length;
    const onlineDrivers = allDrivers.filter(d => d.status === 'online').length;
    
    return {
      revenue: totalRevenue,
      completed: completedBookings,
      active: activeBookings,
      online: onlineDrivers,
      totalUsers: users.length
    };
  }, [trips, bookings, allDrivers, users]);

  // Mock data for charts - in real app, these would be derived from actual historical data
  const chartData = useMemo(() => [
    { name: lang === 'ar' ? 'السبت' : 'Sat', trips: 12, revenue: 400 },
    { name: lang === 'ar' ? 'الأحد' : 'Sun', trips: 19, revenue: 600 },
    { name: lang === 'ar' ? 'الاثنين' : 'Mon', trips: 15, revenue: 500 },
    { name: lang === 'ar' ? 'الثلاثاء' : 'Tue', trips: 22, revenue: 750 },
    { name: lang === 'ar' ? 'الأربعاء' : 'Wed', trips: 30, revenue: 900 },
    { name: lang === 'ar' ? 'الخميس' : 'Thu', trips: 28, revenue: 850 },
    { name: lang === 'ar' ? 'الجمعة' : 'Fri', trips: 35, revenue: 1100 },
  ], [lang]);

  const recentActivity = useMemo(() => [
    { id: 1, type: 'trip', title: lang === 'ar' ? 'رحلة جديدة مكتملة' : 'New Trip Completed', time: '5m ago', color: 'bg-green-500' },
    { id: 2, type: 'user', title: lang === 'ar' ? 'تسجيل مستخدم جديد' : 'New User Registered', time: '12m ago', color: 'bg-blue-500' },
    { id: 3, type: 'driver', title: lang === 'ar' ? 'سائق أصبح متصلاً' : 'Driver went online', time: '18m ago', color: 'bg-gold' },
    { id: 4, type: 'payment', title: lang === 'ar' ? 'تلقي دفعة مالية' : 'Payment Received', time: '25m ago', color: 'bg-purple-500' },
  ], [lang]);

  return (
    <div className="space-y-8 pb-12">
      {/* Visual Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget 
          title={lang === 'ar' ? 'إجمالي الأرباح' : 'Total Revenue'} 
          value={`${stats.revenue} BHD`} 
          subValue="+12.5% vs last week"
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatWidget 
          title={lang === 'ar' ? 'الرحلات النشطة' : 'Active Rides'} 
          value={stats.active.toString()} 
          subValue={`${stats.completed} completed today`}
          icon={Car}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatWidget 
          title={lang === 'ar' ? 'سائقين متصلين' : 'Drivers Online'} 
          value={stats.online.toString()} 
          subValue={`out of ${allDrivers.length} total`}
          icon={Users}
          color="text-gold"
          bgColor="bg-gold/10"
        />
        <StatWidget 
          title={lang === 'ar' ? 'المستخدمين الجدد' : 'New Members'} 
          value={stats.totalUsers.toString()} 
          subValue="+5 added today"
          icon={TrendingUp}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-dark">{lang === 'ar' ? 'إحصائيات الأداء' : 'Performance Analytics'}</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Weekly progress report</p>
            </div>
            <select className="bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-black text-gray-400 ring-1 ring-gray-100 focus:ring-gold/20 outline-none">
              <option>{lang === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
              <option>{lang === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days'}</option>
            </select>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 800 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--primary)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-full">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-dark rounded-2xl flex items-center justify-center">
                 <Activity className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-black text-dark">{lang === 'ar' ? 'النشاطات الأخيرة' : 'Recent Activity'}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Live Feed</p>
              </div>
           </div>

           <div className="flex-1 space-y-6">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex gap-4">
                   <div className={cn("w-2 h-10 rounded-full shrink-0", act.color)} />
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-dark truncate leading-tight">{act.title}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{act.time}</p>
                   </div>
                   <button className="text-gray-300 hover:text-gold transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                   </button>
                </div>
              ))}
           </div>

           <button className="w-full mt-8 py-4 bg-gray-50 hover:bg-gold hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all">
              {lang === 'ar' ? 'عرض السجلات الكاملة' : 'View Full Logs'}
           </button>
        </div>
      </div>
    </div>
  );
};

interface StatWidgetProps {
  title: string;
  value: string;
  subValue: string;
  icon: any;
  color: string;
  bgColor: string;
}

const StatWidget = ({ title, value, subValue, icon: Icon, color, bgColor }: StatWidgetProps) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5", bgColor)}>
        <Icon className={cn("w-6 h-6", color)} />
      </div>
      <div className="flex items-center gap-1 text-green-500 font-black text-[10px]">
        <ArrowUpRight className="w-3 h-3" />
        12%
      </div>
    </div>
    <div>
      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-black text-dark leading-none mb-2">{value}</h4>
      <p className="text-[10px] text-gray-400 font-bold">{subValue}</p>
    </div>
  </motion.div>
);
