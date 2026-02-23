import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Store,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  X,
  Search,
  Building2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StorePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedStore, setSelectedStore] = useState(null);
  const [form, setForm] = useState({ name: '', location: '' });

  useEffect(() => {
    fetchStores();
  }, [user.token]);

  const fetchStores = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/api/stores', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStores(data);
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
        await axios.post('http://localhost:5001/api/stores', form, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      } else {
        await axios.put(`http://localhost:5001/api/stores/${selectedStore._id}`, form, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      }
      setShowModal(false);
      fetchStores();
      setForm({ name: '', location: '' });
    } catch (error) {
      alert('Error saving store');
    }
  };

  const openEdit = (s) => {
    setSelectedStore(s);
    setForm({ name: s.name, location: s.location });
    setModalMode('edit');
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] px-10 py-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">{t('storeManagement')}</h2>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">{t('storeDesc')}</p>
        </div>
        <button
          onClick={() => { setForm({ name: '', location: '' }); setModalMode('create'); setShowModal(true); }}
          className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/20"
        >
          <Plus size={18} />
          <span>{t('addNewUnit')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((s) => (
          <div key={s._id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm group hover:border-red-500/30 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>

            <div className="flex items-center justify-between mb-6 relative">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                <Building2 size={24} />
              </div>
              <div className="flex space-x-1">
                <button onClick={() => openEdit(s)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <Edit3 size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">{s.name}</h3>
            <div className="flex items-center space-x-2 text-slate-500 mb-6">
              <MapPin size={16} className="text-red-500" />
              <span className="text-xs font-bold uppercase tracking-wider">{s.location || t('noLocation')}</span>
            </div>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
               <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">?</div>
                 ))}
               </div>
               <span className="text-[10px] font-black text-red-600 bg-red-600/10 px-2 py-1 rounded-full uppercase tracking-tighter">{t('activeUnit')}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-10 relative shadow-2xl border border-slate-200">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              {modalMode === 'create' ? t('registerNewUnit') : t('configureUnit')}
            </h3>
            <p className="text-slate-500 text-sm font-medium mb-8">{t('unitDesc')}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('storeName')}</label>
                <input
                  required
                  type="text"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                  placeholder="South Branch Warehouse"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('locationAddress')}</label>
                <input
                  required
                  type="text"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                  placeholder="Industrial Area 4, Chennai"
                  value={form.location}
                  onChange={(e) => setForm({...form, location: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl tracking-widest uppercase text-[10px] font-black hover:bg-slate-100 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl tracking-widest uppercase text-[10px] font-black shadow-lg shadow-red-600/20">
                  {modalMode === 'create' ? t('createUnit') : t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePage;
