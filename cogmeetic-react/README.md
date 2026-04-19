# Cogmeetic

App web de parrainage ENSC — les élèves 1A et 2A répondent à des questions, classent leurs préférences, et un algorithme propose des binômes parrain/filleul.

Démo : https://cogmeetic-p2i.vercel.app

---

## Stack

- Frontend : React + Vite + React Router
- Backend : Node.js + Express
- BDD : SQLite (better-sqlite3)
- Auth : JWT
- Hébergement : Vercel (front) + Railway (back + volume persistant)

## Structure

```
cogmeetic-react/
├── cogmeetic-api/      backend Express
│   ├── index.js        routes API
│   ├── db.js           init SQLite + migrations
│   └── data/
│       ├── questions.js  42 questions de compatibilité
│       └── images/       uploads (événements, avatars)
├── src/
│   ├── pages/          une page par route
│   ├── styles/         CSS par page
│   ├── api.js          authFetch + session
│   ├── App.jsx         layout + navbar
│   └── main.jsx        routes
└── .env                VITE_API_ADDRESS
```

---

## Lancer en local

Backend


cd cogmeetic-api
npm install
node index.js
# démarre sur localhost:4000
```

Frontent (dans un autre terminal)

npm install
npm run dev
# http://localhost:5173
```

`.env` à créer à la racine de `cogmeetic-react/` :

```
VITE_API_ADDRESS="http://localhost:4000"
```

---

## Variables d'environnement backend

 Variable  Rôle  Exemple 

 `JWT_SECRET`  clé de signature des tokens  `secret-long` 
 `ADMIN_LOGINS`  logins admin (séparés par `,`)  `arthur.schneider` 
 `DB_PATH`  chemin du fichier SQLite  `/data/cogmeetic.db` 

Sans `DB_PATH`, la base est créée dans `cogmeetic-api/cogmeetic.db`.

---

## Déploiement

Railway (backend)
- Root directory : `cogmeetic-react/cogmeetic-api`
- Volume persistant monté sur `/data`
- Variables : `JWT_SECRET`, `ADMIN_LOGINS`, `DB_PATH=/data/cogmeetic.db`

Vercel (frontend)
- Root directory : `cogmeetic-react`
- Variable : `VITE_API_ADDRESS=https://<url-railway>`



## Comptes admin

Les logins dans `ADMIN_LOGINS` reçoivent les droits admin automatiquement à la connexion/inscription. Les admins voient trois onglets supplémentaires dans la navbar : gestion des couples, des événements et des utilisateurs.
