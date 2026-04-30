// EdgeLeak — Stripe Customer Billing Portal
// POST /api/billing-portal
// Body: { userId, email }
// Returns: { url } — redirect the user to manage their subscription.
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   APP_URL
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY  — for looking up the user's stripe_customer_id

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });

  try {
    // 1) Look up stripe_customer_id from Supabase profile
    let customerId = null;
    if (supaUrl && supaKey) {
      const r = await fetch(`${supaUrl}/rest/v1/profiles?id=eq.${userId}&select=stripe_customer_id`, {
        headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
      });
      const rows = await r.json();
      customerId = rows?.[0]?.stripe_customer_id;
    }

    // 2) Fallback: search Stripe by email
    if (!customerId && email) {
      const sr = await fetch(`https://api.stripe.com/v1/customers/search?query=${encodeURIComponent(`email:'${email}'`)}`, {
        headers: { 'Authorization': `Bearer ${stripeSecret}` }
      });
      const sd = await sr.json();
      customerId = sd?.data?.[0]?.id;
    }

    if (!customerId) return res.status(404).json({ error: 'No Stripe customer found. Please subscribe first.' });

    // 3) Create portal session
    const params = new URLSearchParams();
    params.append('customer', customerId);
    params.append('return_url', `${appUrl}/app.html`);

    const r = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeSecret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'Stripe error' });
    return res.status(200).json({ url: data.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
