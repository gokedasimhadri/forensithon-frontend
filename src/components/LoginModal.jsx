import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  loginTeamLeaderAccount,
  registerTeamLeaderAccount,
  fetchStudentByRollNumber,
  checkForensithonTeamName
} from '../services/api';

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
  'Agricultural Engineering',
  'Other Engineering Discipline'
];

const OPEN_BRANCH_OPTIONS = [
  'School of Management Studies (BBA / MBA)',
  'School of Pharmacy (B.Pharm / M.Pharm)',
  'School of Sciences (Biotechnology / Microbiology / Chemistry)',
  'Humanities, Social Sciences & Languages',
  'School of Agricultural Sciences',
  'Any Other University Department'
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate (PG)'];

/**
 * Smart mapping to auto-populate Branch from student API or roll number
 */
function resolveStudentBranch(student, roll = '') {
  const rawBranch = (
    student?.branch ||
    student?.department ||
    student?.branchname ||
    student?.departmentname ||
    student?.coursename ||
    student?.course ||
    ''
  ).trim();

  const b = rawBranch.toLowerCase();
  const c = (student?.coursename || student?.course || '').toLowerCase();
  const r = (roll || student?.rollNo || student?.roll || '').toUpperCase();

  // 1. Forensic & CSDF
  if (b.includes('csdf') || b.includes('digital forensic') || b.includes('cyber security and digital')) {
    return 'B.Tech CSDF (Computer Science & Digital Forensics)';
  }
  if (c.includes('m.sc') || b.includes('m.sc') || (b.includes('forensic') && (b.includes('pg') || b.includes('master')))) {
    return 'M.Sc Forensic Science';
  }
  if (b.includes('forensic') || b === 'fs' || b === 'cfs') {
    return 'B.Sc Forensic Science';
  }

  // 2. Engineering Disciplines
  if (b.includes('aiml') || b.includes('artificial intelligence') || b.includes('ai & ds') || b.includes('ai & ml') || b.includes('ai and ds') || b.includes('ai and ml')) {
    return 'Artificial Intelligence & Machine Learning (AIML)';
  }
  if (b.includes('data science') || b.includes('cse-ds') || (b.includes('ds') && b.length <= 4)) {
    return 'Data Science';
  }
  if (b.includes('inf') || b.includes('information tech') || b === 'it') {
    return 'Information Technology (IT)';
  }
  if (b.includes('computer') || b.includes('cse') || b === 'cs') {
    return 'Computer Science & Engineering (CSE)';
  }
  if (b.includes('electronics') || b.includes('ece') || b === 'ec') {
    return 'Electronics & Communication Engineering (ECE)';
  }
  if (b.includes('electrical') || b.includes('eee') || b === 'ee') {
    return 'Electrical & Electronics Engineering (EEE)';
  }
  if (b.includes('mech') || b === 'me' || b === 'mec') {
    return 'Mechanical Engineering';
  }
  if (b.includes('civil') || b === 'ce' || b === 'civ') {
    return 'Civil Engineering';
  }
  if (b.includes('petro') || b.includes('chem') || b === 'pt') {
    return 'Petroleum / Chemical Engineering';
  }
  if (b.includes('agri')) {
    return 'Agricultural Engineering';
  }

  // 3. Open Disciplines / Sciences / Management / Pharmacy
  if (b.includes('management') || b.includes('bba') || b.includes('mba') || c.includes('mba') || c.includes('bba') || b === 'sob') {
    return 'School of Management Studies (BBA / MBA)';
  }
  if (b.includes('pharm') || c.includes('pharm') || b === 'sop') {
    return 'School of Pharmacy (B.Pharm / M.Pharm)';
  }
  if (b.includes('bio') || b.includes('micro') || b.includes('science') || c.includes('science')) {
    return 'School of Sciences (Biotechnology / Microbiology / Chemistry)';
  }
  if (b.includes('humanities') || b.includes('arts') || b.includes('english')) {
    return 'Humanities, Social Sciences & Languages';
  }

  // 4. Fallback by Roll Number branch code if available
  // Aditya B.Tech roll number format: YY A9 1 A [branch: 2 chars] XX
  if (r.length >= 8) {
    const branchCode = r.substring(6, 8);
    switch (branchCode) {
      case '01': return 'Civil Engineering';
      case '02': return 'Electrical & Electronics Engineering (EEE)';
      case '03': return 'Mechanical Engineering';
      case '04': return 'Electronics & Communication Engineering (ECE)';
      case '05': return 'Computer Science & Engineering (CSE)';
      case '12': return 'Information Technology (IT)';
      case '27': return 'Petroleum / Chemical Engineering';
      case '35': return 'Agricultural Engineering';
      case '42': return 'Artificial Intelligence & Machine Learning (AIML)';
      case '44': return 'Data Science';
      case '61': return 'B.Tech CSDF (Computer Science & Digital Forensics)';
      default: break;
    }
  }

  return rawBranch || 'B.Sc Forensic Science';
}

/**
 * Smart mapping to auto-populate Year of Study from student API or roll number
 */
function resolveStudentYear(student, roll = '') {
  const sem = (student?.semestername || student?.semester || student?.sem || '').toLowerCase();
  const rawYear = (student?.year || student?.yearname || '').toLowerCase();
  const course = (student?.coursename || student?.course || '').toLowerCase();
  const joinedBatch = student?.joinedbatch || student?.batch;
  const r = (roll || student?.rollNo || student?.roll || '').toUpperCase();

  if (course.includes('m.sc') || course.includes('mba') || course.includes('m.tech') || course.includes('m.pharm') || course.includes('pg')) {
    return 'Postgraduate (PG)';
  }
  if (rawYear.includes('1st') || rawYear.includes('1 year') || rawYear === '1' || rawYear === 'i') return '1st Year';
  if (rawYear.includes('2nd') || rawYear.includes('2 year') || rawYear === '2' || rawYear === 'ii') return '2nd Year';
  if (rawYear.includes('3rd') || rawYear.includes('3 year') || rawYear === '3' || rawYear === 'iii') return '3rd Year';
  if (rawYear.includes('4th') || rawYear.includes('4 year') || rawYear === '4' || rawYear === 'iv') return '4th Year';

  if (sem.includes('vii') || sem.includes('viii') || sem.includes('4/4') || sem.includes('4th') || sem.includes('sem7') || sem.includes('sem8')) {
    return '4th Year';
  }
  if (sem.includes('v ') || sem.includes('vi ') || sem.includes('v sem') || sem.includes('vi sem') || sem.includes('3/4') || sem.includes('3rd') || sem.includes('sem5') || sem.includes('sem6')) {
    return '3rd Year';
  }
  if (sem.includes('iii') || sem.includes('iv') || sem.includes('2/4') || sem.includes('2nd') || sem.includes('sem3') || sem.includes('sem4')) {
    return '2nd Year';
  }
  if (sem.includes('i sem') || sem.includes('ii sem') || sem.includes('1/4') || sem.includes('1st') || sem.includes('sem1') || sem.includes('sem2')) {
    return '1st Year';
  }

  if (joinedBatch && !isNaN(Number(joinedBatch))) {
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth() + 1;
    const academicOffset = curMonth >= 7 ? 1 : 0;
    const diff = (curYear - Number(joinedBatch)) + academicOffset;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    if (diff >= 4) return '4th Year';
  }

  if (r.length >= 2) {
    const prefix2 = r.substring(0, 2);
    const parsedYear = Number('20' + prefix2);
    if (!isNaN(parsedYear) && parsedYear >= 2018 && parsedYear <= 2030) {
      const curYear = new Date().getFullYear();
      const curMonth = new Date().getMonth() + 1;
      const academicOffset = curMonth >= 7 ? 1 : 0;
      const diff = (curYear - parsedYear) + academicOffset;
      if (diff <= 1) return '1st Year';
      if (diff === 2) return '2nd Year';
      if (diff === 3) return '3rd Year';
      if (diff >= 4) return '4th Year';
    }
  }

  return '3rd Year';
}

function resolveStudentGender(student) {
  const raw = String(student?.gender || student?.Gender || student?.sex || student?.Sex || '').trim().toLowerCase();
  if (raw === 'f' || raw.startsWith('fem') || raw.includes('woman') || raw.includes('girl')) {
    return 'Female';
  }
  if (raw === 'm' || raw.startsWith('mal') || raw.includes('man') || raw.includes('boy')) {
    return 'Male';
  }
  return 'Male';
}

const createInitialRegisterForm = () => ({
  teamName: '',
  rollNo: '',
  name: '',
  email: '',
  mobile: '',
  branch: 'B.Sc Forensic Science',
  year: '3rd Year',
  gender: 'Male',
  password: ''
});

export default function LoginModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const [authMode, setAuthMode] = useState(initialMode || 'login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState(createInitialRegisterForm);

  const [lookupStatus, setLookupStatus] = useState({ status: 'idle', studentName: '', message: '' });
  const lookupTimerRef = useRef(null);
  const identifierInputRef = useRef(null);

  const resetAllModalForms = () => {
    setLoginForm({ identifier: '', password: '' });
    setRegisterForm(createInitialRegisterForm());
    setLookupStatus({ status: 'idle', studentName: '', message: '' });
    setAuthError('');
    setAuthSuccess('');
    setShowPassword(false);
  };

  const handleModalClose = () => {
    resetAllModalForms();
    onClose?.();
  };

  // Sync mode and clear any cached form data whenever modal opens or closes
  useEffect(() => {
    resetAllModalForms();
    if (isOpen) {
      setAuthMode(initialMode || 'login');
      // Auto-focus the input after modal renders
      setTimeout(() => {
        identifierInputRef.current?.focus();
      }, 120);
    }
  }, [isOpen, initialMode]);

  // Clear modal forms on any global logout or login event
  useEffect(() => {
    const handleAuthChange = () => {
      resetAllModalForms();
    };
    window.addEventListener('forensithon-auth-changed', handleAuthChange);
    return () => window.removeEventListener('forensithon-auth-changed', handleAuthChange);
  }, []);

  // Handle ESC key and scroll lock on body
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Roll number lookup for Registration tab with automatic Branch & Year population
  const handleTeamNameBlur = async (name) => {
    const clean = String(name || '').trim();
    if (!clean) return;
    try {
      const res = await checkForensithonTeamName({ teamName: clean });
      if (res && res.available === false) {
        setAuthError(res.message || 'This team name is already used. Please choose another unique team name.');
      } else if (authError && authError.includes('already used')) {
        setAuthError('');
      }
    } catch {
      // ignore
    }
  };

  const handleRegisterRollChange = (val) => {
    const rawUpper = val.toUpperCase();
    const cleanUpper = rawUpper.trim();

    setRegisterForm((prev) => {
      // Preliminary smart auto-guess from roll number pattern (e.g. branch code in roll)
      const preliminaryBranch = cleanUpper.length >= 8 ? resolveStudentBranch(null, cleanUpper) : prev.branch;
      const preliminaryYear = cleanUpper.length >= 2 ? resolveStudentYear(null, cleanUpper) : prev.year;
      return {
        ...prev,
        rollNo: rawUpper,
        branch: preliminaryBranch || prev.branch,
        year: preliminaryYear || prev.year
      };
    });

    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    if (cleanUpper.length >= 5) {
      setLookupStatus({ status: 'loading', studentName: '', message: 'Fetching student details...' });
      lookupTimerRef.current = setTimeout(async () => {
        try {
          const student = await fetchStudentByRollNumber(cleanUpper);

          if (student && !student.error && (student.studentname || student.studentName || student.name)) {
            const studentName = (student.studentname || student.studentName || student.name || '').trim();
            const phone = (student.mobilenumber || student.MobileNumber || student.mobile || student.phone || student.fathermobilenumber || '').trim();
            const emailVal = (student.emailid || student.email || student.Email || student.EmailId || `${cleanUpper.toLowerCase()}@aditya.ac.in`).trim();

            // Automatic population of branch, year and gender
            const populatedBranch = resolveStudentBranch(student, cleanUpper);
            const populatedYear = resolveStudentYear(student, cleanUpper);
            const populatedGender = resolveStudentGender(student);

            setRegisterForm((prev) => ({
              ...prev,
              name: studentName || prev.name,
              email: emailVal || prev.email,
              mobile: phone || prev.mobile,
              branch: populatedBranch || prev.branch,
              year: populatedYear || prev.year,
              gender: populatedGender || prev.gender || 'Male'
            }));
            setLookupStatus({
              status: 'found',
              studentName,
              message: `✓ ${studentName} (${populatedBranch} · ${populatedYear})`
            });
            setAuthError('');
          } else {
            // If student record not found in ECAP, use smart fallback from roll number
            const fallbackBranch = resolveStudentBranch(null, cleanUpper);
            const fallbackYear = resolveStudentYear(null, cleanUpper);
            setRegisterForm((prev) => ({
              ...prev,
              email: prev.email || `${cleanUpper.toLowerCase()}@aditya.ac.in`,
              branch: fallbackBranch || prev.branch,
              year: fallbackYear || prev.year
            }));
            setLookupStatus({
              status: 'not_found',
              studentName: '',
              message: 'Not in records — details auto-guessed, edit if needed'
            });
          }
        } catch {
          setLookupStatus({ status: 'idle', studentName: '', message: '' });
        }
      }, 350);
    } else {
      setLookupStatus({ status: 'idle', studentName: '', message: '' });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const idVal = loginForm.identifier.trim();
    const pwVal = loginForm.password;

    if (!idVal) {
      setAuthError('Please enter your Roll Number or Email ID.');
      return;
    }
    if (!pwVal) {
      setAuthError('Please enter your password.');
      return;
    }

    setAuthLoading(true);
    try {
      const { student, token } = await loginTeamLeaderAccount({ email: idVal, password: pwVal });
      setAuthSuccess(`Welcome back, ${student.name || student.roll}!`);
      resetAllModalForms();
      if (onSuccess) {
        onSuccess(student, token);
      }
      setTimeout(() => {
        handleModalClose();
      }, 400);
    } catch (err) {
      setAuthError(err.message || 'Invalid credentials. Please check your Roll Number/Email and password.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const tName = registerForm.teamName.trim();
    const rNo = registerForm.rollNo.trim().toUpperCase();
    const fullName = registerForm.name.trim();
    const emailVal = registerForm.email.trim().toLowerCase();
    const mobileVal = registerForm.mobile.trim();
    const branchVal = registerForm.branch ? registerForm.branch.trim() : 'B.Sc Forensic Science';
    const yearVal = registerForm.year ? registerForm.year.trim() : '3rd Year';
    const passwordVal = registerForm.password;

    if (!tName) return setAuthError('Team Name is required.');
    if (!rNo) return setAuthError('Team Leader Roll Number is required.');
    if (!fullName) return setAuthError('Team Leader Full Name is required.');
    if (!emailVal || !emailVal.includes('@')) return setAuthError('Valid university Email ID is required.');
    if (!mobileVal || mobileVal.length < 10) return setAuthError('10-digit mobile number is required.');
    if (!branchVal) return setAuthError('Branch / Department is required.');
    if (!yearVal) return setAuthError('Year of Study is required.');
    if (!passwordVal || passwordVal.length < 4) return setAuthError('Password must be at least 4 characters.');

    setAuthLoading(true);
    try {
      await registerTeamLeaderAccount({
        teamName: tName,
        roll: rNo,
        name: fullName,
        email: emailVal,
        mobile: mobileVal,
        branch: branchVal,
        department: branchVal,
        year: yearVal,
        gender: registerForm.gender || 'Male',
        password: passwordVal
      });

      setAuthSuccess(`✓ Team Leader account created for ${fullName}! Please sign in below.`);
      setLoginForm({ identifier: rNo, password: '' });
      setRegisterForm(createInitialRegisterForm());
      setLookupStatus({ status: 'idle', studentName: '', message: '' });
      setAuthMode('login');
    } catch (err) {
      setAuthError(err.message || 'Unable to register Team Leader account.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="auth-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-modal-dialog">
        {/* Exact 2-Tab Outer Card Shell (matching Reference Image) */}
        <div className="auth-modal-card-shell">
          {/* Top Tabs Bar with Close Button */}
          <div className="auth-modal-tabs-header" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'register'}
              className={`auth-modal-tab-btn ${authMode === 'register' ? 'is-active' : ''}`}
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
                setAuthSuccess('');
              }}
            >
              <span className="auth-tab-label">Register Team Leader</span>
              <span className="auth-tab-badge auth-tab-badge--new">NEW TEAM</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'login'}
              className={`auth-modal-tab-btn ${authMode === 'login' ? 'is-active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
            >
              <span className="auth-tab-label">Login Team Member / Lead</span>
              <span className="auth-tab-badge auth-tab-badge--existing">EXISTING ACCOUNT</span>
            </button>

            {/* Clean Close Button in Tabs Bar */}
            <button
              type="button"
              className="auth-modal-close-icon"
              onClick={handleModalClose}
              aria-label="Close login popup"
              title="Close (Esc)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="auth-modal-body">
            {authMode === 'login' ? (
              /* ===== LOGIN FORM (Exact Layout from Reference Image) ===== */
              <form onSubmit={handleLoginSubmit} noValidate>
                <div className="auth-modal-intro">
                  <h2 id="auth-modal-title" className="auth-modal-title">Team Login</h2>
                  <p className="auth-modal-desc">
                    Sign in with your Roll Number or Email ID. Your session token is saved so you can add remaining 5 team members, logout anytime, return on any day with your saved details intact, and complete payment when ready.
                  </p>
                </div>

                {authSuccess && (
                  <div className="payment-gate-banner payment-gate-banner--unlocked" role="status" style={{ marginBottom: '16px' }}>
                    <span>{authSuccess}</span>
                  </div>
                )}

                {authError && (
                  <div className="payment-error-alert" role="alert" style={{ marginBottom: '16px' }}>
                    <span>{authError}</span>
                  </div>
                )}

                <div className="auth-modal-grid-2col">
                  <div className="auth-modal-field">
                    <label htmlFor="modalLoginIdentifier" className="auth-modal-label">
                      Roll Number or Email ID <span className="auth-req-star">*</span>
                    </label>
                    <input
                      ref={identifierInputRef}
                      id="modalLoginIdentifier"
                      type="text"
                      className="auth-modal-input"
                      placeholder="e.g. 19A91A0341"
                      value={loginForm.identifier}
                      onChange={(e) => setLoginForm((p) => ({ ...p, identifier: e.target.value }))}
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="auth-modal-field">
                    <label htmlFor="modalLoginPassword" className="auth-modal-label">
                      Password <span className="auth-req-star">*</span>
                    </label>
                    <div className="auth-password-row">
                      <input
                        id="modalLoginPassword"
                        type={showPassword ? 'text' : 'password'}
                        className="auth-modal-input auth-modal-input--pw"
                        placeholder="••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="auth-modal-show-btn"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="auth-modal-submit-row">
                  <button
                    type="submit"
                    className="auth-modal-submit-btn"
                    disabled={authLoading}
                  >
                    {authLoading ? 'LOGGING IN...' : 'LOGIN TO TEAM PORTAL →'}
                  </button>
                </div>
              </form>
            ) : (
              /* ===== REGISTER TEAM LEADER FORM ===== */
              <form onSubmit={handleRegisterSubmit} noValidate>
                <div className="auth-modal-intro">
                  <h2 id="auth-modal-title" className="auth-modal-title">Register Team Leader</h2>
                  <p className="auth-modal-desc">
                    Create your Team Leader account with your <strong>Team Name</strong>. Enter your Roll No to auto-fill your profile details from university records.
                  </p>
                </div>

                {authError && (
                  <div className="payment-error-alert" role="alert" style={{ marginBottom: '16px' }}>
                    <span>{authError}</span>
                  </div>
                )}

                <div className="auth-modal-grid-2col">
                  <div className="auth-modal-field">
                    <label htmlFor="modalTeamName" className="auth-modal-label">
                      Team Name <span className="auth-req-star">*</span>
                    </label>
                    <input
                      id="modalTeamName"
                      type="text"
                      className="auth-modal-input"
                      placeholder="e.g. CyberSherlocks, ForensicForge"
                      value={registerForm.teamName}
                      onChange={(e) => {
                        setRegisterForm((p) => ({ ...p, teamName: e.target.value }));
                        if (authError && authError.includes('already used')) {
                          setAuthError('');
                        }
                      }}
                      onBlur={(e) => handleTeamNameBlur(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-modal-field">
                    <label htmlFor="modalRollNo" className="auth-modal-label">
                      Team Leader Roll No <span className="auth-req-star">*</span>
                    </label>
                    <input
                      id="modalRollNo"
                      type="text"
                      className="auth-modal-input"
                      placeholder="e.g. 22A91A..."
                      value={registerForm.rollNo}
                      onChange={(e) => handleRegisterRollChange(e.target.value)}
                      required
                    />
                    {lookupStatus.message && (
                      <span className="auth-modal-lookup-hint">
                        {lookupStatus.message}
                      </span>
                    )}
                  </div>

                  <div className="auth-modal-field">
                    <label htmlFor="modalName" className="auth-modal-label">
                      Team Leader Full Name <span className="auth-req-star">*</span>
                    </label>
                    <input
                      id="modalName"
                      type="text"
                      className="auth-modal-input"
                      placeholder="Full Name"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="auth-modal-field">
                    <label htmlFor="modalEmail" className="auth-modal-label">
                      Email ID <span className="auth-req-star">*</span>
                    </label>
                    <input
                      id="modalEmail"
                      type="email"
                      className="auth-modal-input"
                      placeholder="roll@aditya.ac.in"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="auth-modal-field">
                    <label htmlFor="modalMobile" className="auth-modal-label">
                      Mobile Number <span className="auth-req-star">*</span>
                    </label>
                    <input
                      id="modalMobile"
                      type="tel"
                      maxLength={10}
                      className="auth-modal-input"
                      placeholder="10-digit primary contact"
                      value={registerForm.mobile}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, mobile: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="auth-modal-field">
                    <label htmlFor="modalBranch" className="auth-modal-label">
                      Branch / Department <span className="auth-req-star">*</span>
                    </label>
                    <select
                      id="modalBranch"
                      className="auth-modal-input auth-modal-select"
                      value={registerForm.branch}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, branch: e.target.value }))}
                      required
                    >
                      <optgroup label="Forensic Science & CSDF (Tier 1)">
                        {FORENSIC_BRANCH_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Engineering & Allied (Tier 2)">
                        {ENGINEERING_BRANCH_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Open Disciplines (Tier 3)">
                        {OPEN_BRANCH_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                      {registerForm.branch &&
                        !FORENSIC_BRANCH_OPTIONS.includes(registerForm.branch) &&
                        !ENGINEERING_BRANCH_OPTIONS.includes(registerForm.branch) &&
                        !OPEN_BRANCH_OPTIONS.includes(registerForm.branch) && (
                          <option value={registerForm.branch}>{registerForm.branch}</option>
                        )}
                    </select>
                  </div>

                  <div className="auth-modal-field">
                    <label htmlFor="modalYear" className="auth-modal-label">
                      Year of Study <span className="auth-req-star">*</span>
                    </label>
                    <select
                      id="modalYear"
                      className="auth-modal-input auth-modal-select"
                      value={registerForm.year}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, year: e.target.value }))}
                      required
                    >
                      {YEAR_OPTIONS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                      {registerForm.year && !YEAR_OPTIONS.includes(registerForm.year) && (
                        <option value={registerForm.year}>{registerForm.year}</option>
                      )}
                    </select>
                  </div>

                  <div className="auth-modal-field">
                    <label htmlFor="modalGender" className="auth-modal-label">
                      Gender <span className="auth-req-star">*</span>
                    </label>
                    <select
                      id="modalGender"
                      className="auth-modal-input auth-modal-select"
                      value={registerForm.gender || 'Male'}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, gender: e.target.value }))}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="auth-modal-field">
                    <label htmlFor="modalPassword" className="auth-modal-label">
                      Create Password <span className="auth-req-star">*</span>
                    </label>
                    <div className="auth-password-row">
                      <input
                        id="modalPassword"
                        type={showPassword ? 'text' : 'password'}
                        className="auth-modal-input auth-modal-input--pw"
                        placeholder="Min. 4 characters"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        className="auth-modal-show-btn"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="auth-modal-submit-row">
                  <button
                    type="submit"
                    className="auth-modal-submit-btn"
                    disabled={authLoading}
                  >
                    {authLoading ? 'REGISTERING...' : 'REGISTER AS TEAM LEADER & CONTINUE →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
