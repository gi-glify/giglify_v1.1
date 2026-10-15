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
export type LandingFaq = {
    question: string;
    answer: string;
};
export declare const LANDING_PARTNERS: LandingPartner[];
export declare const LANDING_REVIEWS: LandingReview[];
export declare const LANDING_FAQS: LandingFaq[];
//# sourceMappingURL=landingTrustContent.d.ts.map