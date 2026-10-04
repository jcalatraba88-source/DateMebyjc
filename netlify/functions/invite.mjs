// GET /api/invite?i=ID : ce que voit la personne invitée.
import { store, json, fail, isValidId, publicView } from "../lib/shared.mjs";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("i");
  if (!isValidId(id)) return fail("Lien invalide.", 404);
  const inv = await store().get(id, { type: "json" });
  if (!inv) return fail("Cette invitation n'existe pas.", 404);
  if (!inv.paid) return fail("Cette invitation n'est pas encore activée.", 402);
  return json(publicView(inv));
};

export const config = { path: "/api/invite" };
