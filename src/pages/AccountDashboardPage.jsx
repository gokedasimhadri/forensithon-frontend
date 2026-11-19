import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ParticipantPassModal from '../components/ParticipantPassModal';
import {
  getStoredTeamLeader,
  clearStoredTeamLeader,
  refreshLoggedInStudent,
  loginTeamLeaderAccount,
  fetchStudentDashboardData
} from '../services/api';

const formatDateTime = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(val);
  }
};

export default function AccountDashboardPage() {
  const [student, setStudent] = useState(() => getStoredTeamLeader());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state when user visits /account without being logged in
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [generatingPdfIdx, setGeneratingPdfIdx] = useState(null);
  const [activePass, setActivePass] = useState(null);

  const loadDashboard = useCallback(async (rollNo) => {
    if (!rollNo) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchStudentDashboardData(rollNo, 'FORENSITHON');
      setDashboardData(data);
      if (data?.student) {
        setStudent(data.student);
      }
    } catch (err) {
      setError(err.message || 'Unable to load your account dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with Header / Registration auth events
  useEffect(() => {
    const syncAuth = () => {
      const current = getStoredTeamLeader();
      setStudent(current);
      if (!current) {
        setDashboardData(null);
      }
    };
    window.addEventListener('forensithon-auth-changed', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('forensithon-auth-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  // Validate session and load dashboard on mount / login change
  useEffect(() => {
    const studentRoll = student?.roll || student?.rollNo;
    if (!studentRoll) return;
    let active = true;
    refreshLoggedInStudent()
      .then((verified) => {
        if (!active) return;
        if (!verified) {
          clearStoredTeamLeader();
          setStudent(null);
          setDashboardData(null);
          return;
        }
        setStudent(verified);
        loadDashboard(verified.roll || verified.rollNo);
      })
      .catch(() => {
        if (active) loadDashboard(studentRoll);
      });
    return () => {
      active = false;
    };
  }, [student?.roll, student?.rollNo, loadDashboard]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const idVal = loginIdentifier.trim();
    if (!idVal) return setLoginError('Please enter your Roll Number or Email ID.');
    if (!loginPassword) return setLoginError('Please enter your password.');

    setLoginLoading(true);
    try {
      const { student: loggedStudent } = await loginTeamLeaderAccount({
        email: idVal,
        password: loginPassword
      });
      setStudent(loggedStudent);
      setLoginIdentifier('');
      setLoginPassword('');
      await loadDashboard(loggedStudent.roll);
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredTeamLeader();
    setStudent(null);
    setDashboardData(null);
    setError('');
    setLoginIdentifier('');
    setLoginPassword('');
  };

  const handleDownloadPdf = async (cardIndex, regNumber) => {
    setGeneratingPdfIdx(cardIndex);
    try {
      const el = document.getElementById(`dashboard-receipt-card-${cardIndex}`);
      if (!el) {
        window.print();
        return;
      }
      let h2p = window.html2pdf;
      if (!h2p) {
        try {
          const mod = await import('html2pdf.js');
          h2p = mod.default || mod;
        } catch {
          // fallback
        }
      }
      if (h2p) {
        await h2p()
          .set({
            margin: [8, 8, 8, 8],
            filename: `Forensithon_Receipt_${regNumber || 'Confirmed'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          })
          .from(el)
          .save();
      } else {
        window.print();
      }
    } catch {
      window.print();
    } finally {
      setGeneratingPdfIdx(null);
    }
  };

  // Strictly filter for status = CONFIRMED in central_event_student_registrations
  // AND status = PAID in central_event_student_payments
  const confirmedPaidRecords = (dashboardData?.confirmedPaidRecords || []).filter((item) => {
    const regStatus = String(item?.registration?.status || '').trim().toUpperCase();
    const payStatus = String(item?.payment?.status || '').trim().toUpperCase();
    return regStatus === 'CONFIRMED' && payStatus === 'PAID';
  });

  const pendingDrafts = dashboardData?.pendingDrafts || [];
  const profile = dashboardData?.student || student;

  return (
    <main id="main-content">
      <section className="section registration-page">
        <p className="eyebrow">STUDENT ACCOUNT DASHBOARD · FORENSITHON 2k26</p>
        <h1 className="page-title">My Account &amp; Registrations.</h1>
        <p className="lead">
          View your confirmed Forensithon team registrations, verified Razorpay payments, and download official receipts.
        </p>

        {!profile ? (
          <div className="auth-card-shell" style={{ maxWidth: '640px', marginTop: '24px' }}>
            <div className="auth-card-body">
              <form onSubmit={handleLogin} noValidate>
                <div className="auth-card-intro">
                  <h2>Student Account Login</h2>
                  <p>
                    Sign in with your registered <strong>Roll Number</strong> (or Email ID) and password to access your confirmed registration and payment receipts.
                  </p>
                </div>

                {loginError && (
                  <div className="payment-error-alert" role="alert" style={{ marginBottom: '18px' }}>
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="form-field-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor="dashLoginId" className="form-label required">
                    Roll Number or Email ID
                  </label>
                  <input
                    id="dashLoginId"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 19A91A0351 or roll@aditya.ac.in"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="dashLoginPw" className="form-label required">
                    Password
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="dashLoginPw"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="button secondary"
                      style={{ minHeight: '42px', padding: '0 14px', fontSize: '12px' }}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="form-submit-row" style={{ marginTop: '22px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button type="submit" className="button submit-registration-btn" disabled={loginLoading}>
                    {loginLoading ? 'Signing in...' : 'Login to My Account →'}
                  </button>
                  <Link to="/registration" className="button secondary">
                    New Team? Register Here ↗
                  </Link>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="account-dashboard-wrap">
            {/* Student Account Profile Card */}
            <div className="leader-session-bar" style={{ marginTop: '24px' }}>
              <div className="leader-session-info">
                <div className="leader-session-badges">
                  <span className="leader-role-pill">
                    {profile.isTeamLeader ? 'TEAM LEADER' : (profile.role || 'STUDENT').toUpperCase()}
                  </span>
                  <span className="leader-team-pill">ROLL NO: {profile.roll}</span>
                  {profile.teamName && (
                    <span className="leader-team-pill">TEAM: {profile.teamName}</span>
                  )}
                </div>
                <h2 className="leader-session-title" style={{ marginTop: '8px' }}>
                  {profile.name}
                </h2>
                <p className="leader-session-sub">
                  {profile.email} · {profile.mobile || '—'} · {profile.department || 'Aditya University'} ({profile.year || 'Student'})
                </p>
              </div>
              <div className="leader-session-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => loadDashboard(profile.roll)}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh ↻'}
                </button>
                <Link to="/registration" className="button secondary">
                  Team Registration Portal ↗
                </Link>
                <button type="button" className="button secondary" onClick={handleLogout}>
                  Logout ↪
                </button>
              </div>
            </div>

            {error && (
              <div className="payment-error-alert" role="alert" style={{ marginTop: '18px' }}>
                <span>{error}</span>
              </div>
            )}

            {loading && !dashboardData ? (
              <div className="form-card-section" style={{ marginTop: '24px', textAlign: 'center', padding: '42px 24px' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Loading your confirmed registrations and payment details...</p>
              </div>
            ) : confirmedPaidRecords.length > 0 ? (
              <div style={{ marginTop: '26px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span className="success-kicker">VERIFIED &amp; ACTIVE ENTRIES</span>
                    <h2 style={{ margin: '4px 0 0', fontSize: '22px' }}>
                      Confirmed Registrations &amp; Paid Receipts ({confirmedPaidRecords.length})
                    </h2>
                  </div>
                </div>

                {confirmedPaidRecords.map(({ registration: reg, payment: pay }, idx) => {
                  const participants = Array.isArray(reg.participants) ? reg.participants : [];
                  const teamLead = participants[0] || {};
                  const displayRegId = reg.registrationNumber || pay.registrationNumber || 'CONFIRMED';
                  const displayTeamId = reg.teamId || reg.meta?.teamId || displayRegId;
                  const amountRupees =
                    pay.amount !== undefined && pay.amount !== null
                      ? pay.amount
                      : pay.amountInPaise
                      ? Math.round(pay.amountInPaise / 100)
                      : 300;

                  return (
                    <div key={reg._id || idx} className="registration-success-container" style={{ maxWidth: '100%' }}>
                      <div id={`dashboard-receipt-card-${idx}`} className="receipt-card">
                        <div className="receipt-brand-header">
                          <div className="receipt-brand-logos">
                            <img
                              src={`${import.meta.env.BASE_URL}aditya-university-logo.jpg`}
                              alt="Aditya University"
                              className="receipt-univ-logo"
                            />
                          </div>
                          <div className="receipt-brand-text">
                            <h3 className="receipt-brand-title">ADITYA UNIVERSITY</h3>
                            <p className="receipt-brand-dept">Department of Forensic Science · School of Sciences</p>
                            <p className="receipt-brand-event">FORENSITHON 2k26 · CONFIRMED REGISTRATION &amp; PAYMENT SLIP</p>
                          </div>
                        </div>

                        <div className="receipt-meta-row">
                          <div>
                            <span className="receipt-meta-label">TEAM / REGISTRATION ID</span>
                            <span className="receipt-id-badge" style={{ background: '#ff5500', color: '#fff', fontWeight: 700 }}>
                              {displayTeamId}
                            </span>
                          </div>
                          <div>
                            <span className="receipt-meta-label">REGISTRATION STATUS</span>
                            <span className="status-badge status-badge--active">{reg.status}</span>
                          </div>
                          <div>
                            <span className="receipt-meta-label">PAYMENT STATUS</span>
                            <span className="status-badge status-badge--active">{pay.status}</span>
                          </div>
                          <div>
                            <span className="receipt-meta-label">PAYMENT ID</span>
                            <span className="receipt-payment-id-badge">
                              {pay.razorpay?.paymentId || reg.payment?.paymentId || pay.paymentReference}
                            </span>
                          </div>
                        </div>

                        <div className="receipt-divider" />

                        <div className="receipt-section">
                          <span className="receipt-subheading">TEAM &amp; CHALLENGE ALLOCATION</span>
                          <div className="receipt-team-highlight">
                            <div>
                              <span className="receipt-field-title">Team Name</span>
                              <h2 className="receipt-team-name">{reg.teamName || profile.teamName || 'Registered Team'}</h2>
                            </div>
                            <div>
                              <span className="receipt-field-title">Team Leader</span>
                              <strong>
                                {reg.leadRollNumber || teamLead.rollNumber || profile.roll} — {teamLead.name || profile.name}
                              </strong>
                              {(teamLead.phone || profile.mobile) ? ` (${teamLead.phone || profile.mobile})` : ''}
                            </div>
                          </div>

                          <div className="receipt-challenge-box">
                            <div className="receipt-challenge-header">
                              {reg.challengeId && <span className="receipt-challenge-pill">{reg.challengeId}</span>}
                              <h3>{reg.challengeTitle || reg.eventTitle || 'Forensithon 2k26'}</h3>
                            </div>
                            <p className="receipt-domain-name">
                              <strong>Domain / Track:</strong> {reg.domainTitle || reg.domainCode || reg.typeCode || 'FORENSITHON'} · <strong>Academic Year:</strong> {reg.academicYear || '2026-27'}
                            </p>
                          </div>
                        </div>

                        <div className="receipt-divider" />

                        <div className="receipt-section">
                          <span className="receipt-subheading">REGISTERED SQUAD ({participants.length} MEMBERS)</span>
                          <div className="account-members-table-wrap">
                            <table className="account-members-table">
                              <thead>
                                <tr>
                                  <th scope="col" className="col-sl">#</th>
                                  <th scope="col" className="col-roll">Roll Number</th>
                                  <th scope="col" className="col-name">Name</th>
                                  <th scope="col" className="col-role">Role</th>
                                  <th scope="col" className="col-dept">Department / Year</th>
                                  <th scope="col" className="col-email">Email</th>
                                  <th scope="col" className="col-mobile">Mobile</th>
                                  <th scope="col" className="col-pass">Pass</th>
                                </tr>
                              </thead>
                              <tbody>
                                {participants.map((m, mIdx) => {
                                  const isLeadRow = Boolean(m.isLeader || mIdx === 0);
                                  const rollVal = m.rollNumber || m.rollNo || m.roll || '—';
                                  return (
                                    <tr key={mIdx} className={isLeadRow ? 'member-row--leader' : ''}>
                                      <td className="cell-sl">{m.no || mIdx + 1}</td>
                                      <td className="cell-roll">
                                        <span className="table-roll-badge">{rollVal}</span>
                                      </td>
                                      <td className="cell-name">
                                        <strong>{m.name || '—'}</strong>
                                        {isLeadRow && <span className="table-lead-pill">LEADER</span>}
                                      </td>
                                      <td className="cell-role">
                                        {isLeadRow ? 'Team Leader' : (m.role || `Member ${mIdx + 1}`)}
                                      </td>
                                      <td className="cell-dept">
                                        <span>{m.department || m.branch || '—'}</span>
                                        {m.year && <span className="table-year-sub"> ({m.year})</span>}
                                      </td>
                                      <td className="cell-email">{m.email || '—'}</td>
                                      <td className="cell-mobile">{m.phone || m.mobile || '—'}</td>
                                      <td className="cell-pass">
                                        <button
                                          type="button"
                                          className="table-view-pass-btn"
                                          onClick={() => setActivePass({ member: m, registration: reg })}
                                        >
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <rect x="2" y="5" width="20" height="14" rx="2" />
                                            <line x1="7" y1="9" x2="7" y2="15" />
                                            <line x1="11" y1="9" x2="11" y2="15" />
                                            <line x1="15" y1="9" x2="15" y2="15" />
                                            <line x1="18" y1="9" x2="18" y2="15" />
                                          </svg>
                                          View Pass
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="receipt-divider" />

                        <div className="receipt-section receipt-payment-section">
                          <div>
                            <span className="receipt-subheading">VERIFIED PAYMENT DETAILS (RAZORPAY)</span>
                            <p><strong>Amount Paid:</strong> ₹{amountRupees} ({pay.currency || 'INR'})</p>
                            {pay.paymentReference && (
                              <p><strong>Payment Reference:</strong> <code>{pay.paymentReference}</code></p>
                            )}
                            {pay.razorpay?.paymentId && (
                              <p><strong>Razorpay Payment ID:</strong> <code>{pay.razorpay.paymentId}</code></p>
                            )}
                            {pay.razorpay?.orderId && (
                              <p><strong>Razorpay Order ID:</strong> <code>{pay.razorpay.orderId}</code></p>
                            )}
                            <p><strong>Paid On:</strong> {formatDateTime(pay.paidAt || reg.payment?.paidAt || pay.updatedAt)}</p>
                          </div>
                          <div className="receipt-stamp-box">
                            <span className="aditya-stamp">ADITYA UNIVERSITY</span>
                            <span className="stamp-sub">CONFIRMED · PAID</span>
                            <span className="stamp-date">{formatDateTime(pay.paidAt || reg.updatedAt).split(',')[0]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="receipt-actions-row">
                        <button
                          type="button"
                          className="button download-pdf-btn"
                          onClick={() => handleDownloadPdf(idx, displayRegId)}
                          disabled={generatingPdfIdx === idx}
                        >
                          {generatingPdfIdx === idx ? 'Generating PDF...' : 'Download Receipt (PDF) ↓'}
                        </button>
                        <button type="button" className="button secondary" onClick={() => window.print()}>
                          Print Slip ⎙
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="form-card-section" style={{ marginTop: '24px' }}>
                <div className="form-card-header">
                  <span className="step-num-badge">STATUS</span>
                  <div>
                    <h2 className="form-section-title">No Confirmed &amp; Paid Registrations Yet</h2>
                    <p className="form-section-desc">
                      Confirmed registrations (<code>status: CONFIRMED</code>) with completed payment (<code>status: PAID</code>) will automatically appear here with downloadable receipts.
                    </p>
                  </div>
                </div>

                {pendingDrafts.length > 0 && (
                  <div
                    className="payment-gate-banner"
                    style={{
                      marginBottom: '18px',
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      color: '#9a3412',
                      padding: '14px 16px',
                      borderRadius: '10px'
                    }}
                  >
                    <strong>Pending Team Draft Found:</strong> Team "{pendingDrafts[0].teamName || profile.teamName || 'Draft'}" has{' '}
                    <strong>{Array.isArray(pendingDrafts[0].participants) ? pendingDrafts[0].participants.length : 1} / 6</strong> members saved (Payment Status: <strong>PENDING</strong>). Complete all 6 members and Razorpay payment to confirm your registration.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Link to="/registration" className="button">
                    {pendingDrafts.length > 0 ? 'Continue Team Registration & Payment →' : 'Complete Team Registration →'}
                  </Link>
                  <Link to="/challenges" className="button secondary">
                    Explore Challenges ↗
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {activePass && (
        <ParticipantPassModal
          member={activePass.member}
          registration={activePass.registration}
          onClose={() => setActivePass(null)}
        />
      )}
    </main>
  );
}
