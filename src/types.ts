export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  sizes: string[];
  inStock: boolean;
  stockCount?: number;
  productUrl: string;
  imageUrl: string;
  category: string;
  sku?: string;
  source: 'synced' | 'manual';
  isHiddenFromAi: boolean;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'customer' | 'ai' | 'human' | 'system';
  content: string;
  productIds?: string[];
  products?: Product[];
  timestamp: string;
  read: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  senderName?: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: 'ai' | 'waiting_for_human' | 'human' | 'resolved';
  lastMessage: string;
  lastActive: string;
  lastActiveAt?: string;
  unreadAdminCount?: number;
  unreadCustomerCount?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  notes?: string;
  assignedAgent?: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  avatarUrl?: string;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  firstSeen?: string;
  lastActive?: string;
  totalConversations?: number;
  notificationSubscribed?: boolean;
  notes?: string;
  tags?: string[];
  totalInquiries?: number;
  createdAt?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  order?: number;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content?: string;
  message?: string;
  type?: 'drop' | 'promotion' | 'notice';
  imageUrl?: string;
  actionText?: string;
  actionUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  isActive: boolean;
  targetAudience?: 'all' | 'new_customers' | 'vip';
  badge?: string;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  targetType: 'all' | 'selected_customers' | 'segment';
  recipientIds?: string[];
  sentAt: string;
  status?: 'sent' | 'scheduled';
  readCount?: number;
  totalRecipients: number;
  actionUrl?: string;
}

export interface WebsiteSettings {
  brandName: string;
  siteTitle?: string;
  customerCareTitle?: string;
  logoUrl?: string;
  faviconUrl?: string;
  aiName?: string;
  aiAvatarUrl?: string;
  welcomeMessage?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  instagramUrl?: string;
  businessHours?: string;
  supportAvailability?: string;
  footerText?: string;
  themeAccentColor?: string;
  websiteUrl?: string;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
}

export interface AISettings {
  aiName: string;
  systemInstructions: string;
  tone: 'modern_minimalist' | 'luxurious' | 'friendly' | 'formal' | 'luxury_concierge' | 'minimalist' | 'technical';
  model: string;
  multilingualUrdu?: boolean;
  strictInventoryOnly?: boolean;
  maxResponseTokens?: number;
  autoEscalateOnComplaint?: boolean;
  allowRomanUrdu?: boolean;
  productRecommendationLimit?: number;
  escalationMessage?: string;
}

export interface SyncStatus {
  sourceUrl?: string;
  websiteUrl?: string;
  autoSyncEnabled?: boolean;
  isAutoSync?: boolean;
  syncFrequency: 'hourly' | 'daily' | 'weekly' | 'manual' | '6hours';
  lastSyncTime: string;
  nextSyncTime?: string;
  status: 'idle' | 'syncing' | 'success' | 'failed';
  productsFound?: number;
  productsImported?: number;
  productsFailed?: number;
  message?: string;
  errorLogs?: string[];
  logs?: string[];
}

export interface AdminNotification {
  id: string;
  type: 'escalation' | 'new_chat' | 'sync_error' | 'sync_success' | 'customer_request';
  title: string;
  message: string;
  conversationId?: string;
  timestamp: string;
  isRead: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'in_embroidery'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId?: string;
  title: string;
  size?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city?: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  paymentMethod?: 'cod' | 'card' | 'bank_transfer' | string;
  courier?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  totalCustomers: number;
  newCustomersToday: number;
  totalConversations: number;
  activeConversations: number;
  aiHandledConversations: number;
  humanHandledConversations: number;
  escalatedConversations: number;
  averageResponseTimeSeconds: number;
  totalProductsSynced: number;
  notificationsSent: number;
  topQuestions: { question: string; count: number }[];
  mostViewedProducts: { title: string; views: number; price: number }[];
  dailyVolume: { date: string; aiChats: number; humanChats: number }[];
}
