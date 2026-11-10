import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main id="main-content">
      <section className="section" style={{ textAlign: 'center', padding: '80px 5%' }}>
        <p className="eyebrow">404 ERROR</p>
        <h1 className="page-title">Page not found</h1>
        <p>The forensic evidence you are looking for does not exist on this path.</p>
        <div style={{ marginTop: '30px' }}>
          <Link className="button" to="/">
            Return to FORENSITHON Home ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
