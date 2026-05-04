// EdgeLeak — Stripe Checkout (3 tiers × monthly/annual + 14-day trial)
// POST /api/checkout  Body: { userId, email, priceId, plan, billing }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email, priceId } = req.body || {};
  if (!userId || !email) return res.status(400).json({ error: 'Missing userId or email' });

  // Whitelist of allowed price IDs → plan name + billing
  const ALLOWED_PRICES = {
    'price_1TS99LLqC6EEycUgKIGUwTwL': { plan: 'hobbyist', billing: 'monthly' },
    'price_1TRg2nLqC6EEycUgd0TXBiua': { plan: 'regular',  billing: 'monthly' },
    'price_1TTOHULqC6EEycUgvrfcibrH': { plan: 'hobbyist', billing: 'annual' },
    'price_1TTOHXLqC6EEycUgMeZAQjX3': { plan: 'regular',  billing: 'annual' },
  };
  const meta = ALLOWED_PRICES[priceId] || ALLOWED_PRICES['price_1TRg2nLqC6EEycUgd0TXBiua'];
  const finalPriceId = ALLOWED_PRICES[priceId] ? priceId : 'price_1TRg2nLqC6EEycUgd0TXBiua';

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
    params.append('metadata[plan]', meta.plan);
    params.append('metadata[billing]', meta.billing);
    params.append('subscription_data[metadata][user_id]', userId);
    params.append('subscription_data[metadata][plan]', meta.plan);
    params.append('subscription_data[metadata][billing]', meta.billing);
    // 14-day free trial on all paid plans
    params.append('subscription_data[trial_period_days]', '14');
    params.append('success_url', `${appUrl}/app.html?checkout=success&plan=${meta.plan}`);
    params.append('cancel_url', `${appUrl}/app.html?checkout=cancelled`);
    params.append('allow_promotion_codes', 'true');
    params.append('automatic_tax[enabled]', 'true');
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
