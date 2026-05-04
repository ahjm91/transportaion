import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  runTransaction,
  updateDoc,
  addDoc,
  serverTimestamp, 
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DriverRequest, Booking, Driver, PayoutRequest } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Navigation, 
  Phone, 
  Clock,
  Car,
  AlertCircle,
  DollarSign,
  Star,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const DriverDashboard: React.FC = () => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'profile' | 'wallet'>('requests');
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  // Stage 4: Fetch Driver Profile & Requests
  useEffect(() => {
    if (!user) return;

    // Load Driver Profile
    const unsubDriver = onSnapshot(doc(db, 'drivers', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setDriver({ id: docSnap.id, ...docSnap.data() } as Driver);
      }
      setLoading(false);
    });

    // Watch for Pending Requests
    const q = query(
      collection(db, 'driver_requests'),
      where('driverId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubRequests = onSnapshot(q, (snapshot) => {
      const reqData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DriverRequest));
      setRequests(reqData);
    });

    // Load Payouts
    const qPayouts = query(
      collection(db, 'payout_requests'),
      where('driverId', '==', user.uid)
    );
    const unsubPayouts = onSnapshot(qPayouts, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PayoutRequest));
      setPayouts(data);
    });

    return () => {
      unsubDriver();
      unsubRequests();
      unsubPayouts();
    };
  }, [user]);

  // Watch for Active Booking
  useEffect(() => {
    if (!driver?.id) return;
    
    const q = query(
      collection(db, 'bookings'),
      where('assignedDriverId', '==', driver.id),
      where('status', 'in', ['driver_assigned', 'on_the_way'])
    );

    const unsubBooking = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveBooking({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Booking);
      } else {
        setActiveBooking(null);
      }
    });

    return () => unsubBooking();
  }, [driver?.id]);

  // Stage 6: Location Tracking
  useEffect(() => {
    if (!driver?.id) return;

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            await updateDoc(doc(db, 'drivers', driver.id), {
              location: { lat: latitude, lng: longitude },
              lastUpdated: serverTimestamp()
            });
          } catch (err) {
            console.error("Location update failed:", err);
          }
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    };

    // Initial update
    updateLocation();

    // Set interval for 2.5 minutes (150000 ms) as requested
    const intervalId = setInterval(updateLocation, 150000);

    return () => clearInterval(intervalId);
  }, [driver?.id]);

  // Stage 5: Accept Logic with Transaction
  const handleAccept = async (request: DriverRequest) => {
    if (!driver) return;

    const bookingRef = doc(db, 'bookings', request.bookingId);
    const driverRef = doc(db, 'drivers', driver.id);
    const requestRef = doc(db, 'driver_requests', request.id!);

    try {
      await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        const driverDoc = await transaction.get(driverRef);
        
        if (!bookingDoc.exists()) throw new Error("Booking not found");
        if (!driverDoc.exists()) throw new Error("Driver profile not found");
        
        const bookingData = bookingDoc.data() as Booking;
        const driverData = driverDoc.data() as Driver;
        
        if (bookingData.assignedDriverId) {
          throw new Error("Already assigned to another driver");
        }

        // Wallet Balance Check
        const commissionAmount = bookingData.commission || 0;
        const currentWallet = driverData.wallet || 0;
        
        if (currentWallet < commissionAmount) {
          throw new Error("عذراً، محفظتك لا تغطي مقدار عمولة هذا المشوار. يرجى شحن رصيدك.");
        }

        // Update Booking
        transaction.update(bookingRef, {
          status: 'driver_assigned',
          assignedDriverId: driver.id,
          driverName: driver.name,
          updatedAt: serverTimestamp()
        });

        // Update Driver
        transaction.update(driverRef, {
          status: 'busy',
          wallet: currentWallet - commissionAmount
        });

        // Update Request
        transaction.update(requestRef, {
          status: 'accepted'
        });
      });
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء قبول الطلب");
    }
  };

  const handleReject = async (requestId: string) => {
    await updateDoc(doc(db, 'driver_requests', requestId), {
      status: 'rejected'
    });
  };

  const handleCompleteRide = async () => {
    if (!activeBooking || !driver) return;
    
    await updateDoc(doc(db, 'bookings', activeBooking.id), {
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'drivers', driver.id), {
      status: 'online'
    });
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver || !payoutAmount) return;
    
    try {
      const amount = parseFloat(payoutAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("مبلغ غير صالح");
      
      const { requestPayout } = await import('../services/walletService');
      await requestPayout(driver.id, amount);
      
      setIsPayoutModalOpen(false);
      setPayoutAmount('');
      alert("تم إرسال طلب السحب بنجاح");
    } catch (err: any) {
      alert(err.message || "فشل طلب السحب");
    }
  };

  const toggleStatus = async () => {
    if (!driver) return;
    const newStatus = driver.status === 'online' ? 'offline' : 'online';
    await updateDoc(doc(db, 'drivers', driver.id), {
      status: newStatus
    });
  };

  if (loading) return <div className="p-8 text-center font-bold">جاري تحميل واجهة السائق...</div>;

  if (!driver) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
        <h2 className="text-2xl font-black">لم يتم تفعيل حسابك كسائق بعد</h2>
        <p className="text-gray-500">يرجى التواصل مع الإدارة لتفعيل صلاحيات السائق.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-dark">أهلاً، {driver.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <button 
              onClick={toggleStatus}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                driver.status === 'online' 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "bg-gray-200 text-gray-500"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", driver.status === 'online' ? "bg-white animate-pulse" : "bg-gray-400")} />
              {driver.status === 'online' ? 'متصل الآن' : 'غير متصل'}
            </button>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              {driver.status === 'busy' ? 'في رحلة حالياً' : (driver.status === 'online' ? 'مستعد لاستقبال الطلبات' : 'لن تظهر للعملاء')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
             <Star className="w-5 h-5 text-gold fill-gold" />
             <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold leading-none uppercase">التقييم</p>
                <p className="font-black text-sm text-dark">{driver.rating || '5.0'}</p>
             </div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 group relative cursor-pointer pt-6" onClick={() => setActiveTab('wallet')}>
             <div className="absolute -top-1 right-2 px-2 py-0.5 bg-green-500 text-white text-[8px] font-black rounded-full">سحب رصيد</div>
             <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-green-500" />
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold leading-none uppercase">المحفظة</p>
                  <p className="font-black text-sm text-dark">{(driver.wallet as any)?.balance || 0} BHD</p>
                </div>
             </div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 group relative cursor-pointer pt-6">
             <div className="absolute -top-1 right-2 px-2 py-0.5 bg-gold text-[8px] font-black text-dark rounded-full">تفاصيل المركبة</div>
             <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-gold" />
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold leading-none uppercase">{driver.carType}</p>
                  <p className="font-black text-sm text-dark">{driver.plateNumber || 'بدون رقم'}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 sticky top-4 z-10">
          <button 
            onClick={() => setActiveTab('requests')}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
              activeTab === 'requests' ? "bg-dark text-white shadow-lg" : "text-gray-400"
            )}
          >
            <Navigation className="w-4 h-4" />
            الطلبات والرحلات
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
              activeTab === 'profile' ? "bg-dark text-white shadow-lg" : "text-gray-400"
            )}
          >
            <Car className="w-4 h-4" />
            الملف والتحقق
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
              activeTab === 'wallet' ? "bg-dark text-white shadow-lg" : "text-gray-400"
            )}
          >
            <Wallet className="w-4 h-4" />
            المحفظة
          </button>
        </div>

        {activeTab === 'requests' && (
          <>
            {/* Active Booking */}
            {activeBooking && (
              <div className="bg-dark text-white p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gold animate-pulse" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-gold uppercase tracking-tighter">رحلة نشطة الآن</span>
                    <h3 className="text-xl font-bold mt-1">{activeBooking.customerName}</h3>
                  </div>
                  <a href={`tel:${activeBooking.phone}`} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20">
                    <Phone className="w-5 h-5 text-gold" />
                  </a>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">نقطة الانطلاق</p>
                      <p className="text-sm font-bold">{activeBooking.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Navigation className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">وجهة الوصول</p>
                      <p className="text-sm font-bold">{activeBooking.dropoffAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4">
                  {activeBooking.status === 'driver_assigned' && (
                    <button 
                      onClick={async () => await updateDoc(doc(db, 'bookings', activeBooking.id), { status: 'driver_arriving' })}
                      className="flex-1 bg-blue-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg"
                    >
                      لقد وصلت للموقع
                    </button>
                  )}
                  {activeBooking.status === 'driver_arriving' && (
                    <button 
                      onClick={async () => await updateDoc(doc(db, 'bookings', activeBooking.id), { status: 'trip_started' })}
                      className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg"
                    >
                      بدء الرحلة الآن
                    </button>
                  )}
                  {(activeBooking.status === 'trip_started' || activeBooking.status === 'driver_assigned' || activeBooking.status === 'driver_arriving') && (
                    <button 
                      onClick={handleCompleteRide}
                      className="flex-1 bg-gold text-dark py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg shadow-gold/20"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      إنهاء الرحلة
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Requests List */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">الطلبات الواردة ({requests.length})</h4>
              <AnimatePresence>
                {requests.length === 0 && !activeBooking && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200"
                  >
                    <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4 animate-spin-slow" />
                    <p className="text-gray-400 font-bold">في انتظار طلبات جديدة...</p>
                  </motion.div>
                )}
                {requests.map((req) => (
                  <motion.div 
                    key={req.id}
                    layout
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center">
                        <Car className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h5 className="font-black text-dark">طلب توصيل جديد</h5>
                        <p className="text-xs text-gray-400 font-bold">تنتهي الصلاحية خلال لحظات</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAccept(req)}
                        className="flex-1 md:flex-none px-8 py-3 bg-green-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        قبول
                      </button>
                      <button 
                        onClick={() => handleReject(req.id!)}
                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Verification Status Banner */}
            <div className={cn(
              "p-6 rounded-3xl flex items-center justify-between shadow-sm border",
              driver.isVerified ? "bg-green-50 border-green-100" : "bg-yellow-50 border-yellow-100"
            )}>
              <div className="flex items-center gap-4">
                {driver.isVerified ? (
                  <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h4 className="font-black text-dark text-lg">
                    {driver.isVerified ? 'حساب موثق' : 'بانتظار التوثيق'}
                  </h4>
                  <p className="text-sm text-gray-500 font-bold">
                    {driver.isVerified 
                      ? 'يمكنك الآن استقبال الطلبات والعمل بحرية' 
                      : 'يرجى إكمال ملفك الشخصي ورفع المستندات ليتم مراجعته'}
                    {driver.verificationMessage && (
                      <span className="block text-red-500 mt-1">*{driver.verificationMessage}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className={cn(
                "px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest",
                driver.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              )}>
                {driver.isVerified ? 'VERIFIED' : 'PENDING'}
              </div>
            </div>

            {/* Document Upload / URLs */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8">
              <div>
                <h3 className="text-xl font-black text-dark mb-2">الهوية والبيانات الشخصية</h3>
                <p className="text-gray-400 text-sm font-bold">معلوماتك الشخصية وصورة الملف</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">الاسم الكامل</label>
                    <input 
                      type="text"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gold/20"
                      value={driver.name}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">رقم الهاتف</label>
                    <input 
                      type="text"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gold/20"
                      value={driver.phone}
                      readOnly
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <div className="relative group cursor-pointer">
                    <img 
                      src={driver.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + driver.id} 
                      className="w-32 h-32 rounded-3xl object-cover shadow-xl border-4 border-white"
                      alt="Profile"
                    />
                    <div className="absolute inset-0 bg-dark/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <Star className="text-white w-8 h-8" />
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] font-black text-gray-400 uppercase">صورة الملف الشخصي</p>
                  <input 
                    type="text"
                    placeholder="رابط الصورة الشخصية"
                    className="mt-2 w-full bg-white border border-gray-100 rounded-xl py-2 px-4 text-xs font-bold"
                    value={driver.profileImage || ''}
                    onChange={async e => await updateDoc(doc(db, 'drivers', driver.id), { profileImage: e.target.value })}
                  />
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              <div>
                <h3 className="text-xl font-black text-dark mb-2">مستندات المركبة والترخيص</h3>
                <p className="text-gray-400 text-sm font-bold">يرجى إرفاق روابط صور المستندات الرسمية</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Car Details Form */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">نوع المركبة</label>
                    <select 
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gold/20"
                      value={driver.carType}
                      onChange={async e => await updateDoc(doc(db, 'drivers', driver.id), { carType: e.target.value })}
                    >
                      <option value="Standard">Standard</option>
                      <option value="VIP">VIP (Luxury)</option>
                      <option value="Van">Van (Family)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">طراز السيارة</label>
                      <input 
                        type="text"
                        placeholder="Lexus ES350"
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gold/20"
                        value={driver.carModel || ''}
                        onChange={async e => await updateDoc(doc(db, 'drivers', driver.id), { carModel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">سنة الصنع</label>
                      <input 
                        type="text"
                        placeholder="2024"
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gold/20"
                        value={driver.carYear || ''}
                        onChange={async e => await updateDoc(doc(db, 'drivers', driver.id), { carYear: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">رقم اللوحة</label>
                    <input 
                      type="text"
                      placeholder="1234 ABC"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-gold/20"
                      value={driver.plateNumber || ''}
                      onChange={async e => await updateDoc(doc(db, 'drivers', driver.id), { plateNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* Doc Links */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-3xl space-y-4 border border-gray-100">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                        رخصة القيادة
                        {driver.licenseImage ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
                      </label>
                      <input 
                        type="text"
                        placeholder="رابط صورة رخصة القيادة"
                        className="w-full bg-white border-none rounded-xl py-3 px-4 text-xs font-bold"
                        value={driver.licenseImage || ''}
                        onChange={async e => await updateDoc(doc(db, 'drivers', driver.id), { licenseImage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                        صورة السيارة
                        {driver.carImage ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
                      </label>
                      <input 
                        type="text"
                        placeholder="رابط صورة السيارة"
                        className="w-full bg-white border-none rounded-xl py-3 px-4 text-xs font-bold"
                        value={driver.carImage || ''}
                        onChange={async e => await updateDoc(doc(db, 'drivers', driver.id), { carImage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                        البطاقة السكانية / الهوية
                        {driver.idCardImage ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
                      </label>
                      <input 
                        type="text"
                        placeholder="رابط صورة الهوية"
                        className="w-full bg-white border-none rounded-xl py-3 px-4 text-xs font-bold"
                        value={driver.idCardImage || ''}
                        onChange={async e => await updateDoc(doc(db, 'drivers', driver.id), { idCardImage: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                 <button 
                  className={cn(
                    "px-10 py-5 rounded-2xl font-black transition-all",
                    !driver.name || !driver.carImage ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gold text-dark shadow-xl shadow-gold/20 hover:scale-105"
                  )}
                 >
                   إرسال للتحديث والمراجعة
                 </button>
              </div>
            </div>
          </div>
        )}

         {activeTab === 'wallet' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <Wallet className="w-8 h-8 text-green-500 mb-4" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الرصيد المتاح</p>
                  <h3 className="text-3xl font-black text-dark">{(driver.wallet as any)?.balance || 0} <span className="text-xs text-gray-400">BHD</span></h3>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <DollarSign className="w-8 h-8 text-gold mb-4" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">إجمالي الأرباح</p>
                  <h3 className="text-3xl font-black text-dark">{(driver.wallet as any)?.totalEarnings || 0} <span className="text-xs text-gray-400">BHD</span></h3>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <Clock className="w-8 h-8 text-blue-500 mb-4" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">قيد السحب</p>
                  <h3 className="text-3xl font-black text-dark">{(driver.wallet as any)?.pendingPayouts || 0} <span className="text-xs text-gray-400">BHD</span></h3>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                  <button 
                    onClick={() => setIsPayoutModalOpen(true)}
                    className="w-full bg-dark text-white py-4 rounded-2xl font-black text-xs hover:bg-gold hover:text-dark transition-all"
                  >
                    طلب سحب رصيد
                  </button>
               </div>
             </div>

             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-black text-dark uppercase tracking-widest mb-6">سجل العمليات</h4>
                <div className="space-y-4">
                  {payouts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 font-bold">لا توجد عمليات سحب حالية</div>
                  ) : (
                    payouts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            p.status === 'completed' ? "bg-green-100 text-green-600" : (p.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600")
                          )}>
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">سحب مبلغ {p.amount} BHD</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString('ar-BH') : 'قيد الانتظار'}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase",
                          p.status === 'completed' ? "bg-green-100 text-green-700" : (p.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")
                        )}>
                          {p.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPayoutModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-dark mb-2">طلب سحب رصيد</h3>
              <p className="text-gray-400 text-sm font-bold mb-8">سيتم تحويل المبلغ إلى وسيلة الدفع المسجلة لديك خلال 24 ساعة.</p>
              
              <form onSubmit={handlePayoutSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">المبلغ المراد سحبه (BHD)</label>
                  <input 
                    type="number"
                    step="0.1"
                    required
                    max={(driver.wallet as any)?.balance || 0}
                    className="w-full bg-gray-50 border-gray-100 rounded-2xl py-4 px-6 text-xl font-black focus:ring-2 focus:ring-gold/20"
                    placeholder="0.0"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                  />
                  <p className="text-[10px] font-bold text-gray-400">الرصيد المتاح: {(driver.wallet as any)?.balance || 0} BHD</p>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsPayoutModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-dark text-white rounded-2xl font-black hover:bg-gold hover:text-dark transition-all shadow-xl shadow-dark/10"
                  >
                    تأكيد الطلب
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverDashboard;
