// src/pages/login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveSession } from '../api';
import '../styles/login.css';

const API_URL = import.meta.env.VITE_API_ADDRESS;

function Login() {
    const navigate = useNavigate();
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password }),
            });

            if (!res.ok) {
                setError('Identifiants invalides');
                return;
            }

            const data = await res.json();
            saveSession({ id: data.id, name: data.name, promo: data.promo }, data.token);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError("Erreur de connexion à l'API");
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

                <h2 className="login-title">Connexion</h2>

                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Pseudo"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        className="login-input"
                    />
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="login-input"
                    />

                    {error && <p className="login-error">{error}</p>}

                    <button type="submit" className="login-button">
                        Se connecter
                    </button>
                </form>

                <p className="login-footer">
                    Pas encore inscrit ?{' '}
                    <Link to="/signup">Inscrivez-vous ici</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
