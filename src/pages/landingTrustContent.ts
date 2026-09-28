export type LandingPartner = {
  name: string;
  description: string;
  icon: 'supabase' | 'stripe';
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
    name: 'Stripe',
    description: 'Trusted online payment rails',
    icon: 'stripe',
  },
];

export const LANDING_REVIEWS: LandingReview[] = [
  {
    quote:
      'Giglify helped us turn a messy research backlog into reviewed microtasks our team could actually act on.',
    name: 'Amina W.',
    role: 'Requester, market research team',
    detail: 'Posted 180+ tasks',
  },
  {
    quote:
      'The instructions are clear, the task flow is simple, and I can see exactly where my submissions stand.',
    name: 'Daniel K.',
    role: 'Tasker, data labeling',
    detail: 'Completed 240+ tasks',
  },
  {
    quote:
      'We needed fast feedback without losing quality. The review process gave us confidence before moving forward.',
    name: 'Grace M.',
    role: 'Requester, product operations',
    detail: 'Average turnaround under 24 hours',
  },
];
