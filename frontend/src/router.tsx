import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { TableDetailPage } from './pages/TableDetailPage';
import { OrderPage } from './pages/OrderPage';
import { OrdersHistoryPage } from './pages/OrdersHistoryPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ClientTablePage } from './pages/ClientTablePage';
import { ClientOrderPage } from './pages/ClientOrderPage';
import { ClientHistoryPage } from './pages/ClientHistoryPage';
import { ClientHomePage } from './pages/ClientHomePage';
import { VoucherWalletPage } from './pages/VoucherWalletPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: <ClientHomePage />,
  },
  {
    path: '/staff',
    element: <ProtectedRoute><HomePage /></ProtectedRoute>,
  },
  {
    path: '/table/:code',
    element: <ProtectedRoute><TableDetailPage /></ProtectedRoute>,
  },
  {
    path: '/order/:id',
    element: <ProtectedRoute><OrderPage /></ProtectedRoute>,
  },
  {
    path: '/orders',
    element: <ProtectedRoute><OrdersHistoryPage /></ProtectedRoute>,
  },
  // Public client routes
  {
    path: '/client',
    element: <ClientHomePage />,
  },
  {
    path: '/client/table/:code',
    element: <ClientTablePage />,
  },
  {
    path: '/client/order/:id',
    element: <ClientOrderPage />,
  },
  {
    path: '/client/history',
    element: <ClientHistoryPage />,
  },
  {
    path: '/client/vouchers',
    element: <VoucherWalletPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

