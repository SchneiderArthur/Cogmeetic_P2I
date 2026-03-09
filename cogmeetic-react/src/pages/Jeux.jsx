// src/pages/Jeux.jsx
import { useEffect, useState } from 'react';
import { authFetch, getUser } from '../api';
import '../styles/jeux.css';

const SWIPE_THRESHOLD = 120;

// Mini-jeux “fakes” pour après le Tu préfères
const MINI_GAMES = [
    {
        id: 'anecdotes',
        title: "Concours d'anecdotes",
        subtitle: 'Raconte ta meilleure anecdote à ton parrain / ta marraine.',
    },
    {
        id: 'deux-verites',
        title: 'Deux vérités, un mensonge',
        subtitle: 'Devine ce qui est faux chez l’autre élève 👀',
    },
    {
        id: 'quiz',
        title: 'Quiz Cogmeetic',
        subtitle: "Un petit quiz fun pour en apprendre plus sur l'école.",
    },
];

function Jeux() {
    // 1) On récupère l'utilisateur connecté depuis le localStorage
    const user = getUser();
    const CURRENT_USER_ID = user?.id;

    // Pas connecté → on bloque
    if (!CURRENT_USER_ID) {
        return (
            <div className="page-container jeux-container">
                <p>
                    Merci de te connecter d’abord sur <a href="/login">/login</a>
                </p>
            </div>
        );
    }

    // Hooks
    const [questions, setQuestions] = useState([]);
    const [indexQuestion, setIndexQuestion] = useState(0);

    const [dragStartX, setDragStartX] = useState(null);
    const [dragOffsetX, setDragOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ---------------------------------
    // Récupérer les questions du jour
    // ---------------------------------
    useEffect(() => {
        async function fetchQuestions() {
            try {
                setLoading(true);
                setError(null);
                const res = await authFetch('/api/questions/today');
                if (!res.ok) throw new Error('Erreur API');
                const data = await res.json();
                setQuestions(data);
                setIndexQuestion(0);
            } catch (err) {
                console.error(err);
                setError("Impossible de charger les questions 😢");
            } finally {
                setLoading(false);
            }
        }

        fetchQuestions();
    }, [CURRENT_USER_ID]);

    const question = questions[indexQuestion];
    // Plus de questions si :
    //  - le backend renvoie [] (déjà répondu)
    //  - ou on a dépassé la dernière
    const plusDeQuestions =
        questions.length === 0 || indexQuestion >= questions.length;

    // ---------------------------------
    // Gestion du drag / swipe
    // ---------------------------------
    function resetDrag() {
        setDragStartX(null);
        setDragOffsetX(0);
        setIsDragging(false);
    }

    function handlePointerDown(clientX) {
        setDragStartX(clientX);
        setIsDragging(true);
    }

    function handlePointerMove(clientX) {
        if (!isDragging || dragStartX === null) return;
        const deltaX = clientX - dragStartX;
        setDragOffsetX(deltaX);
    }

    async function handlePointerUp() {
        if (!isDragging) return;

        if (dragOffsetX > SWIPE_THRESHOLD) {
            await handleChoix('right');
        } else if (dragOffsetX < -SWIPE_THRESHOLD) {
            await handleChoix('left');
        } else {
            resetDrag();
        }
    }

    // ---------------------------------
    // Envoyer la réponse au backend
    // ---------------------------------
    async function handleChoix(cote) {
        if (!question) return;

        try {
            await authFetch('/api/answers', {
                method: 'POST',
                body: JSON.stringify({ questionId: question.id, choix: cote }),
            });
        } catch (err) {
            console.error('Erreur en envoyant la réponse', err);
        }

        setIndexQuestion((prev) => prev + 1);
        resetDrag();
    }

    // ---------------------------------
    // Rendus selon l'état
    // ---------------------------------
    if (loading) {
        return (
            <div className="page-container jeux-container">
                <p>Chargement des questions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container jeux-container">
                <p>{error}</p>
            </div>
        );
    }

    // ✅ CAS 1 : l’utilisateur a déjà répondu aux questions du jour
    if (plusDeQuestions) {
        return (
            <div className="page-container jeux-container">
                {/* Bandeau Tu préfères terminé */}
                <section className="tpref-banner tpref-banner-done">
                    <p className="tpref-banner-title">
                        Tu as répondu aux questions du jour 🎉
                    </p>
                    <p className="tpref-banner-subtitle">
                        Reviens demain pour en découvrir de nouvelles.
                    </p>
                </section>

                {/* Liste des autres jeux (fakes) */}
                <h2 className="jeux-section-title">Jeux</h2>

                <div className="mini-games-list">
                    {MINI_GAMES.map((game) => (
                        <button
                            key={game.id}
                            className="mini-game-card"
                            onClick={() =>
                                alert(
                                    `Ce mini-jeu "${game.title}" arrive bientôt dans Cogmeetic 🕹️`,
                                )
                            }
                        >
                            <div className="mini-game-main">
                                <span className="mini-game-pill">Bientôt dispo</span>
                                <h3 className="mini-game-title">{game.title}</h3>
                                <p className="mini-game-subtitle">{game.subtitle}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ✅ CAS 2 : il reste des questions Tu préfères à faire
    if (!question) {
        return (
            <div className="page-container jeux-container">
                <p>Aucune question disponible pour le moment.</p>
            </div>
        );
    }

    const rotation = dragOffsetX * 0.05;
    const opacity = Math.max(0.4, 1 - Math.abs(dragOffsetX) / 300);

    return (
        <div className="page-container jeux-container">
            <h2 className="jeux-title">Tu préfères...</h2>

            <div
                className={`swipe-card ${isDragging ? 'dragging' : ''}`}
                style={{
                    transform: `translateX(${dragOffsetX}px) rotate(${rotation}deg)`,
                    opacity,
                }}
                // Souris
                onMouseDown={(e) => handlePointerDown(e.clientX)}
                onMouseMove={(e) => handlePointerMove(e.clientX)}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                // Tactile
                onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
                onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
                onTouchEnd={handlePointerUp}
            >
                <div className="label-left">{question.left}</div>
                <div className="lightning">⚡</div>
                <div className="label-right">{question.right}</div>
            </div>

            <p className="progress">
                Question {indexQuestion + 1} / {questions.length}
            </p>
        </div>
    );
}

export default Jeux;
