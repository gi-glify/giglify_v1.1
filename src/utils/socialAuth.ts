export type SocialProviderId = 'google' | 'facebook' | 'twitter';

export interface SocialProvider {
  id: SocialProviderId;
  label: string;
}

export const SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
  // Supabase keeps the provider key as "twitter" for the X OAuth integration.
  { id: 'twitter', label: 'X' },
];

export function getSocialProvider(id: string) {
  return SOCIAL_PROVIDERS.find((provider) => provider.id === id);
}
