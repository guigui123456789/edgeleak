// EdgeLeak — Stripe Checkout session creator (3 tiers)
// POST /api/checkout
// Body: { userId, email, priceId, plan }
// Returns: { url } — redirect to Stripe Checkout

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email, priceId, plan } = req.body || {};
  if (!userId || !email) return res.status(400).json({ error: 'Missing userId or email' });

  // Whitelist of allowed price IDs (avoid client-side tampering)
  const ALLOWED_PRICES = {
    'price_1TS99LLqC6EEycUgKIGUwTwL': 'hobbyist', // €3.99/mo
    'price_1TRg2nLqC6EEycUgd0TXBiua': 'regular',  // €9.99/mo
  };
  const finalPriceId = ALLOWED_PRICES[priceId] ? priceId : 'price_1TRg2nLqC6EEycUgd0TXBiua';
  const finalPlan = ALLOWED_PRICES[finalPriceId];

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
  if (!stripeSecret) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });

  try {
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', finalPriceId);
    params.append('line_items[0][quantity]', '1');
    params.append('customer_email', email);
    params.append('client_reference_id', userId);
    params.append('metadata[user_id]', userId);
    params.append('metadata[plan]', finalPlan);
    params.append('subscription_data[metadata][user_id]', userId);
    params.append('subscription_data[metadata][plan]', finalPlan);
    params.append('success_url', `${appUrl}/app.html?checkout=success&plan=${finalPlan}`);
    params.append('cancel_url', `${appUrl}/app.html?checkout=cancelled`);
    params.append('allow_promotion_codes', 'true');
    params.append('automatic_tax[enabled]', 'true'); // VAT compliance for EU
    params.append('billing_address_collection', 'auto');
    params.append('tax_id_collection[enabled]', 'true');

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeSecret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'Stripe error' });
    return res.status(200).json({ url: data.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
