// src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveSession } from '../api';
import '../styles/login.css';

const API_URL = import.meta.env.VITE_API_ADDRESS;

function Signup() {
    const [step, setStep] = useState(1);
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [promo, setPromo] = useState(null);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    function handleSubmitStep1(e) {
        e.preventDefault();

        if (!prenom.trim()) {
            setError("Merci de renseigner ton prénom.");
            return;
        }
        if (!nom.trim()) {
            setError("Merci de renseigner ton nom de famille.");
            return;
        }
        if (password.length < 4) {
            setError("Choisis un mot de passe d'au moins 4 caractères.");
            return;
        }
        if (password !== password2) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setError('');
        setStep(2);
    }

    async function handleSubmitStep2(e) {
        e.preventDefault();

        if (!promo) {
            setError("Merci de choisir ta promo.");
            return;
        }

        setError('');

        const fullName = `${prenom.trim()} ${nom.trim()}`;
        const login = `${prenom.trim()}.${nom.trim()}`.toLowerCase().replace(/\s+/g, '');

        try {
            const res = await fetch(`${API_URL}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: fullName,
                    login,
                    password,
                    promo,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erreur lors de l'inscription");
                return;
            }

            saveSession({ id: data.id, name: data.name, promo: data.promo, isAdmin: data.isAdmin }, data.token);
            navigate('/tuto');
        } catch (err) {
            console.error(err);
            setError("Impossible de contacter le serveur");
        }
    }

    return (
        <div className="login-page gradient-bg">
            <div className="login-card">
                <div className="login-slogan">
                    <p>SWIPE. MATCH.</p>
                    <p>PARRAINE.</p>
                    <div className="login-slogan-underline" />
                </div>

                {step === 1 && (
                    <>
                        <h2 className="login-title">Inscription</h2>

                        <form className="login-form" onSubmit={handleSubmitStep1}>
                            <input
                                className="login-input"
                                type="text"
                                placeholder="Ton prénom"
                                value={prenom}
                                onChange={(e) => setPrenom(e.target.value)}
                            />
                            <input
                                className="login-input"
                                type="text"
                                placeholder="Ton nom de famille"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                            />
                            <input
                                className="login-input"
                                type="text"
                                placeholder="Ton pseudo"
                                value={pseudo}
                                onChange={(e) => setPseudo(e.target.value)}
                            />
                            <input
                                className="login-input"
                                type="password"
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <input
                                className="login-input"
                                type="password"
                                placeholder="Confirmer le mot de passe"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                            />

                            {error && <div className="login-error">{error}</div>}

                            <button type="submit" className="login-button">
                                Continuer
                            </button>
                        </form>

                        <div className="login-footer">
                            <span>Déjà un compte ? </span>
                            <Link to="/login">Connectez-vous ici</Link>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 className="login-title">En quelle année es-tu à l&apos;ENSC ?</h2>
                        <p className="login-help-text">Tu ne pourras pas le changer après.</p>

                        <form className="login-form" onSubmit={handleSubmitStep2}>
                            <div className="promo-buttons">
                                <button
                                    type="button"
                                    className={`promo-btn ${promo === '1A' ? 'active' : ''}`}
                                    onClick={() => setPromo('1A')}
                                >
                                    Première année
                                </button>
                                <button
                                    type="button"
                                    className={`promo-btn ${promo === '2A' ? 'active' : ''}`}
                                    onClick={() => setPromo('2A')}
                                >
                                    Deuxième année
                                </button>
                            </div>

                            {error && <div className="login-error">{error}</div>}

                            <button type="submit" className="login-button">
                                Continuer
                            </button>
                        </form>

                        <div className="login-footer">
                            <span>Déjà un compte ? </span>
                            <Link to="/login">Connectez-vous ici</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Signup;
