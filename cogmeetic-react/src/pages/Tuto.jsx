// src/pages/Tuto.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/tuto.css';

const steps = [
    {
        id: 'engagements',
        title: 'Nos Engagements',
        subtitle: "Ceci n’est pas une application de rencontre",
        subtitleVariant: 'danger',
        paragraphs: [
            "Avant tout, nous valorisons l’intégrité et l’enrichissement à travers des activités et des rencontres bienveillantes. Cogmeetic est là pour t’aider à profiter au maximum de ton année à l’ENSC et à trouver un parrain ou une marraine qui te correspond.",
            "Le bien-être de l’école est notre priorité. Merci de traiter tout le monde avec respect, humour bien dosé et gentillesse. C’est tout ce qu’on demande.",
            "Nous prenons aussi ta vie privée au sérieux : tes infos restent au sein de l’école et ne seront jamais revendues. Tu gardes le contrôle sur ce que tu partages.",
        ],
    },
    {
        id: 'questions',
        title: 'Bienvenue sur Cogmeetic ✨',
        text: "Chaque jour, réponds à 3 questions 'Tu préfères...' pour mieux cerner tes affinités.",
    },
    {
        id: 'compat',
        title: 'Compatibilité & Chat 💬',
        text: "On calcule un pourcentage de compatibilité et tu peux discuter avec les personnes qui matchent le mieux avec toi.",
    },
    {
        id: 'poulpage',
        title: 'Poulpage 🐙',
        text: 'Classe les personnes avec qui tu as le meilleur feeling dans ton Top 5 pour les sessions de parrains/filleul.',
    },
    {
        id: 'events',
        title: 'Évènements IRL 🎉',
        text: "Retrouve la liste des soirées et évènements de l’école pour rencontrer ton futur parrain/marraine en vrai.",
    },
];

function Tuto() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const [index, setIndex] = useState(0);

    const step = steps[index];

    function handleNext() {
        if (index < steps.length - 1) {
            setIndex((prev) => prev + 1);
            return;
        }

        // dernière slide → tuto vu pour cet utilisateur
        if (user?.id) {
            localStorage.setItem(`tuto_${user.id}_seen`, 'true');
        }

        navigate('/'); // direction page Jeux
    }

    return (
        <div className="page-container tuto-container gradient-bg">
            <div className="tuto-card">
                {/* petits points de progression */}
                <div className="tuto-step-indicator">
                    {steps.map((_, i) => (
                        <span
                            key={i}
                            className={`tuto-dot ${i === index ? 'active' : ''}`}
                        />
                    ))}
                </div>

                <h2 className="tuto-title">{step.title}</h2>

                {/* Sous-titre rouge pour la slide “Nos engagements” */}
                {step.subtitle && (
                    <p
                        className={
                            step.subtitleVariant === 'danger'
                                ? 'tuto-subtitle tuto-subtitle-danger'
                                : 'tuto-subtitle'
                        }
                    >
                        {step.subtitle}
                    </p>
                )}

                {/* Texte simple (slides classiques) */}
                {step.text && <p className="tuto-text">{step.text}</p>}

                {/* Plusieurs paragraphes (slide engagements) */}
                {step.paragraphs && (
                    <div className="tuto-paragraphs">
                        {step.paragraphs.map((p, i) => (
                            <p key={i} className="tuto-text">
                                {p}
                            </p>
                        ))}
                    </div>
                )}

                <button className="tuto-button" onClick={handleNext}>
                    {index < steps.length - 1 ? 'Suivant' : "C’est noté ✅"}
                </button>
            </div>
        </div>
    );
}

export default Tuto;
