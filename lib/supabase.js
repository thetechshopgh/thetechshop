// /lib/supabase.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// Use the Service Role Key if available (i.e., when running on the server/API routes)
// Otherwise, fall back to the public Anon Key for client-side calls.
const isServer = typeof window === 'undefined';

const supabaseKey = isServer 
    ? process.env.SUPABASE_SERVICE_KEY // 🚨 CRITICAL FIX: Use the SECRET key for the server 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check for missing keys (good for debugging)
if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase client failed to initialize: Missing URL or Key.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    // Ensure the service key is not accidentally passed to the client
    auth: { persistSession: !isServer },
});
