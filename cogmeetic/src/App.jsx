import { Link, useLocation } from 'react-router-dom';
import './App.css';
import logoCogmeetic from './images/logo-cogmeetic.png';

function App({ children }) {
  const location = useLocation();

  return (
    <div className="app-root">
      {/* Header avec logo */}
      <header className="app-header">
        <img
          src={logoCogmeetic}
          alt="Cogmeetic"
          className="logo"
        />
      </header>

      {/* Contenu central */}
      <main className="app-main">
        {children}
      </main>

      {/* Navbar du bas (type app mobile) */}
      <nav className="bottom-nav">
        <NavItem to="/" label="Jeux" icon="🎮" currentPath={location.pathname} />
        <NavItem to="/chat" label="Chat" icon="💬" currentPath={location.pathname} />
        <NavItem to="/poulpage" label="Poulpes" icon="🐙" currentPath={location.pathname} />
        <NavItem to="/evenements" label="Explore" icon="⭐" currentPath={location.pathname} />
        <NavItem to="/profil" label="Profil" icon="👤" currentPath={location.pathname} />
        {/* Si tu veux montrer l'admin dans la nav : */}
        {/* <NavItem to="/admin/matches" label="Admin" icon="🛠️" currentPath={location.pathname} /> */}
      </nav>
    </div>
  );
}

function NavItem({ to, label, icon, currentPath }) {
  const isActive = currentPath === to;

  return (
    <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
    </Link>
  );
}

export default App;
