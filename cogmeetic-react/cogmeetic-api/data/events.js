const EVENTS = [
    {
        id: 1,
        titre: 'Soirée Masquée',
        date: 'ven. 5 nov.',
        horaire: '20:00 - 01:00',
        duree: '05h00',
        prix: '4€',
        image: '/images/soiree-masquee.jpg',   // 👈 chemin relatif servi par l’API
    },
    {
        id: 2,
        titre: 'Night Party',
        date: 'lun. 8 nov.',
        horaire: '20:00 - 01:00',
        duree: '05h00',
        prix: '4€',
        image: '/images/night-party.jpg',
    },
];

module.exports = { EVENTS };
