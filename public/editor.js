// Date me — éditeur des prénoms et des idées de date (utilisé à la création et dans l'espace privé).
BD.editor = function (root, state, opts) {
  const { el } = BD;
  const MAX = 8;
  opts = opts || {};
  const changed = () => opts.onChange && opts.onChange(state);

  function field(labelText, hint, input) {
    return el("label", { for: input.id }, hint ? el("span", {}, labelText + " ", el("small", { text: hint })) : labelText, input);
  }

  function bind(input, obj, key) {
    input.value = obj[key] || "";
    input.addEventListener("input", () => { obj[key] = input.value; changed(); });
    return input;
  }

  function namesCard() {
    return el("div", { class: "card" },
      el("h3", { text: "La lettre" }),
      el("div", { class: "row" },
        field("De la part de", null, bind(el("input", { id: "n-from", maxlength: "40", placeholder: "Jade", autocomplete: "given-name" }), state, "from")),
        field("Pour", "(prénom ou surnom)", bind(el("input", { id: "n-to", maxlength: "40", placeholder: "l'amour de ma vie" }), state, "to"))
      ),
      field("La question", "(elle apparaît à l'ouverture de l'enveloppe)", bind(el("input", { id: "n-question", maxlength: "120", placeholder: "Veux-tu un date avec moi ?" }), state, "question"))
    );
  }

  function ideaCard(idea, i) {
    const p = "i" + i + "-";
    const answered = idea.status === "oui";
    const remove = state.ideas.length > 1
      ? el("button", { class: "link danger", type: "button", text: "Retirer", onclick: () => { state.ideas.splice(i, 1); changed(); render(); } })
      : null;
    return el("div", { class: "card" },
      el("div", { class: "actions", style: "justify-content:space-between" },
        el("h3", { text: "Proposition " + (i + 1) }),
        answered ? el("span", { class: "pill yes", text: "A dit oui" }) : remove),
      answered && idea.reply ? el("p", { class: "notice ok", text: "Son mot : " + idea.reply }) : null,
      field("L'idée de date", null, bind(el("input", { id: p + "title", maxlength: "80", placeholder: "Pique-nique aux Calanques au coucher du soleil" }), idea, "title")),
      el("div", { class: "row" },
        field("Date", null, bind(el("input", { id: p + "date", type: "date" }), idea, "date")),
        field("Heure", null, bind(el("input", { id: p + "time", type: "time" }), idea, "time"))
      ),
      field("Commentaire sur l'heure", "(rendez-vous, retard interdit…)", bind(el("input", { id: p + "timenote", maxlength: "140", placeholder: "Je passe te chercher, sois prêt·e à 19h pile" }), idea, "timeNote")),
      field("Commentaire", "(tenue, surprise, ce qu'il faut prévoir…)", bind(el("textarea", { id: p + "comment", maxlength: "600", placeholder: "Prends une veste, il fera frais. Je m'occupe du reste." }), idea, "comment"))
    );
  }

  function render() {
    root.replaceChildren(
      namesCard(),
      ...state.ideas.map(ideaCard),
      state.ideas.length < MAX
        ? el("button", { class: "btn ghost", type: "button", text: "+ Ajouter une proposition", onclick: () => {
            state.ideas.push({ title: "", date: "", time: "", timeNote: "", comment: "" });
            changed(); render();
            document.getElementById("i" + (state.ideas.length - 1) + "-title")?.focus();
          } })
        : el("p", { class: "hint", text: "Maximum " + MAX + " propositions par lettre." })
    );
  }

  if (!state.ideas.length) state.ideas.push({ title: "", date: "", time: "", timeNote: "", comment: "" });
  render();
  return { render };
};
