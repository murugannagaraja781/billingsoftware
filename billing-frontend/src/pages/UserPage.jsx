import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  X,
  Mail,
  Lock,
  Building2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const UserPage = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'manager', storeId: '' });

  useEffect(() => {
    fetchData();
  }, [currentUser.token]);

  const fetchData = async () => {
    try {
      const usersRes = await axios.get('http://localhost:5001/api/users', {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const storesRes = await axios.get('http://localhost:5001/api/stores', {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      setUsers(usersRes.data);
      setStores(storesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await axios.post('http://localhost:5001/api/users', form, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
      } else {
        await axios.put(`http://localhost:5001/api/users/${selectedUser._id}`, form, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
      }
      setShowModal(false);
      fetchData();
      setForm({ name: '', email: '', password: '', role: 'manager', storeId: '' });
    } catch (error) {
      alert('Error saving staff member');
    }
  };

  const openEdit = (u) => {
    setSelectedUser(u);
    setForm({
        name: u.name,
        email: u.email,
        password: '',
        role: u.role,
        storeId: u.storeId?._id || ''
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const getRoleBadge = (role) => {
      const styles = {
          'super_admin': 'bg-purple-600/10 text-purple-600',
          'admin': 'bg-red-600/10 text-red-600',
          'manager': 'bg-blue-600/10 text-blue-600'
      };
      return styles[role] || 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] px-10 py-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">{t('staffAdministration')}</h2>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">{t('staffDesc')}</p>
        </div>
        <button
          onClick={() => { setForm({ name: '', email: '', password: '', role: 'manager', storeId: '' }); setModalMode('create'); setShowModal(true); }}
          className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/20"
        >
          <Plus size={18} />
          <span>{t('addStaff')}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('teamMember')}</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('accessLevel')}</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('assignedUnit')}</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center font-black">
                      {u.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-none">{u.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getRoleBadge(u.role)}`}>
                    {t(u.role)}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Building2 size={14} className="text-slate-400" />
                    <span className="text-xs font-bold">{u.storeId?.name || t('unassigned')}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(u)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <Edit3 size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-10 relative shadow-2xl border border-slate-200">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              {modalMode === 'create' ? t('onboardStaff') : t('modifyAccess')}
            </h3>
            <p className="text-slate-500 text-sm font-medium mb-8">{t('setCredentials')}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('fullName')}</label>
                  <input
                    required
                    type="text"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                    placeholder="Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('emailAddress') || 'Email Address'}</label>
                  <input
                    required
                    type="email"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                    placeholder="staff@plasticorp.com"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password {modalMode === 'edit' && '(Leave blank to keep current)'}</label>
                  <input
                    required={modalMode === 'create'}
                    type="password"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('accessTier')}</label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold appearance-none cursor-pointer"
                    value={form.role}
                    onChange={(e) => setForm({...form, role: e.target.value})}
                  >
                    <option value="super_admin">{t('super_admin')}</option>
                    <option value="admin">{t('admin')}</option>
                    <option value="manager">{t('manager')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('assignedUnit')}</label>
                <select
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold appearance-none cursor-pointer"
                  value={form.storeId}
                  onChange={(e) => setForm({...form, storeId: e.target.value})}
                >
                  <option value="">{t('corporateHQ')}</option>
                  {stores.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl tracking-widest uppercase text-[10px] font-black hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl tracking-widest uppercase text-[10px] font-black shadow-lg shadow-red-600/20">
                  {modalMode === 'create' ? 'Add Member' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
