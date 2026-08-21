import {
  Product,
  Message,
  Conversation,
  Customer,
  FAQ,
  KnowledgeDoc,
  Announcement,
  BroadcastNotification,
  WebsiteSettings,
  AISettings,
  SyncStatus,
  AdminNotification,
  AnalyticsData,
} from '../types.js';

export const api = {
  // Chat
  async sendMessage(params: {
    customerId: string;
    customerName?: string;
    email?: string;
    message: string;
    conversationId?: string;
  }): Promise<{
    conversation: Conversation;
    customerMessage: Message;
    aiMessage: Message | null;
    aiResponded: boolean;
    escalated?: boolean;
    mode?: string;
  }> {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Conversations
  async getConversations(status = 'all', search = ''): Promise<Conversation[]> {
    const url = `/api/conversations?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[]; customer?: Customer }> {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async takeOverConversation(id: string, agentName: string): Promise<{ success: boolean; conversation: Conversation }> {
    const res = await fetch(`/api/conversations/${id}/takeover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentName }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async returnToAi(id: string): Promise<{ success: boolean; conversation: Conversation }> {
    const res = await fetch(`/api/conversations/${id}/return-to-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async replyToConversation(id: string, message: string, productIds?: string[], senderName?: string): Promise<{ success: boolean; message: Message; conversation: Conversation }> {
    const res = await fetch(`/api/conversations/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, productIds, senderName }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Products
  async getProducts(category?: string, search?: string, includeDisabled = false): Promise<Product[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    if (includeDisabled) params.append('includeDisabled', 'true');
    const res = await fetch(`/api/products?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    if (product.id && !product.id.startsWith('new-')) {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } else {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Sync Engine
  async testSyncConnection(url: string): Promise<{ success: boolean; latencyMs: number; message: string; details?: any }> {
    const res = await fetch('/api/sync/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async runProductSync(url?: string): Promise<any> {
    const res = await fetch('/api/sync/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getSyncStatus(): Promise<SyncStatus> {
    const res = await fetch('/api/sync/status');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateSyncStatus(status: Partial<SyncStatus>): Promise<SyncStatus> {
    const res = await fetch('/api/sync/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // FAQs
  async getFaqs(): Promise<FAQ[]> {
    const res = await fetch('/api/faqs');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async saveFaq(faq: Partial<FAQ>): Promise<FAQ> {
    if (faq.id && !faq.id.startsWith('new-')) {
      const res = await fetch(`/api/faqs/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      });
      return res.json();
    } else {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      });
      return res.json();
    }
  },

  async deleteFaq(id: string): Promise<boolean> {
    const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Knowledge Base
  async getKnowledgeDocs(): Promise<KnowledgeDoc[]> {
    const res = await fetch('/api/knowledge');
    return res.json();
  },

  async saveKnowledgeDoc(doc: Partial<KnowledgeDoc>): Promise<KnowledgeDoc> {
    if (doc.id) {
      const res = await fetch(`/api/knowledge/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      return res.json();
    } else {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      return res.json();
    }
  },

  // Announcements
  async getAnnouncements(activeOnly = false): Promise<Announcement[]> {
    const res = await fetch(`/api/announcements?activeOnly=${activeOnly}`);
    return res.json();
  },

  async saveAnnouncement(ann: Partial<Announcement>): Promise<Announcement> {
    if (ann.id && !ann.id.startsWith('new-')) {
      const res = await fetch(`/api/announcements/${ann.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ann),
      });
      return res.json();
    } else {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ann),
      });
      return res.json();
    }
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Broadcasts
  async getBroadcasts(): Promise<BroadcastNotification[]> {
    const res = await fetch('/api/broadcasts');
    return res.json();
  },

  async sendBroadcast(payload: {
    title: string;
    message: string;
    targetType: 'all' | 'selected_customers' | 'segment';
    recipientIds?: string[];
    actionUrl?: string;
  }): Promise<{ success: boolean; broadcast: BroadcastNotification }> {
    const res = await fetch('/api/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch('/api/customers');
    return res.json();
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // Settings
  async getWebsiteSettings(): Promise<WebsiteSettings> {
    const res = await fetch('/api/settings/website');
    return res.json();
  },

  async updateWebsiteSettings(settings: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
    const res = await fetch('/api/settings/website', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async getAiSettings(): Promise<AISettings> {
    const res = await fetch('/api/settings/ai');
    return res.json();
  },

  async updateAiSettings(settings: Partial<AISettings>): Promise<AISettings> {
    const res = await fetch('/api/settings/ai', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Admin Notifications
  async getAdminNotifications(): Promise<AdminNotification[]> {
    const res = await fetch('/api/admin/notifications');
    return res.json();
  },

  async markAdminNotificationRead(id?: string): Promise<void> {
    await fetch('/api/admin/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  },

  // Admin Auth
  async loginAdmin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return res.json();
  },

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch('/api/admin/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch('/api/analytics');
    return res.json();
  },

  // Push Subscription
  async registerPushSubscription(customerId: string, subscription: any): Promise<any> {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, subscription }),
    });
    return res.json();
  },
};
