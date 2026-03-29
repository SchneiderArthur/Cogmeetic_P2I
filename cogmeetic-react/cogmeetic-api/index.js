const os = require('os');
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const upload = multer({
    storage: multer.diskStorage({
        destination: path.join(__dirname, 'data', 'images'),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${Date.now()}${ext}`);
        },
    }),
    fileFilter: (_req, file, cb) => {
        cb(null, /image\/(jpeg|png|webp|gif)/.test(file.mimetype));
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
});

const db = require('./db');
const { QUESTIONS } = require('./data/questions');

const app = express();
const PORT = 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'cogmeetic-dev-secret';

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'data', 'images')));

// -------------------------------
// Middleware auth JWT
// -------------------------------

function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    try {
        const token = header.slice(7);
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Token invalide' });
    }
}

// -------------------------------
// Helpers compatibilité
// -------------------------------

function computeCompatibility(userIdA, userIdB) {
    const answersA = db.prepare(
        `SELECT question_id, choix FROM answers WHERE user_id = ?`
    ).all(userIdA);

    const answersB = db.prepare(
        `SELECT question_id, choix FROM answers WHERE user_id = ?`
    ).all(userIdB);

    if (answersA.length === 0 || answersB.length === 0) return 0;

    const mapB = new Map(answersB.map(a => [a.question_id, a.choix]));

    let common = 0;
    let same = 0;
    for (const a of answersA) {
        if (mapB.has(a.question_id)) {
            common++;
            if (mapB.get(a.question_id) === a.choix) same++;
        }
    }

    return common === 0 ? 0 : same / common;
}

// Retourne les 3 questions du jour en fonction de la date (rotation cyclique)
function getTodayQuestions() {
    const dayIndex = Math.floor(Date.now() / 86400000); // jours depuis epoch UTC
    const n = QUESTIONS.length;
    return [0, 1, 2].map(i => QUESTIONS[(dayIndex * 3 + i) % n]);
}

function hasCompletedToday(userId) {
    const today = new Date().toISOString().slice(0, 10);
    const todayIds = getTodayQuestions().map(q => q.id);

    const count = db.prepare(
        `SELECT COUNT(*) as cnt FROM answers
         WHERE user_id = ? AND question_id IN (${todayIds.join(',')}) AND answered_at = ?`
    ).get(userId, today);

    return count.cnt >= todayIds.length;
}

// -------------------------------
// Helpers Top 5
// -------------------------------

function getTop5(userId) {
    return db.prepare(
        `SELECT target_user_id FROM top5 WHERE user_id = ? ORDER BY rank ASC`
    ).all(userId).map(r => r.target_user_id);
}

function getRankInTop5(userId, targetId) {
    const row = db.prepare(
        `SELECT rank FROM top5 WHERE user_id = ? AND target_user_id = ?`
    ).get(userId, targetId);
    return row ? row.rank : Infinity;
}

function setTop5(userId, top5Ids) {
    const me = db.prepare(`SELECT promo FROM users WHERE id = ?`).get(userId);
    if (!me) return;

    const validUsers = db.prepare(
        `SELECT id FROM users WHERE promo != ?`
    ).all(me.promo).map(u => u.id);

    const clean = [...new Set(top5Ids)]
        .filter(id => validUsers.includes(id))
        .slice(0, 5);

    const deleteStmt = db.prepare(`DELETE FROM top5 WHERE user_id = ?`);
    const insertStmt = db.prepare(
        `INSERT INTO top5 (user_id, rank, target_user_id) VALUES (?, ?, ?)`
    );

    db.transaction(() => {
        deleteStmt.run(userId);
        clean.forEach((targetId, i) => insertStmt.run(userId, i + 1, targetId));
    })();
}

// -------------------------------
// Helpers profil
// -------------------------------

function getProfileData(userId) {
    const user = db.prepare(`SELECT id, name, promo FROM users WHERE id = ?`).get(userId);
    if (!user) return null;

    const profile = db.prepare(`SELECT * FROM profiles WHERE user_id = ?`).get(userId);

    return {
        ...user,
        bio: profile?.bio || '',
        centresInterets: profile?.centres_interets || '',
        contact: profile?.contact || '',
    };
}

// -------------------------------
// Algorithme de matching
// -------------------------------

function computeMatches() {
    const firstYears = db.prepare(`SELECT id, name, promo FROM users WHERE promo = '1A'`).all();
    const secondYears = db.prepare(`SELECT id, name, promo FROM users WHERE promo = '2A'`).all();

    const matched1 = new Set();
    const matched2 = new Set();
    const matches = [];

    // Étape 1 : couples mutuels #1
    for (const a of firstYears) {
        if (matched1.has(a.id)) continue;
        const topA = getTop5(a.id);
        if (!topA[0]) continue;

        const b = secondYears.find(u => u.id === topA[0]);
        if (!b || matched2.has(b.id)) continue;

        const topB = getTop5(b.id);
        if (topB[0] === a.id) {
            matched1.add(a.id);
            matched2.add(b.id);
            matches.push({
                oneA: a, twoA: b,
                compat: computeCompatibility(a.id, b.id),
                rankOneInTwo: 1, rankTwoInOne: 1,
                mutualTop5: true, from: 'mutual_first'
            });
        }
    }

    // Étape 2 : meilleurs couples selon Top 5
    const pairsTop5 = [];
    for (const a of firstYears) {
        if (matched1.has(a.id)) continue;
        for (const b of secondYears) {
            if (matched2.has(b.id)) continue;
            const rankA = getRankInTop5(a.id, b.id);
            const rankB = getRankInTop5(b.id, a.id);
            if (!Number.isFinite(rankA) && !Number.isFinite(rankB)) continue;

            const compat = computeCompatibility(a.id, b.id);
            const mutual = Number.isFinite(rankA) && Number.isFinite(rankB);
            let preferenceScore = 0;
            if (Number.isFinite(rankA)) preferenceScore += (6 - rankA);
            if (Number.isFinite(rankB)) preferenceScore += (6 - rankB);

            pairsTop5.push({ oneAId: a.id, twoAId: b.id, compat, rankA, rankB, mutual, preferenceScore });
        }
    }

    pairsTop5.sort((p1, p2) => {
        if (p1.mutual && !p2.mutual) return -1;
        if (!p1.mutual && p2.mutual) return 1;
        if (p2.preferenceScore !== p1.preferenceScore) return p2.preferenceScore - p1.preferenceScore;
        return p2.compat - p1.compat;
    });

    for (const p of pairsTop5) {
        if (matched1.has(p.oneAId) || matched2.has(p.twoAId)) continue;
        matched1.add(p.oneAId);
        matched2.add(p.twoAId);
        const a = firstYears.find(u => u.id === p.oneAId);
        const b = secondYears.find(u => u.id === p.twoAId);
        matches.push({
            oneA: a, twoA: b,
            compat: p.compat,
            rankOneInTwo: p.rankB, rankTwoInOne: p.rankA,
            mutualTop5: p.mutual, from: 'top5'
        });
    }

    // Étape 3 : reste par compatibilité
    const remaining1 = firstYears.filter(u => !matched1.has(u.id));
    const remaining2 = secondYears.filter(u => !matched2.has(u.id));
    const pairsCompat = [];
    for (const a of remaining1) {
        for (const b of remaining2) {
            pairsCompat.push({ oneAId: a.id, twoAId: b.id, compat: computeCompatibility(a.id, b.id) });
        }
    }
    pairsCompat.sort((p1, p2) => p2.compat - p1.compat);

    for (const p of pairsCompat) {
        if (matched1.has(p.oneAId) || matched2.has(p.twoAId)) continue;
        matched1.add(p.oneAId);
        matched2.add(p.twoAId);
        const a = firstYears.find(u => u.id === p.oneAId);
        const b = secondYears.find(u => u.id === p.twoAId);
        matches.push({
            oneA: a, twoA: b,
            compat: p.compat,
            rankOneInTwo: getRankInTop5(b.id, a.id),
            rankTwoInOne: getRankInTop5(a.id, b.id),
            mutualTop5: false, from: 'compat'
        });
    }

    const unmatched1 = firstYears.filter(u => !matched1.has(u.id));
    const unmatched2 = secondYears.filter(u => !matched2.has(u.id));
    return { matches, unmatched1, unmatched2 };
}

// -------------------------------
// Routes API
// -------------------------------

app.get('/', (req, res) => res.json({ message: 'API Cogmeetic OK ✅' }));

// Inscription
app.post('/api/signup', async (req, res) => {
    const { name, login, password, promo } = req.body;

    if (!name || !login || !password || !promo) {
        return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
    }
    if (!['1A', '2A'].includes(promo)) {
        return res.status(400).json({ error: 'Promo invalide (1A ou 2A)' });
    }
    if (password.length < 4) {
        return res.status(400).json({ error: 'Mot de passe trop court (4 caractères minimum)' });
    }

    const existing = db.prepare(`SELECT id FROM users WHERE login = ?`).get(login);
    if (existing) {
        return res.status(409).json({ error: 'Ce pseudo est déjà pris' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
        `INSERT INTO users (name, login, password_hash, promo) VALUES (?, ?, ?, ?)`
    ).run(name, login, password_hash, promo);

    const userId = result.lastInsertRowid;
    const adminLogins = (process.env.ADMIN_LOGINS || '').split(',').map(l => l.trim()).filter(Boolean);
    const isAdmin = adminLogins.includes(login);
    if (isAdmin) db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(userId);
    const token = jwt.sign({ id: userId, name, promo, isAdmin }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ id: userId, name, promo, isAdmin, token });
});

// Connexion
app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ error: 'login et password sont obligatoires' });
    }

    const user = db.prepare(`SELECT * FROM users WHERE login = ?`).get(login);
    if (!user) {
        return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Vérifier si le login est dans ADMIN_LOGINS et mettre à jour la DB si besoin
    const adminLogins = (process.env.ADMIN_LOGINS || '').split(',').map(l => l.trim()).filter(Boolean);
    if (adminLogins.includes(login) && user.is_admin !== 1) {
        db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(user.id);
        user.is_admin = 1;
    }

    const isAdmin = user.is_admin === 1;
    const token = jwt.sign({ id: user.id, name: user.name, promo: user.promo, isAdmin }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ id: user.id, name: user.name, promo: user.promo, isAdmin, token });
});

// Questions du jour
app.get('/api/questions/today', authMiddleware, (req, res) => {
    if (hasCompletedToday(req.user.id)) {
        return res.json([]);
    }
    res.json(getTodayQuestions());
});

// Poster une réponse
app.post('/api/answers', authMiddleware, (req, res) => {
    const { questionId, choix } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    if (!questionId || !choix) {
        return res.status(400).json({ error: 'questionId et choix sont obligatoires' });
    }

    db.prepare(
        `INSERT OR REPLACE INTO answers (user_id, question_id, choix, answered_at) VALUES (?, ?, ?, ?)`
    ).run(req.user.id, questionId, choix, today);

    res.json({ status: 'ok' });
});

// Users de la promo opposée avec compatibilité
app.get('/api/users', authMiddleware, (req, res) => {
    const me = db.prepare(`SELECT promo FROM users WHERE id = ?`).get(req.user.id);
    if (!me) return res.status(400).json({ error: 'Utilisateur introuvable' });

    const candidates = db.prepare(`SELECT id, name, promo FROM users WHERE promo != ?`).all(me.promo);
    const result = candidates.map(u => ({
        ...u,
        compatibilite: computeCompatibility(req.user.id, u.id),
    }));

    res.json(result);
});

// Profil d'un user (lecture)
app.get('/api/profile', authMiddleware, (req, res) => {
    const userId = req.query.userId ? Number(req.query.userId) : req.user.id;
    const profile = getProfileData(userId);
    if (!profile) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(profile);
});

// Mise à jour du profil (seulement le sien)
app.put('/api/profile', authMiddleware, (req, res) => {
    const { bio, centresInterets, contact } = req.body;
    const userId = req.user.id;

    db.prepare(`
        INSERT INTO profiles (user_id, bio, centres_interets, contact)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            bio = excluded.bio,
            centres_interets = excluded.centres_interets,
            contact = excluded.contact
    `).run(userId, bio || '', centresInterets || '', contact || '');

    res.json(getProfileData(userId));
});

// Profil par ID
app.get('/api/users/:id', authMiddleware, (req, res) => {
    const profile = getProfileData(Number(req.params.id));
    if (!profile) return res.status(404).json({ error: 'User not found' });
    res.json(profile);
});

// Upload image (admin)
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Accès réservé aux admins' });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    res.json({ url: `/images/${req.file.filename}` });
});

// Événements
app.get('/api/events', authMiddleware, (_req, res) => {
    res.json(db.prepare('SELECT * FROM events ORDER BY id ASC').all());
});

app.post('/api/events', authMiddleware, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Accès réservé aux admins' });
    const { titre, date, horaire, duree, prix, image } = req.body;
    if (!titre) return res.status(400).json({ error: 'titre requis' });
    const result = db.prepare(
        `INSERT INTO events (titre, date, horaire, duree, prix, image) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(titre, date || '', horaire || '', duree || '', prix || '', image || '');
    res.status(201).json(db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/events/:id', authMiddleware, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Accès réservé aux admins' });
    const { titre, date, horaire, duree, prix, image } = req.body;
    db.prepare(
        `UPDATE events SET titre=?, date=?, horaire=?, duree=?, prix=?, image=? WHERE id=?`
    ).run(titre, date || '', horaire || '', duree || '', prix || '', image || '', Number(req.params.id));
    res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(Number(req.params.id)));
});

