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

export type LandingFaq = {
  question: string;
  answer: string;
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

export const LANDING_FAQS: LandingFaq[] = [
  {
    question: 'How does Giglify pricing work?',
    answer: 'Workers can use the Free tier for the included task allowance. Pro and Elite packages show their exact USD and M-Pesa KES amounts before payment. Package access activates only after the payment provider confirms the transaction.',
  },
  {
    question: 'What is the activation and payout-verification fee?',
    answer: 'The separate verification flow shows the current fee before you pay. It verifies the payout account and unlocks payout access after the payment is received and approved through the normal review process.',
  },
  {
    question: 'How does M-Pesa payment work?',
    answer: 'Enter the eligible M-Pesa number, review the exact amount, and approve the Daraja STK prompt on your phone. Keep the payment page open while the provider confirmation and account activation are processed.',
  },
  {
    question: 'What happens if a payment times out or is declined?',
    answer: 'Do not submit another payment while the current attempt is pending. If it fails or expires, the result shows a safe retry option. For delayed callbacks, reversals, or an amount you do not recognize, contact support with the displayed reference.',
  },
  {
    question: 'How do refunds and support work?',
    answer: 'Refund eligibility depends on the payment status, provider rules, and the applicable Giglify policy. Contact the team from the payment or account page with your transaction reference so the payment can be reviewed.',
  },
];
