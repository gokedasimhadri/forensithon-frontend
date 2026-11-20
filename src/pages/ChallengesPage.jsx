import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  fetchForensithonCatalog,
  getStoredTeamLeader,
  fetchTeamLeaderState,
  findPaidEventForChallenge,
  resolveImageUrl
} from '../services/api';

export default function ChallengesPage({ motionOff }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const domainQuery = searchParams.get('domain');

  const [catalog, setCatalog] = useState({ domains: [], challenges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paidEvents, setPaidEvents] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(domainQuery || '');
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' | 'compact'
  const [expandedCards, setExpandedCards] = useState(new Set());
  const resultsRef = useRef(null);

  const handleRegisterClick = (challengeId, e) => {
    if (e) e.preventDefault();
    const leader = getStoredTeamLeader();
    if (!leader) {
      sessionStorage.setItem('forensithon_target_challenge', challengeId);
      window.dispatchEvent(new CustomEvent('open-forensithon-login', {
        detail: { mode: 'login', targetChallenge: challengeId }
      }));
      return;
    }
    navigate(`/registration?challenge=${encodeURIComponent(challengeId)}`);
  };

  // Sync logged-in student's PAID Forensithon events so already-paid events are locked from re-registration
  const loadPaidEvents = useCallback(async () => {
    const student = getStoredTeamLeader();
    const roll = student?.roll ? String(student.roll).trim().toUpperCase() : '';
    if (!roll) {
      setPaidEvents([]);
      return;
    }
    try {
      const state = await fetchTeamLeaderState(roll);
      setPaidEvents(Array.isArray(state?.paidEvents) ? state.paidEvents : []);
    } catch {
      setPaidEvents([]);
    }
  }, []);

  useEffect(() => {
    loadPaidEvents();
    const onAuthChanged = () => loadPaidEvents();
    window.addEventListener('forensithon-auth-changed', onAuthChanged);
    return () => window.removeEventListener('forensithon-auth-changed', onAuthChanged);
  }, [loadPaidEvents]);

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
                {totalChallenges === 1 ? '' : 's'} across <strong>{totalTracks}</strong> specialized forensic domain
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
            <h3>Loading Central Events Domains &amp; Challenges...</h3>
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
            <h3>No Forensithon domains configured yet</h3>
            <p>Add Event Categories under Central Events (FORENSITHON) in the Unified Portal to display domains here.</p>
          </div>
        ) : (
          <>
            {/* Unified Dynamic Domain / Track Navigation Hub (sorted by sortOrder) */}
            <nav className="track-nav-container" aria-label="Challenge Domains">
              <div className="track-nav-scroll">
                {/* Master "All Tracks" Tab Card */}
                <button
                  type="button"
                  className={`track-tab track-tab--all ${selectedDomain === 'all' || !selectedDomain ? 'active' : ''}`}
                  onClick={() => handleSelectDomain('all')}
                  aria-pressed={selectedDomain === 'all' || !selectedDomain}
                >
                  <div className="track-tab-banner-wrapper track-tab-banner-wrapper--all">
                    <div className="track-tab-all-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    </div>
                    <div className="track-tab-floating-badges">
                      <span className="track-tab-code">ALL</span>
                      <span className="track-tab-count">{totalChallenges} Challenges</span>
                    </div>
                  </div>
                  <div className="track-tab-info">
                    <strong className="track-tab-name">All Domains</strong>
                    <div className="track-tab-footer">
                      <span className="track-tab-range">{totalTracks} Forensic Domains</span>
                      {(selectedDomain === 'all' || !selectedDomain) && (
                        <span className="track-tab-active-indicator">● SELECTED</span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Individual Category Track Cards with Backend Banner Image */}
                {catalog.domains.map((dom) => {
                  const isActive =
                    selectedDomain && String(selectedDomain).toUpperCase() === String(dom.code).toUpperCase();
                  const imgUrl = dom.bannerUrl || resolveImageUrl(dom.banner);

                  return (
                    <button
                      key={dom._id || dom.code}
                      type="button"
                      className={`track-tab ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectDomain(dom.code)}
                      aria-pressed={isActive}
                    >
                      <div className={`track-tab-banner-wrapper track-tab-banner-wrapper--${dom.code.toLowerCase()}`}>
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={`${dom.name} Banner`}
                            className="track-tab-banner-img"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.classList.add('is-fallback');
                            }}
                          />
                        ) : null}
                        <div className="track-tab-banner-overlay" />
                        <div className="track-tab-fallback-pattern" aria-hidden="true">
                          <span className="fallback-watermark">{dom.code}</span>
                        </div>
                        <div className="track-tab-floating-badges">
                          <span className="track-tab-code">{dom.code}</span>
                          <span className="track-tab-count">{dom.count} Challenges</span>
                        </div>
                      </div>
                      <div className="track-tab-info">
                        <strong className="track-tab-name" title={dom.name}>{dom.name}</strong>
                        <div className="track-tab-footer">
                          <span className="track-tab-range">{dom.ids}</span>
                          {isActive && (
                            <span className="track-tab-active-indicator">● ACTIVE</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Restructured Active Track Spotlight Hero Banner */}
            <div className={`domain-context-card ${activeDomainObj ? 'domain-context-card--hero' : 'domain-context-card--all'}`} ref={resultsRef}>
              {activeDomainObj ? (
                <div className="domain-hero-layout">
                  {/* Left Column: Track Banner Showcase */}
                  <div className="domain-hero-media">
                    <div className="domain-hero-poster">
                      {(activeDomainObj.bannerUrl || resolveImageUrl(activeDomainObj.banner)) ? (
                        <img
                          src={activeDomainObj.bannerUrl || resolveImageUrl(activeDomainObj.banner)}
                          alt={`${activeDomainObj.name} Official Banner`}
                          className="domain-hero-poster-img"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('is-fallback');
                          }}
                        />
                      ) : null}
                      <div className="domain-hero-poster-overlay" />
                      <div className="domain-hero-poster-fallback">
                        <span className="hero-fallback-code">{activeDomainObj.code}</span>
                      </div>
                      <div className="domain-hero-poster-badge">
                        <span className="poster-track-num">DOMAIN {String(activeDomainObj.number).padStart(2, '0')}</span>
                        <span className="poster-track-code">{activeDomainObj.code}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Track Briefing & Scopes */}
                  <div className="domain-hero-content">
                    <div className="domain-context-top">
                      <div className="context-track-badge">
                        <span className="track-num">DOMAIN {String(activeDomainObj.number).padStart(2, '0')}</span>
                        <span className="track-code-pill">{activeDomainObj.code}</span>
                        <span className="track-range">{activeDomainObj.ids}</span>
                        <span className="track-status">
                          {activeDomainObj.count} Challenge{activeDomainObj.count === 1 ? '' : 's'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="context-reset-btn"
                        onClick={() => handleSelectDomain('all')}
                        title="Show problem statements from all domains"
                      >
                        View All Domains ✕
                      </button>
                    </div>

                    <h2 className="domain-context-title">{activeDomainObj.title}</h2>

                    <div className="domain-context-scope-box">
                      <div className="scope-box-header">
                        <span className="scope-icon-dot" aria-hidden="true" />
                        <span className="scope-box-label">INVESTIGATIVE SCOPE &amp; DOMAIN SPECIFICATION</span>
                      </div>
                      <p className="domain-context-focus">
                        {activeDomainObj.focus}
                      </p>
                    </div>

                    <div className="domain-hero-chips-bar">
                      <span className="domain-meta-chip domain-meta-chip--squad">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Team of 6: 2 Forensic + 2 Engineering + 2 Open Disciplines
                      </span>
                      {activeDomainObj.coordinators && activeDomainObj.coordinators.length > 0 ? (
                        <span className="domain-meta-chip domain-meta-chip--coordinator">
                          <span className="coord-avatar-dot" aria-hidden="true">👤</span>
                          Faculty Lead: {activeDomainObj.coordinators.map(c => c.name || c.empId).filter(Boolean).join(', ')}
                        </span>
                      ) : activeDomainObj.coordinator?.name ? (
                        <span className="domain-meta-chip domain-meta-chip--coordinator">
                          <span className="coord-avatar-dot" aria-hidden="true">👤</span>
                          Faculty Lead: {activeDomainObj.coordinator.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="domain-all-layout">
                  <div className="domain-context-top">
                    <div className="context-track-badge">
                      <span className="track-num">ALL {totalTracks} DOMAINS</span>
                      <span className="track-range">
                        {catalog.domains.map((d) => d.code).join(' · ')}
                      </span>
                      <span className="track-status">
                        {totalChallenges} Challenge{totalChallenges === 1 ? '' : 's'} Total
                      </span>
                    </div>
                  </div>
                  <h2 className="domain-context-title">Full Forensic Challenge Repository</h2>
                  <p className="domain-context-focus">
                    Showing all <strong>{totalChallenges}</strong> published problem statement{totalChallenges === 1 ? '' : 's'} across <strong>{totalTracks}</strong> specialized forensic disciplines. Click on any domain card above or quick-jump below to filter by a specific discipline.
                  </p>
                  <div className="domain-quick-chips">
                    {catalog.domains.map((dom) => (
                      <button
                        key={dom.code}
                        type="button"
                        className="domain-quick-chip"
                        onClick={() => handleSelectDomain(dom.code)}
                      >
                        <span className="quick-chip-code">{dom.code}</span>
                        <span className="quick-chip-name">{dom.name}</span>
                        <span className="quick-chip-count">{dom.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
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
                    : `No problem statements added under ${activeDomainObj?.name || 'this domain'} yet`}
                </h3>
                <p>
                  {search
                    ? 'Try searching for a different keyword or switch to another domain.'
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
                  const paidRecord = findPaidEventForChallenge(c, paidEvents);
                  const isAlreadyPaid = Boolean(paidRecord);

                  return (
                    <article
                      key={c._id || c.id}
                      className={`challenge-feed-card ${isCardOpen ? 'is-expanded' : ''} ${isAlreadyPaid ? 'challenge-feed-card--paid' : ''}`}
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
                          {isAlreadyPaid ? (
                            <span
                              className="feed-card-paid-badge"
                              title={`Already registered and paid (${paidRecord.teamId || paidRecord.registrationNumber}). Re-registration is disabled for this event.`}
                            >
                              ✓ Registered · PAID
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleRegisterClick(c.id, e)}
                              className="feed-card-register-btn"
                              title={`Select ${c.id} and proceed to registration`}
                            >
                              Register with {c.id} →
                            </button>
                          )}
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
                        {c.squadLabel ? (
                          <div className="feed-team-rule">
                            <span className="team-rule-icon" aria-hidden="true">👥</span>
                            <span>{c.squadLabel}</span>
                          </div>
                        ) : (
                          <div />
                        )}

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
                          {isAlreadyPaid ? (
                            <Link
                              to="/account"
                              className="feed-footer-link feed-footer-link--paid"
                              title="View your confirmed registration and entry pass in Account"
                            >
                              Already Paid ({paidRecord.teamId || paidRecord.registrationNumber}) · View Pass ↗
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleRegisterClick(c.id, e)}
                              className="feed-footer-link"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}
                            >
                              Lock in this challenge ↗
                            </button>
                          )}
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
