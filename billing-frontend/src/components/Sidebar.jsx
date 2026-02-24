import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Store,
  Users,
  LogOut,
  Languages,
  ChevronRight,
  Settings,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Palette, Sun, Moon, Zap } from 'lucide-react';

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
  };

  const menuGroups = [
    {
      title: t('mainMenu'),
      items: [
        { name: t('dashboard'), icon: LayoutDashboard, path: '/', roles: ['super_admin', 'admin'] },
        { name: t('billing'), icon: Receipt, path: '/billing' },
        { name: t('manageInventory'), icon: Package, path: '/inventory', roles: ['super_admin', 'admin'] },
      ]
    },
    {
      title: t('management'),
      items: [
        { name: t('stores'), icon: Store, path: '/stores', roles: ['super_admin', 'admin'] },
        { name: t('users'), icon: Users, path: '/users', roles: ['super_admin', 'admin'] },
      ]
    }
  ];

  return (
    <div className="group h-screen w-20 hover:w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out shadow-2xl overflow-hidden">
      <div className="p-5 flex justify-center">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 shrink-0">
            <span className="text-white font-black text-xl italic">R</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-8 space-y-2 overflow-y-auto">
        {menuGroups.flatMap(g => g.items || []).filter(item => {
          if (item.roles && !item.roles.includes(user?.role)) return false;
          return true;
        }).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-4 py-4 rounded-2xl transition-all duration-200
                ${isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'}
              `}
            >
              <div className="flex items-center">
                <Icon size={22} className="shrink-0" />
                <span className="ml-4 font-black text-[11px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
                  {item.name}
                </span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center group-hover:justify-between w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
        >
          <Languages size={18} className="text-red-500 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-3 text-[10px] font-black uppercase whitespace-nowrap overflow-hidden">
            {i18n.language === 'en' ? t('tamil') : t('english')}
          </span>
        </button>

        <button
          onClick={logout}
          className="flex items-center justify-center group-hover:justify-between w-full p-2.5 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all overflow-hidden"
        >
          <LogOut size={18} className="shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-3 text-[10px] font-black uppercase whitespace-nowrap overflow-hidden">{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
