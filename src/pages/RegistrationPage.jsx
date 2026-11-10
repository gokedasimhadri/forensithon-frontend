import { Link } from 'react-router-dom';

export default function RegistrationPage() {
  const dates = import.meta.env.VITE_EVENT_DATES || '9-10 December 2026';
  const registrationUrl =
    import.meta.env.VITE_REGISTRATION_URL || 'https://forms.cloud.microsoft/r/rzN80cyu6V';
  const deadline = import.meta.env.VITE_REGISTRATION_DEADLINE || '5 December 2026';
  const feeRewards =
    import.meta.env.VITE_REGISTRATION_FEE && import.meta.env.VITE_REGISTRATION_REWARDS
      ? `${import.meta.env.VITE_REGISTRATION_FEE} · ${import.meta.env.VITE_REGISTRATION_REWARDS}`
      : 'Rs. 300 per team · rewards to be announced';
  const contact =
    import.meta.env.VITE_ORGANISER_CONTACT ||
    'Kranthi Chowdary M, Assistant Professor · +91 99669 88369';

  return (
    <main id="main-content">
      <section className="section registration registration-page">
        <p className="eyebrow">BUILD YOUR TEAM</p>
        <h1 className="page-title">Register as six.</h1>
        <p className="lead">{dates}</p>

        <div className="registration-grid">
          <div>
            <h2>One team. One entry.</h2>
            <p>
              Exactly 6 students, all from Aditya University: 2 Forensic Science / CSDF students, 2
              engineering or allied-branch students and 2 from any department.
            </p>
            <p>
              Choose one challenge from the catalogue. The team leader will be the contact for the
              online presentation and selection updates.
            </p>
            <Link className="button secondary" to="/challenges">
              Choose your challenge ↗
            </Link>
          </div>

          <div className="registration-box">
            <span className="case-stamp">REGISTRATION DESK</span>
            <h2>Registration form</h2>
            <p>Registrations are open. The fee is Rs. 300 per team.</p>
            <p>
              Open to Aditya University students only. Sign in with your Aditya account, pick your
              domain and problem statement, and keep your payment screenshot ready for upload.
            </p>
            <a
              className="button"
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the registration form ↗
            </a>
            <p className="fineprint">
              The form opens on Microsoft Forms, records your name and allows one response per person.
              The site itself does not store registration data.
            </p>
          </div>
        </div>

        <div className="student-facts">
          <div>
            <span>Registration deadline</span>
            <strong>{deadline}</strong>
          </div>
          <div>
            <span>Fee / reward details</span>
            <strong>{feeRewards}</strong>
          </div>
          <div>
            <span>Organiser contact</span>
            <strong>{contact}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
