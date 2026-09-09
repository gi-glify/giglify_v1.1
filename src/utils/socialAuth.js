export const SOCIAL_PROVIDERS = [
    { id: 'google', label: 'Google' },
    { id: 'facebook', label: 'Facebook' },
    // Supabase keeps the provider key as "twitter" for the X OAuth integration.
    { id: 'twitter', label: 'X' },
];
export function getSocialProvider(id) {
    return SOCIAL_PROVIDERS.find((provider) => provider.id === id);
}
//# sourceMappingURL=socialAuth.js.map