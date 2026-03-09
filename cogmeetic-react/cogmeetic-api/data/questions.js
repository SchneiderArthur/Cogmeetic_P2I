const QUESTIONS = [
    // Bloc 1
    { id: 1,  left: "⬅ Avoir un parrain/marraine investi(e)",      right: "Avoir un parrain/marraine discret(e) ➡️" },
    { id: 2,  left: "⬅ Sortir en soirée 2 fois par semaine",        right: "Rester chill chez soi ➡️" },
    { id: 3,  left: "⬅ Préférer les projets de groupe",             right: "Préférer travailler solo ➡️" },

    // Bloc 2
    { id: 4,  left: "⬅ Sport le matin",                             right: "Sport le soir ➡️" },
    { id: 5,  left: "⬅ Gros événement BDE",                         right: "Petit apéro chill ➡️" },
    { id: 6,  left: "⬅ Partir en week-end spontanément",            right: "Planifier ses voyages longtemps à l'avance ➡️" },

    // Bloc 3
    { id: 7,  left: "⬅ Se lever tôt (avant 8h)",                    right: "Se coucher tard (après minuit) ➡️" },
    { id: 8,  left: "⬅ Cuisiner soi-même",                          right: "Commander ou manger au resto ➡️" },
    { id: 9,  left: "⬅ Travailler dans le silence total",           right: "Travailler avec de la musique ➡️" },

    // Bloc 4
    { id: 10, left: "⬅ Réviser régulièrement tout au long du semestre", right: "Réviser au dernier moment ➡️" },
    { id: 11, left: "⬅ Prendre des notes à la main",                right: "Prendre des notes sur ordi ➡️" },
    { id: 12, left: "⬅ Plage",                                      right: "Montagne ➡️" },

    // Bloc 5
    { id: 13, left: "⬅ Jeux vidéo",                                 right: "Jeux de société ➡️" },
    { id: 14, left: "⬅ Netflix binge (plusieurs épisodes d'un coup)", right: "Un seul épisode par soir ➡️" },
    { id: 15, left: "⬅ Chat",                                       right: "Chien ➡️" },

    // Bloc 6
    { id: 16, left: "⬅ Concert",                                    right: "Festival ➡️" },
    { id: 17, left: "⬅ Musique pop / rap",                          right: "Rock / métal ➡️" },
    { id: 18, left: "⬅ Films en VO sous-titré",                     right: "Films en VF ➡️" },

    // Bloc 7
    { id: 19, left: "⬅ Sport collectif (foot, basket…)",            right: "Sport individuel (course, natation…) ➡️" },
    { id: 20, left: "⬅ Gym en salle",                               right: "Sport en plein air ➡️" },
    { id: 21, left: "⬅ Randonnée",                                  right: "Piscine / plage ➡️" },

    // Bloc 8
    { id: 22, left: "⬅ Café",                                       right: "Thé ➡️" },
    { id: 23, left: "⬅ Sucré au petit-déjeuner",                    right: "Salé au petit-déjeuner ➡️" },
    { id: 24, left: "⬅ Manger léger et souvent",                    right: "Manger peu mais copieux ➡️" },

    // Bloc 9
    { id: 25, left: "⬅ Être leader dans un groupe",                 right: "Suivre et contribuer sans diriger ➡️" },
    { id: 26, left: "⬅ Parler de ses problèmes à ses amis",         right: "Gérer ses problèmes tout seul ➡️" },
    { id: 27, left: "⬅ Dire ce qu'on pense directement",            right: "Tourner autour du pot pour ne pas blesser ➡️" },

    // Bloc 10
    { id: 28, left: "⬅ Sortir le jeudi soir",                       right: "Sortir le vendredi / samedi soir ➡️" },
    { id: 29, left: "⬅ Soirée avec plein de monde",                 right: "Soirée entre proches (5-10 personnes) ➡️" },
    { id: 30, left: "⬅ Apéro en intérieur",                         right: "Apéro en terrasse ➡️" },

    // Bloc 11
    { id: 31, left: "⬅ Shopping en ligne",                          right: "Shopping en magasin ➡️" },
    { id: 32, left: "⬅ Voyager avec une petite valise cabine",       right: "Voyager avec une grande valise bien remplie ➡️" },
    { id: 33, left: "⬅ TGV",                                        right: "Avion ➡️" },

    // Bloc 12
    { id: 34, left: "⬅ Hiver",                                      right: "Été ➡️" },
    { id: 35, left: "⬅ Passer le week-end en famille",              right: "Passer le week-end entre amis ➡️" },
    { id: 36, left: "⬅ Travailler le week-end si besoin",           right: "Sacraliser le week-end (jamais de boulot) ➡️" },

    // Bloc 13
    { id: 37, left: "⬅ Faire ses courses en avance (stock maison)", right: "Faire ses courses au jour le jour ➡️" },
    { id: 38, left: "⬅ Faire la cuisine",                           right: "Faire le ménage ➡️" },
    { id: 39, left: "⬅ Dépenser pour ses amis (payer une tournée)", right: "Partager les frais équitablement ➡️" },

    // Bloc 14
    { id: 40, left: "⬅ Réseaux sociaux (poster, regarder)",         right: "Vie IRL (téléphone posé) ➡️" },
    { id: 41, left: "⬅ Écouter de la musique sur Spotify",          right: "Écouter de la musique sur YouTube ➡️" },
    { id: 42, left: "⬅ Foncer sans trop réfléchir",                 right: "Tout planifier avant d'agir ➡️" },
];

module.exports = { QUESTIONS };
