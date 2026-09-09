export const SOCIAL_PROVIDERS = [
    { id: 'google', label: 'Google' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'github', label: 'GitHub' },
];
export function getSocialProvider(id) {
    return SOCIAL_PROVIDERS.find((provider) => provider.id === id);
}
//# sourceMappingURL=socialAuth.js.map