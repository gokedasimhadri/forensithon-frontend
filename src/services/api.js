// Central API service for Forensithon
// Connects dynamically to unified-backend for Central Events (types, categories, events) & student lookup

export const EVENT_TYPE = (
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_EVENT_TYPE || import.meta.env?.EVENT_TYPE)) ||
  'FORENSITHON'
).trim().toUpperCase();

export const API_BASE = (
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_BACKEND_URL || import.meta.env?.VITE_API_URL)) ||
  'http://localhost:9022'
).replace(/\/+$/, '');

export const ECAP_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ECAP_API_KEY) ||
  '4T4K65HWxqKD90AEZoCZLqA+m3nq6JvwDRDHIJUBFc4=';

export function buildApiUrl(path = '') {
  if (!path) return API_BASE;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${cleanPath}` : cleanPath;
}

export async function apiFetch(endpoint, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const fetchOpts = { ...options, signal: controller.signal };
  const directUrl = buildApiUrl(endpoint);

  try {
    const res = await fetch(directUrl, fetchOpts);
    return res;
  } catch (err) {
    if (API_BASE && !endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      const fallbackUrl = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      try {
        const fallbackController = new AbortController();
        const fallbackTimer = setTimeout(() => fallbackController.abort(), timeoutMs);
        try {
          const fallbackRes = await fetch(fallbackUrl, { ...options, signal: fallbackController.signal });
          return fallbackRes;
        } finally {
          clearTimeout(fallbackTimer);
        }
      } catch {
        // Relative proxy fallback also failed
      }
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

/**
 * Lookup student details by Roll Number from unified-backend first,
 * then fallback to /adityaapi proxy if needed.
 */
export async function fetchStudentByRollNumber(rollNo) {
  if (!rollNo || !rollNo.trim()) return null;
  const cleanRoll = rollNo.trim().toUpperCase();

  // 1. Unified Backend Forensithon Student Endpoint (ECAP + DB fallback)
  try {
    const res = await apiFetch(`/api/forensithon/student/${encodeURIComponent(cleanRoll)}`, {}, 10000);
    if (res && res.ok) {
      const json = await res.json();
      if (json?.success && json?.data && (json.data.studentname || json.data.studentName || json.data.name)) {
        return json.data;
      }
    }
  } catch {
    // try next endpoint
  }

  // 2. Unified Backend EventStudent ECAP Endpoint (also falls back to central_event_student_account)
  try {
    const res = await apiFetch(`/api/event-students/ecap-student/${encodeURIComponent(cleanRoll)}`, {}, 10000);
    if (res && res.ok) {
      const json = await res.json();
      if (json?.success && json?.data && (json.data.studentname || json.data.studentName || json.data.name)) {
        return json.data;
      }
    }
  } catch {
    // try next fallback
  }

  // 3. Vite proxy fallback to info.aec.edu.in (for local dev when backend is unavailable)
  const proxyEndpoints = [
    `/adityaapi/api/studentdata/${encodeURIComponent(cleanRoll)}`,
    `/forensithon/adityaapi/api/studentdata/${encodeURIComponent(cleanRoll)}`
  ];
  for (const url of proxyEndpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'x-api-key': ECAP_API_KEY,
          'X-API-Key': ECAP_API_KEY
        }
      });
      if (res.ok) {
        const json = await res.json();
        const item = Array.isArray(json) ? json[0] : json;
        if (item && !item.error && (item.studentname || item.studentName || item.name)) {
          return item;
        }
      }
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * Decode HTML/rich-text description from Central Event into plain text & optional dual scopes
 * Supports both structured Forensic/Technical headings and standard plain/HTML descriptions.
 */
export function parseChallengeDescription(rawDescription = '') {
  if (!rawDescription || typeof rawDescription !== 'string') {
    return {
      forensic: '',
      technical: '',
      plainDescription: '',
      hasSplitScopes: false
    };
  }

  let normalizedText = rawDescription;

  if (typeof document !== 'undefined') {
    try {
      // Add block spacing before converting HTML to readable text
      const spacedHtml = rawDescription
        .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article)>/gi, '</$1>\n')
        .replace(/<br\s*\/?>/gi, '\n');
      const container = document.createElement('div');
      container.innerHTML = spacedHtml;
      normalizedText = (container.textContent || container.innerText || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch {
      normalizedText = rawDescription.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  } else {
    normalizedText = rawDescription.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const forensicLabelRe = /\bFORENSIC(?:\s+SCIENCE)?\s+(?:ROLE|SCOPE)\b\s*[:\-–—]?/i;
  const technicalLabelRe = /\bTECHNICAL(?:\s*[/&]\s*|\s+AND\s+|\s+)?(?:ENGINEERING\s+)?(?:ROLE|SCOPE)\b\s*[:\-–—]?/i;

  const fMatch = forensicLabelRe.exec(normalizedText);
  const tMatch = technicalLabelRe.exec(normalizedText);

  let forensic = '';
  let technical = '';

  if (fMatch && tMatch) {
    if (fMatch.index < tMatch.index) {
      forensic = normalizedText.slice(fMatch.index + fMatch[0].length, tMatch.index).trim();
      technical = normalizedText.slice(tMatch.index + tMatch[0].length).trim();
    } else {
      technical = normalizedText.slice(tMatch.index + tMatch[0].length, fMatch.index).trim();
      forensic = normalizedText.slice(fMatch.index + fMatch[0].length).trim();
    }
  } else if (fMatch) {
    forensic = normalizedText.slice(fMatch.index + fMatch[0].length).trim();
  } else if (tMatch) {
    technical = normalizedText.slice(tMatch.index + tMatch[0].length).trim();
  }

  // Strip stray leading/trailing whitespace & collapse internal multi-newlines for card paragraphs
  const cleanBlock = (txt) => txt.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  forensic = cleanBlock(forensic);
  technical = cleanBlock(technical);
  const plainDescription = cleanBlock(normalizedText);

  return {
    forensic,
    technical,
    plainDescription,
    hasSplitScopes: Boolean(forensic || technical)
  };
}

/**
 * Extract optional challenge prefix code (e.g. "DF-01: Title" -> { explicitCode: "DF-01", cleanTitle: "Title" })
 */
function splitTitleCode(rawTitle = '') {
  const title = String(rawTitle || '').trim();
  const m = title.match(/^([A-Z]{2,10}-\d{1,3})\s*[:\-–—]?\s+(.+)$/);
  if (m) {
    return { explicitCode: m[1].toUpperCase(), cleanTitle: m[2].trim() };
  }
  return { explicitCode: '', cleanTitle: title };
}

/**
 * Fetch active Event Type metadata from unified-backend
 */
export async function fetchEventTypeMeta(typeCode = EVENT_TYPE) {
  const code = (typeCode || EVENT_TYPE).toUpperCase();
  try {
    const res = await apiFetch('/api/central-event-types');
    if (!res.ok) return null;
    const json = await res.json();
    const list = Array.isArray(json) ? json : json.data || [];
    return list.find((t) => String(t.code || '').toUpperCase() === code) || null;
  } catch {
    return null;
  }
}

/**
 * Fetch sorted active Event Categories for a Central Event Type
 */
export async function fetchCategoriesByType(typeCode = EVENT_TYPE) {
  const code = (typeCode || EVENT_TYPE).toUpperCase();
  const res = await apiFetch(`/api/central-event-types/${encodeURIComponent(code)}/categories?fresh=1`);
  if (!res.ok) {
    throw new Error(`Failed to fetch categories (${res.status})`);
  }
  const json = await res.json();
  const list = Array.isArray(json) ? json : json.data || [];
  return [...list]
    .filter((cat) => cat.isActive !== false)
    .sort((a, b) => {
      const sortA = Number(a.sortOrder ?? 999);
      const sortB = Number(b.sortOrder ?? 999);
      if (sortA !== sortB) return sortA - sortB;
      return String(a.name || a.code || '').localeCompare(String(b.name || b.code || ''));
    });
}

/**
 * Fetch all active/published Central Events for a Central Event Type (handles cursor pagination)
 */
export async function fetchCentralEventsByType(typeCode = EVENT_TYPE) {
  const code = (typeCode || EVENT_TYPE).toUpperCase();
  const allEvents = [];
  let cursor = null;
  let pages = 0;

  do {
    const params = new URLSearchParams({
      typeCode: code,
      limit: '100'
    });
    if (cursor) params.set('cursor', cursor);

    const res = await apiFetch(`/api/central-events?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch events (${res.status})`);
    }

    const json = await res.json();
    const batch = Array.isArray(json) ? json : json.data || [];
    allEvents.push(...batch);
    cursor = json.nextCursor || null;
    pages += 1;
  } while (cursor && pages < 10);

  return allEvents.filter((ev) => String(ev.status || '').toUpperCase() !== 'CANCELLED');
}

/**
 * Fetch complete dynamic Forensithon catalog:
 * - categories (tracks sorted strictly by sortOrder)
 * - challenges (normalized Central Events mapped to their sorted category/track)
 */
export async function fetchForensithonCatalog(typeCode = EVENT_TYPE) {
  const code = (typeCode || EVENT_TYPE).toUpperCase();

  const [eventTypeMeta, rawCategories, rawEvents] = await Promise.all([
    fetchEventTypeMeta(code).catch(() => null),
    fetchCategoriesByType(code),
    fetchCentralEventsByType(code)
  ]);

  // First group raw events by category _id (or category name fallback)
  const categoryIndexById = new Map();
  const categoryIndexByName = new Map();
  rawCategories.forEach((cat, idx) => {
    if (cat._id) categoryIndexById.set(String(cat._id), idx);
    if (cat.name) categoryIndexByName.set(String(cat.name).trim().toLowerCase(), idx);
  });

  const normalizedChallenges = [];
  const challengesByCatIndex = rawCategories.map(() => []);

  rawEvents.forEach((ev) => {
    const evCatId = typeof ev.categoryId === 'object' ? ev.categoryId?._id : ev.categoryId;
    let catIdx = evCatId && categoryIndexById.has(String(evCatId)) ? categoryIndexById.get(String(evCatId)) : -1;
    if (catIdx === -1 && ev.categoryName) {
      const key = String(ev.categoryName).trim().toLowerCase();
      if (categoryIndexByName.has(key)) catIdx = categoryIndexByName.get(key);
    }
    if (catIdx === -1) return; // Event does not match an active category for this type

    challengesByCatIndex[catIdx].push(ev);
  });

  const domains = rawCategories.map((cat, idx) => {
    const trackNumber = Number(cat.sortOrder) > 0 ? Number(cat.sortOrder) : idx + 1;
    const catCode = (cat.code || `T${trackNumber}`).toUpperCase();
    const catEvents = challengesByCatIndex[idx] || [];

    // Sort events deterministically within track (explicit code/schedule/createdAt)
    catEvents.sort((a, b) => {
      const ca = splitTitleCode(a.title).explicitCode;
      const cb = splitTitleCode(b.title).explicitCode;
      if (ca && cb && ca !== cb) return ca.localeCompare(cb, undefined, { numeric: true });
      const da = a.schedule?.fromDate ? new Date(a.schedule.fromDate).getTime() : 0;
      const db = b.schedule?.fromDate ? new Date(b.schedule.fromDate).getTime() : 0;
      if (da !== db) return da - db;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (ta !== tb) return ta - tb;
      return String(a._id || '').localeCompare(String(b._id || ''));
    });

    const mappedEvents = catEvents.map((ev, evIdx) => {
      const { explicitCode, cleanTitle } = splitTitleCode(ev.title);
      const challengeCode = explicitCode || `${catCode}-${String(evIdx + 1).padStart(2, '0')}`;
      const parsed = parseChallengeDescription(ev.description);

      const minTeam = Number(ev.participation?.minTeamSize || 1);
      const maxTeam = Number(ev.participation?.maxTeamSize || minTeam || 1);
      const teamType = String(ev.participation?.type || 'TEAM').toUpperCase();
      const feeRupees = ev.fee?.amount !== undefined ? Math.round(Number(ev.fee.amount) / 100) : null;

      let squadLabel = 'Squad of 6: 2 Forensic/CSDF + 2 Engineering + 2 Open Disciplines';
      if (teamType === 'SINGLE') {
        squadLabel = 'Individual Entry';
      } else if (minTeam !== 6 || maxTeam !== 6) {
        squadLabel = minTeam === maxTeam
          ? `Team of ${minTeam} participants`
          : `Team of ${minTeam}–${maxTeam} participants`;
      }

      const eventSubFields = [];
      if (parsed.forensic) eventSubFields.push({ label: 'FORENSIC SCIENCE SCOPE', value: parsed.forensic });
      if (parsed.technical) eventSubFields.push({ label: 'TECHNICAL & ENGINEERING SCOPE', value: parsed.technical });

      const challengeItem = {
        _id: ev._id,
        slug: ev.slug,
        id: challengeCode,
        title: cleanTitle || ev.title,
        rawTitle: ev.title,
        sourceType: 'central_event',
        categoryId: String(cat._id),
        categoryCode: catCode,
        categoryName: cat.name,
        domain: trackNumber,
        domainSortOrder: Number(cat.sortOrder ?? trackNumber),
        forensic: parsed.forensic,
        technical: parsed.technical,
        descriptionText: parsed.plainDescription,
        descriptionHtml: ev.description || '',
        subFields: eventSubFields,
        hasSplitScopes: parsed.hasSplitScopes,
        outcomes: Array.isArray(ev.outcomes) ? ev.outcomes.filter(Boolean) : [],
        rules: Array.isArray(ev.rules) ? ev.rules.filter(Boolean) : [],
        participation: ev.participation || { type: 'TEAM', minTeamSize: 6, maxTeamSize: 6 },
        squadLabel,
        feeRupees,
        mode: ev.mode || 'OFFLINE',
        venueName: ev.venue?.name || '',
        schedule: ev.schedule || null,
        rounds: Number(ev.rounds || 1),
        status: ev.status || 'PUBLISHED',
        coordinators: ev.coordinators || {}
      };

      return challengeItem;
    });

    // Also include active Subcategories (with description & subFields) defined on this Category
    const rawSubcategories = Array.isArray(cat.subcategories)
      ? [...cat.subcategories]
          .filter((s) => s && s.isActive !== false)
          .sort((a, b) => {
            const sa = Number(a.sortOrder ?? 999);
            const sb = Number(b.sortOrder ?? 999);
            if (sa !== sb) return sa - sb;
            return String(a.code || a.name || '').localeCompare(String(b.code || b.name || ''), undefined, { numeric: true });
          })
      : [];

    const existingTitleOrIdSet = new Set(
      mappedEvents.flatMap((m) => [m.id.toUpperCase(), (m.title || '').trim().toLowerCase()])
    );

    const mappedSubcategories = rawSubcategories
      .map((sub, subIdx) => {
        const subCode = (sub.code || '').trim().toUpperCase();
        const subTitle = (sub.name || sub.code || '').trim();
        const challengeCode = /^[A-Z]{2,10}-\d{1,3}$/.test(subCode)
          ? subCode
          : subCode || `${catCode}-${String(mappedEvents.length + subIdx + 1).padStart(2, '0')}`;

        // Avoid duplicate if same challenge is already published in central_events without extra subFields
        const normSubFields = Array.isArray(sub.subFields)
          ? sub.subFields
              .map((sf) => ({
                label: String(sf?.label || '').trim(),
                value: String(sf?.value || '').trim()
              }))
              .filter((sf) => sf.label || sf.value)
          : [];

        const descParsed = parseChallengeDescription(sub.description || '');
        let forensicScope = descParsed.forensic || '';
        let technicalScope = descParsed.technical || '';

        normSubFields.forEach((sf) => {
          if (/forensic/i.test(sf.label) && !forensicScope) {
            forensicScope = sf.value;
          } else if (/(tech|eng|computer|\bcs\b|software)/i.test(sf.label) && !technicalScope) {
            technicalScope = sf.value;
          }
        });

        const hasBothOrSplit = Boolean(forensicScope || technicalScope);

        return {
          _id: String(sub._id || `${cat._id}_sub_${subCode || subIdx}`),
          slug: subCode.toLowerCase() || challengeCode.toLowerCase(),
          id: challengeCode,
          title: subTitle,
          rawTitle: subTitle,
          sourceType: 'subcategory',
          categoryId: String(cat._id),
          categoryCode: catCode,
          categoryName: cat.name,
          domain: trackNumber,
          domainSortOrder: Number(cat.sortOrder ?? trackNumber),
          forensic: forensicScope,
          technical: technicalScope,
          descriptionText: descParsed.plainDescription || sub.description || '',
          descriptionHtml: sub.description || '',
          subFields: normSubFields,
          hasSplitScopes: hasBothOrSplit && normSubFields.length <= 2 && Boolean(forensicScope || technicalScope),
          outcomes: [],
          rules: [],
          participation: { type: 'TEAM', minTeamSize: 6, maxTeamSize: 6 },
          squadLabel: 'Squad of 6: 2 Forensic/CSDF + 2 Engineering + 2 Open Disciplines',
          feeRupees: null,
          mode: 'OFFLINE',
          venueName: '',
          schedule: null,
          rounds: 1,
          status: 'PUBLISHED',
          coordinators: sub.coordinators || {}
        };
      })
      .filter(
        (subItem) =>
          !existingTitleOrIdSet.has(subItem.id.toUpperCase()) &&
          !existingTitleOrIdSet.has((subItem.title || '').trim().toLowerCase())
      );

    const combinedChallenges = [...mappedEvents, ...mappedSubcategories];
    combinedChallenges.forEach((item) => normalizedChallenges.push(item));

    let idsRange = `${catCode} Track`;
    if (combinedChallenges.length === 1) {
      idsRange = combinedChallenges[0].id;
    } else if (combinedChallenges.length > 1) {
      idsRange = `${combinedChallenges[0].id} to ${combinedChallenges[combinedChallenges.length - 1].id}`;
    } else {
      idsRange = 'No challenges yet';
    }

    const focusText =
      (cat.description && cat.description.trim()) ||
      (combinedChallenges.length > 0
        ? `Problem statements and technical/forensic challenges under ${cat.name}.`
        : `Challenges added under ${cat.name} in Central Events will appear here automatically.`);

    return {
      _id: String(cat._id),
      number: trackNumber,
      sortOrder: Number(cat.sortOrder ?? idx + 1),
      code: catCode,
      name: cat.name,
      title: cat.description?.trim() ? cat.description.trim() : cat.name,
      shortName: cat.name,
      focus: cat.description?.trim() ? cat.description.trim() : focusText,
      ids: idsRange,
      banner: cat.banner || null,
      coordinator: cat.coordinator || null,
      coordinators: cat.coordinators || [],
      academicYear: cat.academicYear || '',
      count: combinedChallenges.length,
      challenges: combinedChallenges
    };
  });

  return {
    eventType: eventTypeMeta,
    typeCode: code,
    domains,
    challenges: normalizedChallenges
  };
}

// ─── Team Leader Account & Registration Flow (central_event_student_*) ──────

const TEAM_LEADER_STORAGE_KEY = 'forensithon_team_leader_session';
const TEAM_LEADER_TOKEN_KEY = 'forensithon_team_leader_token';

function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('forensithon-auth-changed'));
  }
}

export function getStoredAuthToken() {
  try {
    return localStorage.getItem(TEAM_LEADER_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TEAM_LEADER_TOKEN_KEY, token);
    }
  } catch {
    // non-fatal
  }
}

function getAuthHeaders(extra = {}) {
  const token = getStoredAuthToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

export function getStoredTeamLeader() {
  try {
    const raw = localStorage.getItem(TEAM_LEADER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredTeamLeader(student, token = null) {
  try {
    if (student) {
      localStorage.setItem(TEAM_LEADER_STORAGE_KEY, JSON.stringify(student));
    }
    if (token) {
      localStorage.setItem(TEAM_LEADER_TOKEN_KEY, token);
    }
    notifyAuthChanged();
  } catch {
    // non-fatal
  }
}

export function clearStoredTeamLeader() {
  try {
    localStorage.removeItem(TEAM_LEADER_STORAGE_KEY);
    localStorage.removeItem(TEAM_LEADER_TOKEN_KEY);
    notifyAuthChanged();
  } catch {
    // non-fatal
  }
}

/**
 * Validate/refresh stored JWT token session across visits
 */
export async function refreshLoggedInStudent() {
  const token = getStoredAuthToken();
  if (!token) return getStoredTeamLeader();
  try {
    const res = await apiFetch('/api/event-students/me', {
      headers: getAuthHeaders()
    });
    if (res.status === 401) {
      clearStoredTeamLeader();
      return null;
    }
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success && json.student) {
      saveStoredTeamLeader(json.student);
      return json.student;
    }
  } catch {
    // keep cached session if offline/unreachable
  }
  return getStoredTeamLeader();
}

/**
 * Register Team Leader in central_event_student_account with teamName & role: 'Team Leader'.
 * Does NOT auto-login; frontend routes to the Login tab so the Team Leader logs in with their credentials.
 */
export async function registerTeamLeaderAccount(payload) {
  const res = await apiFetch('/api/event-students/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      role: 'Team Leader',
      isTeamLeader: true
    })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || 'Unable to register Team Leader account.');
  }
  return json.student || json.data;
}

/**
 * Authenticate existing Team Leader or Team Member from central_event_student_account and persist JWT token
 */
export async function loginTeamLeaderAccount({ email, password }) {
  const res = await apiFetch('/api/event-students/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || 'Invalid credentials.');
  }
  const student = json.student || json.data;
  const token = json.token || '';
  saveStoredTeamLeader(student, token);
  return { student, token };
}

/**
 * Fetch logged-in user's saved team draft/confirmed registration & payment state
 */
export async function fetchTeamLeaderState(rollNo) {
  if (!rollNo) return null;
  const cleanRoll = encodeURIComponent(String(rollNo).trim().toUpperCase());
  const res = await apiFetch(`/api/forensithon/team/${cleanRoll}`, {
    headers: getAuthHeaders()
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    return null;
  }
  return json.data || null;
}

/**
 * Save Team Name, Team Leader, and Remaining Members to central_event_student_registrations
 */
export async function saveTeamMembersDraft(payload) {
  const res = await apiFetch('/api/forensithon/save-team', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || 'Unable to save team members.');
  }
  return json.data || json;
}

export async function createForensithonOrder(payload) {
  const res = await apiFetch('/api/forensithon/create-order', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.details || json.message || 'Failed to initiate Razorpay order.');
  }
  return json;
}

export async function verifyForensithonPayment(payload) {
  const res = await apiFetch('/api/forensithon/verify-payment', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.details || json.message || 'Payment verification failed.');
  }
  return json;
}

