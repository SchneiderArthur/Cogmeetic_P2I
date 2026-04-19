import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../api';
import '../styles/profilView.css';

function ProfilView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await authFetch(`/api/users/${id}`);
                if (!res.ok) throw new Error();
                setProfile(await res.json());
            } catch {
                setProfile(null);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [id]);

    if (loading) return <p className="profil-view-loading">Chargement...</p>;
    if (!profile) return <p className="profil-view-loading">Profil introuvable.</p>;

    const initials =
        profile.name
            ?.split(' ')
            .map((p) => p[0])
            .join('')
            .toUpperCase() || '🙂';

    return (
        <div className="page-container profil-view-page">
            <div className="profil-view-card">
                <button className="profil-view-back" onClick={() => navigate(-1)}>
                    ← Retour
                </button>

                <header className="profil-view-header">
                    <div className="profil-view-avatar">{initials}</div>
                    <div className="profil-view-identity">
                        <h2>{profile.name}</h2>
                        <span className="profil-view-promo">{profile.promo}</span>
                    </div>
                </header>

                <Section title="Biographie" value={profile.bio} placeholder="Pas encore de biographie." />
                <Section title="Centres d'intérêt" value={profile.centresInterets} placeholder="Aucun centre d'intérêt renseigné." />
                <Section title="Contact" value={profile.contact} placeholder="Aucun contact renseigné." />
            </div>
        </div>
    );
}

function Section({ title, value, placeholder }) {
    return (
        <section className="profil-view-section">
            <h3>{title}</h3>
            <p className={value?.trim() ? '' : 'profil-view-empty'}>
                {value?.trim() || placeholder}
            </p>
        </section>
    );
}

export default ProfilView;
