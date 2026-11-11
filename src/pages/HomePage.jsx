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
        {/* Stepper Flow matching 2nd reference image */}
        <div className="stepper-flow">
          <Link to="/registration" className="step-card">
            <div className="step-icon-wrap">
              <span className="step-badge">1</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="step-info">
              <strong>Form your team</strong>
              <span>4–6 builders. The lead registers everyone at once.</span>
            </div>
          </Link>

          <div className="step-arrow" aria-hidden="true">→</div>

          <Link to="/challenges" className="step-card">
            <div className="step-icon-wrap">
              <span className="step-badge">2</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4.5c1.45-1.47 4.5-2 4.5-2" />
                <path d="M12 9V4s3.03.55 4.5 2c1.47 1.45 2 4.5 2 4.5" />
              </svg>
            </div>
            <div className="step-info">
              <strong>Submit for Level 1</strong>
              <span>Free. Send your working prototype for screening.</span>
            </div>
          </Link>

          <div className="step-arrow" aria-hidden="true">→</div>

          <Link to="/rounds" className="step-card">
            <div className="step-icon-wrap">
              <span className="step-badge">3</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
                <path d="M6 4h12a2 2 0 0 1 2 2v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z" />
              </svg>
            </div>
            <div className="step-info">
              <strong>Build at Level 2</strong>
              <span>Shortlisted? Confirm your seat and build for 48 hours.</span>
            </div>
          </Link>
        </div>

        {/* Level Cards matching 2nd reference image */}
        <div className="level-cards-grid">
          <div className="level-card level-card--light">
            <div className="level-card-header">
              <div>
                <span className="level-eyebrow">LEVEL 01</span>
                <h3 className="level-title">PROTOTYPE SCREENING</h3>
              </div>
              <span className="level-badge-free">FREE</span>
            </div>

            <ul className="level-checklist">
              <li className="level-check-item">
                <span className="check-circle check-circle--light" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#fff1eb" />
                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#ff5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Free — submit your existing working prototype, no card needed</span>
              </li>
              <li className="level-check-item">
                <span className="check-circle check-circle--light" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#fff1eb" />
                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#ff5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Teams of 4–6 (team lead + members)</span>
              </li>
              <li className="level-check-item">
                <span className="check-circle check-circle--light" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#fff1eb" />
                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#ff5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Screened on problem relevance, prototype credibility, feasibility, clarity and originality</span>
              </li>
              <li className="level-check-item">
                <span className="check-circle check-circle--light" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#fff1eb" />
                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#ff5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Ownership verification: a short viva, commit-history and similarity check</span>
              </li>
            </ul>

            <Link to="/registration" className="level-button">
              REGISTER FOR LEVEL 1 <span>→</span>
            </Link>
          </div>

          <div className="level-card level-card--dark">
            <div className="level-card-header">
              <div>
                <span className="level-eyebrow">LEVEL 02</span>
                <h3 className="level-title">ENHANCEMENT CHALLENGE</h3>
                <div className="level-badge-price">₹800 / MEMBER</div>
              </div>
            </div>

            <ul className="level-checklist">
              <li className="level-check-item">
                <span className="check-circle check-circle--dark" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#ff5500" />
                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Only shortlisted teams are invited — same registration, no second form</span>
              </li>
              <li className="level-check-item">
                <span className="check-circle check-circle--dark" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#ff5500" />
                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Pay ₹800 per member and upload the required documents</span>
              </li>
              <li className="level-check-item">
                <span className="check-circle check-circle--dark" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#ff5500" />
                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>48-hour on-site build against two mandatory enhancements + one optional stretch goal</span>
              </li>
              <li className="level-check-item">
                <span className="check-circle check-circle--dark" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#ff5500" />
                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Judged live by a technical jury at Aditya University</span>
              </li>
            </ul>

            <div className="level-footer-note">
              BY INVITATION · 18–20 DECEMBER 2026 · ADITYA UNIVERSITY
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
