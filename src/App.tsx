import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ClientList } from './pages/clients/ClientList';
import { UnitList } from './pages/units/UnitList';
import { GSTList } from './pages/gst/GSTList';
import { ProductList } from './pages/products/ProductList';
import { QuotationList } from './pages/quotations/QuotationList';
import { QuotationForm } from './pages/quotations/QuotationForm';
import { TestQuotation10Items } from './pages/quotations/TestQuotation10Items';
import { Toaster } from './components/ui/sonner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Authentication is temporarily disabled for public access
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/quotations" replace />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="units" element={<UnitList />} />
        <Route path="gst" element={<GSTList />} />
        <Route path="products" element={<ProductList />} />
        <Route path="quotations" element={<QuotationList />} />
        <Route path="quotations/new" element={<QuotationForm />} />
        <Route path="quotations/:id/edit" element={<QuotationForm />} />
        <Route path="quotations/test-10-items" element={<TestQuotation10Items />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
