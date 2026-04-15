const API_BASE = "https://onettbackend.onrender.com/api/v1";

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

// ─── Structured API error so callers get clean message + status ───────────────
export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
    ...options.headers,
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!options.isFormData && options.body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.isFormData
      ? options.body
      : options.body
      ? JSON.stringify(options.body)
      : undefined,
  });

  if (res.status === 204 || res.status === 205) {
    return null as unknown as T;
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    let data: any = null;

    const ct = res.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        data = await res.json();
        message = data?.message ?? data?.error ?? data?.detail ?? JSON.stringify(data);
      } else {
        const text = await res.text();
        message = text || message;
      }
    } catch {
      // parse failed, keep default message
    }

    console.error(`[API ${res.status}] ${options.method ?? "GET"} ${endpoint}`, data ?? message);
    throw new ApiError(message, res.status, data);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  return (text || null) as unknown as T;
}

// ─── Unwrap helpers ───────────────────────────────────────────────────────────
//
// All controllers (UserProductController, OrderController, OrderPaymentController)
// wrap every response in:
//   { success: boolean, message: string, data: T, timestamp: string }
//
// Use unwrap() for all wrapped endpoints so callers always receive T directly.
// PreOrderController returns bare values — use preOrderRequest() for those.

async function unwrap<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const res = await request<{ success: boolean; message: string; data: T }>(endpoint, options);
  return res.data;
}

// ─── Auth - Users ─────────────────────────────────────────────────────────────
export const userApi = {
  register: (formData: FormData) =>
    request<any>("/users/register", { method: "POST", body: formData, isFormData: true }),
  login: (data: { email: string; password: string }) =>
    request<any>("/users/login", { method: "POST", body: data }),
  getProfile: () => request<any>("/users/me"),
  getProfilePic: () => request<any>("/users/me/profile-pic"),
  updateProfile: (formData: FormData) =>
    request<any>("/users/me", { method: "PUT", body: formData, isFormData: true }),
};

// ─── Auth - Sellers ───────────────────────────────────────────────────────────
export const sellerApi = {
  register: (formData: FormData) =>
    request<any>("/sellers/register", { method: "POST", body: formData, isFormData: true }),
  login: (data: { email: string; password: string }) =>
    request<any>("/sellers/login", { method: "POST", body: data }),
  getById: (id: string) => request<any>(`/sellers/${id}`),
  getProfile: () => request<any>("/sellers/me"),
  updateProfile: (formData: FormData) =>
    request<any>("/sellers/me", { method: "PUT", body: formData, isFormData: true }),
};

// ─── Products - Public ────────────────────────────────────────────────────────
//
// All UserProductController endpoints wrap responses in ApiResponse<T>.
// Using unwrap() here so every caller gets the inner data directly — no
// more manual res?.data unwrapping in components.

export const productApi = {
  getHome: () => unwrap<any>("/products/home"),
  getFeatured: () => unwrap<any[]>("/products/featured"),
  getNewArrivals: () => unwrap<any[]>("/products/new-arrivals"),
  getTrending: () => unwrap<any[]>("/products/trending"),
  getDiscounted: () => unwrap<any[]>("/products/discounted"),
  getUpcoming: () => unwrap<any>("/products/upcoming"),
  getComingSoon: () => unwrap<any[]>("/products/coming-soon"),
  getPreOrder: () => unwrap<any[]>("/products/pre-order"),
  getCategories: () => unwrap<any[]>("/products/categories"),
  getByCategory: (slug: string) => unwrap<any>(`/products/categories/${slug}`),
  getDetails: (id: string) => unwrap<any>(`/products/${id}`),
  getByBrand: (brand: string) => unwrap<any[]>(`/products/brand/${brand}`),
  getByPriceRange: (min: number, max: number) =>
    unwrap<any[]>(`/products/price-range?min=${min}&max=${max}`),
  getStore: (sellerId: string) => unwrap<any>(`/products/store/${sellerId}`),
  globalSearch: (keyword: string) =>
    unwrap<any>(`/products/search/global?keyword=${encodeURIComponent(keyword)}`),
  search: (keyword: string) =>
    unwrap<any>(`/products/search?keyword=${encodeURIComponent(keyword)}`),
  searchWithFilters: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return unwrap<any>(`/products/search${qs ? `?${qs}` : ""}`);
  },
  searchByLocation: (location: string, keyword?: string) => {
    const params = new URLSearchParams({ location });
    if (keyword) params.append("keyword", keyword);
    return unwrap<any>(`/products/search/location?${params}`);
  },
};

