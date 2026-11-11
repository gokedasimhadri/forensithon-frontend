import { Link } from 'react-router-dom';

export default function HomePage() {
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
          <p className="hero-event">9-10 December 2026 · 6 students per team</p>
          <div className="case-stamp">
            CASE FILE <strong>2026</strong>
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
          <strong>9-10 December 2026</strong>
        </div>
        <div>
          <span>TEAM</span>
          <strong>6 students</strong>
        </div>
      </div>

      <section className="section home-brief">
        <p className="eyebrow">ONE EVENT. BOTH DISCIPLINES.</p>
        <h2>
          Six minds.
          <br />
          One forensic challenge.
        </h2>
        <p>
          Build practical prototypes for forensic examination, digital investigation, evidence
          management and public safety.
        </p>
        <div className="quick-grid">
          <Link to="/challenges">
            <strong>60 challenges</strong>
            <span>Explore six forensic domains.</span>
          </Link>
          <Link to="/rounds">
            <strong>3 rounds</strong>
            <span>Present online. Build offline. Demonstrate to the panel.</span>
          </Link>
          <Link to="/registration">
            <strong>6 students</strong>
            <span>Build an interdisciplinary team.</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
