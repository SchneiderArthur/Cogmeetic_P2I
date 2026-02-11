// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App.jsx';

import Jeux from './pages/Jeux.jsx';
import Chat from './pages/Chat.jsx';
import ChatConversation from './pages/ChatConversation.jsx';
import Profil from './pages/Profil.jsx';
import Poulpage from './pages/Poulpage.jsx';
import Evenements from './pages/Evenements.jsx';
import AdminMatches from './pages/AdminMatches.jsx';
import Login from './pages/login.jsx';      // attention au nom du fichier (login.jsx)
import Tuto from './pages/Tuto.jsx';
import Signup from './pages/Signup.jsx';


import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* App = layout global (logo + bottom nav) */}
      <App>
        <Routes>
          {/* Connexion + tuto */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/tuto" element={<Tuto />} />

          {/* Pages principales */}
          <Route path="/" element={<Jeux />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<ChatConversation />} /> {/* nouvelle page */}
          <Route path="/profil" element={<Profil />} />
          <Route path="/poulpage" element={<Poulpage />} />
          <Route path="/evenements" element={<Evenements />} />
          <Route path="/admin/matches" element={<AdminMatches />} />
        </Routes>
      </App>
    </BrowserRouter>
  </React.StrictMode>,
);
