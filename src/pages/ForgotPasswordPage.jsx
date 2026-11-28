import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  lookupStudentForReset,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword
} from '../services/api';
import { validatePassword } from '../components/LoginModal';

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Multi-step states: 1 = Roll & Email, 2 = Enter OTP, 3 = Update Password, 4 = Success
  const [step, setStep] = useState(1);

  // Form states
  const [roll, setRoll] = useState('');
  const [email, setEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI helpers
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupSuccess, setLookupSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef(null);
  const newPwInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Check URL query params for ?roll=...
  useEffect(() => {
    const queryRoll = searchParams.get('roll') || searchParams.get('identifier');
    if (queryRoll) {
      const clean = queryRoll.trim().toUpperCase();
      setRoll(clean);
      handleRollLookup(clean);
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus management on step change
  useEffect(() => {
    if (step === 2 && otpInputRef.current) {
      otpInputRef.current.focus();
    } else if (step === 3 && newPwInputRef.current) {
      newPwInputRef.current.focus();
    }
  }, [step]);

  // Auto-lookup student email based on Roll No
  const handleRollLookup = async (rollToSearch) => {
    const clean = (rollToSearch || '').trim().toUpperCase();
    if (!clean || clean.length < 3) return;

    setLookingUp(true);
    setErrorMsg('');
    try {
      const res = await lookupStudentForReset(clean);
      if (res && res.success && res.email) {
        setEmail(res.email);
        setStudentName(res.name || '');
        setLookupSuccess(true);
      } else {
        setLookupSuccess(false);
      }
    } catch (err) {
      setLookupSuccess(false);
      // Only set error if roll looks fully typed
      if (clean.length >= 7) {
        setErrorMsg(err.message || 'No account found with this Roll Number in Forensithon.');
      }
    } finally {
      setLookingUp(false);
    }
  };

  const onRollChange = (e) => {
    const val = e.target.value.toUpperCase();
    setRoll(val);
    setLookupSuccess(false);
    setErrorMsg('');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 4) {
      debounceTimerRef.current = setTimeout(() => {
        handleRollLookup(val);
      }, 500);
    } else {
      setEmail('');
      setStudentName('');
    }
  };

  // STEP 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanRoll = roll.trim().toUpperCase();
    if (!cleanRoll) {
      setErrorMsg('Please enter your Roll Number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // If email isn't loaded yet, try looking up first
      let targetEmail = email;
      if (!targetEmail) {
        const lookup = await lookupStudentForReset(cleanRoll);
        targetEmail = lookup.email;
        setEmail(lookup.email);
        setStudentName(lookup.name || '');
        setLookupSuccess(true);
      }

      const res = await sendForgotPasswordOtp(cleanRoll, targetEmail);
      setSuccessMsg(res.message || `A 6-digit OTP has been sent to ${targetEmail}`);
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await sendForgotPasswordOtp(roll.trim().toUpperCase(), email);
      setSuccessMsg(res.message || 'New OTP sent successfully.');
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg('Please enter the valid 6-digit OTP sent to your email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await verifyForgotPasswordOtp(roll.trim().toUpperCase(), cleanOtp);
      setSuccessMsg(res.message || 'OTP verified successfully!');
      setStep(3);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const pwError = validatePassword(newPassword);
    if (pwError) {
      setErrorMsg(pwError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and Confirm password do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await resetForgotPassword(
        roll.trim().toUpperCase(),
        otp.trim(),
        newPassword.trim(),
        confirmPassword.trim()
      );
      setSuccessMsg(res.message || 'Password updated successfully!');
      setStep(4);

      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/registration?auth=login');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="forgot-password-page">
      <div className="forgot-password-container">
        {/* Breadcrumb Navigation */}
        <div className="forgot-breadcrumb">
          <Link to="/" className="forgot-breadcrumb-link">Home</Link>
          <span className="forgot-breadcrumb-sep">/</span>
          <span className="forgot-breadcrumb-current">Reset Password</span>
        </div>

        {/* Main Card */}
        <div className="forgot-card">
          {/* Card Header */}
          <div className="forgot-card-header">
            <div className="forgot-badge">FORENSITHON 2k26 ACCOUNT SECURITY</div>
            <h1 className="forgot-title">
              {step === 1 && 'Forgot Password'}
              {step === 2 && 'Verify 6-Digit OTP'}
              {step === 3 && 'Update New Password'}
              {step === 4 && 'Password Updated!'}
            </h1>
            <p className="forgot-subtitle">
              {step === 1 && 'Enter your university Roll Number to fetch your registered account email and receive a verification OTP.'}
              {step === 2 && `We've sent a 6-digit verification code to ${email || 'your registered email'}.`}
              {step === 3 && 'Create a strong new password for your Forensithon student account.'}
              {step === 4 && 'Your password has been securely updated in the student records.'}
            </p>

            {/* Stepper Progress Indicator */}
            {step < 4 && (
              <div className="forgot-stepper">
                <div className={`stepper-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                  <div className="stepper-circle">{step > 1 ? '✓' : '1'}</div>
                  <span className="stepper-label">Find Account</span>
                </div>
                <div className={`stepper-line ${step > 1 ? 'active' : ''}`} />
                <div className={`stepper-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                  <div className="stepper-circle">{step > 2 ? '✓' : '2'}</div>
                  <span className="stepper-label">Verify OTP</span>
                </div>
                <div className={`stepper-line ${step > 2 ? 'active' : ''}`} />
                <div className={`stepper-step ${step >= 3 ? 'active' : ''}`}>
                  <div className="stepper-circle">3</div>
                  <span className="stepper-label">New Password</span>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="forgot-alert forgot-alert--error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="forgot-alert forgot-alert--success" role="status">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Roll & Email Lookup */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="forgot-form" noValidate>
              <div className="forgot-field">
                <label htmlFor="resetRoll" className="forgot-label">
                  University Roll Number <span className="req-star">*</span>
                </label>
                <div className="forgot-input-wrap">
                  <input
                    id="resetRoll"
                    type="text"
                    className="forgot-input"
                    placeholder="e.g. 22A91A0501"
                    value={roll}
                    onChange={onRollChange}
                    onBlur={() => handleRollLookup(roll)}
                    autoComplete="username"
                    required
                  />
                  {lookingUp && (
                    <span className="forgot-input-badge badge--loading">
                      Looking up...
                    </span>
                  )}
                  {!lookingUp && lookupSuccess && (
                    <span className="forgot-input-badge badge--success">
                      ✓ Account Found
                    </span>
                  )}
                </div>
                {studentName && (
                  <p className="forgot-hint-success">
                    Student: <strong>{studentName}</strong>
                  </p>
                )}
              </div>

              <div className="forgot-field">
                <label htmlFor="resetEmail" className="forgot-label">
                  Registered Email ID <span className="req-star">*</span>
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  className="forgot-input forgot-input--readonly"
                  placeholder="Auto-filled from central student account"
                  value={email}
                  readOnly
                  required
                />
                <p className="forgot-hint">
                  {email
                    ? 'The 6-digit OTP will be delivered to this verified email address.'
                    : 'Enter your Roll Number above to automatically load your registered email.'}
                </p>
              </div>

              <div className="forgot-btn-row">
                <button
                  type="submit"
                  className="forgot-submit-btn"
                  disabled={loading || lookingUp || !roll.trim() || !email.trim()}
                >
                  {loading ? 'SENDING OTP...' : 'SEND 6-DIGIT OTP →'}
                </button>
              </div>

              <div className="forgot-back-row">
                <Link to="/registration?auth=login" className="forgot-back-link">
                  ← Back to Student Login
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Enter 6-Digit OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="forgot-form" noValidate>
              <div className="forgot-field">
                <label htmlFor="resetOtp" className="forgot-label">
                  Enter 6-Digit Verification Code <span className="req-star">*</span>
                </label>
                <input
                  ref={otpInputRef}
                  id="resetOtp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="forgot-input forgot-input--otp"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
                <p className="forgot-hint">
                  Check the inbox or spam folder of <strong>{email}</strong> for the 6-digit code.
                </p>
              </div>

              <div className="forgot-btn-row">
                <button
                  type="submit"
                  className="forgot-submit-btn"
                  disabled={loading || otp.trim().length !== 6}
                >
                  {loading ? 'VERIFYING CODE...' : 'CONFIRM OTP & CONTINUE →'}
                </button>
              </div>

              <div className="forgot-actions-row">
                <button
                  type="button"
                  className="forgot-text-btn"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP to Email'}
                </button>
                <span className="dot-sep">•</span>
                <button
                  type="button"
                  className="forgot-text-btn"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setErrorMsg('');
                  }}
                >
                  Change Roll Number
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Update New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="forgot-form" noValidate>
              <div className="forgot-field">
                <label htmlFor="newPassword" className="forgot-label">
                  Enter New Password <span className="req-star">*</span>
                </label>
                <div className="forgot-password-wrap">
                  <input
                    ref={newPwInputRef}
                    id="newPassword"
                    type={showNewPw ? 'text' : 'password'}
                    className="forgot-input"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="forgot-pw-toggle"
                    onClick={() => setShowNewPw((v) => !v)}
                  >
                    {showNewPw ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <p className="forgot-hint">
                  Min 8 chars, 1 capital (A-Z), 1 number (0-9), & allowed special chars (@, _, $, #, !)
                </p>
              </div>

              <div className="forgot-field">
                <label htmlFor="confirmPassword" className="forgot-label">
                  Confirm New Password <span className="req-star">*</span>
                </label>
                <div className="forgot-password-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirmPw ? 'text' : 'password'}
                    className="forgot-input"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="forgot-pw-toggle"
                    onClick={() => setShowConfirmPw((v) => !v)}
                  >
                    {showConfirmPw ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <p className={`forgot-match-hint ${newPassword === confirmPassword ? 'match--yes' : 'match--no'}`}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </p>
                )}
              </div>

              <div className="forgot-btn-row">
                <button
                  type="submit"
                  className="forgot-submit-btn"
                  disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                  {loading ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD →'}
                </button>
              </div>

              <div className="forgot-back-row">
                <Link to="/registration?auth=login" className="forgot-back-link">
                  Cancel &amp; Return to Login
                </Link>
              </div>
            </form>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
            <div className="forgot-success-view">
              <div className="forgot-success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="forgot-success-title">Password Reset Complete!</h2>
              <p className="forgot-success-desc">
                Your password for <strong>{roll}</strong> has been updated in the Forensithon student database. You can now log in using your new credentials.
              </p>
              <div className="forgot-btn-row">
                <button
                  type="button"
                  className="forgot-submit-btn"
                  onClick={() => navigate('/registration?auth=login')}
                >
                  GO TO LOGIN NOW →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
