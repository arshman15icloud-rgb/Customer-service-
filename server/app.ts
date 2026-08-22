import express from 'express';
import dotenv from 'dotenv';
import { db } from './storage.js';
import { testWebsiteConnection, syncProductsFromWebsite } from './scraper.js';
import { generateAICustomerCareResponse } from './gemini.js';

dotenv.config();

export function createExpressApp() {
  const app = express();

  // Middleware for CORS & JSON
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const apiRouter = express.Router();

  // Health check
  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', brand: 'Vertex Lab', timestamp: new Date().toISOString() });
  });

  // 1. Chat & Conversations
  apiRouter.post('/chat/send', async (req, res) => {
    try {
      const { customerId, customerName, email, message, conversationId, assistantMode, user } = req.body;

      if (!customerId || !message) {
        return res.status(400).json({ error: 'customerId and message are required' });
      }

      // Determine currentUser for intelligent context
      let currentUser = user;
      if (!currentUser && customerId) {
        const foundUser = db.getUserById(customerId) || (email ? db.getUserByEmail(email) : undefined);
        if (foundUser) {
          currentUser = foundUser;
        }
      }
      if (!currentUser && customerName) {
        currentUser = {
          id: customerId,
          name: customerName,
          email: email || '',
        };
      }

      // Get or create conversation
      let conv = conversationId
        ? db.getConversationById(conversationId)
        : db.getConversationByCustomerId(customerId);

      if (!conv) {
        conv = db.getOrCreateConversation(customerId, currentUser?.name || customerName, currentUser?.email || email);
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
      db.getOrCreateCustomer(customerId, currentUser?.name || customerName, currentUser?.email || email);

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

      // Otherwise, AI responds with full user account context
      const history = db.getMessages(conv.id);
      const chosenMode = (assistantMode === 'jenny' || assistantMode === 'duo' || assistantMode === 'gemini') ? assistantMode : 'gemini';
      const aiRes = await generateAICustomerCareResponse(conv.id, message, history, chosenMode, currentUser);

      let aiMsg = null;
      let senderName = db.getAiSettings().aiName || 'Vertex AI Concierge';
      if (chosenMode === 'jenny') {
        senderName = 'Jenny — Lead Stylist';
      } else if (chosenMode === 'duo') {
        senderName = 'Gemini & Jenny Collab';
      }

      if (aiRes.replyText) {
        aiMsg = db.addMessage({
          conversationId: conv.id,
          sender: 'ai',
          content: aiRes.replyText,
          productIds: aiRes.recommendedProductIds,
          read: true,
          senderName,
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
      res.status(500).json({ error: 'Failed to process chat message', details: err?.message || String(err) });
    }
  });

  // Get active conversations list
  apiRouter.get('/conversations', (req, res) => {
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
  apiRouter.get('/conversations/:id', (req, res) => {
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
  apiRouter.post('/conversations/:id/takeover', (req, res) => {
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
  apiRouter.post('/conversations/:id/return-to-ai', (req, res) => {
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
  apiRouter.post('/conversations/:id/reply', (req, res) => {
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
  apiRouter.put('/conversations/:id', (req, res) => {
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
  apiRouter.get('/products', (req, res) => {
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

  apiRouter.get('/products/:id', (req, res) => {
    const product = db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  });

  apiRouter.post('/products', (req, res) => {
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

  apiRouter.put('/products/:id', (req, res) => {
    try {
      const existing = db.getProductById(req.params.id) || db.getProducts(undefined, undefined, true).find(p => p.id === req.params.id);
      const productToSave = existing ? { ...existing, ...req.body, id: req.params.id } : { ...req.body, id: req.params.id };
      const updated = db.saveProduct(productToSave);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.delete('/products/:id', (req, res) => {
    const deleted = db.deleteProduct(req.params.id);
    res.json({ success: deleted });
  });

  // Orders Management API
  apiRouter.get('/orders', (req, res) => {
    try {
      const { search, status } = req.query;
      const q = typeof search === 'string' ? search : undefined;
      const st = typeof status === 'string' ? status : undefined;
      const orders = db.getOrders(q, st);
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.get('/orders/:id', (req, res) => {
    try {
      const order = db.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post('/orders', (req, res) => {
    try {
      const orderData = req.body;
      const saved = db.saveOrder(orderData);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.put('/orders/:id', (req, res) => {
    try {
      const orderData = { ...req.body, id: req.params.id };
      const saved = db.saveOrder(orderData);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.patch('/orders/:id/status', (req, res) => {
    try {
      const { status, trackingNumber, courier } = req.body;
      if (!status) return res.status(400).json({ error: 'Status is required' });
      const updated = db.updateOrderStatus(req.params.id, status, trackingNumber, courier);
      if (!updated) return res.status(404).json({ error: 'Order not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.delete('/orders/:id', (req, res) => {
    try {
      const deleted = db.deleteOrder(req.params.id);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Website Product Source & Sync Engine
  apiRouter.post('/sync/test', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });
      const result = await testWebsiteConnection(url);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post('/sync/run', async (req, res) => {
    try {
      const { url } = req.body;
      const targetUrl = url || db.getWebsiteSettings().websiteUrl || 'https://vertexlab.store';
      const result = await syncProductsFromWebsite(targetUrl);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.get('/sync/status', (req, res) => {
    res.json(db.getSyncStatus());
  });

  apiRouter.put('/sync/status', (req, res) => {
    const updated = db.updateSyncStatus(req.body);
    res.json(updated);
  });

  // 4. FAQs
  apiRouter.get('/faqs', (req, res) => {
    res.json(db.getFaqs());
  });

  apiRouter.post('/faqs', (req, res) => {
    const newFaq = {
      ...req.body,
      id: 'faq-' + Date.now(),
    };
    const saved = db.saveFaq(newFaq);
    res.json(saved);
  });

  apiRouter.put('/faqs/:id', (req, res) => {
    const saved = db.saveFaq({ ...req.body, id: req.params.id });
    res.json(saved);
  });

  apiRouter.delete('/faqs/:id', (req, res) => {
    const deleted = db.deleteFaq(req.params.id);
    res.json({ success: deleted });
  });

  // 5. Knowledge Base
  apiRouter.get('/knowledge', (req, res) => {
    res.json(db.getKnowledgeDocs());
  });

  apiRouter.post('/knowledge', (req, res) => {
    const newDoc = {
      ...req.body,
      id: 'kb-' + Date.now(),
      updatedAt: new Date().toISOString(),
    };
    const saved = db.saveKnowledgeDoc(newDoc);
    res.json(saved);
  });

  apiRouter.put('/knowledge/:id', (req, res) => {
    const saved = db.saveKnowledgeDoc({ ...req.body, id: req.params.id, updatedAt: new Date().toISOString() });
    res.json(saved);
  });

  // 6. Announcements
  apiRouter.get('/announcements', (req, res) => {
    const { activeOnly } = req.query;
    res.json(db.getAnnouncements(activeOnly === 'true'));
  });

  apiRouter.post('/announcements', (req, res) => {
    const newAnn = {
      ...req.body,
      id: 'ann-' + Date.now(),
    };
    const saved = db.saveAnnouncement(newAnn);
    res.json(saved);
  });

  apiRouter.put('/announcements/:id', (req, res) => {
    const saved = db.saveAnnouncement({ ...req.body, id: req.params.id });
    res.json(saved);
  });

  apiRouter.delete('/announcements/:id', (req, res) => {
    const deleted = db.deleteAnnouncement(req.params.id);
    res.json({ success: deleted });
  });

  // 7. Customer Specific Broadcasts
  apiRouter.get('/broadcasts', (req, res) => {
    res.json(db.getBroadcasts());
  });

  apiRouter.post('/broadcasts', (req, res) => {
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
  apiRouter.get('/customers', (req, res) => {
    res.json(db.getCustomers());
  });

  apiRouter.get('/customers/:id', (req, res) => {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  });

  apiRouter.put('/customers/:id', (req, res) => {
    const updated = db.updateCustomer(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  });

  // 9. Website & AI Settings
  apiRouter.get('/settings/website', (req, res) => {
    res.json(db.getWebsiteSettings());
  });

  apiRouter.put('/settings/website', (req, res) => {
    const updated = db.updateWebsiteSettings(req.body);
    res.json(updated);
  });

  apiRouter.get('/settings/ai', (req, res) => {
    res.json(db.getAiSettings());
  });

  apiRouter.put('/settings/ai', (req, res) => {
    const updated = db.updateAiSettings(req.body);
    res.json(updated);
  });

  // 10. Admin Notifications
  apiRouter.get('/admin/notifications', (req, res) => {
    res.json(db.getAdminNotifications());
  });

  apiRouter.post('/admin/notifications/mark-read', (req, res) => {
    const { id } = req.body;
    db.markAdminNotificationRead(id);
    res.json({ success: true });
  });

  // 11. Admin Auth
  apiRouter.post('/admin/auth/login', (req, res) => {
    const { password } = req.body;
    const isValid = db.verifyAdminPassword(password);
    if (isValid) {
      res.json({ success: true, token: 'vertex_admin_token_' + Date.now() });
    } else {
      res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }
  });

  apiRouter.post('/admin/auth/change-password', (req, res) => {
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
  apiRouter.get('/analytics', (req, res) => {
    res.json(db.getAnalytics());
  });

  // 13. User Authentication & Profiles (Customer Account System)
  apiRouter.post('/auth/register', (req, res) => {
    try {
      const { email, password, name, phone, address, city, postalCode } = req.body;
      if (!email || !name) {
        return res.status(400).json({ error: 'Name and Email are required' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        // Update profile
        const updated = db.updateUser(existing.id, {
          name,
          phone,
          address,
          city,
          postalCode,
          ...(password ? { password } : {}),
        });
        return res.json({ success: true, user: updated, message: 'Account updated successfully' });
      }

      const newUser = db.registerUser({
        name,
        email,
        password: password || 'password123',
        phone: phone || '+92 300 0000000',
        address: address || '',
        city: city || 'Lahore',
        postalCode: postalCode || '',
      });

      res.status(201).json({ success: true, user: newUser, token: 'token_' + newUser.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post('/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = db.authenticateUser(email, password);
      if (!user) {
        // If user doesn't exist, create an account if it's an interactive login attempt
        const nameGuess = email.split('@')[0].replace(/[._-]/g, ' ');
        const formattedName = nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1);
        const createdUser = db.registerUser({
          email,
          name: formattedName,
          password: password || 'password123',
        });
        return res.json({ success: true, user: createdUser, token: 'token_' + createdUser.id });
      }

      res.json({ success: true, user, token: 'token_' + user.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.get('/auth/me', (req, res) => {
    try {
      const { id, email } = req.query;
      let user = null;
      if (id && typeof id === 'string') {
        user = db.getUserById(id);
      }
      if (!user && email && typeof email === 'string') {
        user = db.getUserByEmail(email);
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.put('/auth/profile', (req, res) => {
    try {
      const { id, email, ...updates } = req.body;
      let targetUser = null;
      if (id) targetUser = db.getUserById(id);
      if (!targetUser && email) targetUser = db.getUserByEmail(email);

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found to update' });
      }

      const updated = db.updateUser(targetUser.id, updates);
      res.json({ success: true, user: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.get('/user/orders', (req, res) => {
    try {
      const { id, email, phone, name } = req.query;
      const userParam = {
        id: typeof id === 'string' ? id : undefined,
        email: typeof email === 'string' ? email : undefined,
        phone: typeof phone === 'string' ? phone : undefined,
        name: typeof name === 'string' ? name : undefined,
      };
      const orders = db.findOrdersForUser(userParam);
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.get('/users', (req, res) => {
    try {
      res.json(db.getUsers());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 14. Image Upload Endpoint (For Device Gallery & Product Photos)
  apiRouter.post('/upload/image', (req, res) => {
    try {
      const { image, name, filename } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      // If already a valid data URL or web URL, return it directly or normalize it
      const imageUrl = image;
      res.json({
        success: true,
        imageUrl,
        name: name || filename || 'uploaded_image.jpg',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
  });

  // 15. PWA Push Subscription
  apiRouter.post('/push/subscribe', (req, res) => {
    const { customerId, subscription } = req.body;
    if (customerId) {
      db.updateCustomer(customerId, { notificationSubscribed: true });
    }
    res.json({ success: true, message: 'Web push subscription registered' });
  });

  // Mount router on both '/api' and '/' for maximum environment compatibility
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  return app;
}
