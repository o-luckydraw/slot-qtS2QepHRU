import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import DrawPage from './pages/DrawPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import RequireAdmin from './components/RequireAdmin';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <DrawPage />
      },
      {
        path: "admin/login",
        element: <AdminLoginPage />
      },
      {
        path: "admin/dashboard",
        element: (
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        )
      }
    ]
  }
], {
  // 💡 여기에 basename 옵션을 추가합니다!
  basename: import.meta.env.BASE_URL
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);