import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-left">
        <img
          className="footer-logo"
          src={`${import.meta.env.BASE_URL}aditya-university-logo.jpg`}
          alt="Aditya University logo"
        />
        <strong>FORENSITHON 2k26</strong>
        <p>School of Sciences × Institution's Innovation Council (IIC)</p>
        <div className="footer-links">
          <Link to="/rounds">Rounds &amp; rules</Link>
          <Link to="/challenges">Challenge catalogue</Link>
          <Link to="/registration">Registration</Link>
        </div>
      </div>
      <div className="footer-right">
        <div className="footer-credit-title">Forensithon</div>
        <div className="footer-credit-sub">Developed by IT Applications</div>
      </div>
    </footer>
  );
}
