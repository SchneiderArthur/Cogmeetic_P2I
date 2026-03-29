const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'cogmeetic.db');
const db = new Database(dbPath);

// Activer les foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Création des tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    login TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    promo TEXT NOT NULL CHECK(promo IN ('1A', '2A')),
    is_admin INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    choix TEXT NOT NULL,
    answered_at TEXT NOT NULL DEFAULT (date('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, question_id, answered_at)
  );

  CREATE TABLE IF NOT EXISTS top5 (
    user_id INTEGER NOT NULL,
    rank INTEGER NOT NULL CHECK(rank BETWEEN 1 AND 5),
    target_user_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, rank),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    bio TEXT NOT NULL DEFAULT '',
    centres_interets TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT '',
    horaire TEXT NOT NULL DEFAULT '',
    duree TEXT NOT NULL DEFAULT '',
    prix TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT ''
  );
`);

// Migration : ajout is_admin si la colonne n'existe pas encore
try {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`);
} catch (_) { /* colonne déjà présente */ }

// Seed événements par défaut si la table est vide
const eventCount = db.prepare('SELECT COUNT(*) as cnt FROM events').get();
if (eventCount.cnt === 0) {
    const insert = db.prepare(
        `INSERT INTO events (titre, date, horaire, duree, prix, image) VALUES (?, ?, ?, ?, ?, ?)`
    );
    insert.run('Soirée Masquée', 'ven. 5 nov.', '20:00 - 01:00', '05h00', '4€', '/images/soiree-masquee.jpg');
    insert.run('Night Party', 'lun. 8 nov.', '20:00 - 01:00', '05h00', '4€', '/images/night-party.jpg');
}

module.exports = db;
