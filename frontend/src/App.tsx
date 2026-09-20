import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import AnnouncementPage from './pages/AnnouncementPage';
import CustomerPage from './pages/CustomerPage';
import DashboardPage from './pages/DashboardPage';
import DocumentPage from './pages/DocumentPage';
import DriverPage from './pages/DriverPage';
import HistoryPage from './pages/HistoryPage';
import IncomingLetterPage from './pages/IncomingLetterPage';
import InvoicePage from './pages/InvoicePage';
import LoginPage from './pages/LoginPage';
import OrderPage from './pages/OrderPage';
import OutgoingLetterPage from './pages/OutgoingLetterPage';
import PaymentPage from './pages/PaymentPage';
import ProductPage from './pages/ProductPage';
import PurchasePage from './pages/PurchasePage';
import SupplierPage from './pages/SupplierPage';
import SuratJalanPage from './pages/SuratJalanPage';
import UserManagementPage from './pages/UserManagementPage';
import VehiclePage from './pages/VehiclePage';

function App() {
  const token = sessionStorage.getItem(
    'access_token',
  );

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={
          token ? (
            <Navigate
              to="/dashboard"
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* PROTECTED ROUTES */}
      <Route
        element={<ProtectedRoute />}
      >
        <Route
          element={<DashboardLayout />}
        >
          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          {/* MASTER DATA */}
          <Route
            path="/customers"
            element={<CustomerPage />}
          />

          <Route
            path="/suppliers"
            element={<SupplierPage />}
          />

          <Route
            path="/products"
            element={<ProductPage />}
          />

          <Route
            path="/drivers"
            element={<DriverPage />}
          />

          <Route
            path="/vehicles"
            element={<VehiclePage />}
          />

          {/* TRANSAKSI */}
          <Route
            path="/orders"
            element={<OrderPage />}
          />

          <Route
            path="/purchases"
            element={<PurchasePage />}
          />

          <Route
            path="/surat-jalan"
            element={<SuratJalanPage />}
          />

          <Route
            path="/invoices"
            element={<InvoicePage />}
          />

          <Route
            path="/payments"
            element={<PaymentPage />}
          />

          {/* SURAT */}
          <Route
            path="/incoming-letters"
            element={
              <IncomingLetterPage />
            }
          />

          <Route
            path="/outgoing-letters"
            element={
              <OutgoingLetterPage />
            }
          />

          <Route
            path="/documents"
            element={<DocumentPage />}
          />

          {/* PENGUMUMAN */}
          <Route
            path="/announcements"
            element={
              <AnnouncementPage />
            }
          />

          {/* ADMIN */}
          <Route
            path="/history"
            element={<HistoryPage />}
          />

          <Route
            path="/users"
            element={
              <UserManagementPage />
            }
          />
        </Route>
      </Route>

      {/* ROOT */}
      <Route
        path="/"
        element={
          <Navigate
            to={
              token
                ? '/dashboard'
                : '/login'
            }
            replace
          />
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              token
                ? '/dashboard'
                : '/login'
            }
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;