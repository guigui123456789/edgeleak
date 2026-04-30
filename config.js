// EdgeLeak — Public client config
// These keys are SAFE to expose publicly (anon key + Stripe price ID).
// SECRET keys (Stripe secret, Supabase service role) live ONLY in Vercel env vars.
//
// 👉 Replace the placeholders below with your real values from Supabase:
//    Supabase Dashboard → Project Settings → API
//
// If you leave the placeholders, the site falls back to a local-only "demo mode"
// that uses localStorage instead of Supabase.

window.SUPABASE_URL = 'https://uqeqbjkgfsmqjakuotfy.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_BWii913uFJLpQNvIuu0tCQ_NrRPp2x_';
window.STRIPE_PRICE_ID = 'price_1TRg2nLqC6EEycUgd0TXBiua'; // EdgeLeak Pro €9.99/mo
