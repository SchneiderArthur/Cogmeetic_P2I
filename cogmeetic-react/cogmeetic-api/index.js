const os = require('os');

const express = require('express');
const cors = require('cors');
const path = require('path'); // 👈 pour construire le chemin vers /public/images

const { QUESTIONS } = require('./data/questions');
const { USERS } = require('./data/users');
const { EVENTS } = require('./data/events');

const app = express();
const PORT = 4000;

app.use(cors({
    origin: '*',
}));
app.use(express.json());

// 👇 Nouveau : servir les images statiques depuis /public/images
app.use('/images', express.static(path.join(__dirname, 'data', 'images')));

// -------------------------------
// Stockage en mémoire (dev only)
// -------------------------------

// { userId: [ { questionId, choix } ] }
const answersByUser = {};

// Top 5 par utilisateur : { userId: [id1, id2, id3, id4, id5] }
const top5ByUser = {};

// Profils par utilisateur : { userId: { bio, centresInterets, contact } }
const profilesByUser = {};

// Retourne le profil complet (infos fixes + profil editable)
function getProfileData(userId) {
    const user = USERS.find(u => u.id === userId);
    if (!user) return null;

    const profile = profilesByUser[userId] || {};
    const { password, login, ...safeUser } = user;

    return {
        ...safeUser,            // id, name, promo...
        bio: profile.bio || '',
        centresInterets: profile.centresInterets || '',
        contact: profile.contact || '',
    };
}

function setProfileData(userId, data) {
    const user = USERS.find(u => u.id === userId);
    if (!user) return null;

    profilesByUser[userId] = {
        bio: data.bio || '',
        centresInterets: data.centresInterets || '',
        contact: data.contact || '',
    };

    return getProfileData(userId);
}


// -------------------------------
// Helpers réponses / compatibilité
// -------------------------------

// Ajoute ou remplace une réponse pour un user
function addAnswer(userId, questionId, choix) {
    if (!answersByUser[userId]) {
        answersByUser[userId] = [];
    }
    const others = answersByUser[userId].filter(a => a.questionId !== questionId);
    answersByUser[userId] = [...others, { questionId, choix }];
}

// Calcul compatibilité entre deux users
function computeCompatibility(userIdA, userIdB) {
    const ansA = answersByUser[userIdA] || [];
    const ansB = answersByUser[userIdB] || [];

    if (ansA.length === 0 || ansB.length === 0) return 0;

    let common = 0;
    let same = 0;

    for (const a of ansA) {
        const b = ansB.find((x) => x.questionId === a.questionId);
        if (b) {
            common++;
            if (b.choix === a.choix) same++;
        }
    }

    if (common === 0) return 0;
    return same / common; // entre 0 et 1
}

function hasCompletedToday(userId) {
    // Ids des questions du jour (ici les 3 premières)
    const todaysIds = QUESTIONS.slice(0, 3).map(q => q.id);

    const ans = answersByUser[userId] || [];
    const answeredCount = ans.filter(a => todaysIds.includes(a.questionId)).length;

    // a-t-il répondu à toutes les questions du jour ?
    return answeredCount >= todaysIds.length;
}


// -------------------------------
// Helpers Top 5 (Poulpage)
// -------------------------------

function setTop5(userId, top5Ids) {
    const me = USERS.find(u => u.id === userId);
    if (!me) return;

    // Seuls les users de la promo opposée sont valides
    const validIds = USERS
        .filter(u => u.promo !== me.promo)
        .map(u => u.id);

    const clean = Array.from(new Set(top5Ids))  // retire doublons
        .filter(id => validIds.includes(id))      // garde seulement les ids valides
        .slice(0, 5);                             // max 5

    top5ByUser[userId] = clean;
}

function getTop5(userId) {
    return top5ByUser[userId] || [];
}

// Donne le rang (1..5) de targetId dans le top5 de userId, ou Infinity si pas dedans
function getRankInTop5(userId, targetId) {
    const top = getTop5(userId) || [];
    const idx = top.indexOf(targetId);
    return idx === -1 ? Infinity : idx + 1; // 1 = 1er, 5 = 5e, Infinity = pas dans le top
}

