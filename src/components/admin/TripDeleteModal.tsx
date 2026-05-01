
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { Trip } from '../../types';

interface TripDeleteModalProps {
  trip: Trip | null;
  onClose: () => void;
  onConfirm: () => void;
  lang: 'ar' | 'en';
}

export const TripDeleteModal = ({ trip, onClose, onConfirm, lang }: TripDeleteModalProps) => {
  return (
    <AnimatePresence>
      {trip && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 text-center"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-dark mb-2">
              {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </h3>
            <p className="text-gray-500 font-bold mb-8 text-sm leading-relaxed">
              {lang === 'ar' ? (
                <>
                  هل أنت متأكد من حذف رحلة العميل <span className="text-dark">{trip.customerName}</span>؟
                  <br />
                  هذا الإجراء لا يمكن التراجع عنه.
                </>
              ) : (
                <>
                  Are you sure you want to delete the trip for <span className="text-dark">{trip.customerName}</span>?
                  <br />
                  This action cannot be undone.
                </>
              )}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={onClose}
                className="py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={onConfirm}
                className="bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
