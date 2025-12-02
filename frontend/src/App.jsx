/**
 * Main App Component
 * Root component with routing
 * 
 * TODO: Implement routing and layout
 * - Set up React Router
 * - Create routes for each dashboard
 * - Add navigation
 * - Handle role-based routing
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Common/Navigation';
import Home from './pages/Home';
import ProducerDashboard from './pages/ProducerDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import RegulatorDashboard from './pages/RegulatorDashboard';
import ConsumerDashboard from './pages/ConsumerDashboard';
import ProductVerification from './pages/ProductVerification';
import TransferProduct from './pages/TransferProduct';
import RoleManagement from './pages/RoleManagement';

/**
 * App Component
 * 
 * Main application component with routing and navigation.
 */
function App() {

  return (
    <BrowserRouter>
      <div className="App">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/producer" element={<ProducerDashboard />} />
          <Route path="/distributor" element={<DistributorDashboard />} />
          <Route path="/retailer" element={<RetailerDashboard />} />
          <Route path="/regulator" element={<RegulatorDashboard />} />
          <Route path="/consumer" element={<ConsumerDashboard />} />
          <Route path="/verify/:productId" element={<ProductVerification />} />
          <Route path="/verify" element={<ProductVerification />} />
          <Route path="/transfer" element={<TransferProduct />} />
          <Route path="/roles" element={<RoleManagement />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

