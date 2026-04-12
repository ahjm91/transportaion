/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  ShieldAlert,
  Clock3, 
  Phone,
  Menu,
  X,
  ArrowLeft,
  Camera,
  ShoppingBag,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  Loader2,
  Upload,
  FileText,
  Download,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  PieChart,
  ArrowUp,
  ArrowDown,
  Instagram,
  Twitter,
  Share2,
  CreditCard,
  CheckCircle,
  Wallet,
  Copy,
  MessageCircle
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { GoogleGenAI } from "@google/genai";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { auth, db, storage } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  getDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { translations } from './translations';
import firebaseConfig from '../firebase-applet-config.json';

// Types
type ServiceType = 'luxury';

interface BookingData {
  customerName: string;
  phone: string;
  confirmPhone: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  passengers: number;
  bags: number;
  carType: 'Standard' | 'VIP' | 'Van';
  service: string;
  distance?: number;
  amount?: number;
}

interface Service {
  id: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  image: string;
  features: string[];
  features_en?: string[];
}

interface SpecializedService {
  id: string;
  title: string;
  title_en?: string;
  desc: string;
  desc_en?: string;
  image: string;
  iconName: string;
  iconImage?: string;
  order: number;
}

interface SiteSettings {
  heroTitle: string;
  heroTitle_en?: string;
  heroSubtitle: string;
  heroSubtitle_en?: string;
  heroDescription: string;
  heroDescription_en?: string;
  heroImage: string;
  phone: string;
  whatsapp: string;
  notificationWhatsapp?: string;
  logo?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  // Design Settings
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  borderRadius: string;
  footerAbout: string;
  footerAbout_en?: string;
  footerAddress: string;
  footerAddress_en?: string;
  adminEmails?: string[];
  // Pricing & Payment
  pricePerKm: number;
  baseFee: number;
  myFatoorahToken?: string;
  myFatoorahIsSandbox?: boolean;
}

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

interface Trip {
  id: string;
  userId?: string;
  customerName: string;
  phone: string;
  passengers: number;
  bags: number;
  carType: 'Standard' | 'VIP' | 'Van';
  direction: string;
  pickup: string;
  dropoff: string;
  distance?: number; // in km
  date: string;
  time: string;
  amount: number;
  driverType: 'In' | 'Out';
  driverName: string;
  driverCost: number;
  profit: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
  status: 'Requested' | 'Confirmed' | 'Completed' | 'Cancelled';
  notes: string;
  createdAt: string;
}

interface FixedRoute {
  id: string;
  pickup: string;
  dropoff: string;
  price: number;
}

const CheckoutForm = ({ trip, onSucceed }: { trip: Trip; onSucceed: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: trip.amount,
          metadata: { tripId: trip.id, customerName: trip.customerName }
        }),
      });

      const { clientSecret, error: backendError } = await response.json();
      if (backendError) throw new Error(backendError);

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement) as any,
          billing_details: { name: trip.customerName },
        },
      });

      if (result.error) {
        setError(result.error.message || 'حدث خطأ في الدفع');
      } else if (result.paymentIntent.status === 'succeeded') {
        onSucceed();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#1A1A1A',
              '::placeholder': { color: '#A0A0A0' },
            },
          },
        }} />
      </div>
      {error && <div className="text-red-500 text-sm font-bold text-center">{error}</div>}
      <button
        disabled={!stripe || processing}
        className="w-full bg-gold text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            جاري المعالجة...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            دفع {trip.amount} BHD
          </>
        )}
      </button>
    </form>
  );
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Show a user-friendly alert for permission issues
  if (errInfo.error.includes('permission-denied') || errInfo.error.includes('insufficient permissions')) {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      alert('عذراً، يجب تفعيل البريد الإلكتروني الخاص بك لتتمكن من إجراء التعديلات. يرجى مراجعة بريدك الإلكتروني.');
    } else {
      alert('عذراً، ليس لديك الصلاحية الكافية للقيام بهذه العملية.');
    }
  }
  throw new Error(JSON.stringify(errInfo));
}

