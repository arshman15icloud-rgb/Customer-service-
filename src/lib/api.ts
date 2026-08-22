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
} from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let errorMessage = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.error) {
        errorMessage = parsed.error + (parsed.details ? `: ${parsed.details}` : '');
      }
    } catch {
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        errorMessage = `API route returned ${res.status} ${res.statusText}. Please verify backend configuration.`;
      }
    }
    throw new Error(errorMessage || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Chat
  async sendMessage(params: {
    customerId: string;
    customerName?: string;
    email?: string;
    message: string;
    conversationId?: string;
    assistantMode?: 'gemini' | 'jenny' | 'duo';
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
    return handleResponse(res);
  },

  // Conversations
  async getConversations(status = 'all', search = ''): Promise<Conversation[]> {
    const url = `/api/conversations?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[]; customer?: Customer }> {
    const res = await fetch(`/api/conversations/${id}`);
    return handleResponse(res);
  },

  async takeOverConversation(id: string, agentName: string): Promise<{ success: boolean; conversation: Conversation }> {
    const res = await fetch(`/api/conversations/${id}/takeover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentName }),
    });
    return handleResponse(res);
  },

  async returnToAi(id: string): Promise<{ success: boolean; conversation: Conversation }> {
    const res = await fetch(`/api/conversations/${id}/return-to-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  async replyToConversation(id: string, message: string, productIds?: string[], senderName?: string): Promise<{ success: boolean; message: Message; conversation: Conversation }> {
    const res = await fetch(`/api/conversations/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, productIds, senderName }),
    });
    return handleResponse(res);
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  // Products
  async getProducts(category?: string, search?: string, includeDisabled = false): Promise<Product[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    if (includeDisabled) params.append('includeDisabled', 'true');
    const res = await fetch(`/api/products?${params.toString()}`);
    return handleResponse(res);
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    return handleResponse(res);
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    if (product.id && !product.id.startsWith('new-')) {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return handleResponse(res);
    } else {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return handleResponse(res);
    }
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Sync Engine
  async testSyncConnection(url: string): Promise<{ success: boolean; message: string; previewCount?: number; sampleTitles?: string[] }> {
    const res = await fetch('/api/sync/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return handleResponse(res);
  },

  async runSyncNow(url?: string): Promise<SyncStatus> {
    const res = await fetch('/api/sync/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return handleResponse(res);
  },

  async runProductSync(url?: string): Promise<SyncStatus> {
    return this.runSyncNow(url);
  },

  async getSyncStatus(): Promise<SyncStatus> {
    const res = await fetch('/api/sync/status');
    return handleResponse(res);
  },

  async updateSyncSettings(settings: Partial<SyncStatus>): Promise<SyncStatus> {
    const res = await fetch('/api/sync/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },

  async updateSyncStatus(settings: Partial<SyncStatus>): Promise<SyncStatus> {
    return this.updateSyncSettings(settings);
  },

  // FAQs
  async getFaqs(): Promise<FAQ[]> {
    const res = await fetch('/api/faqs');
    return handleResponse(res);
  },

  async saveFaq(faq: Partial<FAQ>): Promise<FAQ> {
    if (faq.id && !faq.id.startsWith('new-')) {
      const res = await fetch(`/api/faqs/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      });
      return handleResponse(res);
    } else {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq),
      });
      return handleResponse(res);
    }
  },

  async deleteFaq(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/faqs/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Knowledge Base
  async getKnowledgeDocs(): Promise<KnowledgeDoc[]> {
    const res = await fetch('/api/knowledge');
    return handleResponse(res);
  },

  async saveKnowledgeDoc(doc: Partial<KnowledgeDoc>): Promise<KnowledgeDoc> {
    if (doc.id && !doc.id.startsWith('new-')) {
      const res = await fetch(`/api/knowledge/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      return handleResponse(res);
    } else {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      return handleResponse(res);
    }
  },

  // Announcements
  async getAnnouncements(activeOnly = false): Promise<Announcement[]> {
    const res = await fetch(`/api/announcements?activeOnly=${activeOnly}`);
    return handleResponse(res);
  },

  async saveAnnouncement(ann: Partial<Announcement>): Promise<Announcement> {
    if (ann.id && !ann.id.startsWith('new-')) {
      const res = await fetch(`/api/announcements/${ann.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ann),
      });
      return handleResponse(res);
    } else {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ann),
      });
      return handleResponse(res);
    }
  },

  async deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Broadcasts
  async getBroadcasts(): Promise<BroadcastNotification[]> {
    const res = await fetch('/api/broadcasts');
    return handleResponse(res);
  },

  async sendBroadcast(params: {
    title: string;
    message: string;
    targetType: 'all' | 'specific_customers' | 'active_today' | 'unresolved';
    recipientIds?: string[];
    actionUrl?: string;
  }): Promise<{ success: boolean; broadcast: BroadcastNotification }> {
    const res = await fetch('/api/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch('/api/customers');
    return handleResponse(res);
  },

  async getCustomer(id: string): Promise<Customer> {
    const res = await fetch(`/api/customers/${id}`);
    return handleResponse(res);
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  // Settings
  async getWebsiteSettings(): Promise<WebsiteSettings> {
    const res = await fetch('/api/settings/website');
    return handleResponse(res);
  },

  async updateWebsiteSettings(settings: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
    const res = await fetch('/api/settings/website', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },

  async getAiSettings(): Promise<AISettings> {
    const res = await fetch('/api/settings/ai');
    return handleResponse(res);
  },

  async updateAiSettings(settings: Partial<AISettings>): Promise<AISettings> {
    const res = await fetch('/api/settings/ai', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },

  // Admin Notifications
  async getAdminNotifications(): Promise<AdminNotification[]> {
    const res = await fetch('/api/admin/notifications');
    return handleResponse(res);
  },

  async markAdminNotificationRead(id?: string): Promise<void> {
    const res = await fetch('/api/admin/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    return handleResponse(res);
  },

  // Admin Auth
  async loginAdmin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return handleResponse(res);
  },

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch('/api/admin/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch('/api/analytics');
    return handleResponse(res);
  },

  // Push Subscription
  async registerPushSubscription(customerId: string, subscription: any): Promise<any> {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, subscription }),
    });
    return handleResponse(res);
  },
};
