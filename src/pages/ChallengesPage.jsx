import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventData } from '../data/eventData';

const PAGE_SIZE = 10;

const DOMAIN_SHORT_NAMES = {
  1: 'Digital Forensics',
  2: 'Smart CSI & Media',
  3: 'Biometrics & Docs',
  4: 'Biology & DNA',
  5: 'Chemistry & Tox',
  6: 'Forensic Intelligence'
};

export default function ChallengesPage({ motionOff }) {
  const [searchParams] = useSearchParams();
  const domainQuery = searchParams.get('domain');

  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(
    domainQuery && ['1', '2', '3', '4', '5', '6'].includes(domainQuery) ? domainQuery : 'all'
  );
  const [page, setPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const searchInputRef = useRef(null);
  const filtersRef = useRef(null);

  useEffect(() => {
    const q = searchParams.get('domain');
    if (q && ['1', '2', '3', '4', '5', '6'].includes(q)) {
      setSelectedDomain(q);
      setPage(1);
    }
  }, [searchParams]);

  const filteredChallenges = useMemo(() => {
    const q = search.trim().toLowerCase();
    return eventData.challenges.filter((c) => {
      const matchesDomain = selectedDomain === 'all' || String(c.domain) === selectedDomain;
      const haystack = [c.id, c.title, c.forensic, c.technical].join(' ').toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      return matchesDomain && matchesSearch;
    });
  }, [search, selectedDomain]);

  const totalPages = Math.max(1, Math.ceil(filteredChallenges.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const visibleChallenges = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredChallenges.slice(start, start + PAGE_SIZE);
  }, [filteredChallenges, currentPage]);

  const allVisibleOpen = useMemo(() => {
    return (
      visibleChallenges.length > 0 &&
      visibleChallenges.every((c) => expandedCards.has(c.id))
    );
  }, [visibleChallenges, expandedCards]);

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

  const toggleAllCards = () => {
    if (allVisibleOpen) {
      setExpandedCards(new Set());
    } else {
      setExpandedCards(new Set(visibleChallenges.map((c) => c.id)));
    }
  };

  const scrollToFilters = () => {
    if (filtersRef.current) {
      filtersRef.current.scrollIntoView({
        behavior: motionOff ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  };

  const handleDomainCardClick = (domainNumber) => {
    setSearch('');
    setSelectedDomain(String(domainNumber));
    setPage(1);
    scrollToFilters();
  };

  const handlePillClick = (domain) => {
    setSelectedDomain(String(domain));
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedDomain('all');
    setPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    scrollToFilters();
  };

  return (
    <main id="main-content">
      <section id="challenges" className="section">
        <p className="eyebrow">OFFICIAL CHALLENGE CATALOGUE</p>
        <h1 className="page-title">Find your problem.</h1>
        <p>
          Six domains, ten challenges each. Open a challenge to see both roles. Teams may refine
          the scope with mentors.
        </p>
        <p className="domain-hint">Select a domain or browse the challenges below.</p>

        <details className="domain-browser" open>
          <summary>Browse the six forensic domains</summary>
          <div id="domains" className="domains">
            {eventData.domains.map((d) => (
              <button
                key={d.number}
                type="button"
                className="domain-card"
                data-domain={d.number}
                aria-pressed={selectedDomain === String(d.number)}
                onClick={() => handleDomainCardClick(d.number)}
              >
                <div className="domain-badge" aria-hidden="true">
                  <img src={`${import.meta.env.BASE_URL}domain-${d.number}.svg`} alt="" />
                </div>
                <span>{d.ids}</span>
                <h3>{d.title}</h3>
              </button>
            ))}
          </div>
        </details>

        {/* Modern Catalog Control Toolbar */}
        <div className="catalog-toolbar" ref={filtersRef}>
          <div className="catalog-search-row">
            <div className="catalog-search-box">
              <span className="search-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                id="search"
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search challenges by ID, keyword, or role (e.g. DF-01, DNA, audio, triage)..."
                aria-label="Search challenges"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => { setSearch(''); setPage(1); }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="catalog-toolbar-actions">
              <button
                type="button"
                className="toggle-all-btn"
                onClick={toggleAllCards}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {allVisibleOpen ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
                {allVisibleOpen ? 'Collapse All' : 'Expand All'}
              </button>

              {(search || selectedDomain !== 'all') && (
                <button
                  type="button"
                  className="reset-filters-btn"
                  onClick={handleClearFilters}
                >
                  Reset All
                </button>
              )}
            </div>
          </div>

          {/* Quick Domain Pills */}
          <div className="domain-pills-row" role="tablist" aria-label="Filter by domain">
            <button
              type="button"
              role="tab"
              aria-selected={selectedDomain === 'all'}
              className={`domain-pill ${selectedDomain === 'all' ? 'active' : ''}`}
              onClick={() => handlePillClick('all')}
            >
              All Domains <span className="pill-count">60</span>
            </button>

            {eventData.domains.map((d) => (
              <button
                key={d.number}
                type="button"
                role="tab"
                aria-selected={selectedDomain === String(d.number)}
                className={`domain-pill ${selectedDomain === String(d.number) ? 'active' : ''}`}
                onClick={() => handlePillClick(d.number)}
              >
                <span className="pill-code">{d.ids.split(' ')[0].split('-')[0]}</span>
                <span className="pill-name">{DOMAIN_SHORT_NAMES[d.number] || d.title.split(',')[0]}</span>
                <span className="pill-count">10</span>
              </button>
            ))}
          </div>

          {/* Status Bar */}
          <div className="catalog-status-bar">
            <div className="catalog-count-info">
              <span className="count-num">{filteredChallenges.length}</span> of 60 challenges available
              {selectedDomain !== 'all' && (
                <span className="filter-pill-tag">
                  Domain {selectedDomain}: {DOMAIN_SHORT_NAMES[selectedDomain]}
                  <button type="button" onClick={() => setSelectedDomain('all')} aria-label="Clear domain filter">×</button>
                </span>
              )}
              {search && (
                <span className="filter-pill-tag">
                  Keyword: "{search}"
                  <button type="button" onClick={() => setSearch('')} aria-label="Clear keyword filter">×</button>
                </span>
              )}
            </div>

            <div className="catalog-page-label">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>

        {/* Challenges Grid in New Pattern */}
        {filteredChallenges.length === 0 ? (
          <div className="no-challenges-card">
            <div className="no-results-icon" aria-hidden="true">🔍</div>
            <h3>No matching challenges found</h3>
            <p>Try searching for a different keyword or select "All Domains" to browse all 60 problem statements.</p>
            <button type="button" className="button secondary" onClick={handleClearFilters}>
              Clear Search &amp; Filters
            </button>
          </div>
        ) : (
          <div className="challenges-grid">
            {visibleChallenges.map((c) => {
              const isOpen = expandedCards.has(c.id);
              const domainShort = DOMAIN_SHORT_NAMES[c.domain] || `Domain ${c.domain}`;

              return (
                <article
                  key={c.id}
                  className={`challenge-card ${isOpen ? 'challenge-card--expanded' : ''}`}
                >
                  <div
                    className="challenge-card-header"
                    onClick={() => toggleCard(c.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleCard(c.id);
                      }
                    }}
                  >
                    <div className="challenge-card-meta">
                      <div className="challenge-domain-tag">
                        <span className="domain-num-badge">D0{c.domain}</span>
                        <span className="domain-text">{domainShort}</span>
                      </div>
                      <div className="challenge-meta-right">
                        <span className="challenge-id-badge">{c.id}</span>
                        <span className="challenge-expand-indicator" aria-hidden="true">
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
                    </div>

                    <h3 className="challenge-card-title">{c.title}</h3>

                    {!isOpen && (
                      <div className="challenge-quick-preview">
                        <span className="preview-chip forensic-chip">
                          <span className="chip-dot" /> Forensic Science
                        </span>
                        <span className="preview-chip tech-chip">
                          <span className="chip-dot" /> Tech &amp; Engineering
                        </span>
                        <span className="preview-hint">Click to expand roles ↓</span>
                      </div>
                    )}
                  </div>

                  {isOpen && (
                    <div className="challenge-card-body">
                      <div className="role-pillars">
                        <div className="role-pillar role-pillar--forensic">
                          <div className="pillar-header">
                            <span className="pillar-icon" aria-hidden="true">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4.5 3h15" />
                                <path d="M6 3v5l-3.5 9A3 3 0 0 0 5.3 21h13.4a3 3 0 0 0 2.8-4l-3.5-9V3" />
                                <path d="M6 14h12" />
                              </svg>
                            </span>
                            <h4>FORENSIC SCIENCE ROLE</h4>
                          </div>
                          <p>{c.forensic}</p>
                        </div>

                        <div className="role-pillar role-pillar--tech">
                          <div className="pillar-header">
                            <span className="pillar-icon" aria-hidden="true">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 18 22 12 16 6" />
                                <polyline points="8 6 2 12 8 18" />
                              </svg>
                            </span>
                            <h4>TECHNICAL / ENGINEERING ROLE</h4>
                          </div>
                          <p>{c.technical}</p>
                        </div>
                      </div>

                      <div className="challenge-card-footer">
                        <span className="team-requirement-hint">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                          Team of 6: 2 Forensic + 2 Tech + 2 Open
                        </span>

                        <Link
                          to={`/registration?challenge=${c.id}`}
                          className="challenge-select-btn"
                          title={`Register with challenge ${c.id}`}
                        >
                          Register with {c.id} <span>↗</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="pagination">
          <button
            id="previous"
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            ← Previous
          </button>
          <span id="page-state" aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>
          <button
            id="next"
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next →
          </button>
        </div>

        {/* Download catalogue note */}
        <div style={{ marginTop: '30px' }}>
          <div className="catalogue-download-card">
            <div className="download-card-content">
              <h4>Download the complete problem catalogue</h4>
              <p>Get the official FORENSITHON Challenge Catalogue DOCX with all 60 statements, judging rubrics, and rules.</p>
            </div>
            <a
              href={`${import.meta.env.BASE_URL}FORENSITHON-Challenge-Catalogue.docx`}
              className="button secondary"
              download
            >
              Download DOCX <span>↓</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
