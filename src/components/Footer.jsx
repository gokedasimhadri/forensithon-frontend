import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <img
        className="footer-logo"
        src={`${import.meta.env.BASE_URL}aditya-university-logo.jpg`}
        alt="Aditya University logo"
      />
      <strong>FORENSITHON 2026</strong>
      <p>School of Sciences × Institution's Innovation Council (IIC)</p>
      <div className="footer-links">
        <Link to="/challenges">Challenge catalogue</Link>
        <Link to="/rounds">Rounds &amp; rules</Link>
        <Link to="/registration">Registration</Link>
      </div>
    </footer>
  );
}
