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
  getDoc,
  limit
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
  Wallet,
  Camera,
  FileText,
  User,
  ShieldCheck,
  Upload,
  Mail,
  Calendar,
  Settings,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const DriverDashboard: React.FC = () => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'profile' | 'wallet'>('requests');
  const [loading, setLoading] = useState(true);

  // Profile Editing State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCarModel, setEditCarModel] = useState('');
  const [editCarYear, setEditCarYear] = useState('');
  const [editPlateNumber, setEditPlateNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const user = auth.currentUser;
  const lang = 'ar';

  // Initialize edit state when driver loads
  useEffect(() => {
    if (driver && editName === '') {
      setEditName(driver.name || '');
      setEditPhone(driver.phone || '');
      setEditCarModel(driver.carModel || '');
      setEditCarYear(driver.carYear || '');
      setEditPlateNumber(driver.plateNumber || '');
    }
  }, [driver]);

  const handleUpdateProfile = async () => {
    if (!driver) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'drivers', driver.id), {
        name: editName,
        phone: editPhone,
        carModel: editCarModel,
        carYear: editCarYear,
        plateNumber: editPlateNumber,
        updatedAt: serverTimestamp()
      });
      alert(lang === 'ar' ? "تم تحديث البيانات بنجاح" : "Profile updated successfully");
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? "فشل تحديث البيانات" : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleDocUpload = async (field: string, file: File) => {
    if (!driver) return;
    setUploadingField(field);
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../firebase');
      const storageRef = ref(storage, `drivers/${driver.id}/${field}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'drivers', driver.id), {
        [field]: url,
        isVerified: false, // Reset verification if documents change
        updatedAt: serverTimestamp()
      });
      alert(lang === 'ar' ? "تم رفع المستند بنجاح" : "Document uploaded successfully");
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? "فشل رفع المستند" : "Upload failed");
    } finally {
      setUploadingField(null);
    }
  };

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

    // Load Transactions
    const qTransactions = query(
      collection(db, 'transactions'),
      where('driverId', '==', user.uid),
      limit(20)
    );
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    // Load Manually Assigned Bookings
    const qAssigned = query(
      collection(db, 'bookings'),
      where('assignedDriverId', '==', user.uid),
      where('status', '==', 'assigned')
    );
    const unsubAssigned = onSnapshot(qAssigned, (snapshot) => {
      const assignedData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
      
      // Check for new arrivals to play sound
      if (!snapshot.empty) {
        const hasNew = snapshot.docChanges().some(change => change.type === 'added');
        if (hasNew) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
          } catch (e) {
            console.log("Audio play failed (user interaction might be required)");
          }
        }
      }

      setRequests(prev => {
        const existingIds = prev.map(r => r.id);
        const filteredAssigned = assignedData
          .filter(a => !existingIds.includes(a.id))
          .map(a => ({
            id: a.id,
            bookingId: a.id,
            driverId: user.uid,
            status: 'pending', // internal UI status
            createdAt: a.createdAt,
            expiresAt: Date.now() + 3600000,
            isManual: true,
            customerName: a.customerName,
            pickup: a.pickupAddress,
            dropoff: a.dropoffAddress,
            price: a.price
          } as any));
        return [...prev.filter(r => !(r as any).isManual), ...filteredAssigned];
      });
    });

    return () => {
      unsubDriver();
      unsubRequests();
      unsubPayouts();
      unsubTransactions();
      unsubAssigned();
    };
  }, [user]);

  // Watch for Active Booking
  useEffect(() => {
    if (!driver?.id) return;
    
    const q = query(
      collection(db, 'bookings'),
      where('assignedDriverId', '==', driver.id),
      where('status', 'in', ['accepted', 'driver_assigned', 'driver_arriving', 'trip_started'])
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
  const handleAccept = async (request: any) => {
    if (!driver) return;

    const bookingRef = doc(db, 'bookings', request.bookingId);
    const driverRef = doc(db, 'drivers', driver.id);
    const requestRef = request.isManual ? null : doc(db, 'driver_requests', request.id!);

    try {
      await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        const driverDoc = await transaction.get(driverRef);
        
        if (!bookingDoc.exists()) throw new Error("Booking not found");
        if (!driverDoc.exists()) throw new Error("Driver profile not found");
        
        const bookingData = bookingDoc.data() as Booking;
        const driverData = driverDoc.data() as Driver;

        // Update Booking
        transaction.update(bookingRef, {
          status: 'accepted',
          assignedDriverId: driver.id,
          driverName: driver.name,
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Update Driver
        transaction.update(driverRef, {
          status: 'busy',
        });

        // Update Request if it's from the pool
        if (requestRef) {
          transaction.update(requestRef, {
            status: 'accepted'
          });
        }
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
                {activeBooking.status === 'accepted' && (
                    <button 
                      onClick={async () => await updateDoc(doc(db, 'bookings', activeBooking.id), { status: 'driver_assigned' })}
                      className="flex-1 bg-dark text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gold transition-all shadow-lg"
                    >
                      تأكيد البدء بالتحرك
                    </button>
                  )}
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
                        <h5 className="font-black text-dark">{(req as any).customerName || 'طلب توصيل جديد'}</h5>
                        <p className="text-xs text-gray-400 font-bold">
                          {(req as any).isManual ? (lang === 'ar' ? 'طلب مخصص من الإدارة' : 'Special Assignment from Admin') : (lang === 'ar' ? 'طلب من النظام' : 'System Request')}
                        </p>
                        {(req as any).pickup && (
                          <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">📍 {(req as any).pickup} → {(req as any).dropoff}</p>
                        )}
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
            {/* Status Banner */}
            <div className={cn(
              "p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl border-4",
              driver.isVerified ? "bg-green-50 border-white shadow-green-500/5 transition-all" : "bg-yellow-50 border-white shadow-yellow-500/5 animate-pulse"
            )}>
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group",
                  driver.isVerified ? "bg-green-500" : "bg-yellow-500"
                )}>
                  {driver.isVerified ? <ShieldCheck className="w-8 h-8 text-white" /> : <AlertCircle className="w-8 h-8 text-white" />}
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>
                <div>
                  <h4 className="font-black text-dark text-xl flex items-center gap-2">
                    {driver.isVerified ? (lang === 'ar' ? 'حساب موثق بالكامل' : 'Fully Verified Account') : (lang === 'ar' ? 'بانتظار مراجعة المستندات' : 'Documents Under Review')}
                    {driver.isVerified && <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/20" />}
                  </h4>
                  <p className="text-xs text-gray-500 font-bold max-w-md mt-1 leading-relaxed">
                    {driver.isVerified 
                      ? (lang === 'ar' ? 'لقد أكملت جميع متطلبات التوثيق. يمكنك الآن العمل واستقبال الطلبات.' : 'You have completed all verification requirements. You are active.') 
                      : (lang === 'ar' ? 'يرجى مراجعة بياناتك ورفع صور المستندات المطلوبة (الهوية، الرخصة، السيارة) ليتم تفعيل حسابك.' : 'Please review your info and upload documents (ID, License, Car) to activate account.')}
                    {driver.verificationMessage && (
                      <span className="block text-red-500 mt-2 p-2 bg-red-50 rounded-xl border border-red-100 italic">"{driver.verificationMessage}"</span>
                    )}
                  </p>
                </div>
              </div>
              <div className={cn(
                "hidden md:flex flex-col items-end gap-1 px-6 py-3 rounded-3xl border-2 font-black text-[10px] uppercase tracking-[0.2em]",
                driver.isVerified ? "bg-white border-green-500/20 text-green-600" : "bg-white border-yellow-500/20 text-yellow-600"
              )}>
                <span>Status</span>
                <span className="text-sm">{driver.isVerified ? 'ACTIVE' : 'PENDING'}</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Profile Settings */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-dark rounded-2xl flex items-center justify-center">
                        <Settings className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-dark">{lang === 'ar' ? 'المعلومات الأساسية' : 'General Information'}</h3>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'إجمالي الملف الشخصي' : 'Overall Profile'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <User className="w-3 h-3" /> {lang === 'ar' ? 'الاسم كاملاً' : 'Full Name'}
                        </label>
                        <input 
                          type="text"
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-gold/10 focus:bg-white focus:border-gold/20 transition-all"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Phone className="w-3 h-3" /> {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                        </label>
                        <input 
                          type="tel"
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-gold/10 focus:bg-white focus:border-gold/20 transition-all font-mono"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Car className="w-3 h-3" /> {lang === 'ar' ? 'نوع وفئة السيارة' : 'Car Type & Class'}
                        </label>
                        <select 
                          className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-gold/10 focus:bg-white focus:border-gold/20 transition-all"
                          value={driver.carType}
                          onChange={async e => await updateDoc(doc(db, 'drivers', driver.id), { carType: e.target.value })}
                        >
                          <option value="Standard">Standard (اقتصادية)</option>
                          <option value="VIP">VIP (فخمة)</option>
                          <option value="Van">Van (عائلية)</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'الموديل' : 'Model'}</label>
                          <input 
                            type="text"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-4 text-xs font-black focus:ring-4 focus:ring-gold/10"
                            value={editCarModel}
                            onChange={e => setEditCarModel(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'السنة' : 'Year'}</label>
                          <input 
                            type="text"
                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-4 text-xs font-black focus:ring-4 focus:ring-gold/10"
                            value={editCarYear}
                            onChange={e => setEditCarYear(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isSaving}
                      className="w-full py-5 bg-dark text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-gold hover:text-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-dark/10 disabled:opacity-50"
                    >
                      {isSaving ? <Clock className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                      {lang === 'ar' ? 'حفظ وتحديث ملف السائق' : 'Save & Update Driver Profile'}
                    </button>
                  </div>
                </div>

                {/* Documents Grid */}
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                  <div>
                    <h3 className="text-xl font-black text-dark">{lang === 'ar' ? 'المستندات والصور' : 'Documents & Photos'}</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">{lang === 'ar' ? 'رفع وإدارة الأوراق الثبوتية' : 'Manage Legal Documents'}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* License */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <FileText className="w-3 h-3 text-gold" /> {lang === 'ar' ? 'رخصة القيادة' : 'Driver License'}
                        </label>
                        {driver.licenseImage && <span className="p-1 px-2 bg-green-50 text-green-500 rounded-lg text-[8px] font-black">UPLOADED</span>}
                      </div>
                      <label 
                        className="aspect-video relative rounded-[2rem] bg-gray-50 border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer group hover:bg-gold/5 hover:border-gold/20 transition-all overflow-hidden"
                      >
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleDocUpload('licenseImage', e.target.files[0])}
                        />
                        {uploadingField === 'licenseImage' ? (
                          <Clock className="w-8 h-8 text-gold animate-spin" />
                        ) : driver.licenseImage ? (
                          <>
                            <img src={driver.licenseImage} className="w-full h-full object-cover transition-all group-hover:scale-110" alt="License" />
                            <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                               <Upload className="w-10 h-10 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 space-y-2">
                             <Upload className="w-8 h-8 text-gray-200 mx-auto" />
                             <p className="text-[10px] font-black text-gray-300 uppercase">{lang === 'ar' ? 'اضغط للرفع' : 'Click to Upload'}</p>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* ID Card */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-blue-500" /> {lang === 'ar' ? 'البطاقة السكانية (الهوية)' : 'National ID / CPR'}
                        </label>
                        {driver.idCardImage && <span className="p-1 px-2 bg-blue-50 text-blue-500 rounded-lg text-[8px] font-black">UPLOADED</span>}
                      </div>
                      <label 
                        className="aspect-video relative rounded-[2rem] bg-gray-50 border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer group hover:bg-gold/5 hover:border-gold/20 transition-all overflow-hidden"
                      >
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleDocUpload('idCardImage', e.target.files[0])}
                        />
                        {uploadingField === 'idCardImage' ? (
                          <Clock className="w-8 h-8 text-gold animate-spin" />
                        ) : driver.idCardImage ? (
                          <>
                            <img src={driver.idCardImage} className="w-full h-full object-cover transition-all group-hover:scale-110" alt="ID" />
                            <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                               <Upload className="w-10 h-10 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 space-y-2">
                             <Upload className="w-8 h-8 text-gray-200 mx-auto" />
                             <p className="text-[10px] font-black text-gray-300 uppercase">{lang === 'ar' ? 'اضغط للرفع' : 'Click to Upload'}</p>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* Car Exterior */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Car className="w-3 h-3 text-green-500" /> {lang === 'ar' ? 'صورة السيارة (خارجي)' : 'Car Photo (Exterior)'}
                        </label>
                        {driver.carImage && <span className="p-1 px-2 bg-green-50 text-green-500 rounded-lg text-[8px] font-black">UPLOADED</span>}
                      </div>
                      <label 
                        className="aspect-video relative rounded-[2rem] bg-gray-50 border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer group hover:bg-gold/5 hover:border-gold/20 transition-all overflow-hidden"
                      >
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleDocUpload('carImage', e.target.files[0])}
                        />
                        {uploadingField === 'carImage' ? (
                          <Clock className="w-8 h-8 text-gold animate-spin" />
                        ) : driver.carImage ? (
                          <>
                            <img src={driver.carImage} className="w-full h-full object-cover transition-all group-hover:scale-110" alt="Car" />
                            <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                               <Upload className="w-10 h-10 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 space-y-2">
                             <ImageIcon className="w-8 h-8 text-gray-200 mx-auto" />
                             <p className="text-[10px] font-black text-gray-300 uppercase">{lang === 'ar' ? 'اضغط للرفع' : 'Click to Upload'}</p>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* Car Interior */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <ImageIcon className="w-3 h-3 text-purple-500" /> {lang === 'ar' ? 'صورة السيارة (داخلي)' : 'Car Photo (Interior)'}
                        </label>
                      </div>
                      <label 
                        className="aspect-video relative rounded-[2rem] bg-gray-50 border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer group hover:bg-gold/5 hover:border-gold/20 transition-all overflow-hidden"
                      >
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleDocUpload('carInteriorImage', e.target.files[0])}
                        />
                        {uploadingField === 'carInteriorImage' ? (
                          <Clock className="w-8 h-8 text-gold animate-spin" />
                        ) : (driver as any).carInteriorImage ? (
                          <>
                            <img src={(driver as any).carInteriorImage} className="w-full h-full object-cover transition-all group-hover:scale-110" alt="Interior" />
                            <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                               <Upload className="w-10 h-10 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 space-y-2">
                             <ImageIcon className="w-8 h-8 text-gray-200 mx-auto" />
                             <p className="text-[10px] font-black text-gray-300 uppercase">{lang === 'ar' ? 'رفع (اختياري)' : 'Upload (Optional)'}</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar - Profile Preview */}
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center text-center">
                  <div className="relative group">
                     <label className="w-32 h-32 rounded-[2.5rem] bg-gold/10 p-1 relative overflow-hidden ring-4 ring-gold/5 shadow-2xl cursor-pointer block">
                       <input 
                         type="file" 
                         className="hidden" 
                         accept="image/*"
                         onChange={e => {
                           const file = e.target.files?.[0];
                           if (file) handleDocUpload('profileImage', file);
                         }}
                       />
                       {uploadingField === 'profileImage' ? (
                         <div className="w-full h-full flex items-center justify-center bg-dark/20">
                           <Clock className="w-8 h-8 text-gold animate-spin" />
                         </div>
                       ) : (
                         <>
                           <img 
                            src={driver.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.id}`} 
                            className="w-full h-full object-cover rounded-[2rem]"
                            alt="Profile"
                           />
                           <div 
                            className="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                           >
                             <Camera className="w-8 h-8 text-white" />
                           </div>
                         </>
                       )}
                    </label>
                    {driver.isVerified && (
                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-xl border-4 border-white shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <h4 className="mt-6 font-black text-xl text-dark leading-none">{driver.name}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">{driver.carType} DRIVER</p>
                  
                  <div className="w-full mt-8 h-px bg-gray-50" />
                  
                  <div className="w-full grid grid-cols-2 gap-4 mt-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Rating</p>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 text-gold fill-gold" />
                        <span className="text-sm font-black text-dark">{driver.averageRating || '5.0'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Trips</p>
                      <span className="text-sm font-black text-dark">{(driver as any).totalRides || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-dark p-8 rounded-[3rem] shadow-2xl space-y-6 text-white relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold/10 rounded-full blur-3xl group-hover:bg-gold/20 transition-all" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <Car className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest font-mono">{driver.plateNumber || 'No Plate'}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Current Vehicle</p>
                      <h5 className="text-lg font-black">{driver.carModel || 'Standard Car'}</h5>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{driver.carYear || '2024'} Model</p>
                    </div>
                  </div>
                </div>
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
