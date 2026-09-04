import { create } from 'zustand';
export const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    error: null,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    logout: () => set({ user: null, error: null }),
}));
//# sourceMappingURL=authStore.js.map