import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ListingsPage from './pages/ListingsPage';
import CreateListingPage from './pages/CreateListingPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import AssetsPage from './pages/AssetsPage';
import SpaceGraphPage from './pages/SpaceGraphPage';
import RentableItemsPage from './pages/RentableItemsPage';
import UnifiedAvailabilityPage from './pages/UnifiedAvailabilityPage';
import TenantBookingPage from './pages/TenantBookingPage';
import PricingPoliciesPage from './pages/PricingPoliciesPage';
import PricingPoliciesPageNew from './pages/PricingPoliciesPageNew';
import LedgerPage from './pages/LedgerPage';
import ConfigBundlesPage from './pages/ConfigBundlesPage';
import UsersRolesPage from './pages/UsersRolesPage';
import IntegrationsPage from './pages/IntegrationsPage';
import TicketsPage from './pages/TicketsPage';
import InvoicesPageEnhanced from './pages/InvoicesPageEnhanced';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import EditInvoicePage from './pages/EditInvoicePage';
import ReportsPage from './pages/ReportsPage';
import TenantInvoicesPage from './pages/TenantInvoicesPage';
import TenantPaymentsPage from './pages/TenantPaymentsPage';
import TenantAgreementsPage from './pages/TenantAgreementsPage';
import TenantAgreementDetailPage from './pages/TenantAgreementDetailPage';
import TenantTicketsPage from './pages/TenantTicketsPage';
import TenantProfilePage from './pages/TenantProfilePage';
import LandlordProfilePage from './pages/LandlordProfilePage';
import TenantNotificationsPage from './pages/TenantNotificationsPage';
import AgreementsPage from './pages/AgreementsPage';
import CreateAgreementPage from './pages/CreateAgreementPage';
import AgreementDetailPage from './pages/AgreementDetailPage';
import AgreementContractPage from './pages/AgreementContractPage';
import RenewAgreementPage from './pages/RenewAgreementPage';
import PaymentsPage from './pages/PaymentsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import DiscoverPage from './pages/DiscoverPage';
import SearchPage from './pages/SearchPage';
import ListingDetailPageEnhanced from './pages/ListingDetailPageEnhanced';
import BookingPage from './pages/BookingPage';
import MyInquiriesPage from './pages/MyInquiriesPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        
        {/* Landlord routes */}
        <Route path="/assets" element={<PrivateRoute><AssetsPage /></PrivateRoute>} />
        <Route path="/assets/:assetId/space-graph" element={<PrivateRoute><SpaceGraphPage /></PrivateRoute>} />
        <Route path="/rentable-items" element={<PrivateRoute><RentableItemsPage /></PrivateRoute>} />
        <Route path="/assets/:assetId/rentable-items" element={<PrivateRoute><RentableItemsPage /></PrivateRoute>} />
        <Route path="/availability" element={<PrivateRoute><UnifiedAvailabilityPage /></PrivateRoute>} />
        <Route path="/pricing-policies" element={<PrivateRoute><PricingPoliciesPage /></PrivateRoute>} />
        <Route path="/pricing-policies-new" element={<PrivateRoute><PricingPoliciesPageNew /></PrivateRoute>} />
        <Route path="/ledger" element={<PrivateRoute><LedgerPage /></PrivateRoute>} />
        <Route path="/config-bundles" element={<PrivateRoute><ConfigBundlesPage /></PrivateRoute>} />
        <Route path="/users-roles" element={<PrivateRoute><UsersRolesPage /></PrivateRoute>} />
        <Route path="/integrations" element={<PrivateRoute><IntegrationsPage /></PrivateRoute>} />
        <Route path="/listings" element={<PrivateRoute><ListingsPage /></PrivateRoute>} />
        <Route path="/listings/create" element={<PrivateRoute><CreateListingPage /></PrivateRoute>} />
        <Route path="/leads" element={<PrivateRoute><LeadsPage /></PrivateRoute>} />
        <Route path="/leads/:id" element={<PrivateRoute><LeadDetailPage /></PrivateRoute>} />
        <Route path="/agreements" element={<PrivateRoute><AgreementsPage /></PrivateRoute>} />
        <Route path="/agreements/create" element={<PrivateRoute><CreateAgreementPage /></PrivateRoute>} />
        <Route path="/agreements/:id" element={<PrivateRoute><AgreementDetailPage /></PrivateRoute>} />
        <Route path="/agreements/:id/contract" element={<PrivateRoute><AgreementContractPage /></PrivateRoute>} />
        <Route path="/agreements/:id/renew" element={<PrivateRoute><RenewAgreementPage /></PrivateRoute>} />
        <Route path="/invoices" element={<PrivateRoute><InvoicesPageEnhanced /></PrivateRoute>} />
        <Route path="/invoices/:id" element={<PrivateRoute><InvoiceDetailPage /></PrivateRoute>} />
        <Route path="/invoices/:id/edit" element={<PrivateRoute><EditInvoicePage /></PrivateRoute>} />
        <Route path="/payments" element={<PrivateRoute><PaymentsPage /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
        <Route path="/audit-logs" element={<PrivateRoute><AuditLogsPage /></PrivateRoute>} />
        
        {/* Tenant routes */}
        <Route path="/discover" element={<PrivateRoute><DiscoverPage /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
        <Route path="/listings/:id" element={<PrivateRoute><ListingDetailPageEnhanced /></PrivateRoute>} />
        <Route path="/booking/:listingId/:rentableItemId" element={<PrivateRoute><BookingPage /></PrivateRoute>} />
        <Route path="/my-inquiries" element={<PrivateRoute><MyInquiriesPage /></PrivateRoute>} />
        <Route path="/my-bookings" element={<PrivateRoute><TenantBookingPage /></PrivateRoute>} />
        <Route path="/my-agreements" element={<PrivateRoute><TenantAgreementsPage /></PrivateRoute>} />
        <Route path="/my-agreements/:id" element={<PrivateRoute><TenantAgreementDetailPage /></PrivateRoute>} />
        <Route path="/my-agreements/:id/contract" element={<PrivateRoute><AgreementContractPage /></PrivateRoute>} />
        <Route path="/my-invoices" element={<PrivateRoute><TenantInvoicesPage /></PrivateRoute>} />
        <Route path="/my-payments" element={<PrivateRoute><TenantPaymentsPage /></PrivateRoute>} />
        <Route path="/my-tickets" element={<PrivateRoute><TenantTicketsPage /></PrivateRoute>} />
        <Route path="/my-profile" element={<PrivateRoute><TenantProfilePage /></PrivateRoute>} />
        <Route path="/landlord-profile" element={<PrivateRoute><LandlordProfilePage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><TenantNotificationsPage /></PrivateRoute>} />
        
        {/* Shared routes */}
        <Route path="/tickets" element={<PrivateRoute><TicketsPage /></PrivateRoute>} />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