function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = (key: keyof typeof translations.ar) => translations[lang][key] || key;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isCustomerDashboardOpen, setIsCustomerDashboardOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<'fixed' | 'custom'>('fixed');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [customerTrips, setCustomerTrips] = useState<Trip[]>([]);
  const [paymentTrip, setPaymentTrip] = useState<Trip | null>(null);
  const [searchTripId, setSearchTripId] = useState('');
  const [isSearchingTrip, setIsSearchingTrip] = useState(false);
  const [isTranslating, setIsTranslating] = useState<string | null>(null);

  const translateText = async (text: string) => {
    if (!text || !text.trim()) return '';
    // Check if it's already English (basic check)
    if (/^[a-zA-Z0-9\s.,!?-]+$/.test(text)) {
      console.log('Text already English, skipping translation:', text.substring(0, 20));
      return text;
    }
    
    console.log('Translating text:', text.substring(0, 20));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following Arabic text to English. Return ONLY the translated text without quotes or extra explanation: "${text}"`,
      });
      const result = response.text?.trim() || text;
      console.log('Translation result:', result.substring(0, 20));
      return result;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || '');
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const safeUpdateDoc = async (docRef: any, data: any) => {
    try {
      await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docRef.path);
    }
  };

  const safeAddDoc = async (colRef: any, data: any) => {
    try {
      return await addDoc(colRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, colRef.path);
    }
  };

  const safeDeleteDoc = async (docRef: any) => {
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docRef.path);
    }
  };
  const [activeTab, setActiveTab] = useState<'content' | 'accounting' | 'branding' | 'pricing'>('content');
  const [isAdminScheduleView, setIsAdminScheduleView] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [isTripFormOpen, setIsTripFormOpen] = useState(false);
  const [tripFilter, setTripFilter] = useState<'all' | 'requested' | 'unpaid' | 'pending_price'>('all');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [tripFormData, setTripFormData] = useState<Partial<Trip>>({
    customerName: '',
    phone: '',
    passengers: 1,
    bags: 0,
    carType: 'Standard',
    direction: '',
    pickup: '',
    dropoff: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    amount: 0,
    driverType: 'In',
    driverName: '',
    driverCost: 0,
    paymentStatus: 'Pending',
    notes: ''
  });
  
  const [services, setServices] = useState<Service[]>([]);
  const [specializedServices, setSpecializedServices] = useState<SpecializedService[]>([]);
  const [fixedRoutes, setFixedRoutes] = useState<FixedRoute[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    heroTitle: 'Alhatab VIP Taxi',
    heroSubtitle: 'فخامة التنقل',
    heroDescription: 'نقدم لك أرقى خدمات التوصيل واللوميزين في مملكة البحرين وجميع دول الخليج.',
    heroImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1920',
    phone: '+973 32325997',
    whatsapp: '97332325997',
    notificationWhatsapp: '97332325997',
    footerAbout: 'نحن متخصصون في تقديم خدمات النقل العائلي والفاخر.',
    footerAddress: 'مملكة البحرين وجميع دول الخليج',
    instagram: '',
    tiktok: '',
    twitter: '',
    primaryColor: '#D4AF37',
    secondaryColor: '#1A1A1A',
    accentColor: '#F5F5F5',
    borderRadius: '1.5rem',
    adminEmails: ['ahjm91@gmail.com'],
    pricePerKm: 0.5,
    baseFee: 2,
    myFatoorahIsSandbox: true
  });

  // Handle payment redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successTripId = urlParams.get('pay_success');
    const errorTripId = urlParams.get('pay_error');

    if (successTripId) {
      // Update trip status to Paid
      safeUpdateDoc(doc(db, 'trips', successTripId), { 
        paymentStatus: 'Paid',
        status: 'Confirmed'
      }).then(() => {
        alert(lang === 'ar' ? 'تم الدفع بنجاح! شكراً لك.' : 'Payment successful! Thank you.');
        window.history.replaceState({}, '', window.location.pathname);
      });
    }

    if (errorTripId) {
      alert(lang === 'ar' ? 'حدث خطأ أثناء الدفع. يرجى المحاولة مرة أخرى.' : 'Payment failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [lang]);

  const [bookingData, setBookingData] = useState<BookingData>({
    customerName: '',
    phone: '',
    confirmPhone: '',
    pickup: '',
    dropoff: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    passengers: 1,
    bags: 0,
    carType: 'Standard',
    service: 'luxury'
  });

  // Automatic translation when switching to English
  useEffect(() => {
    console.log('Translation useEffect triggered. Lang:', lang, 'IsAdmin:', isAdmin, 'Services:', services.length);
    if (lang === 'en' && isAdmin) {
      const translateMissing = async () => {
        console.log('Starting missing translations check...');
        // Services
        for (const service of services) {
          if (!service.name_en || !service.description_en || !service.features_en) {
            console.log('Translating service:', service.name);
            const updates: any = {};
            if (!service.name_en) updates.name_en = await translateText(service.name);
            if (!service.description_en) updates.description_en = await translateText(service.description);
            if (!service.features_en && service.features) {
              const translatedFeatures = await Promise.all(
                service.features.map(f => translateText(f))
              );
              updates.features_en = translatedFeatures;
            }
            if (Object.keys(updates).length > 0) {
              console.log('Updating service in Firestore:', service.id, updates);
              await updateDoc(doc(db, 'services', service.id), updates);
            }
          }
        }
        // Specialized Services
        for (const service of specializedServices) {
          if (!service.title_en || !service.desc_en) {
            console.log('Translating specialized service:', service.title);
            const updates: any = {};
            if (!service.title_en) updates.title_en = await translateText(service.title);
            if (!service.desc_en) updates.desc_en = await translateText(service.desc);
            if (Object.keys(updates).length > 0) {
              console.log('Updating specialized service in Firestore:', service.id, updates);
              await updateDoc(doc(db, 'specialized_services', service.id), updates);
            }
          }
        }
        
        // Site Settings
        const settingsUpdates: any = {};
        if (!siteSettings.heroTitle_en) settingsUpdates.heroTitle_en = await translateText(siteSettings.heroTitle);
        if (!siteSettings.heroSubtitle_en) settingsUpdates.heroSubtitle_en = await translateText(siteSettings.heroSubtitle);
        if (!siteSettings.heroDescription_en) settingsUpdates.heroDescription_en = await translateText(siteSettings.heroDescription);
        if (!siteSettings.footerAbout_en) settingsUpdates.footerAbout_en = await translateText(siteSettings.footerAbout);
        if (!siteSettings.footerAddress_en) settingsUpdates.footerAddress_en = await translateText(siteSettings.footerAddress);
        
        if (Object.keys(settingsUpdates).length > 0) {
          console.log('Updating site settings in Firestore:', settingsUpdates);
          await updateDoc(doc(db, 'settings', 'site'), settingsUpdates);
        }

        console.log('Finished missing translations check.');
      };
      translateMissing();
    }
  }, [lang, isAdmin, services, specializedServices, siteSettings]);

  useEffect(() => {
    const checkAdmin = () => {
      const primaryAdmin = 'ahjm91@gmail.com';
      const isEmailMatch = user?.email === primaryAdmin || (siteSettings.adminEmails?.includes(user?.email || ''));
      setIsAdmin(!!isEmailMatch);
      setIsEmailVerified(!!user?.emailVerified);
    };
    checkAdmin();
  }, [user, siteSettings.adminEmails]);

  // Auth & Data Fetching
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        const primaryAdmin = 'ahjm91@gmail.com';
        const isEmailMatch = u.email === primaryAdmin || (siteSettings.adminEmails?.includes(u.email || ''));
        const isUserAdmin = isEmailMatch && u.emailVerified === true;

        // Sync profile
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newProfile: UserProfile = {
            uid: u.uid,
            name: u.displayName || 'عميل جديد',
            email: u.email || '',
            photoURL: u.photoURL || '',
            role: isUserAdmin ? 'admin' : 'customer',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
        } else {
          setUserProfile(userSnap.data() as UserProfile);
        }
        console.log('User status:', u.email, 'Verified:', u.emailVerified, 'IsAdmin:', isUserAdmin);
      } else {
        setUserProfile(null);
      }
    });

    const unsubscribeServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      console.log('Services updated from Firestore:', data);
      setServices(data);
    }, (error) => {
      console.error('Firestore services listener error:', error);
    });

    const unsubscribeSpecialized = onSnapshot(collection(db, 'specialized_services'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecializedService));
      console.log('Specialized Services updated from Firestore:', data);
      setSpecializedServices(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
    }, (error) => {
      console.error('Firestore specialized services listener error:', error);
    });

    const unsubscribeFixedRoutes = onSnapshot(collection(db, 'fixed_routes'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FixedRoute));
      setFixedRoutes(data);
    }, (error) => {
      console.error('Firestore fixed routes listener error:', error);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings(snapshot.data() as SiteSettings);
      }
    });

    // Handle auto-payment from URL
    const params = new URLSearchParams(window.location.search);
    const payId = params.get('pay');
    if (payId) {
      const fetchTrip = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'trips', payId));
          if (docSnap.exists()) {
            const trip = { id: docSnap.id, ...docSnap.data() } as Trip;
            if (trip.paymentStatus !== 'Paid' && trip.amount > 0) {
              setPaymentTrip(trip);
              setIsPaymentOpen(true);
            }
          }
        } catch (err) {
          console.error('Error fetching auto-pay trip:', err);
        }
      };
      fetchTrip();
    }

    let unsubscribeTrips = () => {};
    if (isAdmin) {
      unsubscribeTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
        setTrips(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      });
    } else if (user) {
      const q = query(collection(db, 'trips'), where('userId', '==', user.uid));
      unsubscribeTrips = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
        setCustomerTrips(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      });
    }

    return () => {
      unsubscribeAuth();
      unsubscribeServices();
      unsubscribeSpecialized();
      unsubscribeSettings();
      unsubscribeTrips();
    };
  }, [isAdmin, user]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Auto-fix broken specialized service images and missing order
  useEffect(() => {
    if (isAdmin && specializedServices.length > 0) {
      // Fix images
      const brokenQatar = [
        'https://images.unsplash.com/photo-1594841763055-6693f0c003cb?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1578891752244-dd7d675bc914?auto=format&fit=crop&q=80&w=800'
      ];
      const brokenKuwait = [
        'https://images.unsplash.com/photo-1516640997890-5026049981f6?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1554254114-f16668702f3c?auto=format&fit=crop&q=80&w=800'
      ];
      
      const qatar = specializedServices.find(s => brokenQatar.includes(s.image));
      if (qatar) {
        updateDoc(doc(db, 'specialized_services', qatar.id), {
          image: 'https://picsum.photos/seed/qatar/800/600'
        });
      }
      
      const kuwait = specializedServices.find(s => brokenKuwait.includes(s.image));
      if (kuwait) {
        updateDoc(doc(db, 'specialized_services', kuwait.id), {
          image: 'https://picsum.photos/seed/kuwait/800/600'
        });
      }

      // Fix missing order
      const missingOrder = specializedServices.some(s => s.order === undefined);
      if (missingOrder) {
        specializedServices.forEach((s, i) => {
          if (s.order === undefined) {
            updateDoc(doc(db, 'specialized_services', s.id), { order: i });
          }
        });
      }
    }
  }, [isAdmin, specializedServices]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleImageUpload = async (file: File, collectionName: string, docId: string, fieldName: string = 'image') => {
    if (!isAdmin) {
      console.warn('Upload attempt by non-admin or unverified user');
      alert('عذراً، يجب أن تكون مسجلاً بحساب المدير (ahjm91@gmail.com) وأن يكون البريد الإلكتروني مفعلاً للقيام بهذه العملية.');
      return;
    }
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)');
      return;
    }
    setIsUploading(docId + fieldName);
    try {
      console.log('Starting upload for:', file.name, 'to', collectionName, 'docId:', docId, 'field:', fieldName);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storageRef = ref(storage, `${collectionName}/${docId}/${Date.now()}_${sanitizedName}`);
      
      console.log('Uploading bytes...');
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload successful, snapshot:', snapshot);
      
      console.log('Getting download URL...');
      const url = await getDownloadURL(storageRef);
      console.log('Generated download URL:', url);
      
      console.log('Updating Firestore document...');
      await updateDoc(doc(db, collectionName, docId), { [fieldName]: url });
      console.log('Firestore updated successfully');
      alert('تم رفع الصورة بنجاح!');
    } catch (error: any) {
      console.error('Upload failed error details:', error);
      let errorMsg = 'فشل رفع الصورة، يرجى المحاولة مرة أخرى.';
      if (error.code === 'storage/unauthorized') {
        errorMsg = 'غير مصرح لك برفع الصور. يرجى التأكد من تسجيل الدخول بحساب المدير وأن البريد الإلكتروني مفعل.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMsg = 'تم تجاوز حصة التخزين المتاحة.';
      } else if (error.message) {
        errorMsg += `\nالتفاصيل: ${error.message}`;
      }
      alert(errorMsg);
    } finally {
      setIsUploading(null);
    }
  };

  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firestore connection...');
      await getDoc(doc(db, 'settings', 'site'));
      console.log('Firestore connection OK');
      
      console.log('Testing Storage connection...');
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      if (!isAdmin) {
        throw new Error(`حسابك (${user.email}) غير مفعل كمدير أو البريد غير مفعل. تواصل مع المطور.`);
      }
      
      const testRef = ref(storage, `test/${user.uid}_test.txt`);
      const blob = new Blob(['test'], { type: 'text/plain' });
      await uploadBytes(testRef, blob);
      console.log('Storage connection OK');
      
      alert('الاتصال بـ Firebase يعمل بشكل صحيح (Firestore & Storage)!');
    } catch (error: any) {
      console.error('Firebase connection test failed:', error);
      alert(`فشل اختبار الاتصال: ${error.message}\nالكود: ${error.code || 'N/A'}`);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate phone confirmation
      if (bookingData.phone !== bookingData.confirmPhone) {
        alert(lang === 'ar' ? 'رقم الهاتف غير متطابق، يرجى التأكد من كتابة نفس الرقم في الخانتين.' : 'Phone numbers do not match.');
        return;
      }

      // Determine if it's a custom booking or fixed
      const isCustom = bookingMode === 'custom';
      
      // Check for fixed price if not in custom mode
      const matchedRoute = !isCustom ? fixedRoutes.find(r => 
        r.pickup.trim().toLowerCase() === bookingData.pickup.trim().toLowerCase() && 
        r.dropoff.trim().toLowerCase() === bookingData.dropoff.trim().toLowerCase()
      ) : null;
      
      const finalAmount = matchedRoute ? matchedRoute.price : (bookingData.amount || 0);

      // Save to Firestore first
      const tripData: Omit<Trip, 'id'> = {
        userId: user?.uid || null,
        customerName: bookingData.customerName,
        phone: bookingData.phone,
        passengers: bookingData.passengers,
        bags: bookingData.bags,
        carType: bookingData.carType,
        direction: `${bookingData.pickup} ← ${bookingData.dropoff}`,
        pickup: bookingData.pickup,
        dropoff: bookingData.dropoff,
        distance: bookingData.distance || 0,
        date: bookingData.date,
        time: bookingData.time,
        amount: Number(finalAmount) || 0,
        driverType: 'In',
        driverName: '',
        driverCost: 0,
        profit: Number(finalAmount) || 0,
        paymentStatus: 'Pending',
        status: Number(finalAmount) > 0 ? 'Confirmed' : 'Requested',
        notes: isCustom ? 'طلب حجز مخصص' : (matchedRoute ? 'حجز تلقائي (سعر ثابت)' : 'حجز عبر الموقع'),
        createdAt: new Date().toISOString()
      };

      // Start saving to Firestore
      const docRef = await safeAddDoc(collection(db, 'trips'), tripData);
      if (!docRef) {
        throw new Error('Failed to save trip to database');
      }
      const newTrip = { id: docRef.id, ...tripData } as Trip;
      
      // Notify Admin via Email
      fetch('/api/notify-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrip)
      })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error('Email notification server error:', res.status, errData);
        }
      })
      .catch(emailErr => {
        console.error('Failed to send email notification (Network Error):', emailErr);
        if (emailErr instanceof Error) {
          console.error('Error details:', {
            message: emailErr.message,
            stack: emailErr.stack,
            url: '/api/notify-booking'
          });
        }
      });

      // WhatsApp Message Construction
      const adminMessage = `🔔 *حجز جديد من الموقع*\n\n` +
                           `👤 العميل: ${bookingData.customerName}\n` +
                           `📞 الهاتف: ${bookingData.phone}\n` +
                           `📍 المسار: ${bookingData.pickup} ← ${bookingData.dropoff}\n` +
                           `📅 التاريخ: ${bookingData.date}\n` +
                           `🕒 الوقت: ${bookingData.time}\n` +
                           `👥 الركاب: ${bookingData.passengers}\n` +
                           `🚘 نوع السيارة: ${bookingData.carType}\n` +
                           `💰 السعر: ${newTrip.amount > 0 ? newTrip.amount + ' BHD' : 'بانتظار التسعير'}\n` +
                           `🔗 يرجى الدخول للوحة التحكم للمتابعة.`;
      
      const adminWhatsapp = siteSettings.notificationWhatsapp || siteSettings.whatsapp;
      const whatsappUrl = `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(adminMessage)}`;

      // Redirect to payment if amount > 0
      if (newTrip.amount > 0) {
        const confirmPay = window.confirm(lang === 'ar' 
          ? 'تم تسجيل طلبك. هل تريد الدفع الآن إلكترونياً لتأكيد الحجز؟' 
          : 'Your request is recorded. Do you want to pay online now to confirm?');
        
        if (confirmPay) {
          if (siteSettings.myFatoorahToken) {
            const response = await fetch('/api/myfatoorah/execute-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: newTrip.amount,
                customerName: newTrip.customerName,
                phone: newTrip.phone,
                tripId: docRef.id,
                isSandbox: siteSettings.myFatoorahIsSandbox,
                token: siteSettings.myFatoorahToken
              })
            });
            const data = await response.json();
            if (data.paymentUrl) {
              window.open(data.paymentUrl, '_blank');
              return;
            }
          } else {
            setPaymentTrip(newTrip);
            setIsPaymentOpen(true);
            return;
          }
        }
      }

      // If no payment or amount is 0, redirect to WhatsApp
      alert(lang === 'ar' ? 'تم استلام طلبك بنجاح! سيتم تحويلك الآن لتأكيد الحجز عبر واتساب.' : 'Your request has been received successfully! Redirecting to WhatsApp...');
      
      setBookingData({
        customerName: '',
        phone: '',
        confirmPhone: '',
        pickup: '',
        dropoff: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        passengers: 1,
        bags: 0,
        carType: 'Standard',
        service: 'luxury'
      });
        
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Booking failed:', error);
      alert(lang === 'ar' ? 'فشل إرسال الطلب، يرجى المحاولة مرة أخرى.' : 'Booking failed, please try again.');
    }
  };

  // Seed Database Function
  const seedDatabase = async () => {
    if (!isAdmin) return;
    
    // Seed Services
    const initialServices = [
      {
        name: 'سيارة عائلية فاخرة',
        name_en: 'Luxury Family Car',
        description: 'نحن في Alhatab VIP Taxi نفخر بتقديم أسطول من السيارات العائلية الحديثة والمريحة، المصممة خصيصاً لتناسب السفرات الطويلة والرحلات البرية. سياراتنا ملائمة تماماً للجلوس لفترات طويلة، حيث توفر مساحة واسعة تتسع لـ 7-8 ركاب براحة تامة، مع مساحة كبيرة للأمتعة ونظام ترفيهي متكامل لضمان استمتاعكم بكل لحظة.',
        description_en: 'At Alhatab VIP Taxi, we are proud to offer a fleet of modern and comfortable family cars, specifically designed for long trips and road travel. Our cars are perfectly suited for long sitting periods, providing ample space for 7-8 passengers in complete comfort, with large luggage space and an integrated entertainment system to ensure you enjoy every moment.',
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
        features: [
          '7-8 ركاب براحة تامة',
          'مساحة كبيرة للأمتعة',
          'نظام تكييف هواء ممتاز',
          'سائقين ذوي خبرة عالية',
          'تغطية كاملة لجميع المدن',
          'نظام ترفيهي متكامل',
          'خدمة VIP خاصة'
        ],
        features_en: [
          '7-8 passengers in complete comfort',
          'Large luggage space',
          'Excellent air conditioning system',
          'Highly experienced drivers',
          'Full coverage of all cities',
          'Integrated entertainment system',
          'Special VIP service'
        ]
      }
    ];

    for (const s of initialServices) {
      await addDoc(collection(db, 'services'), s);
    }

    // Seed Specialized Services
    const initialSpecialized = [
      {
        title: 'توصيل واستقبال المطار',
        title_en: 'Airport Pickup & Dropoff',
        desc: 'خدمة راقية من وإلى جميع مطارات دول الخليج العربي، مع استقبال خاص في صالات الانتظار ومتابعة دقيقة لمواعيد الرحلات.',
        desc_en: 'Premium service to and from all airports in the Arabian Gulf countries, with special reception in waiting lounges and precise flight schedule monitoring.',
        iconName: 'Clock',
        image: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=800',
        order: 0
      },
      {
        title: 'رحلات دبي',
        title_en: 'Dubai Trips',
        desc: 'احجز رحلتك أنت وعائلتك من وإلى دبي بأحدث السيارات الفاخرة، واستمتع بسفر بري مريح وآمن.',
        desc_en: 'Book your trip for you and your family to and from Dubai with the latest luxury cars, and enjoy comfortable and safe land travel.',
        iconName: 'MapPin',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800',
        order: 1
      },
      {
        title: 'رحلات أبو ظبي',
        title_en: 'Abu Dhabi Trips',
        desc: 'احجز رحلتك من وإلى أبو ظبي مع Alhatab VIP Taxi، حيث الراحة والرفاهية في كل كيلومتر.',
        desc_en: 'Book your trip to and from Abu Dhabi with Alhatab VIP Taxi, where comfort and luxury are in every kilometer.',
        iconName: 'MapPin',
        image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800',
        order: 2
      },
      {
        title: 'رحلات قطر',
        title_en: 'Qatar Trips',
        desc: 'استمتع برحلة دولية فاخرة إلى الدوحة، مع إطلالات بانورامية على أفق المدينة الحديث والخليج الغربي.',
        desc_en: 'Enjoy a luxury international trip to Doha, with panoramic views of the modern city skyline and the West Bay.',
        iconName: 'MapPin',
        image: 'https://picsum.photos/seed/qatar/800/600',
        order: 3
      },
      {
        title: 'رحلات الكويت',
        title_en: 'Kuwait Trips',
        desc: 'رحلات برية مباشرة إلى دولة الكويت، نصل بك إلى قلب العاصمة مع إطلالة على أبراج الكويت الشهيرة.',
        desc_en: 'Direct road trips to the State of Kuwait, we take you to the heart of the capital with a view of the famous Kuwait Towers.',
        iconName: 'MapPin',
        image: 'https://picsum.photos/seed/kuwait/800/600',
        order: 4
      },
      {
        title: 'رحلات مكة والمدينة',
        title_en: 'Makkah & Madinah Trips',
        desc: 'احجز رحلاتك للمدينة المنورة ومكة المكرمة، نوفر لك أقصى درجات الراحة والسكينة في رحلتك الإيمانية.',
        desc_en: 'Book your trips to Madinah and Makkah, we provide you with the highest levels of comfort and serenity in your spiritual journey.',
        iconName: 'Star',
        image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=800',
        order: 5
      },
      {
        title: 'المناسبات والفعاليات',
        title_en: 'Events & Occasions',
        desc: 'نوفر أسطولاً فاخرًا لخدمة ضيوفكم في الأفراح، المؤتمرات، والفعاليات الرسمية، مع سائقين بزي رسمي وخدمة VIP.',
        desc_en: 'We provide a luxury fleet to serve your guests in weddings, conferences, and official events, with drivers in official uniform and VIP service.',
        iconName: 'Users',
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
        order: 6
      },
      {
        title: 'رحلات العراق',
        title_en: 'Iraq Trips',
        desc: 'توصيل بري آمن إلى العراق، نأخذك في رحلة مريحة لاستكشاف المعالم التاريخية والعمرانية العريقة في بغداد.',
        desc_en: 'Safe land transportation to Iraq, we take you on a comfortable trip to explore the ancient historical and architectural landmarks in Baghdad.',
        iconName: 'MapPin',
        image: 'https://images.unsplash.com/photo-1528132599739-df63974b7735?auto=format&fit=crop&q=80&w=800',
        order: 7
      },
      {
        title: 'جولات الأحساء السياحية',
        title_en: 'Al Ahsa Sightseeing Tours',
        desc: 'اكتشف سحر الأحساء وتراثها العمراني الفريد، من جبل القارة إلى المزارع الخلابة والمعالم التاريخية.',
        desc_en: 'Discover the charm of Al Ahsa and its unique architectural heritage, from Al Qarah Mountain to the picturesque farms and historical landmarks.',
        iconName: 'Camera',
        image: 'https://images.unsplash.com/photo-1647166545674-ce28ce93bdca?auto=format&fit=crop&q=80&w=800',
        order: 8
      },
      {
        title: 'تسوق المنطقة الشرقية',
        title_en: 'Eastern Province Shopping',
        desc: 'رحلات تسوق عصرية إلى أرقى مولات الخبر والدمام، حيث الطابع التجاري الحديث والرفاهية المطلقة.',
        desc_en: 'Modern shopping trips to the finest malls in Khobar and Dammam, where modern commercial character and absolute luxury meet.',
        iconName: 'ShoppingBag',
        image: 'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?auto=format&fit=crop&q=80&w=800',
        order: 9
      },
      {
        title: 'رحلات الأردن',
        title_en: 'Jordan Trips',
        desc: 'رحلات برية مميزة إلى المملكة الأردنية الهاشمية، نصل بك إلى عمان والبتراء مع توفير أعلى سبل الراحة والأمان.',
        desc_en: 'Special road trips to the Hashemite Kingdom of Jordan, we take you to Amman and Petra with the highest levels of comfort and safety.',
        iconName: 'MapPin',
        image: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&q=80&w=800',
        order: 10
      },
      {
        title: 'رحلات عمان',
        title_en: 'Oman Trips',
        desc: 'استكشف جمال سلطنة عمان معنا، رحلات دولية مريحة إلى مسقط وصلالة عبر أحدث السيارات الفاخرة.',
        desc_en: 'Explore the beauty of the Sultanate of Oman with us, comfortable international trips to Muscat and Salalah with the latest luxury cars.',
        iconName: 'MapPin',
        image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800',
        order: 11
      }
    ];

    for (const s of initialSpecialized) {
      // Use a consistent ID based on the title to allow updates without duplicates
      const docId = s.title.replace(/\s+/g, '_').toLowerCase();
      await setDoc(doc(db, 'specialized_services', docId), s);
    }

    // Seed Settings
    await setDoc(doc(db, 'settings', 'site'), {
      heroTitle: 'Alhatab VIP Taxi',
      heroTitle_en: 'Alhatab VIP Taxi',
      heroSubtitle: 'فخامة التنقل',
      heroSubtitle_en: 'Luxury Mobility',
      heroDescription: 'نقدم لك أرقى خدمات التوصيل واللوميزين في مملكة البحرين وجميع دول الخليج. دقة في المواعيد، رفاهية مطلقة، وسائقون محترفون.',
      heroDescription_en: 'We offer you the finest delivery and limousine services in the Kingdom of Bahrain and all GCC countries. Punctuality, absolute luxury, and professional drivers.',
      heroImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1920',
      phone: '+973 32325997',
      whatsapp: '97332325997',
      logo: '',
      instagram: '',
      tiktok: '',
      twitter: '',
      primaryColor: '#D4AF37', // Gold
      secondaryColor: '#1A1A1A', // Dark
      accentColor: '#F5F5F5', // Light Gray
      borderRadius: '1.5rem',
      footerAbout: 'نحن متخصصون في تقديم خدمات النقل العائلي والفاخر، مع التركيز على الراحة والأمان في السفرات الطويلة بين مدن المملكة ودول الخليج.',
      footerAbout_en: 'We specialize in providing family and luxury transportation services, focusing on comfort and safety in long trips between the cities of the Kingdom and the GCC countries.',
      footerAddress: 'مملكة البحرين وجميع دول الخليج',
      footerAddress_en: 'Kingdom of Bahrain and all GCC countries'
    });

    alert('تم تهيئة قاعدة البيانات بنجاح!');
  };

  const moveSpecializedService = async (index: number, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= specializedServices.length) return;

    const current = specializedServices[index];
    const target = specializedServices[newIndex];

    try {
      // Use a batch or sequential updates to swap orders
      await updateDoc(doc(db, 'specialized_services', current.id), { order: newIndex });
      await updateDoc(doc(db, 'specialized_services', target.id), { order: index });
    } catch (error) {
      console.error('Error reordering services:', error);
    }
  };

  const handleSendWhatsAppSummary = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const tomorrowTrips = trips.filter(t => t.date === tomorrowStr);
    
    if (tomorrowTrips.length === 0) {
      alert('لا توجد رحلات مسجلة ليوم غد ' + tomorrowStr);
      return;
    }

    let message = `*تقرير رحلات غد (${tomorrowStr})*\n\n`;
    
    tomorrowTrips.forEach((trip, index) => {
      message += `*${index + 1}. رحلة رقم:* ${trip.id.slice(-6).toUpperCase()}\n`;
      message += `👤 *العميل:* ${trip.customerName}\n`;
      message += `📞 *الهاتف:* ${trip.phone}\n`;
      message += `📍 *المسار:* ${trip.direction}\n`;
      message += `🕒 *الوقت:* ${trip.time}\n`;
      message += `💰 *المبلغ:* ${trip.amount} BHD\n`;
      message += `💳 *الحالة:* ${trip.paymentStatus === 'Paid' ? '✅ مدفوع' : '❌ غير مدفوع'}\n`;
      message += `------------------\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = siteSettings.notificationWhatsapp || siteSettings.whatsapp;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleSendEmailSchedule = async () => {
    const today = new Date().toISOString().split('T')[0];
    const upcomingTrips = trips.filter(t => t.date >= today);

    if (upcomingTrips.length === 0) {
      alert('لا توجد رحلات قادمة لإرسالها.');
      return;
    }

    try {
      const response = await fetch('/api/send-full-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trips: upcomingTrips })
      });

      if (response.ok) {
        alert('تم إرسال جدول الرحلات القادمة إلى بريدك الإلكتروني بنجاح.');
      } else {
        const err = await response.json();
        alert(`فشل إرسال الإيميل: ${err.error || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('Email schedule failed:', error);
      alert('حدث خطأ أثناء محاولة إرسال الإيميل.');
    }
  };

  const handleSaveTrip = async () => {
    if (!isAdmin) return;
    
    const amount = Number(tripFormData.amount) || 0;
    const driverCost = Number(tripFormData.driverCost) || 0;
    const profit = amount - driverCost;
    
    const data = {
      ...tripFormData,
      amount,
      driverCost,
      profit,
      createdAt: editingTrip ? editingTrip.createdAt : new Date().toISOString()
    };

    const path = 'trips';
    try {
      if (editingTrip) {
        await safeUpdateDoc(doc(db, path, editingTrip.id), data);
      } else {
        await safeAddDoc(collection(db, path), data);
      }
      setIsTripFormOpen(false);
      setEditingTrip(null);
      setTripFormData({
        customerName: '',
        phone: '',
        passengers: 1,
        bags: 0,
        carType: 'Standard',
        direction: '',
        pickup: '',
        dropoff: '',
        distance: 0,
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        amount: 0,
        driverType: 'In',
        driverName: '',
        driverCost: 0,
        paymentStatus: 'Pending',
        status: 'Requested',
        notes: ''
      });
    } catch (error: any) {
      const errInfo = {
        error: error.message,
        operationType: editingTrip ? 'update' : 'create',
        path: editingTrip ? `${path}/${editingTrip.id}` : path,
        authInfo: {
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
        }
      };
      console.error('Firestore Error:', JSON.stringify(errInfo));
      alert('حدث خطأ أثناء حفظ البيانات. يرجى التحقق من الصلاحيات.');
    }
  };

  const handleSaveSettings = async () => {
    if (!isAdmin) return;
    try {
      await safeUpdateDoc(doc(db, 'settings', 'site'), siteSettings);
      alert(lang === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(lang === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    }
  };

  const exportTripsToCSV = () => {
    const headers = [
      'Trip ID', 'Customer Name', 'Phone', 'Passengers', 'Bags', 
      'Direction', 'Pickup', 'Drop-off', 'Date', 'Time', 
      'Amount (BHD)', 'Driver Type', 'Driver Name', 'Driver Cost (BHD)', 
      'Profit (BHD)', 'Payment Status', 'Notes'
    ];

    const rows = trips.map(t => [
      t.id, t.customerName, t.phone, t.passengers, t.bags,
      t.direction, t.pickup, t.dropoff, t.date, t.time,
      t.amount, t.driverType, t.driverName, t.driverCost,
      t.profit, t.paymentStatus, t.notes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trips_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-gold/30">
      <style>{`
        :root {
          --primary: ${siteSettings.primaryColor || '#D4AF37'};
          --secondary: ${siteSettings.secondaryColor || '#0A0A0A'};
          --accent: ${siteSettings.accentColor || '#F5F5F5'};
          --radius: ${siteSettings.borderRadius || '1.5rem'};
        }
        .rounded-custom { border-radius: var(--radius); }
        .rounded-custom-xl { border-radius: calc(var(--radius) * 1.5); }
        .rounded-custom-2xl { border-radius: calc(var(--radius) * 2); }
      `}</style>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              {siteSettings.logo ? (
                <img 
                  src={siteSettings.logo} 
                  alt="Logo" 
                  className="h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <>
                  <div className="w-10 h-10 bg-dark rounded-xl flex items-center justify-center">
                    <Car className="text-gold w-6 h-6" />
                  </div>
                  <span className="text-xl font-bold tracking-tighter text-dark uppercase">Alhatab VIP Taxi</span>
                </>
              )}
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 text-dark font-bold hover:bg-gray-100 transition-all border border-gray-200"
              >
                {lang === 'ar' ? 'English' : 'العربية'}
              </button>
              <a href="#" className="text-gray-600 hover:text-dark transition-colors">{t('home')}</a>
              <a href="#services" className="text-gray-600 hover:text-dark transition-colors">{t('services')}</a>
              <a href="#specialized-services" className="text-gray-600 hover:text-dark transition-colors">{t('specializedServices')}</a>
              <a href="#about" className="text-gray-600 hover:text-dark transition-colors">{t('whyUs')}</a>
              <button 
                onClick={() => setIsPaymentOpen(true)}
                className="flex items-center gap-2 text-dark font-bold hover:text-gold transition-colors"
              >
                <Wallet className="w-5 h-5" />
                {t('payTrip')}
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setIsDashboardOpen(true)}
                  className="flex items-center gap-2 text-gold font-bold hover:text-gold/80 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  {t('dashboard')}
                </button>
              )}
              {user && !isAdmin && (
                <button 
                  onClick={() => setIsCustomerDashboardOpen(true)}
                  className="flex items-center gap-2 text-gold font-bold hover:text-gold/80 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  {t('customerDashboard')}
                </button>
              )}
              {!user ? (
                <button 
                  onClick={handleLogin}
                  className="bg-dark text-white px-6 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-all"
                >
                  {t('login')}
                </button>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
              {siteSettings.instagram && (
                <a 
                  href={siteSettings.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-pink-600 transition-colors"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {siteSettings.tiktok && (
                <a 
                  href={siteSettings.tiktok} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  <Share2 className="w-6 h-6" />
                </a>
              )}
              {siteSettings.twitter && (
                <a 
                  href={siteSettings.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Twitter className="w-6 h-6" />
                </a>
              )}
              <a 
                href="#booking-form" 
                className="bg-dark text-white px-6 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-all"
              >
                {t('bookNow')}
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden overflow-y-auto"
          >
            <div className="flex flex-col gap-6 text-xl font-medium">
              <div className="flex justify-center mb-4">
                {siteSettings.logo ? (
                  <img src={siteSettings.logo} alt="Logo" className="h-20 w-auto object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-dark rounded-2xl flex items-center justify-center">
                    <Car className="text-gold w-10 h-10" />
                  </div>
                )}
              </div>
              <a href="#" onClick={() => setIsMenuOpen(false)}>{t('home')}</a>
              <a href="#services" onClick={() => setIsMenuOpen(false)}>{t('services')}</a>
              <a href="#specialized-services" onClick={() => setIsMenuOpen(false)}>{t('specializedServices')}</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)}>{t('whyUs')}</a>
              <a 
                href="#booking-form" 
                className="bg-dark text-white w-full py-4 rounded-2xl text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('bookNow')}
              </a>
              {siteSettings.instagram && (
                <a 
                  href={siteSettings.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-pink-600 font-bold py-4 border-2 border-pink-100 rounded-2xl"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Instagram className="w-6 h-6" />
                  {lang === 'ar' ? 'تابعنا على انستقرام' : 'Follow us on Instagram'}
                </a>
              )}
              {siteSettings.tiktok && (
                <a 
                  href={siteSettings.tiktok} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-black font-bold py-4 border-2 border-gray-100 rounded-2xl"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Share2 className="w-6 h-6" />
                  {lang === 'ar' ? 'تابعنا على تيك توك' : 'Follow us on TikTok'}
                </a>
              )}
              {siteSettings.twitter && (
                <a 
                  href={siteSettings.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-gray-900 font-bold py-4 border-2 border-gray-100 rounded-2xl"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Twitter className="w-6 h-6" />
                  {lang === 'ar' ? 'تابعنا على منصة X' : 'Follow us on X'}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div 
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${siteSettings.heroImage})` }}
        />
        <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] -z-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gold/5 -skew-x-12 transform translate-x-1/4 -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-dark mb-6">
                {lang === 'ar' ? siteSettings.heroTitle : (siteSettings.heroTitle_en || siteSettings.heroTitle)} <br />
                <span className="text-gold">{lang === 'ar' ? siteSettings.heroSubtitle : (siteSettings.heroSubtitle_en || siteSettings.heroSubtitle)}</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                {lang === 'ar' ? siteSettings.heroDescription : (siteSettings.heroDescription_en || siteSettings.heroDescription)}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white shadow-sm border border-gray-100 px-4 py-2 rounded-full">
                  <ShieldCheck className="text-green-500 w-5 h-5" />
                  <span className="text-sm font-medium">{t('safeTrips')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white shadow-sm border border-gray-100 px-4 py-2 rounded-full">
                  <Clock3 className="text-blue-500 w-5 h-5" />
                  <span className="text-sm font-medium">{t('available247')}</span>
                </div>
              </div>
            </motion.div>

            {/* Booking Card */}
            <motion.div
              id="booking-form"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-[2.5rem] shadow-2xl shadow-dark/5 border border-gray-100 overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                <button 
                  onClick={() => setBookingMode('fixed')}
                  className={cn(
                    "flex-1 py-5 text-sm font-black transition-all flex items-center justify-center gap-2",
                    bookingMode === 'fixed' ? "bg-gold text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  )}
                >
                  <Star className="w-4 h-4" />
                  {t('fixedBooking')}
                </button>
                <button 
                  onClick={() => setBookingMode('custom')}
                  className={cn(
                    "flex-1 py-5 text-sm font-black transition-all flex items-center justify-center gap-2",
                    bookingMode === 'custom' ? "bg-gold text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  )}
                >
                  <MapPin className="w-4 h-4" />
                  {t('customBooking')}
                </button>
              </div>

              <form 
                onSubmit={handleBookingSubmit}
                className="p-8 lg:p-10 space-y-6"
              >
                <div className="space-y-4">
                  {bookingMode === 'fixed' ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <select 
                          required
                          className="w-full bg-gold/5 border-gold/20 text-dark rounded-2xl py-5 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-black text-lg appearance-none"
                          onChange={e => {
                            const route = fixedRoutes.find(r => r.id === e.target.value);
                            if (route) {
                              setBookingData({
                                ...bookingData,
                                pickup: route.pickup,
                                dropoff: route.dropoff
                              });
                            }
                          }}
                        >
                          <option value="">{t('selectDropoff')}</option>
                          {fixedRoutes.map(route => (
                            <option key={route.id} value={route.id}>
                              {route.pickup} ← {route.dropoff} ({route.price} {t('bhd')})
                            </option>
                          ))}
                        </select>
                        <ChevronRight className="absolute left-6 top-1/2 -translate-y-1/2 text-gold w-5 h-5 rotate-90 pointer-events-none" />
                      </div>
                      <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <CreditCard className="text-green-600 w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-green-700 uppercase">{t('fixedPrice')}</p>
                          <p className="text-sm font-bold text-dark">{t('paymentSecure')}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder={t('pickup')}
                          required
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-gold/20 transition-all"
                          value={bookingData.pickup}
                          onChange={e => setBookingData({...bookingData, pickup: e.target.value})}
                        />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gold w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder={t('dropoff')}
                          required
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-gold/20 transition-all"
                          value={bookingData.dropoff}
                          onChange={e => setBookingData({...bookingData, dropoff: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <Car className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <select 
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-gold/20 transition-all appearance-none font-bold"
                            value={bookingData.carType}
                            onChange={e => setBookingData({...bookingData, carType: e.target.value as any})}
                          >
                            <option value="Standard">{lang === 'ar' ? 'عادي' : 'Standard'}</option>
                            <option value="VIP">VIP</option>
                            <option value="Van">{lang === 'ar' ? 'فان' : 'Van'}</option>
                          </select>
                        </div>
                        <div className="relative">
                          <ShoppingBag className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input 
                            type="number" 
                            min="0"
                            placeholder={lang === 'ar' ? 'الشنط' : 'Bags'}
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-gold/20 transition-all font-bold"
                            value={bookingData.bags}
                            onChange={e => setBookingData({...bookingData, bags: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      </div>

                      {bookingData.amount ? (
                        <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <DollarSign className="text-gold w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gold uppercase">{lang === 'ar' ? 'السعر المقدر' : 'Estimated Price'}</p>
                              <p className="text-sm font-bold text-dark">{bookingData.distance} كم</p>
                            </div>
                          </div>
                          <div className="text-xl font-black text-gold">
                            {bookingData.amount} BHD
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Clock className="text-blue-600 w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-blue-700 uppercase">{t('priceOnRequest')}</p>
                            <p className="text-sm font-bold text-dark">{t('priceOnRequestDesc')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder={t('customerName')}
                        required
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-gold/20 transition-all"
                        value={bookingData.customerName}
                        onChange={e => setBookingData({...bookingData, customerName: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="tel" 
                        placeholder={t('phone')}
                        required
                        className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-gold/20 transition-all"
                        value={bookingData.phone}
                        onChange={e => setBookingData({...bookingData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="tel" 
                      placeholder={t('confirmPhone')}
                      required
                      className={cn(
                        "w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 transition-all",
                        bookingData.confirmPhone && bookingData.phone !== bookingData.confirmPhone 
                          ? "ring-2 ring-red-500/50" 
                          : "focus:ring-gold/20"
                      )}
                      value={bookingData.confirmPhone}
                      onChange={e => setBookingData({...bookingData, confirmPhone: e.target.value})}
                    />
                    {bookingData.confirmPhone && bookingData.phone !== bookingData.confirmPhone && (
                      <p className="text-[10px] text-red-500 mt-1 mr-4 font-bold">{t('phoneMismatch')}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input 
                      type="date" 
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-gold/20 transition-all"
                      value={bookingData.date}
                      onChange={e => setBookingData({...bookingData, date: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="time" 
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-gold/20 transition-all"
                      value={bookingData.time}
                      onChange={e => setBookingData({...bookingData, time: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-dark text-white py-5 rounded-2xl font-black text-lg hover:bg-gray-800 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 shadow-xl shadow-dark/10"
                >
                  {bookingMode === 'fixed' ? (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {t('confirmBooking')}
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      {t('sendRequest')}
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-gray-400 font-bold">
                  {bookingMode === 'fixed' 
                    ? (lang === 'ar' ? '* سيتم حفظ بياناتك وتحويلك لبوابة الدفع الآمنة' : '* Your data will be saved and you will be redirected to the secure payment gateway')
                    : (lang === 'ar' ? '* سيتم مراجعة طلبك وإرسال السعر عبر الواتساب' : '* Your request will be reviewed and the price will be sent via WhatsApp')}
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">{lang === 'ar' ? 'خدماتنا المتميزة' : 'Our Premium Services'}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {lang === 'ar' 
                ? 'نقدم لكم تجربة سفر بري فريدة من نوعها، تجمع بين الفخامة والراحة لضمان وصولكم ووصول عائلتكم بكل أمان وسعادة.'
                : 'We offer a unique land travel experience, combining luxury and comfort to ensure you and your family arrive safely and happily.'}
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-8 max-w-3xl mx-auto">
            {services.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 group"
              >
                <div className="relative h-64 overflow-hidden bg-gray-200">
                  <img 
                    key={service.image}
                    src={service.image} 
                    alt={service.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Image load error (main services):', service.image);
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/broken/800/600';
                    }}
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-3">
                    {lang === 'ar' ? service.name : (service.name_en || service.name)}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {lang === 'ar' ? service.description : (service.description_en || service.description)}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {(lang === 'ar' ? service.features : (service.features_en || service.features)).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a 
                    href={`https://wa.me/97332325997?text=${encodeURIComponent(lang === 'ar' ? `أرغب في الاستفسار عن تفاصيل خدمة: ${service.name}` : `I would like to inquire about service details: ${service.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl border-2 border-dark font-bold hover:bg-dark hover:text-white transition-all text-center block"
                  >
                    {lang === 'ar' ? 'تفاصيل الخدمة' : 'Service Details'}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialized Services Section */}
      <section id="specialized-services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">{t('specializedServices')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {lang === 'ar'
                ? 'نقدم حلول نقل متكاملة تلبي كافة احتياجاتكم في مملكة البحرين وجميع دول الخليج، مع الالتزام التام بأعلى معايير الجودة.'
                : 'We provide integrated transportation solutions that meet all your needs in the Kingdom of Bahrain and all GCC countries, with full commitment to the highest quality standards.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {specializedServices.map((service, idx) => {
              const Icon = {
                Clock, MapPin, Star, Users, Camera, ShoppingBag
              }[service.iconName] || MapPin;

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-gray-50 rounded-[2.5rem] overflow-hidden hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gold/20"
                >
                  <div className="h-48 overflow-hidden bg-gray-200">
                    <img 
                      key={service.image}
                      src={service.image} 
                      alt={service.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Image load error (specialized):', service.image);
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/broken/800/600';
                      }}
                    />
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gold shadow-sm group-hover:bg-gold group-hover:text-white transition-colors overflow-hidden">
                        {service.iconImage ? (
                          <img 
                            src={service.iconImage} 
                            alt="" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <Icon className="w-8 h-8" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold">
                        {lang === 'ar' ? service.title : (service.title_en || service.title)}
                      </h3>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                      {lang === 'ar' ? service.desc : (service.desc_en || service.desc)}
                    </p>
                    <a 
                      href={`https://wa.me/${siteSettings.whatsapp}?text=${encodeURIComponent(lang === 'ar' ? `أرغب في الاستفسار عن خدمة: ${service.title}` : `I would like to inquire about service: ${service.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold font-bold flex items-center gap-2 hover:gap-3 transition-all"
                    >
                      {lang === 'ar' ? 'استفسر الآن' : 'Inquire Now'}
                      <ArrowLeft className={cn("w-4 h-4", lang === 'en' && "rotate-180")} />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800" 
                alt="Luxury Car Interior" 
                className="rounded-[2.5rem] shadow-2xl"
              />
              <div className="absolute -bottom-8 -left-8 bg-gold p-8 rounded-3xl text-white shadow-xl hidden md:block">
                <div className="text-4xl font-bold mb-1">10+</div>
                <div className="text-sm opacity-90">{lang === 'ar' ? 'سنوات من الخبرة' : 'Years of Experience'}</div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-dark mb-4">{lang === 'ar' ? 'لماذا تختار Alhatab VIP Taxi؟' : 'Why Choose Alhatab VIP Taxi?'}</h2>
                <p className="text-gray-600">
                  {lang === 'ar'
                    ? 'نحن نؤمن بأن الرحلة لا تقل أهمية عن الوجهة. لذلك نسعى جاهدين لتقديم أفضل تجربة ممكنة.'
                    : 'We believe that the journey is as important as the destination. Therefore, we strive to provide the best possible experience.'}
                </p>
              </div>

              <div className="grid gap-6">
                {[
                  { 
                    icon: <ShieldCheck className="w-6 h-6" />, 
                    title: lang === 'ar' ? "أمان وخصوصية تامة" : "Total Safety & Privacy", 
                    desc: lang === 'ar' ? "جميع رحلاتنا مراقبة ونضمن لك خصوصية كاملة خلال تنقلك." : "All our trips are monitored and we guarantee total privacy during your travel."
                  },
                  { 
                    icon: <Clock3 className="w-6 h-6" />, 
                    title: lang === 'ar' ? "دقة متناهية في المواعيد" : "Extreme Punctuality", 
                    desc: lang === 'ar' ? "نصل إليك قبل الموعد المحدد لضمان وصولك في الوقت المناسب." : "We arrive before the scheduled time to ensure you arrive on time."
                  },
                  { 
                    icon: <Star className="w-6 h-6" />, 
                    title: lang === 'ar' ? "سائقون محترفون" : "Professional Drivers", 
                    desc: lang === 'ar' ? "نخبة من السائقين المدربين على أعلى معايير الضيافة والقيادة الآمنة." : "A selection of drivers trained to the highest standards of hospitality and safe driving."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-6 rounded-2xl bg-gray-50 hover:bg-gold/5 transition-colors">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-gold shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-dark rounded-[3rem] p-12 lg:p-20 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent" />
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">{lang === 'ar' ? 'جاهز لرحلتك القادمة؟' : 'Ready for your next trip?'}</h2>
              <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
                {lang === 'ar'
                  ? 'احجز معنا الان واستمتع بخصم 20% على رحلاتك في شهرك الاول معنا'
                  : 'Book with us now and enjoy a 20% discount on your trips during your first month with us'}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href={`https://wa.me/${siteSettings.whatsapp}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gold text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gold/90 transition-all"
                >
                  {t('bookNow')}
                </a>
                <a 
                  href={`tel:${siteSettings.phone}`} 
                  className="bg-white/10 text-white backdrop-blur border border-white/20 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  {t('contactUs')}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                {siteSettings.logo ? (
                  <img src={siteSettings.logo} alt="Logo" className="h-12 w-auto object-contain" />
                ) : (
                  <>
                    <div className="w-10 h-10 bg-dark rounded-xl flex items-center justify-center">
                      <Car className="text-gold w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-dark uppercase">Alhatab VIP Taxi</span>
                  </>
                )}
              </div>
              <p className="text-gray-500 max-w-sm mb-8">
                {lang === 'ar' ? siteSettings.footerAbout : (siteSettings.footerAbout_en || siteSettings.footerAbout)}
              </p>
              <div className="flex gap-4">
                {siteSettings.instagram && (
                  <a 
                    href={siteSettings.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all cursor-pointer"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {siteSettings.tiktok && (
                  <a 
                    href={siteSettings.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer"
                  >
                    <Share2 className="w-5 h-5" />
                  </a>
                )}
                {siteSettings.twitter && (
                  <a 
                    href={siteSettings.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all cursor-pointer"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                <a 
                  href={`https://wa.me/${siteSettings.whatsapp}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition-all cursor-pointer"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6">{lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h4>
              <ul className="space-y-4 text-gray-500">
                <li><a href="#" className="hover:text-gold transition-colors">{t('home')}</a></li>
                <li><a href="#services" className="hover:text-gold transition-colors">{t('services')}</a></li>
                <li><a href="#specialized-services" className="hover:text-gold transition-colors">{t('specializedServices')}</a></li>
                <li><a href="#about" className="hover:text-gold transition-colors">{t('whyUs')}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">{lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}</h4>
              <ul className="space-y-4 text-gray-500">
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gold" />
                  {siteSettings.phone}
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gold" />
                  {lang === 'ar' ? siteSettings.footerAddress : (siteSettings.footerAddress_en || siteSettings.footerAddress)}
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2026 Alhatab VIP Taxi. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
            <div className="flex gap-8">
              <button onClick={() => setIsTermsOpen(true)} className="hover:text-dark transition-colors">{lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</button>
              <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-dark transition-colors">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Terms & Conditions Modal */}
      <AnimatePresence>
        {isTermsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsOpen(false)}
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
                  onClick={() => setIsTermsOpen(false)}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto text-right dir-rtl" dir="rtl">
                <div className="space-y-8 text-gray-600">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                    <p className="font-bold text-dark">اسم الشركة: Alhatab VIP Taxi</p>
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

                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">5. مسؤولية العميل</h4>
                    <p>يجب تقديم تفاصيل دقيقة للاستلام والتوصيل. سيتم تحميل العميل تكلفة أي ضرر أو سوء استخدام للمركبة. أي سلوك غير لائق قد يؤدي لإنهاء الرحلة فوراً دون استرداد.</p>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">6. سياسة السائق والمركبة</h4>
                    <p>جميع السائقين مؤهلون والمركبات مصانة باحترافية. تحتفظ الشركة بالحق في استبدال المركبة بفئة مماثلة إذا لزم الأمر دون إشعار مسبق.</p>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">7. القوة القاهرة</h4>
                    <p>الشركة غير مسؤولة عن التأخير الناتج عن ظروف خارجة عن السيطرة مثل: الازدحام المروري، الحوادث، الظروف الجوية، أو الإجراءات الحكومية.</p>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">8. تحديد المسؤولية</h4>
                    <p>الشركة غير مسؤولة عن فقدان الممتلكات الشخصية أو التأخير الناتج عن عوامل خارجية أو أي خسائر غير مباشرة.</p>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">9. الحق في رفض الخدمة</h4>
                    <p>تحتفظ الشركة بالحق في رفض أو إلغاء أي حجز في حال مخالفة الشروط أو وجود مخاوف تتعلق بالسلامة.</p>
                  </section>

                  <section className="bg-dark text-white p-6 rounded-3xl">
                    <h4 className="text-lg font-bold text-gold mb-3">ملاحظات هامة</h4>
                    <ul className="space-y-2 text-sm opacity-90">
                      <li>يرجى مراجعة تفاصيل الحجز بعناية قبل التأكيد.</li>
                      <li>تعتبر مراسلات الواتساب رسمية وملزمة.</li>
                      <li>تحتفظ الشركة بالحق في اتخاذ إجراءات قانونية في حال الاحتيال أو إساءة استخدام الخدمة.</li>
                    </ul>
                  </section>

                  <div className="border-t border-gray-100 pt-8 mt-8">
                    <h3 className="text-xl font-bold text-dark mb-6 text-left" dir="ltr">Terms & Conditions – Car Rental with Driver</h3>
                    <div className="space-y-6 text-sm text-gray-500 text-left" dir="ltr">
                      <p><strong>Company Name:</strong> Alhatab VIP Taxi</p>
                      <p><strong>Contact:</strong> +973 32325997</p>
                      
                      <section>
                        <h4 className="font-bold text-dark mb-2">1. General Agreement</h4>
                        <p>By confirming the booking, the customer agrees to all terms and conditions stated below. The company reserves the right to modify these terms at any time without prior notice.</p>
                      </section>

                      <section>
                        <h4 className="font-bold text-dark mb-2">2. Booking Confirmation</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>All bookings must be confirmed in advance.</li>
                          <li>A full or partial payment is required to secure the reservation.</li>
                          <li>The booking is considered confirmed only after payment is received.</li>
                          <li>By making payment, the customer automatically agrees to these terms and conditions.</li>
                        </ul>
                      </section>

                      <section>
                        <h4 className="font-bold text-dark mb-2">3. Cancellation & Refund Policy</h4>
                        <ul className="space-y-1">
                          <li><strong>More than 24 hours before the trip:</strong> 50% refund.</li>
                          <li><strong>Between 12 to 24 hours before the trip:</strong> 25% refund.</li>
                          <li><strong>Between 6 to 12 hours before the trip:</strong> Subject to company discretion.</li>
                          <li><strong>Less than 6 hours or no-show:</strong> No refund.</li>
                          <li><strong>Cancellation within 2 hours of booking:</strong> Full refund upon approval (if trip is not imminent).</li>
                        </ul>
                        <p className="mt-2 text-xs italic">Refunds processed within 3–14 business days. Fees may be deducted.</p>
                      </section>

                      <section>
                        <h4 className="font-bold text-dark mb-2">4. Delays & Waiting Time</h4>
                        <p>20 minutes free waiting time. Additional charges apply thereafter. No-show after waiting period results in no refund.</p>
                      </section>

                      <section>
                        <h4 className="font-bold text-dark mb-2">5. Customer Responsibility</h4>
                        <p>Accurate details required. Damage or misuse will be charged. Inappropriate behavior results in termination without refund.</p>
                      </section>

                      <section>
                        <h4 className="font-bold text-dark mb-2">6. Driver & Vehicle Policy</h4>
                        <p>Qualified drivers and maintained vehicles. Company may replace vehicle with similar category if necessary.</p>
                      </section>

                      <section>
                        <h4 className="font-bold text-dark mb-2">7. Force Majeure</h4>
                        <p>Not responsible for delays beyond control (traffic, weather, road closures).</p>
                      </section>

                      <section>
                        <h4 className="font-bold text-dark mb-2">8. Liability Limitation</h4>
                        <p>Not responsible for loss of personal belongings or indirect losses.</p>
                      </section>

                      <section>
                        <h4 className="font-bold text-dark mb-2">9. Right to Refuse Service</h4>
                        <p>Company reserves the right to refuse or cancel bookings for violation of terms or safety concerns.</p>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setIsTermsOpen(false)}
                  className="w-full bg-dark text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
                >
                  فهمت وأوافق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyOpen(false)}
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
                  onClick={() => setIsPrivacyOpen(false)}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto text-right dir-rtl" dir="rtl">
                <div className="space-y-8 text-gray-600">
                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">مقدمة</h4>
                    <p>نحن في Alhatab VIP Taxi نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا للمعلومات التي تقدمها لنا.</p>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">المعلومات التي نجمعها</h4>
                    <ul className="list-disc list-inside space-y-2">
                      <li>الاسم ومعلومات الاتصال (رقم الهاتف).</li>
                      <li>تفاصيل الرحلة (نقطة الانطلاق، الوجهة، التاريخ والوقت).</li>
                      <li>أي تفاصيل إضافية تقدمها عبر الواتساب لتسهيل الخدمة.</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">كيفية استخدام المعلومات</h4>
                    <p>نستخدم معلوماتك حصرياً للأغراض التالية:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>تأكيد وتنفيذ حجوزاتك.</li>
                      <li>التواصل معك بخصوص رحلتك.</li>
                      <li>تحسين جودة خدماتنا وتجربة المستخدم.</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">حماية البيانات</h4>
                    <p>نحن نطبق إجراءات أمنية صارمة لضمان عدم وصول أطراف غير مصرح لها إلى بياناتك. لا نقوم ببيع أو مشاركة بياناتك مع أي جهات خارجية لأغراض تسويقية.</p>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">التواصل عبر الواتساب</h4>
                    <p>بما أن الحجز يتم عبر الواتساب، فإن المحادثات تخضع أيضاً لسياسة خصوصية شركة WhatsApp. نحن نستخدم هذه المنصة فقط لتسهيل التواصل المباشر والسريع معك.</p>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-dark mb-3">تحديثات السياسة</h4>
                    <p>قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة.</p>
                  </section>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setIsPrivacyOpen(false)}
                  className="w-full bg-dark text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Dashboard Modal */}
      <AnimatePresence>
        {isDashboardOpen && isAdmin && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDashboardOpen(false)}
              className="absolute inset-0 bg-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                  {siteSettings.logo ? (
                    <img src={siteSettings.logo} alt="Logo" className="h-12 w-auto object-contain" />
                  ) : (
                    <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center text-white">
                      <Settings className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-dark">{t('dashboard')}</h3>
                    <div className="flex gap-4 mt-1">
                      <button 
                        onClick={() => setActiveTab('content')}
                        className={cn(
                          "text-sm font-bold transition-colors",
                          activeTab === 'content' ? "text-gold" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {lang === 'ar' ? 'إدارة المحتوى' : 'Content Management'}
                      </button>
                      <button 
                        onClick={() => setActiveTab('accounting')}
                        className={cn(
                          "text-sm font-bold transition-colors",
                          activeTab === 'accounting' ? "text-gold" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {lang === 'ar' ? 'النظام المحاسبي' : 'Accounting System'}
                      </button>
                      <button 
                        onClick={() => setActiveTab('pricing')}
                        className={cn(
                          "text-sm font-bold transition-colors",
                          activeTab === 'pricing' ? "text-gold" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {lang === 'ar' ? 'التسعيرات والربط' : 'Pricing & Integration'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {isAdmin && isEmailVerified && (
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                      <ShieldCheck className="w-4 h-4" />
                      {lang === 'ar' ? 'مدير مفعل' : 'Active Admin'}
                    </div>
                  )}
                  {isAdmin && !isEmailVerified && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
                        <ShieldAlert className="w-4 h-4" />
                        {lang === 'ar' ? 'البريد غير مفعل (لا يمكنك الحفظ)' : 'Email not verified (Cannot save)'}
                      </div>
                      <button 
                        onClick={async () => {
                          if (!user) return;
                          try {
                            await sendEmailVerification(user);
                            alert(lang === 'ar' ? 'تم إرسال رابط التفعيل إلى بريدك الإلكتروني.' : 'Verification link sent to your email.');
                          } catch (error: any) {
                            alert((lang === 'ar' ? 'فشل إرسال الرابط: ' : 'Failed to send link: ') + error.message);
                          }
                        }}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        {lang === 'ar' ? 'إعادة إرسال رابط التفعيل' : 'Resend verification link'}
                      </button>
                    </div>
                  )}
                  {services.length === 0 && specializedServices.length === 0 && (
                    <button 
                      onClick={seedDatabase}
                      className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg animate-pulse"
                    >
                      ⚠️ {lang === 'ar' ? 'تهيئة البيانات الأولية (مطلوب لإظهار المحتوى)' : 'Initialize Data (Required to show content)'}
                    </button>
                  )}
                  <button 
                    onClick={testFirebaseConnection}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                  >
                    {lang === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}
                  </button>
                  <button 
                    onClick={() => setIsDashboardOpen(false)}
                    className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-8 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="space-y-12">
                  {activeTab === 'content' ? (
                    <>
                      {/* Site Settings */}
                      <section>
                        <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <Car className="text-gold w-6 h-6" />
                          إعدادات الموقع العامة
                        </h4>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">عنوان الهيرو</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                              value={siteSettings.heroTitle}
                              onChange={e => {
                                const newSettings = { ...siteSettings, heroTitle: e.target.value };
                                setSiteSettings(newSettings);
                                safeUpdateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">اللوغو (رابط أو رفع)</label>
                            <div className="flex gap-4 items-center">
                              <div className="relative w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group/logo">
                                {siteSettings.logo ? (
                                  <img src={siteSettings.logo} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-6 h-6" />
                                  </div>
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer">
                                  {isUploading === 'site' + 'logo' ? (
                                    <Loader2 className="text-white w-5 h-5 animate-spin" />
                                  ) : (
                                    <Upload className="text-white w-5 h-5" />
                                  )}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(file, 'settings', 'site', 'logo');
                                    }}
                                  />
                                </label>
                              </div>
                              <input 
                                type="text" 
                                className="flex-1 bg-gray-50 border-gray-200 rounded-xl p-3 text-xs"
                                placeholder="رابط اللوغو"
                                value={siteSettings.logo || ''}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, logo: e.target.value };
                                  setSiteSettings(newSettings);
                                  safeUpdateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">العنوان الفرعي</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                              value={siteSettings.heroSubtitle}
                              onChange={e => {
                                const newSettings = { ...siteSettings, heroSubtitle: e.target.value };
                                setSiteSettings(newSettings);
                                safeUpdateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">رقم الهاتف</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                              value={siteSettings.phone}
                              onChange={e => {
                                const newSettings = { ...siteSettings, phone: e.target.value };
                                setSiteSettings(newSettings);
                                safeUpdateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">رقم الواتساب (بدون +)</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                              value={siteSettings.whatsapp}
                              onChange={e => {
                                const newSettings = { ...siteSettings, whatsapp: e.target.value };
                                setSiteSettings(newSettings);
                                safeUpdateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">رابط الانستقرام</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                              placeholder="https://instagram.com/your_account"
                              value={siteSettings.instagram || ''}
                              onChange={e => {
                                const newSettings = { ...siteSettings, instagram: e.target.value };
                                setSiteSettings(newSettings);
                                safeUpdateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">رابط تيك توك</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                              placeholder="https://tiktok.com/@your_account"
                              value={siteSettings.tiktok || ''}
                              onChange={e => {
                                const newSettings = { ...siteSettings, tiktok: e.target.value };
                                setSiteSettings(newSettings);
                                safeUpdateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">رابط منصة X</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                              placeholder="https://x.com/your_account"
                              value={siteSettings.twitter || ''}
                              onChange={e => {
                                const newSettings = { ...siteSettings, twitter: e.target.value };
                                setSiteSettings(newSettings);
                                safeUpdateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">رقم استلام التنبيهات (واتساب)</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                              placeholder="97332325997"
                              value={siteSettings.notificationWhatsapp || ''}
                              onChange={e => {
                                const newSettings = { ...siteSettings, notificationWhatsapp: e.target.value };
                                setSiteSettings(newSettings);
                                updateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                            <p className="text-[10px] text-gray-400">هذا الرقم الذي سيتم إرسال جدول الرحلات اليومي إليه.</p>
                          </div>
                        </div>
                      </section>

                      {/* Services Management */}
                      <section>
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-xl font-bold flex items-center gap-2">
                            <Star className="text-gold w-6 h-6" />
                            إدارة الخدمات الرئيسية
                          </h4>
                          <button 
                            onClick={async () => {
                              const name = 'خدمة جديدة';
                              const description = 'وصف الخدمة هنا';
                              const name_en = await translateText(name);
                              const description_en = await translateText(description);
                              
                              safeAddDoc(collection(db, 'services'), {
                                name,
                                name_en,
                                description,
                                description_en,
                                image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
                                features: ['ميزة 1']
                              });
                            }}
                            className="bg-gold text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold"
                          >
                            <Plus className="w-5 h-5" />
                            إضافة خدمة
                          </button>
                        </div>
                        <div className="grid gap-6">
                          {services.map(service => (
                            <div key={service.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                              <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                  <div className="relative h-40 rounded-2xl overflow-hidden bg-gray-200 group/img">
                                  <div 
                                    className="w-full h-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${service.image})` }}
                                    key={service.image}
                                  />
                                  <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">
                                    {service.image.substring(0, 30)}...
                                  </div>
                                    <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                                      {isUploading === service.id + 'image' ? (
                                        <Loader2 className="text-white w-8 h-8 animate-spin" />
                                      ) : (
                                        <>
                                          <Upload className="text-white w-8 h-8 mb-2" />
                                          <span className="text-white text-xs font-bold">رفع صورة من الجهاز</span>
                                        </>
                                      )}
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleImageUpload(file, 'services', service.id);
                                        }}
                                      />
                                    </label>
                                  </div>
                                  <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      placeholder="رابط الصورة"
                                      className="flex-1 text-xs bg-white border-gray-200 rounded-lg p-2"
                                      value={service.image}
                                      onChange={e => safeUpdateDoc(doc(db, 'services', service.id), { image: e.target.value })}
                                    />
                                    <button 
                                      onClick={() => safeUpdateDoc(doc(db, 'services', service.id), { image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800' })}
                                      className="text-[10px] bg-gray-200 px-2 rounded hover:bg-gray-300"
                                    >
                                      إعادة تعيين
                                    </button>
                                  </div>
                                </div>
                                  <div className="md:col-span-2 space-y-4">
                                    <div className="flex justify-between gap-4">
                                      <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">الاسم (عربي)</label>
                                        <input 
                                          type="text" 
                                          className="text-lg font-bold bg-white border border-gray-200 rounded-xl p-2 w-full"
                                          value={service.name}
                                          onChange={e => safeUpdateDoc(doc(db, 'services', service.id), { name: e.target.value })}
                                        />
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Name (English)</label>
                                        <input 
                                          type="text" 
                                          className="text-lg font-bold bg-white border border-gray-200 rounded-xl p-2 w-full"
                                          value={service.name_en || ''}
                                          onChange={e => safeUpdateDoc(doc(db, 'services', service.id), { name_en: e.target.value })}
                                        />
                                      </div>
                                      <button 
                                        onClick={() => safeDeleteDoc(doc(db, 'services', service.id))}
                                        className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors self-end"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">الوصف (عربي)</label>
                                        <textarea 
                                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm h-24"
                                          value={service.description}
                                          onChange={e => updateDoc(doc(db, 'services', service.id), { description: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Description (English)</label>
                                        <textarea 
                                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm h-24"
                                          value={service.description_en || ''}
                                          onChange={e => updateDoc(doc(db, 'services', service.id), { description_en: e.target.value })}
                                        />
                                      </div>
                                    </div>
                                  </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Specialized Services Management */}
                      <section>
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-xl font-bold flex items-center gap-2">
                            <MapPin className="text-gold w-6 h-6" />
                            إدارة الخدمات المتخصصة (الرحلات)
                          </h4>
                          <button 
                            onClick={async () => {
                              const title = 'رحلة جديدة';
                              const desc = 'وصف الرحلة هنا';
                              const title_en = await translateText(title);
                              const desc_en = await translateText(desc);
                              
                              safeAddDoc(collection(db, 'specialized_services'), {
                                title,
                                title_en,
                                desc,
                                desc_en,
                                image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800',
                                iconName: 'MapPin',
                                order: specializedServices.length
                              });
                            }}
                            className="bg-gold text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold"
                          >
                            <Plus className="w-5 h-5" />
                            إضافة رحلة
                          </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          {specializedServices.map((service, index) => {
                            const Icon = {
                              Clock, MapPin, Star, Users, Camera, ShoppingBag
                            }[service.iconName] || MapPin;
                            
                            return (
                              <div key={service.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-200 space-y-4">
                              <div className="flex gap-4">
                                <div className="flex flex-col gap-1 justify-center">
                                  <button 
                                    disabled={index === 0}
                                    onClick={() => moveSpecializedService(index, 'up')}
                                    className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 disabled:opacity-30"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button 
                                    disabled={index === specializedServices.length - 1}
                                    onClick={() => moveSpecializedService(index, 'down')}
                                    className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 disabled:opacity-30"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-200 group/img">
                                  <div 
                                    className="w-full h-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${service.image})` }}
                                    key={service.image}
                                  />
                                  <div className="absolute top-1 right-1 bg-black/50 text-white text-[8px] px-1 rounded">
                                    {service.image.substring(0, 15)}...
                                  </div>
                                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                                    {isUploading === service.id + 'image' ? (
                                      <Loader2 className="text-white w-5 h-5 animate-spin" />
                                    ) : (
                                      <Upload className="text-white w-5 h-5" />
                                    )}
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload(file, 'specialized_services', service.id);
                                      }}
                                    />
                                  </label>
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex justify-between gap-2">
                                    <div className="flex-1 space-y-1">
                                      <label className="text-[8px] font-bold text-gray-400 uppercase">العنوان (عربي)</label>
                                      <input 
                                        type="text" 
                                        className="font-bold bg-white border border-gray-200 rounded-lg p-1 w-full text-sm"
                                        value={service.title}
                                        onChange={e => safeUpdateDoc(doc(db, 'specialized_services', service.id), { title: e.target.value })}
                                      />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <label className="text-[8px] font-bold text-gray-400 uppercase">Title (English)</label>
                                      <input 
                                        type="text" 
                                        className="font-bold bg-white border border-gray-200 rounded-lg p-1 w-full text-sm"
                                        value={service.title_en || ''}
                                        onChange={e => safeUpdateDoc(doc(db, 'specialized_services', service.id), { title_en: e.target.value })}
                                      />
                                    </div>
                                    <button 
                                      onClick={() => safeDeleteDoc(doc(db, 'specialized_services', service.id))}
                                      className="text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors self-end"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden relative group/icon">
                                      {service.iconImage ? (
                                        <img src={service.iconImage} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <Icon className="w-5 h-5 text-gold" />
                                      )}
                                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity cursor-pointer">
                                        {isUploading === service.id + 'iconImage' ? (
                                          <Loader2 className="text-white w-3 h-3 animate-spin" />
                                        ) : (
                                          <Upload className="text-white w-3 h-3" />
                                        )}
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(file, 'specialized_services', service.id, 'iconImage');
                                          }}
                                        />
                                      </label>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <input 
                                        type="text" 
                                        placeholder="رابط أيقونة مخصصة"
                                        className="w-full text-[10px] bg-white border-gray-200 rounded p-1"
                                        value={service.iconImage || ''}
                                        onChange={e => updateDoc(doc(db, 'specialized_services', service.id), { iconImage: e.target.value })}
                                      />
                                      <select 
                                        className="w-full text-[10px] bg-white border-gray-200 rounded p-1"
                                        value={service.iconName}
                                        onChange={e => updateDoc(doc(db, 'specialized_services', service.id), { iconName: e.target.value })}
                                      >
                                        <option value="Clock">ساعة</option>
                                        <option value="MapPin">موقع</option>
                                        <option value="Star">نجمة</option>
                                        <option value="Users">أشخاص</option>
                                        <option value="Camera">كاميرا</option>
                                        <option value="ShoppingBag">حقيبة تسوق</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="رابط الصورة"
                                  className="flex-1 text-xs bg-white border-gray-200 rounded-lg p-2"
                                  value={service.image}
                                  onChange={e => updateDoc(doc(db, 'specialized_services', service.id), { image: e.target.value })}
                                />
                                <button 
                                  onClick={() => updateDoc(doc(db, 'specialized_services', service.id), { image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800' })}
                                  className="text-[10px] bg-gray-200 px-2 rounded hover:bg-gray-300"
                                >
                                  إعادة تعيين
                                </button>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-gray-400 uppercase">الوصف (عربي)</label>
                                  <textarea 
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs h-20"
                                    value={service.desc}
                                    onChange={e => updateDoc(doc(db, 'specialized_services', service.id), { desc: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-bold text-gray-400 uppercase">Description (English)</label>
                                  <textarea 
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs h-20"
                                    value={service.desc_en || ''}
                                    onChange={e => updateDoc(doc(db, 'specialized_services', service.id), { desc_en: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </section>
                    </>
                  ) : (
                    <section className="space-y-8">
                      {/* Accounting Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-3">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-500 font-bold mb-1">إجمالي الرحلات</p>
                          <p className="text-2xl font-black text-dark">{trips.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-3">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-500 font-bold mb-1">إجمالي الأرباح</p>
                          <p className="text-2xl font-black text-dark">
                            {trips.reduce((acc, t) => acc + (t.profit || 0), 0).toFixed(2)} <span className="text-xs">BHD</span>
                          </p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-3">
                            <Clock className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-500 font-bold mb-1">أرباح اليوم</p>
                          <p className="text-2xl font-black text-gold">
                            {trips
                              .filter(t => t.date === new Date().toISOString().split('T')[0])
                              .reduce((acc, t) => acc + (t.profit || 0), 0).toFixed(2)} <span className="text-xs">BHD</span>
                          </p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-3">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-500 font-bold mb-1">أرباح الأسبوع</p>
                          <p className="text-2xl font-black text-dark">
                            {trips
                              .filter(t => {
                                const tripDate = new Date(t.date);
                                const weekAgo = new Date();
                                weekAgo.setDate(weekAgo.getDate() - 7);
                                return tripDate >= weekAgo;
                              })
                              .reduce((acc, t) => acc + (t.profit || 0), 0).toFixed(2)} <span className="text-xs">BHD</span>
                          </p>
                        </div>
                      </div>

                      {/* Accounting Controls */}
                      <div className="flex flex-wrap gap-4 justify-between items-center">
                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              setEditingTrip(null);
                              setTripFormData({
                                customerName: '',
                                phone: '',
                                passengers: 1,
                                bags: 0,
                                direction: '',
                                pickup: '',
                                dropoff: '',
                                date: new Date().toISOString().split('T')[0],
                                time: '10:00',
                                amount: 0,
                                driverType: 'In',
                                driverName: '',
                                driverCost: 0,
                                paymentStatus: 'Pending',
                                status: 'Requested',
                                notes: ''
                              });
                              setIsTripFormOpen(true);
                            }}
                            className="bg-gold text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-gold/20 hover:scale-105 transition-all"
                          >
                            <Plus className="w-5 h-5" />
                            إضافة رحلة جديدة
                          </button>
                          <button 
                            onClick={handleSendWhatsAppSummary}
                            className="bg-green-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-green-600/20 hover:scale-105 transition-all"
                          >
                            <MessageCircle className="w-5 h-5" />
                            إرسال جدول غد للواتساب
                          </button>
                          <button 
                            onClick={handleSendEmailSchedule}
                            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20 hover:scale-105 transition-all"
                          >
                            <FileText className="w-5 h-5" />
                            إرسال جدول الرحلات للإيميل
                          </button>
                          <button 
                            onClick={exportTripsToCSV}
                            className="bg-white text-dark border border-gray-200 px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-gray-50 transition-all"
                          >
                            <Download className="w-5 h-5" />
                            تصدير Excel
                          </button>
                        </div>
                        
                        <div className="flex gap-4 items-center">
                          <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
                            <button 
                              onClick={() => setIsAdminScheduleView(false)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                !isAdminScheduleView ? "bg-white text-dark shadow-sm" : "text-gray-500 hover:text-dark"
                              )}
                            >
                              قائمة الرحلات
                            </button>
                            <button 
                              onClick={() => setIsAdminScheduleView(true)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                isAdminScheduleView ? "bg-white text-dark shadow-sm" : "text-gray-500 hover:text-dark"
                              )}
                            >
                              عرض الجدول اليومي
                            </button>
                          </div>

                          {!isAdminScheduleView && (
                            <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
                              {[
                                { id: 'all', label: 'الكل' },
                                { id: 'requested', label: 'طلبات جديدة' },
                                { id: 'pending_price', label: 'بانتظار التسعير' },
                                { id: 'unpaid', label: 'غير مدفوعة' },
                                { id: 'paid', label: 'مدفوعة' }
                              ].map(filter => (
                              <button 
                                key={filter.id}
                                onClick={() => setTripFilter(filter.id as any)}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                  tripFilter === filter.id ? "bg-white text-dark shadow-sm" : "text-gray-500 hover:text-dark"
                                )}
                              >
                                {filter.label}
                              </button>
                            ))}
                          </div>
                          )}
                        </div>
                      </div>

                      {isAdminScheduleView ? (
                        <div className="space-y-8">
                          {Object.entries(
                            trips
                              .filter(t => t.date >= new Date().toISOString().split('T')[0])
                              .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                              .reduce((acc, trip) => {
                                if (!acc[trip.date]) acc[trip.date] = [];
                                acc[trip.date].push(trip);
                                return acc;
                              }, {} as Record<string, Trip[]>)
                          ).map(([date, dayTrips]: [string, any[]]) => (
                            <div key={date} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                              <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                                <h4 className="text-lg font-black text-dark flex items-center gap-2">
                                  <Calendar className="w-5 h-5 text-gold" />
                                  رحلات يوم: {date}
                                </h4>
                                <span className="bg-gold/10 text-gold px-4 py-1 rounded-full text-xs font-bold">
                                  {dayTrips.length} رحلات
                                </span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                  <thead>
                                    <tr className="bg-white border-b border-gray-50">
                                      <th className="p-4 font-black text-gray-400 uppercase tracking-wider">الوقت</th>
                                      <th className="p-4 font-black text-gray-400 uppercase tracking-wider">العميل</th>
                                      <th className="p-4 font-black text-gray-400 uppercase tracking-wider">المسار</th>
                                      <th className="p-4 font-black text-gray-400 uppercase tracking-wider">السعر</th>
                                      <th className="p-4 font-black text-gray-400 uppercase tracking-wider">السائق</th>
                                      <th className="p-4 font-black text-gray-400 uppercase tracking-wider">الحالة</th>
                                      <th className="p-4 font-black text-gray-400 uppercase tracking-wider">الدفع</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {dayTrips.map(trip => (
                                      <tr key={trip.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="p-4 font-black text-dark">{trip.time}</td>
                                        <td className="p-4">
                                          <div className="font-bold text-dark">{trip.customerName}</div>
                                          <div className="text-[10px] text-gray-400">{trip.phone}</div>
                                        </td>
                                        <td className="p-4 font-bold text-dark">{trip.direction}</td>
                                        <td className="p-4 font-black text-dark">{trip.amount} BHD</td>
                                        <td className="p-4">
                                          {trip.driverName ? (
                                            <span className="text-blue-600 font-bold">{trip.driverName}</span>
                                          ) : (
                                            <span className="text-gray-300">لم يحدد</span>
                                          )}
                                        </td>
                                        <td className="p-4">
                                          <span className={cn(
                                            "px-2 py-1 rounded-full text-[9px] font-black uppercase",
                                            trip.status === 'Confirmed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                          )}>
                                            {trip.status}
                                          </span>
                                        </td>
                                        <td className="p-4">
                                          <span className={cn(
                                            "px-2 py-1 rounded-full text-[9px] font-black uppercase",
                                            trip.paymentStatus === 'Paid' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                          )}>
                                            {trip.paymentStatus}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                          {trips.filter(t => t.date >= new Date().toISOString().split('T')[0]).length === 0 && (
                            <div className="bg-white p-20 rounded-[3rem] text-center border border-gray-100">
                              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                              <p className="text-gray-400 font-bold">لا توجد رحلات قادمة مجدولة</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Accounting Table */
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Trip ID</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Customer Name</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Linked</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Phone</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap text-center">No. of Passengers</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider text-center">Bags</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider text-center">Car Type</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider text-center">Distance (km)</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Trip Direction</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Pickup Location</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Drop-off Location</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Trip Date</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Trip Time</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Trip Amount (BHD)</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Driver Type (In/Out)</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Driver Name</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Driver Cost (BHD)</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Company Profit (BHD)</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Trip Status</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Payment Status</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider">Notes</th>
                                <th className="p-4 font-black text-gray-400 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {trips
                                .filter(t => {
                                  if (tripFilter === 'requested') return t.status === 'Requested';
                                  if (tripFilter === 'pending_price') return t.amount === 0;
                                  if (tripFilter === 'unpaid') return t.paymentStatus !== 'Paid' && t.amount > 0;
                                  if (tripFilter === 'paid') return t.paymentStatus === 'Paid';
                                  return true;
                                })
                                .map((trip, idx) => (
                                <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-4 font-bold text-gray-400">{(trips.length - idx).toString().padStart(3, '0')}</td>
                                  <td className="p-4 font-bold text-dark whitespace-nowrap">{trip.customerName}</td>
                                  <td className="p-4 text-center">
                                    {trip.userId ? (
                                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto" title={trip.userId}>
                                        <ShieldCheck className="w-4 h-4" />
                                      </div>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                  <td className="p-4 font-bold text-dark whitespace-nowrap">{trip.phone}</td>
                                  <td className="p-4 font-bold text-dark text-center">{trip.passengers}</td>
                                  <td className="p-4 font-bold text-dark text-center">{trip.bags}</td>
                                  <td className="p-4 font-bold text-dark text-center">
                                    <span className={cn(
                                      "px-2 py-1 rounded text-[10px] font-bold",
                                      trip.carType === 'VIP' ? "bg-gold/10 text-gold" : 
                                      trip.carType === 'Van' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                                    )}>
                                      {trip.carType}
                                    </span>
                                  </td>
                                  <td className="p-4 font-bold text-dark text-center">{trip.distance?.toFixed(1) || '—'}</td>
                                  <td className="p-4 font-bold text-dark whitespace-nowrap">{trip.direction}</td>
                                  <td className="p-4 font-bold text-dark whitespace-nowrap">{trip.pickup}</td>
                                  <td className="p-4 font-bold text-dark whitespace-nowrap">{trip.dropoff}</td>
                                  <td className="p-4 font-bold text-dark whitespace-nowrap">{trip.date}</td>
                                  <td className="p-4 font-bold text-dark whitespace-nowrap">{trip.time}</td>
                                  <td className="p-4 font-black text-dark">{trip.amount}</td>
                                  <td className="p-4">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded font-bold",
                                      trip.driverType === 'In' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                    )}>
                                      {trip.driverType === 'In' ? 'In' : 'Out'}
                                    </span>
                                  </td>
                                  <td className="p-4 font-bold text-dark whitespace-nowrap">{trip.driverName}</td>
                                  <td className="p-4 font-bold text-dark">{trip.driverCost}</td>
                                  <td className="p-4 font-black text-green-600">{trip.profit?.toFixed(2)}</td>
                                  <td className="p-4">
                                    <span className={cn(
                                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                      trip.status === 'Requested' ? "bg-blue-100 text-blue-700" :
                                      trip.status === 'Confirmed' ? "bg-green-100 text-green-700" :
                                      trip.status === 'Completed' ? "bg-gray-100 text-gray-700" :
                                      "bg-red-100 text-red-700"
                                    )}>
                                      {trip.status === 'Requested' ? 'Requested' :
                                       trip.status === 'Confirmed' ? 'Confirmed' :
                                       trip.status === 'Completed' ? 'Completed' : 'Cancelled'}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={cn(
                                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                      trip.paymentStatus === 'Paid' ? "bg-green-100 text-green-700" :
                                      trip.paymentStatus === 'Unpaid' ? "bg-red-100 text-red-700" :
                                      "bg-amber-100 text-amber-700"
                                    )}>
                                      {trip.paymentStatus === 'Paid' ? 'Paid' :
                                       trip.paymentStatus === 'Unpaid' ? 'Unpaid' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-gray-400 max-w-[150px] truncate">{trip.notes || '—'}</td>
                                  <td className="p-4">
                                    <div className="flex gap-2">
                                      {trip.amount > 0 && trip.paymentStatus !== 'Paid' && (
                                        <>
                                          <button 
                                            onClick={() => {
                                              const payUrl = `${window.location.origin}${window.location.pathname}?pay=${trip.id}`;
                                              const message = `عزيزي ${trip.customerName}،\nتم تحديد سعر رحلتك من ${trip.pickup} إلى ${trip.dropoff}.\nالمبلغ: ${trip.amount} BHD\nيمكنك الدفع إلكترونياً عبر الرابط التالي:\n${payUrl}`;
                                              window.open(`https://wa.me/${trip.phone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                            }}
                                            className="p-2 hover:bg-green-50 text-green-600 rounded-xl transition-colors"
                                            title="إرسال رابط الدفع للعميل"
                                          >
                                            <Wallet className="w-4 h-4" />
                                          </button>
                                          <button 
                                            onClick={() => {
                                              const payUrl = `${window.location.origin}${window.location.pathname}?pay=${trip.id}`;
                                              navigator.clipboard.writeText(payUrl);
                                              alert('تم نسخ رابط الدفع');
                                            }}
                                            className="p-2 hover:bg-gray-50 text-gray-600 rounded-xl transition-colors"
                                            title="نسخ رابط الدفع"
                                          >
                                            <Copy className="w-4 h-4" />
                                          </button>
                                        </>
                                      )}
                                      <button 
                                        onClick={() => {
                                          console.log('Editing trip:', trip.id);
                                          setEditingTrip(trip);
                                          setTripFormData(trip);
                                          setIsTripFormOpen(true);
                                        }}
                                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"
                                        title="تعديل"
                                      >
                                        <Settings className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => setTripToDelete(trip)}
                                        className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors"
                                        title="حذف"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {trips.length === 0 && (
                                <tr>
                                  <td colSpan={18} className="p-12 text-center text-gray-400 font-bold">
                                    لا توجد رحلات مسجلة حالياً
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                  {activeTab === 'pricing' && (
                    <section className="space-y-8">
                      {/* Pricing Settings */}
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                          <h4 className="text-xl font-black text-dark flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-gold" />
                            إعدادات التسعير التلقائي
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-400 uppercase">سعر الكيلومتر (BHD)</label>
                              <input 
                                type="number" 
                                step="0.01"
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-bold"
                                value={siteSettings.pricePerKm}
                                onChange={e => setSiteSettings({...siteSettings, pricePerKm: parseFloat(e.target.value) || 0})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-400 uppercase">رسوم الخدمة الثابتة (BHD)</label>
                              <input 
                                type="number" 
                                step="0.01"
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-bold"
                                value={siteSettings.baseFee}
                                onChange={e => setSiteSettings({...siteSettings, baseFee: parseFloat(e.target.value) || 0})}
                              />
                            </div>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-xs text-blue-700 font-bold">المعادلة: (المسافة × سعر الكيلو) + الرسوم الثابتة</p>
                          </div>
                          <button 
                            onClick={handleSaveSettings}
                            className="w-full bg-dark text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
                          >
                            حفظ إعدادات التسعير
                          </button>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                          <h4 className="text-xl font-black text-dark flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-gold" />
                            ربط MyFatoorah
                          </h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-400 uppercase">API Token</label>
                              <input 
                                type="password" 
                                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-gold/20 transition-all font-bold"
                                value={siteSettings.myFatoorahToken || ''}
                                onChange={e => setSiteSettings({...siteSettings, myFatoorahToken: e.target.value})}
                                placeholder="أدخل توكن MyFatoorah"
                              />
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                              <input 
                                type="checkbox" 
                                id="mf-sandbox"
                                checked={siteSettings.myFatoorahIsSandbox}
                                onChange={e => setSiteSettings({...siteSettings, myFatoorahIsSandbox: e.target.checked})}
                                className="w-5 h-5 rounded border-gray-300 text-gold focus:ring-gold"
                              />
                              <label htmlFor="mf-sandbox" className="text-sm font-bold text-dark">تفعيل وضع التجربة (Sandbox Mode)</label>
                            </div>
                          </div>
                          <button 
                            onClick={handleSaveSettings}
                            className="w-full bg-dark text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
                          >
                            حفظ إعدادات الدفع
                          </button>
                        </div>
                      </div>

                      {/* Existing Fixed Pricing Section */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xl font-black text-dark">المسارات والأسعار الثابتة</h4>
                          <button 
                            onClick={() => {
                              const pickup = prompt('نقطة الانطلاق:');
                              const dropoff = prompt('نقطة الوصول:');
                              const price = parseFloat(prompt('السعر (BHD):') || '0');
                              if (pickup && dropoff && !isNaN(price)) {
                                safeAddDoc(collection(db, 'fixed_routes'), { pickup, dropoff, price });
                              }
                            }}
                            className="bg-gold text-white px-4 py-2 rounded-xl text-xs font-bold"
                          >
                            إضافة مسار ثابت
                          </button>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          {fixedRoutes.map(route => (
                            <div key={route.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-dark">{route.pickup} ← {route.dropoff}</p>
                                <p className="text-lg font-black text-gold">{route.price} BHD</p>
                              </div>
                              <button 
                                onClick={() => safeDeleteDoc(doc(db, 'fixed_routes', route.id))}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {activeTab === 'branding' && (
                    <section className="space-y-12">
                      <div>
                        <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <Star className="text-gold w-6 h-6" />
                          الألوان والهوية البصرية
                        </h4>
                        <div className="grid md:grid-cols-3 gap-8">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">اللون الرئيسي (الذهبي)</label>
                            <div className="flex gap-2">
                              <input 
                                type="color" 
                                className="w-12 h-12 rounded-xl cursor-pointer border-0"
                                value={siteSettings.primaryColor}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, primaryColor: e.target.value };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                              <input 
                                type="text" 
                                className="flex-1 bg-gray-50 border-gray-200 rounded-xl p-3 font-mono text-sm"
                                value={siteSettings.primaryColor}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, primaryColor: e.target.value };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">اللون الثانوي (الداكن)</label>
                            <div className="flex gap-2">
                              <input 
                                type="color" 
                                className="w-12 h-12 rounded-xl cursor-pointer border-0"
                                value={siteSettings.secondaryColor}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, secondaryColor: e.target.value };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                              <input 
                                type="text" 
                                className="flex-1 bg-gray-50 border-gray-200 rounded-xl p-3 font-mono text-sm"
                                value={siteSettings.secondaryColor}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, secondaryColor: e.target.value };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">انحناء الزوايا (Border Radius)</label>
                            <select 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 font-bold"
                              value={siteSettings.borderRadius}
                              onChange={e => {
                                const newSettings = { ...siteSettings, borderRadius: e.target.value };
                                setSiteSettings(newSettings);
                                updateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            >
                              <option value="0rem">حواف حادة (0)</option>
                              <option value="0.5rem">بسيط (8px)</option>
                              <option value="1rem">متوسط (16px)</option>
                              <option value="1.5rem">كبير (24px)</option>
                              <option value="2.5rem">دائري جداً (40px)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <ImageIcon className="text-gold w-6 h-6" />
                          خلفية الهيرو (Hero Background)
                        </h4>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div className="relative aspect-video bg-gray-100 rounded-custom-xl overflow-hidden border-2 border-dashed border-gray-200 group/hero">
                              <img src={siteSettings.heroImage} alt="Hero" className="w-full h-full object-cover" />
                              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity cursor-pointer text-white">
                                <Upload className="w-8 h-8 mb-2" />
                                <span className="font-bold">تغيير صورة الخلفية</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, 'settings', 'site', 'heroImage');
                                  }}
                                />
                              </label>
                            </div>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-xs"
                              placeholder="رابط صورة الخلفية"
                              value={siteSettings.heroImage}
                              onChange={e => {
                                const newSettings = { ...siteSettings, heroImage: e.target.value };
                                setSiteSettings(newSettings);
                                updateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-600">العنوان الرئيسي (Hero Title - AR)</label>
                              <input 
                                type="text" 
                                className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                                value={siteSettings.heroTitle}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, heroTitle: e.target.value };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-600">Hero Title (EN)</label>
                              <input 
                                type="text" 
                                className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                                value={siteSettings.heroTitle_en || ''}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, heroTitle_en: e.target.value };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-600">العنوان الفرعي (Hero Subtitle - AR)</label>
                              <input 
                                type="text" 
                                className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                                value={siteSettings.heroSubtitle}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, heroSubtitle: e.target.value };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-600">Hero Subtitle (EN)</label>
                              <input 
                                type="text" 
                                className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                                value={siteSettings.heroSubtitle_en || ''}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, heroSubtitle_en: e.target.value };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-600">وصف الهيرو (Hero Description - AR)</label>
                              <textarea 
                                className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 h-24"
                                value={siteSettings.heroDescription}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, heroDescription: e.target.value };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-gray-600">Hero Description (EN)</label>
                              <textarea 
                                className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 h-24"
                                value={siteSettings.heroDescription_en || ''}
                                onChange={e => {
                                  const newSettings = { ...siteSettings, heroDescription_en: e.target.value };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <Menu className="text-gold w-6 h-6" />
                          تذييل الصفحة (Footer)
                        </h4>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">عن الشركة (Footer About - AR)</label>
                            <textarea 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 h-32"
                              value={siteSettings.footerAbout}
                              onChange={e => {
                                const newSettings = { ...siteSettings, footerAbout: e.target.value };
                                setSiteSettings(newSettings);
                                safeUpdateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">About Company (Footer About - EN)</label>
                            <textarea 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 h-32"
                              value={siteSettings.footerAbout_en || ''}
                              onChange={e => {
                                const newSettings = { ...siteSettings, footerAbout_en: e.target.value };
                                setSiteSettings(newSettings);
                                updateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">العنوان (Footer Address - AR)</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                              value={siteSettings.footerAddress}
                              onChange={e => {
                                const newSettings = { ...siteSettings, footerAddress: e.target.value };
                                setSiteSettings(newSettings);
                                updateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Address (Footer Address - EN)</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-gray-200 rounded-xl p-3"
                              value={siteSettings.footerAddress_en || ''}
                              onChange={e => {
                                const newSettings = { ...siteSettings, footerAddress_en: e.target.value };
                                setSiteSettings(newSettings);
                                updateDoc(doc(db, 'settings', 'site'), newSettings);
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-8 mt-8">
                        <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <ShieldCheck className="text-gold w-6 h-6" />
                          إدارة المدراء (Admins Management)
                        </h4>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <input 
                              type="email" 
                              id="new-admin-email"
                              className="flex-1 bg-gray-50 border-gray-200 rounded-xl p-3"
                              placeholder="example@gmail.com"
                            />
                            <button 
                              onClick={() => {
                                const input = document.getElementById('new-admin-email') as HTMLInputElement;
                                const email = input.value.trim().toLowerCase();
                                if (email && !siteSettings.adminEmails?.includes(email)) {
                                  const newEmails = [...(siteSettings.adminEmails || []), email];
                                  const newSettings = { ...siteSettings, adminEmails: newEmails };
                                  setSiteSettings(newSettings);
                                  updateDoc(doc(db, 'settings', 'site'), newSettings);
                                  input.value = '';
                                }
                              }}
                              className="bg-gold text-white px-6 rounded-xl font-bold"
                            >
                              إضافة (Add)
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {siteSettings.adminEmails?.map(email => (
                              <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="font-medium">{email}</span>
                                {email !== 'ahjm91@gmail.com' && (
                                  <button 
                                    onClick={() => {
                                      const newEmails = siteSettings.adminEmails?.filter(e => e !== email);
                                      const newSettings = { ...siteSettings, adminEmails: newEmails };
                                      setSiteSettings(newSettings);
                                      updateDoc(doc(db, 'settings', 'site'), newSettings);
                                    }}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              </div>
              
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setIsDashboardOpen(false)}
                  className="bg-dark text-white px-12 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
                >
                  حفظ وإغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {tripToDelete && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTripToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 text-center"
              dir="rtl"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-dark mb-2">تأكيد الحذف</h3>
              <p className="text-gray-500 font-bold mb-8">
                هل أنت متأكد من حذف رحلة العميل <span className="text-dark">{tripToDelete.customerName}</span>؟
                <br />
                هذا الإجراء لا يمكن التراجع عنه.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setTripToDelete(null)}
                  className="py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={async () => {
                    await safeDeleteDoc(doc(db, 'trips', tripToDelete.id));
                    setTripToDelete(null);
                  }}
                  className="bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trip Form Modal */}
      <AnimatePresence>
        {isTripFormOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTripFormOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              dir="rtl"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-2xl font-black text-dark">
                    {editingTrip ? 'تعديل بيانات الرحلة' : 'إضافة رحلة جديدة'}
                  </h3>
                  <p className="text-gray-500 text-sm font-bold">أدخل تفاصيل الرحلة والبيانات المالية</p>
                </div>
                <button 
                  onClick={() => setIsTripFormOpen(false)}
                  className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-dark transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                {/* Customer Info */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">اسم العميل</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.customerName}
                      onChange={e => setTripFormData({ ...tripFormData, customerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">رقم الهاتف</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.phone}
                      onChange={e => setTripFormData({ ...tripFormData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">رقم العميل (UID)</label>
                    <input 
                      type="text" 
                      placeholder="لربط الرحلة بحساب العميل"
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.userId || ''}
                      onChange={e => setTripFormData({ ...tripFormData, userId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">الركاب</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.passengers}
                      onChange={e => setTripFormData({ ...tripFormData, passengers: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">الحقائب</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.bags}
                      onChange={e => setTripFormData({ ...tripFormData, bags: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">نوع السيارة</label>
                    <select 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.carType}
                      onChange={e => setTripFormData({ ...tripFormData, carType: e.target.value as any })}
                    >
                      <option value="Standard">Standard</option>
                      <option value="VIP">VIP</option>
                      <option value="Van">Van</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">المسافة (كم)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.distance || 0}
                      onChange={e => setTripFormData({ ...tripFormData, distance: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Trip Details */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">مسار الرحلة</label>
                    <input 
                      type="text" 
                      placeholder="مثال: المطار ← الفندق"
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.direction}
                      onChange={e => setTripFormData({ ...tripFormData, direction: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">نقطة الاستلام</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.pickup}
                      onChange={e => setTripFormData({ ...tripFormData, pickup: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">نقطة التوصيل</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.dropoff}
                      onChange={e => setTripFormData({ ...tripFormData, dropoff: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">التاريخ</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.date}
                      onChange={e => setTripFormData({ ...tripFormData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">الوقت</label>
                    <input 
                      type="time" 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.time}
                      onChange={e => setTripFormData({ ...tripFormData, time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">مبلغ الرحلة (BHD)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold text-gold"
                      value={tripFormData.amount}
                      onChange={e => setTripFormData({ ...tripFormData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Driver Info */}
                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">نوع السائق</label>
                    <div className="flex gap-2 p-1 bg-white rounded-xl border border-gray-200">
                      <button 
                        onClick={() => setTripFormData({ ...tripFormData, driverType: 'In' })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                          tripFormData.driverType === 'In' ? "bg-dark text-white" : "text-gray-400 hover:bg-gray-50"
                        )}
                      >
                        داخلي
                      </button>
                      <button 
                        onClick={() => setTripFormData({ ...tripFormData, driverType: 'Out' })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                          tripFormData.driverType === 'Out' ? "bg-dark text-white" : "text-gray-400 hover:bg-gray-50"
                        )}
                      >
                        خارجي
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">اسم السائق</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.driverName}
                      onChange={e => setTripFormData({ ...tripFormData, driverName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">تكلفة السائق (BHD)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-white border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.driverCost}
                      onChange={e => setTripFormData({ ...tripFormData, driverCost: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">حالة الرحلة</label>
                    <select 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.status}
                      onChange={e => setTripFormData({ ...tripFormData, status: e.target.value as any })}
                    >
                      <option value="Requested">طلب جديد</option>
                      <option value="Confirmed">مؤكدة</option>
                      <option value="Completed">مكتملة</option>
                      <option value="Cancelled">ملغاة</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">حالة الدفع</label>
                    <select 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.paymentStatus}
                      onChange={e => setTripFormData({ ...tripFormData, paymentStatus: e.target.value as any })}
                    >
                      <option value="Pending">معلق</option>
                      <option value="Paid">مدفوع</option>
                      <option value="Unpaid">غير مدفوع</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">ملاحظات</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold"
                      value={tripFormData.notes}
                      onChange={e => setTripFormData({ ...tripFormData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
                <button 
                  onClick={() => setIsTripFormOpen(false)}
                  className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleSaveTrip}
                  className="bg-gold text-white px-12 py-4 rounded-2xl font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/20"
                >
                  {editingTrip ? 'تحديث البيانات' : 'إضافة الرحلة'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsPaymentOpen(false);
                setPaymentTrip(null);
                setSearchTripId('');
              }}
              className="absolute inset-0 bg-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                    <Wallet className="text-gold w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-dark">دفع قيمة رحلة</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsPaymentOpen(false);
                    setPaymentTrip(null);
                    setSearchTripId('');
                  }}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                {!paymentTrip ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-gray-500">أدخل رقم الرحلة أو رقم الهاتف المسجل للبحث عن رحلتك</p>
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 font-bold text-center text-lg"
                        placeholder="رقم الرحلة أو الهاتف"
                        value={searchTripId}
                        onChange={e => setSearchTripId(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={async () => {
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
                      }}
                      disabled={isSearchingTrip}
                      className="w-full bg-dark text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    >
                      {isSearchingTrip ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      {lang === 'ar' ? 'بحث عن الرحلة' : 'Search for Trip'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-gold/5 p-6 rounded-3xl border border-gold/10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-bold text-gold uppercase tracking-wider mb-1">{lang === 'ar' ? 'تفاصيل الرحلة' : 'Trip Details'}</p>
                          <h4 className="text-xl font-bold text-dark">{paymentTrip.customerName}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">{lang === 'ar' ? 'المبلغ' : 'Amount'}</p>
                          <p className="text-2xl font-black text-gold">{paymentTrip.amount} {t('bhd')}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{paymentTrip.direction}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{paymentTrip.date}</span>
                        </div>
                      </div>
                    </div>

                    <Elements stripe={stripePromise}>
                      <CheckoutForm 
                        trip={paymentTrip} 
                        onSucceed={async () => {
                          await updateDoc(doc(db, 'trips', paymentTrip.id), {
                            paymentStatus: 'Paid'
                          });
                          alert(lang === 'ar' ? 'تمت عملية الدفع بنجاح! شكراً لاختياركم الحطب VIP.' : 'Payment successful! Thank you for choosing Alhatab VIP.');
                          setIsPaymentOpen(false);
                          setPaymentTrip(null);
                          setSearchTripId('');
                        }} 
                      />
                    </Elements>

                    <button 
                      onClick={() => setPaymentTrip(null)}
                      className="w-full text-gray-400 text-sm font-bold hover:text-dark transition-colors"
                    >
                      {lang === 'ar' ? 'بحث عن رحلة أخرى' : 'Search for another trip'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Dashboard Modal */}
      <AnimatePresence>
        {isCustomerDashboardOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomerDashboardOpen(false)}
              className="absolute inset-0 bg-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                    <Users className="text-gold w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-dark">{t('customerDashboard')}</h3>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCustomerDashboardOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1">
                {customerTrips.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Car className="w-10 h-10 text-gray-300" />
                    </div>
                    <h4 className="text-xl font-bold text-dark mb-2">{lang === 'ar' ? 'لا توجد رحلات مسجلة' : 'No trips recorded'}</h4>
                    <p className="text-gray-500">{lang === 'ar' ? 'لم تقم بأي رحلات مع Alhatab VIP Taxi بعد.' : 'You haven\'t taken any trips with Alhatab VIP Taxi yet.'}</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {customerTrips.map((trip) => (
                      <div key={trip.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                trip.paymentStatus === 'Paid' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                              )}>
                                {trip.paymentStatus === 'Paid' ? (lang === 'ar' ? 'مدفوع' : 'Paid') : (lang === 'ar' ? 'معلق' : 'Pending')}
                              </span>
                              <span className="text-xs font-bold text-gray-400">#{trip.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <h4 className="text-lg font-bold text-dark">{trip.direction}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-gold">{trip.amount} {t('bhd')}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase">{trip.date}</p>
                            {trip.amount > 0 && trip.paymentStatus !== 'Paid' && (
                              <button 
                                onClick={() => {
                                  setPaymentTrip(trip);
                                  setIsPaymentOpen(true);
                                }}
                                className="mt-2 bg-gold text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 ml-auto"
                              >
                                <Wallet className="w-4 h-4" />
                                {lang === 'ar' ? 'ادفع الآن' : 'Pay Now'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-50">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase">{t('pickup')}</p>
                            <p className="text-sm font-bold text-dark flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-gold" />
                              {trip.pickup}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase">{t('dropoff')}</p>
                            <p className="text-sm font-bold text-dark flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-gold" />
                              {trip.dropoff}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase">{lang === 'ar' ? 'الوقت' : 'Time'}</p>
                            <p className="text-sm font-bold text-dark flex items-center gap-2">
                              <Clock className="w-3 h-3 text-gold" />
                              {trip.time}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase">{lang === 'ar' ? 'الركاب' : 'Passengers'}</p>
                            <p className="text-sm font-bold text-dark flex items-center gap-2">
                              <Users className="w-3 h-3 text-gold" />
                              {trip.passengers}
                            </p>
                          </div>
                        </div>
                        
                        {trip.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => {
                              setPaymentTrip(trip);
                              setIsPaymentOpen(true);
                              setIsCustomerDashboardOpen(false);
                            }}
                            className="mt-6 w-full bg-dark text-white py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            دفع الآن
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
