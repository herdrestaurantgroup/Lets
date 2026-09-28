import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon) : null;

export function accountsEnabled() {
  return Boolean(supabase);
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error("Accounts are not configured");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function onAuth(callback: (session: Session | null) => void) {
  if (!supabase) {
    callback(null);
    return () => {};
  }
  supabase.auth.getSession().then(({ data }) => callback(data.session));
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
