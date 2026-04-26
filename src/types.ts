
export type ServiceType = 'luxury';

export interface BookingData {
  bookingType: 'transfer' | 'hourly';
  firstName: string;
  lastName: string;
  customerName: string;
  email: string;
  phone: string;
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
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: 'admin' | 'customer';
  createdAt: string;
  membershipStatus: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  isVerified: boolean;
  verificationMessage?: string;
  cashbackBalance: number;
  availableRewards: string[]; 
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
  notes: string;
  specialRequests?: string;
  createdAt: string;
}

export interface FixedRoute {
  id: string;
  pickup: string;
  dropoff: string;
  price: number;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
