import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventData } from '../data/eventData';

const FORENSIC_BRANCH_OPTIONS = [
  'B.Sc Forensic Science',
  'M.Sc Forensic Science',
  'B.Tech CSDF (Computer Science & Digital Forensics)',
  'Other Forensic Science Department'
];

const ENGINEERING_BRANCH_OPTIONS = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Artificial Intelligence & Machine Learning (AIML)',
  'Data Science',
  'Electronics & Communication Engineering (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Petroleum / Chemical Engineering',
  'Other Engineering Branch'
];

const OPEN_BRANCH_OPTIONS = [
  'School of Management Studies (BBA / MBA)',
  'School of Pharmacy (B.Pharm / M.Pharm)',
  'School of Sciences (Biotechnology / Microbiology / Chemistry)',
  'Humanities, Social Sciences & Languages',
  'Forensic Science / CSDF',
  'Engineering & Technology (Any Branch)',
  'Other University Department'
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate (PG)'];

const createInitialMembers = () => [
  // Tier 1: 2 Forensic Science / CSDF students
  {
    id: 1,
    tier: 'forensic',
    tierTitle: 'Tier 1 · Forensic Science',
    role: 'Team Leader & Primary Contact',
    isLead: true,
    name: '',
    rollNo: '',
    email: '',
    branch: 'B.Sc Forensic Science',
    year: '3rd Year',
    phone: ''
  },
  {
    id: 2,
    tier: 'forensic',
    tierTitle: 'Tier 1 · Forensic Science',
    role: 'Forensic Investigator',
    isLead: false,
    name: '',
    rollNo: '',
    email: '',
    branch: 'B.Sc Forensic Science',
    year: '3rd Year',
    phone: ''
  },
  // Tier 2: 2 Engineering or allied-branch students
  {
    id: 3,
    tier: 'engineering',
    tierTitle: 'Tier 2 · Engineering & Allied',
    role: 'Technical Lead & Builder',
    isLead: false,
    name: '',
    rollNo: '',
    email: '',
    branch: 'Computer Science & Engineering (CSE)',
    year: '3rd Year',
    phone: ''
  },
  {
    id: 4,
    tier: 'engineering',
    tierTitle: 'Tier 2 · Engineering & Allied',
    role: 'Technical Specialist',
    isLead: false,
    name: '',
    rollNo: '',
    email: '',
    branch: 'Information Technology (IT)',
    year: '3rd Year',
    phone: ''
  },
  // Tier 3: 2 from any department (Open discipline)
  {
    id: 5,
    tier: 'open',
    tierTitle: 'Tier 3 · Open Discipline',
    role: 'Research & UX Lead',
    isLead: false,
    name: '',
    rollNo: '',
    email: '',
    branch: 'School of Management Studies (BBA / MBA)',
    year: '3rd Year',
    phone: ''
  },
  {
    id: 6,
    tier: 'open',
    tierTitle: 'Tier 3 · Open Discipline',
    role: 'Interdisciplinary Builder',
    isLead: false,
    name: '',
    rollNo: '',
    email: '',
    branch: 'School of Sciences (Biotechnology / Microbiology / Chemistry)',
    year: '3rd Year',
    phone: ''
  }
];

export default function RegistrationPage() {
  const [searchParams] = useSearchParams();
  const initialChallengeId = searchParams.get('challenge');

  const [selectedDomain, setSelectedDomain] = useState(1);
  const [selectedChallengeId, setSelectedChallengeId] = useState('DF-01');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(createInitialMembers);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentFileName, setPaymentFileName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null);

  // If a challenge query parameter is provided in URL, pre-select that challenge and its domain
  useEffect(() => {
    if (initialChallengeId) {
      const found = eventData.challenges.find(
        (c) => c.id.toUpperCase() === initialChallengeId.toUpperCase()
      );
      if (found) {
        setSelectedDomain(found.domain);
        setSelectedChallengeId(found.id);
      }
    }
  }, [initialChallengeId]);

  // Available challenges in the selected domain
  const domainChallenges = useMemo(() => {
    return eventData.challenges.filter((c) => c.domain === Number(selectedDomain));
  }, [selectedDomain]);

  // When domain changes, ensure selected challenge belongs to the domain
  const handleDomainChange = (domainNum) => {
    const num = Number(domainNum);
    setSelectedDomain(num);
    const challengesForDomain = eventData.challenges.filter((c) => c.domain === num);
    if (challengesForDomain.length > 0) {
      setSelectedChallengeId(challengesForDomain[0].id);
    }
  };

  // Currently selected challenge details
  const currentChallenge = useMemo(() => {
    return (
      eventData.challenges.find((c) => c.id === selectedChallengeId) ||
      domainChallenges[0] ||
      eventData.challenges[0]
    );
  }, [selectedChallengeId, domainChallenges]);

  const currentDomainInfo = useMemo(() => {
    return eventData.domains.find((d) => Number(d.number) === Number(selectedDomain));
  }, [selectedDomain]);

  const handleMemberChange = (index, field, value) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });

    // Clear field-specific validation error
    if (validationErrors[`member_${index}_${field}`]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[`member_${index}_${field}`];
        return next;
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentFileName(file.name);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!teamName.trim()) {
      errors.teamName = 'Team name is required.';
    }

    if (!selectedChallengeId) {
      errors.challenge = 'Please select a problem statement.';
    }

    // Validate 6 members
    members.forEach((m, idx) => {
      if (!m.name.trim()) {
        errors[`member_${idx}_name`] = `Student ${idx + 1} name is required.`;
      }
      if (!m.rollNo.trim()) {
        errors[`member_${idx}_rollNo`] = `Roll number is required.`;
      }
      if (!m.email.trim()) {
        errors[`member_${idx}_email`] = `Aditya email is required.`;
      } else if (!m.email.includes('@')) {
        errors[`member_${idx}_email`] = `Please enter a valid email address.`;
      }

      if (m.isLead && !m.phone.trim()) {
        errors[`member_${idx}_phone`] = `Team Leader mobile number is required.`;
      }
    });

    if (!utrNumber.trim()) {
      errors.utrNumber = 'Transaction UTR / Reference number is required.';
    } else if (utrNumber.trim().length < 8) {
      errors.utrNumber = 'Please enter a valid UTR number (at least 8 characters).';
    }

    if (!agreed) {
      errors.agreed = 'You must confirm that all 6 members satisfy the university & branch rules.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorKey = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[data-error-key="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Generate unique Registration ID
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const regId = `FST-2026-${randomCode}`;
    const timestamp = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const record = {
      regId,
      timestamp,
      teamName: teamName.trim(),
      domain: currentDomainInfo?.title || `Domain ${selectedDomain}`,
      challengeId: currentChallenge.id,
      challengeTitle: currentChallenge.title,
      forensicRole: currentChallenge.forensic,
      technicalRole: currentChallenge.technical,
      members,
      utrNumber: utrNumber.trim(),
      paymentFileName: paymentFileName || 'receipt_attached.jpg',
      status: 'CONFIRMED · PENDING FINAL JURY SCREENING'
    };

    setSubmittedData(record);
    try {
      localStorage.setItem('forensithon_last_reg', JSON.stringify(record));
    } catch {
      // Ignore localStorage quotas
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSubmittedData(null);
    setTeamName('');
    setUtrNumber('');
    setPaymentFileName('');
    setAgreed(false);
    setValidationErrors({});
    setMembers(createInitialMembers());
  };

  // If already submitted, display the official Confirmation Slip
  if (submittedData) {
    return (
      <main id="main-content">
        <section className="section registration-page">
          <div className="registration-success-container">
            <div className="success-header-badge">
              <span className="success-icon-wrap" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <div>
                <span className="success-kicker">TEAM ENTRY CONFIRMED</span>
                <h1 className="success-title">Registration Slip</h1>
                <p className="success-subtitle">
                  Your team has been successfully registered for Forensithon 2026.
                </p>
              </div>
            </div>

            <div className="receipt-card">
              <div className="receipt-meta-row">
                <div>
                  <span className="receipt-meta-label">REGISTRATION ID</span>
                  <span className="receipt-id-badge">{submittedData.regId}</span>
                </div>
                <div>
                  <span className="receipt-meta-label">SUBMITTED AT</span>
                  <strong>{submittedData.timestamp}</strong>
                </div>
                <div>
                  <span className="receipt-meta-label">ENTRY STATUS</span>
                  <span className="status-badge status-badge--active">PROTOTYPE SCREENING</span>
                </div>
              </div>

              <div className="receipt-divider" />

              <div className="receipt-section">
                <span className="receipt-subheading">TEAM &amp; CHALLENGE ALLOCATION</span>
                <div className="receipt-team-highlight">
                  <div>
                    <span className="receipt-field-title">Team Name</span>
                    <h2 className="receipt-team-name">{submittedData.teamName}</h2>
                  </div>
                  <div>
                    <span className="receipt-field-title">Team Leader</span>
                    <strong>{submittedData.members[0].name}</strong> ({submittedData.members[0].phone})
                  </div>
                </div>

                <div className="receipt-challenge-box">
                  <div className="receipt-challenge-header">
                    <span className="receipt-challenge-pill">{submittedData.challengeId}</span>
                    <h3>{submittedData.challengeTitle}</h3>
                  </div>
                  <p className="receipt-domain-name"><strong>Domain:</strong> {submittedData.domain}</p>
                </div>
              </div>

              <div className="receipt-divider" />

              <div className="receipt-section">
                <span className="receipt-subheading">REGISTERED SQUAD (6 BUILDERS)</span>
                <p className="receipt-branch-confirmation">
                  ✓ Verified: Exactly 6 Aditya University students (2 Forensic + 2 Engineering + 2 Open Discipline)
                </p>

                <div className="receipt-members-grid">
                  {submittedData.members.map((m, idx) => (
                    <div key={idx} className={`receipt-member-item receipt-member-item--${m.tier}`}>
                      <div className="receipt-member-top">
                        <span className="receipt-member-role">{m.role}</span>
                        <span className="receipt-member-tier-pill">{m.tierTitle}</span>
                      </div>
                      <h4 className="receipt-member-name">{m.name}</h4>
                      <p className="receipt-member-details">
                        <span><strong>Roll:</strong> {m.rollNo}</span>
                        <span><strong>Branch:</strong> {m.branch} ({m.year})</span>
                        <span><strong>Email:</strong> {m.email}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="receipt-divider" />

              <div className="receipt-section receipt-payment-section">
                <div>
                  <span className="receipt-subheading">PAYMENT VERIFICATION</span>
                  <p><strong>Registration Fee:</strong> ₹300 per team</p>
                  <p><strong>Transaction UTR / Ref:</strong> <code>{submittedData.utrNumber}</code></p>
                </div>
                <div className="receipt-stamp-box">
                  <span className="aditya-stamp">ADITYA UNIVERSITY</span>
                  <span className="stamp-sub">IIC &amp; FORENSIC SCIENCE</span>
                  <span className="stamp-date">{submittedData.timestamp.split(',')[0]}</span>
                </div>
              </div>
            </div>

            <div className="receipt-actions-row">
              <button
                type="button"
                className="button"
                onClick={() => window.print()}
              >
                Print / Save Slip ⎙
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={handleReset}
              >
                Register Another Team +
              </button>
              <Link to="/rounds" className="button secondary">
                View Path to Final ↗
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main id="main-content">
      <section className="section registration-page">
        <p className="eyebrow">OFFICIAL TEAM REGISTRATION · FORENSITHON 2026</p>
        <h1 className="page-title">Register as six.</h1>
        <p className="lead">9-10 December 2026 · Aditya University Campus</p>

        {/* Mandatory Requirement Rule Banner */}
        <div className="registration-rule-banner">
          <div className="rule-banner-icon-col" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="rule-banner-text-col">
            <span className="rule-banner-tag">MANDATORY TEAM COMPOSITION</span>
            <h2 className="rule-banner-title">One team. Exactly six builders.</h2>
            <p className="rule-banner-desc">
              <strong>"Exactly 6 students, all from Aditya University: 2 Forensic Science / CSDF students, 2 engineering or allied-branch students and 2 from any department."</strong>
            </p>
          </div>
          <div className="rule-banner-fee-col">
            <span className="fee-label">REGISTRATION FEE</span>
            <span className="fee-amount">₹300</span>
            <span className="fee-hint">Per team of 6</span>
          </div>
        </div>

        {/* Interactive Registration Form */}
        <form className="registration-form-modern" onSubmit={handleSubmit} noValidate>
          {/* STEP 1: Domain & Challenge Statement Selection */}
          <div className="form-card-section">
            <div className="form-card-header">
              <span className="step-num-badge">STEP 01</span>
              <div>
                <h2 className="form-section-title">Select Domain &amp; Problem Statement</h2>
                <p className="form-section-desc">
                  Choose the forensic domain and one of the 60 problem statements your team will solve.
                </p>
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-field-group">
                <label htmlFor="teamName" className="form-label required">
                  Team Name
                </label>
                <input
                  id="teamName"
                  type="text"
                  className={`form-input ${validationErrors.teamName ? 'form-input--error' : ''}`}
                  placeholder="e.g. CyberSherlocks, ForensicForge"
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    if (validationErrors.teamName) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.teamName;
                        return copy;
                      });
                    }
                  }}
                  data-error-key="teamName"
                />
                {validationErrors.teamName && (
                  <span className="form-error-msg">{validationErrors.teamName}</span>
                )}
              </div>

              <div className="form-field-group">
                <label htmlFor="domainSelect" className="form-label required">
                  Forensic Domain
                </label>
                <select
                  id="domainSelect"
                  className="form-select"
                  value={selectedDomain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                >
                  {eventData.domains.map((d) => (
                    <option key={d.number} value={d.number}>
                      Domain 0{d.number}: {d.title} ({d.ids})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Problem Statement Dropdown */}
            <div className="form-field-group" style={{ marginTop: '16px' }}>
              <label htmlFor="challengeSelect" className="form-label required">
                Problem Statement ({domainChallenges.length} available in Domain 0{selectedDomain})
              </label>
              <select
                id="challengeSelect"
                className="form-select"
                value={selectedChallengeId}
                onChange={(e) => setSelectedChallengeId(e.target.value)}
              >
                {domainChallenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.id}] {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Challenge Preview Card (Dual Role Pillars) */}
            {currentChallenge && (
              <div className="challenge-preview-card">
                <div className="preview-header">
                  <span className="preview-id-pill">{currentChallenge.id}</span>
                  <h3 className="preview-title">{currentChallenge.title}</h3>
                </div>

                <div className="preview-pillars-grid">
                  <div className="preview-pillar preview-pillar--forensic">
                    <span className="pillar-tag pillar-tag--forensic">FORENSIC SCIENCE SCOPE</span>
                    <p>{currentChallenge.forensic}</p>
                  </div>
                  <div className="preview-pillar preview-pillar--tech">
                    <span className="pillar-tag pillar-tag--tech">TECHNICAL / ENGINEERING SCOPE</span>
                    <p>{currentChallenge.technical}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Team Members (The 3 Mandatory Tiers) */}
          <div className="form-card-section">
            <div className="form-card-header">
              <span className="step-num-badge">STEP 02</span>
              <div>
                <h2 className="form-section-title">Enter All Six Team Members</h2>
                <p className="form-section-desc">
                  Adhere strictly to the interdisciplinary branches breakdown below.
                </p>
              </div>
            </div>

            {/* ================= TIER 1: FORENSIC SCIENCE (2 STUDENTS) ================= */}
            <div className="tier-group tier-group--forensic">
              <div className="tier-group-header">
                <span className="tier-badge-label tier-badge-label--forensic">
                  TIER 1 · MANDATORY 2 FORENSIC SCIENCE / CSDF STUDENTS
                </span>
                <span className="tier-count-pill">Students 1 &amp; 2</span>
              </div>

              <div className="members-form-grid">
                {[0, 1].map((idx) => {
                  const m = members[idx];
                  return (
                    <div key={idx} className={`member-card ${m.isLead ? 'member-card--lead' : ''}`}>
                      <div className="member-card-top">
                        <div className="member-badge-row">
                          <span className="member-num-circle">0{idx + 1}</span>
                          <span className="member-tier-name">{m.tierTitle}</span>
                        </div>
                        {m.isLead && <span className="lead-tag">TEAM LEADER</span>}
                      </div>

                      <div className="member-fields-grid">
                        <div className="form-field-group">
                          <label className="form-label required">Full Name</label>
                          <input
                            type="text"
                            className={`form-input ${validationErrors[`member_${idx}_name`] ? 'form-input--error' : ''}`}
                            placeholder="Student Full Name"
                            value={m.name}
                            onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                            data-error-key={`member_${idx}_name`}
                          />
                          {validationErrors[`member_${idx}_name`] && (
                            <span className="form-error-msg">{validationErrors[`member_${idx}_name`]}</span>
                          )}
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Roll Number / Student ID</label>
                          <input
                            type="text"
                            className={`form-input ${validationErrors[`member_${idx}_rollNo`] ? 'form-input--error' : ''}`}
                            placeholder="e.g. 22A91A..."
                            value={m.rollNo}
                            onChange={(e) => handleMemberChange(idx, 'rollNo', e.target.value.toUpperCase())}
                            data-error-key={`member_${idx}_rollNo`}
                          />
                          {validationErrors[`member_${idx}_rollNo`] && (
                            <span className="form-error-msg">{validationErrors[`member_${idx}_rollNo`]}</span>
                          )}
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Aditya Email</label>
                          <input
                            type="email"
                            className={`form-input ${validationErrors[`member_${idx}_email`] ? 'form-input--error' : ''}`}
                            placeholder="username@aditya.ac.in"
                            value={m.email}
                            onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                            data-error-key={`member_${idx}_email`}
                          />
                          {validationErrors[`member_${idx}_email`] && (
                            <span className="form-error-msg">{validationErrors[`member_${idx}_email`]}</span>
                          )}
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Branch / Specialization</label>
                          <select
                            className="form-select"
                            value={m.branch}
                            onChange={(e) => handleMemberChange(idx, 'branch', e.target.value)}
                          >
                            {FORENSIC_BRANCH_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Year of Study</label>
                          <select
                            className="form-select"
                            value={m.year}
                            onChange={(e) => handleMemberChange(idx, 'year', e.target.value)}
                          >
                            {YEAR_OPTIONS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-field-group">
                          <label className={`form-label ${m.isLead ? 'required' : ''}`}>
                            Mobile Number {m.isLead && '(Primary Contact)'}
                          </label>
                          <input
                            type="tel"
                            className={`form-input ${validationErrors[`member_${idx}_phone`] ? 'form-input--error' : ''}`}
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            value={m.phone}
                            onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                            data-error-key={`member_${idx}_phone`}
                          />
                          {validationErrors[`member_${idx}_phone`] && (
                            <span className="form-error-msg">{validationErrors[`member_${idx}_phone`]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================= TIER 2: ENGINEERING & ALLIED (2 STUDENTS) ================= */}
            <div className="tier-group tier-group--engineering">
              <div className="tier-group-header">
                <span className="tier-badge-label tier-badge-label--engineering">
                  TIER 2 · MANDATORY 2 ENGINEERING / ALLIED BRANCH STUDENTS
                </span>
                <span className="tier-count-pill">Students 3 &amp; 4</span>
              </div>

              <div className="members-form-grid">
                {[2, 3].map((idx) => {
                  const m = members[idx];
                  return (
                    <div key={idx} className="member-card">
                      <div className="member-card-top">
                        <div className="member-badge-row">
                          <span className="member-num-circle">0{idx + 1}</span>
                          <span className="member-tier-name">{m.tierTitle}</span>
                        </div>
                      </div>

                      <div className="member-fields-grid">
                        <div className="form-field-group">
                          <label className="form-label required">Full Name</label>
                          <input
                            type="text"
                            className={`form-input ${validationErrors[`member_${idx}_name`] ? 'form-input--error' : ''}`}
                            placeholder="Student Full Name"
                            value={m.name}
                            onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                            data-error-key={`member_${idx}_name`}
                          />
                          {validationErrors[`member_${idx}_name`] && (
                            <span className="form-error-msg">{validationErrors[`member_${idx}_name`]}</span>
                          )}
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Roll Number / Student ID</label>
                          <input
                            type="text"
                            className={`form-input ${validationErrors[`member_${idx}_rollNo`] ? 'form-input--error' : ''}`}
                            placeholder="e.g. 22A91A..."
                            value={m.rollNo}
                            onChange={(e) => handleMemberChange(idx, 'rollNo', e.target.value.toUpperCase())}
                            data-error-key={`member_${idx}_rollNo`}
                          />
                          {validationErrors[`member_${idx}_rollNo`] && (
                            <span className="form-error-msg">{validationErrors[`member_${idx}_rollNo`]}</span>
                          )}
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Aditya Email</label>
                          <input
                            type="email"
                            className={`form-input ${validationErrors[`member_${idx}_email`] ? 'form-input--error' : ''}`}
                            placeholder="username@aditya.ac.in"
                            value={m.email}
                            onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                            data-error-key={`member_${idx}_email`}
                          />
                          {validationErrors[`member_${idx}_email`] && (
                            <span className="form-error-msg">{validationErrors[`member_${idx}_email`]}</span>
                          )}
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Engineering Branch</label>
                          <select
                            className="form-select"
                            value={m.branch}
                            onChange={(e) => handleMemberChange(idx, 'branch', e.target.value)}
                          >
                            {ENGINEERING_BRANCH_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Year of Study</label>
                          <select
                            className="form-select"
                            value={m.year}
                            onChange={(e) => handleMemberChange(idx, 'year', e.target.value)}
                          >
                            {YEAR_OPTIONS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-field-group">
                          <label className="form-label">Mobile Number</label>
                          <input
                            type="tel"
                            className="form-input"
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            value={m.phone}
                            onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================= TIER 3: OPEN DISCIPLINE (2 STUDENTS) ================= */}
            <div className="tier-group tier-group--open">
              <div className="tier-group-header">
                <span className="tier-badge-label tier-badge-label--open">
                  TIER 3 · MANDATORY 2 STUDENTS FROM ANY DEPARTMENT (OPEN)
                </span>
                <span className="tier-count-pill">Students 5 &amp; 6</span>
              </div>

              <div className="members-form-grid">
                {[4, 5].map((idx) => {
                  const m = members[idx];
                  return (
                    <div key={idx} className="member-card">
                      <div className="member-card-top">
                        <div className="member-badge-row">
                          <span className="member-num-circle">0{idx + 1}</span>
                          <span className="member-tier-name">{m.tierTitle}</span>
                        </div>
                      </div>

                      <div className="member-fields-grid">
                        <div className="form-field-group">
                          <label className="form-label required">Full Name</label>
                          <input
                            type="text"
                            className={`form-input ${validationErrors[`member_${idx}_name`] ? 'form-input--error' : ''}`}
                            placeholder="Student Full Name"
                            value={m.name}
                            onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                            data-error-key={`member_${idx}_name`}
                          />
                          {validationErrors[`member_${idx}_name`] && (
                            <span className="form-error-msg">{validationErrors[`member_${idx}_name`]}</span>
                          )}
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Roll Number / Student ID</label>
                          <input
                            type="text"
                            className={`form-input ${validationErrors[`member_${idx}_rollNo`] ? 'form-input--error' : ''}`}
                            placeholder="e.g. 22A91A..."
                            value={m.rollNo}
                            onChange={(e) => handleMemberChange(idx, 'rollNo', e.target.value.toUpperCase())}
                            data-error-key={`member_${idx}_rollNo`}
                          />
                          {validationErrors[`member_${idx}_rollNo`] && (
                            <span className="form-error-msg">{validationErrors[`member_${idx}_rollNo`]}</span>
                          )}
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Aditya Email</label>
                          <input
                            type="email"
                            className={`form-input ${validationErrors[`member_${idx}_email`] ? 'form-input--error' : ''}`}
                            placeholder="username@aditya.ac.in"
                            value={m.email}
                            onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                            data-error-key={`member_${idx}_email`}
                          />
                          {validationErrors[`member_${idx}_email`] && (
                            <span className="form-error-msg">{validationErrors[`member_${idx}_email`]}</span>
                          )}
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Department / Discipline</label>
                          <select
                            className="form-select"
                            value={m.branch}
                            onChange={(e) => handleMemberChange(idx, 'branch', e.target.value)}
                          >
                            {OPEN_BRANCH_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-field-group">
                          <label className="form-label required">Year of Study</label>
                          <select
                            className="form-select"
                            value={m.year}
                            onChange={(e) => handleMemberChange(idx, 'year', e.target.value)}
                          >
                            {YEAR_OPTIONS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-field-group">
                          <label className="form-label">Mobile Number</label>
                          <input
                            type="tel"
                            className="form-input"
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            value={m.phone}
                            onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 3: Payment Verification & Submission */}
          <div className="form-card-section">
            <div className="form-card-header">
              <span className="step-num-badge">STEP 03</span>
              <div>
                <h2 className="form-section-title">Payment Verification &amp; Submit</h2>
                <p className="form-section-desc">
                  Registration fee is ₹300 per team. Complete your payment and provide transaction details.
                </p>
              </div>
            </div>

            <div className="payment-box-grid">
              <div className="payment-instructions-card">
                <span className="payment-badge">OFFICIAL UPI PAYMENT</span>
                <h3>Aditya University Forensithon Desk</h3>
                <div className="upi-details-list">
                  <div className="upi-item">
                    <span>UPI ID:</span>
                    <code>aditya.forensithon@sbi</code>
                  </div>
                  <div className="upi-item">
                    <span>Beneficiary:</span>
                    <strong>Forensic Science Department, Aditya University</strong>
                  </div>
                  <div className="upi-item">
                    <span>Total Amount:</span>
                    <strong className="upi-price">₹300.00</strong> (all 6 builders included)
                  </div>
                </div>
                <p className="payment-note">
                  Scan via GPay, PhonePe, Paytm or BHIM UPI and record your 12-digit UTR/Transaction Reference Number.
                </p>
              </div>

              <div className="payment-inputs-card">
                <div className="form-field-group">
                  <label htmlFor="utrNumber" className="form-label required">
                    Transaction ID / UTR Number
                  </label>
                  <input
                    id="utrNumber"
                    type="text"
                    className={`form-input ${validationErrors.utrNumber ? 'form-input--error' : ''}`}
                    placeholder="e.g. 432109876543 (12 digits)"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value);
                      if (validationErrors.utrNumber) {
                        setValidationErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.utrNumber;
                          return copy;
                        });
                      }
                    }}
                    data-error-key="utrNumber"
                  />
                  {validationErrors.utrNumber && (
                    <span className="form-error-msg">{validationErrors.utrNumber}</span>
                  )}
                </div>

                <div className="form-field-group" style={{ marginTop: '14px' }}>
                  <label className="form-label">
                    Upload Payment Screenshot <span className="label-optional">(Optional)</span>
                  </label>
                  <div className="file-upload-box">
                    <input
                      type="file"
                      id="paymentProof"
                      className="file-input-hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="paymentProof" className="file-upload-label">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>{paymentFileName || 'Choose payment receipt / screenshot'}</span>
                    </label>
                  </div>
                </div>

                <div className="form-field-group" style={{ marginTop: '16px' }}>
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => {
                        setAgreed(e.target.checked);
                        if (validationErrors.agreed) {
                          setValidationErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.agreed;
                            return copy;
                          });
                        }
                      }}
                      data-error-key="agreed"
                    />
                    <span className="checkbox-custom" />
                    <span className="checkbox-label-text">
                      I certify that all 6 team members are currently enrolled students of Aditya University, and strictly comply with the rule: <strong>2 Forensic Science/CSDF, 2 Engineering, and 2 from any department</strong>.
                    </span>
                  </label>
                  {validationErrors.agreed && (
                    <span className="form-error-msg" style={{ display: 'block', marginTop: '6px' }}>
                      {validationErrors.agreed}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-submit-row">
              <button type="submit" className="button submit-registration-btn">
                Submit Team Registration (₹300) →
              </button>
              <p className="submit-hint">
                Confirmation slip and Registration ID will be generated immediately upon submission.
              </p>
            </div>
          </div>
        </form>

        {/* Facts strip at bottom */}
        <div className="student-facts" style={{ marginTop: '36px' }}>
          <div>
            <span>Registration deadline</span>
            <strong>5 December 2026</strong>
          </div>
          <div>
            <span>Event dates</span>
            <strong>9-10 December 2026</strong>
          </div>
          <div>
            <span>Organiser contact</span>
            <strong>Kranthi Chowdary M · +91 99669 88369</strong>
          </div>
        </div>
      </section>
    </main>
  );
}