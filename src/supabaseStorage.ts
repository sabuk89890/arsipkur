const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TABLE_NAME = "app_state";

export function isSupabaseEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function loadFromSupabase(keys: string[]) {
  if (!isSupabaseEnabled()) return {} as Record<string, unknown>;

  try {
    const query = `select=key,value&key=in.(${keys.map((key) => encodeURIComponent(key)).join(",")})`;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?${query}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Supabase read failed: ${response.status}`);
    }

    const rows = (await response.json()) as Array<{ key: string; value: unknown }>;
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch (error) {
    console.warn("Supabase read failed, falling back to local storage.", error);
    return {} as Record<string, unknown>;
  }
}

export async function syncToSupabase(entries: Record<string, unknown>) {
  if (!isSupabaseEnabled()) return;

  try {
    const payload = Object.entries(entries).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?on_conflict=key`, {
      method: "POST",
      headers: {
        ...getHeaders(),
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Supabase write failed: ${response.status}`);
    }
  } catch (error) {
    console.warn("Supabase write failed.", error);
  }
}
