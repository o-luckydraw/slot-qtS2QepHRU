import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import config from './config.json';
import './index.css';

const App: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const listenAuthState = useAuthStore((s) => s.listenAuthState);

  useEffect(() => {
    const unsubscribe = listenAuthState();
    return unsubscribe;
  }, [listenAuthState]);

  useEffect(() => {
    const root = document.documentElement;
    const { theme } = config;

    root.style.setProperty('--main-font', theme.fontFamily);
    root.style.setProperty('--primary-color', theme.buttonBgColor);
    root.style.setProperty('--primary-text', theme.buttonTextColor);
    root.style.setProperty('--btn-radius', theme.buttonRadius);
    root.style.setProperty('--box-bg-color', theme.boxBgColor);
    root.style.setProperty('--box-padding', theme.boxPadding);
    root.style.setProperty('--box-radius', theme.boxRadius);
    root.style.setProperty('--high-bg-color', theme.highBgColor);
    root.style.setProperty('--high-text-color', theme.highTextColor);
    root.style.setProperty('--admin-link-color', theme.adminLinkColor);
  }, []);

  if (isAdminRoute) {
    return (
      <div className="min-h-screen w-full bg-gray-100 text-gray-900 font-sans">
        <Outlet />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col bg-cover bg-center bg-no-repeat transition-all duration-300 relative font-sans"
      style={{ backgroundImage: `url(${config.theme.bgImageUrl})` }}
    >
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 w-full px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default App;