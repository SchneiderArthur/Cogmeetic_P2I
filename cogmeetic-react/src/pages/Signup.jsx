// src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/login.css';

function Signup() {
    const [step, setStep] = useState(1);

    const [prenom, setPrenom] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [promo, setPromo] = useState(null);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    // Étape 1 : prénom + mot de passe
    function handleSubmitStep1(e) {
        e.preventDefault();

        if (!prenom.trim()) {
            setError('Merci de renseigner ton prénom.');
            return;
        }
        if (password.length < 4) {
            setError('Choisis un mot de passe d’au moins 4 caractères.');
            return;
        }
        if (password !== password2) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setError('');
        setStep(2);
    }

    // Étape 2 : promo
    function handleSubmitStep2(e) {
        e.preventDefault();

        if (!promo) {
            setError('Merci de choisir ta promo.');
            return;
        }

        setError('');

        // Pour la démo : on garde les infos quelque part si tu veux les réutiliser
        const tempSignup = {
            prenom: prenom.trim(),
            promo,
            password,
        };
        localStorage.setItem('signup_demo', JSON.stringify(tempSignup));

        // Flag pour dire qu’on vient de s’inscrire → on affiche le tuto
        localStorage.setItem('just_signed_up', 'true');

        // On enchaîne sur le tuto (et après le tuto tu rediriges vers /login ou /)
        navigate('/tuto');
    }

    return (
        <div className="login-page gradient-bg">
            <div className="login-card">
                {/* Slogan comme sur la maquette */}
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
                        <h2 className="login-title">En quelle année es-tu à l’ENSC ?</h2>
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
