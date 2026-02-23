import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import BillingPage from './pages/BillingPage';
import Dashboard from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import StorePage from './pages/StorePage';
import UserPage from './pages/UserPage';
import { Lock, Mail, ChevronRight, Check } from 'lucide-react';
import './i18n/config';

const MainLayout = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex bg-[var(--bg-main)] text-[var(--text-main)] min-h-screen transition-colors duration-500">
      <Sidebar />
      <main className="flex-1 ml-20 min-h-screen">
        {children}
      </main>
    </div>
  );
};

// Main Layout is already defined above

const Login = () => {
  const { login, user, loading } = useAuth();
  if (user) return <Navigate to="/" />;
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [view, setView] = React.useState('login'); // 'login' or 'forgot'
  const [resetData, setResetData] = React.useState({ email: '', newPassword: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(formData.email, formData.password);
    if (!res.success) alert(res.message);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:5001/api/auth/forgot-password', resetData);
      alert(data.message);
      setView('login');
    } catch (error) {
      alert(error.response?.data?.message || 'Error resetting password');
    }
  };

  const roles = [
    { id: 'super_admin', label: 'Super Admin' },
    { id: 'admin', label: 'Admin' },
    { id: 'manager', label: 'Manager' },
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
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome Back</h2>
                <p className="text-slate-500 text-sm font-medium">Manage your billing and scrap waste inventory</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
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
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                        <button
                          type="button"
                          onClick={() => setView('forgot')}
                          className="text-[11px] font-bold text-red-600 hover:text-red-500"
                        >
                          Forgot password?
                        </button>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                        <input
                        type="password"
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
                  <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                  {!loading && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Reset Password</h2>
                <p className="text-slate-500 text-sm font-medium">Enter your registered email and a new password</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
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
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                        <input
                        type="password"
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
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-10 pt-8 border-t border-slate-100">
             <div className="flex items-center space-x-2 text-slate-400">
                <Check size={14} className="text-red-500" />
                <p className="text-[11px] font-medium tracking-tight">System Online & Secure</p>
             </div>
             <p className="mt-4 text-center text-[12px] text-slate-400">
                Don't have an account? <span className="text-red-600 font-bold cursor-pointer hover:underline">Contact System Admin</span>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/billing" element={<MainLayout><BillingPage /></MainLayout>} />
            <Route path="/inventory" element={<MainLayout><InventoryPage /></MainLayout>} />
            <Route path="/stores" element={<MainLayout><StorePage /></MainLayout>} />
            <Route path="/users" element={<MainLayout><UserPage /></MainLayout>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
