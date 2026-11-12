import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchForensithonCatalog } from '../services/api';

export default function HomePage() {
  const [catalog, setCatalog] = useState({ domains: [], challenges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchForensithonCatalog()
      .then((data) => {
        if (!active) return;
        setCatalog({
          domains: Array.isArray(data.domains) ? data.domains : [],
          challenges: Array.isArray(data.challenges) ? data.challenges : []
        });
      })
      .catch((err) => {
        console.warn('HomePage dynamic catalog notice:', err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totalTracks = catalog.domains.length;
  const totalChallenges = catalog.challenges.length;

  return (
    <main id="main-content">
      <section className="hero">
        <svg className="scan-art" aria-hidden="true" viewBox="0 0 600 600">
          <circle className="scan-ring" cx="300" cy="300" r="260" />
          <circle cx="300" cy="300" r="205" />
          <path className="scan-line" d="M80 300h440M300 80v440" />
          <path
            className="scan-draw"
            d="M210 395V285a90 90 0 0 1 180 0v95M230 395V285a70 70 0 0 1 140 0v95M250 410V285a50 50 0 0 1 100 0v95M270 425V285a30 30 0 0 1 60 0v95M290 435V285a10 10 0 0 1 20 0v95"
          />
        </svg>
        <div className="hero-copy">
          <p className="eyebrow hero-kicker">FORENSIC INNOVATION HACKATHON</p>
          <p className="hero-event">9-10 December 2k26 · 6 students per team</p>
          <div className="case-stamp">
            CASE FILE <strong>2k26</strong>
          </div>
          <h1>
            FORENSI<span>THON</span>
          </h1>
          <div className="ribbon">FORENSIC INNOVATION. REAL-TIME PROBLEM STATEMENTS.</div>
          <p className="intro">Bring the science. Build the solution.</p>
          <p className="hero-description">
            An interdisciplinary hackathon for forensic thinkers and technical builders.
          </p>
          <div className="actions">
            <Link className="button" to="/challenges">
              Find your challenge <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button secondary" to="/rounds">
              Explore the rounds ↗
            </Link>
          </div>
          <img
            width="1313"
            height="875"
            fetchPriority="high"
            className="hero-team"
            src={`${import.meta.env.BASE_URL}investigator-team.webp`}
            alt="Illustration of four student investigators with a laptop, magnifier, camera and lab tools"
          />
          <span className="illustration-label">Conceptual illustration</span>
        </div>
        <div className="evidence-mark mark-one" aria-hidden="true">✳</div>
        <div className="evidence-mark mark-two" aria-hidden="true">↗</div>
      </section>

      <div className="event-strip">
        <div>
          <span>DATES</span>
          <strong>9-10 December 2k26</strong>
        </div>
        <div>
          <span>TEAM</span>
          <strong>6 students</strong>
        </div>
      </div>

      <section className="section home-domains-section" id="summary-of-domains">
        <div className="domains-container">
          <div className="domains-heading-wrap">
            <p className="eyebrow">
              {loading
                ? 'INVESTIGATIVE TRACKS · LIVE PROBLEM STATEMENTS'
                : `${totalTracks} INVESTIGATIVE TRACK${totalTracks === 1 ? '' : 'S'} · ${totalChallenges} PROBLEM STATEMENT${totalChallenges === 1 ? '' : 'S'}`}
            </p>
            <h2 className="domains-main-heading">
              <span className="heading-accent-dot" aria-hidden="true">■</span> Summary of Domains
            </h2>
            <p className="domains-main-desc">
              Explore the specialized investigative domains of Forensithon 2k26 fetched live from Central Events. Every registered squad of six chooses one challenge statement.
            </p>
          </div>

          {/* Executive Summary Table */}
          <div className="domains-table-card">
            <div className="domains-table-wrapper">
              <table className="domains-summary-table">
                <thead>
                  <tr>
                    <th scope="col" className="col-domain">Domain</th>
                    <th scope="col" className="col-title">Domain Title</th>
                    <th scope="col" className="col-ids">Problem IDs</th>
                    <th scope="col" className="col-focus">Core Focus</th>
                    <th scope="col" className="col-action">Challenges</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading investigative tracks...
                      </td>
                    </tr>
                  ) : catalog.domains.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                        No investigative tracks configured yet in Central Events.
                      </td>
                    </tr>
                  ) : (
                    catalog.domains.map((dom) => (
                      <tr key={dom._id || dom.code} className="domain-row">
                        <td className="cell-domain">
                          <span className="domain-index-badge">{dom.number}</span>
                        </td>
                        <td className="cell-title">
                          <strong className="domain-title-text">{dom.title}</strong>
                        </td>
                        <td className="cell-ids">
                          <span className="domain-ids-pill">{dom.ids}</span>
                        </td>
                        <td className="cell-focus">
                          <p className="domain-focus-desc">{dom.focus}</p>
                        </td>
                        <td className="cell-action">
                          <Link
                            to={`/challenges?domain=${encodeURIComponent(dom.code)}`}
                            className="domain-table-link"
                            title={`View problem statements under ${dom.name}`}
                          >
                            Explore ({dom.count}) <span aria-hidden="true">→</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="domains-card-footer">
              <div className="domains-stat-box">
                <span className="domains-stat-label">OFFICIAL CHALLENGE CATALOGUE</span>
                <strong className="domains-stat-value">
                  {totalTracks} Domain{totalTracks === 1 ? '' : 's'} · {totalChallenges} Problem Statement{totalChallenges === 1 ? '' : 's'}
                </strong>
              </div>
              <Link to="/challenges" className="button small">
                View All Statements ({totalChallenges}) ↗
              </Link>
            </div>
          </div>

          {/* Mobile-Friendly Cards View (auto-displayed on narrow viewports) */}
          <div className="domains-mobile-view" aria-label="Summary of domains mobile view">
            {catalog.domains.map((dom) => (
              <div key={dom._id || dom.code} className="domain-card-item">
                <div className="domain-card-top-row">
                  <span className="domain-index-badge">Domain {dom.number} · {dom.code}</span>
                  <span className="domain-ids-pill">{dom.ids}</span>
                </div>
                <h3 className="domain-card-title">{dom.title}</h3>
                <p className="domain-card-focus-text">
                  <span className="focus-label">Core Focus: </span>
                  {dom.focus}
                </p>
                <Link
                  to={`/challenges?domain=${encodeURIComponent(dom.code)}`}
                  className="domain-card-action-btn"
                >
                  View {dom.count} Challenge{dom.count === 1 ? '' : 's'} in {dom.name} →
                </Link>
              </div>
            ))}
          </div>

          {/* Bottom Call to Action Strip */}
          <div className="domains-cta-strip">
            <div className="domains-cta-info">
              <h3>Ready to pick your challenge?</h3>
              <p>
                Form your squad of 6 Aditya University students: 2 Forensic Science/CSDF, 2 Engineering, and 2 from any department.
              </p>
            </div>
            <div className="domains-cta-links">
              <Link to="/challenges" className="button">
                Explore Live Challenges ↗
              </Link>
              <Link to="/registration" className="button secondary">
                Register as Six →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