app.delete('/api/events/:id', authMiddleware, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Accès réservé aux admins' });
    db.prepare('DELETE FROM events WHERE id = ?').run(Number(req.params.id));
    res.json({ status: 'ok' });
});

// Récupérer le Top 5
app.get('/api/top5', authMiddleware, (req, res) => {
    const topIds = getTop5(req.user.id);
    const result = topIds.map(id => {
        const user = db.prepare(`SELECT id, name, promo FROM users WHERE id = ?`).get(id);
        return user ? { ...user, compatibilite: computeCompatibility(req.user.id, id) } : null;
    }).filter(Boolean);
    res.json(result);
});

// Sauvegarder le Top 5
app.post('/api/top5', authMiddleware, (req, res) => {
    const { top5 } = req.body;
    if (!Array.isArray(top5)) {
        return res.status(400).json({ error: 'top5 (tableau) requis' });
    }
    setTop5(req.user.id, top5.map(Number));
    res.json({ status: 'ok', top5: getTop5(req.user.id) });
});

// Liste tous les users (admin)
app.get('/api/admin/users', authMiddleware, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Accès réservé aux admins' });
    const users = db.prepare('SELECT id, name, login, promo, is_admin FROM users ORDER BY promo, name').all();
    res.json(users);
});

// Réinitialiser le mot de passe d'un user (admin)
app.put('/api/admin/users/:id/password', authMiddleware, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Accès réservé aux admins' });
    const userId = Number(req.params.id);
    const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Génère un mot de passe temporaire lisible
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    const tempPassword = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const hash = await bcrypt.hash(tempPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);

    res.json({ tempPassword });
});

// Matches admin (réservé aux admins)
app.get('/api/matches', authMiddleware, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Accès réservé aux admins' });
    res.json(computeMatches());
});

// -------------------------------
// Démarrage
// -------------------------------

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return 'localhost';
}

app.listen(PORT, () => {
    // Passage en admin des logins listés dans ADMIN_LOGINS (séparés par des virgules)
    const adminLogins = process.env.ADMIN_LOGINS;
    if (adminLogins) {
        adminLogins.split(',').map(l => l.trim()).filter(Boolean).forEach(login => {
            db.prepare('UPDATE users SET is_admin = 1 WHERE login = ?').run(login);
            console.log(`✅ Admin: ${login}`);
        });
    }
    console.log(`🚀 Cogmeetic API running on ${getLocalIp()}:${PORT}`);
});
