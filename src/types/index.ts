export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
  subscription: 'free' | 'pro' | 'elite';
  balance: number;
  // Profile-completion fields — persisted to `profiles` in supabase/schema.sql
  phone?: string;
  country?: string;
  bio?: string;
  skills?: string[];
  dateOfBirth?: string;
  payoutMethodAdded?: boolean;
  profilePicture?: string;
  // KYC & POP fields
  idType?: string;
  idNumber?: string;
  address?: string;
  fullLegalName?: string;
  payoutMethod?: string;
  payoutAccount?: string;
  proofOfPayment?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'rlhf';
  reward: number;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  requiresDesktop?: boolean;
  status: 'available' | 'in-progress' | 'completed';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'task-reward';
  amount: number;
  currency: 'USD' | 'KES';
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  description: string;
}

export interface DeviceInfo {
  cpuCores: number;
  screenWidth: number;
  screenHeight: number;
  os: string;
  browser: string;
  connectionSpeed: 'slow' | 'moderate' | 'fast';
}

export interface PaymentMethod {
  id: string;
  type: 'stripe' | 'paypal' | 'mpesa';
  lastFour?: string;
  isDefault: boolean;
}

export interface CurrencyRate {
  usd: number;
  kes: number;
  rate: number;
  updatedAt: string;
}
