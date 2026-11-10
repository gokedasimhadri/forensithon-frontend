import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ReadProgress from './components/ReadProgress';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import ChallengesPage from './pages/ChallengesPage';
import RoundsPage from './pages/RoundsPage';
import RegistrationPage from './pages/RegistrationPage';
import NotFoundPage from './pages/NotFoundPage';
import { useMotion } from './hooks/useMotion';
import { useScrollReveal } from './hooks/useScrollReveal';

export default function App() {
  const { motionOff, toggleMotion } = useMotion();
  useScrollReveal();

  return (
    <>
      <a className="skip" href="#main-content">
        Skip to content
      </a>
      <ReadProgress />
      <Header motionOff={motionOff} toggleMotion={toggleMotion} />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route
          path="/challenges"
          element={<ChallengesPage motionOff={motionOff} />}
        />
        <Route path="/challenges.html" element={<Navigate to="/challenges" replace />} />
        <Route path="/rounds" element={<RoundsPage />} />
        <Route path="/rounds.html" element={<Navigate to="/rounds" replace />} />
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/registration.html" element={<Navigate to="/registration" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  );
}
