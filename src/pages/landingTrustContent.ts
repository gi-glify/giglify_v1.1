export type LandingPartner = {
  name: string;
  description: string;
  icon: 'supabase' | 'paypal';
};

export type LandingReview = {
  quote: string;
  name: string;
  role: string;
  detail: string;
};

export const LANDING_PARTNERS: LandingPartner[] = [
  {
    name: 'Supabase',
    description: 'Secure data and workflow infrastructure',
    icon: 'supabase',
  },
  {
    name: 'PayPal',
    description: 'PayPal checkout integration',
    icon: 'paypal',
  },
];

// Publish only customer-approved, attributable testimonials.
export const LANDING_REVIEWS: LandingReview[] = [];
