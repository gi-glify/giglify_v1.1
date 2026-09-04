export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export declare const signUpWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<{
    data: {
        user: import("@supabase/auth-js").User | null;
        session: import("@supabase/auth-js").Session | null;
    } | {
        user: null;
        session: null;
    };
    error: import("@supabase/auth-js").AuthError | null;
}>;
export declare const signInWithEmail: (email: string, password: string) => Promise<{
    data: {
        user: import("@supabase/auth-js").User;
        session: import("@supabase/auth-js").Session;
        weakPassword?: import("@supabase/auth-js").WeakPassword;
    } | {
        user: null;
        session: null;
        weakPassword?: null | undefined;
    };
    error: import("@supabase/auth-js").AuthError | null;
}>;
export declare const signInWithGoogle: () => Promise<{
    data: {
        provider: import("@supabase/auth-js").Provider;
        url: string;
        flowId?: string | null;
    } | {
        provider: import("@supabase/auth-js").Provider;
        url: null;
        flowId?: string | null;
    };
    error: import("@supabase/auth-js").AuthError | null;
}>;
export declare const signOut: () => Promise<{
    error: import("@supabase/auth-js").AuthError | null;
}>;
export declare const getCurrentUser: () => Promise<{
    user: import("@supabase/auth-js").User | null;
    error: import("@supabase/auth-js").AuthError | null;
}>;
//# sourceMappingURL=supabase.d.ts.map