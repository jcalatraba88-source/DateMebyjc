// POST /api/stripe-webhook : Stripe prévient le site quand un paiement est terminé
// (filet de sécurité si la personne ferme la page avant de revenir sur le site).
import { createHmac, timingSafeEqual } from "node:crypto";
import { json, fail, isValidId, markPaid } from "../lib/shared.mjs";

function verify(payload, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const signatures = header.split(",").filter((p) => p.trim().startsWith("v1=")).map((p) => p.trim().slice(3));
  const t = parts.t;
  if (!t || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 600) return false;
  const expected = createHmac("sha256", secret).update(t + "." + payload).digest("hex");
  return signatures.some((sig) => {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export default async (req) => {
  if (req.method !== "POST") return fail("Méthode non autorisée.", 405);
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return fail("Webhook non configuré.", 503);

  const payload = await req.text();
  if (!verify(payload, req.headers.get("stripe-signature"), secret)) return fail("Signature invalide.", 400);

  const event = JSON.parse(payload);
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
    if (paid && isValidId(session.client_reference_id)) {
      await markPaid(session.client_reference_id, "stripe:" + session.id);
    }
  }
  return json({ received: true });
};

export const config = { path: "/api/stripe-webhook" };
