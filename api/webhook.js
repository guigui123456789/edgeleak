// EdgeLeak — Stripe Webhook handler
// Receives subscription events from Stripe and updates the user's plan in Supabase.
//
// Events handled:
//   checkout.session.completed     — new subscription created → set is_pro=true
//   customer.subscription.updated  — sync status (active vs canceled)
//   customer.subscription.deleted  — set is_pro=false
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET           — whsec_...
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY      — used to update the profiles table server-side
//
// IMPORTANT: this endpoint must receive the raw body for signature verification.
// vercel.json includes a route override to disable body parsing for this path.

import Stripe from 'stripe';

export const config = {
  api: { bodyParser: false }
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

async function updateProfile(supaUrl, supaKey, userId, patch) {
  const res = await fetch(`${supaUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supaKey,
      'Authorization': `Bearer ${supaKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(patch)
  });
  if (!res.ok) throw new Error(`Supabase patch failed: ${res.status} ${await res.text()}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !webhookSecret) return res.status(500).json({ error: 'Stripe env vars missing' });
  if (!supaUrl || !supaKey) return res.status(500).json({ error: 'Supabase env vars missing' });

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
        await updateProfile(supaUrl, supaKey, userId, {
          is_pro: true,
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
        await updateProfile(supaUrl, supaKey, userId, { is_pro: active });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.user_id;
        if (!userId) break;
        await updateProfile(supaUrl, supaKey, userId, {
          is_pro: false,
          plan_ended_at: new Date().toISOString()
        });
        break;
      }
      default:
        // ignore other events
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
