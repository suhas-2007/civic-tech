import { createClient } from '@supabase/supabase-js';

// sanitize url to ensure valid base origin without subpaths like /rest/v1
function sanitizeUrl(raw: string): string {
  let val = (raw || '').trim().replace(/^["']|["']$/g, '').trim();
  if (!val) return '';
  if (!val.startsWith('http://') && !val.startsWith('https://')) {
    val = `https://${val}`;
  }
  try {
    const parsed = new URL(val);
    return parsed.origin;
  } catch {
    return val;
  }
}

// sanitize key to remove quotes or whitespace
function sanitizeKey(raw: string): string {
  return (raw || '').trim().replace(/^["']|["']$/g, '').trim();
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabaseUrl = sanitizeUrl(rawUrl);
const supabaseAnonKey = sanitizeKey(rawKey);

// check if supabase env variables are set
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project-ref')
);

// client instance with placeholder fallback for build time
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key'
);

