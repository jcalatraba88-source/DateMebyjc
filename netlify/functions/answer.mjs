// POST /api/answer : la personne invitée dit oui (et peut laisser un mot).
import { store, json, fail, readBody, isValidId, publicView } from "../lib/shared.mjs";

export default async (req) => {
  if (req.method !== "POST") return fail("Méthode non autorisée.", 405);
  const body = await readBody(req);
  if (!body || !isValidId(body.i) || !isValidId(body.ideaId)) return fail("Réponse illisible.");

  const s = store();
  const inv = await s.get(body.i, { type: "json" });
  if (!inv || !inv.paid) return fail("Invitation introuvable.", 404);
  const idea = inv.ideas.find((x) => x.id === body.ideaId);
  if (!idea) return fail("Idée introuvable.", 404);

  if (idea.status !== "oui") {
    idea.status = "oui";
    idea.answeredAt = new Date().toISOString();
  }
  if (typeof body.reply === "string") {
    idea.reply = body.reply.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, 400);
  }
  await s.setJSON(inv.id, inv);
  return json(publicView(inv));
};

export const config = { path: "/api/answer" };
