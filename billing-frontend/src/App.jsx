import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import NotificationBell from './components/NotificationBell';
import BillingPage from './pages/BillingPage';
import { LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import StorePage from './pages/StorePage';
import UserPage from './pages/UserPage';
import { Lock, Mail, ChevronRight, Check, Sun, Moon, Bell } from 'lucide-react';
import axios from 'axios';
import API_URL from './config';
import './i18n/config';
import { useTranslation } from 'react-i18next';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  if (!user) return <Navigate to="/login" />;
  const isManager = user.role === 'manager';

  return (
    <div className="flex flex-col md:flex-row bg-[var(--bg-main)] text-[var(--text-main)] min-h-screen transition-colors duration-500">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-[90]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <span className="text-white font-black text-xl italic">P</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {window.location.pathname === '/' ? t('dashboard') :
             window.location.pathname === '/billing' ? t('billing') :
             window.location.pathname === '/inventory' ? t('products') :
             window.location.pathname === '/stores' ? t('stores') :
             window.location.pathname === '/users' ? t('users') : 'PlastiCore'}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
           <NotificationBell />
           {isManager && (
             <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
               <LogOut size={20} />
             </button>
           )}
        </div>
      </div>

      {!isManager && <div className="hidden md:block"><Sidebar /></div>}

      {isManager && (
        <div className="hidden md:flex flex-col w-20 bg-slate-900 border-r border-slate-800 fixed left-0 top-0 h-full z-50 py-6 items-center justify-between">
           <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
              <span className="text-white font-black text-xl italic">P</span>
           </div>
           <button
             onClick={logout}
             className="p-3 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all mb-4"
             title={t('logout')}
           >
             <LogOut size={22} />
           </button>
        </div>
      )}

      <main className={`flex-1 min-h-screen pb-24 md:pb-0 ${isManager ? 'md:ml-20' : 'md:ml-20'}`}>
        {children}
      </main>

      {!isManager && <BottomNav />}
    </div>
  );
};

// Main Layout is already defined above

const Login = () => {
  const { t } = useTranslation();
  const { login, user, loading } = useAuth();
  if (user) return <Navigate to="/" />;
  const [formData, setFormData] = React.useState({ email: 'admin@plastic-corp.com', password: 'password123' });
  const [view, setView] = React.useState('login'); // 'login' or 'forgot'
  const [resetData, setResetData] = React.useState({ email: '', newPassword: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(formData.email, formData.password);
    if (!res.success) {
      alert(res.message);
    } else {
      window.location.reload();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/forgot-password`, resetData);
      alert(data.message);
      setView('login');
    } catch (error) {
      alert(error.response?.data?.message || t('errorResettingPassword'));
    }
  };

  const roles = [
    { id: 'super_admin', label: t('superAdmin') },
    { id: 'admin', label: t('adminRole') },
    { id: 'manager', label: t('managerRole') },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] relative overflow-hidden transition-colors duration-500">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] -ml-48 -mb-48"></div>

      <div className="w-full max-w-lg p-1 space-y-8 z-10">
        <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/40 mb-4">
                <span className="text-white text-3xl font-extrabold italic">P</span>
            </div>
            <h1 className="text-[var(--text-primary)] text-3xl font-bold tracking-tight">Plasti<span className="text-red-500">Core</span></h1>
        </div>

        <div className="glass-card p-10 bg-white border-white/5 shadow-2xl">
          {view === 'login' ? (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('welcomeBack')}</h2>
                <p className="text-slate-500 text-sm font-medium">{t('loginSubtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t('emailAddress')}</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                        <input
                        type="email"
                        placeholder="admin@plastic-corp.com"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all font-medium"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t('password')}</label>
                        <button
                          type="button"
                          onClick={() => setView('forgot')}
                          className="text-[11px] font-bold text-red-600 hover:text-red-500"
                        >
                          {t('forgotPassword')}
                        </button>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                        <input
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all font-medium"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                </div>

                <button
                  disabled={loading}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-all font-bold text-lg shadow-2xl shadow-red-600/30 flex items-center justify-center space-x-2 group disabled:opacity-50"
                >
                  <span>{loading ? t('authenticating') : t('signIn')}</span>
                  {!loading && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('resetPasswordTitle')}</h2>
                <p className="text-slate-500 text-sm font-medium">{t('resetPasswordSubtitle')}</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t('emailAddress')}</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                        <input
                        type="email"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all font-medium"
                        value={resetData.email}
                        onChange={(e) => setResetData({...resetData, email: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t('newPassword')}</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                        <input
                        name="new-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all font-medium"
                        value={resetData.newPassword}
                        onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
                  <button
                    type="submit"
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-all font-bold text-lg shadow-2xl shadow-red-600/30"
                  >
                    {t('updatePassword')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {t('backToLogin')}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-10 pt-8 border-t border-slate-100">
             <div className="flex items-center space-x-2 text-slate-400">
                <Check size={14} className="text-red-500" />
                <p className="text-[11px] font-medium tracking-tight">{t('systemSecure')}</p>
             </div>
             <p className="mt-4 text-center text-[12px] text-slate-400">
                {t('noAccount')} <span className="text-red-600 font-bold cursor-pointer hover:underline">{t('contactAdmin')}</span>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoleBasedHome = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'manager') return <Navigate to="/billing" />;
  return <MainLayout><Dashboard /></MainLayout>;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/billing" />;
  return children;
};

const App = () => {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center text-white">Loading...</div>}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<RoleBasedHome />} />
                <Route path="/billing" element={<MainLayout><BillingPage /></MainLayout>} />
                <Route path="/inventory" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><MainLayout><InventoryPage /></MainLayout></ProtectedRoute>} />
                <Route path="/stores" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><MainLayout><StorePage /></MainLayout></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><MainLayout><UserPage /></MainLayout></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </React.Suspense>
  );
};

export default App;
