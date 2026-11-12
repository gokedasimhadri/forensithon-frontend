import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventData } from '../data/eventData';

const DOMAIN_SHORT_NAMES = {
  1: 'Digital Forensics',
  2: 'Smart CSI & Media',
  3: 'Biometrics & Docs',
  4: 'Biology & DNA',
  5: 'Chemistry & Tox',
  6: 'Forensic Intelligence'
};

const DOMAIN_CODES = {
  1: 'DF',
  2: 'CSI',
  3: 'FID',
  4: 'BIO',
  5: 'CHEM',
  6: 'INT'
};

export default function ChallengesPage({ motionOff }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const domainQuery = searchParams.get('domain');

  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(
    domainQuery && ['1', '2', '3', '4', '5', '6'].includes(domainQuery) ? domainQuery : 'all'
  );
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' | 'compact'
  const [expandedCards, setExpandedCards] = useState(new Set());
  const resultsRef = useRef(null);

  // Sync with URL query parameter
  useEffect(() => {
    const q = searchParams.get('domain');
    if (q && ['1', '2', '3', '4', '5', '6'].includes(q)) {
      setSelectedDomain(q);
    } else if (!q) {
      setSelectedDomain('all');
    }
  }, [searchParams]);

  const handleSelectDomain = (domain) => {
    const nextDomain = String(domain);
    setSelectedDomain(nextDomain);
    if (nextDomain === 'all') {
      searchParams.delete('domain');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ domain: nextDomain }, { replace: true });
    }
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: motionOff ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  };

  const activeDomainObj = useMemo(() => {
    if (selectedDomain === 'all') return null;
    return eventData.domains.find((d) => String(d.number) === selectedDomain) || null;
  }, [selectedDomain]);

  const filteredChallenges = useMemo(() => {
    const q = search.trim().toLowerCase();
    return eventData.challenges.filter((c) => {
      const matchesDomain = selectedDomain === 'all' || String(c.domain) === selectedDomain;
      const haystack = [c.id, c.title, c.forensic, c.technical].join(' ').toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      return matchesDomain && matchesSearch;
    });
  }, [search, selectedDomain]);

  const toggleCard = (id) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    handleSelectDomain('all');
  };

  return (
    <main id="main-content">
      <div className="challenges-page-container">
        {/* Header Block */}
        <header className="challenges-header-wrap">
          <div className="challenges-header-badge">
            <span className="badge-pulse-dot" aria-hidden="true"></span>
            OFFICIAL CHALLENGE CATALOGUE · 60 PROBLEM STATEMENTS
          </div>
          <h1 className="challenges-main-title">Investigative Challenges</h1>
          <p className="challenges-main-desc">
            Forensithon 2k26 features 60 real-world case files across six specialized forensic tracks. Every team selects <strong>one challenge</strong>. Each statement defines two balanced scopes: a <strong>Forensic Science Scope</strong> and a <strong>Technical / Engineering Scope</strong>.
          </p>
        </header>

        {/* Unified Domain / Track Navigation Hub */}
        <nav className="track-nav-container" aria-label="Challenge Tracks">
          <div className="track-nav-scroll">
            <button
              type="button"
              className={`track-tab track-tab--all ${selectedDomain === 'all' ? 'active' : ''}`}
              onClick={() => handleSelectDomain('all')}
              aria-pressed={selectedDomain === 'all'}
            >
              <div className="track-tab-header">
                <span className="track-tab-code">ALL</span>
                <span className="track-tab-count">60</span>
              </div>
              <strong className="track-tab-name">All 6 Tracks</strong>
              <span className="track-tab-range">DF-01 to INT-10</span>
            </button>

            {eventData.domains.map((dom) => {
              const isActive = selectedDomain === String(dom.number);
              const code = DOMAIN_CODES[dom.number] || `D0${dom.number}`;
              const shortName = DOMAIN_SHORT_NAMES[dom.number] || dom.title.split(',')[0];

              return (
                <button
                  key={dom.number}
                  type="button"
                  className={`track-tab ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectDomain(dom.number)}
                  aria-pressed={isActive}
                >
                  <div className="track-tab-header">
                    <span className="track-tab-code">{code}</span>
                    <span className="track-tab-count">10</span>
                  </div>
                  <strong className="track-tab-name">{shortName}</strong>
                  <span className="track-tab-range">{dom.ids}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active Track Overview Banner */}
        <div className="domain-context-card" ref={resultsRef}>
          {activeDomainObj ? (
            <>
              <div className="domain-context-top">
                <div className="context-track-badge">
                  <span className="track-num">TRACK 0{activeDomainObj.number}</span>
                  <span className="track-range">{activeDomainObj.ids}</span>
                  <span className="track-status">10 Challenges</span>
                </div>
                <button
                  type="button"
                  className="context-reset-btn"
                  onClick={() => handleSelectDomain('all')}
                >
                  View All Tracks ✕
                </button>
              </div>
              <h2 className="domain-context-title">{activeDomainObj.title}</h2>
              <p className="domain-context-focus">
                <strong className="focus-label">Investigative Scope: </strong>
                {activeDomainObj.focus}
              </p>
            </>
          ) : (
            <>
              <div className="domain-context-top">
                <div className="context-track-badge">
                  <span className="track-num">ALL SIX TRACKS</span>
                  <span className="track-range">DF-01 TO INT-10</span>
                  <span className="track-status">60 Challenges Total</span>
                </div>
              </div>
              <h2 className="domain-context-title">Full Challenge Repository</h2>
              <p className="domain-context-focus">
                Showing all 60 problem statements across 6 specialized forensic disciplines. Use the track cards above to filter by a specific discipline, or search below.
              </p>
            </>
          )}
        </div>

        {/* Search & View Controls Bar */}
        <div className="challenges-toolbar">
          <div className="search-input-wrapper">
            <span className="search-icon-symbol" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search challenges by ID, keyword, or role (e.g. DF-01, DNA, audio, CCTV, memory)..."
              className="challenges-search-input"
              aria-label="Search challenges"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="toolbar-controls-group">
            <div className="results-count-chip">
              <strong>{filteredChallenges.length}</strong> of 60 statements
            </div>

            <div className="view-mode-switch" role="group" aria-label="Card view mode">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'detailed' ? 'active' : ''}`}
                onClick={() => setViewMode('detailed')}
                title="Detailed View: Both Forensic and Technical scopes visible immediately"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Detailed
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'compact' ? 'active' : ''}`}
                onClick={() => setViewMode('compact')}
                title="Compact View: Minimal card titles with expand button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Compact
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tags Summary */}
        {(search || selectedDomain !== 'all') && (
          <div className="active-filters-summary">
            <span className="filters-label">Active Filters:</span>
            {selectedDomain !== 'all' && (
              <span className="active-tag">
                Track: {DOMAIN_SHORT_NAMES[selectedDomain]} ({DOMAIN_CODES[selectedDomain]})
                <button type="button" onClick={() => handleSelectDomain('all')} aria-label="Remove track filter">×</button>
              </span>
            )}
            {search && (
              <span className="active-tag">
                Keyword: "{search}"
                <button type="button" onClick={() => setSearch('')} aria-label="Remove keyword search">×</button>
              </span>
            )}
            <button
              type="button"
              className="clear-all-filters-btn"
              onClick={handleClearFilters}
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Challenge Cards Feed */}
        {filteredChallenges.length === 0 ? (
          <div className="no-challenges-state">
            <div className="no-challenges-icon" aria-hidden="true">🔍</div>
            <h3>No problem statements match your search</h3>
            <p>Try searching for a different keyword (e.g. "fingerprint", "blockchain", "DNA", "mobile") or switch to another track.</p>
            <button
              type="button"
              className="button"
              onClick={handleClearFilters}
            >
              Show All 60 Challenges
            </button>
          </div>
        ) : (
          <div className="challenge-cards-feed">
            {filteredChallenges.map((c) => {
              const isCardOpen = viewMode === 'detailed' || expandedCards.has(c.id);
              const domainName = DOMAIN_SHORT_NAMES[c.domain] || `Domain ${c.domain}`;

              return (
                <article
                  key={c.id}
                  className={`challenge-feed-card ${isCardOpen ? 'is-expanded' : ''}`}
                  id={c.id.toLowerCase()}
                >
                  {/* Card Header Strip */}
                  <div className="feed-card-header">
                    <div className="feed-card-tags">
                      <span className="feed-id-badge">{c.id}</span>
                      <span className="feed-domain-badge">
                        Domain {c.domain} · {domainName}
                      </span>
                    </div>

                    <div className="feed-card-header-actions">
                      <Link
                        to={`/registration?challenge=${c.id}`}
                        className="feed-card-register-btn"
                        title={`Select ${c.id} and proceed to registration`}
                      >
                        Register with {c.id} →
                      </Link>
                    </div>
                  </div>

                  {/* Card Title */}
                  <h3 className="feed-card-title">{c.title}</h3>

                  {/* Dual Scopes: Forensic & Technical */}
                  {isCardOpen ? (
                    <div className="feed-card-scopes">
                      {/* Forensic Science Scope */}
                      <div className="scope-box scope-box--forensic">
                        <div className="scope-box-header">
                          <span className="scope-badge-icon" aria-hidden="true">🔬</span>
                          <h4>FORENSIC SCIENCE SCOPE</h4>
                        </div>
                        <p className="scope-box-text">{c.forensic}</p>
                      </div>

                      {/* Technical & Engineering Scope */}
                      <div className="scope-box scope-box--tech">
                        <div className="scope-box-header">
                          <span className="scope-badge-icon" aria-hidden="true">💻</span>
                          <h4>TECHNICAL &amp; ENGINEERING SCOPE</h4>
                        </div>
                        <p className="scope-box-text">{c.technical}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="feed-card-compact-summary">
                      <div className="compact-scope-hints">
                        <span className="scope-pill scope-pill--forensic">Forensic Science Role</span>
                        <span className="scope-pill scope-pill--tech">Technical / Engineering Role</span>
                      </div>
                      <button
                        type="button"
                        className="feed-compact-toggle"
                        onClick={() => toggleCard(c.id)}
                      >
                        Read Scopes ↓
                      </button>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="feed-card-footer">
                    <div className="feed-team-rule">
                      <span className="team-rule-icon" aria-hidden="true">👥</span>
                      <span>Squad of 6: 2 Forensic/CSDF + 2 Engineering + 2 Open Disciplines</span>
                    </div>

                    <div className="feed-footer-actions">
                      {viewMode === 'compact' && isCardOpen && (
                        <button
                          type="button"
                          className="feed-hide-toggle"
                          onClick={() => toggleCard(c.id)}
                        >
                          Collapse Scopes ↑
                        </button>
                      )}
                      <Link
                        to={`/registration?challenge=${c.id}`}
                        className="feed-footer-link"
                      >
                        Lock in this challenge ↗
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Official Catalogue Download Banner */}
        <section className="catalogue-download-banner">
          <div className="download-banner-info">
            <h3>Download Official Problem Statement Guide</h3>
            <p>Get the complete Forensithon 2k26 Challenge Catalogue DOCX with all 60 case files, problem descriptions, and judging rubrics.</p>
          </div>
          <a
            href={`${import.meta.env.BASE_URL}FORENSITHON-Challenge-Catalogue.docx`}
            className="button secondary"
            download
          >
            Download DOCX <span>↓</span>
          </a>
        </section>
      </div>
    </main>
  );
}
