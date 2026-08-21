/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, WebsiteSettings, AISettings } from './types';
import { api } from './lib/api';
import { getOrCreateCustomerId, getStoredCustomerProfile } from './lib/pwa';

import { VertexChatApp } from './components/VertexChatApp';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { AdminAuthModal } from './components/Admin/AdminAuthModal';
import { AdminLayout } from './components/Admin/AdminLayout';

export default function App() {
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Customer state
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Guest Customer');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Global settings & data
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>({
    brandName: 'VERTEX LAB',
    logoUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=120&q=80',
    websiteUrl: 'https://oblyvyon.com',
    customerCareTitle: 'Vertex Lab Customer Care',
    whatsappNumber: '+92 300 8378391',
    contactEmail: 'care@vertexlab.store',
    businessHours: 'Mon - Sat: 10:00 AM - 9:00 PM PKT',
    welcomeMessage: 'Hi! 👋 Welcome to Vertex Lab. How can I help you today with delivery times, our heavyweight embroidered streetwear collection, or free replacements?',
    deliveryFee: 200,
    freeDeliveryThreshold: 4999,
    supportAvailability: 'Instant AI replies • 24/7 Support',
  });

  const [aiSettings, setAiSettings] = useState<AISettings>({
    aiName: 'Vertex AI Concierge',
    systemInstructions: 'You are the official AI Customer Care Assistant for Vertex Lab.',
    tone: 'luxury_concierge',
    model: 'gemini-3.7-flash',
    multilingualUrdu: true,
    strictInventoryOnly: true,
  });

  // Selected product modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const cid = getOrCreateCustomerId();
    setCustomerId(cid);
    const profile = getStoredCustomerProfile();
    setCustomerName(profile.name);
    setCustomerEmail(profile.email);

    // Check if admin is authenticated in session
    if (sessionStorage.getItem('vertex_admin_authenticated') === 'true') {
      setIsAdminAuthenticated(true);
    }

    // Load initial settings
    api.getWebsiteSettings().then(setWebsiteSettings).catch(console.error);
    api.getAiSettings().then(setAiSettings).catch(console.error);
  }, []);

  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setIsAdminView(true);
    } else {
      setIsAdminAuthModalOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminView(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('vertex_admin_authenticated');
    setIsAdminAuthenticated(false);
    setIsAdminView(false);
  };

  // If in Admin Mode, render the full-featured Admin Portal
  if (isAdminView && isAdminAuthenticated) {
    return (
      <AdminLayout
        onBackToStore={() => setIsAdminView(false)}
        onLogout={handleAdminLogout}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-[#131314] text-[#e3e3e3] overflow-hidden flex flex-col selection:bg-[#4285F4]/30 selection:text-white">
      {/* Vertex Chat App */}
      <VertexChatApp
        customerId={customerId}
        customerName={customerName}
        customerEmail={customerEmail}
        websiteSettings={websiteSettings}
        aiSettings={aiSettings}
        onOpenAdmin={handleOpenAdmin}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onViewProductDetails={setSelectedProduct}
      />

      {/* Product Details Modal if customer clicks on a recommended article */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAskAiWithContext={_question => {
          setSelectedProduct(null);
        }}
      />

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        customerId={customerId}
        initialName={customerName}
        initialEmail={customerEmail}
        onSave={(name, email) => {
          setCustomerName(name);
          setCustomerEmail(email);
        }}
      />

      {/* Admin Auth Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />
    </div>
  );
}

