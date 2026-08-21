import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/storage.js';
import { testWebsiteConnection, syncProductsFromWebsite } from './server/scraper.js';
import { generateAICustomerCareResponse } from './server/gemini.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', brand: 'Vertex Lab', timestamp: new Date().toISOString() });
  });

  // 1. Chat & Conversations
  app.post('/api/chat/send', async (req, res) => {
    try {
      const { customerId, customerName, email, message, conversationId } = req.body;

      if (!customerId || !message) {
        return res.status(400).json({ error: 'customerId and message are required' });
      }

      // Get or create conversation
      let conv = conversationId
        ? db.getConversationById(conversationId)
        : db.getConversationByCustomerId(customerId);

      if (!conv) {
        conv = db.getOrCreateConversation(customerId, customerName, email);
      }

      // Save customer message
      const customerMsg = db.addMessage({
        conversationId: conv.id,
        sender: 'customer',
        content: message,
        read: false,
        senderName: conv.customerName,
      });

      // Update customer profile
      db.getOrCreateCustomer(customerId, customerName, email);

      // Check if conversation is in Human takeover mode
      if (conv.status === 'human') {
        db.addAdminNotification({
          type: 'customer_request',
          title: `New message from ${conv.customerName}`,
          message: message.slice(0, 100),
          conversationId: conv.id,
        });

        return res.json({
          conversation: db.getConversationById(conv.id),
          customerMessage: customerMsg,
          aiMessage: null,
          aiResponded: false,
          mode: 'human',
        });
      }

      // Otherwise, AI responds
      const history = db.getMessages(conv.id);
      const aiRes = await generateAICustomerCareResponse(conv.id, message, history);

      let aiMsg = null;
      if (aiRes.replyText) {
        aiMsg = db.addMessage({
          conversationId: conv.id,
          sender: 'ai',
          content: aiRes.replyText,
          productIds: aiRes.recommendedProductIds,
          read: true,
          senderName: db.getAiSettings().aiName,
        });
      }

      // Check for escalation
      if (aiRes.escalateToHuman) {
        db.updateConversation(conv.id, {
          status: 'waiting_for_human',
          priority: 'urgent',
        });

        db.addAdminNotification({
          type: 'escalation',
          title: `Escalation: ${conv.customerName}`,
          message: aiRes.escalationReason || 'Customer requested human support or reported an issue.',
          conversationId: conv.id,
        });
      }

      const updatedConv = db.getConversationById(conv.id);

      return res.json({
        conversation: updatedConv,
        customerMessage: customerMsg,
        aiMessage: aiMsg,
        aiResponded: true,
        escalated: aiRes.escalateToHuman,
      });
    } catch (err: any) {
      console.error('Error in /api/chat/send:', err);
      res.status(500).json({ error: 'Failed to process chat message', details: err.message });
    }
  });

  // Get active conversations list
  app.get('/api/conversations', (req, res) => {
    try {
      const { status, search } = req.query;
      let convs = db.getConversations();

      if (status && status !== 'all') {
        convs = convs.filter(c => c.status === status);
      }

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        convs = convs.filter(
          c =>
            c.customerName.toLowerCase().includes(q) ||
            c.lastMessage.toLowerCase().includes(q) ||
            c.customerId.toLowerCase().includes(q)
        );
      }

      res.json(convs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single conversation with full message history
  app.get('/api/conversations/:id', (req, res) => {
    try {
      const { id } = req.params;
      const conv = db.getConversationById(id);
      if (!conv) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      const messages = db.getMessages(id);
      const customer = db.getCustomerById(conv.customerId);

      // Reset unread counter for admin when opened
      db.updateConversation(id, { unreadAdminCount: 0 });

      res.json({ conversation: conv, messages, customer });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Take Over conversation (Switch to human mode)
  app.post('/api/conversations/:id/takeover', (req, res) => {
    try {
      const { id } = req.params;
      const { agentName } = req.body;

      const conv = db.updateConversation(id, {
        status: 'human',
        assignedAgent: agentName || 'Vertex Care Agent',
      });

      if (!conv) return res.status(404).json({ error: 'Conversation not found' });

      // Add system message
      db.addMessage({
        conversationId: id,
        sender: 'system',
        content: `Live Agent (${agentName || 'Vertex Care Team'}) joined the conversation.`,
        read: true,
      });

      res.json({ success: true, conversation: conv });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Return conversation to AI
  app.post('/api/conversations/:id/return-to-ai', (req, res) => {
    try {
      const { id } = req.params;
      const conv = db.updateConversation(id, {
        status: 'ai',
        assignedAgent: undefined,
      });

      if (!conv) return res.status(404).json({ error: 'Conversation not found' });

      // Add system message
      db.addMessage({
        conversationId: id,
        sender: 'system',
        content: `AI Assistant (${db.getAiSettings().aiName}) resumed handling.`,
        read: true,
      });

      res.json({ success: true, conversation: conv });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Human agent manual reply
  app.post('/api/conversations/:id/reply', (req, res) => {
    try {
      const { id } = req.params;
      const { message, productIds, senderName } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const conv = db.getConversationById(id);
      if (!conv) return res.status(404).json({ error: 'Conversation not found' });

      const newMsg = db.addMessage({
        conversationId: id,
        sender: 'human',
        content: message,
        productIds: productIds || [],
        read: true,
        senderName: senderName || conv.assignedAgent || 'Vertex Care Agent',
      });

      res.json({ success: true, message: newMsg, conversation: db.getConversationById(id) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update conversation details (priority, notes, tags)
  app.put('/api/conversations/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = db.updateConversation(id, updates);
      if (!updated) return res.status(404).json({ error: 'Conversation not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Products Management & Search
  app.get('/api/products', (req, res) => {
    try {
      const { category, search, includeDisabled } = req.query;
      const cat = typeof category === 'string' && category !== 'All' ? category : undefined;
      const q = typeof search === 'string' ? search : undefined;
      const includeHidden = includeDisabled === 'true';
      let products = db.getProducts(cat, q, includeHidden);

      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/products/:id', (req, res) => {
    const product = db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  });

  app.post('/api/products', (req, res) => {
    try {
      const newProduct = {
        ...req.body,
        id: 'prod-' + Date.now(),
        source: 'manual' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const saved = db.saveProduct(newProduct);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', (req, res) => {
    try {
      const existing = db.getProductById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Product not found' });
      const updated = db.saveProduct({ ...existing, ...req.body });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    const deleted = db.deleteProduct(req.params.id);
    res.json({ success: deleted });
  });

  // 3. Website Product Source & Sync Engine
  app.post('/api/sync/test', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });
      const result = await testWebsiteConnection(url);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sync/run', async (req, res) => {
    try {
      const { url } = req.body;
      const targetUrl = url || db.getWebsiteSettings().websiteUrl || 'https://vertexlab.store';
      const result = await syncProductsFromWebsite(targetUrl);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/sync/status', (req, res) => {
    res.json(db.getSyncStatus());
  });

  app.put('/api/sync/status', (req, res) => {
    const updated = db.updateSyncStatus(req.body);
    res.json(updated);
  });

  // 4. FAQs
  app.get('/api/faqs', (req, res) => {
    res.json(db.getFaqs());
  });

  app.post('/api/faqs', (req, res) => {
    const newFaq = {
      ...req.body,
      id: 'faq-' + Date.now(),
    };
    const saved = db.saveFaq(newFaq);
    res.json(saved);
  });

  app.put('/api/faqs/:id', (req, res) => {
    const saved = db.saveFaq({ ...req.body, id: req.params.id });
    res.json(saved);
  });

  app.delete('/api/faqs/:id', (req, res) => {
    const deleted = db.deleteFaq(req.params.id);
    res.json({ success: deleted });
  });

  // 5. Knowledge Base
  app.get('/api/knowledge', (req, res) => {
    res.json(db.getKnowledgeDocs());
  });

  app.post('/api/knowledge', (req, res) => {
    const newDoc = {
      ...req.body,
      id: 'kb-' + Date.now(),
      updatedAt: new Date().toISOString(),
    };
    const saved = db.saveKnowledgeDoc(newDoc);
    res.json(saved);
  });

  app.put('/api/knowledge/:id', (req, res) => {
    const saved = db.saveKnowledgeDoc({ ...req.body, id: req.params.id, updatedAt: new Date().toISOString() });
    res.json(saved);
  });

  // 6. Announcements
  app.get('/api/announcements', (req, res) => {
    const { activeOnly } = req.query;
    res.json(db.getAnnouncements(activeOnly === 'true'));
  });

  app.post('/api/announcements', (req, res) => {
    const newAnn = {
      ...req.body,
      id: 'ann-' + Date.now(),
    };
    const saved = db.saveAnnouncement(newAnn);
    res.json(saved);
  });

  app.put('/api/announcements/:id', (req, res) => {
    const saved = db.saveAnnouncement({ ...req.body, id: req.params.id });
    res.json(saved);
  });

  app.delete('/api/announcements/:id', (req, res) => {
    const deleted = db.deleteAnnouncement(req.params.id);
    res.json({ success: deleted });
  });

  // 7. Customer Specific Broadcasts
  app.get('/api/broadcasts', (req, res) => {
    res.json(db.getBroadcasts());
  });

  app.post('/api/broadcasts', (req, res) => {
    const { title, message, targetType, recipientIds, actionUrl } = req.body;

    const broadcast = db.addBroadcast({
      title,
      message,
      targetType: targetType || 'all',
      recipientIds: recipientIds || [],
      status: 'sent',
      actionUrl,
    });

    db.addAdminNotification({
      type: 'customer_request',
      title: `Broadcast Sent: ${title}`,
      message: `Dispatched to ${broadcast.totalRecipients} customer(s).`,
    });

    res.json({ success: true, broadcast });
  });

  // 8. Customer Profile Directory
  app.get('/api/customers', (req, res) => {
    res.json(db.getCustomers());
  });

  app.get('/api/customers/:id', (req, res) => {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  });

  app.put('/api/customers/:id', (req, res) => {
    const updated = db.updateCustomer(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  });

  // 9. Website & AI Settings
  app.get('/api/settings/website', (req, res) => {
    res.json(db.getWebsiteSettings());
  });

  app.put('/api/settings/website', (req, res) => {
    const updated = db.updateWebsiteSettings(req.body);
    res.json(updated);
  });

  app.get('/api/settings/ai', (req, res) => {
    res.json(db.getAiSettings());
  });

  app.put('/api/settings/ai', (req, res) => {
    const updated = db.updateAiSettings(req.body);
    res.json(updated);
  });

  // 10. Admin Notifications
  app.get('/api/admin/notifications', (req, res) => {
    res.json(db.getAdminNotifications());
  });

  app.post('/api/admin/notifications/mark-read', (req, res) => {
    const { id } = req.body;
    db.markAdminNotificationRead(id);
    res.json({ success: true });
  });

  // 11. Admin Auth
  app.post('/api/admin/auth/login', (req, res) => {
    const { password } = req.body;
    const isValid = db.verifyAdminPassword(password);
    if (isValid) {
      res.json({ success: true, token: 'vertex_admin_token_' + Date.now() });
    } else {
      res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }
  });

  app.post('/api/admin/auth/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!db.verifyAdminPassword(currentPassword)) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    db.updateAdminPassword(newPassword);
    res.json({ success: true, message: 'Admin password updated successfully' });
  });

  // 12. Analytics
  app.get('/api/analytics', (req, res) => {
    res.json(db.getAnalytics());
  });

  // 13. PWA Push Subscription
  app.post('/api/push/subscribe', (req, res) => {
    const { customerId, subscription } = req.body;
    if (customerId) {
      db.updateCustomer(customerId, { notificationSubscribed: true });
    }
    res.json({ success: true, message: 'Web push subscription registered' });
  });

  // Vite middleware for dev / static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vertex Lab Customer Care Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
