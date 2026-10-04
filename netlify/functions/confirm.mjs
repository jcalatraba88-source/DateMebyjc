// POST /api/confirm : vérifie auprès de Stripe que le paiement est fait, puis active l'invitation.
import { store, json, fail, readBody, markPaid, newToken, hashToken, isValidId } from "../lib/shared.mjs";

export default async (req) => {
  if (req.method !== "POST") return fail("Méthode non autorisée.", 405);
  const body = await readBody(req);
  const sessionId = body && typeof body.session_id === "string" ? body.session_id : "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return fail("Paiement introuvable.");

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return fail("Le paiement n'est pas encore configuré sur ce site.", 503);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId), {
    headers: { authorization: "Bearer " + secret },
  });
  if (!res.ok) return fail("Paiement introuvable chez Stripe.", 404);
  const session = await res.json();

  const ok = session.status === "complete" &&
    (session.payment_status === "paid" || session.payment_status === "no_payment_required");
  if (!ok) return fail("Le paiement n'est pas encore validé. Réessaie dans une minute.", 402);

  const id = session.client_reference_id;
  if (!isValidId(id)) return fail("Ce paiement n'est relié à aucune invitation.", 404);

  const inv = await markPaid(id, "stripe:" + sessionId);
  if (!inv) return fail("Invitation introuvable.", 404);

  // Sur un autre appareil, le navigateur n'a pas la clé : on en crée une nouvelle.
  if (body.reissue) {
    const token = newToken();
    inv.tokenHash = hashToken(token);
    await store().setJSON(id, inv);
    return json({ id, token });
  }
  return json({ id });
};

export const config = { path: "/api/confirm" };
