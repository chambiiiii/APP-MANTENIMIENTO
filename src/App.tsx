import { useState } from 'react';
import { LayoutDashboard, FilePlus, History, Wrench, type LucideIcon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewInspection from './pages/NewInspection';
import HistoryPage from './pages/HistoryPage';
import ServicesPage from './pages/ServicesPage';

export type Page = 'dashboard' | 'new-inspection' | 'history' | 'services';

interface NavItem {
  id: Page;
  label: string;
  icon: LucideIcon;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'new-inspection':
        return <NewInspection />;
      case 'history':
        return <HistoryPage />;
      case 'services':
        return <ServicesPage />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-inspection', label: 'Nueva Inspección', icon: FilePlus },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'services', label: 'Servicios', icon: Wrench },
  ];

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar currentPage={currentPage} navItems={navItems} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
