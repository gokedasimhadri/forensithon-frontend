import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getStoredTeamLeader, getStoredAuthToken, clearStoredTeamLeader } from '../services/api';

export default function Header({ motionOff, toggleMotion }) {
  const navigate = useNavigate();
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
    return () => {
      window.removeEventListener('forensithon-auth-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const handleHeaderLogout = () => {
    clearStoredTeamLeader();
    setLoggedUser(null);
    navigate('/registration');
  };

  return (
    <header className="site-header">
      <Link to="/" title="FORENSITHON 2k26 Home">
        <img
          className="emblem"
          src={`${import.meta.env.BASE_URL}aditya-university-logo.jpg`}
          alt="Aditya University logo"
        />
      </Link>
      <div className="header-identity">
        <Link className="brand" to="/">
          FORENSITHON 2k26
        </Link>
        <p className="header-organised">Organised by</p>
        <p className="header-subtitle">
          Department of Forensic Science, School of Sciences in collaboration with Institution's Innovation Council (IIC)
        </p>
      </div>
      <nav aria-label="Main navigation">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Home
        </NavLink>
        <NavLink to="/challenges" className={({ isActive }) => (isActive ? 'active' : '')}>
          Challenges
        </NavLink>
        <NavLink to="/rounds" className={({ isActive }) => (isActive ? 'active' : '')}>
          Rounds
        </NavLink>
        <NavLink to="/registration" className={({ isActive }) => (isActive ? 'active' : '')}>
          Register
        </NavLink>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {loggedUser && (
          <button
            type="button"
            className="motion-toggle"
            onClick={handleHeaderLogout}
            title={`Logged in as ${loggedUser.name || loggedUser.roll || 'Student'}. Click to logout.`}
            style={{ background: '#fff5f0', borderColor: '#ff5500', color: '#c2410c', fontWeight: 700 }}
          >
            Logout ({loggedUser.roll || loggedUser.name?.split(' ')[0] || 'User'}) ↪
          </button>
        )}
        <button
          type="button"
          className="motion-toggle"
          onClick={toggleMotion}
          aria-pressed={motionOff}
          aria-label="Toggle motion animations"
        >
          {motionOff ? 'Motion: Off' : 'Motion: On'}
        </button>
      </div>
    </header>
  );
}
