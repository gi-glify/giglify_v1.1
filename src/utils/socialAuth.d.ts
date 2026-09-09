export type SocialProviderId = 'google' | 'facebook' | 'github';
export interface SocialProvider {
    id: SocialProviderId;
    label: string;
}
export declare const SOCIAL_PROVIDERS: SocialProvider[];
export declare function getSocialProvider(id: string): SocialProvider | undefined;
//# sourceMappingURL=socialAuth.d.ts.map