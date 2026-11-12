import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchForensithonCatalog } from '../services/api';

export default function ChallengesPage({ motionOff }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const domainQuery = searchParams.get('domain');

  const [catalog, setCatalog] = useState({ domains: [], challenges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(domainQuery || '');
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' | 'compact'
  const [expandedCards, setExpandedCards] = useState(new Set());
  const resultsRef = useRef(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchForensithonCatalog();
      setCatalog({
        domains: Array.isArray(data.domains) ? data.domains : [],
        challenges: Array.isArray(data.challenges) ? data.challenges : []
      });
    } catch (err) {
      console.error('Failed to load Forensithon challenges:', err);
      setError(err.message || 'Unable to load challenges from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Resolve URL query parameter (`?domain=DF`, `?domain=1`, or `?domain=all`) once categories load
  useEffect(() => {
    if (catalog.domains.length === 0) return;

    const q = (searchParams.get('domain') || '').trim();
    if (q.toLowerCase() === 'all') {
      setSelectedDomain('all');
      return;
    }

    if (q) {
      const matched = catalog.domains.find(
        (d) =>
          String(d.code).toUpperCase() === q.toUpperCase() ||
          String(d.number) === q ||
          String(d._id) === q
      );
      if (matched) {
        setSelectedDomain(matched.code);
        return;
      }
    }

    // Default to the first category sorted by sortOrder
    setSelectedDomain(catalog.domains[0].code);
  }, [searchParams, catalog.domains]);

  const handleSelectDomain = (domainCode) => {
    const nextDomain = String(domainCode);
    setSelectedDomain(nextDomain);
    setSearchParams({ domain: nextDomain }, { replace: true });
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: motionOff ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  };

  const activeDomainObj = useMemo(() => {
    if (!selectedDomain || selectedDomain === 'all') return null;
    return (
      catalog.domains.find(
        (d) =>
          String(d.code).toUpperCase() === String(selectedDomain).toUpperCase() ||
          String(d.number) === String(selectedDomain)
      ) || null
    );
  }, [catalog.domains, selectedDomain]);

  const filteredChallenges = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.challenges.filter((c) => {
      const matchesDomain =
        selectedDomain === 'all' ||
        !selectedDomain ||
        String(c.categoryCode).toUpperCase() === String(selectedDomain).toUpperCase() ||
        String(c.domain) === String(selectedDomain);

      const subFieldsText = Array.isArray(c.subFields)
        ? c.subFields.map((sf) => `${sf.label || ''} ${sf.value || ''}`).join(' ')
        : '';

      const haystack = [
        c.id,
        c.title,
        c.categoryName,
        c.categoryCode,
        c.forensic,
        c.technical,
        c.descriptionText,
        subFieldsText
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      return matchesDomain && matchesSearch;
    });
  }, [catalog.challenges, search, selectedDomain]);

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
    if (catalog.domains.length > 0) {
      handleSelectDomain(catalog.domains[0].code);
    } else {
      handleSelectDomain('all');
    }
  };

  const totalChallenges = catalog.challenges.length;
  const totalTracks = catalog.domains.length;

  return (
    <main id="main-content">
      <div className="challenges-page-container">
        {/* Header Block */}
        <header className="challenges-header-wrap">
          <div className="challenges-header-badge">
            <span className="badge-pulse-dot" aria-hidden="true"></span>
            {loading
              ? 'LOADING OFFICIAL CHALLENGE CATALOGUE...'
              : `OFFICIAL CHALLENGE CATALOGUE · ${totalChallenges} PROBLEM STATEMENT${totalChallenges === 1 ? '' : 'S'}`}
          </div>
          <h1 className="challenges-main-title">Investigative Challenges</h1>
          <p className="challenges-main-desc">
            {totalTracks > 0 ? (
              <>
                Forensithon 2k26 features <strong>{totalChallenges}</strong> live problem statement
                {totalChallenges === 1 ? '' : 's'} across <strong>{totalTracks}</strong> specialized forensic track
                {totalTracks === 1 ? '' : 's'}. Every team selects <strong>one challenge</strong>.
              </>
            ) : (
              <>
                Explore live forensic and technical problem statements synced directly from Central Events. Every team selects <strong>one challenge</strong>.
              </>
            )}
          </p>
        </header>

        {loading ? (
          <div className="no-challenges-state" style={{ marginTop: '24px' }}>
            <div className="lookup-spinner" style={{ width: '28px', height: '28px', margin: '0 auto 12px' }} />
            <h3>Loading Central Events Tracks &amp; Challenges...</h3>
            <p>Fetching live Forensithon categories and problem statements from Unified Backend.</p>
          </div>
        ) : error ? (
          <div className="no-challenges-state" style={{ marginTop: '24px' }}>
            <div className="no-challenges-icon" aria-hidden="true">⚠️</div>
            <h3>Unable to load live challenge catalogue</h3>
            <p>{error}</p>
            <button type="button" className="button" onClick={loadCatalog}>
              Retry Connection ↻
            </button>
          </div>
        ) : catalog.domains.length === 0 ? (
          <div className="no-challenges-state" style={{ marginTop: '24px' }}>
            <div className="no-challenges-icon" aria-hidden="true">📂</div>
            <h3>No Forensithon tracks configured yet</h3>
            <p>Add Event Categories under Central Events (FORENSITHON) in the Unified Portal to display tracks here.</p>
          </div>
        ) : (
          <>
            {/* Unified Dynamic Domain / Track Navigation Hub (sorted by sortOrder) */}
            <nav className="track-nav-container" aria-label="Challenge Tracks">
              <div className="track-nav-scroll">
                {catalog.domains.map((dom) => {
                  const isActive =
                    String(selectedDomain).toUpperCase() === String(dom.code).toUpperCase();

                  return (
                    <button
                      key={dom._id || dom.code}
                      type="button"
                      className={`track-tab ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectDomain(dom.code)}
                      aria-pressed={isActive}
                    >
                      <div className="track-tab-header">
                        <span className="track-tab-code">{dom.code}</span>
                        <span className="track-tab-count">{dom.count}</span>
                      </div>
                      <strong className="track-tab-name">{dom.name}</strong>
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
                      <span className="track-num">
                        TRACK {String(activeDomainObj.number).padStart(2, '0')}
                      </span>
                      <span className="track-range">{activeDomainObj.ids}</span>
                      <span className="track-status">
                        {activeDomainObj.count} Challenge{activeDomainObj.count === 1 ? '' : 's'}
                      </span>
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
                      <span className="track-num">
                        ALL {totalTracks} TRACK{totalTracks === 1 ? '' : 'S'}
                      </span>
                      <span className="track-range">
                        {catalog.domains.map((d) => d.code).join(' · ')}
                      </span>
                      <span className="track-status">
                        {totalChallenges} Challenge{totalChallenges === 1 ? '' : 's'} Total
                      </span>
                    </div>
                  </div>
                  <h2 className="domain-context-title">Full Challenge Repository</h2>
                  <p className="domain-context-focus">
                    Showing all {totalChallenges} published problem statement{totalChallenges === 1 ? '' : 's'} across {totalTracks} forensic discipline{totalTracks === 1 ? '' : 's'}. Use the track tabs above to filter by a specific track, or search below.
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
                  placeholder="Search challenges by ID, keyword, or scope..."
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
                  <strong>{filteredChallenges.length}</strong> of {totalChallenges} statement{totalChallenges === 1 ? '' : 's'}
                </div>

                <div className="view-mode-switch" role="group" aria-label="Card view mode">
                  <button
                    type="button"
                    className={`view-mode-btn ${viewMode === 'detailed' ? 'active' : ''}`}
                    onClick={() => setViewMode('detailed')}
                    title="Detailed View: Scope details visible immediately"
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
            {search && (
              <div className="active-filters-summary">
                <span className="filters-label">Active Filters:</span>
                <span className="active-tag">
                  Keyword: "{search}"
                  <button type="button" onClick={() => setSearch('')} aria-label="Remove keyword search">×</button>
                </span>
                <button
                  type="button"
                  className="clear-all-filters-btn"
                  onClick={() => setSearch('')}
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* Challenge Cards Feed */}
            {filteredChallenges.length === 0 ? (
              <div className="no-challenges-state">
                <div className="no-challenges-icon" aria-hidden="true">🔍</div>
                <h3>
                  {search
                    ? 'No problem statements match your search'
                    : `No problem statements added under ${activeDomainObj?.name || 'this track'} yet`}
                </h3>
                <p>
                  {search
                    ? 'Try searching for a different keyword or switch to another track.'
                    : 'Any Central Event published under this category in the Unified Portal will automatically appear here.'}
                </p>
                {selectedDomain !== 'all' && totalChallenges > 0 ? (
                  <button
                    type="button"
                    className="button"
                    onClick={() => handleSelectDomain('all')}
                  >
                    View All Available Challenges ({totalChallenges})
                  </button>
                ) : search ? (
                  <button
                    type="button"
                    className="button"
                    onClick={handleClearFilters}
                  >
                    Clear Search
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="challenge-cards-feed">
                {filteredChallenges.map((c) => {
                  const isCardOpen = viewMode === 'detailed' || expandedCards.has(c.id);

                  return (
                    <article
                      key={c._id || c.id}
                      className={`challenge-feed-card ${isCardOpen ? 'is-expanded' : ''}`}
                      id={(c.slug || c.id).toLowerCase()}
                    >
                      {/* Card Header Strip */}
                      <div className="feed-card-header">
                        <div className="feed-card-tags">
                          <span className="feed-id-badge">{c.id}</span>
                          <span className="feed-domain-badge">
                            Domain {c.domain} · {c.categoryName}
                          </span>
                        </div>

                        <div className="feed-card-header-actions">
                          <Link
                            to={`/registration?challenge=${encodeURIComponent(c.id)}`}
                            className="feed-card-register-btn"
                            title={`Select ${c.id} and proceed to registration`}
                          >
                            Register with {c.id} →
                          </Link>
                        </div>
                      </div>

                      {/* Card Title */}
                      <h3 className="feed-card-title">{c.title}</h3>

                      {/* Dual Scopes / Dynamic Sub Fields / Overview */}
                      {isCardOpen ? (
                        c.hasSplitScopes ? (
                          <div className="feed-card-scopes">
                            {c.forensic && (
                              <div className="scope-box scope-box--forensic">
                                <div className="scope-box-header">
                                  <span className="scope-badge-icon" aria-hidden="true">🔬</span>
                                  <h4>FORENSIC SCIENCE SCOPE</h4>
                                </div>
                                <p className="scope-box-text">{c.forensic}</p>
                              </div>
                            )}

                            {c.technical && (
                              <div className="scope-box scope-box--tech">
                                <div className="scope-box-header">
                                  <span className="scope-badge-icon" aria-hidden="true">💻</span>
                                  <h4>TECHNICAL &amp; ENGINEERING SCOPE</h4>
                                </div>
                                <p className="scope-box-text">{c.technical}</p>
                              </div>
                            )}
                          </div>
                        ) : Array.isArray(c.subFields) && c.subFields.length > 0 ? (
                          <div className="feed-card-scopes">
                            {c.descriptionText && (
                              <div className="scope-box scope-box--forensic" style={{ gridColumn: '1 / -1' }}>
                                <div className="scope-box-header">
                                  <span className="scope-badge-icon" aria-hidden="true">📋</span>
                                  <h4>OVERVIEW</h4>
                                </div>
                                <p className="scope-box-text">{c.descriptionText}</p>
                              </div>
                            )}
                            {c.subFields.map((sf, sfIdx) => {
                              const isTechField = /(tech|eng|computer|\bcs\b|software)/i.test(sf.label || '');
                              return (
                                <div
                                  key={sfIdx}
                                  className={`scope-box ${isTechField ? 'scope-box--tech' : 'scope-box--forensic'}`}
                                >
                                  <div className="scope-box-header">
                                    <span className="scope-badge-icon" aria-hidden="true">
                                      {isTechField ? '💻' : '🔬'}
                                    </span>
                                    <h4>{(sf.label || `FIELD ${sfIdx + 1}`).toUpperCase()}</h4>
                                  </div>
                                  <p className="scope-box-text">{sf.value}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="feed-card-scopes">
                            <div className="scope-box scope-box--forensic" style={{ gridColumn: '1 / -1' }}>
                              <div className="scope-box-header">
                                <span className="scope-badge-icon" aria-hidden="true">📋</span>
                                <h4>PROBLEM STATEMENT OVERVIEW</h4>
                              </div>
                              <p className="scope-box-text">
                                {c.descriptionText || 'Detailed problem specification available upon registration.'}
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="feed-card-compact-summary">
                          <div className="compact-scope-hints">
                            {c.hasSplitScopes ? (
                              <>
                                {c.forensic && <span className="scope-pill scope-pill--forensic">Forensic Science Role</span>}
                                {c.technical && <span className="scope-pill scope-pill--tech">Technical / Engineering Role</span>}
                              </>
                            ) : Array.isArray(c.subFields) && c.subFields.length > 0 ? (
                              c.subFields.map((sf, i) => (
                                <span
                                  key={i}
                                  className={`scope-pill ${/(tech|eng|computer|\bcs\b|software)/i.test(sf.label || '') ? 'scope-pill--tech' : 'scope-pill--forensic'}`}
                                >
                                  {sf.label || `Detail ${i + 1}`}
                                </span>
                              ))
                            ) : (
                              <span className="scope-pill scope-pill--forensic">Problem Overview</span>
                            )}
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
                          <span>{c.squadLabel}</span>
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
                            to={`/registration?challenge=${encodeURIComponent(c.id)}`}
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
          </>
        )}

        {/* Official Catalogue Download Banner */}
        <section className="catalogue-download-banner">
          <div className="download-banner-info">
            <h3>Download Official Problem Statement Guide</h3>
            <p>Get the complete Forensithon 2k26 Challenge Catalogue DOCX with case files, problem descriptions, and judging rubrics.</p>
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
