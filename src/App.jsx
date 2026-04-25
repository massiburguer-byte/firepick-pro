import React from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Leaderboard from './pages/Leaderboard';
import Standings from './pages/Standings';
import GuruHistory from './pages/GuruHistory';
import BetCalculator from './pages/BetCalculator';
import Admin from './pages/Admin';
import EmergencyAdmin from './pages/EmergencyAdmin';
import BottomNav from './components/BottomNav';
import { AlertCircle, RefreshCw, Smartphone, Key } from 'lucide-react';
import { isConfigured } from './services/firebase';

import { ThemeProvider, useTheme } from './context/ThemeContext';

// Error Boundary for UI Stability
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Error logged automatically
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-[#FF3B3B]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#FF3B3B]/20">
            <AlertCircle className="text-[#FF3B3B]" size={32} />
          </div>
          <h2 className="font-sport text-xl text-white mb-2 italic">Error en la Terminal</h2>
          <p className="text-[10px] font-black text-[#8B949E] uppercase tracking-widest leading-relaxed max-w-xs mb-8">
            Se ha detectado una anomalía en la interfaz Obsidian. El sistema se ha protegido para evitar pérdida de datos.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-3 bg-[#161B22] border border-white/10 rounded-xl text-white font-sport text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all shadow-2xl active:scale-95"
          >
            <RefreshCw size={14} /> Restaurar Interfaz
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();

  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;

  return (
    <ErrorBoundary>
      <div className={`fixed inset-0 overflow-y-auto overflow-x-hidden ${theme === 'mlb' ? 'bg-[#001532]' : 'bg-[#050505]'} transition-colors duration-700 main-scroll-bounds`} style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="w-full relative flex flex-col min-h-full pb-24">
          {children}
        </div>
      </div>
      <BottomNav />
    </ErrorBoundary>
  );
};

function App() {
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-8 border border-amber-500/20 animate-pulse">
          <Key className="text-amber-500" size={40} />
        </div>
        <h2 className="font-sport text-2xl text-white mb-4 italic">Error de Despliegue</h2>
        <div className="max-w-md bg-[#161B22] border border-white/5 rounded-2xl p-6 mb-8 text-left">
          <p className="text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500" /> Diagnóstico del Sistema
          </p>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            La terminal no puede conectar con Firebase. Las variables de entorno (<span className="text-white">VITE_FIREBASE_*</span>) no se encuentran en el servidor de Netlify.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mt-0.5 text-[10px] text-white">1</div>
              <p className="text-[11px] text-gray-300">Ve al panel de <b>Netlify</b> {'>'} Site settings {'>'} Environment.</p>
            </div>
            <div className="flex items-start gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mt-0.5 text-[10px] text-white">2</div>
              <p className="text-[11px] text-gray-300">Copia las variables de tu archivo <b>.env</b> local al panel de Netlify.</p>
            </div>
            <div className="flex items-start gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mt-0.5 text-[10px] text-white">3</div>
              <p className="text-[11px] text-gray-300"><b>Trigger un nuevo Deploy</b> para aplicar los cambios.</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-sport text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
        >
          <RefreshCw size={16} /> Reintentar Conexión
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <Toaster position="top-center" richColors theme="dark" />
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />

              <Route path="/guru-history" element={
                <ProtectedRoute>
                  <GuruHistory />
                </ProtectedRoute>
              } />

              <Route path="/standings" element={
                <ProtectedRoute>
                  <Standings />
                </ProtectedRoute>
              } />
              
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />

              <Route path="/calculator" element={
                <ProtectedRoute>
                  <BetCalculator />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              } />
              
              <Route path="/emergency-admin" element={
                <ProtectedRoute>
                  <EmergencyAdmin />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
