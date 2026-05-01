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
  ArrowRight,
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
  Bus,
  Instagram,
  Twitter,
  Send,
  Truck,
  Share2,
  Gift,
  Trophy,
  Check,
  CreditCard,
  CheckCircle,
  Wallet,
  Copy,
  MessageCircle,
  Eye,
  Bitcoin,
  Navigation as NavigationIcon
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
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
  getDocs,
  runTransaction,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import confetti from 'canvas-confetti';
import { translations } from './translations';
import firebaseConfig from '../firebase-applet-config.json';

// New Components
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Hero, Services, SpecializedServices, WhyUs, CTA } from './components/LandingSections';
import { BookingForm } from './components/landing/BookingForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import DriverDashboard from './components/DriverDashboard';
import LiveTrackingMap from './components/LiveTrackingMap';
import { TripForm } from './components/admin/TripForm';
import { TripDeleteModal } from './components/admin/TripDeleteModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { CustomerDashboardModal } from './components/modals/CustomerDashboardModal';
import { TermsModal, PrivacyModal } from './components/common/Modals';
import { handleFirestoreError as handleFirestoreErrorUtils } from './lib/firestoreUtils';
import { BookingData, Service, SpecializedService, SiteSettings, UserProfile, Trip, FixedRoute, OperationType, Booking, Driver } from './types';

