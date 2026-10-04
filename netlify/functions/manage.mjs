// GET/PUT /api/manage?i=ID (en-tête x-billet-key) : l'espace privé de la personne qui invite.
import {
  store, json, fail, readBody, isValidId, tokenMatches,
  sanitizeIdeas, sanitizeNames, ownerView,
} from "../lib/shared.mjs";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("i");
  const key = req.headers.get("x-billet-key");
  if (!isValidId(id) || !key) return fail("Lien privé invalide.", 401);

  const s = store();
  const inv = await s.get(id, { type: "json" });
  if (!inv || !tokenMatches(key, inv.tokenHash)) return fail("Lien privé invalide.", 401);

  if (req.method === "GET") return json(ownerView(inv));

  if (req.method === "PUT") {
    const body = await readBody(req);
    if (!body) return fail("Requête illisible.");
    const { ideas, error } = sanitizeIdeas(body.ideas, inv.ideas);
    if (error) return fail(error);
    Object.assign(inv, sanitizeNames(body), { ideas, updatedAt: new Date().toISOString() });
    await s.setJSON(id, inv);
    return json(ownerView(inv));
  }
  return fail("Méthode non autorisée.", 405);
};

export const config = { path: "/api/manage" };
