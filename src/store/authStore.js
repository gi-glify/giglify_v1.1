import { create } from 'zustand';
export const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    error: null,
    verificationEmail: null,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setVerificationEmail: (verificationEmail) => set({ verificationEmail }),
    logout: () => set({ user: null, error: null, verificationEmail: null }),
}));
//# sourceMappingURL=authStore.js.map