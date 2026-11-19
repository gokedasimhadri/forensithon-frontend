import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  getStoredTeamLeader,
  getStoredAuthToken,
  clearStoredTeamLeader,
  refreshLoggedInStudent
} from '../services/api';
import LoginModal from './LoginModal';

function formatDisplayName(user) {
  if (!user) return 'Student';
  const raw = user.name || user.studentname || user.studentName || '';
  if (raw && raw.trim() && raw.trim().toUpperCase() !== String(user.roll || '').toUpperCase()) {
    return raw
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return user.roll ? String(user.roll).toUpperCase() : 'Student';
}

function getUserInitials(user) {
  if (!user) return 'AU';
  const raw = (user.name || user.studentname || user.studentName || '').trim();
  if (raw && raw.toUpperCase() !== String(user.roll || '').toUpperCase()) {
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (user.roll) {
    return String(user.roll).slice(-2).toUpperCase();
  }
  return 'AU';
}

export default function Header({ motionOff, toggleMotion }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [loggedUser, setLoggedUser] = useState(() => {
    const user = getStoredTeamLeader();
    const token = getStoredAuthToken();
    return user || token ? user : null;
  });

  useEffect(() => {
    const syncAuth = () => {
      const user = getStoredTeamLeader();
      const token = getStoredAuthToken();
      setLoggedUser(user || token ? user : null);
    };
    window.addEventListener('forensithon-auth-changed', syncAuth);
    window.addEventListener('storage', syncAuth);

    if (getStoredAuthToken() || getStoredTeamLeader()) {
      refreshLoggedInStudent()
        .then((fresh) => {
          if (fresh) setLoggedUser(fresh);
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('forensithon-auth-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  // Listen to open-forensithon-login event from anywhere in the app
  useEffect(() => {
    const handleOpenLogin = () => setIsLoginModalOpen(true);
    window.addEventListener('open-forensithon-login', handleOpenLogin);
    return () => window.removeEventListener('open-forensithon-login', handleOpenLogin);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const handleHeaderLogout = () => {
    setIsMenuOpen(false);
    clearStoredTeamLeader();
    setLoggedUser(null);
    navigate('/registration');
  };

  const displayName = formatDisplayName(loggedUser);
  const initials = getUserInitials(loggedUser);
  const isLeader = Boolean(
    loggedUser?.isTeamLeader ||
    loggedUser?.role === 'Team Leader' ||
    (loggedUser?.teamName && !loggedUser?.role)
  );

  return (
    <header className="site-header">
      <Link to="/" title="FORENSITHON 2k26 Home" className="header-logo-link">
        <img
          className="emblem"
          src={`${import.meta.env.BASE_URL}aditya-university-logo.jpg`}
          alt="Aditya University logo"
        />
      </Link>

      <nav aria-label="Main navigation">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Home
        </NavLink>
        <NavLink to="/rounds" className={({ isActive }) => (isActive ? 'active' : '')}>
          Rounds
        </NavLink>
        <NavLink to="/challenges" className={({ isActive }) => (isActive ? 'active' : '')}>
          Challenges
        </NavLink>
      </nav>

      {/* Header Auth & Profile Slot */}
      <div className="header-auth-slot">
        {loggedUser ? (
          <div className="header-profile-menu-wrap" ref={dropdownRef}>
            <button
              type="button"
              className={`header-profile-trigger ${isMenuOpen ? 'is-active' : ''}`}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
              aria-label={`User menu for ${displayName}`}
            >
              <span className="header-avatar-circle" aria-hidden="true">
                {initials}
              </span>
              <span className="header-profile-name">{displayName}</span>
              <svg
                className={`header-chevron ${isMenuOpen ? 'is-open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="header-profile-dropdown" role="menu">
                {/* User Identity Header */}
                <div className="dropdown-user-header">
                  <div className="dropdown-avatar-sm" aria-hidden="true">
                    <span>{initials}</span>
                  </div>
                  <div className="dropdown-user-info">
                    <strong className="dropdown-user-fullname">{displayName}</strong>
                    <div className="dropdown-user-meta">
                      {loggedUser.roll && (
                        <span className="dropdown-roll-chip">{loggedUser.roll}</span>
                      )}
                      <span className={`dropdown-role-chip ${isLeader ? 'role-lead' : 'role-member'}`}>
                        {isLeader ? 'LEAD' : 'MEMBER'}
                      </span>
                    </div>
                    {loggedUser.teamName && (
                      <div className="dropdown-user-team">
                        <span>Team: </span>
                        <strong>{loggedUser.teamName}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="dropdown-divider" />

                <div className="dropdown-nav-group">
                  <Link
                    to="/account"
                    className="dropdown-item"
                    onClick={() => setIsMenuOpen(false)}
                    role="menuitem"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>My Account &amp; Pass</span>
                  </Link>

                  <button
                    type="button"
                    className="dropdown-item dropdown-item--logout"
                    onClick={handleHeaderLogout}
                    role="menuitem"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign Out ({loggedUser.roll || 'Logout'})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="header-login-btn"
            onClick={() => setIsLoginModalOpen(true)}
            title="Login with your Roll Number & Password"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>LOGIN</span>
          </button>
        )}
      </div>

      {/* Global Team Login Modal Popup */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialMode="login"
        onSuccess={(student) => {
          setLoggedUser(student);
          setIsLoginModalOpen(false);
        }}
      />
    </header>
  );
}
