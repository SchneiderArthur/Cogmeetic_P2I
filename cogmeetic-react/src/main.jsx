// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import App from './App.jsx';
import { getToken } from './api.js';

import Jeux from './pages/Jeux.jsx';
import Chat from './pages/Chat.jsx';
import ChatConversation from './pages/ChatConversation.jsx';
import Profil from './pages/Profil.jsx';
import Poulpage from './pages/Poulpage.jsx';
import Evenements from './pages/Evenements.jsx';
import AdminMatches from './pages/AdminMatches.jsx';
import Login from './pages/login.jsx';
import Tuto from './pages/Tuto.jsx';
import Signup from './pages/Signup.jsx';

import './index.css';

// Redirige vers /login si pas de token
function ProtectedRoute({ children }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App>
        <Routes>
          {/* Pages publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/tuto" element={<Tuto />} />

          {/* Pages protégées */}
          <Route path="/" element={<ProtectedRoute><Jeux /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><ChatConversation /></ProtectedRoute>} />
          <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
          <Route path="/poulpage" element={<ProtectedRoute><Poulpage /></ProtectedRoute>} />
          <Route path="/evenements" element={<ProtectedRoute><Evenements /></ProtectedRoute>} />
          <Route path="/admin/matches" element={<ProtectedRoute><AdminMatches /></ProtectedRoute>} />
        </Routes>
      </App>
    </BrowserRouter>
  </React.StrictMode>,
);
