import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  fetchForensithonCatalog,
  fetchStudentByRollNumber,
  getStoredTeamLeader,
  saveStoredTeamLeader,
  clearStoredTeamLeader,
  refreshLoggedInStudent,
  registerTeamLeaderAccount,
  loginTeamLeaderAccount,
  fetchTeamLeaderState,
  checkForensithonMembersEligibility,
  saveTeamMembersDraft,
  createForensithonOrder,
  verifyForensithonPayment,
  findPaidEventForChallenge
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
  'Other Engineering Branch'
];

const OPEN_BRANCH_OPTIONS = [
  'School of Management Studies (BBA / MBA)',
  'School of Pharmacy (B.Pharm / M.Pharm)',
  'School of Sciences (Biotechnology / Microbiology / Chemistry)',
  'School of Agricultural Sciences',
  'Humanities, Social Sciences & Languages',
  'Other University Department'
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate (PG)'];
const GENDER_OPTIONS = ['Male', 'Female'];

export const determineTierFromBranch = (branchName = '') => {
  const b = (branchName || '').toLowerCase();
  if (
    b.includes('forensic') ||
    b.includes('csdf') ||
    b.includes('digital forensic') ||
    b.includes('cyber security and digital') ||
    b === 'fs' ||
    b === 'cfs'
  ) {
    return 'forensic';
  }
  if (
    b.includes('engineering') ||
    b.includes('b.tech') ||
    b.includes('btech') ||
    b.includes('computer') ||
    b.includes('cse') ||
    b.includes('it') ||
    b.includes('electronics') ||
    b.includes('ece') ||
    b.includes('electrical') ||
    b.includes('eee') ||
    b.includes('mech') ||
    b.includes('civil') ||
    b.includes('petro') ||
    b.includes('chem') ||
    b.includes('agri') ||
    b.includes('aiml') ||
    b.includes('data science') ||
    b.includes('ds') ||
    b.includes('ai &') ||
    b.includes('ai and')
  ) {
    return 'engineering';
  }
  return 'open';
};

export const getTierTitle = (tier) => {
  if (tier === 'forensic') return 'Forensic Science / CSDF';
  if (tier === 'engineering') return 'Engineering & Allied';
  return 'Open Discipline';
};

export const resolveStudentBranch = (student, roll = '') => {
  const rawBranch = (
    student?.branch ||
    student?.department ||
    student?.branchname ||
    student?.departmentname ||
    student?.course ||
    student?.coursename ||
    ''
  ).trim();

  const b = rawBranch.toLowerCase();
  const c = (student?.coursename || student?.course || '').toLowerCase();
  const r = (roll || student?.rollNo || student?.roll || '').toUpperCase();

  // 1. Forensic Science & CSDF
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

  // 3. Open Disciplines / Sciences / Management / Pharmacy / Humanities
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
};

const resolveStudentYear = (student, roll = '') => {
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
};

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

export const resolveStudentGender = (student) => {
  const raw = String(student?.gender || student?.Gender || student?.sex || student?.Sex || '').trim().toLowerCase();
  if (raw === 'f' || raw.startsWith('fem') || raw.includes('woman') || raw.includes('girl')) {
    return 'Female';
  }
  if (raw === 'm' || raw.startsWith('mal') || raw.includes('man') || raw.includes('boy')) {
    return 'Male';
  }
  return 'Male';
};

const createInitialMembers = (leadStudent = null) => {
  const leader = leadStudent || getStoredTeamLeader();
  const leadRoll = leader ? String(leader.roll || leader.rollNo || '').trim().toUpperCase() : '';
  const leadRawBranch = leader?.branch || leader?.department || '';
  const leadBranch = leadRoll
    ? (resolveStudentBranch(leader, leadRoll) || leadRawBranch || 'Mechanical Engineering')
    : (leadRawBranch || 'Mechanical Engineering');
  const leadTier = determineTierFromBranch(leadBranch);
  const leadYear = leader?.year || (leadRoll ? resolveStudentYear(leader, leadRoll) : '4th Year');
  const leadGender = resolveStudentGender(leader);
  const leadName = leader ? String(leader.name || leader.studentname || leader.studentName || '').trim() : '';
  const leadEmail = leader
    ? String(leader.email || (leadRoll ? `${leadRoll.toLowerCase()}@aditya.ac.in` : '')).trim().toLowerCase()
    : '';
  const leadPhone = leader ? String(leader.phone || leader.mobile || '').trim() : '';

  return [
    {
      id: 1,
      tier: leadTier,
      tierTitle: getTierTitle(leadTier),
      isLead: true,
      rollNo: leadRoll,
      name: leadName,
      email: leadEmail,
      branch: leadBranch,
      year: leadYear,
      gender: leadGender,
      phone: leadPhone
    },
    {
      id: 2,
      tier: 'forensic',
      tierTitle: 'Forensic Science / CSDF',
      isLead: false,
      rollNo: '',
      name: '',
      email: '',
      branch: 'B.Sc Forensic Science',
      year: '3rd Year',
      gender: 'Male',
      phone: ''
    },
    {
      id: 3,
      tier: 'engineering',
      tierTitle: 'Engineering & Allied',
      isLead: false,
      rollNo: '',
      name: '',
      email: '',
      branch: 'Computer Science & Engineering (CSE)',
      year: '3rd Year',
      gender: 'Male',
      phone: ''
    },
    {
      id: 4,
      tier: 'engineering',
      tierTitle: 'Engineering & Allied',
      isLead: false,
      rollNo: '',
      name: '',
      email: '',
      branch: 'Information Technology (IT)',
      year: '3rd Year',
      gender: 'Male',
      phone: ''
    },
    {
      id: 5,
      tier: 'open',
      tierTitle: 'Open Discipline',
      isLead: false,
      rollNo: '',
      name: '',
      email: '',
      branch: 'School of Management Studies (BBA / MBA)',
      year: '3rd Year',
      gender: 'Male',
      phone: ''
    },
    {
      id: 6,
      tier: 'open',
      tierTitle: 'Open Discipline',
      isLead: false,
      rollNo: '',
      name: '',
      email: '',
      branch: 'School of Sciences (Biotechnology / Microbiology / Chemistry)',
      year: '3rd Year',
      gender: 'Male',
      phone: ''
    }
  ];
};

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialChallengeId = searchParams.get('challenge');

  const [catalog, setCatalog] = useState({ domains: [], challenges: [] });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  // Team Leader 2-Tab Auth State (Register -> central_event_student_account, Login)
  const [loggedInLeader, setLoggedInLeader] = useState(() => getStoredTeamLeader());
  const authQueryParam = searchParams.get('auth') || searchParams.get('mode');
  const [authMode, setAuthMode] = useState(() => (authQueryParam === 'login' ? 'login' : 'register'));
  const [registerForm, setRegisterForm] = useState(createInitialRegisterForm);
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLookupStatus, setAuthLookupStatus] = useState({ status: 'idle', message: '', studentName: '' });
  const authLookupTimerRef = useRef(null);

  // Open login popup if URL query requests auth (e.g. /registration?auth=login)
  useEffect(() => {
    const q = searchParams.get('auth') || searchParams.get('mode');
    if (q === 'login' || q === 'register') {
      window.dispatchEvent(new Event('open-forensithon-login'));
    }
  }, [searchParams]);

  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [teamName, setTeamName] = useState(() => getStoredTeamLeader()?.teamName || '');
  const [members, setMembers] = useState(() => createInitialMembers());
  const [confirmedCount, setConfirmedCount] = useState(() => (getStoredTeamLeader() ? 1 : 0)); // 0..6
  const [editingIdx, setEditingIdx] = useState(null); // which confirmed member is currently open for in-place editing
  const [agreed, setAgreed] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null);
  const [paidEvents, setPaidEvents] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStage, setPaymentStage] = useState('idle'); // 'idle' | 'creating_order' | 'awaiting_checkout' | 'verifying'
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('');
  const paymentHandlerTriggeredRef = useRef(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [syncingTeamState, setSyncingTeamState] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [saveError, setSaveError] = useState('');

  // Lookup statuses per member index (0 to 5)
  const [lookupStatuses, setLookupStatuses] = useState(() =>
    Array(6).fill({ status: 'idle', studentName: '', message: '' })
  );
  const lookupTimeouts = useRef({});
  const lastFetchedRollRef = useRef({});
  const initialSyncDoneRef = useRef(false);
  const paymentSectionRef = useRef(null);
  const unauthPromptFiredRef = useRef(false);

  // Automatically prompt login if user lands on registration page unauthenticated
  useEffect(() => {
    if (!loggedInLeader && !getStoredTeamLeader() && !unauthPromptFiredRef.current) {
      unauthPromptFiredRef.current = true;
      window.dispatchEvent(new CustomEvent('open-forensithon-login', {
        detail: { mode: 'login' }
      }));
    }
  }, [loggedInLeader]);

  const buildMembersWithLeader = useCallback((student, savedReg = null, existingMembers = null) => {
    const activeLead = student || loggedInLeader || getStoredTeamLeader() || {};
    const rawSavedLead = savedReg?.teamLead || savedReg?.participants?.[0] || null;
    const hasValidSavedLead = Boolean(
      rawSavedLead && String(rawSavedLead.rollNo || rawSavedLead.roll || rawSavedLead.name || '').trim()
    );
    const savedLead = hasValidSavedLead ? rawSavedLead : null;

    const leadRoll = String(
      activeLead.roll ||
      activeLead.rollNo ||
      savedLead?.rollNo ||
      savedLead?.rollNumber ||
      savedLead?.roll ||
      ''
    ).trim().toUpperCase();

    const leadName = String(
      activeLead.name ||
      activeLead.studentname ||
      activeLead.studentName ||
      savedLead?.name ||
      savedLead?.studentName ||
      ''
    ).trim();

    const leadEmail = String(
      activeLead.email ||
      savedLead?.email ||
      (leadRoll ? `${leadRoll.toLowerCase()}@aditya.ac.in` : '')
    ).trim().toLowerCase();

    const leadPhone = String(
      activeLead.mobile ||
      activeLead.phone ||
      savedLead?.mobile ||
      savedLead?.phone ||
      ''
    ).trim();

    const leadRawBranch = activeLead.branch || activeLead.department || savedLead?.branch || savedLead?.department || '';
    const leadBranch = resolveStudentBranch(activeLead, leadRoll) || leadRawBranch || 'Mechanical Engineering';
    const leadTier = determineTierFromBranch(leadBranch);
    const leadYear = activeLead.year || savedLead?.year || resolveStudentYear(activeLead, leadRoll) || '4th Year';
    const leadGender = activeLead.gender || savedLead?.gender || resolveStudentGender(activeLead);

    const base = createInitialMembers(activeLead);
    base[0] = {
      ...base[0],
      rollNo: leadRoll,
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      branch: leadBranch,
      year: leadYear,
      gender: leadGender,
      tier: leadTier,
      tierTitle: getTierTitle(leadTier)
    };

    const fallbackList = Array.isArray(existingMembers)
      ? existingMembers.slice(1, 6)
      : Array.isArray(members)
        ? members.slice(1, 6)
        : [];

    const remainingList = Array.isArray(savedReg?.teamMembers) && savedReg.teamMembers.length > 0
      ? savedReg.teamMembers
      : Array.isArray(savedReg?.participants) && savedReg.participants.length > 1
        ? savedReg.participants.slice(1, 6)
        : fallbackList;

    let consecutiveConfirmed = isMemberComplete(base[0]) ? 1 : 0;
    for (let i = 0; i < 5; i += 1) {
      const slot = remainingList[i];
      if (slot && (slot.rollNo || slot.roll || slot.name)) {
        const slotRoll = String(slot.rollNo || slot.rollNumber || slot.roll || '').trim().toUpperCase();
        const slotRawBranch = slot.branch || slot.department || '';
        const slotBranch = resolveStudentBranch(slot, slotRoll) || slotRawBranch || base[i + 1].branch;
        const slotTier = (i >= 3) ? 'open' : (slot.tier || determineTierFromBranch(slotBranch));
        const slotYear = slot.year || resolveStudentYear(slot, slotRoll) || base[i + 1].year;
        const slotGender = slot.gender || resolveStudentGender(slot) || 'Male';
        base[i + 1] = {
          ...base[i + 1],
          rollNo: slotRoll,
          name: String(slot.name || slot.studentName || '').trim(),
          email: String(slot.email || (slotRoll ? `${slotRoll.toLowerCase()}@aditya.ac.in` : '')).trim().toLowerCase(),
          phone: String(slot.phone || slot.mobile || '').trim(),
          branch: slotBranch,
          year: slotYear,
          gender: slotGender,
          tier: slotTier,
          tierTitle: getTierTitle(slotTier)
        };
      }
      if (consecutiveConfirmed === i + 1 && isMemberComplete(base[i + 1])) {
        consecutiveConfirmed += 1;
      }
    }

    return { nextMembers: base, nextConfirmedCount: Math.max(1, consecutiveConfirmed) };
  }, [loggedInLeader, members]);

  const buildSubmittedPayload = useCallback(
    (reg, pay, membersList, resolvedTeamName) => {
      const paidAtDate = pay?.paidAt || reg?.paidAt || reg?.payment?.paidAt || reg?.updatedAt || reg?.updated_at;
      const timestamp = paidAtDate
        ? new Date(paidAtDate).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        : new Date().toLocaleString('en-IN');

      const resolvedAmount =
        pay?.amountInPaise !== undefined && pay?.amountInPaise !== null
          ? Math.round(Number(pay.amountInPaise) / 100)
          : (pay?.amount || reg?.payment?.amount || reg?.fee?.amount || REGISTRATION_AMOUNT);

      return {
        regId: reg?.registrationNumber || pay?.registrationNumber || 'CONFIRMED',
        teamId: reg?.teamId || reg?.meta?.teamId || reg?.registrationNumber || '',
        paymentReference: pay?.paymentReference || reg?.payment?.paymentReference || '',
        timestamp,
        teamName: resolvedTeamName || reg?.teamName || 'Registered Team',
        domain: reg?.domainTitle || pay?.domainTitle || reg?.domainCode || 'Forensithon',
        challengeId: reg?.challengeId || pay?.challengeId || '',
        challengeTitle: reg?.challengeTitle || pay?.challengeTitle || reg?.eventTitle || '',
        forensicRole: reg?.forensicScope || '',
        technicalRole: reg?.technicalScope || '',
        members: membersList,
        razorpayOrderId: pay?.razorpay?.orderId || reg?.payment?.orderId || reg?.razorpayOrderId || '',
        razorpayPaymentId: pay?.razorpay?.paymentId || reg?.payment?.paymentId || reg?.razorpayPaymentId || '',
        amount: resolvedAmount,
        status: 'PAID & CONFIRMED · VERIFIED VIA RAZORPAY'
      };
    },
    []
  );

  const applyServerState = useCallback(
    (student, state, keepQueryChallenge = false, requestedChallengeParam = '') => {
      const serverPaidEvents = Array.isArray(state?.paidEvents) ? state.paidEvents : [];
      setPaidEvents(serverPaidEvents);

      const queryKey = String(requestedChallengeParam || '').trim().toUpperCase();
      const matchedPaidForQuery = queryKey
        ? serverPaidEvents.find((pe) => {
          const cid = String(pe.challengeId || pe.registration?.challengeId || '').trim().toUpperCase();
          const eid = String(pe.centralEventId || pe.registration?.centralEventId || '').trim().toUpperCase();
          const ttl = String(pe.challengeTitle || pe.eventTitle || '').trim().toUpperCase();
          return cid === queryKey || eid === queryKey || ttl === queryKey;
        })
        : null;

      // Case 1: User navigated specifically to an event (?challenge=...) whose payment status is ALREADY PAID
      // -> Block registration access for this event and show their confirmed PAID receipt.
      if (keepQueryChallenge && matchedPaidForQuery) {
        const paidReg = matchedPaidForQuery.registration || state?.registration || null;
        const paidPay = matchedPaidForQuery.payment || state?.payment || null;
        const resolvedTeamName = String(paidReg?.teamName || matchedPaidForQuery.teamName || student?.teamName || '').trim();
        setTeamName(resolvedTeamName);
        const { nextMembers, nextConfirmedCount } = buildMembersWithLeader(student, paidReg);
        setMembers(nextMembers);
        setConfirmedCount(nextConfirmedCount);
        setSubmittedData(buildSubmittedPayload(paidReg, paidPay, nextMembers, resolvedTeamName));
        return;
      }

      // Case 2: User clicked a DIFFERENT unpaid event (?challenge=DF-02) even though they paid for DF-01
      // -> Allow them to register for that unpaid event (restore matching pendingDraft if one exists)
      if (keepQueryChallenge && queryKey && !matchedPaidForQuery) {
        const draft = state?.pendingDraft || null;
        const draftMatchesQuery =
          draft &&
          (String(draft.challengeId || '').trim().toUpperCase() === queryKey ||
            String(draft.centralEventId || '').trim().toUpperCase() === queryKey);
        const regToLoad = draftMatchesQuery ? draft : null;
        const resolvedTeamName = String(regToLoad?.teamName || student?.teamName || '').trim();
        setTeamName(resolvedTeamName);
        const { nextMembers, nextConfirmedCount } = buildMembersWithLeader(student, regToLoad);
        setMembers(nextMembers);
        setConfirmedCount(nextConfirmedCount);
        setSubmittedData(null);
        return;
      }

      // Case 3: No query challenge — restore pending draft if present, else show confirmed PAID receipt
      const pendingDraft = state?.pendingDraft || null;
      if (pendingDraft) {
        const resolvedTeamName = String(pendingDraft.teamName || student?.teamName || '').trim();
        setTeamName(resolvedTeamName);
        const { nextMembers, nextConfirmedCount } = buildMembersWithLeader(student, pendingDraft);
        setMembers(nextMembers);
        setConfirmedCount(nextConfirmedCount);
        if (pendingDraft.domainCode) setSelectedDomain(String(pendingDraft.domainCode).toUpperCase());
        if (pendingDraft.challengeId) setSelectedChallengeId(String(pendingDraft.challengeId));
        setSubmittedData(null);
        return;
      }

      const reg = state?.registration || null;
      const pay = state?.payment || null;
      const resolvedTeamName = String(reg?.teamName || student?.teamName || '').trim();
      setTeamName(resolvedTeamName);

      const { nextMembers, nextConfirmedCount } = buildMembersWithLeader(student, reg);
      setMembers(nextMembers);
      setConfirmedCount(nextConfirmedCount);

      if (!keepQueryChallenge && reg) {
        if (reg.domainCode) setSelectedDomain(String(reg.domainCode).toUpperCase());
        if (reg.challengeId) setSelectedChallengeId(String(reg.challengeId));
      }

      const isConfirmedAndPaid = Boolean(
        state?.isConfirmedAndPaid ||
        serverPaidEvents.length > 0 ||
        String(reg?.status || '').toUpperCase() === 'CONFIRMED' ||
        String(reg?.payment?.status || '').toUpperCase() === 'PAID' ||
        String(pay?.status || '').toUpperCase() === 'PAID'
      );

      if (isConfirmedAndPaid && reg) {
        setSubmittedData(buildSubmittedPayload(reg, pay, nextMembers, resolvedTeamName));
      } else {
        setSubmittedData(null);
      }
    },
    [buildMembersWithLeader, buildSubmittedPayload]
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

  // Warn user if they try to refresh or close the browser tab while payment/verification is in progress
  useEffect(() => {
    if (paymentStage === 'idle') return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        'Payment is currently in progress. Please wait until confirmation completes and do NOT refresh or close this page.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [paymentStage]);

  // Restore & validate saved JWT token + Team Leader state across sessions/days
  useEffect(() => {
    const onAuthChanged = () => {
      const current = getStoredTeamLeader();
      if (!current && loggedInLeader) {
        initialSyncDoneRef.current = false;
        setLoggedInLeader(null);
        setSubmittedData(null);
        setPaidEvents([]);
        setTeamName('');
        setMembers(createInitialMembers());
        setConfirmedCount(0);
        setEditingIdx(null);
      } else if (current) {
        setLoggedInLeader(current);
        const { nextMembers, nextConfirmedCount } = buildMembersWithLeader(current);
        setMembers(nextMembers);
        setConfirmedCount((prev) => Math.max(prev, nextConfirmedCount));
      }
    };
    window.addEventListener('forensithon-auth-changed', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);
    return () => {
      window.removeEventListener('forensithon-auth-changed', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, [loggedInLeader, buildMembersWithLeader]);

  // Synchronize Member 01 once on initial leader load if Member 01 roll number is empty
  useEffect(() => {
    if (editingIdx !== null) return;
    const leader = loggedInLeader || getStoredTeamLeader();
    if (leader) {
      const leaderRoll = String(leader.roll || leader.rollNo || '').trim().toUpperCase();
      if (!leaderRoll) return;

      if (leader.teamName && !teamName) {
        setTeamName(leader.teamName);
      }

      setMembers((prev) => {
        const currentM0Roll = String(prev[0]?.rollNo || '').trim().toUpperCase();
        // If Member 01 already has a roll number, never overwrite it!
        if (currentM0Roll) return prev;

        const leadRawBranch = leader.branch || leader.department || '';
        const leadBranch = resolveStudentBranch(leader, leaderRoll) || leadRawBranch || 'Mechanical Engineering';
        const leadTier = determineTierFromBranch(leadBranch);
        const leadYear = leader.year || resolveStudentYear(leader, leaderRoll) || '4th Year';
        const leadGender = leader.gender || resolveStudentGender(leader);
        const leadName = String(leader.name || leader.studentname || leader.studentName || '').trim();
        const leadEmail = String(leader.email || `${leaderRoll.toLowerCase()}@aditya.ac.in`).trim().toLowerCase();
        const leadPhone = String(leader.phone || leader.mobile || '').trim();

        const copy = [...prev];
        copy[0] = {
          ...copy[0],
          rollNo: leaderRoll,
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          branch: leadBranch,
          year: leadYear,
          gender: leadGender,
          tier: leadTier,
          tierTitle: getTierTitle(leadTier)
        };
        return copy;
      });
      setConfirmedCount((prev) => Math.max(prev, 1));
    }
  }, [loggedInLeader, editingIdx]);

  const loggedInRoll = loggedInLeader?.roll ? String(loggedInLeader.roll).trim().toUpperCase() : '';

  useEffect(() => {
    if (!loggedInRoll || initialSyncDoneRef.current) return;
    initialSyncDoneRef.current = true;
    let active = true;
    setSyncingTeamState(true);

    refreshLoggedInStudent()
      .then(async (verifiedStudent) => {
        if (!active) return;
        if (!verifiedStudent) {
          handleLogout();
          return;
        }
        const rollToFetch = String(verifiedStudent.roll || loggedInRoll).trim().toUpperCase();
        const state = await fetchTeamLeaderState(rollToFetch).catch(() => null);
        if (!active) return;

        setLoggedInLeader(state?.account || verifiedStudent);
        if (state) {
          applyServerState(state.account || verifiedStudent, state, Boolean(initialChallengeId), initialChallengeId || '');
        } else {
          applyServerState(verifiedStudent, null, Boolean(initialChallengeId), initialChallengeId || '');
        }
      })
      .catch((err) => {
        console.warn('Could not sync Team Leader session:', err);
      })
      .finally(() => {
        if (active) setSyncingTeamState(false);
      });

    return () => {
      active = false;
    };
  }, [loggedInRoll, applyServerState, initialChallengeId]);

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

      if (student && student.alreadyRegistered) {
        lastFetchedRollRef.current[index] = cleanRoll;
        const studentName = (student.studentname || student.studentName || student.name || cleanRoll).trim();
        setLookupStatuses((prev) => {
          const copy = [...prev];
          copy[index] = {
            status: 'already_registered',
            studentName,
            message: `Already registered in team "${student.teamName}" for ${student.eventTitle}!`
          };
          return copy;
        });
        setValidationErrors((prev) => ({
          ...prev,
          [`member_${index}_rollNo`]: `Already Registered: ${studentName} (${cleanRoll}) is already registered in team "${student.teamName}" for "${student.eventTitle}". Registered students cannot register again.`
        }));
        return;
      }

      if (student && !student.error && (student.studentname || student.studentName || student.name)) {
        lastFetchedRollRef.current[index] = cleanRoll;
        const studentName = (student.studentname || student.studentName || student.name || '').trim();
        const phone = (student.mobilenumber || student.MobileNumber || student.mobile || student.phone || student.fathermobilenumber || '').trim();
        const rawEmail = (student.emailid || student.email || student.Email || student.EmailId || '').trim();
        const defaultStudentEmail = cleanRoll ? `${cleanRoll.toLowerCase()}@aditya.ac.in` : '';
        const resolvedEmail = (rawEmail || defaultStudentEmail).toLowerCase();

        const mappedBranch = resolveStudentBranch(student, cleanRoll);
        const mappedYear = resolveStudentYear(student, cleanRoll);
        const mappedTier = (index >= 4) ? 'open' : determineTierFromBranch(mappedBranch);
        const mappedGender = resolveStudentGender(student);

        setMembers((prev) => {
          const copy = [...prev];
          copy[index] = {
            ...copy[index],
            name: studentName || copy[index].name,
            email: resolvedEmail,
            branch: mappedBranch || copy[index].branch,
            year: mappedYear || copy[index].year,
            gender: mappedGender || copy[index].gender || 'Male',
            phone: phone || copy[index].phone,
            tier: mappedTier,
            tierTitle: getTierTitle(mappedTier)
          };
          return copy;
        });

        setLookupStatuses((prev) => {
          const copy = [...prev];
          copy[index] = {
            status: 'found',
            studentName,
            branch: mappedBranch,
            course: mappedTier,
            message: `✓ ${studentName} (${mappedBranch} · ${mappedYear})`
          };
          return copy;
        });

        // Clear errors for this student
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[`member_${index}_rollNo`];
          delete next[`member_${index}_name`];
          if (resolvedEmail) delete next[`member_${index}_email`];
          if (phone) delete next[`member_${index}_phone`];
          return next;
        });
      } else {
        const fallbackBranch = resolveStudentBranch(null, cleanRoll);
        const fallbackYear = resolveStudentYear(null, cleanRoll);
        const fallbackTier = (index >= 4) ? 'open' : determineTierFromBranch(fallbackBranch);

        setMembers((prev) => {
          const copy = [...prev];
          copy[index] = {
            ...copy[index],
            email: copy[index].email || `${cleanRoll.toLowerCase()}@aditya.ac.in`,
            branch: fallbackBranch || copy[index].branch,
            year: fallbackYear || copy[index].year,
            tier: fallbackTier,
            tierTitle: getTierTitle(fallbackTier)
          };
          return copy;
        });

        setLookupStatuses((prev) => {
          const copy = [...prev];
          copy[index] = {
            status: 'not_found',
            studentName: '',
            message: 'Not in records — details auto-guessed, edit if needed'
          };
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

  // When domain changes, prefer the first UNPAID challenge in that domain
  const handleDomainChange = (domainCode) => {
    const code = String(domainCode);
    setSelectedDomain(code);
    const challengesForDomain = catalog.challenges.filter(
      (c) => String(c.categoryCode).toUpperCase() === code.toUpperCase()
    );
    if (challengesForDomain.length > 0) {
      const firstUnpaid = challengesForDomain.find((c) => !findPaidEventForChallenge(c, paidEvents));
      setSelectedChallengeId((firstUnpaid || challengesForDomain[0]).id);
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

  // Check if the logged-in student already has a PAID registration for the currently selected event
  const paidRecordForCurrentChallenge = useMemo(
    () => findPaidEventForChallenge(currentChallenge, paidEvents),
    [currentChallenge, paidEvents]
  );

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

  // Live tier counts across confirmed members:
  // Members 5 and 6 (idx 4 and 5) are Open Discipline slots (can be any branch, including Forensic or Engineering).
  // Squad composition requires at least 2 Forensic and at least 2 Engineering, with any remaining members satisfying Open Discipline.
  const confirmedTierCounts = useMemo(() => {
    let totalForensic = 0;
    let totalEngineering = 0;
    let totalOpenOnly = 0;

    members.slice(0, confirmedCount).forEach((m, idx) => {
      // Slots 5 and 6 (idx 4 and 5) or explicit 'open' tier are Open Discipline
      if (idx >= 4 || m.tier === 'open') {
        totalOpenOnly += 1;
        return;
      }
      const t = determineTierFromBranch(m.branch);
      if (t === 'forensic') totalForensic += 1;
      else if (t === 'engineering') totalEngineering += 1;
      else totalOpenOnly += 1;
    });

    const forensic = Math.min(2, totalForensic);
    const engineering = Math.min(2, totalEngineering);
    const availableForOpen =
      Math.max(0, totalForensic - forensic) +
      Math.max(0, totalEngineering - engineering) +
      totalOpenOnly;
    const open = Math.min(2, availableForOpen);

    return { forensic, engineering, open };
  }, [members, confirmedCount]);

  const isSquadCompositionValid = Boolean(
    confirmedCount === 6 &&
    confirmedTierCounts.forensic === 2 &&
    confirmedTierCounts.engineering === 2 &&
    confirmedTierCounts.open === 2
  );

  const allRemainingFiveFilled = Boolean(
    remainingFilledCount === 5 &&
    confirmedCount === 6 &&
    editingIdx === null &&
    isSquadCompositionValid
  );

  const isLeadReady = Boolean(
    confirmedCount >= 1 && isMemberComplete(members[0]) && String(members[0]?.phone || '').trim()
  );

  // Track latest roll input & last auto-fetched roll so stale lookups never overwrite new roll details
  const latestAuthRollRef = useRef('');
  const lastAuthAutoFilledRollRef = useRef('');

  // Team Leader Roll No Auto-Fill in Register Tab
  const triggerAuthRollLookup = async (rollInput) => {
    const cleanRoll = (rollInput || '').trim().toUpperCase();
    if (!cleanRoll || cleanRoll.length < 5) return;
    latestAuthRollRef.current = cleanRoll;
    setAuthLookupStatus({ status: 'loading', message: 'Fetching student...', studentName: '' });
    try {
      const student = await fetchStudentDetailsFromApi(cleanRoll);
      // Ignore stale response if user already changed the Roll Number input
      if (latestAuthRollRef.current !== cleanRoll) return;

      if (student && student.alreadyRegistered) {
        lastAuthAutoFilledRollRef.current = cleanRoll;
        const studentName = (student.studentname || student.studentName || student.name || cleanRoll).trim();
        setAuthLookupStatus({
          status: 'already_registered',
          studentName,
          message: `Already registered in team "${student.teamName}" for "${student.eventTitle}"!`
        });
        setAuthError(
          `Student (${cleanRoll}) is already registered in team "${student.teamName}" for "${student.eventTitle}". Re-registration is not allowed. Please switch to the Login tab to view your registration details.`
        );
        return;
      }

      if (student && !student.error && (student.studentname || student.studentName || student.name)) {
        const studentName = (student.studentname || student.studentName || student.name || '').trim();
        const phone = (student.mobilenumber || student.MobileNumber || student.mobile || student.phone || student.fathermobilenumber || '').trim();
        const rawEmail = (student.emailid || student.email || student.Email || student.EmailId || '').trim().toLowerCase();
        const defaultStudentEmail = cleanRoll ? `${cleanRoll.toLowerCase()}@aditya.ac.in` : '';
        const resolvedEmail = rawEmail || defaultStudentEmail;
        const mappedYear = mapSemesterToYear(student.semestername || student.semester || student.year, student.joinedbatch, student.coursename);
        const mappedBranch = mapStudentBranch('forensic', student.branch || student.department, student.coursename);

        lastAuthAutoFilledRollRef.current = cleanRoll;
        setRegisterForm((prev) => ({
          ...prev,
          name: studentName || '',
          email: resolvedEmail || '',
          mobile: phone || '',
          branch: mappedBranch || prev.branch,
          year: mappedYear || prev.year,
          gender: student.gender || prev.gender
        }));
        setAuthLookupStatus({ status: 'found', studentName, message: `✓ ${studentName}` });
      } else {
        setAuthLookupStatus({ status: 'not_found', studentName: '', message: 'Not found — enter manually' });
      }
    } catch {
      if (latestAuthRollRef.current !== cleanRoll) return;
      setAuthLookupStatus({ status: 'not_found', studentName: '', message: 'Manual entry available' });
    }
  };

  const handleRegisterRollChange = (val) => {
    const upper = val.toUpperCase();
    const cleanUpper = upper.trim();
    latestAuthRollRef.current = cleanUpper;

    // If roll changed from a previously auto-filled student, clear old auto-filled personal fields
    const shouldResetAutoFilled =
      Boolean(lastAuthAutoFilledRollRef.current) && lastAuthAutoFilledRollRef.current !== cleanUpper;

    if (shouldResetAutoFilled) {
      lastAuthAutoFilledRollRef.current = '';
    }

    setRegisterForm((prev) => ({
      ...prev,
      rollNo: upper,
      ...(shouldResetAutoFilled ? { name: '', email: '', mobile: '' } : {})
    }));

    if (authLookupTimerRef.current) clearTimeout(authLookupTimerRef.current);
    if (cleanUpper.length >= 6) {
      authLookupTimerRef.current = setTimeout(() => {
        triggerAuthRollLookup(cleanUpper);
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
    if (authLookupStatus?.status === 'already_registered') {
      return setAuthError(
        `Student (${rNo}) is already registered in a confirmed team. Re-registration is not allowed. Please switch to the Login tab.`
      );
    }

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

      const registeredRoll = String(student?.roll || rNo).trim().toUpperCase();
      const registeredName = String(student?.name || fullName).trim();
      const registeredTeam = String(student?.teamName || tName).trim();

      // After registering as Team Leader, redirect to Login tab with THAT exact Roll Number
      setAuthMode('login');
      setLoginForm({ identifier: registeredRoll, password: '' });
      setRegisterForm(createInitialRegisterForm());
      latestAuthRollRef.current = '';
      lastAuthAutoFilledRollRef.current = '';
      setAuthLookupStatus({ status: 'idle', message: '', studentName: '' });
      setAuthSuccess(
        `Team "${registeredTeam}" registered successfully for ${registeredName} (${registeredRoll})! Please login below with Roll Number ${registeredRoll} and your password to add the remaining 5 team members.`
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
      // Clear any previous user's UI state before loading the newly logged-in user
      setSubmittedData(null);
      setTeamName('');
      setMembers(createInitialMembers());
      setConfirmedCount(0);
      setEditingIdx(null);
      setValidationErrors({});
      setPaymentErrorMessage('');
      setSaveNotice('');
      setSaveError('');
      lastFetchedRollRef.current = {};
      setLookupStatuses(Array(6).fill({ status: 'idle', studentName: '', message: '' }));

      const { student } = await loginTeamLeaderAccount({ email: idVal, password: pwVal });
      initialSyncDoneRef.current = true;
      setLoggedInLeader(student);
      const serverState = await fetchTeamLeaderState(student.roll).catch(() => null);
      applyServerState(student, serverState, Boolean(initialChallengeId), initialChallengeId || '');
      setSaveNotice(
        serverState?.pendingDraft
          ? `Welcome back, ${student.name} (${student.roll})! Your saved team draft has been restored.`
          : `Logged in as ${student.name} (${student.roll}). Add your remaining 5 team members below.`
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
    setPaidEvents([]);
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
    if (paidRecordForCurrentChallenge) {
      setSaveError(
        `Registration access is locked: payment status is already PAID for "${currentChallenge?.title || currentChallenge?.id}" (Team ID: ${paidRecordForCurrentChallenge.teamId || paidRecordForCurrentChallenge.registrationNumber}).`
      );
      return;
    }
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

      await saveTeamMembersDraft({
        teamName: cleanTeamName,
        domainId: domainNumber,
        domainCode: currentDomainInfo?.code || selectedDomain || '',
        domainTitle: domainLabel,
        eventTitle: currentChallenge?.rawTitle || currentChallenge?.title || '',
        slug: currentChallenge?.slug || '',
        challengeId: currentChallenge?.id || selectedChallengeId || '',
        challengeTitle: currentChallenge?.title || '',
        centralEventId: currentChallenge?.sourceType === 'central_event' ? currentChallenge?._id : null,
        forensicScope: currentChallenge?.forensic || currentChallenge?.descriptionText || '',
        technicalScope: currentChallenge?.technical || '',
        subFields: Array.isArray(currentChallenge?.subFields) ? currentChallenge.subFields : [],
        members: nextMembersList.map((m, idx) => ({
          studentIndex: idx + 1,
          tier: m.tier,
          tierTitle: m.tierTitle,
          isLead: idx === 0,
          name: (m.name || '').trim(),
          rollNo: (m.rollNo || '').trim().toUpperCase(),
          email: (m.email || '').trim().toLowerCase(),
          branch: m.branch,
          year: m.year,
          gender: m.gender || 'Male',
          phone: m.phone ? m.phone.trim() : ''
        }))
      });

      setSaveNotice('');
    } catch (err) {
      setSaveError(err.message || 'Unable to save team progress.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleMemberChange = (index, field, value) => {
    setMembers((prev) => {
      const copy = [...prev];
      const prevMember = copy[index] || {};
      const updated = { ...prevMember, [field]: value };

      if (field === 'branch') {
        const newTier = (index >= 4) ? 'open' : determineTierFromBranch(value);
        updated.tier = newTier;
        updated.tierTitle = getTierTitle(newTier);
      }

      if (field === 'rollNo') {
        const cleanRoll = value.trim().toUpperCase();
        if (cleanRoll.length >= 6) {
          updated.email = `${cleanRoll.toLowerCase()}@aditya.ac.in`;
        } else if (!cleanRoll) {
          updated.email = '';
        }
        if (cleanRoll.length >= 8) {
          const autoBranch = resolveStudentBranch(null, cleanRoll);
          if (autoBranch) {
            updated.branch = autoBranch;
            updated.tier = (index >= 4) ? 'open' : determineTierFromBranch(autoBranch);
            updated.tierTitle = getTierTitle(updated.tier);
          }
        }
        if (cleanRoll.length >= 2) {
          const autoYear = resolveStudentYear(null, cleanRoll);
          if (autoYear) updated.year = autoYear;
        }
      }

      copy[index] = updated;
      return copy;
    });

    // Auto-trigger API lookup when Roll Number is typed
    if (field === 'rollNo') {
      lastFetchedRollRef.current[index] = '';
      const cleanRoll = value.trim().toUpperCase();
      if (lookupTimeouts.current[index]) {
        clearTimeout(lookupTimeouts.current[index]);
      }
      if (cleanRoll.length >= 5) {
        lookupTimeouts.current[index] = setTimeout(() => {
          triggerStudentLookup(index, cleanRoll);
        }, 300);
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

  // Check that a member's Roll No is neither duplicated within this 6-member team
  // nor already CONFIRMED/PAID in another team for the SAME Forensithon event.
  const verifyMemberCanJoinEvent = async (memberIdx, rawRoll) => {
    const cleanRoll = String(rawRoll || '').trim().toUpperCase();
    if (!cleanRoll) return { ok: false, error: 'Roll number is required.' };

    // 1. Check duplicate inside the same 6-member squad
    const duplicateSlotIdx = members.findIndex(
      (other, i) =>
        i !== memberIdx &&
        (i < confirmedCount || i === 0) &&
        String(other.rollNo || '').trim().toUpperCase() === cleanRoll
    );
    if (duplicateSlotIdx !== -1) {
      return {
        ok: false,
        error: `Roll Number ${cleanRoll} is already added as Member ${duplicateSlotIdx + 1}. All 6 team members must be unique.`
      };
    }

    // 2. Check server DB for existing CONFIRMED/PAID registration for the SAME event
    if (currentChallenge) {
      try {
        const res = await checkForensithonMembersEligibility({
          rollNumbers: [cleanRoll],
          centralEventId: currentChallenge.sourceType === 'central_event' ? currentChallenge._id : null,
          eventTitle: currentChallenge.rawTitle || currentChallenge.title,
          challengeTitle: currentChallenge.title,
          challengeId: currentChallenge.id,
          slug: currentChallenge.slug || ''
        });
        if (res && res.available === false) {
          return {
            ok: false,
            error:
              res.message ||
              `Roll Number ${cleanRoll} is already registered for "${currentChallenge.title}". Same member cannot register again for the same event.`
          };
        }
      } catch (err) {
        // Backend will still enforce authoritatively on save-team & create-order
        console.warn('Member eligibility check notice:', err.message);
      }
    }

    return { ok: true };
  };

  const validateForm = () => {
    const errors = {};

    if (!teamName.trim()) {
      errors.teamName = 'Team name is required.';
    }

    if (!selectedChallengeId || !currentChallenge) {
      errors.challenge = 'Please select an active track and problem statement.';
    }

    // Validate 6 members (Team Leader + remaining 5 members) & block duplicate roll numbers
    const seenRolls = new Map();
    members.forEach((m, idx) => {
      const cleanRoll = String(m.rollNo || '').trim().toUpperCase();
      if (!cleanRoll) {
        errors[`member_${idx}_rollNo`] = `Roll number is required.`;
      } else if (lookupStatuses[idx]?.status === 'already_registered') {
        errors[`member_${idx}_rollNo`] = `Student (${m.rollNo}) is already registered in another team.`;
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
      if (confirmedCount === 6 && !isSquadCompositionValid) {
        errors.squadComposition = `Mandatory squad composition: Exactly 2 Forensic / CSDF, 2 Engineering, and 2 Open discipline members are required in any order. Current count: ${confirmedTierCounts.forensic}/2 Forensic, ${confirmedTierCounts.engineering}/2 Engineering, ${confirmedTierCounts.open}/2 Open.`;
      } else {
        errors.remainingMembers = 'Please complete all 5 remaining team members before proceeding to payment.';
      }
    }

    if (!agreed) {
      errors.agreed = 'You must confirm that all 6 members satisfy the university & branch rules.';
    }

    setValidationErrors(errors);
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paidRecordForCurrentChallenge) {
      setPaymentErrorMessage(
        `Registration access is disabled: payment status is already PAID for "${currentChallenge?.title || currentChallenge?.id}" (Team ID: ${paidRecordForCurrentChallenge.teamId || paidRecordForCurrentChallenge.registrationNumber}).`
      );
      return;
    }

    if (!allRemainingFiveFilled) {
      if (confirmedCount === 6 && !isSquadCompositionValid) {
        setPaymentErrorMessage(
          `Payment disabled: Squad composition must have exactly 2 Forensic, 2 Engineering, and 2 Open discipline members. (Current: ${confirmedTierCounts.forensic}/2 Forensic, ${confirmedTierCounts.engineering}/2 Engineering, ${confirmedTierCounts.open}/2 Open)`
        );
      } else {
        setPaymentErrorMessage('Payment is disabled until all 5 remaining team members are filled.');
      }
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

    paymentHandlerTriggeredRef.current = false;
    setIsProcessingPayment(true);
    setPaymentStage('creating_order');
    setPaymentErrorMessage('');

    try {
      // 1. Ensure Razorpay Checkout SDK is ready
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const domainNumber = Number(currentDomainInfo?.number) || 1;
      const domainLabel = currentDomainInfo?.name || currentDomainInfo?.title || selectedDomain || 'Forensithon';

      // 2. Call Unified Backend API to Create Order — DO NOT send payment amount from frontend;
      // backend matches the event in `central_events` and computes the official fee securely server-side.
      const orderPayload = {
        teamName: teamName.trim(),
        teamId: loggedInLeader?.teamId || undefined,
        domainId: domainNumber,
        domainCode: currentDomainInfo?.code || selectedDomain || '',
        domainTitle: domainLabel,
        eventTitle: currentChallenge.rawTitle || currentChallenge.title,
        slug: currentChallenge.slug || '',
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
          isLead: idx === 0,
          name: m.name.trim(),
          rollNo: m.rollNo.trim().toUpperCase(),
          email: m.email.trim().toLowerCase(),
          branch: m.branch,
          year: m.year,
          gender: m.gender || 'Male',
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
        notes: orderData.notes || undefined,
        prefill: {
          name: members[0].name.trim(),
          email: members[0].email.trim(),
          contact: members[0].phone ? members[0].phone.trim() : ''
        },
        theme: {
          color: '#ff5500' // Forensithon Orange
        },
        handler: async function (paymentResponse) {
          paymentHandlerTriggeredRef.current = true;
          setPaymentStage('verifying');
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
              teamId: verifyData.teamId || orderData.teamId || '',
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
            setPaidEvents((prev) => [
              ...prev,
              {
                registrationId: String(orderData.regDocId || ''),
                registrationNumber: confirmedRecord.regId,
                teamId: confirmedRecord.teamId || confirmedRecord.regId,
                teamName: confirmedRecord.teamName,
                centralEventId: currentChallenge?.sourceType === 'central_event' ? String(currentChallenge._id || '') : '',
                challengeId: confirmedRecord.challengeId,
                challengeTitle: confirmedRecord.challengeTitle,
                eventTitle: currentChallenge?.rawTitle || confirmedRecord.challengeTitle,
                status: 'CONFIRMED',
                paymentStatus: 'PAID',
                paymentReference: confirmedRecord.paymentReference,
                razorpayPaymentId: confirmedRecord.razorpayPaymentId,
                razorpayOrderId: confirmedRecord.razorpayOrderId,
                amount: confirmedRecord.amount
              }
            ]);
            setPaymentStage('idle');
            setIsProcessingPayment(false);

            // Update stored team leader with latest team name & profile
            const currentLeader = getStoredTeamLeader() || {};
            const leadRoll = currentLeader.roll || currentLeader.rollNo || members[0]?.rollNo;
            if (leadRoll) {
              saveStoredTeamLeader({
                ...currentLeader,
                roll: leadRoll,
                rollNo: leadRoll,
                name: currentLeader.name || members[0]?.name,
                email: currentLeader.email || members[0]?.email,
                mobile: currentLeader.mobile || members[0]?.phone,
                phone: currentLeader.phone || members[0]?.phone,
                teamName: teamName.trim()
              });
            }

            // Immediately redirect to Account Dashboard page showing Confirmed Registrations & Paid Receipts
            navigate('/account');
          } catch (verifyError) {
            console.error('Verification error:', verifyError);
            setPaymentErrorMessage(
              `Payment was processed by Razorpay (ID: ${paymentResponse.razorpay_payment_id}), but verification returned: ${verifyError.message}`
            );
            setPaymentStage('idle');
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            if (!paymentHandlerTriggeredRef.current) {
              setPaymentStage('idle');
              setIsProcessingPayment(false);
            }
          }
        }
      };

      const razorpayInstance = new window.Razorpay(rzpOptions);
      razorpayInstance.on('payment.failed', function (failedResponse) {
        console.error('Payment failed:', failedResponse);
        setPaymentErrorMessage(
          failedResponse.error?.description || 'Payment was unsuccessful or cancelled by the user.'
        );
        setPaymentStage('idle');
        setIsProcessingPayment(false);
      });

      setPaymentStage('awaiting_checkout');
      razorpayInstance.open();
    } catch (err) {
      console.error('Registration/Payment Error:', err);
      setPaymentErrorMessage(err.message || 'An error occurred while connecting to the payment gateway.');
      setPaymentStage('idle');
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
                  <span className="receipt-meta-label">TEAM ID</span>
                  <span className="receipt-id-badge" style={{ background: '#ff5500', color: '#fff', fontWeight: 700, letterSpacing: '0.5px' }}>
                    {submittedData.teamId || submittedData.regId}
                  </span>
                </div>
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
                  ✓ Verified: Exactly 6 Aditya University students (2 Forensic + 2 Engineering + 2 Open Discipline)
                </p>

                <div className="receipt-members-grid">
                  {submittedData.members.map((m, idx) => (
                    <div key={idx} className={`receipt-member-item receipt-member-item--${m.tier}`}>
                      <div className="receipt-member-top">
                        <span className="receipt-member-role">{m.role || (m.isLead || idx === 0 ? 'Team Leader' : `Member ${idx + 1}`)}</span>
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
              <Link to="/account" className="button secondary">
                My Account Dashboard ↗
              </Link>
              <Link to="/challenges" className="button secondary">
                Explore Other Challenges ↗
              </Link>
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
        <h1 className="page-title">Enroll Now</h1>
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

        {/* Logged-in Team Leader Bar */}
        {loggedInLeader && (
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
                {syncingTeamState ? (
                  <span>Syncing your saved team details from database...</span>
                ) : paidRecordForCurrentChallenge ? (
                  <>
                    <strong>✓ Payment Status: PAID for {currentChallenge?.id}.</strong> Registration access is locked for this event. Select another event or open Account Dashboard to view your pass.
                  </>
                ) : allRemainingFiveFilled ? (
                  <>
                    <strong>✓ All 6 team members are already saved in the database!</strong> Only payment is pending — proceed directly to Step 03 to pay via Razorpay.
                  </>
                ) : (
                  <>
                    Remaining Members Completed: <strong>{remainingFilledCount} / 5</strong> ·{' '}
                    Fill and add all 5 remaining team members below to enable Razorpay payment.
                  </>
                )}
              </p>
            </div>
            <div className="leader-session-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {allRemainingFiveFilled && !paidRecordForCurrentChallenge && (
                <button
                  type="button"
                  className="button"
                  onClick={() => paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Proceed to Payment (₹{effectiveFeeAmount}) ↓
                </button>
              )}
              <Link to="/account" className="button secondary">
                My Account Dashboard ↗
              </Link>
              <button
                type="button"
                className="button secondary"
                onClick={handleLogout}
              >
                Logout / Switch Account ↪
              </button>
            </div>
          </div>
        )}

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
                      domainChallenges.map((c) => {
                        const isPaid = Boolean(findPaidEventForChallenge(c, paidEvents));
                        return (
                          <option key={c._id || c.id} value={c.id} disabled={isPaid}>
                            [{c.id}] {c.title}{isPaid ? ' — (ALREADY REGISTERED · PAID)' : ''}
                          </option>
                        );
                      })
                    )}
                  </select>
                  {validationErrors.challenge && (
                    <span className="form-error-msg">{validationErrors.challenge}</span>
                  )}
                </div>

                {/* Locked Banner if the selected event's payment status is ALREADY PAID */}
                {paidRecordForCurrentChallenge && (
                  <div className="event-paid-lock-banner" role="alert">
                    <div className="event-paid-lock-head">
                      <span className="event-paid-lock-pill">✓ PAYMENT STATUS: PAID · REGISTRATION LOCKED</span>
                      <span className="event-paid-lock-team">
                        Team ID: <strong>{paidRecordForCurrentChallenge.teamId || paidRecordForCurrentChallenge.registrationNumber}</strong>
                      </span>
                    </div>
                    <h3 className="event-paid-lock-title">
                      You have already registered and completed payment for [{currentChallenge?.id}] {currentChallenge?.title}
                    </h3>
                    <p className="event-paid-lock-desc">
                      Registration access is disabled for this event because your payment status is already <strong>PAID</strong>
                      {paidRecordForCurrentChallenge.razorpayPaymentId ? ` (Payment ID: ${paidRecordForCurrentChallenge.razorpayPaymentId})` : ''}.
                      To view your squad details or download your entry pass, open your Account Dashboard. To register for a different event, choose another problem statement above.
                    </p>
                    <div className="event-paid-lock-actions">
                      <Link to="/account" className="button">
                        View Registration &amp; Entry Pass ↗
                      </Link>
                      <Link to="/challenges" className="button secondary">
                        Browse Other Challenges ↗
                      </Link>
                    </div>
                  </div>
                )}

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

              {/* STEP 2 & STEP 3: Hidden whenever the selected event is ALREADY PAID */}
              {!paidRecordForCurrentChallenge && (
                <>
                  {/* STEP 2: Team Members — Horizontal Add-One-By-One & In-Place Edit Flow */}
                  <div className="form-card-section">
                    <div className="form-card-header">
                      <span className="step-num-badge">STEP 02</span>
                      <div>
                        <h2 className="form-section-title">Team Members (Exactly 6 Members)</h2>
                        <p className="form-section-desc">
                          Add all 6 members in <strong>any order</strong>. Exactly 6 required: <strong>2 Forensic/CSDF · 2 Engineering · 2 Open Discipline</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Live Squad Composition Meter (Any Order 2+2+2) */}
                    <div className="squad-composition-meter">
                      <div className={`squad-meter-chip ${confirmedTierCounts.forensic === 2 ? 'is-complete' : confirmedTierCounts.forensic > 2 ? 'is-overflow' : ''}`}>
                        <span className="meter-chip-dot dot--forensic" />
                        <span className="meter-chip-label">Forensic / CSDF:</span>
                        <strong>{confirmedTierCounts.forensic} / 2</strong>
                      </div>
                      <div className={`squad-meter-chip ${confirmedTierCounts.engineering === 2 ? 'is-complete' : confirmedTierCounts.engineering > 2 ? 'is-overflow' : ''}`}>
                        <span className="meter-chip-dot dot--engineering" />
                        <span className="meter-chip-label">Engineering &amp; Allied:</span>
                        <strong>{confirmedTierCounts.engineering} / 2</strong>
                      </div>
                      <div className={`squad-meter-chip ${confirmedTierCounts.open === 2 ? 'is-complete' : confirmedTierCounts.open > 2 ? 'is-overflow' : ''}`}>
                        <span className="meter-chip-dot dot--open" />
                        <span className="meter-chip-label">Open Discipline:</span>
                        <strong>{confirmedTierCounts.open} / 2</strong>
                      </div>
                      <div className={`squad-meter-chip squad-meter-chip--total ${confirmedCount === 6 ? (isSquadCompositionValid ? 'is-complete' : 'is-overflow') : ''}`}>
                        <span className="meter-chip-label">Total Confirmed:</span>
                        <strong>{confirmedCount} / 6</strong>
                      </div>
                    </div>

                    {/* Squad Composition Incomplete Notice if 6 members filled but not 2+2+2 */}
                    {confirmedCount === 6 && !isSquadCompositionValid && (
                      <div className="squad-composition-warning" role="alert">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <div>
                          <strong>Team Composition Rule:</strong> Exactly 2 Forensic / CSDF, 2 Engineering, and 2 Open discipline members are required in any order.
                          <span>Currently: <strong>{confirmedTierCounts.forensic}/2</strong> Forensic, <strong>{confirmedTierCounts.engineering}/2</strong> Engineering, <strong>{confirmedTierCounts.open}/2</strong> Open. Click <strong>✎ Edit</strong> on the member(s) you need to adjust.</span>
                        </div>
                      </div>
                    )}

                    {/* Progress tracker */}
                    <div className="member-progress-track">
                      {members.map((m, idx) => {
                        const isConfirmed = idx < confirmedCount;
                        const isCurrent = editingIdx !== null ? idx === editingIdx : idx === confirmedCount;
                        const stepTier = (idx >= 4) ? 'open' : (m.tier || determineTierFromBranch(m.branch));
                        const tierDot = stepTier === 'forensic' ? '#1e3a5f' : stepTier === 'engineering' ? '#1a4731' : '#4a1942';
                        return (
                          <div
                            key={idx}
                            className={`progress-step ${isConfirmed && editingIdx !== idx ? 'progress-step--done' : isCurrent ? 'progress-step--active' : ''}`}
                            onClick={() => {
                              if (isConfirmed) {
                                setEditingIdx(idx);
                              }
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
                          const currentTier = (idx >= 4) ? 'open' : (m.tier || determineTierFromBranch(m.branch));
                          const isForensic = currentTier === 'forensic';
                          const isEngineering = currentTier === 'engineering';
                          const tierLabel = isForensic
                            ? 'Forensic Science / CSDF'
                            : isEngineering
                              ? 'Engineering & Allied'
                              : 'Open Discipline';
                          const tierColor = isForensic ? '#1e3a5f' : isEngineering ? '#1a4731' : '#4a1942';

                          // If this member is currently being edited, render its open form in-place!
                          if (editingIdx === idx) {
                            const handleSaveEdit = async () => {
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

                              const eligibility = await verifyMemberCanJoinEvent(idx, m.rollNo);
                              if (!eligibility.ok) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  [`member_${idx}_rollNo`]: eligibility.error
                                }));
                                return;
                              }

                              const memberTier = (idx >= 4) ? 'open' : determineTierFromBranch(m.branch);
                              const updatedMembers = [...members];
                              updatedMembers[idx] = {
                                ...updatedMembers[idx],
                                tier: memberTier,
                                tierTitle: getTierTitle(memberTier)
                              };
                              setMembers(updatedMembers);

                              // If saving Team Leader (idx 0), sync the updated data to loggedInLeader state and localStorage
                              if (idx === 0) {
                                const updatedLead = {
                                  ...(loggedInLeader || getStoredTeamLeader() || {}),
                                  name: m.name.trim(),
                                  roll: m.rollNo.trim().toUpperCase(),
                                  email: m.email.trim().toLowerCase(),
                                  phone: m.phone.trim(),
                                  mobile: m.phone.trim(),
                                  branch: m.branch,
                                  department: m.branch,
                                  year: m.year,
                                  gender: m.gender || 'Male'
                                };
                                setLoggedInLeader(updatedLead);
                                saveStoredTeamLeader(updatedLead);
                              }

                              setValidationErrors((prev) => {
                                const next = { ...prev };
                                ['rollNo', 'name', 'email', 'phone'].forEach((f) => delete next[`member_${idx}_${f}`]);
                                return next;
                              });
                              setEditingIdx(null);
                              persistTeamDraft(updatedMembers, teamName);
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
                                    {lookupStatuses[idx]?.status === 'already_registered' && (
                                      <span className="lookup-pill" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 600 }}>
                                        ⚠️ {lookupStatuses[idx].message || 'Already registered in another team'}
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
                                    <label className="form-label required">Branch / Department</label>
                                    <select
                                      className="form-select"
                                      value={m.branch}
                                      onChange={(e) => handleMemberChange(idx, 'branch', e.target.value)}
                                    >
                                      <optgroup label="Forensic Science & CSDF (Tier 1)">
                                        {FORENSIC_BRANCH_OPTIONS.map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </optgroup>
                                      <optgroup label="Engineering & Allied (Tier 2)">
                                        {ENGINEERING_BRANCH_OPTIONS.map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </optgroup>
                                      <optgroup label="Open Disciplines (Tier 3)">
                                        {OPEN_BRANCH_OPTIONS.map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </optgroup>
                                      {m.branch &&
                                        !FORENSIC_BRANCH_OPTIONS.includes(m.branch) &&
                                        !ENGINEERING_BRANCH_OPTIONS.includes(m.branch) &&
                                        !OPEN_BRANCH_OPTIONS.includes(m.branch) && (
                                          <option value={m.branch}>{m.branch}</option>
                                        )}
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
                                    <label className="form-label required">Gender</label>
                                    <select
                                      className="form-select"
                                      value={m.gender || 'Male'}
                                      onChange={(e) => handleMemberChange(idx, 'gender', e.target.value)}
                                    >
                                      {GENDER_OPTIONS.map((g) => (
                                        <option key={g} value={g}>{g}</option>
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
                          const memberDisplayTier = (idx >= 4) ? 'open' : (m.tier || determineTierFromBranch(m.branch));
                          const tierColors = { forensic: '#1e3a5f', engineering: '#1a4731', open: '#4a1942' };
                          const tierLabels = { forensic: 'Forensic', engineering: 'Engineering', open: 'Open' };
                          return (
                            <div
                              key={idx}
                              className="added-member-row"
                              style={{ borderLeft: `4px solid ${tierColors[memberDisplayTier] || '#ff5500'}` }}
                            >
                              <span className="added-member-num">{String(idx + 1).padStart(2, '0')}</span>
                              <div className="added-member-info">
                                <strong>{m.name || '—'}</strong>
                                <span>
                                  {m.rollNo || '—'} · {m.gender || 'Male'} · {tierLabels[memberDisplayTier]} · {m.branch} · {m.year}
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
                                onClick={() => {
                                  setEditingIdx(idx);
                                }}
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

                    {/* If NOT logged in, require Team Leader login / registration first */}
                    {!loggedInLeader && (
                      <div className="leader-login-required-card" style={{
                        background: '#0d1117',
                        border: '2px dashed #ff5500',
                        borderRadius: '12px',
                        padding: '32px 24px',
                        textAlign: 'center',
                        margin: '20px 0'
                      }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          background: 'rgba(255, 85, 0, 0.15)',
                          color: '#ff5500',
                          marginBottom: '16px'
                        }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <polyline points="17 11 19 13 23 9" />
                          </svg>
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '20px', margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
                          Team Leader Registration / Login Required
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '580px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                          First, the <strong>Team Leader</strong> must register or sign in to create the team. Once signed in, your profile is automatically confirmed as Member 01 at the top, and you can add the remaining 5 team members.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="button"
                            style={{ minHeight: '44px', padding: '10px 24px', fontWeight: 700 }}
                            onClick={() => window.dispatchEvent(new CustomEvent('open-forensithon-login', { detail: { mode: 'login' } }))}
                          >
                            Login to Team Portal →
                          </button>
                          <button
                            type="button"
                            className="button secondary"
                            style={{ minHeight: '44px', padding: '10px 24px' }}
                            onClick={() => window.dispatchEvent(new CustomEvent('open-forensithon-login', { detail: { mode: 'register' } }))}
                          >
                            Register as Team Leader ✎
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Form to add next new member (shown only when logged in and not currently editing an earlier member) */}
                    {loggedInLeader && confirmedCount < 6 && editingIdx === null && (() => {
                      const idx = confirmedCount;
                      const m = members[idx];
                      const currentTier = (idx >= 4) ? 'open' : (m.tier || determineTierFromBranch(m.branch));
                      const isForensic = currentTier === 'forensic';
                      const isEngineering = currentTier === 'engineering';
                      const tierLabel = isForensic
                        ? 'Forensic Science / CSDF'
                        : isEngineering
                          ? 'Engineering & Allied'
                          : 'Open Discipline';
                      const tierColor = isForensic ? '#1e3a5f' : isEngineering ? '#1a4731' : '#4a1942';

                      const handleAddMember = async () => {
                        const errors = {};
                        if (!m.rollNo.trim()) errors[`member_${idx}_rollNo`] = 'Roll number is required.';
                        else if (lookupStatuses[idx]?.status === 'already_registered') {
                          errors[`member_${idx}_rollNo`] = 'This student is already registered in a confirmed Forensithon team. Re-registration is not allowed.';
                        }
                        if (!m.name.trim()) errors[`member_${idx}_name`] = 'Full name is required.';
                        if (!m.email.trim()) errors[`member_${idx}_email`] = 'Email address is required.';
                        else if (!m.email.includes('@')) errors[`member_${idx}_email`] = 'Enter a valid email address.';
                        if (m.isLead && !m.phone.trim()) errors[`member_${idx}_phone`] = 'Phone number is required for the Team Leader.';

                        if (Object.keys(errors).length > 0) {
                          setValidationErrors((prev) => ({ ...prev, ...errors }));
                          return;
                        }

                        const eligibility = await verifyMemberCanJoinEvent(idx, m.rollNo);
                        if (!eligibility.ok) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            [`member_${idx}_rollNo`]: eligibility.error
                          }));
                          return;
                        }

                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          ['rollNo', 'name', 'email', 'phone'].forEach((f) => delete next[`member_${idx}_${f}`]);
                          delete next.remainingMembers;
                          return next;
                        });

                        const memberTier = (idx >= 4) ? 'open' : determineTierFromBranch(m.branch);
                        const updatedMembers = [...members];
                        updatedMembers[idx] = {
                          ...updatedMembers[idx],
                          tier: memberTier,
                          tierTitle: getTierTitle(memberTier)
                        };
                        setMembers(updatedMembers);
                        setConfirmedCount((prev) => Math.max(prev, idx + 1));
                        persistTeamDraft(updatedMembers, teamName);
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
                              {lookupStatuses[idx]?.status === 'already_registered' && (
                                <span className="lookup-pill" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 600 }}>
                                  ⚠️ {lookupStatuses[idx].message || 'Already registered in another team'}
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
                              <label className="form-label required">Branch / Department</label>
                              <select
                                className="form-select"
                                value={m.branch}
                                onChange={(e) => handleMemberChange(idx, 'branch', e.target.value)}
                              >
                                <optgroup label="Forensic Science & CSDF (Tier 1)">
                                  {FORENSIC_BRANCH_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Engineering & Allied (Tier 2)">
                                  {ENGINEERING_BRANCH_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Open Disciplines (Tier 3)">
                                  {OPEN_BRANCH_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </optgroup>
                                {m.branch &&
                                  !FORENSIC_BRANCH_OPTIONS.includes(m.branch) &&
                                  !ENGINEERING_BRANCH_OPTIONS.includes(m.branch) &&
                                  !OPEN_BRANCH_OPTIONS.includes(m.branch) && (
                                    <option value={m.branch}>{m.branch}</option>
                                  )}
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
                              <label className="form-label required">Gender</label>
                              <select
                                className="form-select"
                                value={m.gender || 'Male'}
                                onChange={(e) => handleMemberChange(idx, 'gender', e.target.value)}
                              >
                                {GENDER_OPTIONS.map((g) => (
                                  <option key={g} value={g}>{g}</option>
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
                        {saveError && (
                          <div style={{ color: '#dc2626', marginTop: '4px', fontSize: '12.5px' }}>{saveError}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                  <div className="form-card-section" id="payment-step-section" ref={paymentSectionRef}>
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
                      {syncingTeamState ? (
                        <span>⏳ Loading your saved team members from the database...</span>
                      ) : allRemainingFiveFilled ? (
                        <span>
                          ✓ All 6 team members are already saved in the database! No need to re-fill participants — Razorpay payment is unlocked and ready.
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
                            <span className="spinner" />{' '}
                            {paymentStage === 'verifying'
                              ? 'Verifying Payment & Confirming Team...'
                              : paymentStage === 'awaiting_checkout'
                                ? 'Waiting for Razorpay Payment...'
                                : 'Connecting to Razorpay Gateway...'}
                          </span>
                        ) : !allRemainingFiveFilled ? (
                          `Pay ₹${effectiveFeeAmount} Disabled (${remainingFilledCount}/5 Remaining Members Filled)`
                        ) : (
                          `Pay ₹${effectiveFeeAmount} via Razorpay & Complete Registration →`
                        )}
                      </button>
                      <p className="submit-hint">
                        {allRemainingFiveFilled
                          ? '⚠️ Please wait until payment verification completes. Do NOT refresh, press Back, or close this page until your confirmation slip is displayed.'
                          : 'Complete all remaining 5 members above in Step 02 to unlock the Razorpay payment button.'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </form>
      </section>

      {/* Full-Screen Payment & Verification Loader Overlay (Visible until payment response succeeds) */}
      {paymentStage !== 'idle' && (
        <div
          className="payment-processing-overlay"
          role="dialog"
          aria-modal="true"
          aria-live="assertive"
          aria-label="Payment processing in progress"
        >
          <div className="payment-processing-card">
            <div className="payment-overlay-spinner-wrap" aria-hidden="true">
              <div className="payment-overlay-spinner" />
              <div className="payment-overlay-spinner-inner" />
            </div>

            <span className="payment-overlay-badge">
              {paymentStage === 'verifying'
                ? 'STEP 3 OF 3 · VERIFYING TRANSACTION'
                : paymentStage === 'awaiting_checkout'
                  ? 'STEP 2 OF 3 · PAYMENT IN PROGRESS'
                  : 'STEP 1 OF 3 · INITIATING PAYMENT'}
            </span>

            <h2 className="payment-overlay-title">
              {paymentStage === 'verifying'
                ? 'Verifying Payment & Confirming Registration...'
                : paymentStage === 'awaiting_checkout'
                  ? 'Waiting for Payment Completion...'
                  : 'Connecting to Razorpay Gateway...'}
            </h2>

            <p className="payment-overlay-subtitle">
              {paymentStage === 'verifying'
                ? 'Your payment has been received. Please wait while we verify your transaction with Razorpay and generate your official Forensithon registration receipt.'
                : paymentStage === 'awaiting_checkout'
                  ? 'Complete your payment in the Razorpay window. Once paid, this screen will automatically verify and confirm your team registration.'
                  : 'Fetching official event fee from server and creating your secure Razorpay order.'}
            </p>

            <div className="payment-do-not-refresh-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <strong>Please wait until payment completes.</strong>
                <span>Do NOT refresh, press Back, or close this page until you see the confirmation receipt.</span>
              </div>
            </div>

            <div className="payment-stage-steps">
              <div className={`payment-stage-step ${paymentStage === 'creating_order' ? 'active' : 'done'}`}>
                <span className="stage-dot">{paymentStage === 'creating_order' ? '1' : '✓'}</span>
                <span>Order Created</span>
              </div>
              <div className="stage-connector" />
              <div className={`payment-stage-step ${paymentStage === 'awaiting_checkout' ? 'active' : paymentStage === 'verifying' ? 'done' : ''}`}>
                <span className="stage-dot">{paymentStage === 'verifying' ? '✓' : '2'}</span>
                <span>Razorpay Payment</span>
              </div>
              <div className="stage-connector" />
              <div className={`payment-stage-step ${paymentStage === 'verifying' ? 'active' : ''}`}>
                <span className="stage-dot">3</span>
                <span>Confirm &amp; Receipt</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
