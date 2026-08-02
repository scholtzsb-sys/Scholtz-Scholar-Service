import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './state/AppContext';
import RequireRole from './state/RequireRole';

import LandingScreen from './screens/auth/LandingScreen';
import OtpScreen from './screens/auth/OtpScreen';
import ContinueAsScreen from './screens/auth/ContinueAsScreen';
import FirstOwnerScreen from './screens/auth/FirstOwnerScreen';
import './screens/auth/auth.css';

import DashboardScreen from './screens/owner/DashboardScreen';
import ScholarsListScreen from './screens/owner/ScholarsListScreen';
import ScholarFormScreen from './screens/owner/ScholarFormScreen';
import ScholarDetailScreen from './screens/owner/ScholarDetailScreen';
import DriversListScreen from './screens/owner/DriversListScreen';
import DriverFormScreen from './screens/owner/DriverFormScreen';
import DriverDetailScreen from './screens/owner/DriverDetailScreen';
import OwnerProfileScreen from './screens/owner/OwnerProfileScreen';
import AddOwnerScreen from './screens/owner/AddOwnerScreen';
import GenerateInvoiceScreen from './screens/owner/GenerateInvoiceScreen';
import InvoiceHistoryScreen from './screens/owner/InvoiceHistoryScreen';
import InvoiceDetailScreen from './screens/owner/InvoiceDetailScreen';

import TripScreen from './screens/driver/TripScreen';
import DriverProfileScreen from './screens/driver/DriverProfileScreen';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/otp" element={<OtpScreen />} />
          <Route path="/continue-as" element={<ContinueAsScreen />} />
          <Route path="/first-owner" element={<FirstOwnerScreen />} />

          <Route element={<RequireRole role="owner" />}>
            <Route path="/owner" element={<DashboardScreen />} />
            <Route path="/owner/scholars" element={<ScholarsListScreen />} />
            <Route path="/owner/scholars/new" element={<ScholarFormScreen />} />
            <Route path="/owner/scholars/:id" element={<ScholarDetailScreen />} />
            <Route path="/owner/scholars/:id/edit" element={<ScholarFormScreen edit />} />
            <Route path="/owner/scholars/:id/invoice" element={<GenerateInvoiceScreen />} />
            <Route path="/owner/drivers" element={<DriversListScreen />} />
            <Route path="/owner/drivers/new" element={<DriverFormScreen />} />
            <Route path="/owner/drivers/:id" element={<DriverDetailScreen />} />
            <Route path="/owner/drivers/:id/edit" element={<DriverFormScreen edit />} />
            <Route path="/owner/profile" element={<OwnerProfileScreen />} />
            <Route path="/owner/profile/add-owner" element={<AddOwnerScreen />} />
            <Route path="/owner/families/:billingGuardianId/invoices" element={<InvoiceHistoryScreen />} />
            <Route path="/owner/invoices/:invoiceId" element={<InvoiceDetailScreen />} />
          </Route>

          <Route element={<RequireRole role="driver" />}>
            <Route path="/driver" element={<TripScreen />} />
            <Route path="/driver/profile" element={<DriverProfileScreen />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
