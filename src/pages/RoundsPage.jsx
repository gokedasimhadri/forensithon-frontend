import { useState } from 'react';
import { eventData } from '../data/eventData';

export default function RoundsPage() {
  const [activePanel, setActivePanel] = useState('team-panel');

  const panels = [
    { id: 'team-panel', label: 'Team rules' },
    { id: 'safety-panel', label: 'Evidence & safety' },
    { id: 'score-panel', label: 'Scorecard' },
    { id: 'submission-panel', label: 'What to prepare' }
  ];

  return (
    <main id="main-content">
      <section className="section rounds-page">
        <p className="eyebrow">THE PATH TO THE FINAL</p>
        <h1 className="page-title">Present. Build. Prove.</h1>
        <p>
          Three rounds. Selected teams move from an online presentation to the two-day offline event
          on 9-10 December 2026.
        </p>

        <div className="round-grid">
          <article>
            <span>01 / ONLINE</span>
            <h2>Presentation round</h2>
            <p>Present your idea online. Selected teams advance to the offline development event.</p>
          </article>
          <article>
            <span>02 / OFFLINE</span>
            <h2>48-hour development</h2>
            <p>
              Selected teams come for two days offline, where the 48-hour development stage starts. At
              the end of Day 1, some teams are eliminated.
            </p>
          </article>
          <article>
            <span>03 / FINAL</span>
            <h2>Demo + presentation</h2>
            <p>
              The remaining teams advance to the final round. Demonstrate your solution and present it
              to the panel. The winning team receives the reward.
            </p>
          </article>
        </div>

        <p className="note">
          Online presentation date, reporting time, shortlist criteria and reward details will be
          announced by the organisers.
        </p>

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
              {p.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Team rules */}
        <div id="team-panel" className="rule-panel" hidden={activePanel !== 'team-panel'}>
          <section id="team" className="team section">
            <div className="section-number" aria-hidden="true">
              02 / THE TEAM
            </div>
            <div>
              <p className="eyebrow">BUILD AN INTERDISCIPLINARY TEAM</p>
              <h2>
                Six people.
                <br />
                Both disciplines.
              </h2>
            </div>
            <div>
              <ul>
                <li>
                  <strong>Exactly 6 students</strong> in each team, all from Aditya University.
                </li>
                <li>
                  <strong>2</strong> B.Sc. / M.Sc. Forensic Science or CSDF students.
                </li>
                <li>
                  <strong>2</strong> students from Computer Science, IT, AI/ML, Data Science, ECE or
                  another allied branch.
                </li>
                <li>The remaining 2 may come from any department.</li>
              </ul>
              <p>
                Every project needs a forensic-science contribution and a meaningful technical
                implementation. Select one problem statement.
              </p>
            </div>
          </section>
        </div>

        {/* Tab 2: Evidence & safety */}
        <div id="safety-panel" className="rule-panel" hidden={activePanel !== 'safety-panel'}>
          <h2>
            Protect the evidence.
            <br />
            Respect the person.
          </h2>
          <p>A prototype, simulation or proof of concept is acceptable.</p>
          <div id="guideline-list">
            {eventData.guidelines.map((g, idx) => {
              const colonIndex = g.indexOf(':');
              const title = colonIndex !== -1 ? g.slice(0, colonIndex) : g;
              const content = colonIndex !== -1 ? g.slice(colonIndex + 1).trim() : '';
              return (
                <details key={idx}>
                  <summary>{title}</summary>
                  <p>{content}</p>
                </details>
              );
            })}
          </div>
        </div>

        {/* Tab 3: Scorecard */}
        <div id="score-panel" className="rule-panel" hidden={activePanel !== 'score-panel'}>
          <h2>How projects are assessed.</h2>
          <div id="rubric" className="rubric">
            {eventData.rubric.map((r, idx) => (
              <article key={idx} className="criterion">
                <strong>{r.weight}</strong>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.focus}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Tab 4: What to prepare */}
        <div id="submission-panel" className="rule-panel" hidden={activePanel !== 'submission-panel'}>
          <h2>Your submission package.</h2>
          <ol id="submission-list">
            {eventData.submissions.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
