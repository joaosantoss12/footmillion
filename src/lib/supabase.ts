const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

function headers(extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra,
  };
}

export async function supabaseSelect<T>(
  table: string,
  params: Record<string, string>
): Promise<T[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    throw new Error(`Supabase select ${table} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function supabaseInsert<T>(table: string, row: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    throw new Error(`Supabase insert ${table} failed: ${res.status} ${await res.text()}`);
  }
  const rows: T[] = await res.json();
  return rows[0];
}

export async function supabaseUpdate(
  table: string,
  match: Record<string, string>,
  patch: Record<string, unknown>
): Promise<void> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(match)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url, {
    method: "PATCH",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Supabase update ${table} failed: ${res.status} ${await res.text()}`);
  }
}
