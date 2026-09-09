export type SocialProviderId = 'google' | 'facebook' | 'github';

export interface SocialProvider {
  id: SocialProviderId;
  label: string;
}

export const SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'github', label: 'GitHub' },
];

export function getSocialProvider(id: string) {
  return SOCIAL_PROVIDERS.find((provider) => provider.id === id);
}