// Algorithme de matching en 3 étapes :
// 1) couples mutuels #1,
// 2) meilleurs couples en fonction des Top 5,
// 3) reste en fonction de la compatibilité.
function computeMatches() {
    const firstYears = USERS.filter(u => u.promo === '1A');
    const secondYears = USERS.filter(u => u.promo === '2A');

    const matched1 = new Set();  // ids 1A déjà couplés
    const matched2 = new Set();  // ids 2A déjà couplés
    const matches = [];

    // -------------------------
    // Étape 1 : couples mutuels #1
    // -------------------------
    for (const a of firstYears) {
        if (matched1.has(a.id)) continue;

        const topA = getTop5(a.id);
        const firstChoiceId = topA && topA[0];

        if (!firstChoiceId) continue;

        const b = secondYears.find(u => u.id === firstChoiceId);
        if (!b || matched2.has(b.id)) continue;

        const topB = getTop5(b.id);
        const firstChoiceB = topB && topB[0];

        if (firstChoiceB === a.id) {
            // 🔥 Couple mutuel #1
            matched1.add(a.id);
            matched2.add(b.id);

            const compat = computeCompatibility(a.id, b.id);

            matches.push({
                oneA: { id: a.id, name: a.name, promo: a.promo },
                twoA: { id: b.id, name: b.name, promo: b.promo },
                compat,
                rankOneInTwo: 1,
                rankTwoInOne: 1,
                mutualTop5: true,
                from: 'mutual_first'
            });
        }
    }

    // -------------------------
    // Étape 2 : meilleurs couples selon les Top 5
    // (uniquement si au moins l'un des deux a mis l'autre en top 5)
    // -------------------------
    const pairsTop5 = [];

    for (const a of firstYears) {
        if (matched1.has(a.id)) continue;

        for (const b of secondYears) {
            if (matched2.has(b.id)) continue;

            const rankA = getRankInTop5(a.id, b.id);
            const rankB = getRankInTop5(b.id, a.id);

            // on ne garde que si AU MOINS un des deux a mis l'autre dans son Top 5
            if (!Number.isFinite(rankA) && !Number.isFinite(rankB)) {
                continue;
            }

            const compat = computeCompatibility(a.id, b.id);
            const mutual = Number.isFinite(rankA) && Number.isFinite(rankB);

            // score de préférence basé sur les rangs
            let preferenceScore = 0;
            if (Number.isFinite(rankA)) preferenceScore += (6 - rankA); // rang1 = 5 pts, rang5 = 1 pt
            if (Number.isFinite(rankB)) preferenceScore += (6 - rankB);

            pairsTop5.push({
                oneAId: a.id,
                twoAId: b.id,
                compat,
                rankA,
                rankB,
                mutual,
                preferenceScore
            });
        }
    }

    // Tri : d'abord ceux où c'est mutuel, puis meilleur score de top5, puis compat
    pairsTop5.sort((p1, p2) => {
        if (p1.mutual && !p2.mutual) return -1;
        if (!p1.mutual && p2.mutual) return 1;

        if (p2.preferenceScore !== p1.preferenceScore) {
            return p2.preferenceScore - p1.preferenceScore;
        }

        return p2.compat - p1.compat;
    });

    for (const p of pairsTop5) {
        if (matched1.has(p.oneAId) || matched2.has(p.twoAId)) continue;

        matched1.add(p.oneAId);
        matched2.add(p.twoAId);

        const a = USERS.find(u => u.id === p.oneAId);
        const b = USERS.find(u => u.id === p.twoAId);

        matches.push({
            oneA: { id: a.id, name: a.name, promo: a.promo },
            twoA: { id: b.id, name: b.name, promo: b.promo },
            compat: p.compat,
            rankOneInTwo: p.rankB,
            rankTwoInOne: p.rankA,
            mutualTop5: p.mutual,
            from: 'top5'
        });
    }

    // -------------------------
    // Étape 3 : couples restants par compatibilité
    // (même si pas dans les top 5)
    // -------------------------
    const remaining1 = firstYears.filter(u => !matched1.has(u.id));
    const remaining2 = secondYears.filter(u => !matched2.has(u.id));

    const pairsCompat = [];
    for (const a of remaining1) {
        for (const b of remaining2) {
            const compat = computeCompatibility(a.id, b.id);
            pairsCompat.push({
                oneAId: a.id,
                twoAId: b.id,
                compat
            });
        }
    }

    // tri par compat décroissante
    pairsCompat.sort((p1, p2) => p2.compat - p1.compat);

    for (const p of pairsCompat) {
        if (matched1.has(p.oneAId) || matched2.has(p.twoAId)) continue;

        matched1.add(p.oneAId);
        matched2.add(p.twoAId);

        const a = USERS.find(u => u.id === p.oneAId);
        const b = USERS.find(u => u.id === p.twoAId);

        matches.push({
            oneA: { id: a.id, name: a.name, promo: a.promo },
            twoA: { id: b.id, name: b.name, promo: b.promo },
            compat: p.compat,
            rankOneInTwo: getRankInTop5(b.id, a.id),
            rankTwoInOne: getRankInTop5(a.id, b.id),
            mutualTop5: false,
            from: 'compat'
        });
    }

    const unmatched1 = firstYears.filter(u => !matched1.has(u.id));
    const unmatched2 = secondYears.filter(u => !matched2.has(u.id));

    return { matches, unmatched1, unmatched2 };
}


