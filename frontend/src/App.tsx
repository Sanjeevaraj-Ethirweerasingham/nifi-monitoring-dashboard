import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { InstanceDetailPage } from './pages/InstanceDetailPage';
import { InstancesPage } from './pages/InstancesPage';
import { AlertsPage } from './pages/AlertsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: 2,
    },
  },
});

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/instances': 'All NiFi Instances',
  '/alerts': 'Alerts & Events',
};

function AppShell() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') ?? 'dark';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const getTitle = () => {
    if (location.pathname.startsWith('/instances/')) return 'Instance Detail';
    return PAGE_TITLES[location.pathname] ?? 'NiFi Monitor';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          theme={theme}
          onThemeToggle={toggleTheme}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed((c) => !c)}
          title={getTitle()}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/instances" element={<InstancesPage />} />
            <Route path="/instances/:id" element={<InstanceDetailPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
