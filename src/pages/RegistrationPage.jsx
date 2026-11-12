import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  fetchForensithonCatalog,
  fetchStudentByRollNumber,
  getStoredTeamLeader,
  clearStoredTeamLeader,
  refreshLoggedInStudent,
  registerTeamLeaderAccount,
  loginTeamLeaderAccount,
  fetchTeamLeaderState,
  saveTeamMembersDraft,
  createForensithonOrder,
  verifyForensithonPayment
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

// Registration Amount configured from environment (.env)
const REGISTRATION_AMOUNT = Number(
  import.meta.env.VITE_REGISTRATION_FEE_AMOUNT ||
  import.meta.env.VITE_REGISTRATION_AMOUNT ||
  300
);

/**
 * Fetch Student Details from Unified Backend (ECAP + DB fallbacks)
 */
const fetchStudentDetailsFromApi = async (rollNo) => {
  return fetchStudentByRollNumber(rollNo);
};

/**
 * Smart mapping from ECAP semester to Forensithon Year of Study
 */
const mapSemesterToYear = (semesterName, joinedBatch, courseName) => {
  const sem = (semesterName || '').toLowerCase();
  const course = (courseName || '').toLowerCase();

  if (course.includes('m.sc') || course.includes('mba') || course.includes('m.tech') || course.includes('m.pharm') || course.includes('pg')) {
    return 'Postgraduate (PG)';
  }
  if (sem.includes('vii') || sem.includes('viii') || sem.includes('4/4') || sem.includes('4th') || sem.includes('sem4')) {
    return '4th Year';
  }
  if (sem.includes('v semester') || sem.includes('vi semester') || sem.includes('3/4') || sem.includes('3rd') || sem.includes('sem3')) {
    return '3rd Year';
  }
  if (sem.includes('iii semester') || sem.includes('iv semester') || sem.includes('2/4') || sem.includes('2nd') || sem.includes('sem2')) {
    return '2nd Year';
  }
  if (sem.includes('i semester') || sem.includes('ii semester') || sem.includes('1/4') || sem.includes('1st') || sem.includes('sem1')) {
    return '1st Year';
  }
  if (joinedBatch) {
    const curYear = new Date().getFullYear();
    const diff = curYear - Number(joinedBatch) + 1;
    if (diff === 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    if (diff >= 4) return '4th Year';
  }
  return '3rd Year';
};

/**
 * Smart mapping from ECAP branch to tier dropdown options
 */
const mapStudentBranch = (tier, rawBranch, rawCourse) => {
  const b = (rawBranch || '').trim().toLowerCase();
  const c = (rawCourse || '').trim().toLowerCase();

  if (tier === 'forensic') {
    if (c.includes('m.sc') || b.includes('m.sc')) {
      return 'M.Sc Forensic Science';
    }
    if (b.includes('csdf') || b.includes('cyber') || b.includes('digital forensic')) {
      return 'B.Tech CSDF (Computer Science & Digital Forensics)';
    }
    if (b.includes('forensic') || b === 'fs' || b === 'cfs') {
      return 'B.Sc Forensic Science';
    }
    return 'B.Sc Forensic Science';
  }

  if (tier === 'engineering') {
    if (b === 'aiml' || b.includes('ai') || b.includes('aiml') || b.includes('machine learning')) {
      return 'Artificial Intelligence & Machine Learning (AIML)';
    }
    if (b === 'ds' || b.includes('data science') || b.includes('cse-ds')) {
      return 'Data Science';
    }
    if (b === 'it' || b.includes('information tech')) {
      return 'Information Technology (IT)';
    }
    if (b === 'ece' || b.includes('electronics and comm') || b.includes('electronics & comm')) {
      return 'Electronics & Communication Engineering (ECE)';
    }
    if (b === 'eee' || b.includes('electrical')) {
      return 'Electrical & Electronics Engineering (EEE)';
    }
    if (b === 'me' || b === 'mec' || b.includes('mech')) {
      return 'Mechanical Engineering';
    }
    if (b === 'ce' || b === 'civ' || b.includes('civil')) {
      return 'Civil Engineering';
    }
    if (b === 'pt' || b.includes('petro') || b.includes('chem')) {
      return 'Petroleum / Chemical Engineering';
    }
    if (b === 'cse' || b === 'cs' || b.includes('computer')) {
      return 'Computer Science & Engineering (CSE)';
    }
    return 'Computer Science & Engineering (CSE)';
  }

  if (tier === 'open') {
    if (c.includes('management') || c.includes('bba') || c.includes('mba') || b.includes('mba') || b.includes('bba') || b === 'sob') {
      return 'School of Management Studies (BBA / MBA)';
    }
    if (c.includes('pharm') || b.includes('pharm') || b === 'sop') {
      return 'School of Pharmacy (B.Pharm / M.Pharm)';
    }
    if (b.includes('bio') || b.includes('micro') || b.includes('chem') || c.includes('science')) {
      return 'School of Sciences (Biotechnology / Microbiology / Chemistry)';
    }
    if (b.includes('humanities') || b.includes('arts') || b.includes('english')) {
      return 'Humanities, Social Sciences & Languages';
    }
    if (b.includes('forensic') || b.includes('csdf') || b === 'fs' || b === 'cfs') {
      return 'Forensic Science / CSDF';
    }
    if (c.includes('b.tech') || ['cse', 'ece', 'eee', 'it', 'me', 'mec', 'ce', 'civ', 'aiml', 'ds'].includes(b) || b.includes('mech') || b.includes('civil')) {
      return 'Engineering & Technology (Any Branch)';
    }
    return 'School of Management Studies (BBA / MBA)';
  }

  return rawBranch;
};

const createInitialMembers = () => [
  // Tier 1: 2 Forensic Science / CSDF students
  {
    id: 1,
    tier: 'forensic',
    tierTitle: 'Tier 1 · Forensic Science',
    role: 'Team Leader & Primary Contact',
    isLead: true,
    rollNo: '',
    name: '',
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
    rollNo: '',
    name: '',
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
    rollNo: '',
    name: '',
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
    rollNo: '',
    name: '',
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
    rollNo: '',
    name: '',
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
    rollNo: '',
    name: '',
    email: '',
    branch: 'School of Sciences (Biotechnology / Microbiology / Chemistry)',
    year: '3rd Year',
    phone: ''
  }
];

const isMemberComplete = (m) => {
  if (!m) return false;
  const roll = String(m.rollNo || '').trim();
  const name = String(m.name || '').trim();
  const email = String(m.email || '').trim();
  return Boolean(roll && name && email && email.includes('@'));
};

const createInitialRegisterForm = () => ({
  teamName: '',
  rollNo: '',
  name: '',
  email: '',
  mobile: '',
  branch: FORENSIC_BRANCH_OPTIONS[0],
  year: '3rd Year',
  gender: 'Other',
  password: ''
});

// Helper to ensure Razorpay checkout script is loaded
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function RegistrationPage() {
  const [searchParams] = useSearchParams();
  const initialChallengeId = searchParams.get('challenge');

  const [catalog, setCatalog] = useState({ domains: [], challenges: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  // Team Leader 2-Tab Auth State (Register -> central_event_student_account, Login)
  const [loggedInLeader, setLoggedInLeader] = useState(() => getStoredTeamLeader());
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const [registerForm, setRegisterForm] = useState(createInitialRegisterForm);
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLookupStatus, setAuthLookupStatus] = useState({ status: 'idle', message: '', studentName: '' });
  const authLookupTimerRef = useRef(null);

  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(createInitialMembers);
  const [confirmedCount, setConfirmedCount] = useState(() => (getStoredTeamLeader() ? 1 : 0)); // 0..6
  const [editingIdx, setEditingIdx] = useState(null); // which confirmed member is currently open for in-place editing
  const [agreed, setAgreed] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [saveError, setSaveError] = useState('');

  // Lookup statuses per member index (0 to 5)
  const [lookupStatuses, setLookupStatuses] = useState(() =>
    Array(6).fill({ status: 'idle', studentName: '', message: '' })
  );
  const lookupTimeouts = useRef({});
  const lastFetchedRollRef = useRef({});
  const initialSyncDoneRef = useRef(false);

  const buildMembersWithLeader = useCallback((student, savedReg = null) => {
    const base = createInitialMembers();
    const leadSource = savedReg?.teamLead || student || {};
    base[0] = {
      ...base[0],
      rollNo: String(leadSource.rollNo || leadSource.rollNumber || leadSource.roll || student?.roll || '').trim().toUpperCase(),
      name: String(leadSource.name || student?.name || '').trim(),
      email: String(leadSource.email || student?.email || '').trim().toLowerCase(),
      phone: String(leadSource.phone || leadSource.mobile || student?.mobile || '').trim(),
      branch: leadSource.branch || student?.department || base[0].branch,
      year: leadSource.year || student?.year || base[0].year
    };

    const remainingList = Array.isArray(savedReg?.teamMembers) && savedReg.teamMembers.length > 0
      ? savedReg.teamMembers
      : Array.isArray(savedReg?.participants)
      ? savedReg.participants.slice(1, 6)
      : [];

    let consecutiveConfirmed = isMemberComplete(base[0]) ? 1 : 0;
    for (let i = 0; i < 5; i += 1) {
      const slot = remainingList[i];
      if (slot) {
        base[i + 1] = {
          ...base[i + 1],
          rollNo: String(slot.rollNo || slot.rollNumber || slot.roll || '').trim().toUpperCase(),
          name: String(slot.name || slot.studentName || '').trim(),
          email: String(slot.email || '').trim().toLowerCase(),
          phone: String(slot.phone || slot.mobile || '').trim(),
          branch: slot.branch || slot.department || base[i + 1].branch,
          year: slot.year || base[i + 1].year
        };
      }
      if (consecutiveConfirmed === i + 1 && isMemberComplete(base[i + 1])) {
        consecutiveConfirmed += 1;
      }
    }

    return { nextMembers: base, nextConfirmedCount: Math.max(1, consecutiveConfirmed) };
  }, []);

  const applyServerState = useCallback(
    (student, state, keepQueryChallenge = false) => {
      const reg = state?.registration || null;
      const pay = state?.payment || null;
      const resolvedTeamName = String(reg?.teamName || student?.teamName || '').trim();
      if (resolvedTeamName) {
        setTeamName(resolvedTeamName);
      }

      const { nextMembers, nextConfirmedCount } = buildMembersWithLeader(student, reg);
      setMembers(nextMembers);
      setConfirmedCount(nextConfirmedCount);

      if (!keepQueryChallenge && reg) {
        if (reg.domainCode) setSelectedDomain(String(reg.domainCode).toUpperCase());
        if (reg.challengeId) setSelectedChallengeId(String(reg.challengeId));
      }

      const isPaid = Boolean(
        reg?.payment?.status === 'PAID' ||
          reg?.status === 'CONFIRMED' ||
          reg?.status === 'PAID' ||
          pay?.status === 'PAID'
      );

      if (isPaid && (reg || pay)) {
        const paidAtDate = pay?.paidAt || reg?.paidAt || reg?.payment?.paidAt || reg?.updated_at;
        const timestamp = paidAtDate
          ? new Date(paidAtDate).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : new Date().toLocaleString('en-IN');

        setSubmittedData({
          regId: reg?.registrationNumber || pay?.registrationNumber || 'CONFIRMED',
          paymentReference: pay?.paymentReference || reg?.payment?.paymentReference || '',
          timestamp,
          teamName: resolvedTeamName || 'Registered Team',
          domain: reg?.domainTitle || pay?.domainTitle || reg?.domainCode || 'Forensithon',
          challengeId: reg?.challengeId || pay?.challengeId || '',
          challengeTitle: reg?.challengeTitle || pay?.challengeTitle || reg?.eventTitle || '',
          forensicRole: reg?.forensicScope || '',
          technicalRole: reg?.technicalScope || '',
          members: nextMembers,
          razorpayOrderId: pay?.razorpay?.orderId || reg?.payment?.orderId || reg?.razorpayOrderId || '',
          razorpayPaymentId: pay?.razorpay?.paymentId || reg?.payment?.paymentId || reg?.razorpayPaymentId || '',
          amount: pay?.amount || reg?.payment?.amount || reg?.fee?.amount || REGISTRATION_AMOUNT,
          status: 'PAID & CONFIRMED · VERIFIED VIA RAZORPAY'
        });
      }
    },
    [buildMembersWithLeader]
  );

  // Load dynamic categories & challenges from unified-backend
  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    setCatalogError('');
    fetchForensithonCatalog()
      .then((data) => {
        if (!active) return;
        const domains = Array.isArray(data.domains) ? data.domains : [];
        const challenges = Array.isArray(data.challenges) ? data.challenges : [];
        setCatalog({ domains, challenges });

        if (initialChallengeId) {
          const q = initialChallengeId.trim().toLowerCase();
          const found = challenges.find(
            (c) =>
              String(c.id || '').toLowerCase() === q ||
              String(c.slug || '').toLowerCase() === q ||
              String(c._id || '').toLowerCase() === q
          );
          if (found) {
            setSelectedDomain(found.categoryCode);
            setSelectedChallengeId(found.id);
            return;
          }
        }

        const firstWithChallenge = domains.find((d) => d.challenges && d.challenges.length > 0) || domains[0];
        if (firstWithChallenge) {
          setSelectedDomain((prev) => prev || firstWithChallenge.code);
          if (firstWithChallenge.challenges && firstWithChallenge.challenges.length > 0) {
            setSelectedChallengeId((prev) => prev || firstWithChallenge.challenges[0].id);
          } else {
            setSelectedChallengeId('');
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load Forensithon challenges for registration:', err);
        setCatalogError(err.message || 'Unable to load challenges from server.');
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialChallengeId]);

  // Restore & validate saved JWT token + Team Leader state across sessions/days
  useEffect(() => {
    const onAuthChanged = () => {
      const current = getStoredTeamLeader();
      if (!current && loggedInLeader) {
        initialSyncDoneRef.current = false;
        setLoggedInLeader(null);
        setSubmittedData(null);
        setTeamName('');
        setMembers(createInitialMembers());
        setConfirmedCount(0);
        setEditingIdx(null);
      }
    };
    window.addEventListener('forensithon-auth-changed', onAuthChanged);
    return () => window.removeEventListener('forensithon-auth-changed', onAuthChanged);
  }, [loggedInLeader]);

  useEffect(() => {
    if (!loggedInLeader || initialSyncDoneRef.current) return;
    initialSyncDoneRef.current = true;
    let active = true;

    applyServerState(loggedInLeader, null, Boolean(initialChallengeId));
    refreshLoggedInStudent()
      .then(async (verifiedStudent) => {
        if (!active) return;
        if (!verifiedStudent) {
          handleLogout();
          return;
        }
        setLoggedInLeader(verifiedStudent);
        const state = await fetchTeamLeaderState(verifiedStudent.roll).catch(() => null);
        if (active && state) {
          applyServerState(state.account || verifiedStudent, state, Boolean(initialChallengeId));
        }
      })
      .catch((err) => {
        console.warn('Could not sync Team Leader session:', err);
      });

    return () => {
      active = false;
    };
  }, [loggedInLeader, applyServerState, initialChallengeId]);

  // Real-time student lookup from Unified Backend / ECAP API by Roll Number
  const triggerStudentLookup = async (index, rollToLookup, force = false) => {
    const cleanRoll = (rollToLookup || '').trim().toUpperCase();
    if (!cleanRoll || cleanRoll.length < 5) return;

    if (!force && lastFetchedRollRef.current[index] === cleanRoll && lookupStatuses[index]?.status === 'found') {
      return;
    }

    setLookupStatuses((prev) => {
      const copy = [...prev];
      copy[index] = { status: 'loading', studentName: '', message: 'Auto-fetching...' };
      return copy;
    });

    try {
      const student = await fetchStudentDetailsFromApi(cleanRoll);

      if (student && !student.error && (student.studentname || student.studentName || student.name)) {
        lastFetchedRollRef.current[index] = cleanRoll;
        const studentName = (student.studentname || student.studentName || student.name || '').trim();
        const phone = (student.mobilenumber || student.MobileNumber || student.mobile || student.phone || student.fathermobilenumber || '').trim();
        const rawEmail = (student.emailid || student.email || student.Email || student.EmailId || '').trim();

        const tier = members[index]?.tier || 'forensic';
        const mappedYear = mapSemesterToYear(student.semestername || student.semester || student.year, student.joinedbatch, student.coursename);
        const mappedBranch = mapStudentBranch(tier, student.branch || student.department, student.coursename);

        setMembers((prev) => {
          const copy = [...prev];
          copy[index] = {
            ...copy[index],
            name: studentName || copy[index].name,
            email: rawEmail ? rawEmail.toLowerCase() : copy[index].email,
            branch: mappedBranch || copy[index].branch,
            year: mappedYear || copy[index].year,
            phone: phone || copy[index].phone
          };
          return copy;
        });

        setLookupStatuses((prev) => {
          const copy = [...prev];
          copy[index] = {
            status: 'found',
            studentName,
            branch: student.branch || '',
            course: student.coursename || ''
          };
          return copy;
        });

        // Clear errors for this student
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[`member_${index}_rollNo`];
          delete next[`member_${index}_name`];
          if (rawEmail) delete next[`member_${index}_email`];
          if (phone) delete next[`member_${index}_phone`];
          return next;
        });
      } else {
        setLookupStatuses((prev) => {
          const copy = [...prev];
          copy[index] = { status: 'not_found', studentName: '', message: 'Not found — enter manually' };
          return copy;
        });
      }
    } catch (err) {
      console.warn('Student lookup failed:', err);
      setLookupStatuses((prev) => {
        const copy = [...prev];
        copy[index] = { status: 'not_found', studentName: '', message: 'Manual entry available' };
        return copy;
      });
    }
  };

  // Available challenges in the selected domain
  const domainChallenges = useMemo(() => {
    if (!selectedDomain) return [];
    return catalog.challenges.filter(
      (c) => String(c.categoryCode).toUpperCase() === String(selectedDomain).toUpperCase()
    );
  }, [catalog.challenges, selectedDomain]);

  // When domain changes, ensure selected challenge belongs to the domain
  const handleDomainChange = (domainCode) => {
    const code = String(domainCode);
    setSelectedDomain(code);
    const challengesForDomain = catalog.challenges.filter(
      (c) => String(c.categoryCode).toUpperCase() === code.toUpperCase()
    );
    if (challengesForDomain.length > 0) {
      setSelectedChallengeId(challengesForDomain[0].id);
    } else {
      setSelectedChallengeId('');
    }
  };

  // Currently selected challenge details
  const currentChallenge = useMemo(() => {
    return (
      catalog.challenges.find((c) => c.id === selectedChallengeId) ||
      domainChallenges[0] ||
      null
    );
  }, [catalog.challenges, selectedChallengeId, domainChallenges]);

  const currentDomainInfo = useMemo(() => {
    return (
      catalog.domains.find(
        (d) => String(d.code).toUpperCase() === String(selectedDomain).toUpperCase()
      ) || null
    );
  }, [catalog.domains, selectedDomain]);

  const effectiveFeeAmount = useMemo(() => {
    if (currentChallenge?.feeRupees && currentChallenge.feeRupees > 0) {
      return currentChallenge.feeRupees;
    }
    return REGISTRATION_AMOUNT;
  }, [currentChallenge]);

  // Strict Remaining 5 Team Members Gate (Members 2..6 must all be filled & confirmed)
  const remainingFilledCount = useMemo(() => {
    return members
      .slice(1, 6)
      .filter((m, offset) => offset + 1 < confirmedCount && isMemberComplete(m)).length;
  }, [members, confirmedCount]);

  const allRemainingFiveFilled = Boolean(
    remainingFilledCount === 5 && confirmedCount === 6 && editingIdx === null
  );

  const isLeadReady = Boolean(
    confirmedCount >= 1 && isMemberComplete(members[0]) && String(members[0]?.phone || '').trim()
  );

  // Team Leader Roll No Auto-Fill in Register Tab
  const triggerAuthRollLookup = async (rollInput) => {
    const cleanRoll = (rollInput || '').trim().toUpperCase();
    if (!cleanRoll || cleanRoll.length < 5) return;
    setAuthLookupStatus({ status: 'loading', message: 'Fetching student...', studentName: '' });
    try {
      const student = await fetchStudentDetailsFromApi(cleanRoll);
      if (student && !student.error && (student.studentname || student.studentName || student.name)) {
        const studentName = (student.studentname || student.studentName || student.name || '').trim();
        const phone = (student.mobilenumber || student.MobileNumber || student.mobile || student.phone || student.fathermobilenumber || '').trim();
        const rawEmail = (student.emailid || student.email || student.Email || student.EmailId || '').trim().toLowerCase();
        const mappedYear = mapSemesterToYear(student.semestername || student.semester || student.year, student.joinedbatch, student.coursename);
        const mappedBranch = mapStudentBranch('forensic', student.branch || student.department, student.coursename);

        setRegisterForm((prev) => ({
          ...prev,
          name: studentName || prev.name,
          email: rawEmail || prev.email,
          mobile: phone || prev.mobile,
          branch: mappedBranch || prev.branch,
          year: mappedYear || prev.year,
          gender: student.gender || prev.gender
        }));
        setAuthLookupStatus({ status: 'found', studentName, message: `✓ ${studentName}` });
      } else {
        setAuthLookupStatus({ status: 'not_found', studentName: '', message: 'Not found — enter manually' });
      }
    } catch {
      setAuthLookupStatus({ status: 'not_found', studentName: '', message: 'Manual entry available' });
    }
  };

  const handleRegisterRollChange = (val) => {
    const upper = val.toUpperCase();
    setRegisterForm((prev) => ({ ...prev, rollNo: upper }));
    if (authLookupTimerRef.current) clearTimeout(authLookupTimerRef.current);
    if (upper.trim().length >= 6) {
      authLookupTimerRef.current = setTimeout(() => {
        triggerAuthRollLookup(upper);
      }, 350);
    } else {
      setAuthLookupStatus({ status: 'idle', message: '', studentName: '' });
    }
  };

  const handleTeamLeaderRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const tName = registerForm.teamName.trim();
    const rNo = registerForm.rollNo.trim().toUpperCase();
    const fullName = registerForm.name.trim();
    const emailVal = registerForm.email.trim().toLowerCase();
    const mobileVal = registerForm.mobile.trim();
    const passwordVal = registerForm.password;

    if (!tName) return setAuthError('Team Name is required to register as Team Leader.');
    if (!rNo) return setAuthError('Team Leader Roll Number is required.');
    if (!fullName) return setAuthError('Team Leader Full Name is required.');
    if (!emailVal || !emailVal.includes('@')) return setAuthError('Please enter a valid Email ID.');
    if (!mobileVal) return setAuthError('Mobile number is required for the Team Leader.');
    if (!passwordVal || passwordVal.length < 4) return setAuthError('Please create a password (at least 4 characters).');

    setAuthLoading(true);
    try {
      const student = await registerTeamLeaderAccount({
        teamName: tName,
        roll: rNo,
        name: fullName,
        email: emailVal,
        mobile: mobileVal,
        department: registerForm.branch,
        year: registerForm.year,
        gender: registerForm.gender || 'Other',
        college: 'Aditya University',
        password: passwordVal
      });

      // After registering as Team Leader, redirect to Login tab so they sign in with their credentials
      setAuthMode('login');
      setLoginForm({ identifier: student?.roll || rNo, password: '' });
      setRegisterForm(createInitialRegisterForm());
      setAuthLookupStatus({ status: 'idle', message: '', studentName: '' });
      setAuthSuccess(
        `Team "${student?.teamName || tName}" registered in central_event_student_account! Please login below with ${student?.roll || rNo} and your password to add the remaining 5 team members.`
      );
    } catch (err) {
      setAuthError(err.message || 'Unable to register Team Leader.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTeamLeaderLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const idVal = loginForm.identifier.trim();
    const pwVal = loginForm.password;
    if (!idVal) return setAuthError('Please enter your Roll Number or Email ID.');
    if (!pwVal) return setAuthError('Please enter your password.');

    setAuthLoading(true);
    try {
      const { student } = await loginTeamLeaderAccount({ email: idVal, password: pwVal });
      initialSyncDoneRef.current = true;
      setLoggedInLeader(student);
      const serverState = await fetchTeamLeaderState(student.roll).catch(() => null);
      applyServerState(student, serverState, Boolean(initialChallengeId));
      setSaveNotice(
        serverState?.registration
          ? 'Welcome back! Your previously saved team details have been restored.'
          : ''
      );
      setSaveError('');
    } catch (err) {
      setAuthError(err.message || 'Invalid credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredTeamLeader();
    initialSyncDoneRef.current = false;
    setLoggedInLeader(null);
    setSubmittedData(null);
    setAuthMode('login');
    setAuthError('');
    setAuthSuccess('');
    setTeamName('');
    setAgreed(false);
    setValidationErrors({});
    setIsProcessingPayment(false);
    setPaymentErrorMessage('');
    setSaveNotice('');
    setSaveError('');
    setMembers(createInitialMembers());
    setConfirmedCount(0);
    setEditingIdx(null);
    lastFetchedRollRef.current = {};
    setLookupStatuses(Array(6).fill({ status: 'idle', studentName: '', message: '' }));
  };

  // Persist Team Name + Team Leader + Remaining 5 Members to central_event_student_registrations
  const persistTeamDraft = async (nextMembersList = members, overrideTeamName = teamName) => {
    if (!loggedInLeader) return;
    const cleanTeamName = (overrideTeamName || loggedInLeader.teamName || '').trim();
    if (!cleanTeamName) {
      setSaveError('Enter a Team Name in Step 01 before saving team members.');
      return;
    }

    setSavingDraft(true);
    setSaveError('');
    setSaveNotice('');
    try {
      const domainNumber = Number(currentDomainInfo?.number) || 1;
      const domainLabel = currentDomainInfo?.name || currentDomainInfo?.title || selectedDomain || 'Forensithon';

      const result = await saveTeamMembersDraft({
        teamName: cleanTeamName,
        domainId: domainNumber,
        domainCode: currentDomainInfo?.code || selectedDomain || '',
        domainTitle: domainLabel,
        challengeId: currentChallenge?.id || selectedChallengeId || '',
        challengeTitle: currentChallenge?.title || '',
        centralEventId: currentChallenge?.sourceType === 'central_event' ? currentChallenge?._id : null,
        forensicScope: currentChallenge?.forensic || currentChallenge?.descriptionText || '',
        technicalScope: currentChallenge?.technical || '',
        subFields: Array.isArray(currentChallenge?.subFields) ? currentChallenge.subFields : [],
        amount: effectiveFeeAmount,
        members: nextMembersList.map((m, idx) => ({
          studentIndex: idx + 1,
          tier: m.tier,
          tierTitle: m.tierTitle,
          role: m.role,
          isLead: idx === 0,
          name: (m.name || '').trim(),
          rollNo: (m.rollNo || '').trim().toUpperCase(),
          email: (m.email || '').trim().toLowerCase(),
          branch: m.branch,
          year: m.year,
          phone: m.phone ? m.phone.trim() : ''
        }))
      });

      const savedCount = Number(result?.completedMembersCount ?? nextMembersList.slice(1, 6).filter(isMemberComplete).length);
      setSaveNotice(
        `Saved in central_event_student_registrations (${savedCount}/5 remaining members completed).`
      );
    } catch (err) {
      setSaveError(err.message || 'Unable to save team progress.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleMemberChange = (index, field, value) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });

    // Auto-trigger API lookup when Roll Number is typed
    if (field === 'rollNo') {
      lastFetchedRollRef.current[index] = '';
      const cleanRoll = value.trim().toUpperCase();
      if (lookupTimeouts.current[index]) {
        clearTimeout(lookupTimeouts.current[index]);
      }
      if (cleanRoll.length >= 6) {
        lookupTimeouts.current[index] = setTimeout(() => {
          triggerStudentLookup(index, cleanRoll);
        }, 350);
      } else {
        setLookupStatuses((prev) => {
          const copy = [...prev];
          copy[index] = { status: 'idle', studentName: '', message: '' };
          return copy;
        });
      }
    }

    // Clear field-specific validation error
    if (validationErrors[`member_${index}_${field}`]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[`member_${index}_${field}`];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!teamName.trim()) {
      errors.teamName = 'Team name is required.';
    }

    if (!selectedChallengeId || !currentChallenge) {
      errors.challenge = 'Please select an active track and problem statement.';
    }

    // Validate 6 members (Team Leader + remaining 5 members)
    members.forEach((m, idx) => {
      if (!m.rollNo.trim()) {
        errors[`member_${idx}_rollNo`] = `Roll number is required.`;
      }
      if (!m.name.trim()) {
        errors[`member_${idx}_name`] = `Student ${idx + 1} name is required.`;
      }
      if (!m.email.trim()) {
        errors[`member_${idx}_email`] = `Email is required.`;
      } else if (!m.email.includes('@')) {
        errors[`member_${idx}_email`] = `Please enter a valid email address.`;
      }

      if (m.isLead && !m.phone.trim()) {
        errors[`member_${idx}_phone`] = `Team Leader mobile number is required.`;
      }
    });

    if (!allRemainingFiveFilled) {
      errors.remainingMembers = 'Please complete all 5 remaining team members before proceeding to payment.';
    }

    if (!agreed) {
      errors.agreed = 'You must confirm that all 6 members satisfy the university & branch rules.';
    }

    setValidationErrors(errors);
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allRemainingFiveFilled) {
      setPaymentErrorMessage('Payment is disabled until all 5 remaining team members are filled.');
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[data-error-key="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsProcessingPayment(true);
    setPaymentErrorMessage('');

    try {
      // 1. Ensure Razorpay Checkout SDK is ready
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const domainNumber = Number(currentDomainInfo?.number) || 1;
      const domainLabel = currentDomainInfo?.name || currentDomainInfo?.title || selectedDomain || 'Forensithon';

      // 2. Call Unified Backend API to Create Order and save registration in central_event_student_registrations
      const orderPayload = {
        amount: effectiveFeeAmount,
        teamName: teamName.trim(),
        domainId: domainNumber,
        domainCode: currentDomainInfo?.code || selectedDomain || '',
        domainTitle: domainLabel,
        challengeId: currentChallenge.id,
        challengeTitle: currentChallenge.title,
        centralEventId: currentChallenge?.sourceType === 'central_event' ? currentChallenge?._id : null,
        forensicScope: currentChallenge.forensic || currentChallenge.descriptionText || currentChallenge.title,
        technicalScope: currentChallenge.technical || '',
        subFields: Array.isArray(currentChallenge.subFields) ? currentChallenge.subFields : [],
        members: members.map((m, idx) => ({
          studentIndex: idx + 1,
          tier: m.tier,
          tierTitle: m.tierTitle,
          role: m.role,
          isLead: idx === 0,
          name: m.name.trim(),
          rollNo: m.rollNo.trim().toUpperCase(),
          email: m.email.trim().toLowerCase(),
          branch: m.branch,
          year: m.year,
          phone: m.phone ? m.phone.trim() : ''
        }))
      };

      const orderData = await createForensithonOrder(orderPayload);

      // 3. Configure and Open Razorpay Checkout Window
      const rzpOptions = {
        key: orderData.key || orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'FORENSITHON 2k26',
        description: `Team Registration (${teamName.trim()}) - ${currentChallenge.id}`,
        image: `${import.meta.env.BASE_URL}aditya-university-logo.jpg`,
        order_id: orderData.orderId,
        prefill: {
          name: members[0].name.trim(),
          email: members[0].email.trim(),
          contact: members[0].phone ? members[0].phone.trim() : ''
        },
        theme: {
          color: '#ff5500' // Forensithon Orange
        },
        handler: async function (paymentResponse) {
          try {
            // 4. Verify Payment with Backend API & Save to central_event_student_payments
            const verifyData = await verifyForensithonPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              registrationId: orderData.registrationId,
              regDocId: orderData.regDocId
            });

            const timestamp = new Date().toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const confirmedRecord = {
              regId: verifyData.registrationId || orderData.registrationId,
              paymentReference: verifyData.paymentReference || '',
              timestamp,
              teamName: teamName.trim(),
              domain: domainLabel,
              challengeId: currentChallenge.id,
              challengeTitle: currentChallenge.title,
              forensicRole: currentChallenge.forensic || currentChallenge.descriptionText || '',
              technicalRole: currentChallenge.technical || '',
              members,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              amount: orderData.amountInRupees || effectiveFeeAmount,
              status: 'PAID & CONFIRMED · VERIFIED VIA RAZORPAY'
            };

            setSubmittedData(confirmedRecord);
            setIsProcessingPayment(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (verifyError) {
            console.error('Verification error:', verifyError);
            setPaymentErrorMessage(
              `Payment was processed by Razorpay (ID: ${paymentResponse.razorpay_payment_id}), but verification returned: ${verifyError.message}`
            );
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(rzpOptions);
      razorpayInstance.on('payment.failed', function (failedResponse) {
        console.error('Payment failed:', failedResponse);
        setPaymentErrorMessage(
          failedResponse.error?.description || 'Payment was unsuccessful or cancelled by the user.'
        );
        setIsProcessingPayment(false);
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Registration/Payment Error:', err);
      setPaymentErrorMessage(err.message || 'An error occurred while connecting to the payment gateway.');
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const receiptElement = document.getElementById('receipt-download-card');
      if (!receiptElement) {
        window.print();
        setIsGeneratingPdf(false);
        return;
      }

      let h2p = window.html2pdf;
      if (!h2p) {
        try {
          const mod = await import('html2pdf.js');
          h2p = mod.default || mod;
        } catch (e) {
          // fallback
        }
      }

      if (h2p) {
        const fileName = `Forensithon_Receipt_${submittedData?.regId || 'Slip'}.pdf`;
        const opt = {
          margin: [8, 8, 8, 8],
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            scrollY: 0
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await h2p().set(opt).from(receiptElement).save();
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('PDF generation fallback to print:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // If already submitted and verified, display the official Confirmation Slip
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
                <span className="success-kicker">TEAM ENTRY CONFIRMED · RAZORPAY PAID</span>
                <h1 className="success-title">Official Registration Slip</h1>
                <p className="success-subtitle">
                  Your team has been successfully registered and payment verified for Forensithon 2k26.
                </p>
              </div>
            </div>

            <div id="receipt-download-card" className="receipt-card">
              {/* Official Aditya University Header for PDF & Print */}
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
                  <p className="receipt-brand-event">FORENSITHON 2k26 · OFFICIAL REGISTRATION RECEIPT</p>
                </div>
              </div>

              <div className="receipt-meta-row">
                <div>
                  <span className="receipt-meta-label">REGISTRATION ID</span>
                  <span className="receipt-id-badge">{submittedData.regId}</span>
                </div>
                <div>
                  <span className="receipt-meta-label">PAYMENT ID</span>
                  <span className="receipt-payment-id-badge">{submittedData.razorpayPaymentId}</span>
                </div>
                <div>
                  <span className="receipt-meta-label">STATUS</span>
                  <span className="status-badge status-badge--active">PAID &amp; CONFIRMED</span>
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
                    <strong>{submittedData.members[0].rollNo} — {submittedData.members[0].name}</strong> ({submittedData.members[0].phone})
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
                  ✓ Verified &amp; Stored in Database: Exactly 6 Aditya University students (2 Forensic + 2 Engineering + 2 Open Discipline)
                </p>

                <div className="receipt-members-grid">
                  {submittedData.members.map((m, idx) => (
                    <div key={idx} className={`receipt-member-item receipt-member-item--${m.tier}`}>
                      <div className="receipt-member-top">
                        <span className="receipt-member-role">{m.role}</span>
                        <span className="receipt-member-tier-pill">{m.tierTitle}</span>
                      </div>
                      <span className="receipt-member-roll-badge">{m.rollNo}</span>
                      <h4 className="receipt-member-name">{m.name}</h4>
                      <p className="receipt-member-details">
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
                  <span className="receipt-subheading">PAYMENT VERIFICATION (RAZORPAY)</span>
                  <p><strong>Registration Fee:</strong> ₹{submittedData.amount || effectiveFeeAmount} (Covering all 6 builders)</p>
                  {submittedData.paymentReference && (
                    <p><strong>Payment Reference:</strong> <code>{submittedData.paymentReference}</code></p>
                  )}
                  <p><strong>Razorpay Payment ID:</strong> <code>{submittedData.razorpayPaymentId}</code></p>
                  <p><strong>Razorpay Order ID:</strong> <code>{submittedData.razorpayOrderId}</code></p>
                  <p><strong>Collections Updated:</strong> <code>central_event_student_registrations</code> &amp; <code>central_event_student_payments</code></p>
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
                className="button download-pdf-btn"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <span className="btn-loading-flex">
                    <span className="spinner" /> Generating PDF...
                  </span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Receipt (PDF) ↓
                  </>
                )}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => window.print()}
              >
                Print Slip ⎙
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={handleLogout}
              >
                Logout / Switch Account ↪
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
        <p className="eyebrow">OFFICIAL TEAM REGISTRATION · FORENSITHON 2k26</p>
        <h1 className="page-title">Register as six.</h1>
        <p className="lead">9-10 December 2k26 · Aditya University Campus</p>

        {/* 3 Key Event Cards at the Top */}
        <div className="registration-facts-grid">
          <div className="fact-card fact-card--deadline">
            <div className="fact-card-header">
              <span className="fact-icon-wrap" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <span className="fact-pill fact-pill--orange">DEADLINE</span>
            </div>
            <span className="fact-label">Registration Deadline</span>
            <strong className="fact-value">5 December 2k26</strong>
            <span className="fact-sub">Portal closes at 11:59 PM IST</span>
          </div>

          <div className="fact-card fact-card--fee">
            <div className="fact-card-header">
              <span className="fact-icon-wrap" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                  <line x1="12" y1="6" x2="12" y2="8" />
                  <line x1="12" y1="16" x2="12" y2="18" />
                </svg>
              </span>
              <span className="fact-pill fact-pill--blue">ENTRY FEE</span>
            </div>
            <span className="fact-label">Registration Fee</span>
            <strong className="fact-value">₹{effectiveFeeAmount} per team</strong>
            <span className="fact-sub">Razorpay gateway · All 6 builders included</span>
          </div>

          <div className="fact-card fact-card--contact">
            <div className="fact-card-header">
              <span className="fact-icon-wrap" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <span className="fact-pill fact-pill--dark">CONVENOR</span>
            </div>
            <span className="fact-label">Faculty Contact</span>
            <strong className="fact-value">Kranthi Chowdary M</strong>
            <span className="fact-sub">+91 99669 88369 · Asst. Professor, Forensic Science</span>
          </div>
        </div>

        {/* Mandatory Requirement Rule Banner with 3 Tier Cards */}
        <div className="registration-rule-banner">
          <div className="rule-banner-header">
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
          </div>

          <div className="rule-banner-tiers-grid">
            <div className="rule-tier-card rule-tier-card--forensic">
              <span className="rule-tier-badge">2 STUDENTS</span>
              <h4>Forensic Science / CSDF</h4>
              <p>Leads domain scope, evidence handling &amp; validation</p>
            </div>

            <div className="rule-tier-card rule-tier-card--engineering">
              <span className="rule-tier-badge">2 STUDENTS</span>
              <h4>Engineering &amp; Allied</h4>
              <p>Builds the software, hardware, parsers &amp; technical MVP</p>
            </div>

            <div className="rule-tier-card rule-tier-card--open">
              <span className="rule-tier-badge">2 STUDENTS</span>
              <h4>Open Discipline (Any Dept)</h4>
              <p>Supports interdisciplinary research, UI/UX &amp; final pitch</p>
            </div>
          </div>
        </div>

        {/* 2-Tab Card (Register Team Leader / Login) OR Logged-in Squad Portal */}
        {!loggedInLeader ? (
          <div className="auth-card-shell" aria-label="Team Leader Account Access">
            <div className="auth-tabs-bar" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'register'}
                className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                  setAuthSuccess('');
                }}
              >
                Register Team Leader
                <span className="auth-tab-badge">NEW TEAM</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'login'}
                className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
              >
                Login Team Member / Lead
                <span className="auth-tab-badge">EXISTING ACCOUNT</span>
              </button>
            </div>

            <div className="auth-card-body">
              {authMode === 'register' ? (
                <form onSubmit={handleTeamLeaderRegister} noValidate>
                  <div className="auth-card-intro">
                    <h2>Step 1 · Register as Team Leader</h2>
                    <p>
                      Create your Team Leader account with your <strong>Team Name</strong>. Enter your Roll No to auto-fill details. Once registered, login lets you add the remaining 5 team members and complete Razorpay payment.
                    </p>
                  </div>

                  {authError && (
                    <div className="payment-error-alert" role="alert" style={{ marginBottom: '18px' }}>
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="form-grid-2col">
                    <div className="form-field-group">
                      <label htmlFor="authTeamName" className="form-label required">
                        Team Name
                      </label>
                      <input
                        id="authTeamName"
                        type="text"
                        className="form-input"
                        placeholder="e.g. CyberSherlocks, ForensicForge"
                        value={registerForm.teamName}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, teamName: e.target.value }))}
                      />
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="authRollNo" className="form-label required">
                        Team Leader Roll No
                      </label>
                      <input
                        id="authRollNo"
                        type="text"
                        className={`form-input ${authLookupStatus.status === 'found' ? 'form-input--verified' : ''}`}
                        placeholder="e.g. 22A91A..."
                        value={registerForm.rollNo}
                        onChange={(e) => handleRegisterRollChange(e.target.value)}
                        onBlur={(e) => triggerAuthRollLookup(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            triggerAuthRollLookup(e.currentTarget.value);
                          }
                        }}
                      />
                      {authLookupStatus.status === 'loading' && (
                        <span className="lookup-pill lookup-pill--loading">
                          <span className="lookup-spinner" /> Fetching...
                        </span>
                      )}
                      {authLookupStatus.status === 'found' && (
                        <span className="lookup-pill lookup-pill--found">
                          {authLookupStatus.message}
                        </span>
                      )}
                      {authLookupStatus.status === 'not_found' && (
                        <span className="lookup-pill lookup-pill--manual">
                          {authLookupStatus.message}
                        </span>
                      )}
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="authLeaderName" className="form-label required">
                        Team Leader Full Name
                      </label>
                      <input
                        id="authLeaderName"
                        type="text"
                        className="form-input"
                        placeholder="Full Name"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="authLeaderEmail" className="form-label required">
                        Email ID
                      </label>
                      <input
                        id="authLeaderEmail"
                        type="email"
                        className="form-input"
                        placeholder="roll@aditya.ac.in"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="authLeaderMobile" className="form-label required">
                        Mobile Number
                      </label>
                      <input
                        id="authLeaderMobile"
                        type="tel"
                        maxLength={10}
                        className="form-input"
                        placeholder="10-digit primary contact"
                        value={registerForm.mobile}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, mobile: e.target.value }))}
                      />
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="authLeaderBranch" className="form-label required">
                        Branch / Department
                      </label>
                      <select
                        id="authLeaderBranch"
                        className="form-select"
                        value={registerForm.branch}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, branch: e.target.value }))}
                      >
                        {[...FORENSIC_BRANCH_OPTIONS, ...ENGINEERING_BRANCH_OPTIONS, ...OPEN_BRANCH_OPTIONS].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="authLeaderYear" className="form-label required">
                        Year of Study
                      </label>
                      <select
                        id="authLeaderYear"
                        className="form-select"
                        value={registerForm.year}
                        onChange={(e) => setRegisterForm((p) => ({ ...p, year: e.target.value }))}
                      >
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="authRegisterPassword" className="form-label required">
                        Create Password
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          id="authRegisterPassword"
                          type={showAuthPassword ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Min. 4 characters"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="button secondary"
                          style={{ minHeight: '42px', padding: '0 14px', fontSize: '12px' }}
                          onClick={() => setShowAuthPassword((v) => !v)}
                        >
                          {showAuthPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-submit-row" style={{ marginTop: '22px' }}>
                    <button
                      type="submit"
                      className="button submit-registration-btn"
                      disabled={authLoading}
                    >
                      {authLoading ? 'Registering Team Leader...' : 'Register as Team Leader & Continue →'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleTeamLeaderLogin} noValidate>
                  <div className="auth-card-intro">
                    <h2>Team Login</h2>
                    <p>
                      Sign in with your Roll Number or Email ID. Your session token is saved so you can add remaining 5 team members, logout anytime, return on any day with your saved details intact, and complete payment when ready.
                    </p>
                  </div>

                  {authSuccess && (
                    <div className="payment-gate-banner payment-gate-banner--unlocked" role="status" style={{ marginBottom: '18px' }}>
                      <span>✓ {authSuccess}</span>
                    </div>
                  )}

                  {authError && (
                    <div className="payment-error-alert" role="alert" style={{ marginBottom: '18px' }}>
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="form-grid-2col">
                    <div className="form-field-group">
                      <label htmlFor="authLoginIdentifier" className="form-label required">
                        Roll Number or Email ID
                      </label>
                      <input
                        id="authLoginIdentifier"
                        type="text"
                        className="form-input"
                        placeholder="e.g. 22A91A0501 or roll@aditya.ac.in"
                        value={loginForm.identifier}
                        onChange={(e) => setLoginForm((p) => ({ ...p, identifier: e.target.value }))}
                      />
                    </div>

                    <div className="form-field-group">
                      <label htmlFor="authLoginPassword" className="form-label required">
                        Password
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          id="authLoginPassword"
                          type={showAuthPassword ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Enter password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="button secondary"
                          style={{ minHeight: '42px', padding: '0 14px', fontSize: '12px' }}
                          onClick={() => setShowAuthPassword((v) => !v)}
                        >
                          {showAuthPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-submit-row" style={{ marginTop: '22px' }}>
                    <button
                      type="submit"
                      className="button submit-registration-btn"
                      disabled={authLoading}
                    >
                      {authLoading ? 'Signing in...' : 'Login to Team Portal →'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Logged-in Team Leader Bar */}
            <div className="leader-session-bar">
              <div className="leader-session-info">
                <div className="leader-session-badges">
                  <span className="leader-role-pill">
                    {loggedInLeader.isTeamLeader || (members[0]?.rollNo && members[0].rollNo === loggedInLeader.roll)
                      ? 'TEAM LEADER'
                      : (loggedInLeader.role || 'TEAM MEMBER').toUpperCase()}
                  </span>
                  <span className="leader-team-pill">TEAM: {teamName || loggedInLeader.teamName || 'UNSET'}</span>
                </div>
                <h3 className="leader-session-title">
                  {loggedInLeader.name} · {loggedInLeader.roll}
                </h3>
                <p className="leader-session-sub">
                  Remaining Members Completed: <strong>{remainingFilledCount} / 5</strong> ·{' '}
                  {allRemainingFiveFilled
                    ? 'All 5 remaining members saved — Razorpay payment is unlocked!'
                    : 'Fill and add all 5 remaining team members below to enable Razorpay payment.'}
                </p>
              </div>
              <div className="leader-session-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleLogout}
                >
                  Logout / Switch Account ↪
                </button>
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
                  Choose a track and {catalog.challenges.length > 0 ? `one of the ${catalog.challenges.length} live problem statements` : 'a problem statement'} your team will solve.
                </p>
              </div>
            </div>

            {catalogError && (
              <div className="payment-error-alert" role="alert" style={{ marginBottom: '16px' }}>
                <span>Unable to load live tracks from Unified Portal: {catalogError}</span>
              </div>
            )}

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
                  Forensic Track
                </label>
                <select
                  id="domainSelect"
                  className="form-select"
                  value={selectedDomain}
                  disabled={catalogLoading || catalog.domains.length === 0}
                  onChange={(e) => handleDomainChange(e.target.value)}
                >
                  {catalogLoading ? (
                    <option value="">Loading tracks...</option>
                  ) : catalog.domains.length === 0 ? (
                    <option value="">No tracks available</option>
                  ) : (
                    catalog.domains.map((d) => (
                      <option key={d._id || d.code} value={d.code}>
                        Track {String(d.sortOrder || d.number).padStart(2, '0')} · {d.name} ({d.ids})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Problem Statement Dropdown */}
            <div className="form-field-group" style={{ marginTop: '16px' }}>
              <label htmlFor="challengeSelect" className="form-label required">
                Problem Statement ({domainChallenges.length} available in {currentDomainInfo?.name || selectedDomain || 'Track'})
              </label>
              <select
                id="challengeSelect"
                className={`form-select ${validationErrors.challenge ? 'form-input--error' : ''}`}
                value={selectedChallengeId}
                disabled={catalogLoading || domainChallenges.length === 0}
                onChange={(e) => {
                  setSelectedChallengeId(e.target.value);
                  if (validationErrors.challenge) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.challenge;
                      return next;
                    });
                  }
                }}
                data-error-key="challenge"
              >
                {catalogLoading ? (
                  <option value="">Loading problem statements...</option>
                ) : domainChallenges.length === 0 ? (
                  <option value="">No problem statements published in this track yet</option>
                ) : (
                  domainChallenges.map((c) => (
                    <option key={c._id || c.id} value={c.id}>
                      [{c.id}] {c.title}
                    </option>
                  ))
                )}
              </select>
              {validationErrors.challenge && (
                <span className="form-error-msg">{validationErrors.challenge}</span>
              )}
            </div>

            {/* Selected Challenge Preview Card */}
            {currentChallenge && (
              <div className="challenge-preview-card">
                <div className="preview-header">
                  <span className="preview-id-pill">{currentChallenge.id}</span>
                  <h3 className="preview-title">{currentChallenge.title}</h3>
                </div>

                {currentChallenge.hasSplitScopes ? (
                  <div className="preview-pillars-grid">
                    {currentChallenge.forensic && (
                      <div className="preview-pillar preview-pillar--forensic">
                        <span className="pillar-tag pillar-tag--forensic">FORENSIC SCIENCE SCOPE</span>
                        <p>{currentChallenge.forensic}</p>
                      </div>
                    )}
                    {currentChallenge.technical && (
                      <div className="preview-pillar preview-pillar--tech">
                        <span className="pillar-tag pillar-tag--tech">TECHNICAL / ENGINEERING SCOPE</span>
                        <p>{currentChallenge.technical}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {currentChallenge.descriptionText && (
                      <div className="preview-pillar preview-pillar--forensic" style={{ marginTop: '12px' }}>
                        <span className="pillar-tag pillar-tag--forensic">CHALLENGE OVERVIEW</span>
                        <p>{currentChallenge.descriptionText}</p>
                      </div>
                    )}
                    {Array.isArray(currentChallenge.subFields) && currentChallenge.subFields.length > 0 && (
                      <div className="preview-pillars-grid" style={{ marginTop: '12px' }}>
                        {currentChallenge.subFields.map((sf, sfIdx) => (
                          <div
                            key={`${sf.label}-${sfIdx}`}
                            className={`preview-pillar ${sfIdx % 2 === 0 ? 'preview-pillar--forensic' : 'preview-pillar--tech'}`}
                          >
                            <span className={`pillar-tag ${sfIdx % 2 === 0 ? 'pillar-tag--forensic' : 'pillar-tag--tech'}`}>
                              {sf.label || `SECTION ${sfIdx + 1}`}
                            </span>
                            <p>{sf.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Team Members — Horizontal Add-One-By-One & In-Place Edit Flow */}
          <div className="form-card-section">
            <div className="form-card-header">
              <span className="step-num-badge">STEP 02</span>
              <div>
                <h2 className="form-section-title">Add Team Members</h2>
                <p className="form-section-desc">
                  Fill in each member's details and click <strong>+ Add Member</strong> to confirm.
                  Exactly <strong>6 members</strong> required (2 Forensic / CSDF · 2 Engineering · 2 Open).
                </p>
              </div>
            </div>

            {/* Progress tracker */}
            <div className="member-progress-track">
              {members.map((m, idx) => {
                const isConfirmed = idx < confirmedCount;
                const isCurrent = editingIdx !== null ? idx === editingIdx : idx === confirmedCount;
                const tierDot = m.tier === 'forensic' ? '#1e3a5f' : m.tier === 'engineering' ? '#1a4731' : '#4a1942';
                return (
                  <div
                    key={idx}
                    className={`progress-step ${isConfirmed && editingIdx !== idx ? 'progress-step--done' : isCurrent ? 'progress-step--active' : ''}`}
                    onClick={() => {
                      if (isConfirmed) setEditingIdx(idx);
                    }}
                    style={{ cursor: isConfirmed ? 'pointer' : 'default' }}
                    title={isConfirmed ? `Click to edit ${m.name || `Member ${idx + 1}`}` : `Member ${idx + 1}`}
                  >
                    <span
                      className="progress-step-dot"
                      style={{
                        background: isConfirmed && editingIdx !== idx ? tierDot : isCurrent ? '#ff5500' : '#e2e8f0',
                        borderColor: isCurrent ? '#ff5500' : 'transparent'
                      }}
                    >
                      {isConfirmed && editingIdx !== idx ? '✓' : idx + 1}
                    </span>
                    <span className="progress-step-label">
                      {editingIdx === idx
                        ? 'Editing'
                        : isConfirmed
                        ? (m.name ? m.name.split(' ')[0] : `M${idx + 1}`)
                        : isCurrent
                        ? 'Filling...'
                        : `M${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Confirmed Members List (with in-place editing) */}
            {confirmedCount > 0 && (
              <div className="added-members-list">
                {members.slice(0, confirmedCount).map((m, idx) => {
                  const isForensic = m.tier === 'forensic';
                  const isEngineering = m.tier === 'engineering';
                  const branchOptions = isForensic
                    ? FORENSIC_BRANCH_OPTIONS
                    : isEngineering
                    ? ENGINEERING_BRANCH_OPTIONS
                    : OPEN_BRANCH_OPTIONS;
                  const tierLabel = isForensic
                    ? 'Forensic Science / CSDF'
                    : isEngineering
                    ? 'Engineering & Allied'
                    : 'Open Discipline';
                  const tierColor = isForensic ? '#1e3a5f' : isEngineering ? '#1a4731' : '#4a1942';

                  // If this member is currently being edited, render its open form in-place!
                  if (editingIdx === idx) {
                    const handleSaveEdit = () => {
                      const errors = {};
                      if (!m.rollNo.trim()) errors[`member_${idx}_rollNo`] = 'Roll number is required.';
                      if (!m.name.trim()) errors[`member_${idx}_name`] = 'Full name is required.';
                      if (!m.email.trim()) errors[`member_${idx}_email`] = 'Email address is required.';
                      else if (!m.email.includes('@')) errors[`member_${idx}_email`] = 'Enter a valid email address.';
                      if (m.isLead && !m.phone.trim()) errors[`member_${idx}_phone`] = 'Phone number is required for the Team Leader.';

                      if (Object.keys(errors).length > 0) {
                        setValidationErrors((prev) => ({ ...prev, ...errors }));
                        return;
                      }

                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        ['rollNo', 'name', 'email', 'phone'].forEach((f) => delete next[`member_${idx}_${f}`]);
                        return next;
                      });
                      setEditingIdx(null);
                      persistTeamDraft(members, teamName);
                    };

                    return (
                      <div className="member-inline-form member-inline-form--editing" style={{ borderTop: `3px solid ${tierColor}` }} key={idx}>
                        <div className="member-inline-header">
                          <span
                            className="member-num-circle"
                            style={{ background: tierColor, color: '#fff', fontSize: '13px', fontWeight: 800 }}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <strong className="member-tier-label">{tierLabel}</strong>
                            {m.isLead && <span className="lead-tag" style={{ marginLeft: '10px' }}>TEAM LEADER</span>}
                            <span className="lead-tag" style={{ marginLeft: '10px', background: '#0a0d14' }}>EDITING</span>
                          </div>
                          <span className="member-inline-progress">Editing Member {idx + 1} of 6</span>
                        </div>

                        <div className="member-inline-fields">
                          <div className="form-field-group">
                            <label className="form-label required">Roll No</label>
                            <input
                              type="text"
                              className={`form-input ${lookupStatuses[idx]?.status === 'found' ? 'form-input--verified' : ''} ${validationErrors[`member_${idx}_rollNo`] ? 'form-input--error' : ''}`}
                              placeholder="e.g. 22A91A..."
                              value={m.rollNo}
                              onChange={(e) => handleMemberChange(idx, 'rollNo', e.target.value.toUpperCase())}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  triggerStudentLookup(idx, e.currentTarget.value, true);
                                }
                              }}
                              onBlur={(e) => triggerStudentLookup(idx, e.target.value, false)}
                              autoComplete="off"
                            />
                            {lookupStatuses[idx]?.status === 'loading' && (
                              <span className="lookup-pill lookup-pill--loading">
                                <span className="lookup-spinner" /> Fetching...
                              </span>
                            )}
                            {lookupStatuses[idx]?.status === 'found' && (
                              <span className="lookup-pill lookup-pill--found">
                                ✓ {lookupStatuses[idx].studentName}
                              </span>
                            )}
                            {lookupStatuses[idx]?.status === 'not_found' && (
                              <span className="lookup-pill lookup-pill--manual">
                                {lookupStatuses[idx].message || 'Not found — enter manually'}
                              </span>
                            )}
                            {validationErrors[`member_${idx}_rollNo`] && (
                              <span className="form-error-msg">{validationErrors[`member_${idx}_rollNo`]}</span>
                            )}
                          </div>

                          <div className="form-field-group">
                            <label className="form-label required">Full Name</label>
                            <input
                              type="text"
                              className={`form-input ${validationErrors[`member_${idx}_name`] ? 'form-input--error' : ''}`}
                              placeholder="Student Full Name"
                              value={m.name}
                              onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                              autoComplete="off"
                            />
                            {validationErrors[`member_${idx}_name`] && (
                              <span className="form-error-msg">{validationErrors[`member_${idx}_name`]}</span>
                            )}
                          </div>

                          <div className="form-field-group">
                            <label className="form-label required">Email</label>
                            <input
                              type="email"
                              className={`form-input ${validationErrors[`member_${idx}_email`] ? 'form-input--error' : ''}`}
                              placeholder="roll@aditya.ac.in"
                              value={m.email}
                              onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                              autoComplete="off"
                            />
                            {validationErrors[`member_${idx}_email`] && (
                              <span className="form-error-msg">{validationErrors[`member_${idx}_email`]}</span>
                            )}
                          </div>

                          <div className="form-field-group">
                            <label className="form-label required">Branch</label>
                            <select
                              className="form-select"
                              value={m.branch}
                              onChange={(e) => handleMemberChange(idx, 'branch', e.target.value)}
                            >
                              {branchOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-field-group">
                            <label className="form-label required">Year</label>
                            <select
                              className="form-select"
                              value={m.year}
                              onChange={(e) => handleMemberChange(idx, 'year', e.target.value)}
                            >
                              {YEAR_OPTIONS.map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-field-group">
                            <label className={`form-label ${m.isLead ? 'required' : ''}`}>
                              Phone {m.isLead && <span style={{ color: '#ff5500' }}>*</span>}
                            </label>
                            <input
                              type="tel"
                              className={`form-input ${validationErrors[`member_${idx}_phone`] ? 'form-input--error' : ''}`}
                              placeholder={m.isLead ? 'Primary contact' : '10-digit (optional)'}
                              maxLength={10}
                              value={m.phone}
                              onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                            />
                            {validationErrors[`member_${idx}_phone`] && (
                              <span className="form-error-msg">{validationErrors[`member_${idx}_phone`]}</span>
                            )}
                          </div>
                        </div>

                        <div className="member-inline-actions">
                          <button
                            type="button"
                            className="add-member-btn"
                            onClick={handleSaveEdit}
                          >
                            ✓ Save Changes
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            style={{ minHeight: '44px', padding: '10px 18px', fontSize: '13px' }}
                            onClick={() => {
                              setEditingIdx(null);
                              setValidationErrors((prev) => {
                                const next = { ...prev };
                                ['rollNo', 'name', 'email', 'phone'].forEach((f) => delete next[`member_${idx}_${f}`]);
                                return next;
                              });
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Closed summary row
                  const tierColors = { forensic: '#1e3a5f', engineering: '#1a4731', open: '#4a1942' };
                  const tierLabels = { forensic: 'Forensic', engineering: 'Engineering', open: 'Open' };
                  return (
                    <div
                      key={idx}
                      className="added-member-row"
                      style={{ borderLeft: `4px solid ${tierColors[m.tier] || '#ff5500'}` }}
                    >
                      <span className="added-member-num">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="added-member-info">
                        <strong>{m.name || '—'}</strong>
                        <span>
                          {m.rollNo || '—'} · {tierLabels[m.tier]} · {m.branch} · {m.year}
                          {m.phone ? ` · ${m.phone}` : ''}
                        </span>
                      </div>
                      {m.isLead && (
                        <span className="lead-tag" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                          TEAM LEADER
                        </span>
                      )}
                      <button
                        type="button"
                        className="member-edit-btn"
                        onClick={() => setEditingIdx(idx)}
                        title={`Edit Member ${idx + 1}`}
                      >
                        ✎ Edit
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* If currently editing an existing member, show hint */}
            {editingIdx !== null && confirmedCount < 6 && (
              <div className="editing-mode-banner">
                <span>
                  Currently editing Member 0{editingIdx + 1}. Click <strong>✓ Save Changes</strong> or <strong>Cancel</strong> above to continue adding new members.
                </span>
              </div>
            )}

            {/* Form to add next new member (shown only when not currently editing an earlier member) */}
            {confirmedCount < 6 && editingIdx === null && (() => {
              const idx = confirmedCount;
              const m = members[idx];
              const isForensic = m.tier === 'forensic';
              const isEngineering = m.tier === 'engineering';
              const branchOptions = isForensic
                ? FORENSIC_BRANCH_OPTIONS
                : isEngineering
                ? ENGINEERING_BRANCH_OPTIONS
                : OPEN_BRANCH_OPTIONS;
              const tierLabel = isForensic
                ? 'Forensic Science / CSDF'
                : isEngineering
                ? 'Engineering & Allied'
                : 'Open Discipline';
              const tierColor = isForensic ? '#1e3a5f' : isEngineering ? '#1a4731' : '#4a1942';

              const handleAddMember = () => {
                const errors = {};
                if (!m.rollNo.trim()) errors[`member_${idx}_rollNo`] = 'Roll number is required.';
                if (!m.name.trim()) errors[`member_${idx}_name`] = 'Full name is required.';
                if (!m.email.trim()) errors[`member_${idx}_email`] = 'Email address is required.';
                else if (!m.email.includes('@')) errors[`member_${idx}_email`] = 'Enter a valid email address.';
                if (m.isLead && !m.phone.trim()) errors[`member_${idx}_phone`] = 'Phone number is required for the Team Leader.';

                if (Object.keys(errors).length > 0) {
                  setValidationErrors((prev) => ({ ...prev, ...errors }));
                  return;
                }

                setValidationErrors((prev) => {
                  const next = { ...prev };
                  ['rollNo', 'name', 'email', 'phone'].forEach((f) => delete next[`member_${idx}_${f}`]);
                  delete next.remainingMembers;
                  return next;
                });
                setConfirmedCount((prev) => Math.max(prev, idx + 1));
                persistTeamDraft(members, teamName);
              };

              const isLastMember = idx === 5;

              return (
                <div className="member-inline-form" style={{ borderTop: `3px solid ${tierColor}` }}>
                  <div className="member-inline-header">
                    <span
                      className="member-num-circle"
                      style={{ background: tierColor, color: '#fff', fontSize: '13px', fontWeight: 800 }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <strong className="member-tier-label">{tierLabel}</strong>
                      {m.isLead && <span className="lead-tag" style={{ marginLeft: '10px' }}>TEAM LEADER</span>}
                    </div>
                    <span className="member-inline-progress">{idx + 1} of 6</span>
                  </div>

                  <div className="member-inline-fields">
                    <div className="form-field-group">
                      <label className="form-label required">Roll No</label>
                      <input
                        type="text"
                        className={`form-input ${lookupStatuses[idx]?.status === 'found' ? 'form-input--verified' : ''} ${validationErrors[`member_${idx}_rollNo`] ? 'form-input--error' : ''}`}
                        placeholder="e.g. 22A91A..."
                        value={m.rollNo}
                        onChange={(e) => handleMemberChange(idx, 'rollNo', e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            triggerStudentLookup(idx, e.currentTarget.value, true);
                          }
                        }}
                        onBlur={(e) => triggerStudentLookup(idx, e.target.value, false)}
                        autoComplete="off"
                      />
                      {lookupStatuses[idx]?.status === 'loading' && (
                        <span className="lookup-pill lookup-pill--loading">
                          <span className="lookup-spinner" /> Fetching...
                        </span>
                      )}
                      {lookupStatuses[idx]?.status === 'found' && (
                        <span className="lookup-pill lookup-pill--found">
                          ✓ {lookupStatuses[idx].studentName}
                        </span>
                      )}
                      {lookupStatuses[idx]?.status === 'not_found' && (
                        <span className="lookup-pill lookup-pill--manual">
                          {lookupStatuses[idx].message || 'Not found — enter manually'}
                        </span>
                      )}
                      {validationErrors[`member_${idx}_rollNo`] && (
                        <span className="form-error-msg">{validationErrors[`member_${idx}_rollNo`]}</span>
                      )}
                    </div>

                    <div className="form-field-group">
                      <label className="form-label required">Full Name</label>
                      <input
                        type="text"
                        className={`form-input ${validationErrors[`member_${idx}_name`] ? 'form-input--error' : ''}`}
                        placeholder="Student Full Name"
                        value={m.name}
                        onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                        autoComplete="off"
                      />
                      {validationErrors[`member_${idx}_name`] && (
                        <span className="form-error-msg">{validationErrors[`member_${idx}_name`]}</span>
                      )}
                    </div>

                    <div className="form-field-group">
                      <label className="form-label required">Email</label>
                      <input
                        type="email"
                        className={`form-input ${validationErrors[`member_${idx}_email`] ? 'form-input--error' : ''}`}
                        placeholder="roll@aditya.ac.in"
                        value={m.email}
                        onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                        autoComplete="off"
                      />
                      {validationErrors[`member_${idx}_email`] && (
                        <span className="form-error-msg">{validationErrors[`member_${idx}_email`]}</span>
                      )}
                    </div>

                    <div className="form-field-group">
                      <label className="form-label required">Branch</label>
                      <select
                        className="form-select"
                        value={m.branch}
                        onChange={(e) => handleMemberChange(idx, 'branch', e.target.value)}
                      >
                        {branchOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label className="form-label required">Year</label>
                      <select
                        className="form-select"
                        value={m.year}
                        onChange={(e) => handleMemberChange(idx, 'year', e.target.value)}
                      >
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label className={`form-label ${m.isLead ? 'required' : ''}`}>
                        Phone {m.isLead && <span style={{ color: '#ff5500' }}>*</span>}
                      </label>
                      <input
                        type="tel"
                        className={`form-input ${validationErrors[`member_${idx}_phone`] ? 'form-input--error' : ''}`}
                        placeholder={m.isLead ? 'Primary contact' : '10-digit (optional)'}
                        maxLength={10}
                        value={m.phone}
                        onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                      />
                      {validationErrors[`member_${idx}_phone`] && (
                        <span className="form-error-msg">{validationErrors[`member_${idx}_phone`]}</span>
                      )}
                    </div>
                  </div>

                  <div className="member-inline-actions">
                    <button
                      type="button"
                      className="add-member-btn"
                      onClick={handleAddMember}
                    >
                      {isLastMember ? '✓ Confirm Last Member' : `+ Add Member ${idx + 1} of 6`}
                    </button>
                    <span className="add-member-hint">
                      {isLastMember
                        ? 'Confirming will complete your 6-member squad.'
                        : `${5 - idx} more member${5 - idx !== 1 ? 's' : ''} to add after this.`}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* All 6 confirmed notice */}
            {confirmedCount === 6 && editingIdx === null && (
              <div className="all-members-added-notice">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                All remaining 5 team members completed (6/6 squad). Scroll down to complete Razorpay payment.
              </div>
            )}

            {/* Save Team Draft Status & Action Bar */}
            <div className="team-save-bar">
              <div className="team-save-meta">
                <span>
                  Remaining 5 Members Completed: <strong>{remainingFilledCount} / 5</strong>
                </span>
                {saveNotice && (
                  <div style={{ color: '#166534', marginTop: '4px', fontSize: '12.5px' }}>{saveNotice}</div>
                )}
                {saveError && (
                  <div style={{ color: '#dc2626', marginTop: '4px', fontSize: '12.5px' }}>{saveError}</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button secondary"
                  style={{ minHeight: '40px', padding: '8px 16px', fontSize: '13px' }}
                  disabled={savingDraft}
                  onClick={() => persistTeamDraft(members, teamName)}
                >
                  {savingDraft ? 'Saving...' : 'Save Team Details to Database'}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  style={{ minHeight: '40px', padding: '8px 16px', fontSize: '13px', borderColor: '#ff5500', color: '#c2410c' }}
                  disabled={savingDraft}
                  onClick={async () => {
                    await persistTeamDraft(members, teamName);
                    handleLogout();
                  }}
                >
                  Save &amp; Logout (Pay Later) ↪
                </button>
              </div>
            </div>
          </div>

          {/* STEP 3: Razorpay Payment Gateway & Submission */}
          <div className="form-card-section">
            <div className="form-card-header">
              <span className="step-num-badge">STEP 03</span>
              <div>
                <h2 className="form-section-title">Online Payment &amp; Submission</h2>
                <p className="form-section-desc">
                  Registration fee is ₹{effectiveFeeAmount} per team. Payment is enabled only after all remaining 5 team members are filled.
                </p>
              </div>
            </div>

            <div className={`payment-gate-banner ${allRemainingFiveFilled ? 'payment-gate-banner--unlocked' : 'payment-gate-banner--locked'}`} data-error-key="remainingMembers">
              {allRemainingFiveFilled ? (
                <span>
                  ✓ All remaining 5 team members (Members 02–06) are filled and saved. Razorpay payment is now enabled!
                </span>
              ) : (
                <span>
                  🔒 Payment disabled: Please fill and confirm all <strong>5 remaining team members</strong> in Step 02 ({remainingFilledCount}/5 completed) to enable Razorpay payment.
                </span>
              )}
            </div>

            <div className="payment-gateway-container">
              <div className="payment-summary-box">
                <div className="gateway-badge-row">
                  <span className="gateway-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    SECURED BY RAZORPAY
                  </span>
                  <span className="fee-tag">₹{effectiveFeeAmount}.00 · TEAM REGISTRATION</span>
                </div>

                <div className="payment-details-row">
                  <div>
                    <span className="pay-label">EVENT REGISTRATION</span>
                    <h3 className="pay-title">FORENSITHON 2k26 · Six Builders Squad</h3>
                    <p className="pay-desc">
                      One payment of ₹{effectiveFeeAmount} covers all 6 registered team members. Instant online verification.
                    </p>
                  </div>
                  <div className="payment-amount-display">
                    <span className="amount-currency">INR</span>
                    <strong className="amount-number">₹{effectiveFeeAmount}</strong>
                    <span className="amount-sub">Fixed team fee</span>
                  </div>
                </div>

                <div className="payment-methods-strip">
                  <span className="methods-label">Accepted Payment Modes:</span>
                  <div className="methods-pills">
                    <span className="method-pill">UPI (GPay / PhonePe / Paytm / BHIM)</span>
                    <span className="method-pill">Credit &amp; Debit Cards</span>
                    <span className="method-pill">Net Banking</span>
                    <span className="method-pill">Wallets</span>
                  </div>
                </div>
              </div>

              <div className="payment-terms-box">
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

              {paymentErrorMessage && (
                <div className="payment-error-alert" role="alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{paymentErrorMessage}</span>
                </div>
              )}
            </div>

            <div className="form-submit-row">
              <button
                type="submit"
                className="button submit-registration-btn"
                disabled={!allRemainingFiveFilled || isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <span className="btn-loading-flex">
                    <span className="spinner" /> Connecting to Razorpay Gateway...
                  </span>
                ) : !allRemainingFiveFilled ? (
                  `Pay ₹${effectiveFeeAmount} Disabled (${remainingFilledCount}/5 Remaining Members Filled)`
                ) : (
                  `Pay ₹${effectiveFeeAmount} via Razorpay & Complete Registration →`
                )}
              </button>
              <p className="submit-hint">
                {allRemainingFiveFilled
                  ? 'A secure Razorpay payment window will open. Upon payment verification, full team details are saved in central_event_student_payments.'
                  : 'Complete all remaining 5 members above in Step 02 to unlock the Razorpay payment button.'}
              </p>
            </div>
          </div>
        </form>
          </>
        )}
      </section>
    </main>
  );
}
