import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { eventData } from '../data/eventData';

const GUIDELINE_ICONS = {
  0: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  1: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  2: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  3: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  4: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  5: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  6: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    </svg>
  ),
  7: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
};

export default function RoundsPage() {
  const [activePanel, setActivePanel] = useState('safety-panel');
  const [expandedGuidelines, setExpandedGuidelines] = useState(new Set([0, 1]));

  const panels = [
    {
      id: 'team-panel',
      label: 'Team rules',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'safety-panel',
      label: 'Evidence & safety',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    {
      id: 'score-panel',
      label: 'Scorecard',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'submission-panel',
      label: 'What to prepare',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    }
  ];

  const toggleGuideline = (idx) => {
    setExpandedGuidelines((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const allGuidelinesOpen = useMemo(() => {
    return (
      eventData.guidelines.length > 0 &&
      eventData.guidelines.every((_, idx) => expandedGuidelines.has(idx))
    );
  }, [expandedGuidelines]);

  const toggleAllGuidelines = () => {
    if (allGuidelinesOpen) {
      setExpandedGuidelines(new Set());
    } else {
      setExpandedGuidelines(new Set(eventData.guidelines.map((_, idx) => idx)));
    }
  };

  return (
    <main id="main-content">
      <section className="section rounds-page">
        <p className="eyebrow">THE PATH TO THE FINAL</p>
        <h1 className="page-title">Present. Build. Prove.</h1>
        <p>
          Three rounds. Selected teams move from an online presentation to the two-day offline event
          on 9-10 December 2k26.
        </p>

        <div className="rounds-stepper-flow">
          <article className="round-step-card">
            <div className="round-card-top">
              <span className="round-badge round-badge--orange">ROUND 01</span>
              <span className="round-mode-tag">ONLINE</span>
            </div>
            <div className="round-card-main">
              <div className="round-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="round-text">
                <h2>Presentation round</h2>
                <p>Present your idea online. Selected teams advance to the offline development event.</p>
              </div>
            </div>
          </article>

          <div className="rounds-step-arrow" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          <article className="round-step-card round-step-card--highlight">
            <div className="round-card-top">
              <span className="round-badge round-badge--blue">ROUND 02</span>
              <span className="round-mode-tag">OFFLINE</span>
            </div>
            <div className="round-card-main">
              <div className="round-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div className="round-text">
                <h2>48-hour development</h2>
                <p>Two days of intense offline development on-site at Aditya University. At the end of Day 1, teams are evaluated.</p>
              </div>
            </div>
          </article>

          <div className="rounds-step-arrow" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          <article className="round-step-card">
            <div className="round-card-top">
              <span className="round-badge round-badge--dark">ROUND 03</span>
              <span className="round-mode-tag">FINAL</span>
            </div>
            <div className="round-card-main">
              <div className="round-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="round-text">
                <h2>Demo + presentation</h2>
                <p>The remaining teams advance to the final round. Demonstrate your solution and present it to the panel. The winning team receives the reward.</p>
              </div>
            </div>
          </article>
        </div>

        <div className="rounds-notice-banner">
          <div className="notice-icon-pill">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>IMPORTANT NOTICE</span>
          </div>
          <p>
            Online presentation date, reporting time, shortlist criteria and reward details will be
            announced by the organisers.
          </p>
        </div>

        <div className="rule-tabs" role="tablist">
          {panels.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              data-panel={p.id}
              aria-selected={activePanel === p.id}
              aria-pressed={activePanel === p.id}
              onClick={() => setActivePanel(p.id)}
            >
              <span className="tab-icon" aria-hidden="true">{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Team rules */}
        <div id="team-panel" className="rule-panel" hidden={activePanel !== 'team-panel'}>
          <div className="panel-header-row">
            <div>
              <span className="panel-eyebrow">TEAM COMPOSITION RULES</span>
              <h2 className="panel-title">
                Six minds.
                <br />
                Both disciplines.
              </h2>
              <p className="panel-desc">Every team must unite forensic scientists with engineering and technical builders.</p>
            </div>
          </div>

          <div className="team-rules-container">
            <div className="team-split-grid">
              <div className="team-tier-card">
                <span className="tier-badge">2 STUDENTS</span>
                <h3>Forensic Science</h3>
                <p>B.Sc. / M.Sc. Forensic Science or CSDF students leading domain scope, evidence handling, and forensic validation.</p>
              </div>

              <div className="team-tier-card">
                <span className="tier-badge">2 STUDENTS</span>
                <h3>Tech &amp; Engineering</h3>
                <p>Computer Science, IT, AI/ML, Data Science, ECE or allied engineering branches driving software and hardware development.</p>
              </div>

              <div className="team-tier-card">
                <span className="tier-badge">2 STUDENTS</span>
                <h3>Open Discipline</h3>
                <p>From any department at Aditya University, providing interdisciplinary support, research, user experience, and pitch delivery.</p>
              </div>
            </div>

            <div className="team-summary-banner">
              <div>
                <strong>Mandatory Requirement: Exactly 6 Students per Team</strong>
                <p>All members must be currently enrolled at Aditya University. Choose one challenge statement from the official catalogue.</p>
              </div>
              <Link to="/challenges" className="button secondary">
                Choose Challenge ↗
              </Link>
            </div>
          </div>
        </div>

        {/* Tab 2: Evidence & safety */}
        <div id="safety-panel" className="rule-panel" hidden={activePanel !== 'safety-panel'}>
          <div className="panel-header-row">
            <div>
              <span className="panel-eyebrow">ETHICS &amp; EVIDENCE INTEGRITY</span>
              <h2 className="panel-title">
                Protect the evidence.
                <br />
                Respect the person.
              </h2>
              <p className="panel-desc">A prototype, simulation or proof of concept is acceptable — adhere to these 8 foundational guidelines.</p>
            </div>
            <button
              type="button"
              className="toggle-all-btn"
              onClick={toggleAllGuidelines}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {allGuidelinesOpen ? (
                  <polyline points="18 15 12 9 6 15" />
                ) : (
                  <polyline points="6 9 12 15 18 9" />
                )}
              </svg>
              {allGuidelinesOpen ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          <div className="guidelines-cards-grid">
            {eventData.guidelines.map((g, idx) => {
              const colonIndex = g.indexOf(':');
              const title = colonIndex !== -1 ? g.slice(0, colonIndex).trim() : g;
              const content = colonIndex !== -1 ? g.slice(colonIndex + 1).trim() : '';
              const isOpen = expandedGuidelines.has(idx);

              return (
                <div
                  key={idx}
                  className={`guideline-modern-card ${isOpen ? 'guideline-modern-card--open' : ''}`}
                >
                  <div
                    className="guideline-card-header"
                    onClick={() => toggleGuideline(idx)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleGuideline(idx);
                      }
                    }}
                  >
                    <div className="guideline-header-left">
                      <span className="guideline-icon-wrap" aria-hidden="true">
                        {GUIDELINE_ICONS[idx]}
                      </span>
                      <div>
                        <div className="guideline-meta">
                          <span className="guideline-num-pill">RULE 0{idx + 1}</span>
                        </div>
                        <h3 className="guideline-title">{title}</h3>
                      </div>
                    </div>

                    <span className="guideline-expand-badge" aria-hidden="true">
                      <svg
                        className={`chevron-icon ${isOpen ? 'rotated' : ''}`}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>

                  {isOpen && (
                    <div className="guideline-card-body">
                      <div className="guideline-content-box">
                        <p>{content}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab 3: Scorecard */}
        <div id="score-panel" className="rule-panel" hidden={activePanel !== 'score-panel'}>
          <div className="panel-header-row">
            <div>
              <span className="panel-eyebrow">EVALUATION RUBRIC</span>
              <h2 className="panel-title">How projects are assessed.</h2>
              <p className="panel-desc">Scoring criteria across 7 categories totaling 100%.</p>
            </div>
            <div className="rubric-total-badge">
              <span className="rubric-total-label">TOTAL WEIGHT</span>
              <span className="rubric-total-val">100%</span>
            </div>
          </div>

          <div id="rubric" className="rubric">
            {eventData.rubric.map((r, idx) => (
              <article key={idx} className="criterion">
                <div className="criterion-header">
                  <h3 className="criterion-title">{r.title}</h3>
                  <span className="criterion-weight">{r.weight}</span>
                </div>
                <div className="criterion-progress-track" aria-hidden="true">
                  <div
                    className="criterion-progress-fill"
                    style={{ width: r.weight }}
                  />
                </div>
                <p className="criterion-focus">{r.focus}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Tab 4: What to prepare */}
        <div id="submission-panel" className="rule-panel" hidden={activePanel !== 'submission-panel'}>
          <div className="panel-header-row">
            <div>
              <span className="panel-eyebrow">FINAL SUBMISSION PACKAGE</span>
              <h2 className="panel-title">What to prepare.</h2>
              <p className="panel-desc">The 8 deliverables your team must assemble for evaluation.</p>
            </div>
          </div>

          <div className="submissions-modern-grid">
            {eventData.submissions.map((s, idx) => (
              <div key={idx} className="submission-step-card">
                <span className="submission-num-pill">0{idx + 1}</span>
                <p>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
