// EdgeLeak — Delete user account (GDPR / RGPD)
// POST /api/delete-account  Body: { userId, email }
//
// 1) Cancel any active Stripe subscription
// 2) Delete user from Supabase Auth (cascade-deletes profile + saved_ranges via FK)
//
// Required env: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey) return res.status(500).json({ error: 'Supabase env missing' });

  try {
    // 1) Look up profile to find Stripe IDs
    const profRes = await fetch(`${supaUrl}/rest/v1/profiles?id=eq.${userId}&select=stripe_customer_id,stripe_subscription_id`, {
      headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
    });
    const rows = await profRes.json();
    const profile = rows?.[0];

    // 2) Cancel Stripe subscription if any
    if (stripeSecret && profile?.stripe_subscription_id) {
      try {
        await fetch(`https://api.stripe.com/v1/subscriptions/${profile.stripe_subscription_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${stripeSecret}` }
        });
      } catch (e) { /* ignore: continue with deletion */ }
    }

    // 3) Delete user from Supabase Auth (this cascades to profile + saved_ranges)
    const delRes = await fetch(`${supaUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
    });
    if (!delRes.ok) {
      const txt = await delRes.text();
      return res.status(500).json({ error: `Supabase delete failed: ${txt}` });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
