import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { TableDetailPage } from './pages/TableDetailPage';
import { OrderPage } from './pages/OrderPage';
import { OrdersHistoryPage } from './pages/OrdersHistoryPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StaffLayout } from './layouts/StaffLayout';
import { ClientTablePage } from './pages/ClientTablePage';
import { ClientOrderPage } from './pages/ClientOrderPage';
import { ClientHistoryPage } from './pages/ClientHistoryPage';
import { ClientHomePage } from './pages/ClientHomePage';
import { VoucherWalletPage } from './pages/VoucherWalletPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BlogListPage } from './pages/client/blog/BlogListPage';
import { BlogPostPage } from './pages/client/blog/BlogPostPage';
import { PlatformLayout } from './layouts/PlatformLayout';
import { PlatformLoginPage } from './pages/platform/PlatformLoginPage';
import { PlatformDashboard } from './pages/platform/PlatformDashboard';
import { PlatformStoreList } from './pages/platform/PlatformStoreList';
import { PlatformStoreDetail } from './pages/platform/PlatformStoreDetail';
import { PlatformStoreCreate } from './pages/platform/PlatformStoreCreate';

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
    element: <ProtectedRoute><StaffLayout /></ProtectedRoute>,
    children: [
      {
        path: '/staff',
        element: <HomePage />,
      },
      {
        path: '/table/:code',
        element: <TableDetailPage />,
      },
      {
        path: '/order/:id',
        element: <OrderPage />,
      },
      {
        path: '/orders',
        element: <OrdersHistoryPage />,
      },
    ]
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
  // {
  //   path: '/client/history',
  //   element: <ClientHistoryPage />,
  // },
  // {
  //   path: '/client/vouchers',
  //   element: <VoucherWalletPage />,
  // },
  // {
  //   path: '/blog',
  //   element: <BlogListPage />,
  // },
  // {
  //   path: '/blog/:id',
  //   element: <BlogPostPage />,
  // },
  
  // Multi-tenant routes
  {
    path: '/s/:slug',
    element: <ClientHomePage />,
  },
  {
    path: '/s/:slug/table/:code',
    element: <ClientTablePage />,
  },
  {
    path: '/s/:slug/order/:id',
    element: <ClientOrderPage />,
  },
  {
    path: '/s/:slug/history',
    element: <ClientHistoryPage />,
  },
  {
    path: '/s/:slug/vouchers',
    element: <VoucherWalletPage />,
  },
  {
    path: '/s/:slug/blog',
    element: <BlogListPage />,
  },
  {
    path: '/s/:slug/blog/:id',
    element: <BlogPostPage />,
  },
  {
    element: <ProtectedRoute><StaffLayout /></ProtectedRoute>,
    children: [
      {
        path: '/s/:slug/staff',
        element: <HomePage />,
      },
      {
        path: '/s/:slug/staff/table/:code',
        element: <TableDetailPage />,
      },
      {
        path: '/s/:slug/staff/order/:id',
        element: <OrderPage />,
      },
      {
        path: '/s/:slug/orders',
        element: <OrdersHistoryPage />,
      },
    ]
  },

  // Platform Admin Routes
  {
    path: '/platform/login',
    element: <PlatformLoginPage />,
  },
  {
    path: '/platform',
    element: <PlatformLayout />,
    children: [
        {
            path: 'dashboard',
            element: <PlatformDashboard />,
        },
        {
            path: 'stores',
            element: <PlatformStoreList />,
        },
        {
            path: 'stores/create',
            element: <PlatformStoreCreate />,
        },
        {
            path: 'stores/:id',
            element: <PlatformStoreDetail />,
        },
        {
            index: true,
            element: <PlatformDashboard />,
        }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

