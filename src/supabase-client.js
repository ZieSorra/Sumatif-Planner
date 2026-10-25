/**
 * Supabase client factory for the browser.
 *
 * Configure window.ZIESORRA_SUPABASE_CONFIG before importing this module:
 * {
 *   url: "https://<project-ref>.supabase.co",
 *   publishableKey: "<publishable-or-anon-key>"
 * }
 *
 * Never put a service_role key here. The browser key is public by design;
 * database access must be protected by RLS and tested policies.
 */
let clientPromise;

export async function getSupabaseClient() {
  const config = globalThis.window?.ZIESORRA_SUPABASE_CONFIG;
  if (!config || typeof config.url !== "string" ||
      typeof config.publishableKey !== "string" ||
      !config.url.trim() || !config.publishableKey.trim()) {
    throw new Error(
      "Konfigurasi Supabase belum tersedia. Isi URL proyek dan publishable/anon key melalui konfigurasi runtime."
    );
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url.trim())) {
    throw new Error("URL Supabase tidak valid.");
  }

  if (!clientPromise) {
    clientPromise = import("https://esm.sh/@supabase/supabase-js@2")
      .then(({ createClient }) => createClient(
        config.url.trim().replace(/\/$/, ""),
        config.publishableKey.trim(),
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      ))
      .catch(error => {
        clientPromise = undefined;
        throw new Error("Gagal memuat klien Supabase: " + error.message);
      });
  }

  return clientPromise;
}

export async function getCurrentUser() {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Silakan masuk terlebih dahulu.");
  return user;
}
