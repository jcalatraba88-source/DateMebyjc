// POST /api/create : enregistre une nouvelle invitation et renvoie le lien de paiement.
import {
  store, json, fail, randomId, newToken, hashToken,
  sanitizeIdeas, sanitizeNames, readBody, paymentsEnabled,
} from "../lib/shared.mjs";

export default async (req) => {
  if (req.method !== "POST") return fail("Méthode non autorisée.", 405);
  const body = await readBody(req);
  if (!body) return fail("Requête illisible.");

  const { ideas, error } = sanitizeIdeas(body.ideas);
  if (error) return fail(error);
  const names = sanitizeNames(body);

  const payOn = paymentsEnabled();
  const link = process.env.STRIPE_PAYMENT_LINK;
  if (payOn && !link) return fail("Le paiement n'est pas encore configuré sur ce site.", 503);

  const id = randomId(10);
  const token = newToken();
  const inv = {
    id,
    tokenHash: hashToken(token),
    ...names,
    ideas,
    paid: !payOn,
    paidVia: payOn ? null : "gratuit",
    createdAt: new Date().toISOString(),
  };
  await store().setJSON(id, inv);

  const payUrl = payOn
    ? link + (link.includes("?") ? "&" : "?") + "client_reference_id=" + encodeURIComponent(id)
    : null;
  return json({ id, token, paid: inv.paid, payUrl });
};

export const config = { path: "/api/create" };
