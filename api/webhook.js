// EdgeLeak — Stripe Webhook handler (3 tiers)
// Maps Stripe subscription events to Supabase profile.plan_type ('free' | 'hobbyist' | 'regular')

import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

async function updateProfile(supaUrl, supaKey, userId, patch) {
  const res = await fetch(`${supaUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(patch)
  });
  if (!res.ok) throw new Error(`Supabase patch failed: ${res.status} ${await res.text()}`);
}

// Map Stripe price ID → plan name (covers monthly + annual variants)
function priceIdToPlan(priceId){
  const map = {
    'price_1TS99LLqC6EEycUgKIGUwTwL': 'hobbyist', // €3.99/mo
    'price_1TRg2nLqC6EEycUgd0TXBiua': 'regular',  // €9.99/mo
    'price_1TTOHULqC6EEycUgvrfcibrH': 'hobbyist', // €38/year
    'price_1TTOHXLqC6EEycUgMeZAQjX3': 'regular',  // €96/year
  };
  return map[priceId] || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeSecret || !webhookSecret) return res.status(500).json({ error: 'Stripe env missing' });
  if (!supaUrl || !supaKey) return res.status(500).json({ error: 'Supabase env missing' });

  const stripe = new Stripe(stripeSecret);
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    const buf = await getRawBody(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature failed: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        const userId = s.client_reference_id || s.metadata?.user_id;
        if (!userId) break;
        // Look up subscription to know which price was used
        let plan = s.metadata?.plan || null;
        if (!plan && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription);
          plan = priceIdToPlan(sub.items.data[0]?.price?.id) || 'regular';
        }
        await updateProfile(supaUrl, supaKey, userId, {
          plan_type: plan,
          is_pro: true, // legacy compat
          stripe_customer_id: s.customer,
          stripe_subscription_id: s.subscription,
          plan_started_at: new Date().toISOString()
        });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata?.user_id;
        if (!userId) break;
        const active = ['active', 'trialing'].includes(sub.status);
        const plan = active ? (priceIdToPlan(sub.items.data[0]?.price?.id) || 'regular') : 'free';
        await updateProfile(supaUrl, supaKey, userId, {
          plan_type: plan,
          is_pro: plan !== 'free',
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.user_id;
        if (!userId) break;
        await updateProfile(supaUrl, supaKey, userId, {
          plan_type: 'free',
          is_pro: false,
          plan_ended_at: new Date().toISOString()
        });
        break;
      }
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
