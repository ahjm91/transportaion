
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Send, Loader2, CheckCircle } from 'lucide-react';
import { db } from '../../firebase';
import { doc, addDoc, collection, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { Booking, SiteSettings } from '../../types';
import { translations } from '../../translations';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  lang: 'ar' | 'en';
  siteSettings: SiteSettings;
}

export const RatingModal = ({ isOpen, onClose, booking, lang, siteSettings }: RatingModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const t = (key: string) => translations[lang][key] || key;

  const handleSubmit = async () => {
    if (!booking || rating === 0) return;
    setIsSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Create the rating document
        const ratingRef = collection(db, 'ratings');
        const ratingData = {
          bookingId: booking.id,
          driverId: booking.assignedDriverId,
          customerId: booking.userId,
          rating,
          comment,
          createdAt: new Date().toISOString()
        };
        
        // 2. Add rating to collection (using addDoc outside transaction or just set it)
        // Note: within runTransaction we usually use transaction.set
        const newRatingRef = doc(ratingRef);
        transaction.set(newRatingRef, ratingData);

        // 3. Update the booking with the rating
        const bookingRef = doc(db, 'bookings', booking.id);
        transaction.update(bookingRef, { 
          rating, 
          review: comment 
        });

        // 4. Update driver stats if assigned
        if (booking.assignedDriverId) {
          const driverRef = doc(db, 'drivers', booking.assignedDriverId);
          const driverSnap = await transaction.get(driverRef);
          
          if (driverSnap.exists()) {
            const driverData = driverSnap.data();
            const currentTotal = driverData.totalRating || 0;
            const currentCount = driverData.ratingCount || 0;
            
            const newCount = currentCount + 1;
            const newTotal = currentTotal + rating;
            const newAverage = parseFloat((newTotal / newCount).toFixed(1));

            transaction.update(driverRef, {
              totalRating: newTotal,
              ratingCount: newCount,
              averageRating: newAverage,
              rating: newAverage // Compatibility with existing field
            });
          }
        }
      });

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setRating(0);
        setComment('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert(lang === 'ar' ? 'حدث خطأ أثناء إرسال التقييم.' : 'Error submitting rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>

        <div className="p-8 pb-4 text-center">
          <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="text-gold w-8 h-8 fill-gold" />
          </div>
          <h2 className="text-2xl font-black text-dark tracking-tight">
            {isSuccess ? (lang === 'ar' ? 'شكراً لتقييمك!' : 'Thank you!') : (lang === 'ar' ? 'قيم رحلتك' : 'Rate Your Trip')}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {isSuccess 
              ? (lang === 'ar' ? 'تم حفظ التقييم بنجاح، ملاحظاتك تهمنا.' : 'Rating saved successfully, your feedback matters.')
              : (lang === 'ar' ? 'كيف كانت تجربتك مع السائق؟' : 'How was your experience with the driver?')
            }
          </p>
        </div>

        <div className="p-8 pt-4 space-y-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4"
              >
                <CheckCircle className="w-12 h-12" />
              </motion.div>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star 
                      className={`w-10 h-10 ${s <= rating ? 'text-gold fill-gold' : 'text-gray-200'}`} 
                    />
                  </button>
                ))}
              </div>

              <textarea
                placeholder={lang === 'ar' ? 'أضف تعليقاً (اختياري)...' : 'Add a comment (optional)...'}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-gold/20 font-medium text-dark"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />

              <button
                disabled={rating === 0 || isSubmitting}
                onClick={handleSubmit}
                className="w-full bg-dark text-white py-5 rounded-full font-black text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-dark/10 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gold" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
                {lang === 'ar' ? 'إرسال التقييم' : 'Send Rating'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
