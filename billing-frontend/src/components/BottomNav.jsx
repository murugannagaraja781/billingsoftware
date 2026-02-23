import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Receipt,
  Store,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const navItems = [
    { name: t('dashboard'), icon: LayoutDashboard, path: '/', roles: ['super_admin', 'admin'] },
    { name: t('billing'), icon: Receipt, path: '/billing' },
    { name: t('products'), icon: Package, path: '/inventory', roles: ['super_admin', 'admin'] },
    { name: t('stores'), icon: Store, path: '/stores', roles: ['super_admin', 'admin'] },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center px-2 py-3 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.filter(item => {
        if (item.roles && !item.roles.includes(user?.role)) return false;
        return true;
      }).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center space-y-1 transition-all duration-300 min-w-[60px]
              ${isActive ? 'text-red-600' : 'text-slate-400'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-red-50' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight">{item.name}</span>
              </>
            )}
          </NavLink>
        );
      })}

      {/* Mobile Logout Button */}
      <button
        onClick={logout}
        className="flex flex-col items-center justify-center space-y-1 transition-all duration-300 min-w-[60px] text-slate-400 hover:text-red-600"
      >
        <div className="p-1.5 rounded-xl">
          <LogOut size={20} strokeWidth={2} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-tight">{t('logout')}</span>
      </button>
    </div>
  );
};

export default BottomNav;
