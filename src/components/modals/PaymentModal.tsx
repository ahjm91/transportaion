
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Search, Loader2, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Trip, SiteSettings } from '../../types';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteSettings: SiteSettings;
  lang: 'ar' | 'en';
  t: (key: string) => string;
  initialTrip?: Trip | null;
}

export const PaymentModal = ({
  isOpen, onClose, siteSettings, lang, t, initialTrip
}: PaymentModalProps) => {
  const [searchTripId, setSearchTripId] = React.useState('');
  const [paymentTrip, setPaymentTrip] = React.useState<Trip | null>(null);
  const [isSearchingTrip, setIsSearchingTrip] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);

  React.useEffect(() => {
    if (initialTrip) {
      setPaymentTrip(initialTrip);
    } else if (!isOpen) {
      setPaymentTrip(null);
      setSearchTripId('');
    }
  }, [initialTrip, isOpen]);

  const handleSearch = async () => {
    if (!searchTripId) return;
    setIsSearchingTrip(true);
    try {
      const tripsRef = collection(db, 'trips');
      const q = query(tripsRef, where('phone', '==', searchTripId));
      const querySnapshot = await getDocs(q);
      
      let foundTrip = null;
      if (!querySnapshot.empty) {
        foundTrip = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Trip;
      } else {
        const docRef = doc(db, 'trips', searchTripId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          foundTrip = { id: docSnap.id, ...docSnap.data() } as Trip;
        }
      }

      if (foundTrip) {
        if (foundTrip.paymentStatus === 'Paid') {
          alert(lang === 'ar' ? 'هذه الرحلة مدفوعة بالفعل. شكراً لك!' : 'This trip is already paid. Thank you!');
        } else if (!foundTrip.amount || foundTrip.amount <= 0) {
          alert(lang === 'ar' ? 'لم يتم تحديد مبلغ لهذه الرحلة بعد. يرجى التواصل مع الإدارة.' : 'No amount has been set for this trip yet. Please contact management.');
        } else {
          setPaymentTrip(foundTrip);
        }
      } else {
        alert(lang === 'ar' ? 'لم يتم العثور على رحلة بهذا الرقم.' : 'No trip found with this number.');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSearchingTrip(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentTrip) return;
    setIsPaying(true);

    try {
      if (siteSettings.paymentGateway === 'MyFatoorah' || siteSettings.paymentGateway === 'Tap') {
        // Create Checkout Session
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: paymentTrip.id,
            amount: paymentTrip.amount,
            customerName: paymentTrip.customerName,
            customerEmail: paymentTrip.email,
            gateway: siteSettings.paymentGateway
          })
        });

        const result = await response.json();
        if (result.success && result.url) {
          window.location.href = result.url;
        } else {
          throw new Error(result.error || 'Checkout failed');
        }
      } else {
        // Fallback to WhatsApp if no card gateway or WhatsApp selected
        const adminWhatsapp = siteSettings.notificationWhatsapp || siteSettings.whatsapp || '97332325997';
        const message = lang === 'ar' 
          ? `👋 *طلب دفع رحلة*\n\n` +
            `👤 العميل: ${paymentTrip.customerName}\n` +
            `📍 المسار: ${paymentTrip.direction}\n` +
            `📅 التاريخ: ${paymentTrip.date}\n` +
            `💰 السعر: ${paymentTrip.amount} BHD\n` +
            `🆔 رقم الحجز: ${paymentTrip.id.slice(-6).toUpperCase()}\n\n` +
            `أرغب في تأكيد الدفع لهذه الرحلة.`
          : `👋 *Trip Payment Request*\n\n` +
            `👤 Customer: ${paymentTrip.customerName}\n` +
            `📍 Route: ${paymentTrip.direction}\n` +
            `📅 Date: ${paymentTrip.date}\n` +
            `💰 Price: ${paymentTrip.amount} BHD\n` +
            `🆔 Booking ID: ${paymentTrip.id.slice(-6).toUpperCase()}\n\n` +
            `I would like to confirm the payment for this trip.`;
        
        window.open(`https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (err: any) {
      console.error(err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء معالجة الدفع. يرجى المحاولة لاحقاً.' : 'Error processing payment. Please try again later.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Wallet className="text-gold w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-dark">{t('payForTrip')}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {!paymentTrip ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-gray-500 font-bold">{lang === 'ar' ? 'أدخل رقم الرحلة أو الهاتف للبحث' : 'Enter Trip ID or Phone to search'}</p>
                  </div>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold text-center text-lg"
                    placeholder="ID / Phone"
                    value={searchTripId}
                    onChange={e => setSearchTripId(e.target.value)}
                  />
                  <button 
                    onClick={handleSearch}
                    disabled={isSearchingTrip}
                    className="w-full bg-dark text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    {isSearchingTrip ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    {lang === 'ar' ? 'بحث عن الرحلة' : 'Search Trip'}
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-gold/5 p-6 rounded-3xl border border-gold/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">{lang === 'ar' ? 'العميل' : 'Customer'}</p>
                        <h4 className="text-xl font-black text-dark">{paymentTrip.customerName}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{lang === 'ar' ? 'المبلغ' : 'Amount'}</p>
                        <p className="text-2xl font-black text-gold">{paymentTrip.amount} BHD</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-gray-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{paymentTrip.direction}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 invisible" /> {/* Placeholder for alignment */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{paymentTrip.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handlePayment}
                    disabled={isPaying}
                    className="w-full bg-[#25D366] text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-green-500/20 hover:bg-[#128C7E] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        siteSettings.paymentGateway === 'WhatsApp' ? (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        ) : <DollarSign className="w-5 h-5" />
                      )}
                    </div>
                    {isPaying ? (lang === 'ar' ? 'جاري التحويل...' : 'Redirecting...') : (
                      siteSettings.paymentGateway === 'WhatsApp' 
                        ? (lang === 'ar' ? 'تأكيد عبر واتساب' : 'Confirm via WhatsApp') 
                        : (lang === 'ar' ? 'ادفع الآن بالبطاقة' : 'Pay via Card')
                    )}
                  </button>

                  <button 
                    onClick={() => setPaymentTrip(null)}
                    className="w-full text-gray-400 text-xs font-black uppercase tracking-widest hover:text-dark transition-all"
                  >
                    {lang === 'ar' ? 'بحث عن رحلة أخرى' : 'Search Another Trip'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
