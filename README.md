# Date me : guide de mise en ligne

Date me est un site où chacun écrit une lettre (sa question et ses idées de dates), paie une fois, puis envoie un lien à sa moitié. Sur ce lien, une enveloppe scellée d'une rose s'ouvre sur la question, et le bouton « Non » s'enfuit : seul « Oui » est possible.

Pas besoin de savoir coder : il suffit de suivre les étapes dans l'ordre. Compte environ 1 heure la première fois.

---

## Ce que contient le dossier

| Fichier | À quoi il sert |
|---|---|
| `public/index.html` | La page de vente (celle à mettre dans ta bio Instagram) |
| `public/creer.html` | La page où le client écrit sa question, ses idées, et paie |
| `public/merci.html` | La page de retour après le paiement |
| `public/espace.html` | L'espace privé du client : lien à envoyer, réponses, modifications |
| `public/b.html` | La page que reçoit la personne invitée (l'enveloppe, la lettre, le bouton Non qui fuit) |
| `public/mentions.html` | Mentions légales et CGV, **à compléter** |
| `public/style.css` | Le design : couleurs, typographies, enveloppe |
| `public/config.js` | **Tes réglages** : prix affiché, compte Instagram, e-mail de contact |
| `netlify/functions/` | La partie serveur : enregistrer, vérifier le paiement, répondre |

Les liens générés ressemblent à ceci :
- lien à envoyer : `https://ton-site.netlify.app/b/Ab3dE5fGhJ`
- espace privé du client : `https://ton-site.netlify.app/espace/Ab3dE5fGhJ#clé-secrète`

---

## Étape 1 · Crée trois comptes gratuits

1. **GitHub** (github.com) : stocke les fichiers du site.
2. **Netlify** (netlify.com) : met le site en ligne. Inscris-toi avec ton compte GitHub.
3. **Stripe** (stripe.com) : encaisse les paiements. Tu peux commencer en mode test sans fournir de SIRET.

## Étape 2 · Envoie les fichiers sur GitHub

1. Sur GitHub, clique sur **New repository**, nomme-le `date-me`, laisse-le en **Private**, puis clique sur **Create repository**.
2. Clique sur **uploading an existing file**.
3. Dézippe le dossier sur ton ordinateur, puis glisse **tout son contenu** dans la page (les dossiers `public` et `netlify`, et les fichiers `netlify.toml`, `package.json`, `README.md`).
4. Clique sur **Commit changes**.

## Étape 3 · Mets le site en ligne avec Netlify (version gratuite pour tester)

1. Sur Netlify : **Add new site → Import an existing project → GitHub**, puis choisis `date-me`.
2. Ne change aucun réglage (le fichier `netlify.toml` s'en occupe). Clique sur **Deploy**.
3. Va dans **Site configuration → Environment variables → Add a variable** et ajoute :
   - `PAYMENT_MODE` = `off`
4. Va dans **Deploys → Trigger deploy → Deploy site** pour relancer le site avec ce réglage.

Ton site est en ligne à l'adresse affichée par Netlify (tu peux la renommer dans **Site configuration → Change site name**, par exemple `dateme.netlify.app`).

Avec `PAYMENT_MODE = off`, les lettres sont **gratuites** : c'est idéal pour tester le parcours complet, et pour tes propres lettres.

## Étape 4 · Branche le paiement Stripe

Fais d'abord tout en **mode test** (interrupteur « Test mode » en haut de Stripe). Tu recommenceras en mode réel à la fin.

### 4a. Le lien de paiement
1. Stripe → **Catalogue de produits → Ajouter un produit** : nom « Date me », prix **3,99 €**, paiement **unique**.
2. Stripe → **Liens de paiement → Nouveau** : choisis ce produit.
3. Onglet **Après le paiement** : choisis **Ne pas afficher de page de confirmation** et redirige vers :
   `https://TON-SITE.netlify.app/merci.html?session_id={CHECKOUT_SESSION_ID}`
   (remplace `TON-SITE`, et garde `{CHECKOUT_SESSION_ID}` tel quel, avec les accolades).
4. Crée le lien et copie-le (il commence par `https://buy.stripe.com/`).

### 4b. La clé secrète
Stripe → **Développeurs → Clés API** → copie la **clé secrète** (elle commence par `sk_test_` en mode test).

### 4c. Le webhook (filet de sécurité)
Il active l'invitation même si le client ferme la page juste après avoir payé.
1. Stripe → **Développeurs → Webhooks → Ajouter une destination**.
2. Événement : `checkout.session.completed`.
3. URL : `https://TON-SITE.netlify.app/api/stripe-webhook`
4. Copie le **secret de signature** (il commence par `whsec_`).

### 4d. Donne ces informations à Netlify
Dans **Environment variables**, ajoute :

| Nom | Valeur |
|---|---|
| `STRIPE_PAYMENT_LINK` | le lien `https://buy.stripe.com/…` |
| `STRIPE_SECRET_KEY` | la clé `sk_…` |
| `STRIPE_WEBHOOK_SECRET` | le secret `whsec_…` |

Puis **supprime** la variable `PAYMENT_MODE` (ou mets-la à `stripe`) et relance un déploiement.

### 4e. Teste un paiement
Écris une lettre sur ton site et paie avec la carte de test Stripe `4242 4242 4242 4242` (date future au choix, code au choix). Tu dois arriver dans l'espace privé avec ton lien.

### 4f. Passe en réel
Désactive le mode test dans Stripe, refais les étapes 4a à 4c en mode réel (Stripe te demandera alors tes informations d'entreprise), remplace les trois valeurs dans Netlify et relance un déploiement.

## Étape 5 · Personnalise

- **`public/config.js`** : prix affiché (garde-le identique à Stripe), ton nom de compte Instagram, ton e-mail de contact.
- **`public/mentions.html`** : remplace tous les passages entre crochets (nom, SIRET, adresse, durée de conservation, médiateur).

Pour modifier un fichier : ouvre-le sur GitHub, clique sur le crayon, modifie, puis **Commit changes**. Netlify remet le site à jour tout seul en une minute.

## Étape 6 · Instagram

- Mets l'adresse de ton site dans ta bio.
- Filme ton écran de téléphone pendant que tu ouvres l'enveloppe de la page d'accueil puis essaies de cliquer sur « Non » : c'est la démo parfaite pour un Reel.

---

## Avant d'encaisser le premier euro

Je ne suis pas juriste : fais vérifier ces points.
- Il te faut un statut pour vendre, en général la **micro-entreprise** (déclaration gratuite sur le site de l'URSSAF). Vérifie que ton contrat de travail n'a pas de clause d'exclusivité.
- Complète les **mentions légales et CGV** (`mentions.html`).
- Les clients cochent déjà une case qui demande l'accès immédiat et met fin au droit de rétractation, comme le prévoit la loi pour les contenus numériques.

## Bon à savoir

- **Si un client perd son lien privé** : le lien à envoyer continue de marcher. Le client peut retrouver son espace depuis le même navigateur (il est mémorisé), sinon il faudra lui créer une nouvelle lettre.
- **Les données** sont stockées dans Netlify (« Blobs »), sans base de données à gérer. Tu peux les voir dans Netlify → **Blobs**.
- **Les offres gratuites** de Netlify et Stripe suffisent pour démarrer. Netlify affiche ta consommation dans **Usage**. Stripe prend une commission sur chaque paiement (vérifie le tarif actuel sur stripe.com).
- **Pas de protection anti-abus** pour l'instant : si le site décolle, on pourra ajouter une limite de créations, une modération des messages, ou des thèmes payants en option.
