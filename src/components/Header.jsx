import { Link, NavLink } from 'react-router-dom';

export default function Header({ motionOff, toggleMotion }) {
  return (
    <header className="site-header">
      <Link to="/" title="FORENSITHON 2026 Home">
        <img
          className="emblem"
          src={`${import.meta.env.BASE_URL}aditya-university-logo.jpg`}
          alt="Aditya University logo"
        />
      </Link>
      <div className="header-identity">
        <Link className="brand" to="/">
          FORENSITHON 2026
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
      <button
        type="button"
        className="motion-toggle"
        onClick={toggleMotion}
        aria-pressed={motionOff}
        aria-label="Toggle motion animations"
      >
        {motionOff ? 'Motion: Off' : 'Motion: On'}
      </button>
    </header>
  );
}
