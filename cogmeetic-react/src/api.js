// src/api.js
// Utilitaire central pour tous les appels à l'API Cogmeetic.
// Ajoute automatiquement le token JWT dans chaque requête.

const API_URL = import.meta.env.VITE_API_ADDRESS;

export function getToken() {
    return localStorage.getItem('token');
}

export function getUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}

export function saveSession(user, token) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
}

export function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
}

// Wrapper autour de fetch qui injecte Authorization: Bearer <token>
// Redirige vers /login automatiquement si l'API répond 401
export async function authFetch(path, options = {}) {
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    if (res.status === 401) {
        logout();
        window.location.href = '/login';
        return res;
    }
    return res;
}
