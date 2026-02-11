// cogmeetic-api/data/users.js

// 4 x 1A
const USERS = [
    { id: 1, name: 'Josepha', promo: '1A', login: 'josepha', password: 'josepha123' },
    { id: 2, name: 'Mael', promo: '1A', login: 'mael', password: 'mael123' },
    { id: 3, name: 'Enzo', promo: '1A', login: 'enzo', password: 'enzo123' },
    { id: 4, name: 'Aurélien', promo: '1A', login: 'aurelien', password: 'aurelien123' },

    // 4 x 2A
    { id: 5, name: 'Arthur', promo: '2A', login: 'arthur', password: 'arthur123' },
    { id: 6, name: 'Juliette', promo: '2A', login: 'juliette', password: 'juliette123' },
    { id: 7, name: 'Julien', promo: '2A', login: 'julien', password: 'julien123' },
    { id: 8, name: 'Louison', promo: '2A', login: 'louison', password: 'louison123' },
];

// On n’a PLUS de CURRENT_USER fixe : ce sera la connexion qui dira qui on est
module.exports = { USERS };
