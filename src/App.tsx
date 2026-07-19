import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Notices from './pages/Notices'
import StaffPage from './pages/Staff'
import Employees from './pages/Employees'
import KeyAccounts from './pages/KeyAccounts'
import KeyAccountManage from './pages/KeyAccountManage'
import Clients from './pages/Clients'
import ClientForm from './pages/ClientForm'
import ClientDetails from './pages/ClientDetails'
import PartCategories from './pages/PartCategories'
import PartDetails from './pages/PartDetails'
import Vendors from './pages/Vendors'
import VendorLedger from './pages/VendorLedger'
import PurchaseOrders from './pages/PurchaseOrders'
import NewPurchaseOrder from './pages/NewPurchaseOrder'
import AddVehicle from './pages/AddVehicle'
import EditVehicle from './pages/EditVehicle'
import VehicleDetails from './pages/VehicleDetails'
import InspectionDetails from './pages/InspectionDetails'
import InspectionForm from './pages/InspectionForm'
import ChecklistTemplates from './pages/ChecklistTemplates'
import Vehicles from './pages/Vehicles'
import Parts from './pages/Parts'
import Services from './pages/Services'
import Stores from './pages/Stores'
import Categories from './pages/Categories'
import Regions from './pages/Regions'
import Stations from './pages/Stations'
import FuelPrices from './pages/FuelPrices'
import Inventory from './pages/Inventory'
import InventoryReport from './pages/InventoryReport'
import PostSale from './pages/PostSale'
import KeyAccountLedgerReport from './pages/KeyAccountLedgerReport'
import SalesReport from './pages/SalesReport'
import Conversion from './pages/Conversion'
import JobCards from './pages/JobCards'
import JobCardForm from './pages/JobCardForm'
import JobCardInvoice from './pages/JobCardInvoice'
import Invoices from './pages/Invoices'
import Quotations from './pages/Quotations'
import Accounts from './pages/Accounts'
import Calendar from './pages/Calendar'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/regions" element={<Regions />} />
                <Route path="/stations" element={<Stations />} />
                <Route path="/stations/:stationId/fuel-prices" element={<FuelPrices />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/part-categories" element={<PartCategories />} />
                <Route path="/inventory/:partId" element={<PartDetails />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/vendors/:vendorId/ledger" element={<VendorLedger />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/purchase-orders/new" element={<NewPurchaseOrder />} />
                <Route path="/inventory/report" element={<InventoryReport />} />
                <Route path="/sales/post" element={<PostSale />} />
                <Route path="/sales/report" element={<SalesReport />} />
                <Route path="/conversion" element={<Conversion />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/key-accounts/ledger" element={<KeyAccountLedgerReport />} />
               <Route path="/staff" element={<StaffPage />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/key-accounts" element={<KeyAccounts />} />
                <Route path="/key-accounts/:id/manage" element={<KeyAccountManage />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/new" element={<ClientForm />} />
                <Route path="/clients/:clientId/edit" element={<ClientForm />} />
                <Route path="/clients/:clientId" element={<ClientDetails />} />
                <Route path="/clients/:clientId/vehicles/new" element={<AddVehicle />} />
                <Route path="/clients/:clientId/vehicles/:vehicleId/edit" element={<EditVehicle />} />
                <Route path="/clients/:clientId/vehicles/:vehicleId" element={<VehicleDetails />} />
                <Route path="/checklist-templates" element={<ChecklistTemplates />} />
                <Route path="/inspections/new" element={<InspectionForm />} />
                <Route path="/inspections/:templateId/edit" element={<InspectionForm />} />
                <Route path="/clients/:clientId/vehicles/:vehicleId/inspections/:inspectionId" element={<InspectionDetails />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/vehicles/new" element={<AddVehicle />} />
                <Route path="/parts" element={<Parts />} />
                <Route path="/services" element={<Services />} />
                <Route path="/job-cards" element={<JobCards />} />
                <Route path="/job-cards/new" element={<JobCardForm />} />
                <Route path="/job-cards/:id" element={<JobCardForm />} />
                <Route path="/job-cards/:id/invoice" element={<JobCardInvoice />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/notices" element={<Notices />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
