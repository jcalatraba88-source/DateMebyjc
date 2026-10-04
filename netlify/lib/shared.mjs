// Date me — outils partagés par toutes les fonctions serveur.
import { getStore } from "@netlify/blobs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const MAX_IDEAS = 8;

export function store() {
  return getStore({ name: "invitations", consistency: "strong" });
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function fail(message, status = 400) {
  return json({ error: message }, status);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export function randomId(len = 10) {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function newToken() {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function tokenMatches(token, hash) {
  if (!token || !hash) return false;
  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(String(hash));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isValidId(id) {
  return typeof id === "string" && /^[A-Za-z0-9]{6,20}$/.test(id);
}

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}

// Nettoie et valide une liste d'idées envoyée par le navigateur.
// `previous` permet de garder les réponses déjà données.
export function sanitizeIdeas(input, previous = []) {
  if (!Array.isArray(input)) return { error: "Ajoute au moins une idée." };
  const prevById = new Map(previous.map((i) => [i.id, i]));
  const ideas = [];
  for (const raw of input.slice(0, MAX_IDEAS)) {
    if (!raw || typeof raw !== "object") continue;
    const title = clean(raw.title, 80);
    if (!title) continue;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(raw.date || "") ? raw.date : "";
    const time = /^\d{2}:\d{2}$/.test(raw.time || "") ? raw.time : "";
    const prev = isValidId(raw.id) ? prevById.get(raw.id) : undefined;
    ideas.push({
      id: prev ? prev.id : randomId(8),
      title,
      date,
      time,
      timeNote: clean(raw.timeNote, 140),
      comment: clean(raw.comment, 600),
      status: prev ? prev.status : "en_attente",
      reply: prev ? prev.reply : "",
      answeredAt: prev ? prev.answeredAt : null,
    });
  }
  if (!ideas.length) return { error: "Ajoute au moins une idée avec un titre." };
  return { ideas };
}

export const DEFAULT_QUESTION = "Veux-tu un date avec moi ?";

export function sanitizeNames(body) {
  return {
    from: clean(body.from, 40) || "Quelqu'un qui t'aime",
    to: clean(body.to, 40) || "toi",
    question: clean(body.question, 120) || DEFAULT_QUESTION,
  };
}

// Ce que le partenaire a le droit de voir (jamais la clé privée).
export function publicView(inv) {
  return {
    id: inv.id,
    from: inv.from,
    to: inv.to,
    question: inv.question || DEFAULT_QUESTION,
    ideas: inv.ideas.map(({ id, title, date, time, timeNote, comment, status, reply }) => ({
      id, title, date, time, timeNote, comment, status, reply,
    })),
  };
}

export function ownerView(inv) {
  return { ...publicView(inv), paid: inv.paid, createdAt: inv.createdAt, ideas: inv.ideas };
}

export async function readBody(req) {
  try {
    const text = await req.text();
    if (text.length > 40000) return null;
    return JSON.parse(text || "{}");
  } catch {
    return null;
  }
}

export function paymentsEnabled() {
  return (process.env.PAYMENT_MODE || "stripe").toLowerCase() !== "off";
}

export async function markPaid(id, source) {
  const s = store();
  const inv = await s.get(id, { type: "json" });
  if (!inv) return null;
  if (!inv.paid) {
    inv.paid = true;
    inv.paidAt = new Date().toISOString();
    inv.paidVia = source;
    await s.setJSON(id, inv);
  }
  return inv;
}