// -------------------------------
// Routes API
// -------------------------------

// 🔍  Profil d'un user connecté : /api/profile?userId=...
app.get('/api/profile', (req, res) => {
    const userId = Number(req.query.userId);
    if (!userId) {
        return res.status(400).json({ error: 'userId requis en query' });
    }

    const profile = getProfileData(userId);
    if (!profile) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json(profile);
});

// 💾 Mise à jour du profil
// Body attendu : { userId, bio, centresInterets, contact }
app.put('/api/profile', (req, res) => {
    const { userId, bio, centresInterets, contact } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId requis dans le body' });
    }

    const updated = setProfileData(Number(userId), {
        bio,
        centresInterets,
        contact,
    });

    if (!updated) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json(updated);
});

app.get('/', (req, res) => {
    res.json({ message: 'API Cogmeetic OK ✅' });
});

// 🔑 Login simple : { login, password } → { id, name, promo }
app.post('/api/login', (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ error: 'login et password sont obligatoires' });
    }

    const user = USERS.find(
        (u) => u.login === login && u.password === password
    );

    if (!user) {
        return res.status(401).json({ error: 'Identifiants invalides' });
    }

    res.json({
        id: user.id,
        name: user.name,
        promo: user.promo,
    });
});

// 1️⃣ Questions du jour : 3 questions, mais dépend de l'utilisateur
app.get('/api/questions/today', (req, res) => {
    const userId = Number(req.query.userId);

    if (!userId) {
        return res.status(400).json({ error: 'userId requis en query' });
    }

    // Si l'utilisateur a déjà répondu aux questions du jour -> plus rien à envoyer
    if (hasCompletedToday(userId)) {
        return res.json([]); // tableau vide = plus de questions aujourd'hui
    }

    // Sinon on renvoie les 3 questions du jour
    res.json(QUESTIONS.slice(0, 3));
});


// 2️⃣ Poster une réponse à une question
app.post('/api/answers', (req, res) => {
    const { userId, questionId, choix } = req.body;

    if (!userId || !questionId || !choix) {
        return res.status(400).json({ error: 'userId, questionId et choix sont obligatoires' });
    }

    addAnswer(Number(userId), Number(questionId), choix);
    res.json({ status: 'ok' });
});

// 3️⃣ Renvoyer les users de l'autre promo avec leur score de compatibilité
//    /api/users?userId=5
app.get('/api/users', (req, res) => {
    const userId = Number(req.query.userId);
    const me = USERS.find(u => u.id === userId);

    if (!me) {
        return res.status(400).json({ error: 'userId invalide' });
    }

    // Users de la promo opposée (1A ↔ 2A)
    const candidates = USERS.filter(u => u.promo !== me.promo);

    const usersWithScore = candidates.map((u) => ({
        ...u,
        compatibilite: computeCompatibility(userId, u.id),
    }));

    res.json(usersWithScore);
});

// 4️⃣ Récupérer un profil utilisateur (basique, sans login/password)
app.get('/api/users/:id', (req, res) => {
    const id = Number(req.params.id);
    const user = USERS.find((u) => u.id === id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password, login, ...safeUser } = user;
    res.json(safeUser);
});

// 5️⃣ Événements
app.get('/api/events', (req, res) => {
    res.json(EVENTS);
});

// 6️⃣ Récupérer le top 5 d'un user donné : /api/top5?userId=5
app.get('/api/top5', (req, res) => {
    const userId = Number(req.query.userId);
    const me = USERS.find(u => u.id === userId);
    if (!me) return res.status(400).json({ error: 'userId invalide' });

    const topIds = getTop5(userId);

    const usersTop5 = topIds
        .map(id => USERS.find(u => u.id === id))
        .filter(Boolean)
        .map(u => ({
            ...u,
            compatibilite: computeCompatibility(userId, u.id),
        }));

    res.json(usersTop5);
});

// 7️⃣ Enregistrer / mettre à jour le top 5 d'un user donné
//    Body attendu : { userId, top5: [id1, id2, ...] }
app.post('/api/top5', (req, res) => {
    const { userId, top5 } = req.body;

    if (!userId || !Array.isArray(top5)) {
        return res.status(400).json({ error: 'userId + top5 (tableau) requis' });
    }

    setTop5(Number(userId), top5.map(Number));
    res.json({ status: 'ok', top5: getTop5(Number(userId)) });
});

// 8️⃣ Renvoyer les couples proposés 1A / 2A
app.get('/api/matches', (req, res) => {
    const result = computeMatches();
    res.json(result);
});

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const host = getLocalIp();

app.listen(PORT, () => {
    console.log(`🚀 Cogmeetic API running on ${host}:${PORT}`);
});
