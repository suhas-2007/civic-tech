import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// diagnostic endpoint to check supabase connection status
export async function GET(_req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  let querySuccess = false;
  let queryError: string | null = null;
  let rowCount = 0;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('projects').select('id, title').limit(5);
      if (error) {
        queryError = error.message;
      } else {
        querySuccess = true;
        rowCount = data ? data.length : 0;
      }
    } catch (err: any) {
      queryError = err.message;
    }
  }

  return NextResponse.json({
    isConfigured: isSupabaseConfigured,
    hasUrl: Boolean(url),
    urlHost: url ? new URL(url).host : null,
    hasKey: Boolean(key),
    keyPrefix: key ? key.substring(0, 10) + '...' : null,
    querySuccess,
    queryError,
    rowCount,
  });
}
