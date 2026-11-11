import { useState, useMemo, useRef } from 'react';
import { eventData } from '../data/eventData';

const PAGE_SIZE = 10;

export default function ChallengesPage({ motionOff }) {
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [page, setPage] = useState(1);
  const searchInputRef = useRef(null);
  const domainSelectRef = useRef(null);
  const filtersRef = useRef(null);

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
    if (domainSelectRef.current) {
      domainSelectRef.current.focus({ preventScroll: true });
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDomainSelectChange = (e) => {
    setSelectedDomain(e.target.value);
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
        <p className="domain-hint">Select a domain. Browse ten challenges per page.</p>

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

        <div className="filters" id="challenge-filters" ref={filtersRef}>
          <label>
            Search by ID, topic or role
            <input
              id="search"
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Try DF-01, DNA or privacy"
            />
          </label>
          <label>
            Domain
            <select
              id="domain"
              ref={domainSelectRef}
              value={selectedDomain}
              onChange={handleDomainSelectChange}
            >
              <option value="all">All six domains</option>
              {eventData.domains.map((d) => (
                <option key={d.number} value={d.number}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
          <button id="clear" type="button" onClick={handleClearFilters}>
            Clear filters
          </button>
        </div>

        <p id="count" role="status" aria-live="polite">
          {filteredChallenges.length} of 60 challenges
        </p>

        <div id="results" className="results">
          {filteredChallenges.length === 0 ? (
            <p>No challenges match. Clear the search or choose another domain.</p>
          ) : (
            visibleChallenges.map((c) => (
              <details key={c.id}>
                <summary>
                  <span className="id">{c.id}</span>
                  <span>{c.title}</span>
                </summary>
                <div className="role">
                  <h4>Forensic Science role</h4>
                  <p>{c.forensic}</p>
                </div>
                <div className="role">
                  <h4>Technical / engineering role</h4>
                  <p>{c.technical}</p>
                </div>
              </details>
            ))
          )}
        </div>

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

        <div style={{ marginTop: '30px' }}>
          <p className="noscript-note">
            Download the official{' '}
            <a href={`${import.meta.env.BASE_URL}FORENSITHON-Challenge-Catalogue.docx`} download>
              FORENSITHON Challenge Catalogue (DOCX)
            </a>{' '}
            to explore all 60 problem statements.
          </p>
        </div>
      </section>
    </main>
  );
}
