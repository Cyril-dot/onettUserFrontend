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
export const orderApi = {
  initiate: (data: { deliveryAddress?: string; notes?: string }) =>
    unwrap<any>("/orders/initiate", { method: "POST", body: data }),
  getMy: () =>
    unwrap<any[]>("/orders/my-orders"),
  getMyById: (orderId: string) =>
    unwrap<any>(`/orders/my-orders/${orderId}`),
  getMyByStatus: (status: string) =>
    unwrap<any[]>(`/orders/my-orders?status=${status}`),
  cancelMy: (orderId: string) =>
    unwrap<any>(`/orders/my-orders/${orderId}/cancel`, { method: "PATCH" }),
  getSellerOrders: (status?: string) =>
    unwrap<any[]>(status ? `/orders/seller/orders?status=${status}` : "/orders/seller/orders"),
  getSellerRevenue: () =>
    unwrap<any>("/orders/seller/revenue"),
  adminGetAll: (status?: string) =>
    unwrap<any[]>(status ? `/orders/admin/all?status=${status}` : "/orders/admin/all"),
  adminGetById: (orderId: string) =>
    unwrap<any>(`/orders/admin/${orderId}`),
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
  submitOrderPayment: (
    orderId: string,
    senderAccountName: string,
    senderPhoneNumber: string,
    screenshot: File,
  ): Promise<any> => {
    const formData = new FormData();
    formData.append("senderAccountName", senderAccountName);
    formData.append("senderPhoneNumber", senderPhoneNumber);
    formData.append("screenshot", screenshot);
    return unwrap<any>(`/payments/orders/${orderId}/submit`, {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },
  adminGetAll: (): Promise<any[]> =>
    unwrap<any[]>("/payments/orders/admin/all"),
  adminGetByStatus: (status: "PENDING" | "CONFIRMED" | "REJECTED"): Promise<any[]> =>
    unwrap<any[]>(`/payments/orders/admin?status=${status}`),
  adminGetByOrderId: (orderId: string): Promise<any> =>
    unwrap<any>(`/payments/orders/admin/order/${orderId}`),
  adminGetById: (paymentId: string): Promise<any> =>
    unwrap<any>(`/payments/orders/admin/${paymentId}`),
  adminConfirm: (orderId: string, adminNote?: string): Promise<void> => {
    const qs = adminNote ? `?adminNote=${encodeURIComponent(adminNote)}` : "";
    return unwrap<void>(`/payments/orders/admin/${orderId}/confirm${qs}`, { method: "POST" });
  },
  adminReject: (orderId: string, adminNote?: string): Promise<void> => {
    const qs = adminNote ? `?adminNote=${encodeURIComponent(adminNote)}` : "";
    return unwrap<void>(`/payments/orders/admin/${orderId}/reject${qs}`, { method: "POST" });
  },
};

// ─── Pre-orders ───────────────────────────────────────────────────────────────
export const preOrderApi = {
  getMy: () =>
    unwrap<any[]>("/pre-orders/my"),
  requestDelivery: (preOrderRecordId: string) =>
    unwrap<any>(`/pre-orders/${preOrderRecordId}/request-delivery`, { method: "POST" }),
  adminGetAll: () =>
    unwrap<any[]>("/pre-orders/seller/all"),
  adminGetByProduct: (productId: string) =>
    unwrap<any[]>(`/pre-orders/seller/product/${productId}`),
  adminGetByStatus: (status: string) =>
    unwrap<any[]>(`/pre-orders/seller/status/${status}`),
  adminConfirmPayment: (preOrderRecordId: string, adminNote?: string) =>
    unwrap<any>(`/pre-orders/seller/${preOrderRecordId}/confirm-payment`, {
      method: "POST",
      body: adminNote ? { adminNote } : {},
    }),
};

// ─── Product Listing Requests ─────────────────────────────────────────────────
export const productRequestApi = {
  initiatePayment: () =>
    unwrap<any>("/product-requests/initiate", { method: "POST" }),
  verifyPayment: (reference: string) =>
    unwrap<any>(`/product-requests/verify/${reference}`),
  getById: (productRequestId: string) =>
    unwrap<any>(`/product-requests/${productRequestId}`),
};

// ─── User Product Requests ────────────────────────────────────────────────────
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
export const chatApi = {
  startConversation: (productId: string) =>
    unwrap<any>("/chat/conversations", { method: "POST", body: { productId } }),
  deleteConversation: (conversationId: string) =>
    unwrap<void>(`/chat/conversations/${conversationId}`, { method: "DELETE" }),
  userSendMessage: (conversationId: string, content: string, productImageId?: number) =>
    unwrap<any>(`/chat/conversations/${conversationId}/messages/user`, {
      method: "POST",
      body: { content, ...(productImageId != null && { productImageId }) },
    }),
  sellerSendMessage: (conversationId: string, content: string, productImageId?: number) =>
    unwrap<any>(`/chat/conversations/${conversationId}/messages/seller`, {
      method: "POST",
      body: { content, ...(productImageId != null && { productImageId }) },
    }),
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
  getChatHistory: (conversationId: string) =>
    unwrap<any>(`/chat/conversations/${conversationId}/history`),
  getUserConversations: () =>
    unwrap<any[]>("/chat/user/conversations"),
  getUserConversationsUnread: () =>
    unwrap<any[]>("/chat/user/conversations?unreadOnly=true"),
  getSellerConversations: () =>
    unwrap<any[]>("/chat/seller/conversations"),
  getSellerConversationsUnread: () =>
    unwrap<any[]>("/chat/seller/conversations?unreadOnly=true"),
  getSellerInbox: () =>
    unwrap<any[]>("/chat/seller/inbox"),
  getUserUnreadCount: () =>
    unwrap<{ unreadCount: number }>("/chat/user/unread-count"),
  getSellerUnreadCount: () =>
    unwrap<{ unreadCount: number }>("/chat/seller/unread-count"),
  markAsRead: (conversationId: string, senderType: "USER" | "SELLER") =>
    unwrap<void>(
      `/chat/conversations/${conversationId}/read?senderType=${senderType}`,
      { method: "PATCH" }
    ),
};

// ─── Notifications ────────────────────────────────────────────────────────────
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
