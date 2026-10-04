// Date me — outils d'interface partagés : roses, enveloppe, lettre, bouton Non qui s'enfuit, pétales, appels serveur.
window.BD = (function () {
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c));
    return n;
  }

  /* ---------- Roses dessinées en SVG ---------- */
  let gid = 0;
  const RINGS = [
    { n: 5, r: 46, w: 44, off: 0 },
    { n: 5, r: 38, w: 36, off: 36 },
    { n: 5, r: 29, w: 28, off: 14 },
    { n: 4, r: 21, w: 22, off: 52 },
    { n: 4, r: 14, w: 16, off: 8 },
    { n: 3, r: 8, w: 11, off: 40 },
  ];
  const RED = ["#c8243f", "#b51932", "#a1122a", "#8a0c22", "#730819", "#5c0513"];
  function petalPath(r, w) {
    const b = r * 0.12;
    return "M" + (-w * .34) + " " + (-b) + " C" + (-w * .78) + " " + (-r * .45) + " " + (-w * .58) + " " + (-r * 1.02) + " 0 " + (-r) +
      " C" + (w * .58) + " " + (-r * 1.02) + " " + (w * .78) + " " + (-r * .45) + " " + (w * .34) + " " + (-b) + " Z";
  }
  function leaf(angle, len) {
    return '<g transform="rotate(' + angle + ')"><path d="M0 -30 C 13 -' + (30 + len * .35) + ' 9 -' + (30 + len * .8) + ' 0 -' + (30 + len) +
      ' C -9 -' + (30 + len * .8) + ' -13 -' + (30 + len * .35) + ' 0 -30 Z" fill="#2f4a33"/><path d="M0 -31 L0 -' + (28 + len) + '" stroke="#5f7d5c" stroke-width="1" fill="none"/></g>';
  }
  // opts.mono : rose en relief pour le sceau de cire ; opts.leaves : avec feuilles
  function roseSVG(opts) {
    opts = opts || {};
    const id = "rg" + (++gid);
    let defs = "<defs>";
    let body = "";
    if (opts.leaves) body += leaf(150, 34) + leaf(215, 30) + leaf(40, 26);
    RINGS.forEach((ring, k) => {
      const fill = opts.mono ? "rgba(0,0,0,.16)" : "url(#" + id + "-" + k + ")";
      const stroke = opts.mono ? "rgba(255,225,225,.38)" : "rgba(60,2,12,.55)";
      if (!opts.mono) {
        defs += '<radialGradient id="' + id + "-" + k + '" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="' + ring.r + '">' +
          '<stop offset="0" stop-color="#3d020b"/><stop offset=".55" stop-color="' + RED[k] + '"/><stop offset="1" stop-color="' + (k < 2 ? "#de4a63" : RED[Math.max(0, k - 1)]) + '"/></radialGradient>';
      }
      for (let i = 0; i < ring.n; i++) {
        const a = ring.off + (360 / ring.n) * i + (opts.twist || 0);
        body += '<path transform="rotate(' + a.toFixed(1) + ')" d="' + petalPath(ring.r, ring.w) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width=".7"/>';
      }
    });
    body += '<path d="M0 0 c 2 -3 6 -1 4 3 c -2 4 -8 2 -7 -3 c 1 -5 9 -7 12 -2" fill="none" stroke="' + (opts.mono ? "rgba(255,225,225,.4)" : "rgba(40,0,8,.7)") + '" stroke-width="1.1" stroke-linecap="round"/>';
    defs += "</defs>";
    return '<svg viewBox="-62 -62 124 124" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + defs + body + "</svg>";
  }
  function rose(cls, opts) { return el("span", { class: cls, "aria-hidden": "true", html: roseSVG(opts) }); }
  function bouquet(cls) {
    return el("span", { class: cls, "aria-hidden": "true", html:
      '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g transform="translate(70 52) scale(.5)">' + roseSVG({ leaves: true }).replace(/^<svg[^>]*>|<\/svg>$/g, "") + "</g>" +
      '<g transform="translate(40 78) scale(.36) rotate(30)">' + roseSVG({ leaves: true, twist: 20 }).replace(/^<svg[^>]*>|<\/svg>$/g, "") + "</g>" +
      "</svg>" });
  }

  /* ---------- Petits outils ---------- */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) { toastEl = el("div", { class: "toast", role: "status" }); document.body.append(toastEl); }
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2800);
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function fmtDate(d) {
    if (!d) return "";
    try { return cap(new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })); }
    catch { return d; }
  }
  function fmtTime(t) { return t ? t.replace(":", "h") : ""; }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- La lettre : question + proposition de date ---------- */
  function letter(inv, idea, index, total, extra) {
    const when = [];
    if (idea.date) when.push(el("span", { text: fmtDate(idea.date) }));
    if (idea.time) when.push(el("span", { class: "time", text: fmtTime(idea.time) }));
    return el("article", { class: "letter" },
      bouquet("corner tr"),
      bouquet("corner bl"),
      el("p", { class: "l-from", text: "De " + (inv.from || "moi") }),
      el("h2", { class: "l-question", text: inv.question || "Veux-tu un date avec moi ?" }),
      el("hr", { class: "rule" }),
      total > 1 ? el("span", { class: "l-count", text: "Proposition " + (index + 1) + " sur " + total }) : el("span", { class: "l-count", text: "La proposition" }),
      el("h3", { class: "l-title", text: idea.title || "Ton idée de date" }),
      when.length ? el("div", { class: "l-when" }, when) : null,
      idea.timeNote ? el("p", { class: "l-note" }, el("b", { text: "À propos de l'heure" }), idea.timeNote) : null,
      idea.comment ? el("p", { class: "l-comment", text: idea.comment }) : null,
      extra || null
    );
  }

  /* ---------- L'enveloppe scellée d'une rose ---------- */
  function envelope(inv, onOpened) {
    const env = el("button", { class: "env", type: "button", "aria-label": "Ouvrir la lettre de " + (inv.from || "ton admirateur") },
      el("span", { class: "env-back" }),
      el("span", { class: "env-paper" }, el("small", { text: "Une question" }), el("span", { class: "script", text: "pour toi" })),
      el("span", { class: "env-front" }),
      el("span", { class: "env-to" }, el("small", { text: "Pour" }), el("span", { text: inv.to || "toi" })),
      el("span", { class: "env-flap" }),
      el("span", { class: "env-seal", html: roseSVG({ mono: true }) }),
      el("span", { class: "env-rose", html: bouquet("").innerHTML })
    );
    const hint = el("p", { class: "env-hint", text: "Une lettre de " + (inv.from || "quelqu'un") + " · touche le sceau" });
    const scene = el("div", { class: "envelope-scene" }, env, hint);
    let opened = false;
    env.addEventListener("click", () => {
      if (opened) return;
      opened = true;
      env.classList.add("open");
      hint.textContent = "";
      if (reduced) { onOpened(); return; }
      setTimeout(() => scene.classList.add("leaving"), 1500);
      setTimeout(onOpened, 1950);
    });
    return scene;
  }

  /* ---------- Oui / Non (le Non s'enfuit) ---------- */
  const noLines = ["Non", "Sûr ?", "Raté", "Trop lent", "Hmm non", "Essaie encore", "Jamais", "Clique Oui", "Toujours pas"];
  const hints = ["", "Le bouton Non semble timide…", "Il ne se laissera pas attraper.", "Le Oui est juste là, pourtant.", "Tu sais ce qu'il te reste à faire."];
  function ask(onYes) {
    let attempts = 0;
    const yes = el("button", { class: "btn-yes", type: "button", text: "Oui" });
    const no = el("button", { class: "btn-no", type: "button", text: "Non" });
    const hint = el("p", { class: "hint", "aria-live": "polite" });
    function dodge(e) {
      if (e && e.cancelable) e.preventDefault();
      attempts++;
      const r = no.getBoundingClientRect();
      const y = yes.getBoundingClientRect();
      const m = 16, vw = innerWidth, vh = innerHeight;
      let x = r.left, top = r.top, tries = 0;
      do {
        x = m + Math.random() * Math.max(1, vw - r.width - m * 2);
        top = m + Math.random() * Math.max(1, vh - r.height - m * 2);
        tries++;
      } while (tries < 30 && (
        Math.hypot(x - r.left, top - r.top) < 140 ||
        (x < y.right + 20 && x + r.width > y.left - 20 && top < y.bottom + 20 && top + r.height > y.top - 20)
      ));
      if (!no.classList.contains("loose")) {
        no.style.left = r.left + "px"; no.style.top = r.top + "px";
        no.classList.add("loose");
        void no.offsetWidth;
      }
      no.style.left = x + "px"; no.style.top = top + "px";
      no.textContent = noLines[attempts % noLines.length];
      yes.style.transform = "scale(" + Math.min(1 + attempts * 0.07, 1.6) + ")";
      hint.textContent = hints[Math.min(attempts, hints.length - 1)];
    }
    no.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") dodge(e); });
    no.addEventListener("pointerdown", dodge);
    no.addEventListener("touchstart", dodge, { passive: false });
    no.addEventListener("click", dodge);
    no.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") dodge(e); });
    yes.addEventListener("click", () => { no.remove(); petals(); onYes(); });
    return el("div", { class: "stage", style: "gap:8px" }, el("div", { class: "choices" }, yes, no), hint);
  }
  function clearLoose() { document.querySelectorAll(".btn-no.loose").forEach((b) => b.remove()); }

  /* ---------- Pluie de pétales de rose ---------- */
  function petals() {
    if (reduced) return;
    const c = el("canvas", { class: "fx", "aria-hidden": "true" });
    document.body.append(c);
    const ctx = c.getContext("2d");
    const dpr = devicePixelRatio || 1;
    const W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr);
    const cols = ["#9b0e26", "#b51932", "#c8243f", "#7a0a1d", "#de4a63"];
    const ps = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: -20 - Math.random() * H * .6, s: 9 + Math.random() * 10,
      vy: 1.2 + Math.random() * 1.8, sway: Math.random() * Math.PI * 2, sw: .02 + Math.random() * .03,
      r: Math.random() * 6, vr: (Math.random() - .5) * .06, flip: Math.random() * Math.PI * 2, c: cols[(Math.random() * cols.length) | 0],
    }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.sway += p.sw; p.flip += .05; p.y += p.vy; p.x += Math.sin(p.sway) * 1.2; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.abs(Math.cos(p.flip)) * .7 + .3);
        ctx.fillStyle = p.c; ctx.beginPath();
        ctx.moveTo(0, -p.s * .55);
        ctx.bezierCurveTo(p.s * .6, -p.s * .5, p.s * .5, p.s * .45, 0, p.s * .5);
        ctx.bezierCurveTo(-p.s * .5, p.s * .45, -p.s * .6, -p.s * .5, 0, -p.s * .55);
        ctx.fill(); ctx.restore();
      }
      if (t - t0 < 4200) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }

  /* ---------- Serveur et navigateur ---------- */
  async function api(path, opts) {
    opts = opts || {};
    const headers = { "content-type": "application/json" };
    if (opts.key) headers["x-billet-key"] = opts.key;
    let res;
    try {
      res = await fetch(path, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    } catch {
      throw { status: 0, message: "Pas de connexion. Vérifie ton réseau et réessaie." };
    }
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) throw { status: res.status, message: data.error || "Une erreur est survenue. Réessaie dans un instant." };
    return data;
  }
  async function copy(text, input) {
    try { await navigator.clipboard.writeText(text); toast("Lien copié"); }
    catch { if (input) { input.focus(); input.select(); } toast("Sélectionne le lien et copie-le"); }
  }
  const storage = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    remove(k) { try { localStorage.removeItem(k); } catch {} },
  };
  function rememberInvitation(id, token) {
    const mine = storage.get("dateme:mine", {});
    mine[id] = token;
    storage.set("dateme:mine", mine);
  }

  // Logo : une rose et « Date me »
  function logo() {
    return el("a", { class: "logo", href: "/" }, el("span", { html: roseSVG({ leaves: true }), "aria-hidden": "true", style: "display:inline-flex;width:30px;height:30px" }), "Date me");
  }

  return { el, toast, cap, fmtDate, fmtTime, roseSVG, rose, bouquet, letter, envelope, ask, clearLoose, petals, api, copy, storage, rememberInvitation, logo };
})();
