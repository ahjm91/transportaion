
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock } from 'lucide-react';
import { SiteSettings } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  siteSettings: SiteSettings;
}

export const TermsModal = ({ isOpen, onClose, lang, siteSettings }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white w-full max-w-3xl max-h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-2xl font-bold text-dark">الشروط والأحكام – تأجير السيارات مع سائق</h3>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto text-right dir-rtl" dir="rtl">
            <div className="space-y-8 text-gray-600">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                <p className="font-bold text-dark">اسم الشركة: {siteSettings.companyName}</p>
                <p className="font-bold text-dark">للتواصل: +973 32325997</p>
              </div>

              <section>
                <h4 className="text-lg font-bold text-dark mb-3">1. الاتفاقية العامة</h4>
                <p>بتأكيد الحجز، يوافق العميل على جميع الشروط والأحكام المذكورة أدناه. تحتفظ الشركة بالحق في تعديل هذه الشروط في أي وقت دون إشعار مسبق.</p>
              </section>

              <section>
                <h4 className="text-lg font-bold text-dark mb-3">2. تأكيد الحجز</h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>يجب تأكيد جميع الحجوزات مسبقاً.</li>
                  <li>يلزم دفع مبلغ كامل أو جزئي لتأمين الحجز.</li>
                  <li>يعتبر الحجز مؤكداً فقط بعد استلام الدفع.</li>
                  <li>بمجرد الدفع، يوافق العميل تلقائياً على هذه الشروط والأحكام.</li>
                </ul>
              </section>

              <section>
                <h4 className="text-lg font-bold text-dark mb-3">3. سياسة الإلغاء والاسترداد</h4>
                <div className="bg-gold/5 p-4 rounded-2xl border border-gold/10 space-y-3">
                  <p><strong>قبل أكثر من 24 ساعة من الرحلة:</strong> يحق للعميل استرداد 50% من المبلغ.</p>
                  <p><strong>بين 12 إلى 24 ساعة قبل الرحلة:</strong> يحق للعميل استرداد 25% من المبلغ.</p>
                  <p><strong>بين 6 إلى 12 ساعة قبل الرحلة:</strong> الاسترداد (إن وجد) يخضع لتقدير الشركة فقط.</p>
                  <p><strong>أقل من 6 ساعات أو عدم الحضور:</strong> لا يتم استرداد أي مبلغ تحت أي ظرف.</p>
                  <p><strong>الإلغاء خلال ساعتين من الحجز:</strong> قد يتم استرداد المبلغ بالكامل بعد موافقة الشركة (بشرط ألا تكون الرحلة وشيكة).</p>
                </div>
                <div className="mt-4 flex items-start gap-3 text-sm bg-gray-50 p-4 rounded-xl">
                  <Clock className="w-5 h-5 text-gold shrink-0" />
                  <p>يتم معالجة المبالغ المستردة خلال 3-14 يوم عمل. قد يتم خصم رسوم المعاملات أو الرسوم الإدارية.</p>
                </div>
              </section>

              <section>
                <h4 className="text-lg font-bold text-dark mb-3">4. التأخير ووقت الانتظار</h4>
                <p>يجب أن يكون العميل جاهزاً في وقت الاستلام المتفق عليه. يُسمح بوقت انتظار مجاني لمدة 20 دقيقة، وبعد ذلك سيتم تطبيق رسوم إضافية. في حال عدم الحضور خلال فترة الانتظار، تعتبر الرحلة ملغاة ولا يحق للعميل المطالبة باسترداد المبلغ.</p>
              </section>

              <div className="border-t border-gray-100 pt-8 mt-8">
                <h3 className="text-xl font-bold text-dark mb-6 text-left" dir="ltr">Terms & Conditions – Car Rental with Driver</h3>
                <div className="space-y-6 text-sm text-gray-500 text-left" dir="ltr">
                  <p><strong>Company Name:</strong> {siteSettings.companyName_en || siteSettings.companyName}</p>
                  <p><strong>Contact:</strong> +973 32325997</p>
                  
                  <section>
                    <h4 className="font-bold text-dark mb-2">1. General Agreement</h4>
                    <p>By confirming the booking, the customer agrees to all terms and conditions stated below. The company reserves the right to modify these terms at any time without prior notice.</p>
                  </section>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <button 
              onClick={onClose}
              className="w-full bg-dark text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
            >
              فهمت وأوافق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const PrivacyModal = ({ isOpen, onClose, lang, siteSettings }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white w-full max-w-3xl max-h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-2xl font-bold text-dark">سياسة الخصوصية</h3>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto text-right dir-rtl" dir="rtl">
            <div className="space-y-8 text-gray-600">
              <section>
                <h4 className="text-lg font-bold text-dark mb-3">مقدمة</h4>
                <p>نحن في {lang === 'ar' ? siteSettings.companyName : (siteSettings.companyName_en || siteSettings.companyName)} نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا للمعلومات التي تقدمها لنا.</p>
              </section>

              <section>
                <h4 className="text-lg font-bold text-dark mb-3">المعلومات التي نجمعها</h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>الاسم ومعلومات الاتصال (رقم الهاتف).</li>
                  <li>تفاصيل الرحلة (نقطة الانطلاق، الوجهة، التاريخ والوقت).</li>
                </ul>
              </section>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <button 
              onClick={onClose}
              className="w-full bg-dark text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
