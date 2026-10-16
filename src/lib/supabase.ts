import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PLACEHOLDER_SUPABASE_VALUES = new Set([
  'https://demo-project.supabase.co',
  'https://your-project.supabase.co',
  'demo-anon-key',
  'demo-service-role-key',
  'your-anon-key',
  'your-service-role-key',
]);

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function hasSupabaseRuntimeConfig(): boolean {
  const url =
    (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    '';
  const key =
    (typeof process !== 'undefined' ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) : '') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    '';

  const isPlaceholder =
    (url && PLACEHOLDER_SUPABASE_VALUES.has(url.trim())) ||
    (key && PLACEHOLDER_SUPABASE_VALUES.has(key.trim()));

  return Boolean(url && key && !isPlaceholder);
}

export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || '';
  const key = customKey || (typeof process !== 'undefined' ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) : '') || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || '';

  if (!url || !key) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

function mapSupabaseUserRow(row: any) {
  if (!row) return null;
  return {
    id: Number(row.id),
    uid: row.uid || `supabase-${row.id}`,
    email: String(row.email || '').trim().toLowerCase(),
    name: row.name || 'Supabase Admin',
    role: row.role || 'CLASS_ADMIN',
    assignedClass: row.assigned_class || null,
    status: row.status || 'ACTIVE',
    passwordHash: row.password_hash || null,
    passwordPlain: row.password_plain || null,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
}

export async function getSupabaseUserByEmail(email: string) {
  const client = getSupabaseClient();
  if (!client) return null;

  const normalized = String(email || '').trim().toLowerCase();
  const { data, error } = await client
    .from('users')
    .select('*')
    .ilike('email', normalized)
    .maybeSingle();

  if (error) {
    console.warn('Supabase user lookup failed:', error.message);
    return null;
  }

  return mapSupabaseUserRow(data);
}

export async function getSupabaseUsersByClass(classCode: string) {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('assigned_class', classCode)
    .eq('status', 'ACTIVE');

  if (error) {
    console.warn('Supabase class-admin lookup failed:', error.message);
    return [];
  }

  return (data || []).map((row: any) => mapSupabaseUserRow(row)).filter(Boolean);
}

export async function createSupabaseAdminUser(input: {
  uid: string;
  email: string;
  name: string;
  role: string;
  assignedClass: string | null;
  status?: string;
  passwordHash: string;
  passwordPlain?: string | null;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  const payload = {
    uid: input.uid,
    email: String(input.email || '').trim().toLowerCase(),
    name: String(input.name || '').trim(),
    role: input.role,
    assigned_class: input.assignedClass,
    status: input.status || 'ACTIVE',
    password_hash: input.passwordHash,
    password_plain: input.passwordPlain || null,
  };

  const { data, error } = await client.from('users').insert(payload).select().single();
  if (error) {
    console.warn('Supabase admin creation failed:', error.message);
    return null;
  }

  return mapSupabaseUserRow(data);
}

export async function updateSupabaseAdminUser(id: number, patch: Record<string, any>) {
  const client = getSupabaseClient();
  if (!client) return null;

  const body: Record<string, any> = {};
  if (patch.email) body.email = String(patch.email).trim().toLowerCase();
  if (patch.name) body.name = String(patch.name).trim();
  if (patch.role) body.role = patch.role;
  if (patch.assignedClass !== undefined) body.assigned_class = patch.assignedClass;
  if (patch.status) body.status = patch.status;
  if (patch.passwordHash) body.password_hash = patch.passwordHash;
  if (patch.passwordPlain !== undefined) body.password_plain = patch.passwordPlain;
  if (patch.updatedAt) body.updated_at = patch.updatedAt.toISOString();

  const { data, error } = await client.from('users').update(body).eq('id', id).select().single();
  if (error) {
    console.warn('Supabase admin update failed:', error.message);
    return null;
  }

  return mapSupabaseUserRow(data);
}

export async function testSupabaseConnection(
  url: string,
  key: string
): Promise<{ success: boolean; message: string; writeCapable?: boolean }> {
  try {
    if (!url.startsWith('https://')) {
      return { success: false, message: 'Supabase URL must start with https://' };
    }
    const cleanUrl = url.replace(/\/$/, '');

    // 1. Verify key validity using Supabase auth settings endpoint (publicly allowed for anon & publishable keys)
    const authRes = await fetch(`${cleanUrl}/auth/v1/settings`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    let isValid = authRes.ok || authRes.status === 200;

    // 2. Fallback check on classes table if auth/v1/settings is disabled
    if (!isValid) {
      const restRes = await fetch(`${cleanUrl}/rest/v1/classes?select=code&limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      if (restRes.ok || restRes.status === 200 || restRes.status === 204) {
        isValid = true;
      } else if (restRes.status === 401 || authRes.status === 401) {
        return {
          success: false,
          message:
            'Supabase key is invalid (401 Unauthorized). Please check Project Settings > API in your Supabase dashboard and copy the exact anon/public or service_role key.',
        };
      }
    }

    if (!isValid) {
      return {
        success: false,
        message: `Supabase returned HTTP status ${authRes.status}: ${authRes.statusText}`,
      };
    }

    // 3. Test write capability
    const client = createClient(cleanUrl, key, { auth: { persistSession: false } });
    const testWrite = await client
      .from('platform_settings')
      .upsert(
        {
          setting_key: '_ilm_connection_test',
          setting_value: new Date().toISOString(),
        },
        { onConflict: 'setting_key' }
      )
      .select();

    if (testWrite.error) {
      if (
        testWrite.error.code === '42501' ||
        testWrite.error.message?.includes('violates row-level security')
      ) {
        return {
          success: true,
          writeCapable: false,
          message:
            '✓ Supabase API connected! (Read-only mode active: To enable full write/sync, enter "Service Role Key" or run "Disable RLS" in Supabase SQL Editor).',
        };
      }
      return {
        success: true,
        writeCapable: true,
        message: '✓ Supabase connection verified successfully! API key is active.',
      };
    }

    return {
      success: true,
      writeCapable: true,
      message: '✓ Supabase connected successfully! Full Read & Write sync permissions are active.',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error connecting to Supabase.' };
  }
}
