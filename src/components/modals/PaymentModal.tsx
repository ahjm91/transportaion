
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Search, Loader2, MapPin, Calendar, CreditCard, Bitcoin } from 'lucide-react';
import { Trip, SiteSettings } from '../../types';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from './CheckoutForm';
import { loadStripe } from '@stripe/stripe-js';

// Re-using the Stripe promise logic from App.tsx or assuming it's available
// For the standalone component, we might need to pass it or the CheckoutForm as a child

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteSettings: SiteSettings;
  lang: 'ar' | 'en';
  t: (key: string) => string;
  stripePromise: any;
}

export const PaymentModal = ({
  isOpen, onClose, siteSettings, lang, t, stripePromise
}: PaymentModalProps) => {
  const [searchTripId, setSearchTripId] = React.useState('');
  const [paymentTrip, setPaymentTrip] = React.useState<Trip | null>(null);
  const [isSearchingTrip, setIsSearchingTrip] = React.useState(false);

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
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingTrip(false);
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
                        <Calendar className="w-3 h-3" />
                        <span>{paymentTrip.date}</span>
                      </div>
                    </div>
                  </div>

                  {siteSettings.paymentGateway === 'Tap' ? (
                    <button 
                      onClick={async () => {
                         try {
                           const res = await fetch('/api/tap/execute-payment', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({
                               amount: paymentTrip.amount,
                               customerName: paymentTrip.customerName,
                               phone: paymentTrip.phone,
                               tripId: paymentTrip.id,
                               secretKey: siteSettings.tapSecretKey
                             })
                           });
                           const data = await res.json();
                           if (data.paymentUrl) window.open(data.paymentUrl, '_blank');
                         } catch (e) { console.error(e); }
                      }}
                      className="w-full bg-black text-white py-4 rounded-2xl font-black flex flex-col items-center hover:bg-gray-900 transition-all"
                    >
                      <span className="text-sm">Pay via Tap Payments</span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-tighter">Supports Apple Pay & Cards</span>
                    </button>
                  ) : siteSettings.paymentGateway === 'MyFatoorah' ? (
                    <button 
                      onClick={async () => {
                         try {
                           const res = await fetch('/api/myfatoorah/execute-payment', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({
                               amount: paymentTrip.amount,
                               customerName: paymentTrip.customerName,
                               phone: paymentTrip.phone,
                               tripId: paymentTrip.id,
                               isSandbox: siteSettings.myFatoorahIsSandbox,
                               token: siteSettings.myFatoorahToken
                             })
                           });
                           const data = await res.json();
                           if (data.paymentUrl) window.open(data.paymentUrl, '_blank');
                         } catch (e) { console.error(e); }
                      }}
                      className="w-full bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                    >
                      <CreditCard className="w-5 h-5" />
                      Pay via MyFatoorah
                    </button>
                  ) : siteSettings.paymentGateway === 'Crypto' ? (
                    <div className="bg-dark p-6 rounded-[2rem] text-center space-y-4">
                      <Bitcoin className="w-12 h-12 text-gold mx-auto" />
                      <div className="bg-white/5 p-4 rounded-xl">
                        <p className="text-[10px] text-gray-400 uppercase mb-2">Wallet Address</p>
                        <p className="text-white font-mono text-[10px] break-all">{siteSettings.cryptoWalletAddress}</p>
                      </div>
                      <button 
                        onClick={async () => {
                           if (confirm('Confirm Crypto transfer?')) {
                             await updateDoc(doc(db, 'trips', paymentTrip.id), { paymentStatus: 'Pending Verification' });
                             onClose();
                           }
                        }}
                        className="w-full bg-gold text-dark py-4 rounded-2xl font-black"
                      >
                        Confirm Transfer
                      </button>
                    </div>
                  ) : (
                    <Elements stripe={stripePromise}>
                       <CheckoutForm 
                          trip={paymentTrip}
                          onSucceed={onClose}
                       />
                    </Elements>
                  )}

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
