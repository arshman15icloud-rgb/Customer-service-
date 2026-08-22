/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, WebsiteSettings, AISettings, UserAccount } from './types';
import { api } from './lib/api';
import { getOrCreateCustomerId, saveCustomerProfile } from './lib/pwa';

import { VertexChatApp } from './components/VertexChatApp';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { AuthModal } from './components/AuthModal';
import { AdminAuthModal } from './components/Admin/AdminAuthModal';
import { AdminLayout } from './components/Admin/AdminLayout';

export default function App() {
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Customer ID & Name for legacy compatibility
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Guest Customer');
  const [customerEmail, setCustomerEmail] = useState<string>('');

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

    // Check stored user account in localStorage
    const savedUserJson = localStorage.getItem('vertex_active_user');
    if (savedUserJson) {
      try {
        const parsed = JSON.parse(savedUserJson);
        if (parsed && parsed.id) {
          setCurrentUser(parsed);
          setCustomerId(parsed.id);
          setCustomerName(parsed.name || 'Arshman');
          setCustomerEmail(parsed.email || '');
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    } else {
      // Prompt sign in on first visit
      setIsAuthModalOpen(true);
    }

    // Check if admin is authenticated in session
    if (sessionStorage.getItem('vertex_admin_authenticated') === 'true') {
      setIsAdminAuthenticated(true);
    }

    // Load initial settings
    api.getWebsiteSettings().then(setWebsiteSettings).catch(console.error);
    api.getAiSettings().then(setAiSettings).catch(console.error);
  }, []);

  const handleUserAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setCustomerId(user.id);
    setCustomerName(user.name);
    setCustomerEmail(user.email);
    localStorage.setItem('vertex_active_user', JSON.stringify(user));
    saveCustomerProfile(user.name, user.email);
    setIsAuthModalOpen(false);
  };

  const handleUserLogout = () => {
    localStorage.removeItem('vertex_active_user');
    setCurrentUser(null);
    setCustomerName('Guest Customer');
    setCustomerEmail('');
    setIsAuthModalOpen(true);
  };

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
        currentUser={currentUser}
        websiteSettings={websiteSettings}
        aiSettings={aiSettings}
        onOpenAdmin={handleOpenAdmin}
        onOpenProfile={() => {
          if (currentUser) {
            setIsProfileModalOpen(true);
          } else {
            setIsAuthModalOpen(true);
          }
        }}
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

      {/* Sign-in / Sign-up Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleUserAuthSuccess}
      />

      {/* Customer Profile & Orders Modal */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={updated => {
          setCurrentUser(updated);
          setCustomerName(updated.name);
          setCustomerEmail(updated.email);
          localStorage.setItem('vertex_active_user', JSON.stringify(updated));
        }}
        onLogout={handleUserLogout}
        onSwitchAccount={() => {
          setIsProfileModalOpen(false);
          setIsAuthModalOpen(true);
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
