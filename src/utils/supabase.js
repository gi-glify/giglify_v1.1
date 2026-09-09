import { createClient } from '@supabase/supabase-js';
import { getEmailRedirectUrl } from './authFlows';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const signUpWithEmail = async (email, password, firstName, lastName) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: getEmailRedirectUrl(window.location.origin, '/dashboard'),
            data: {
                first_name: firstName,
                last_name: lastName,
            }
        }
    });
    return { data, error };
};
export const resendSignupConfirmation = async (email) => {
    return supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: getEmailRedirectUrl(window.location.origin, '/dashboard') },
    });
};
export const requestPasswordReset = async (email) => {
    return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getEmailRedirectUrl(window.location.origin, '/auth?reset=1'),
    });
};
export const updatePassword = async (password) => {
    return supabase.auth.updateUser({ password });
};
export const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};
export const signInWithSocial = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${window.location.origin}/auth/callback`
        }
    });
    return { data, error };
};
export const signInWithGoogle = () => signInWithSocial('google');
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
};
//# sourceMappingURL=supabase.js.map