
export type ServiceType = 'luxury';

export interface BookingData {
  bookingType: 'transfer' | 'hourly';
  firstName: string;
  lastName: string;
  customerName: string;
  email: string;
  phone: string;
  countryCode?: string;
  confirmPhone: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  hours?: number;
  passengers: number;
  bags: number;
  carType: 'Standard' | 'VIP' | 'Van';
  service: string;
  specialRequests?: string;
  distance?: number;
  amount?: number;
  promoCode?: string;
  discount?: number;
}

export interface Service {
  id: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  image: string;
  features: string[];
  features_en?: string[];
}

export interface SpecializedService {
  id: string;
  title: string;
  title_en?: string;
  desc: string;
  desc_en?: string;
  image: string;
  iconName: string;
  iconImage?: string;
  price?: string;
  price_en?: string;
  order: number;
}

export interface SiteSettings {
  companyName: string;
  companyName_en?: string;
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
  telegram?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  borderRadius: string;
  glassmorphism?: boolean;
  shadowIntensity?: number;
  fontFamily?: string;
  buttonStyle?: 'rounded' | 'sharp' | 'pill';
  footerAbout: string;
  footerAbout_en?: string;
  footerAddress: string;
  footerAddress_en?: string;
  adminEmails?: string[];
  pricePerKm: number;
  baseFee: number;
  vipSurcharge: number;
  vanSurcharge: number;
  paymentGateway: 'MyFatoorah' | 'Tap' | 'Crypto' | 'WhatsApp';
  myFatoorahToken?: string;
  myFatoorahIsSandbox?: boolean;
  tapSecretKey?: string;
  cryptoWalletAddress?: string;
  showHeaderSocials: boolean;
  showFooterSocials: boolean;
  showHeaderLogo: boolean;
  showFooterLogo: boolean;
  showHeroSection: boolean;
  showServicesSection: boolean;
  showSpecializedSection: boolean;
  showAboutSection: boolean;
  showBookingSection: boolean;
  showCTASection: boolean;
  commissionRate: number;
  promoCodes?: { code: string; discountPercent: number; maxUsage?: number }[];
  
  // Layout & Spacing
  spacingFactor?: number; // 0.5 to 2.0
  layoutDensity?: 'compact' | 'comfortable' | 'spacious';
  sectionOrder?: string[];
  
  // Custom SEO & Headers
  siteTitle?: string;
  siteTitle_en?: string;
  siteDescription?: string;
  siteDescription_en?: string;
  
  // CTAs
  bookingButtonText?: string;
  bookingButtonText_en?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: 'admin' | 'customer' | 'driver';
  createdAt: string;
  membershipStatus: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  membershipNumber: number;
  isVerified: boolean;
  verificationMessage?: string;
  cashbackBalance: number;
  availableRewards: string[]; 
  driverApplicationStatus?: 'pending' | 'approved' | 'rejected';
  wallet?: number;
  referralCode?: string;
  referredBy?: string;
  carImage?: string;
  plateNumber?: string;
  driverApplicationData?: {
    carType: string;
    carModel: string;
    plateNumber: string;
    experience: string;
    fullName: string;
    email: string;
    phone: string;
    dob: string;
    profilePic?: string;
    licensePic?: string;
    licenseExpiry: string;
    appliedAt: string;
  };
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  carType: 'Standard' | 'VIP' | 'Van';
  status: 'online' | 'offline' | 'busy';
  location: Location;
  lastUpdated: any;
  uid?: string;
  plateNumber?: string;
  registrationStatus?: 'pending' | 'approved' | 'rejected';
  adminStatus?: 'active' | 'suspended';
  totalRating?: number;
  ratingCount?: number;
  averageRating?: number;
  wallet?: number;
  carImage?: string;
  rating?: number;
}

export interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  newOrders: number;
  acceptedOrders: number;
  modifiedOrders: number;
  createdAt: string;
  createdBy: string;
}

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupAddress: string;
  dropoffAddress: string;
  carType: 'Standard' | 'VIP' | 'Van';
  price: number;
  commission?: number;
  rating?: number;
  review?: string;
  promoCode?: string;
  discount?: number;
  status: 'pending' | 'searching_driver' | 'driver_assigned' | 'driver_arriving' | 'trip_started' | 'completed' | 'cancelled' | 'no_driver_found';
  assignedDriverId: string | null;
  userId?: string;
  createdAt: any;
}

export interface DriverRequest {
  id?: string;
  driverId: string;
  bookingId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: any;
  expiresAt: number;
}

export interface Trip {
  id: string;
  userId?: string;
  bookingType: 'transfer' | 'hourly';
  firstName: string;
  lastName: string;
  customerName: string;
  email: string;
  phone: string;
  passengers: number;
  bags: number;
  carType: 'Standard' | 'VIP' | 'Van';
  direction: string;
  pickup: string;
  dropoff: string;
  distance?: number;
  date: string;
  time: string;
  hours?: number;
  amount: number;
  driverType: 'In' | 'Out';
  driverName: string;
  driverCost: number;
  profit: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
  status: 'Requested' | 'Confirmed' | 'Completed' | 'Cancelled';
  assignedDriverId?: string;
  notes: string;
  specialRequests?: string;
  membershipNumber?: number;
  bookingNumber?: string;
  createdAt: string;
}

export interface FixedRoute {
  id: string;
  pickup: string;
  pickup_en?: string;
  dropoff: string;
  dropoff_en?: string;
  price: number;
}

export interface PayoutRequest {
  id: string;
  driverId: string;
  driverName: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  bankDetails?: string;
  createdAt: any;
}

export interface Rating {
  id: string;
  bookingId: string;
  driverId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
