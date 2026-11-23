import { useEffect, useMemo, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { API_BASE } from '../services/api';

const formatEventDateBadge = (rawDate) => {
  if (!rawDate) return '09 DEC 2026';
  try {
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return '09 DEC 2026';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return '09 DEC 2026';
  }
};

const getInitials = (name = '') => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const spaceOutBarcodeLabel = (code = '') => {
  return String(code || '').trim().split('').join(' ');
};

export default function ParticipantPassModal({ member, registration, onClose }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  const rollNumber = String(member?.rollNumber || member?.rollNo || member?.roll || '').trim().toUpperCase();
  const memberName = String(member?.name || 'Participant').trim();
  const isLead = Boolean(member?.isLeader || member?.no === 1);
  const institution = String(member?.college || 'Aditya University').trim();
  const department = String(member?.department || member?.branch || 'General').trim();
  const year = String(member?.year || '').trim();
  const branchAndDept = year ? `${department} • ${year}` : department;

  const rawTeamId = String(
    registration?.teamId || registration?.meta?.teamId || registration?.registrationNumber || 'FORENSIC2026'
  ).trim().toUpperCase();
  const teamId = rawTeamId.replace(/^FORENSIC2K26-/, 'FORENSIC2026-');

  const eventTitle = String(
    registration?.challengeTitle || registration?.eventTitle || 'FORENSITHON 2k26'
  ).trim().toUpperCase();

  const eventDateText = formatEventDateBadge(registration?.eventDate || registration?.schedule?.fromDate);
  const venueText = String(
    registration?.venueName || registration?.venue?.name || registration?.venue?.address || 'ADITYA UNIVERSITY CAMPUS'
  ).trim();

  // Exact barcode value stored in central_event_student_registrations.participants[].barcode
  const barcodeValue = String(member?.barcode || `FST-${rollNumber || '2026'}`).trim();

  const photoUrl = rollNumber
    ? `${API_BASE}/api/proxy/student-photo/${encodeURIComponent(rollNumber)}`
    : '';

  // Generate ISO/IEC 15417 compliant high-DPI CODE128 PNG data URL with exact integer bar widths,
  // 10X quiet zones, and wide scannable strip proportions matching the reference pass (zero scan issues on screen & PDF).
  const barcodeResult = useMemo(() => {
    if (!barcodeValue || typeof document === 'undefined') return { url: '', cssWidth: 620, cssHeight: 96 };
    try {
      // 1. Measure exact Code128 module count at width=1, margin=0
      const probeCanvas = document.createElement('canvas');
      JsBarcode(probeCanvas, barcodeValue, {
        format: 'CODE128',
        width: 1,
        height: 10,
        margin: 0,
        displayValue: false
      });
      const moduleCount = Math.max(probeCanvas.width || 120, 60);

      // 2. Choose crisp integer pixel width per module at 2x HiDPI so bars span ~580-620px wide (exact Image 1 look)
      const TARGET_BARS_PX_2X = 1160;
      const barWidth2x = Math.max(4, Math.min(10, Math.round(TARGET_BARS_PX_2X / moduleCount)));
      // ISO/IEC 15417 mandates at least 10x narrow bar width quiet zone on both sides
      const quietZone2x = barWidth2x * 10;
      const barHeight2x = 184;

      const canvas = document.createElement('canvas');
      JsBarcode(canvas, barcodeValue, {
        format: 'CODE128',
        lineColor: '#000000',
        background: '#ffffff',
        width: barWidth2x,
        height: barHeight2x,
        marginTop: 8,
        marginBottom: 8,
        marginLeft: quietZone2x,
        marginRight: quietZone2x,
        displayValue: false
      });

      return {
        url: canvas.toDataURL('image/png'),
        cssWidth: Math.round(canvas.width / 2),
        cssHeight: Math.round(canvas.height / 2)
      };
    } catch (err) {
      console.error('Barcode generation failed:', err);
      return { url: '', cssWidth: 620, cssHeight: 96 };
    }
  }, [barcodeValue]);

  useEffect(() => {
    setPhotoFailed(false);
  }, [rollNumber]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleCopyBarcode = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const textToCopy = String(barcodeValue || '').trim();
    if (!textToCopy) return;

    let success = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      } catch {}
    }
    if (!success && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {}
    }

    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2000);
  };

  const handleDownloadPassPdf = async () => {
    setDownloadingPdf(true);
    try {
      const passEl = document.getElementById('participant-credential-pass-card');
      if (!passEl) {
        window.print();
        return;
      }

      let h2p = window.html2pdf;
      if (!h2p) {
        try {
          const mod = await import('html2pdf.js');
          h2p = mod.default || mod;
        } catch {
          // fallback to print
        }
      }

      if (h2p) {
        const safeRoll = (rollNumber || 'PASS').replace(/[^A-Z0-9_-]/gi, '');
        const scrollArea = passEl.closest('.pass-modal-scroll-area');
        const prevScrollTop = scrollArea ? scrollArea.scrollTop : 0;
        if (scrollArea) scrollArea.scrollTop = 0;

        try {
          const cardWidthPx = Math.ceil(passEl.offsetWidth || 780);
          const captureWidthMm = Math.ceil((cardWidthPx * 25.4) / 96) + 4;

          // Capture the full pass card into a single high-DPI canvas (scrollY/scrollX = 0 avoids fixed-overlay shift)
          const canvas = await h2p()
            .set({
              margin: [0, 0, 0, 0],
              image: { type: 'png', quality: 1.0 },
              html2canvas: {
                scale: 3,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false,
                scrollY: 0,
                scrollX: 0,
                onclone: (clonedDoc) => {
                  const clonedCard = clonedDoc.querySelector('.html2pdf__container .fpass-card');
                  if (clonedCard) {
                    clonedCard.style.margin = '0 auto';
                    clonedCard.style.boxShadow = 'none';
                  }
                }
              },
              jsPDF: {
                unit: 'mm',
                format: [captureWidthMm, 300],
                orientation: 'portrait'
              }
            })
            .from(passEl)
            .toCanvas()
            .get('canvas');

          const { jsPDF } = await import('jspdf');
          const marginMm = 8;
          const contentWidthMm = 208;
          const contentHeightMm = (canvas.height / canvas.width) * contentWidthMm;
          const pageWidthMm = Number((contentWidthMm + marginMm * 2).toFixed(2));
          const pageHeightMm = Number((contentHeightMm + marginMm * 2).toFixed(2));

          const pdf = new jsPDF({
            unit: 'mm',
            format: [pageWidthMm, pageHeightMm],
            orientation: pageWidthMm >= pageHeightMm ? 'landscape' : 'portrait',
            compress: true
          });

          const imgData = canvas.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', marginMm, marginMm, contentWidthMm, contentHeightMm, undefined, 'FAST');
          pdf.save(`Forensithon_2026_Pass_${safeRoll}.pdf`);
        } finally {
          if (scrollArea) scrollArea.scrollTop = prevScrollTop;
        }
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Pass PDF export fallback:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!member) return null;

  return (
    <div
      className="pass-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Participant Entry Pass for ${memberName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pass-modal-shell">
        <div className="pass-modal-topbar">
          <div className="pass-modal-topbar-title">
            <span className="pass-modal-dot" />
            <strong>Official Entry Pass</strong>
            <span className="pass-modal-sub">— {memberName} ({rollNumber})</span>
          </div>
          <button
            type="button"
            className="pass-modal-close-btn"
            onClick={onClose}
            aria-label="Close pass popup"
          >
            ✕
          </button>
        </div>

        <div className="pass-modal-scroll-area">
          {/* Exact 2nd Reference Image Credential Pass Card */}
          <div id="participant-credential-pass-card" className="fpass-card">
            {/* Dark Navy Top Header Bar with Gold Accent */}
            <div className="fpass-header">
              <div className="fpass-header-brand">
                <div className="fpass-emblem-ring">
                  <img
                    src={`${import.meta.env.BASE_URL}aditya-emblem.png`}
                    alt="Aditya University"
                    className="fpass-emblem-img"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="fpass-brand-text">
                  <span className="fpass-brand-line1">ADITYA</span>
                  <span className="fpass-brand-line2">UNIVERSITY</span>
                </div>
              </div>

              <div className="fpass-header-center">
                <div className="fpass-title-pill">
                  <span className="fpass-star" aria-hidden="true">★</span>
                  <span>FORENSITHON 2k26</span>
                  <span className="fpass-star" aria-hidden="true">★</span>
                </div>
                <span className="fpass-credential-sub">OFFICIAL PARTICIPANT CREDENTIAL</span>
              </div>

              <div className="fpass-team-box">
                <span className="fpass-team-label">TEAM ID</span>
                <strong className="fpass-team-value">{teamId}</strong>
              </div>
            </div>

            {/* Middle Body: Left Photo/Status Column + Right Event & Participant Details */}
            <div className="fpass-body">
              <div className="fpass-left-col">
                <div className="fpass-photo-frame">
                  {photoUrl && !photoFailed ? (
                    <img
                      src={photoUrl}
                      alt={memberName}
                      className="fpass-photo-img"
                      crossOrigin="anonymous"
                      onError={() => setPhotoFailed(true)}
                    />
                  ) : (
                    <div className="fpass-photo-fallback" aria-label={memberName}>
                      <svg width="46" height="46" viewBox="0 0 24 24" fill="#2563eb" aria-hidden="true">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className={`fpass-role-pill ${isLead ? 'fpass-role-pill--lead' : 'fpass-role-pill--member'}`}>
                  {isLead ? 'TEAM PARTICIPANT' : 'TEAM PARTICIPANT'}
                </div>

                <div className="fpass-verified-box">
                  <div className="fpass-verified-top">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#0d8a55" aria-hidden="true">
                      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z" />
                    </svg>
                    <span>VERIFIED PASS</span>
                  </div>
                  <div className="fpass-verified-bottom">
                    <span className="fpass-verified-dot" />
                    <span>PAID &amp; CONFIRMED</span>
                  </div>
                </div>
              </div>

              <div className="fpass-right-col">
                <h2 className="fpass-event-title">{eventTitle}</h2>

                <div className="fpass-date-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Event Date: {eventDateText}</span>
                </div>

                <div className="fpass-details-grid">
                  <div className="fpass-detail-item">
                    <span className="fpass-detail-icon fpass-detail-icon--blue" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    </span>
                    <div className="fpass-detail-text">
                      <span className="fpass-detail-label">PARTICIPANT NAME</span>
                      <strong className="fpass-detail-value">{memberName}</strong>
                    </div>
                  </div>

                  <div className="fpass-detail-item">
                    <span className="fpass-detail-icon fpass-detail-icon--dark" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l2.4 2.4 3.4-.5.9 3.3 3 1.7-1.2 3.2 1.2 3.2-3 1.7-.9 3.3-3.4-.5L12 22l-2.4-2.4-3.4.5-.9-3.3-3-1.7 1.2-3.2-1.2-3.2 3-1.7.9-3.3 3.4.5L12 2zm-1.1 13.4l5.2-5.2-1.4-1.4-3.8 3.8-1.6-1.6-1.4 1.4 3 3z" />
                      </svg>
                    </span>
                    <div className="fpass-detail-text">
                      <span className="fpass-detail-label">ROLL NUMBER</span>
                      <strong className="fpass-detail-value">{rollNumber}</strong>
                    </div>
                  </div>

                  <div className="fpass-detail-item">
                    <span className="fpass-detail-icon fpass-detail-icon--amber" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-7 9.18V16l7 3.82L19 16v-3.82L12 16l-7-3.82z" />
                      </svg>
                    </span>
                    <div className="fpass-detail-text">
                      <span className="fpass-detail-label">INSTITUTION</span>
                      <strong className="fpass-detail-value">{institution}</strong>
                    </div>
                  </div>

                  <div className="fpass-detail-item">
                    <span className="fpass-detail-icon fpass-detail-icon--purple" aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 3H3v6h6V3zm12 0h-6v6h6V3zM9 15H3v6h6v-6zm12 0h-6v6h6v-6zM11 5h2v4h-2V5zm0 10h2v4h-2v-4zM5 11h4v2H5v-2zm10 0h4v2h-4v-2z" />
                      </svg>
                    </span>
                    <div className="fpass-detail-text">
                      <span className="fpass-detail-label">BRANCH &amp; DEPT</span>
                      <strong className="fpass-detail-value">{branchAndDept}</strong>
                    </div>
                  </div>
                </div>

                <div className="fpass-venue-bar">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#d97706" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
                  </svg>
                  <span>VENUE: {venueText}</span>
                </div>
              </div>
            </div>

            {/* Perforated Ticket Cutout Line */}
            <div className="fpass-perforation" aria-hidden="true">
              <span className="fpass-notch fpass-notch--left" />
              <div className="fpass-dashed-line" />
              <span className="fpass-notch fpass-notch--right" />
            </div>

            {/* Scannable High-Contrast Code128 Barcode Section */}
            <div className="fpass-barcode-section">
              <div className="fpass-barcode-box">
                {barcodeResult.url ? (
                  <img
                    src={barcodeResult.url}
                    alt={`Barcode ${barcodeValue}`}
                    className="fpass-barcode-img"
                    style={{
                      width: `${barcodeResult.cssWidth}px`,
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                  />
                ) : (
                  <div className="fpass-barcode-fallback">{barcodeValue}</div>
                )}
              </div>

              <div className="fpass-footer-strip">
                <div className="fpass-footer-left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#0f2544" aria-hidden="true">
                    <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 1 1 0 4v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 1 1 0-4z" />
                  </svg>
                  <span>ENTRY PASS</span>
                </div>
                <div className="fpass-footer-code-wrap">
                  <span
                    className="fpass-footer-code"
                    onClick={handleCopyBarcode}
                    title="Click to copy barcode"
                  >
                    {spaceOutBarcodeLabel(barcodeValue)}
                  </span>
                  <button
                    type="button"
                    className={`fpass-barcode-copy-btn ${copiedBarcode ? 'copied' : ''}`}
                    onClick={handleCopyBarcode}
                    title={copiedBarcode ? 'Barcode Copied!' : `Copy barcode (${barcodeValue})`}
                    aria-label={`Copy barcode ${barcodeValue}`}
                    data-html2canvas-ignore="true"
                  >
                    {copiedBarcode ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                    {copiedBarcode && <span className="fpass-copy-tooltip">Copied!</span>}
                  </button>
                </div>
                <div className="fpass-footer-right">NON-TRANSFERABLE • CARRY ID</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pass-modal-actions">
          <button
            type="button"
            className="button download-pdf-btn"
            onClick={handleDownloadPassPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? 'Generating Pass PDF...' : 'Download Pass (PDF) ↓'}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => window.print()}
          >
            Print Pass ⎙
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
