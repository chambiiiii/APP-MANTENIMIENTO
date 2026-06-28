import { useState } from 'react';
import { Menu, X, Car, type LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  currentPage: string;
  navItems: NavItem[];
  onNavigate: (page: any) => void;
}

export default function Sidebar({ currentPage, navItems, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-brand-dark text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <img src="/MAYERS_LOGO.png" alt="Logo" className="w-8 h-8 rounded object-contain bg-white p-0.5" />
          <span className="font-bold text-sm">Lubricentro Mayer</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 hover:bg-brand-light rounded-lg transition-colors">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-brand-dark text-white
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo header */}
        <div className="px-6 py-6 border-b border-brand-light/30 hidden lg:flex items-center gap-3">
          <img src="/MAYERS_LOGO.png" alt="Logo" className="w-12 h-12 rounded object-contain bg-white p-1" />
          <div>
            <h1 className="font-bold text-sm leading-tight">Lubricentro y Servicios</h1>
            <p className="text-xs text-slate-400">Mayer</p>
          </div>
        </div>

        {/* Mobile logo */}
        <div className="px-6 py-6 border-b border-brand-light/30 lg:hidden flex items-center gap-3 mt-14">
          <img src="/MAYERS_LOGO.png" alt="Logo" className="w-12 h-12 rounded object-contain bg-white p-1" />
          <div>
            <h1 className="font-bold text-sm leading-tight">Lubricentro y Servicios</h1>
            <p className="text-xs text-slate-400">Mayer</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-accent text-white shadow-md'
                    : 'text-slate-300 hover:bg-brand-light hover:text-white'
                  }
                `}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-light/30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Car size={14} />
            <span>Sistema de Inspección v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
