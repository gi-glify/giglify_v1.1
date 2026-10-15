import { createClient } from '@supabase/supabase-js';
import { getEmailRedirectUrl } from './authFlows';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
/** Load the account fields that are not stored in the Auth user object. */
export async function fetchAccountState(userId) {
    const [{ data: profile, error: profileError }, { data: wallet, error: walletError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("wallets").select("balance").eq("user_id", userId).maybeSingle(),
    ]);
    if (profileError)
        console.error("Unable to load account profile:", profileError.message);
    if (walletError)
        console.error("Unable to load wallet balance:", walletError.message);
    return {
        profile,
        balance: Number(wallet?.balance ?? 0),
    };
}
export const signUpWithEmail = async (email, password, firstName, lastName) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: getEmailRedirectUrl(window.location.origin, '/'),
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
        options: { emailRedirectTo: getEmailRedirectUrl(window.location.origin, '/') },
    });
};
export const requestPasswordReset = async (email) => {
    return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getEmailRedirectUrl(window.location.origin, '/?reset=1'),
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
            redirectTo: `${window.location.origin}/`
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