// ─── Seller Products - Authenticated ─────────────────────────────────────────
export const sellerProductApi = {
  getMyProducts: () => request<any>("/seller/products"),
  getMyProductsByStatus: (status: string) =>
    request<any>(`/seller/products/status?status=${status}`),
  getLowStock: (threshold: number) =>
    request<any>(`/seller/products/low-stock?threshold=${threshold}`),
  getProductDetails: (id: string) => request<any>(`/seller/products/${id}`),

  addProduct: (formData: FormData) =>
    request<any>("/seller/products", { method: "POST", body: formData, isFormData: true }),
  updateProduct: (id: string, formData: FormData) =>
    request<any>(`/seller/products/${id}`, { method: "PUT", body: formData, isFormData: true }),
  replaceImages: (id: string, formData: FormData) =>
    request<any>(`/seller/products/${id}/images/replace`, {
      method: "PUT", body: formData, isFormData: true,
    }),

  updateStock: (id: string, stock: number) =>
    request<any>(`/seller/products/${id}/stock?stock=${stock}`, { method: "PATCH" }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/seller/products/${id}/status?status=${status}`, { method: "PATCH" }),

  deleteProduct: (id: string) =>
    request<void>(`/seller/products/${id}`, { method: "DELETE" }),

  getCategories: () => request<any>("/seller/categories"),
  createCategory: (formData: FormData) =>
    request<any>("/seller/categories", { method: "POST", body: formData, isFormData: true }),
  updateCategory: (id: string, formData: FormData) =>
    request<any>(`/seller/categories/${id}`, {
      method: "PUT", body: formData, isFormData: true,
    }),
  deleteCategory: (id: string) =>
    request<void>(`/seller/categories/${id}`, { method: "DELETE" }),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
//
// CartController wraps every response in ApiResponse<CartResponse>.
// Use unwrap() so callers receive CartResponse directly.
//
// PATCH /cart/{cartItemId} expects a JSON body { quantity: number },
// NOT a query param — matches CartController.updateQuantity(Map<String,Integer>)
//
// DELETE /cart/{cartItemId} returns ApiResponse<CartResponse> (updated cart)
// DELETE /cart             returns ApiResponse<Void>           (clear)

export const cartApi = {
  get: () => unwrap<any>("/cart"),
  add: (productId: string, quantity: number) =>
    unwrap<any>("/cart", { method: "POST", body: { productId, quantity } }),
  updateQuantity: (cartItemId: string, quantity: number) =>
    unwrap<any>(`/cart/${cartItemId}`, { method: "PATCH", body: { quantity } }),
  remove: (cartItemId: string) =>
    unwrap<any>(`/cart/${cartItemId}`, { method: "DELETE" }),
  clear: () => unwrap<void>("/cart", { method: "DELETE" }),
  getCount: () => unwrap<any>("/cart/count"),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
//
// All OrderController endpoints are wrapped: { success, message, data, timestamp }
// Use unwrap<T>() so callers always get the inner data directly.

export const orderApi = {
  // ── user ──────────────────────────────────────────────────────────────────

  /** POST /orders/initiate → returns OrderInitResponse (orderId, total, …) */
  initiate: (data: { deliveryAddress?: string; notes?: string }) =>
    unwrap<any>("/orders/initiate", { method: "POST", body: data }),

  /** GET /orders/my-orders → List<OrderResponse> */
  getMy: () =>
    unwrap<any[]>("/orders/my-orders"),

  /** GET /orders/my-orders/{orderId} → OrderResponse */
  getMyById: (orderId: string) =>
    unwrap<any>(`/orders/my-orders/${orderId}`),

  /** GET /orders/my-orders?status=SHIPPED → List<OrderResponse> */
  getMyByStatus: (status: string) =>
    unwrap<any[]>(`/orders/my-orders?status=${status}`),

  /** PATCH /orders/my-orders/{orderId}/cancel → OrderResponse */
  cancelMy: (orderId: string) =>
    unwrap<any>(`/orders/my-orders/${orderId}/cancel`, { method: "PATCH" }),

  // ── seller ────────────────────────────────────────────────────────────────

  /** GET /orders/seller/orders[?status=] → List<OrderResponse> */
  getSellerOrders: (status?: string) =>
    unwrap<any[]>(
      status ? `/orders/seller/orders?status=${status}` : "/orders/seller/orders"
    ),

  /** GET /orders/seller/revenue → Map<String, Object> */
  getSellerRevenue: () =>
    unwrap<any>("/orders/seller/revenue"),

  // ── admin ─────────────────────────────────────────────────────────────────

  adminGetAll: (status?: string) =>
    unwrap<any[]>(status ? `/orders/admin/all?status=${status}` : "/orders/admin/all"),

  adminGetById: (orderId: string) =>
    unwrap<any>(`/orders/admin/${orderId}`),

  /** PATCH /orders/admin/{orderId}/status  body: { status: string } */
  adminUpdateStatus: (orderId: string, status: string) =>
    unwrap<any>(`/orders/admin/${orderId}/status`, { method: "PATCH", body: { status } }),

  adminCancelOrder: (orderId: string) =>
    unwrap<any>(`/orders/admin/${orderId}/cancel`, { method: "PATCH" }),

  adminGetSummary: () =>
    unwrap<any>("/orders/admin/summary"),

  adminGetToday: () =>
    unwrap<any[]>("/orders/admin/today"),

  adminGetThisWeek: () =>
    unwrap<any[]>("/orders/admin/this-week"),

  adminGetThisMonth: () =>
    unwrap<any[]>("/orders/admin/this-month"),

  adminGetByDateRange: (from: string, to: string) =>
    unwrap<any[]>(`/orders/admin/date-range?from=${from}&to=${to}`),

  adminGetDailyCounts: () =>
    unwrap<any>("/orders/admin/daily-counts"),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentApi = {
  /**
   * POST /payments/orders/{orderId}/initialize
   * Returns PaymentInitResponse — caller should redirect to res.authorizationUrl
   */
  initializeOrderPayment: (orderId: string) =>
    unwrap<any>(`/payments/orders/${orderId}/initialize`, { method: "POST" }),

  /**
   * GET /payments/orders/verify/{reference}
   * Returns PaymentVerifyResponse — check res.success and res.orderId
   */
  verifyOrderPayment: (reference: string) =>
    unwrap<any>(`/payments/orders/verify/${reference}`),
};

// ─── Pre-orders ───────────────────────────────────────────────────────────────
//
// PreOrderController lives at /api/pre-orders (no /v1 in the mapping).
// It does NOT use the ApiResponse wrapper — returns bare List<> or single object.
// Use preOrderRequest<T>() here, not unwrap().

const PRE_ORDER_BASE = "https://poikiloblastic-leeanne-gazeless.ngrok-free.dev/api/pre-orders";

async function preOrderRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
    ...options.headers,
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!options.isFormData && options.body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${PRE_ORDER_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.isFormData
      ? options.body
      : options.body
      ? JSON.stringify(options.body)
      : undefined,
  });

  if (res.status === 204 || res.status === 205) return null as unknown as T;

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    let data: any = null;
    const ct = res.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        data = await res.json();
        message = data?.message ?? JSON.stringify(data);
      } else {
        message = (await res.text()) || message;
      }
    } catch { /* keep default */ }
    console.error(`[PRE-ORDER API ${res.status}] ${options.method ?? "GET"} ${path}`, data ?? message);
    throw new ApiError(message, res.status, data);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return (text || null) as unknown as T;
}

export const preOrderApi = {
  // ── user ──────────────────────────────────────────────────────────────────

  /** GET /api/pre-orders/my → List<PreOrderRecordResponse> (bare, no wrapper) */
  getMy: () =>
    preOrderRequest<any[]>("/my"),

  /** POST /api/pre-orders/{id}/request-delivery → PreOrderRecordResponse */
  requestDelivery: (preOrderRecordId: string) =>
    preOrderRequest<any>(`/${preOrderRecordId}/request-delivery`, { method: "POST" }),

  // ── seller (role = SELLER) ────────────────────────────────────────────────

  /** GET /api/pre-orders/seller/all → List<PreOrderRecordResponse> */
  adminGetAll: () =>
    preOrderRequest<any[]>("/seller/all"),

  /** GET /api/pre-orders/seller/product/{productId} */
  adminGetByProduct: (productId: string) =>
    preOrderRequest<any[]>(`/seller/product/${productId}`),

  /** GET /api/pre-orders/seller/status/{status} */
  adminGetByStatus: (status: string) =>
    preOrderRequest<any[]>(`/seller/status/${status}`),

  /**
   * POST /api/pre-orders/seller/{id}/confirm-payment
   * body: { adminNote?: string }
   */
  adminConfirmPayment: (preOrderRecordId: string, adminNote?: string) =>
    preOrderRequest<any>(`/seller/${preOrderRecordId}/confirm-payment`, {
      method: "POST",
      body: adminNote ? { adminNote } : {},
    }),
};

// ─── Product Listing Requests ─────────────────────────────────────────────────
//
// ProductRequestController → /api/v1/product-requests
// All responses wrapped in ApiResponse<T> — use unwrap().

export const productRequestApi = {
  initiatePayment: () =>
    unwrap<any>("/product-requests/initiate", { method: "POST" }),

  verifyPayment: (reference: string) =>
    unwrap<any>(`/product-requests/verify/${reference}`),

  getById: (productRequestId: string) =>
    unwrap<any>(`/product-requests/${productRequestId}`),
};

// ─── User Product Requests ────────────────────────────────────────────────────
//
// UserAdvancedProductController → /api/v1/user-products

export const userProductApi = {
  create: (requestId: string, formData: FormData) =>
    unwrap<any>(`/user-products/create?requestId=${requestId}`, {
      method: "POST",
      body: formData,
      isFormData: true,
    }),

  update: (productId: string, formData: FormData) =>
    unwrap<any>(`/user-products/${productId}`, {
      method: "PUT",
      body: formData,
      isFormData: true,
    }),

  getMyRequests: (page = 0, size = 10) =>
    unwrap<any>(`/user-products/my-requests?page=${page}&size=${size}`),

  getMyRequestById: (requestId: string) =>
    unwrap<any>(`/user-products/my-requests/${requestId}`),

  getMyProductsByStatus: (status: string, page = 0, size = 10) =>
    unwrap<any>(`/user-products/my-products?status=${status}&page=${page}&size=${size}`),

  sellerGetAll: () =>
    unwrap<any[]>("/user-products/seller/all"),

  sellerGetByStatus: (status: string, page = 0, size = 10) =>
    unwrap<any>(`/user-products/seller/by-status?status=${status}&page=${page}&size=${size}`),

  sellerGetRecent: (page = 0, size = 10) =>
    unwrap<any>(`/user-products/seller/recent?page=${page}&size=${size}`),

  sellerGetRequestById: (requestId: string) =>
    unwrap<any>(`/user-products/seller/requests/${requestId}`),

  sellerUpdateStatus: (productId: string, status: "PENDING" | "APPROVED" | "REJECTED") =>
    unwrap<any>(`/user-products/seller/requests/${productId}/status`, {
      method: "PATCH",
      body: { status },
    }),
};

// ─── Delivery ─────────────────────────────────────────────────────────────────
export const deliveryApi = {
  request: (orderId: string, deliveryAddress: string) =>
    request<any>("/deliveries", { method: "POST", body: { orderId, deliveryAddress } }),
  getMy: () => request<any>("/deliveries/my"),
  getMyByStatus: (status: string) => request<any>(`/deliveries/my/status?status=${status}`),
  cancel: (deliveryId: string) =>
    request<any>(`/deliveries/${deliveryId}/cancel`, { method: "PATCH" }),
  track: (trackingNumber: string) => request<any>(`/deliveries/track/${trackingNumber}`),
  getSellerDeliveries: () => request<any>("/deliveries/seller"),
  getSellerByStatus: (status: string) =>
    request<any>(`/deliveries/seller/status?status=${status}`),
  adminGetAll: () => request<any>("/deliveries/admin"),
  adminGetByStatus: (status: string) =>
    request<any>(`/deliveries/admin/status?status=${status}`),
  adminUpdateStatus: (deliveryId: string, status: string) =>
    request<any>(`/deliveries/admin/${deliveryId}/status?status=${status}`, { method: "PATCH" }),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
//
// ChatController → /api/v1/chat
// All responses wrapped in ApiResponse<T> — use unwrap().
//
// Endpoint map (backend → frontend method):
//
//   POST   /chat/conversations                                → startConversation(productId)
//   POST   /chat/conversations/{id}/messages/user            → userSendMessage(id, content, productImageId?)
//   POST   /chat/conversations/{id}/messages/seller          → sellerSendMessage(id, content, productImageId?)
//   POST   /chat/conversations/{id}/delivery                 → submitDeliveryDetails(id, details)
//   GET    /chat/conversations/{id}/history                  → getChatHistory(id)
//   GET    /chat/user/conversations[?unreadOnly=true]        → getUserConversations(unreadOnly?)
//   GET    /chat/seller/conversations[?unreadOnly=true]      → getSellerConversations(unreadOnly?)
//   GET    /chat/seller/inbox                                → getSellerInbox()
//   GET    /chat/user/unread-count                           → getUserUnreadCount()
//   GET    /chat/seller/unread-count                         → getSellerUnreadCount()
//   PATCH  /chat/conversations/{id}/read?senderType=USER|SELLER → markAsRead(id, senderType)
//   DELETE /chat/conversations/{id}                          → deleteConversation(id)

export const chatApi = {
  // ── Conversation lifecycle ────────────────────────────────────────────────

  /**
   * POST /chat/conversations
   * body: { productId: string }
   * Returns ConversationResponse
   * Called by buyers to open a product enquiry chat.
   */
  startConversation: (productId: string) =>
    unwrap<any>("/chat/conversations", {
      method: "POST",
      body: { productId },
    }),

  /**
   * DELETE /chat/conversations/{conversationId}
   * Authenticated as UserPrincipal — only the conversation owner can delete.
   * Returns ApiResponse<Void>
   */
  deleteConversation: (conversationId: string) =>
    unwrap<void>(`/chat/conversations/${conversationId}`, { method: "DELETE" }),

  // ── Messaging ─────────────────────────────────────────────────────────────

  /**
   * POST /chat/conversations/{conversationId}/messages/user
   * body: { content: string, productImageId?: number }
   * Authenticated as UserPrincipal.
   * Returns MessageResponse
   */
  userSendMessage: (conversationId: string, content: string, productImageId?: number) =>
    unwrap<any>(`/chat/conversations/${conversationId}/messages/user`, {
      method: "POST",
      body: { content, ...(productImageId != null && { productImageId }) },
    }),

  /**
   * POST /chat/conversations/{conversationId}/messages/seller
   * body: { content: string, productImageId?: number }
   * Authenticated as UserPrincipal (seller role).
   * Returns MessageResponse
   */
  sellerSendMessage: (conversationId: string, content: string, productImageId?: number) =>
    unwrap<any>(`/chat/conversations/${conversationId}/messages/seller`, {
      method: "POST",
      body: { content, ...(productImageId != null && { productImageId }) },
    }),

  /**
   * POST /chat/conversations/{conversationId}/delivery
   * body: DeliveryDetailsRequest fields
   * Authenticated as UserPrincipal — buyer submits delivery info.
   * Returns MessageResponse
   */
  submitDeliveryDetails: (
    conversationId: string,
    details: {
      fullName: string;
      email: string;
      phoneNumber: string;
      whatsAppNumber: string;
      landmark: string;
      location: string;
      gpsAddress?: string;
    }
  ) =>
    unwrap<any>(`/chat/conversations/${conversationId}/delivery`, {
      method: "POST",
      body: details,
    }),

  // ── History ───────────────────────────────────────────────────────────────

  /**
   * GET /chat/conversations/{conversationId}/history
   * Returns ChatHistoryResponse: { conversationId, productCard, messages[], totalMessages }
   * Also auto-marks messages as read server-side based on viewer identity.
   */
  getChatHistory: (conversationId: string) =>
    unwrap<any>(`/chat/conversations/${conversationId}/history`),

  // ── User conversation lists ───────────────────────────────────────────────

  /**
   * GET /chat/user/conversations
   * Returns List<ConversationResponse>
   * Authenticated as UserPrincipal.
   */
  getUserConversations: () =>
    unwrap<any[]>("/chat/user/conversations"),

  /**
   * GET /chat/user/conversations?unreadOnly=true
   * Returns List<ConversationResponse> filtered to those with unread messages.
   */
  getUserConversationsUnread: () =>
    unwrap<any[]>("/chat/user/conversations?unreadOnly=true"),

  // ── Seller conversation lists ─────────────────────────────────────────────

  /**
   * GET /chat/seller/conversations
   * Returns List<ConversationResponse>
   * Authenticated as AdminPrincipal (seller).
   */
  getSellerConversations: () =>
    unwrap<any[]>("/chat/seller/conversations"),

  /**
   * GET /chat/seller/conversations?unreadOnly=true
   * Returns List<ConversationResponse> filtered to those with unread messages.
   */
  getSellerConversationsUnread: () =>
    unwrap<any[]>("/chat/seller/conversations?unreadOnly=true"),

  /**
   * GET /chat/seller/inbox
   * Returns List<SellerInboxResponse> — richer inbox view with last message + unread count.
   * Authenticated as AdminPrincipal (seller).
   */
  getSellerInbox: () =>
    unwrap<any[]>("/chat/seller/inbox"),

  // ── Unread counts ─────────────────────────────────────────────────────────

  /**
   * GET /chat/user/unread-count
   * Returns { unreadCount: number }
   */
  getUserUnreadCount: () =>
    unwrap<{ unreadCount: number }>("/chat/user/unread-count"),

  /**
   * GET /chat/seller/unread-count
   * Returns { unreadCount: number }
   */
  getSellerUnreadCount: () =>
    unwrap<{ unreadCount: number }>("/chat/seller/unread-count"),

  // ── Read state ────────────────────────────────────────────────────────────

  /**
   * PATCH /chat/conversations/{conversationId}/read?senderType=USER|SELLER
   * senderType: the role whose messages should be marked as read.
   *   - When the seller opens a conversation → senderType=USER  (mark buyer's msgs as read)
   *   - When the user opens a conversation   → senderType=SELLER (mark seller's msgs as read)
   * Returns ApiResponse<Void>
   */
  markAsRead: (conversationId: string, senderType: "USER" | "SELLER") =>
    unwrap<void>(
      `/chat/conversations/${conversationId}/read?senderType=${senderType}`,
      { method: "PATCH" }
    ),
};



export const notificationApi = {
  getAll: () => unwrap<any[]>("/notifications/user"),

  getUnread: () => unwrap<any[]>("/notifications/user?unreadOnly=true"),

  getUnreadCount: () => unwrap<{ unreadCount: number }>("/notifications/user/unread-count"),

  markAsRead: (id: string) =>
    unwrap<void>(`/notifications/user/${id}/read`, { method: "PATCH" }),

  markAllAsRead: () =>
    unwrap<void>("/notifications/user/read-all", { method: "PATCH" }),

  registerFcmToken: (fcmToken: string) =>
    unwrap<void>("/notifications/user/fcm-token", {
      method: "POST",
      body: { fcmToken },
    }),
};
// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (message: string, budget?: number) => {
    const params = new URLSearchParams({ message });
    if (budget) params.append("budget", budget.toString());
    return request<any>(`/ai/chat?${params}`, { method: "POST" });
  },
  searchByLocation: (location: string, query: string) =>
    request<any>(`/ai/search/location?${new URLSearchParams({ location, query })}`),
  searchByImage: (formData: FormData) =>
    request<any>("/ai/search/image", { method: "POST", body: formData, isFormData: true }),
  fashionAdvice: (query: string, budget?: number, occasion?: string) => {
    const params = new URLSearchParams({ query });
    if (budget) params.append("budget", budget.toString());
    if (occasion) params.append("occasion", occasion);
    return request<any>(`/ai/fashion-advice?${params}`, { method: "POST" });
  },
  compareProducts: (productIds: string[], query: string) => {
    const params = new URLSearchParams({ query });
    productIds.forEach(id => params.append("productIds", id));
    return request<any>(`/ai/compare?${params}`, { method: "POST" });
  },
  generateListing: (productName: string, basicDetails: string) =>
    request<any>(
      `/ai/seller/generate-listing?${new URLSearchParams({ productName, basicDetails })}`,
      { method: "POST" },
    ),
  suggestPrice: (productName: string, productDetails: string, condition?: string) => {
    const params = new URLSearchParams({ productName, productDetails });
    if (condition) params.append("condition", condition);
    return request<any>(`/ai/seller/suggest-price?${params}`);
  },
  inventoryAnalysis: () => request<any>("/ai/seller/inventory-analysis"),
  improveVisibility: (productId: string) =>
    request<any>(`/ai/seller/improve-visibility/${productId}`),
  getTrends: () => request<any>("/ai/trends"),
};

// ─── Utility ──────────────────────────────────────────────────────────────────
export const utilApi = {
  ping: () => request<string>("/ping"),
};
