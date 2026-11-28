import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { changeStudentPassword, getStoredTeamLeader, getStoredAuthToken } from '../services/api';
import { validatePassword } from '../components/LoginModal';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const loggedUser = getStoredTeamLeader();
  const token = getStoredAuthToken();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const oldPwRef = useRef(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword) {
      setErrorMsg('Please enter your Old Password.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Please enter your New Password.');
      return;
    }

    const pwError = validatePassword(newPassword);
    if (pwError) {
      setErrorMsg(pwError);
      return;
    }

    if (oldPassword === newPassword) {
      setErrorMsg('New password must be different from your old password.');
      return;
    }

    setLoading(true);

    try {
      const res = await changeStudentPassword({
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
        roll: loggedUser?.roll || ''
      });

      setIsSuccess(true);
      setSuccessMsg(res.message || 'Password changed successfully!');

      // Redirect back after 2.5 seconds
      setTimeout(() => {
        navigate('/account');
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change password. Please check your old password.');
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, prompt to log in
  if (!token && !loggedUser) {
    return (
      <main id="main-content" className="forgot-password-page">
        <div className="forgot-password-container">
          <div className="forgot-card">
            <div className="forgot-card-header">
              <div className="forgot-badge">SESSION REQUIRED</div>
              <h1 className="forgot-title">Change Password</h1>
              <p className="forgot-subtitle">
                Please log in to your Forensithon student account to change your password.
              </p>
            </div>
            <div className="forgot-form" style={{ textAlign: 'center', padding: '32px' }}>
              <Link to="/registration?auth=login" className="forgot-submit-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                LOGIN TO CONTINUE →
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="forgot-password-page">
      <div className="forgot-password-container">
        {/* Breadcrumb Navigation */}
        <div className="forgot-breadcrumb">
          <Link to="/" className="forgot-breadcrumb-link">Home</Link>
          <span className="forgot-breadcrumb-sep">/</span>
          <Link to="/account" className="forgot-breadcrumb-link">My Account</Link>
          <span className="forgot-breadcrumb-sep">/</span>
          <span className="forgot-breadcrumb-current">Change Password</span>
        </div>

        {/* Main Card */}
        <div className="forgot-card">
          {/* Card Header */}
          <div className="forgot-card-header">
            <div className="forgot-badge">FORENSITHON 2k26 ACCOUNT SECURITY</div>
            <h1 className="forgot-title">Change Password</h1>
            <p className="forgot-subtitle">
              {loggedUser?.roll ? (
                <>Updating password for account <strong>{loggedUser.roll}</strong> ({loggedUser.name || 'Student'}).</>
              ) : (
                'Enter your old password and set your new password.'
              )}
            </p>
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

          {/* Success Screen */}
          {isSuccess ? (
            <div className="forgot-success-view">
              <div className="forgot-success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="forgot-success-title">Password Changed Successfully!</h2>
              <p className="forgot-success-desc">
                Your password has been updated in the Forensithon database. Redirecting to your account dashboard...
              </p>
              <div className="forgot-btn-row">
                <button
                  type="button"
                  className="forgot-submit-btn"
                  onClick={() => navigate('/account')}
                >
                  GO TO MY ACCOUNT NOW →
                </button>
              </div>
            </div>
          ) : (
            /* Change Password Form with ONLY Old Password & New Password */
            <form onSubmit={handleSubmit} className="forgot-form" noValidate>
              {/* Field 1: Old Password */}
              <div className="forgot-field">
                <label htmlFor="changeOldPassword" className="forgot-label">
                  Old Password <span className="req-star">*</span>
                </label>
                <div className="forgot-password-wrap">
                  <input
                    ref={oldPwRef}
                    id="changeOldPassword"
                    type={showOldPw ? 'text' : 'password'}
                    className="forgot-input"
                    placeholder="Enter current / old password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="forgot-pw-toggle"
                    onClick={() => setShowOldPw((v) => !v)}
                  >
                    {showOldPw ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {/* Field 2: New Password */}
              <div className="forgot-field">
                <label htmlFor="changeNewPassword" className="forgot-label">
                  New Password <span className="req-star">*</span>
                </label>
                <div className="forgot-password-wrap">
                  <input
                    id="changeNewPassword"
                    type={showNewPw ? 'text' : 'password'}
                    className="forgot-input"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
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

              {/* Submit Button */}
              <div className="forgot-btn-row">
                <button
                  type="submit"
                  className="forgot-submit-btn"
                  disabled={loading || !oldPassword || !newPassword}
                >
                  {loading ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD →'}
                </button>
              </div>

              <div className="forgot-back-row">
                <Link to="/account" className="forgot-back-link">
                  ← Cancel &amp; Return to Account
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