// Types
type ServiceType = 'luxury';

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

  const logAnalyticsEvent = (event: string, category: string, label?: string, metadata?: any) => {
    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, category, label, metadata })
      }).catch(() => {});
    } catch (e) {}
  };

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    companyName: 'GCC TAXI',
    companyName_en: 'GCC TAXI',
    heroTitle: 'GCC TAXI',
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
    telegram: '',
    primaryColor: '#D4AF37',
    secondaryColor: '#1A1A1A',
    accentColor: '#F5F5F5',
    borderRadius: '1.5rem',
    glassmorphism: true,
    shadowIntensity: 0.15,
    fontFamily: '"Inter", "Noto Sans Arabic", sans-serif',
    buttonStyle: 'rounded',
    adminEmails: ['ahjm91@gmail.com'],
    pricePerKm: 0.5,
    baseFee: 2,
    vipSurcharge: 5,
    vanSurcharge: 12,
    paymentGateway: 'WhatsApp',
    myFatoorahIsSandbox: true,
    tapSecretKey: '',
    cryptoWalletAddress: '',
    showHeaderSocials: false,
    showFooterSocials: true,
    showHeaderLogo: true,
    showFooterLogo: true,
    showHeroSection: true,
    showServicesSection: true,
    showSpecializedSection: true,
    showAboutSection: true,
    showBookingSection: true,
    showCTASection: true,
    commissionRate: 10,
    spacingFactor: 1.0,
    layoutDensity: 'spacious',
    sectionOrder: ['hero', 'booking', 'services', 'specialized', 'about', 'cta'],
    siteTitle: 'GCC TAXI | فخامة التنقل',
    siteTitle_en: 'GCC TAXI | Luxury Travel',
    bookingButtonText: 'احجز الآن',
    bookingButtonText_en: 'Book Now'
  });

  // Dynamic Theme Applier
  useEffect(() => {
    const root = document.documentElement;
    const primary = siteSettings.primaryColor || '#D4AF37';
    const secondary = siteSettings.secondaryColor || '#1A1A1A';
    const accent = siteSettings.accentColor || '#F5F5F5';
    const radius = siteSettings.borderRadius || '1.5rem';
    const font = siteSettings.fontFamily || '"Inter", "Noto Sans Arabic", sans-serif';
    const spacing = siteSettings.spacingFactor || 1.0;

    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--radius', radius);
    root.style.setProperty('--font-custom', font);
    root.style.setProperty('--spacing-factor', spacing.toString());
    
    // Density mappings
    const densityMap = {
      compact: '0.7',
      comfortable: '1.0',
      spacious: '1.4'
    };
    root.style.setProperty('--density-factor', densityMap[siteSettings.layoutDensity || 'comfortable']);
    
    // Apply button style
    let btnRadius = radius;
    if (siteSettings.buttonStyle === 'sharp') btnRadius = '0px';
    if (siteSettings.buttonStyle === 'pill') btnRadius = '9999px';
    root.style.setProperty('--btn-radius', btnRadius);

    // Apply shadow intensity
    root.style.setProperty('--shadow-lux', `0 10px 30px -5px rgba(0,0,0, ${siteSettings.shadowIntensity || 0.1})`);
    
    // Glassmorphism effect
    if (siteSettings.glassmorphism) {
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.8)');
      root.style.setProperty('--glass-blur', '10px');
    } else {
      root.style.setProperty('--glass-bg', '#ffffff');
      root.style.setProperty('--glass-blur', '0px');
    }
  }, [siteSettings]);

  // Update SEO Page Title
  useEffect(() => {
    const customTitle = lang === 'ar' ? siteSettings.siteTitle : (siteSettings.siteTitle_en || siteSettings.siteTitle);
    if (customTitle) {
      document.title = customTitle;
    } else {
      const company = lang === 'ar' ? siteSettings.companyName : (siteSettings.companyName_en || siteSettings.companyName);
      document.title = `${company} | ${lang === 'ar' ? 'تاكسي البحرين والخليج' : 'Bahrain & GCC Taxi'}`;
    }
  }, [siteSettings.companyName, siteSettings.companyName_en, siteSettings.siteTitle, siteSettings.siteTitle_en, lang]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBookingSuccessOpen, setIsBookingSuccessOpen] = useState(false);
  const [lastBookingInfo, setLastBookingInfo] = useState<Trip | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isDriverDashboardOpen, setIsDriverDashboardOpen] = useState(false);
  const [isCustomerDashboardOpen, setIsCustomerDashboardOpen] = useState(false);
  const [customerTab, setCustomerTab] = useState<'trips' | 'rewards'>('trips');
  const [bookingMode, setBookingMode] = useState<'fixed' | 'custom' | 'realtime'>('fixed');
  const [activeRealtimeBooking, setActiveRealtimeBooking] = useState<Booking | null>(null);
  const [activeDriver, setActiveDriver] = useState<Driver | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [customerTrips, setCustomerTrips] = useState<Trip[]>([]);
  const [userRealtimeBookings, setUserRealtimeBookings] = useState<Booking[]>([]);
  const [paymentTrip, setPaymentTrip] = useState<Trip | null>(null);
  const [searchTripId, setSearchTripId] = useState('');
  const [isSearchingTrip, setIsSearchingTrip] = useState(false);
  const [isTranslating, setIsTranslating] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

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

  // Real-time Booking Listener
  useEffect(() => {
    if (!activeRealtimeBooking?.id) return;

    const unsub = onSnapshot(doc(db, 'bookings', activeRealtimeBooking.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() } as Booking;
        if (data.status === 'completed' && activeRealtimeBooking?.status !== 'completed' && !data.rating) {
          setCompletedBooking(data);
          setShowRatingModal(true);
        }
        
        setActiveRealtimeBooking(data);

        // If driver assigned, start tracking them
        if (data.assignedDriverId && (!activeDriver || activeDriver.id !== data.assignedDriverId)) {
          const driverRef = doc(db, 'drivers', data.assignedDriverId);
          getDoc(driverRef).then(snap => {
            if (snap.exists()) setActiveDriver({ id: snap.id, ...snap.data() } as Driver);
          });
        }

        // If completed or cancelled, clear after a delay
        if (['completed', 'cancelled', 'no_driver_found'].includes(data.status)) {
          setTimeout(() => {
            setActiveRealtimeBooking(null);
            setActiveDriver(null);
          }, 10000); // Keep map visible for 10s
        }
      }
    });

    return () => unsub();
  }, [activeRealtimeBooking?.id, activeDriver]);

  // Driver Location Tracking Listener
  useEffect(() => {
    if (!activeDriver?.id || !activeRealtimeBooking) return;

    const unsub = onSnapshot(doc(db, 'drivers', activeDriver.id), (snapshot) => {
      if (snapshot.exists()) {
        setActiveDriver({ id: snapshot.id, ...snapshot.data() } as Driver);
      }
    });

    return () => unsub();
  }, [activeDriver?.id, activeRealtimeBooking]);

  // Dynamic Theme Applier
  const safeDeleteDoc = async (docRef: any) => {
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docRef.path);
    }
  };
  const [activeTab, setActiveTab] = useState<'content' | 'accounting' | 'branding' | 'pricing' | 'users'>('content');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isAdminScheduleView, setIsAdminScheduleView] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [isTripFormOpen, setIsTripFormOpen] = useState(false);
  const [tripFilter, setTripFilter] = useState<'all' | 'requested' | 'unpaid' | 'pending_price'>('all');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [tripFormData, setTripFormData] = useState<Partial<Trip>>({
    bookingType: 'transfer',
    firstName: '',
    lastName: '',
    customerName: '',
    email: '',
    phone: '',
    passengers: 1,
    bags: 0,
    carType: 'Standard',
    direction: '',
    pickup: '',
    dropoff: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    hours: 1,
    amount: 0,
    driverType: 'In',
    driverName: '',
    driverCost: 0,
    paymentStatus: 'Pending',
    notes: '',
    specialRequests: ''
  });
  
  const [services, setServices] = useState<Service[]>([]);
  const [specializedServices, setSpecializedServices] = useState<SpecializedService[]>([]);
  const [fixedRoutes, setFixedRoutes] = useState<FixedRoute[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
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

  const [isBooking, setIsBooking] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    bookingType: 'transfer',
    firstName: '',
    lastName: '',
    customerName: '',
    email: '',
    phone: '',
    countryCode: '+973',
    confirmPhone: '',
    pickup: '',
    dropoff: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    hours: 1,
    passengers: 1,
    bags: 0,
    carType: 'Standard',
    service: 'luxury',
    specialRequests: ''
  });

  // Image Auto-Repair for Admin
  useEffect(() => {
    if (isAdmin && (services.length > 0 || specializedServices.length > 0)) {
      const brokenIds = ['1519491050282', '1436491865332', '1549317661-bd32c860f2b2'];
      
      const repairImages = async () => {
        let hasFixed = false;
        // Fix main services
        for (const s of services) {
          if (brokenIds.some(id => (s.image || '').includes(id))) {
            console.log('Auto-repairing service image:', s.name);
            await updateDoc(doc(db, 'services', s.id), { 
              image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800' 
            });
            hasFixed = true;
          }
        }

        // Fix specialized services
        for (const s of specializedServices) {
          if (brokenIds.some(id => (s.image || '').includes(id))) {
            console.log('Auto-repairing specialized image:', s.title);
            let replacement = 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=800';
            if (s.title.includes('دبي') || s.title_en?.includes('Dubai')) replacement = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800';
            if (s.title.includes('أبو ظبي') || s.title_en?.includes('Abu Dhabi')) replacement = 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800';
            
            await updateDoc(doc(db, 'specialized_services', s.id), { image: replacement });
            hasFixed = true;
          }
        }
        
        if (hasFixed) {
          console.log('Image auto-repair completed successfully.');
        }
      };
      repairImages();
    }
  }, [isAdmin, services, specializedServices]);

  useEffect(() => {
    const checkAdmin = () => {
      if (!user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsEmailVerified(false);
        return;
      }
      const primaryAdmin = 'ahjm91@gmail.com';
      setIsSuperAdmin(user.email === primaryAdmin);
      setIsEmailVerified(!!user.emailVerified);
    };
    checkAdmin();
  }, [user]);

  // Auth & Data Fetching
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time Profile Sync
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setIsAdmin(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        
        let needsUpdate = false;
        const updates: any = {};

        // If existing user has no membership number, assign one
        if (!profile.membershipNumber) {
          try {
            await runTransaction(db, async (transaction) => {
              const statsRef = doc(db, 'settings', 'stats');
              const statsSnap = await transaction.get(statsRef);
              
              let nextNum = 1250;
              if (statsSnap.exists()) {
                nextNum = (statsSnap.data().lastMembershipNumber || 1249) + 1;
              }
              
              transaction.update(userRef, { membershipNumber: nextNum });
              transaction.set(statsRef, { lastMembershipNumber: nextNum }, { merge: true });
              profile.membershipNumber = nextNum;
            });
          } catch (e) {
            console.error("Error assigning membership number:", e);
          }
        }
        
        // Generate referral code if missing
        if (!profile.referralCode) {
          updates.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await updateDoc(userRef, updates);
        }
        
        setUserProfile(profile);
        
        // Recalculate admin status based on profile role or email
        const primaryAdmin = 'ahjm91@gmail.com';
        const isEmailMatch = user.email === primaryAdmin || (siteSettings.adminEmails?.includes(user.email || ''));
        const isUserAdmin = (isEmailMatch && (user.emailVerified === true || user.email === primaryAdmin)) || profile.role === 'admin';
        setIsAdmin(isUserAdmin);
      } else {
        const primaryAdmin = 'ahjm91@gmail.com';
        const isEmailMatch = user.email === primaryAdmin || (siteSettings.adminEmails?.includes(user.email || ''));
        const isUserAdmin = (isEmailMatch && (user.emailVerified === true || user.email === primaryAdmin));

        try {
          await runTransaction(db, async (transaction) => {
            const statsRef = doc(db, 'settings', 'stats');
            const statsSnap = await transaction.get(statsRef);
            
            let nextNum = 1250;
            if (statsSnap.exists()) {
              nextNum = (statsSnap.data().lastMembershipNumber || 1249) + 1;
            }

            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'عميل جديد',
              email: user.email || '',
              photoURL: user.photoURL || '',
              role: isUserAdmin ? 'admin' : 'customer',
              createdAt: new Date().toISOString(),
              membershipStatus: 'Bronze',
              membershipNumber: nextNum,
              isVerified: false,
              verificationMessage: 'جاري مراجعة طلب اشتراكك من قبل الإدارة لتفعيل العضوية.',
              cashbackBalance: 0,
              availableRewards: [],
              referralCode: Math.random().toString(36).substring(2, 8).toUpperCase()
            };

            transaction.set(userRef, newProfile);
            transaction.set(statsRef, { lastMembershipNumber: nextNum }, { merge: true });
            setUserProfile(newProfile);
            setIsAdmin(isUserAdmin);
          });
        } catch (e) {
          console.error("Error creating profile with membership number:", e);
        }
      }
    });

    return () => unsubscribeProfile();
  }, [user, siteSettings.adminEmails]);

  useEffect(() => {
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
        const data = snapshot.data();
        setSiteSettings(prev => ({ ...prev, ...data }));
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
    let unsubscribeBookings = () => {};
    if (isAdmin) {
      unsubscribeTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
        setTrips(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'trips'));

      unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setBookings(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'bookings'));

      onSnapshot(collection(db, 'drivers'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
        setAllDrivers(data);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'drivers'));
    } else if (user) {
      const q = query(collection(db, 'trips'), where('userId', '==', user.uid));
      unsubscribeTrips = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
        setCustomerTrips(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'trips (customer)'));

      const qRealtime = query(collection(db, 'bookings'), where('userId', '==', user.uid));
      unsubscribeBookings = onSnapshot(qRealtime, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setUserRealtimeBookings(data);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'bookings (customer)'));
    }

    let unsubscribeUsers = () => {};
    if (isAdmin && activeTab === 'users') {
      setIsUsersLoading(true);
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any as UserProfile));
        setUsers(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setIsUsersLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
        setIsUsersLoading(false);
      });
    }

    return () => {
      unsubscribeServices();
      unsubscribeSpecialized();
      unsubscribeFixedRoutes();
      unsubscribeSettings();
      unsubscribeTrips();
      unsubscribeBookings();
      unsubscribeUsers();
    };
  }, [isAdmin, user, activeTab]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Real-time price calculation for booking form
  useEffect(() => {
    if (bookingMode === 'fixed') {
      const matchedRoute = fixedRoutes.find(r => 
        r.pickup.trim().toLowerCase() === bookingData.pickup.trim().toLowerCase() && 
        r.dropoff.trim().toLowerCase() === bookingData.dropoff.trim().toLowerCase()
      );

      if (matchedRoute) {
        let price = matchedRoute.price;
        if (bookingData.carType === 'VIP') price += (siteSettings.vipSurcharge || 5);
        else if (bookingData.carType === 'Van') price += (siteSettings.vanSurcharge || 12);
        
        // Apply Promo Code
        let discount = 0;
        if (bookingData.promoCode) {
          const promo = siteSettings.promoCodes?.find(p => p.code === bookingData.promoCode.toUpperCase());
          if (promo) {
            discount = (price * promo.discountPercent) / 100;
            price -= discount;
          }
        }

        if (bookingData.amount !== price || bookingData.discount !== discount) {
          setBookingData(prev => ({ ...prev, amount: price, discount: discount }));
        }
      } else {
        if (bookingData.amount !== 0) {
          setBookingData(prev => ({ ...prev, amount: 0 }));
        }
      }
    } else {
      // For custom mode, we don't auto-calculate price unless we have a distance-based logic
      // But for now, we reset it to 0 so it shows "Price on Request"
      if (bookingData.amount !== 0) {
        setBookingData(prev => ({ ...prev, amount: 0 }));
      }
    }
  }, [bookingMode, bookingData.pickup, bookingData.dropoff, bookingData.carType, fixedRoutes]);

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
    console.log('Booking form submitted. Gateway:', siteSettings.paymentGateway, 'Amount:', bookingData.amount);
    
    if (isBooking) {
      console.log('Already booking, ignoring click');
      return;
    }
    setIsBooking(true);
    
    try {
      console.log('Validating booking data...');
      
      if (!bookingData.phone || !bookingData.customerName || !bookingData.pickup) {
        alert(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Please fill in all required fields.');
        setIsBooking(false);
        return;
      }

      if (bookingMode === 'realtime') {
        const response = await fetch('/api/create-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: bookingData.customerName,
            phone: `${bookingData.countryCode || ''} ${bookingData.phone}`.trim(),
            pickupLocation: { lat: 26.22, lng: 50.58 }, // Demo coordinates, in real app would use geocoding
            dropoffLocation: { lat: 26.25, lng: 50.60 },
            pickupAddress: bookingData.pickup,
            dropoffAddress: bookingData.dropoff,
            carType: bookingData.carType,
            price: 15 // Mock price for demo
          })
        });
        const result = await response.json();
        if (result.success) {
          setActiveRealtimeBooking({
            id: result.bookingId,
            customerName: bookingData.customerName,
            phone: bookingData.phone,
            pickupAddress: bookingData.pickup,
            dropoffAddress: bookingData.dropoff,
            carType: bookingData.carType,
            status: 'searching_driver',
            pickupLocation: { lat: 26.22, lng: 50.58 },
            dropoffLocation: { lat: 26.25, lng: 50.60 },
            price: 15,
            createdAt: new Date(),
            assignedDriverId: null
          });
          // Scroll to tracking section
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          throw new Error(result.error);
        }
        setIsBooking(false);
        return;
      }

      console.log('Calculating price...');
      
      // Generate Booking Number DD/MM/YYYY/N
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const monthKey = `${year}-${month}`;
      let sequence = Math.floor(1000 + Math.random() * 9000); // More unique default

      try {
        await runTransaction(db, async (transaction) => {
          const counterRef = doc(db, 'counters', `bookings_${monthKey}`);
          const counterSnap = await transaction.get(counterRef);
          if (counterSnap.exists()) {
            const currentCount = counterSnap.data().count || 0;
            sequence = currentCount + 1;
            transaction.update(counterRef, { count: sequence });
          } else {
            sequence = 1;
            transaction.set(counterRef, { count: 1 });
          }
        });
      } catch (e) {
        console.error("Error generating sequence:", e);
      }

      const bookingNumber = `${day}/${month}/${year}/${sequence}`;

      // Determine if it's a custom booking or fixed
      const isFixed = bookingMode === 'fixed';
      
      // Check for fixed price
      let matchedRoute = null;
      if (isFixed) {
        matchedRoute = fixedRoutes.find(r => 
          (r.pickup.trim().toLowerCase() === (bookingData.pickup || '').trim().toLowerCase() && 
           r.dropoff.trim().toLowerCase() === (bookingData.dropoff || '').trim().toLowerCase()) ||
          r.id === bookingData.promoCode // Fallback check if id was stored in promoCode during selection hack
        );
      }
      
      let finalAmount = bookingData.amount || (matchedRoute ? matchedRoute.price : 0);

      // Final protective check for amount if it's still 0 but we have a matched route
      if (!finalAmount && matchedRoute) {
        finalAmount = matchedRoute.price;
        if (bookingData.carType === 'VIP') finalAmount += (siteSettings.vipSurcharge || 5);
        else if (bookingData.carType === 'Van') finalAmount += (siteSettings.vanSurcharge || 12);
      }
      
      console.log('Final amount calculated:', finalAmount);

      // Save to Firestore first
      const tripData: Omit<Trip, 'id'> = {
        userId: user?.uid || null,
        bookingType: bookingData.bookingType || 'transfer',
        firstName: bookingData.firstName || '',
        lastName: bookingData.lastName || '',
        customerName: `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim() || bookingData.customerName || 'عميل',
        email: bookingData.email || '',
        phone: `${bookingData.countryCode || ''} ${bookingData.phone}`.trim() || '',
        passengers: bookingData.passengers || 1,
        bags: bookingData.bags || 0,
        carType: bookingData.carType || 'Standard',
        direction: bookingData.bookingType === 'hourly' 
          ? `${t('hourly')} (${bookingData.hours} ${t('hours')}) - ${bookingData.pickup}`
          : `${bookingData.pickup} ← ${bookingData.dropoff}`,
        pickup: bookingData.pickup || '',
        dropoff: bookingData.bookingType === 'hourly' ? `${bookingData.hours} ${t('hours')}` : (bookingData.dropoff || ''),
        distance: bookingData.distance || 0,
        date: bookingData.date || new Date().toISOString().split('T')[0],
        time: bookingData.time || '10:00',
        hours: bookingData.hours || 1,
        amount: Number(finalAmount) || 0,
        driverType: 'In',
        driverName: '',
        driverCost: 0,
        profit: (Number(finalAmount) * (siteSettings.commissionRate || 10)) / 100,
        paymentStatus: 'Pending',
        status: Number(finalAmount) > 0 ? 'Confirmed' : 'Requested',
        notes: !isFixed ? 'طلب حجز مخصص' : (matchedRoute ? 'حجز تلقائي (سعر ثابت)' : 'حجز عبر الموقع'),
        specialRequests: bookingData.specialRequests || '',
        bookingNumber: bookingNumber,
        createdAt: new Date().toISOString()
      };

      console.log('Saving to server...', tripData);
      const bookingResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tripData,
          analytics: {
            userAgent: navigator.userAgent,
            language: navigator.language
          }
        })
      });
      
      const result = await bookingResponse.json();
      if (!result.success) {
        throw new Error('فشل حفظ البيانات في قاعدة البيانات');
      }
      
      const newTrip = { id: result.id, ...tripData } as Trip;
      
      logAnalyticsEvent('booking_step_1_submit', 'booking', newTrip.bookingNumber, { amount: newTrip.amount });
      
      // Notify Admin via Email (Non-blocking)
      console.log('Sending notification email in background...');
      fetch('/api/notify-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTrip, companyName: siteSettings.companyName })
      }).catch(e => console.error('Background Notify error:', e));

      // WhatsApp Message Construction
      const fullPhone = `${bookingData.countryCode || ''} ${bookingData.phone}`.trim();
      
      const adminMessage = `👋 *طلب حجز جديد*\n\n` +
                           `مرحباً، أرغب في تأكيد الحجز التالي:\n\n` +
                           `🎫 رقم الحجز: ${bookingNumber}\n` +
                           `👤 العميل: ${tripData.customerName}\n` +
                           `📞 الهاتف: ${fullPhone}\n` +
                           `📍 المسار: ${tripData.direction}\n` +
                           `📅 التاريخ: ${tripData.date}\n` +
                           `🕒 الوقت: ${tripData.time}\n` +
                           `👥 الركاب: ${tripData.passengers}\n` +
                           `🚘 نوع السيارة: ${tripData.carType}\n` +
                           `💰 السعر: ${newTrip.amount > 0 ? newTrip.amount + ' BHD' : (lang === 'ar' ? 'بانتظار التسعير' : 'Pending Price')}`;
      
      const rawWhatsapp = siteSettings.notificationWhatsapp || siteSettings.whatsapp || '97332325997';
      const cleanWhatsapp = rawWhatsapp.replace(/\D/g, '').replace(/^0+/, ''); 
      // Ensure Bahrain numbers (8 digits) are prefixed with 973
      const finalWhatsapp = cleanWhatsapp.length === 8 ? `973${cleanWhatsapp}` : (cleanWhatsapp || '97332325997');
      const whatsappUrl = `https://wa.me/${finalWhatsapp}?text=${encodeURIComponent(adminMessage)}`;

      // Show success modal instead of direct redirect
      setLastBookingInfo({ ...newTrip, notes: whatsappUrl }); 
      setIsBookingSuccessOpen(true);
      
      // Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [siteSettings.primaryColor || '#D4AF37', '#ffffff', '#B8860B']
      });

      const resetForm = () => {
        setBookingData({
          customerName: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          countryCode: '+973',
          confirmPhone: '',
          pickup: '',
          dropoff: '',
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          passengers: 1,
          bags: 0,
          carType: 'Standard',
          service: 'luxury',
          bookingType: 'transfer',
          hours: 1,
          specialRequests: ''
        });
      };
        
      resetForm();
    } catch (error) {
      console.error('Booking failed:', error);
      const errorMsg = lang === 'ar' ? 'فشل إرسال الطلب، يرجى المحاولة مرة أخرى.' : 'Booking failed, please try again.';
      alert(errorMsg);
    } finally {
      setIsBooking(false);
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
        description: 'نحن في GCC TAXI نفخر بتقديم أسطول من السيارات العائلية الحديثة والمريحة، المصممة خصيصاً لتناسب السفرات الطويلة والرحلات البرية. سياراتنا ملائمة تماماً للجلوس لفترات طويلة، حيث توفر مساحة واسعة تتسع لـ 7-8 ركاب براحة تامة، مع مساحة كبيرة للأمتعة ونظام ترفيهي متكامل لضمان استمتاعكم بكل لحظة.',
        description_en: 'At GCC TAXI, we are proud to offer a fleet of modern and comfortable family cars, specifically designed for long trips and road travel. Our cars are perfectly suited for long sitting periods, providing ample space for 7-8 passengers in complete comfort, with large luggage space and an integrated entertainment system to ensure you enjoy every moment.',
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
        desc: 'احجز رحلتك من وإلى أبو ظبي مع GCC TAXI، حيث الراحة والرفاهية في كل كيلومتر.',
        desc_en: 'Book your trip to and from Abu Dhabi with GCC TAXI, where comfort and luxury are in every kilometer.',
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
      companyName: 'GCC TAXI',
      companyName_en: 'GCC TAXI',
      heroTitle: 'GCC TAXI',
      heroTitle_en: 'GCC TAXI',
      heroSubtitle: 'فخامة التنقل',
      heroSubtitle_en: 'Luxury Mobility',
      heroDescription: 'نقدم لك أرقى خدمات التوصيل واللوميزين في مملكة البحرين وجميع دول الخليج. دقة في المواعيد، رفاهية مطلقة، وسائقون محترفون.',
      heroDescription_en: 'We offer you the finest delivery and limousine services in the Kingdom of Bahrain and all GCC countries. Punctuality, absolute luxury, and professional drivers.',
      heroImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1920',
      phone: '+973 32325997',
      whatsapp: '97332325997',
      notificationWhatsapp: '97332325997',
      logo: '',
      instagram: '',
      tiktok: '',
      twitter: '',
      telegram: '',
      primaryColor: '#D4AF37', // Gold
      secondaryColor: '#1A1A1A', // Dark
      accentColor: '#F5F5F5', // Light Gray
      borderRadius: '1.5rem',
      footerAbout: 'نحن متخصصون في تقديم خدمات النقل العائلي والفاخر، مع التركيز على الراحة والأمان في السفرات الطويلة بين مدن المملكة ودول الخليج.',
      footerAbout_en: 'We specialize in providing family and luxury transportation services, focusing on comfort and safety in long trips between the cities of the Kingdom and the GCC countries.',
      footerAddress: 'مملكة البحرين وجميع دول الخليج',
      footerAddress_en: 'Kingdom of Bahrain and all GCC countries',
      adminEmails: ['ahjm91@gmail.com'],
      pricePerKm: 0.5,
      baseFee: 2,
      vipSurcharge: 5,
      vanSurcharge: 12,
      paymentGateway: 'WhatsApp',
      myFatoorahIsSandbox: true,
      tapSecretKey: '',
      cryptoWalletAddress: '',
      showHeaderSocials: false,
      showFooterSocials: true,
      showHeaderLogo: true,
      showFooterLogo: true,
      showHeroSection: true,
      showServicesSection: true,
      showSpecializedSection: true,
      showAboutSection: true,
      showBookingSection: true,
      showCTASection: true
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
        body: JSON.stringify({ trips: upcomingTrips, companyName: siteSettings.companyName })
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

    let bookingNumber = tripFormData.bookingNumber;
    if (!editingTrip && !bookingNumber) {
      // Generate Booking Number DD/MM/YYYY/N
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const monthKey = `${year}-${month}`;
      let sequence = 1;

      try {
        await runTransaction(db, async (transaction) => {
          const counterRef = doc(db, 'counters', `bookings_${monthKey}`);
          const counterSnap = await transaction.get(counterRef);
          if (counterSnap.exists()) {
            sequence = (counterSnap.data().count || 0) + 1;
            transaction.update(counterRef, { count: sequence });
          } else {
            transaction.set(counterRef, { count: 1 });
          }
        });
        bookingNumber = `${day}/${month}/${year}/${sequence}`;
      } catch (e) {
        console.error("Error generating sequence:", e);
      }
    }
    
    const data = {
      ...tripFormData,
      amount,
      driverCost,
      profit,
      bookingNumber,
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
        bookingType: 'transfer',
        firstName: '',
        lastName: '',
        customerName: '',
        email: '',
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
        hours: 1,
        amount: 0,
        driverType: 'In',
        driverName: '',
        driverCost: 0,
        paymentStatus: 'Pending',
        status: 'Requested',
        notes: '',
        specialRequests: ''
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
      <Navigation 
        lang={lang} 
        setLang={setLang}
        siteSettings={siteSettings}
        user={user}
        isAdmin={isAdmin}
        isDriver={userProfile?.role === 'driver'}
        setIsDashboardOpen={setIsDashboardOpen}
        setIsDriverDashboardOpen={setIsDriverDashboardOpen}
        setIsCustomerDashboardOpen={setIsCustomerDashboardOpen}
        setIsPaymentOpen={setIsPaymentOpen}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      {isDriverDashboardOpen ? (
        <div className="pt-20 min-h-screen bg-gray-50">
          <button 
            onClick={() => setIsDriverDashboardOpen(false)}
            className="fixed bottom-8 left-8 z-50 bg-dark text-white p-4 rounded-full shadow-2xl hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">{lang === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}</span>
          </button>
          <DriverDashboard />
        </div>
      ) : (
        <>
          {activeRealtimeBooking && (
        <section className="bg-dark py-12 px-4 md:px-8 border-b border-white/5">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-12 text-white items-center">
            <div className="lg:col-span-1 space-y-8">
              <div className="inline-flex items-center gap-2 bg-gold text-dark px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-gold/20">
                <NavigationIcon className="w-3 h-3 animate-pulse" />
                {lang === 'ar' ? 'رحلة قيد البحث' : 'Live Tracking'}
              </div>
              <div>
                <h3 className="text-4xl font-black mb-2">{lang === 'ar' ? 'تتبع رحلتك الآن' : 'Track Your Ride'}</h3>
                <p className="text-gray-400 font-bold">
                  {activeRealtimeBooking.status === 'searching_driver' 
                    ? (lang === 'ar' ? 'نبحث عن أقرب سائق متاح...' : 'Finding nearby drivers...')
                    : (lang === 'ar' ? 'تم تعيين سائق لطلبك!' : 'Driver is on the way!')}
                </p>
              </div>

              {activeDriver && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center gap-6"
                >
                  <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center shrink-0 border-4 border-dark overflow-hidden">
                    <Car className="w-10 h-10 text-dark" />
                  </div>
                  <div className="flex-1">
                    {activeDriver.carImage && (
                      <div className="mb-4">
                        <img 
                          src={activeDriver.carImage} 
                          alt="Vehicle" 
                          className="w-full h-32 object-cover rounded-xl border border-white/10" 
                        />
                      </div>
                    )}
                    <h4 className="text-xl font-bold">{activeDriver.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-gold text-sm font-black">{activeDriver.carType}</p>
                      <span className="text-white/20 text-xs">•</span>
                      <p className="text-gray-400 font-mono text-sm">{activeDriver.plateNumber || (lang === 'ar' ? 'بدون رقم لوحة' : 'No plate number')}</p>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <a href={`tel:${activeDriver.phone}`} className="flex-1 bg-white/10 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-all">
                        <Phone className="w-4 h-4" />
                        <span className="text-xs font-bold">{lang === 'ar' ? 'اتصال' : 'Call'}</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold text-sm">{lang === 'ar' ? 'رقم الطلب' : 'Booking ID'}</span>
                  <span className="font-mono text-sm text-gold">{activeRealtimeBooking.id.slice(-6)}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>{lang === 'ar' ? 'السعر المقدر' : 'Est. Price'}</span>
                  <span className="text-gold text-2xl">BHD {activeRealtimeBooking.price}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <LiveTrackingMap 
                driverLocation={activeDriver?.location || null}
                pickupLocation={activeRealtimeBooking.pickupLocation}
                dropoffLocation={activeRealtimeBooking.dropoffLocation}
              />
            </div>
          </div>
        </section>
      )}

          {/* Dynamic Landing Sections */}
          {siteSettings.sectionOrder?.map((sectionId) => {
            switch (sectionId) {
              case 'hero':
                return siteSettings.showHeroSection && (
                  <Hero 
                    key="hero"
                    lang={lang}
                    siteSettings={siteSettings}
                    t={t}
                    bookingMode={bookingMode}
                    setBookingMode={setBookingMode}
                    fixedRoutes={fixedRoutes}
                    bookingData={bookingData}
                    setBookingData={setBookingData}
                    handleBookingSubmit={handleBookingSubmit}
                    isBooking={isBooking}
                  />
                );
              case 'services':
                return siteSettings.showServicesSection && (
                  <Services 
                    key="services"
                    lang={lang}
                    services={services}
                    t={t}
                  />
                );
              case 'specialized':
                return siteSettings.showSpecializedSection && (
                  <SpecializedServices 
                    key="specialized"
                    lang={lang}
                    specializedServices={specializedServices}
                    t={t}
                  />
                );
              case 'about':
                return siteSettings.showAboutSection && (
                  <WhyUs 
                    key="about"
                    lang={lang}
                    siteSettings={siteSettings}
                    t={t}
                  />
                );
              case 'cta':
                return siteSettings.showCTASection && (
                  <CTA 
                    key="cta"
                    lang={lang}
                    siteSettings={siteSettings}
                    t={t}
                  />
                );
              default:
                return null;
            }
          })}

      {/* Footer */}
      <Footer 
        lang={lang} 
        siteSettings={siteSettings} 
        userProfile={userProfile}
        handleLogin={handleLogin}
      />

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
                      <p><strong>Company Name:</strong> {siteSettings.companyName_en || siteSettings.companyName}</p>
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
                    <p>نحن في {lang === 'ar' ? siteSettings.companyName : (siteSettings.companyName_en || siteSettings.companyName)} نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا للمعلومات التي تقدمها لنا.</p>
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
    </>
  )}

  <AdminDashboard
    isOpen={isDashboardOpen && isAdmin}
    onClose={() => setIsDashboardOpen(false)}
    siteSettings={siteSettings}
    setSiteSettings={setSiteSettings}
    trips={trips}
    bookings={bookings}
    users={users}
    allDrivers={allDrivers}
    services={services}
    specializedServices={specializedServices}
    fixedRoutes={fixedRoutes}
    isUsersLoading={isUsersLoading}
    activeTab={activeTab}
    setActiveTab={setActiveTab as any}
    lang={lang}
    isSuperAdmin={isSuperAdmin}
    setEditingTrip={setEditingTrip}
    setTripFormData={setTripFormData}
    setIsTripFormOpen={setIsTripFormOpen}
    setTripToDelete={setTripToDelete}
    handleSaveSettings={handleSaveSettings}
    handleImageUpload={handleImageUpload}
    safeAddDoc={safeAddDoc}
    safeUpdateDoc={safeUpdateDoc}
    safeDeleteDoc={safeDeleteDoc}
  />

  <PaymentModal
    isOpen={isPaymentOpen}
    onClose={() => setIsPaymentOpen(false)}
    siteSettings={siteSettings}
    lang={lang}
    t={t}
    initialTrip={paymentTrip}
  />

  <CustomerDashboardModal
    isOpen={isCustomerDashboardOpen}
    onClose={() => setIsCustomerDashboardOpen(false)}
    lang={lang}
    t={t}
    siteSettings={siteSettings}
    userProfile={userProfile}
    customerTrips={customerTrips}
    realtimeBookings={userRealtimeBookings}
    customerTab={customerTab}
    setCustomerTab={setCustomerTab}
    onPayNow={(trip) => {
      setPaymentTrip(trip);
      setIsPaymentOpen(true);
      setIsCustomerDashboardOpen(false);
    }}
  />

  <TripForm
    isOpen={isTripFormOpen}
    onClose={() => setIsTripFormOpen(false)}
    editingTrip={editingTrip}
    tripFormData={tripFormData}
    setTripFormData={setTripFormData}
    onSubmit={handleSaveTrip}
    isSuperAdmin={isSuperAdmin}
    lang={lang}
  />

  <TripDeleteModal
    trip={tripToDelete}
    onClose={() => setTripToDelete(null)}
    onConfirm={async () => {
      if (tripToDelete) {
        await safeDeleteDoc(doc(db, 'trips', tripToDelete.id));
        setTripToDelete(null);
      }
    }}
    lang={lang}
  />

  {/* Soft Confirmation Modal */}
  <AnimatePresence>
    {isBookingSuccessOpen && lastBookingInfo && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-dark/90 backdrop-blur-md"
          onClick={() => setIsBookingSuccessOpen(false)}
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 30 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          className="relative bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gold p-8 text-center text-white relative">
            <div className="absolute top-6 right-6">
              <button 
                onClick={() => setIsBookingSuccessOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black mb-1">{lang === 'ar' ? 'تم تسجيل طلبك بنجاح!' : 'Booking Registered!'}</h2>
            <p className="text-white/80 font-bold text-sm tracking-widest">{lastBookingInfo.bookingNumber}</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-gray-50 rounded-[2rem] p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('customerName')}</span>
                <span className="font-bold text-dark">{lastBookingInfo.customerName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('pickup')}</span>
                <span className="font-bold text-dark truncate max-w-[200px]">{lastBookingInfo.pickup}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('carType')}</span>
                <span className="px-3 py-1 bg-gold/10 text-gold rounded-full text-[10px] font-black uppercase">
                  {lastBookingInfo.carType}
                </span>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-gold/5 text-gold p-5 rounded-[2rem] flex items-start gap-4 text-right border border-gold/10">
                <div className="bg-gold/10 p-2 rounded-xl shrink-0">
                  <MessageCircle className="w-5 h-5 text-gold" />
                </div>
                <p className="text-xs font-bold leading-relaxed">
                  {lang === 'ar' 
                    ? 'بقي خطوة أخيرة! لتأكيد الحجز وتنسيق السائق المتاح حالياً، يرجى الضغط على الزر أدناه لمتابعة المحادثة عبر واتساب.' 
                    : 'One final step! To confirm your booking and coordinate with the driver, please click the button below to continue via WhatsApp.'}
                </p>
              </div>

              <button
                onClick={() => {
                  logAnalyticsEvent('booking_step_2_whatsapp_click', 'booking', lastBookingInfo.bookingNumber);
                  window.open(lastBookingInfo.notes, '_blank');
                  setIsBookingSuccessOpen(false);
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-5 px-8 rounded-2xl font-black text-lg transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-4 group active:scale-95"
              >
                <div className="bg-white/20 p-2 rounded-xl">
                  <Phone className="w-5 h-5" />
                </div>
                <span>{lang === 'ar' ? 'تأكيد عبر واتساب' : 'Confirm via WhatsApp'}</span>
                <motion.div
                  animate={{ x: lang === 'ar' ? [0, -5, 0] : [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </motion.div>
              </button>

              {lastBookingInfo.amount > 0 && siteSettings.paymentGateway !== 'WhatsApp' && (
                <button
                  onClick={() => {
                    setPaymentTrip(lastBookingInfo);
                    setIsPaymentOpen(true);
                    setIsBookingSuccessOpen(false);
                  }}
                  className="w-full bg-gold text-white py-5 px-8 rounded-2xl font-black text-lg transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-4 group active:scale-95 border-2 border-gold hover:bg-white hover:text-gold"
                >
                  <div className="bg-white/20 group-hover:bg-gold/10 p-2 rounded-xl transition-colors">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span>{lang === 'ar' ? 'الدفع الآن بالبطاقة' : 'Pay Now via Card'}</span>
                </button>
              )}

              <button 
                onClick={() => setIsBookingSuccessOpen(false)}
                className="text-gray-400 text-[10px] font-black hover:text-dark transition-colors uppercase tracking-widest"
              >
                {lang === 'ar' ? 'إغلاق، سأفعل ذلك لاحقاً' : 'Close, I will do it later'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>

  {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && completedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark/80 backdrop-blur-sm"
              onClick={() => setShowRatingModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl space-y-6 text-center"
            >
              <div className="mx-auto w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-gold" fill="currentColor" />
              </div>
              <div>
                <h3 className="text-xl font-black text-dark mb-2">كيف كانت تجربتك؟</h3>
                <p className="text-gray-500 text-sm">تقييمك يساعدنا على تحسين الخدمة</p>
              </div>
              
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      const updateTrip = async () => {
                        if (!completedBooking.id || !completedBooking.assignedDriverId) return;
                        
                        try {
                          // Update booking with rating
                          await updateDoc(doc(db, 'bookings', completedBooking.id), {
                            rating: star
                          });
                          
                          // Update driver rating
                          const driverRef = doc(db, 'drivers', completedBooking.assignedDriverId);
                          const driverSnap = await getDoc(driverRef);
                          if (driverSnap.exists()) {
                             const d = driverSnap.data();
                             const currentRating = d.rating || 5;
                             const total = d.totalRatings || 0;
                             const newRating = ((currentRating * total) + star) / (total + 1);
                             await updateDoc(driverRef, {
                               rating: parseFloat(newRating.toFixed(1)),
                               totalRatings: total + 1
                             });
                          }
                          
                          setShowRatingModal(false);
                          setCompletedBooking(null);
                          alert(lang === 'ar' ? 'شكراً لتقييمك!' : 'Thank you for your rating!');
                        } catch (err) {
                           console.error('Error submitting rating:', err);
                        }
                      };
                      updateTrip();
                    }}
                    className="p-2 hover:scale-110 transition-transform"
                  >
                    <Star className="w-8 h-8 text-gold" />
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => {
                  setShowRatingModal(false);
                  setCompletedBooking(null);
                }}
                className="text-gray-400 text-sm font-bold hover:text-dark transition-colors"
              >
                {lang === 'ar' ? 'تخطي الآن' : 'Skip now'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
