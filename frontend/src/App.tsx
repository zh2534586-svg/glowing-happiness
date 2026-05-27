import { Routes, Route } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from './stores/authStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Home = lazy(() => import('./pages/Home'));
const AIDetection = lazy(() => import('./pages/AIDetection'));
const TrackSeparation = lazy(() => import('./pages/TrackSeparation'));
const VoiceConversion = lazy(() => import('./pages/VoiceConversion'));
const VoiceEnhance = lazy(() => import('./pages/VoiceEnhance'));
const AICover = lazy(() => import('./pages/AICover'));
const AISinger = lazy(() => import('./pages/AISinger'));
const AIDubbing = lazy(() => import('./pages/AIDubbing'));
const AICompose = lazy(() => import('./pages/AICompose'));
const AIMV = lazy(() => import('./pages/AIMV'));
const AIShortVideo = lazy(() => import('./pages/AIShortVideo'));
const VoiceMarketplace = lazy(() => import('./pages/VoiceMarketplace'));
const Enterprise = lazy(() => import('./pages/Enterprise'));
const Copyright = lazy(() => import('./pages/Copyright'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="min-h-screen bg-dark-500 text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ai-detection" element={<AIDetection />} />
            <Route path="/track-separation" element={<TrackSeparation />} />
            <Route path="/voice-conversion" element={<VoiceConversion />} />
            <Route path="/voice-enhance" element={<VoiceEnhance />} />
            <Route path="/ai-cover" element={<AICover />} />
            <Route path="/ai-singer" element={<AISinger />} />
            <Route path="/ai-dubbing" element={<AIDubbing />} />
            <Route path="/ai-compose" element={<AICompose />} />
            <Route path="/ai-mv" element={<AIMV />} />
            <Route path="/ai-short-video" element={<AIShortVideo />} />
            <Route path="/voice-market" element={<VoiceMarketplace />} />
            <Route path="/enterprise" element={<Enterprise />} />
            <Route path="/copyright" element={<Copyright />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
