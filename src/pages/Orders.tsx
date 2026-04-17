import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi, preOrderApi, paymentApi, deliveryApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import SkeletonList from "@/components/SkeletonList";
import { toast } from "sonner";
import {
  Package, MapPin, ChevronDown, ChevronUp, X, Clock,
  Truck, ExternalLink, Info, Upload, Phone, User, CheckCircle2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ActiveTab = "all" | "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "pre-orders";

const orderStatusColors: Record<string, string> = {
  DELIVERED:        "bg-emerald-100 text-emerald-700",
  CANCELLED:        "bg-red-100 text-red-700",
  SHIPPED:          "bg-indigo-100 text-indigo-700",
  CONFIRMED:        "bg-violet-100 text-violet-700",
  PENDING:          "bg-sky-100 text-sky-700",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-700",
  PAYMENT_FAILED:   "bg-red-100 text-red-600",
  DEPOSIT_PAID:     "bg-purple-100 text-purple-700",
};

const preOrderColors: Record<string, string> = {
  DEPOSIT_PAID:       "bg-purple-100 text-purple-700",
  NOTIFIED:           "bg-indigo-100 text-indigo-700",
  DELIVERY_REQUESTED: "bg-sky-100 text-sky-700",
  COMPLETED:          "bg-emerald-100 text-emerald-700",
  CANCELLED:          "bg-red-100 text-red-700",
};

const preOrderLabels: Record<string, string> = {
  DEPOSIT_PAID:       "Deposit paid — waiting for stock",
  NOTIFIED:           "Item available — request delivery",
  DELIVERY_REQUESTED: "Delivery requested — awaiting confirmation",
  COMPLETED:          "Order completed",
  CANCELLED:          "Cancelled",
};

// ── MoMo Payment Modal ────────────────────────────────────────────────────────
const MoMoPaymentModal = ({
  orderId,
  amount,
  onSuccess,
  onClose,
}: {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const [accountName, setAccountName]   = useState("");
  const [phoneNumber, setPhoneNumber]   = useState("");
  const [proofFile, setProofFile]       = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }
    setProofFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeFile = () => {
    setProofFile(null);
    setPreviewUrl(null);
    if (uploadRef.current) uploadRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!accountName.trim())  { toast.error("Enter your account name"); return; }
    if (!phoneNumber.trim())  { toast.error("Enter your phone number"); return; }
    if (!proofFile)           { toast.error("Upload your payment screenshot"); return; }

    setIsSubmitting(true);
    try {
      await paymentApi.submitOrderPayment(orderId, accountName.trim(), phoneNumber.trim(), proofFile);
      toast.success("Payment submitted! We'll confirm it shortly.");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message ?? "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-indigo-100 bg-indigo-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-indigo-900">Pay via Mobile Money</p>
        <button onClick={onClose} className="text-indigo-400 hover:text-indigo-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Amount + merchant number */}
      <div className="rounded-lg bg-indigo-100 border border-indigo-200 px-4 py-3 space-y-1">
        <p className="text-xs text-indigo-700 font-medium">Send exactly</p>
        <p className="text-2xl font-bold text-indigo-800">GHS {amount.toFixed(2)}</p>
        <p className="text-xs text-indigo-700">
          to MoMo number: <span className="font-mono font-semibold">0257765011</span>
        </p>
      </div>

      {/* Account name */}
      <div className="space-y-1">
        <label className="text-xs font-medium flex items-center gap-1.5 text-indigo-500">
          <User className="h-3 w-3" /> Account name *
        </label>
        <input
          type="text"
          value={accountName}
          onChange={e => setAccountName(e.target.value)}
          placeholder="Name on your MoMo account"
          className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-900 placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Phone number */}
      <div className="space-y-1">
        <label className="text-xs font-medium flex items-center gap-1.5 text-indigo-500">
          <Phone className="h-3 w-3" /> Phone number *
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          placeholder="e.g. 024 000 0000"
          className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-900 placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Screenshot upload */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-indigo-500">Payment screenshot *</label>
        {previewUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-indigo-200">
            <img src={previewUrl} alt="Payment proof" className="w-full max-h-48 object-contain bg-indigo-50" />
            <button
              onClick={removeFile}
              className="absolute top-2 right-2 rounded-full bg-white border border-indigo-200 p-1 hover:bg-red-500 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-2 left-2 rounded-full bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" /> Ready
            </div>
          </div>
        ) : (
          <button
            onClick={() => uploadRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-colors py-7 flex flex-col items-center gap-1.5 text-indigo-300 hover:text-indigo-500"
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs font-medium">Tap to upload screenshot</span>
          </button>
        )}
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {isSubmitting ? "Submitting…" : `Submit payment · GHS ${amount.toFixed(2)}`}
      </button>
    </div>
  );
};

// ── Pre-order Card ────────────────────────────────────────────────────────────
const PreOrderItem = ({
  record,
  onRequestDelivery,
}: {
  record: any;
  onRequestDelivery: (id: string) => void;
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const canRequestDelivery = record.status === "NOTIFIED";
  const totalAmount        = Number(record.totalAmount     ?? 0);
  const depositAmount      = Number(record.depositAmount   ?? 0);
  const remainingAmount    = Number(record.remainingAmount ?? 0);
  const depositPercent     = totalAmount > 0 ? Math.round((depositAmount / totalAmount) * 100) : 50;

  const handleDeliveryRequest = async () => {
    if (!window.confirm(
      `Confirm delivery request?\n\nYou will need to pay the remaining balance of GHS ${remainingAmount.toFixed(2)} to complete this order.`
    )) return;
    setIsRequesting(true);
    try { await onRequestDelivery(record.id); }
    finally { setIsRequesting(false); }
  };

  return (
    <div className="rounded-xl bg-white border border-purple-200 overflow-hidden">
      <div className="bg-purple-50 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-purple-700">Pre-order</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${preOrderColors[record.status] ?? "bg-indigo-100 text-indigo-600"}`}>
          {record.status?.replace(/_/g, " ")}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{record.productName}</p>
          <p className="text-xs text-slate-400 font-mono">
            Order #{(record.orderId ?? "").toString().slice(0, 8).toUpperCase()}
          </p>
          {record.createdAt && (
            <p className="text-xs text-slate-400 mt-0.5">
              Placed {new Date(record.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 space-y-2 text-sm">
          <p className="text-[11px] font-semibold text-purple-800 uppercase tracking-wide">Payment breakdown</p>
          <div className="flex justify-between text-purple-700">
            <span>Order total</span>
            <span className="font-semibold text-purple-900">GHS {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-purple-700">
            <span>Deposit paid ({depositPercent}%)</span>
            <span className="font-semibold text-emerald-700">− GHS {depositAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-purple-200 pt-2">
            <span className="font-semibold text-purple-800">Remaining balance</span>
            <span className="font-bold text-purple-900">GHS {remainingAmount.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{depositPercent}% paid</span>
            <span>{100 - depositPercent}% remaining</span>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${depositPercent}%` }} />
          </div>
        </div>

        {record.status === "DEPOSIT_PAID" && (
          <div className="rounded-lg bg-purple-50 border border-purple-200 px-3 py-2 text-xs text-purple-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {preOrderLabels.DEPOSIT_PAID}
          </div>
        )}
        {record.status === "NOTIFIED" && (
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 space-y-1">
            <p className="text-xs text-indigo-700 font-semibold flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Your item is now in stock!
            </p>
            <p className="text-xs text-indigo-600">
              Request delivery below to pay the remaining <strong>GHS {remainingAmount.toFixed(2)}</strong> and arrange shipping.
            </p>
          </div>
        )}
        {record.status === "DELIVERY_REQUESTED" && (
          <div className="rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-xs text-sky-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {preOrderLabels.DELIVERY_REQUESTED}
          </div>
        )}
        {record.status === "COMPLETED" && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
            ✓ {preOrderLabels.COMPLETED} — your item is on its way.
          </div>
        )}

        {record.notifiedAt && (
          <p className="text-xs text-slate-400">
            Notified: {new Date(record.notifiedAt).toLocaleDateString("en-GB")}
          </p>
        )}
        {record.deliveryRequestedAt && (
          <p className="text-xs text-slate-400">
            Delivery requested: {new Date(record.deliveryRequestedAt).toLocaleDateString("en-GB")}
          </p>
        )}
        {record.adminNote && (
          <p className="text-xs text-slate-400 italic">Note from seller: {record.adminNote}</p>
        )}

        {canRequestDelivery && (
          <button
            onClick={handleDeliveryRequest}
            disabled={isRequesting}
            className="w-full py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Truck className="h-4 w-4" />
            {isRequesting ? "Requesting…" : `Request delivery · pay GHS ${remainingAmount.toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Order Card ────────────────────────────────────────────────────────────────
const OrderItem = ({
  order,
  onCancel,
  onRefresh,
}: {
  order: any;
  onCancel: (id: string) => void;
  onRefresh: () => void;
}) => {
  const [isExpanded, setIsExpanded]           = useState(false);
  const [isCancelling, setIsCancelling]       = useState(false);
  const [showPayment, setShowPayment]         = useState(false);
  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false);
  const [deliveryAddr, setDeliveryAddr]       = useState("");
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);

  const orderId      = order.orderId;
  const status       = order.orderStatus ?? "PENDING";
  const total        = Number(order.total ?? 0);
  const address      = order.deliveryAddress ?? "";
  const createdAt    = order.createdAt ?? "";
  const items: any[] = order.orderItems ?? [];
  const canCancel: boolean = order.canCancel ?? false;

  const needsPayment       = status === "AWAITING_PAYMENT" || status === "PAYMENT_FAILED";
  const canRequestDelivery = status === "SHIPPED";

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setIsCancelling(true);
    try { await onCancel(orderId); }
    finally { setIsCancelling(false); }
  };

  const handleDeliverySubmit = async () => {
    if (!deliveryAddr.trim()) return;
    setIsDeliveryLoading(true);
    try {
      await deliveryApi.request(orderId, deliveryAddr.trim());
      setShowDeliveryForm(false);
      setDeliveryAddr("");
      onRefresh();
      toast.success("Delivery requested successfully!");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not request delivery.");
    } finally {
      setIsDeliveryLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-mono">
              #{orderId?.toString().slice(0, 8).toUpperCase()}
            </p>
            {formattedDate && (
              <p className="text-xs text-slate-400 mt-0.5">{formattedDate}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 border border-red-200 rounded-full px-2 py-0.5"
              >
                <X className="h-3 w-3" />
                {isCancelling ? "…" : "Cancel"}
              </button>
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusColors[status] ?? "bg-slate-100 text-slate-600"}`}>
              {status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Address */}
        {address && (
          <div className="flex items-start gap-1.5 text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{address}</span>
          </div>
        )}

        {/* Item thumbnails */}
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {items.slice(0, 3).map((item: any, i: number) => (
                <div
                  key={item.id ?? i}
                  className="h-10 w-10 rounded-lg border-2 border-white overflow-hidden bg-slate-50 shrink-0"
                  style={{ zIndex: 3 - i }}
                >
                  {item.primaryImageUrl ? (
                    <img src={item.primaryImageUrl} alt={item.productName ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Total + expand toggle */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-base text-slate-800">GHS {total.toFixed(2)}</span>
          {items.length > 0 && (
            <button
              onClick={() => setIsExpanded(p => !p)}
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 hover:underline"
            >
              {isExpanded ? "Hide" : "View"} items
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Payment status banners */}
        {status === "AWAITING_PAYMENT" && !showPayment && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Waiting for payment — send via MoMo and upload your screenshot below.
          </div>
        )}
        {status === "PAYMENT_FAILED" && !showPayment && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-center gap-1.5">
            <X className="h-3.5 w-3.5 shrink-0" />
            Payment was rejected. Please try again or contact support.
          </div>
        )}

        {/* Pay now CTA */}
        {needsPayment && !showPayment && (
          <button
            onClick={() => setShowPayment(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Pay via MoMo · GHS {total.toFixed(2)}
          </button>
        )}

        {/* Request delivery */}
        {canRequestDelivery && !showDeliveryForm && (
          <button
            onClick={() => setShowDeliveryForm(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-indigo-300 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors"
          >
            <Truck className="h-4 w-4" />
            Request delivery
          </button>
        )}
        {showDeliveryForm && (
          <div className="space-y-2">
            <input
              type="text"
              value={deliveryAddr}
              onChange={e => setDeliveryAddr(e.target.value)}
              placeholder="Enter delivery address…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeliverySubmit}
                disabled={isDeliveryLoading || !deliveryAddr.trim()}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {isDeliveryLoading ? "Requesting…" : "Confirm"}
              </button>
              <button
                onClick={() => { setShowDeliveryForm(false); setDeliveryAddr(""); }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-400 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MoMo payment form */}
      {showPayment && (
        <MoMoPaymentModal
          orderId={orderId}
          amount={total}
          onSuccess={() => {
            setShowPayment(false);
            toast.success("Payment submitted! Awaiting admin confirmation.");
          }}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* Expanded items list */}
      {isExpanded && items.length > 0 && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                {item.primaryImageUrl ? (
                  <img src={item.primaryImageUrl} alt={item.productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {item.productId ? (
                  <Link
                    to={`/products/${item.productId}`}
                    className="text-sm font-medium text-slate-800 hover:text-indigo-500 line-clamp-1 flex items-center gap-1"
                  >
                    {item.productName}
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.productName}</p>
                )}
                <p className="text-xs text-slate-400">
                  GHS {Number(item.unitPrice).toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-slate-800 shrink-0">GHS {Number(item.subTotal).toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getStatusCount = (orders: any[], status: string) =>
  orders.filter(o => o.orderStatus === status).length;

const TAB_LIST: { label: string; value: ActiveTab }[] = [
  { label: "All",        value: "all"        },
  { label: "Pending",    value: "PENDING"    },
  { label: "Confirmed",  value: "CONFIRMED"  },
  { label: "Shipped",    value: "SHIPPED"    },
  { label: "Delivered",  value: "DELIVERED"  },
  { label: "Cancelled",  value: "CANCELLED"  },
  { label: "Pre-orders", value: "pre-orders" },
];

// ── Main Orders Page ──────────────────────────────────────────────────────────
const OrdersPage = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders]       = useState<any[]>([]);
  const [preOrders, setPreOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const [orderList, preOrderList] = await Promise.all([
        orderApi.getMy(),
        preOrderApi.getMy(),
      ]);
      setOrders(Array.isArray(orderList) ? orderList : []);
      setPreOrders(Array.isArray(preOrderList) ? preOrderList : []);
    } catch (err: any) {
      setFetchError(err?.message ?? "Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [isAuthenticated]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await orderApi.cancelMy(orderId);
      toast.success("Order cancelled.");
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not cancel order.");
    }
  };

  const handlePreOrderDelivery = async (preOrderRecordId: string) => {
    try {
      await preOrderApi.requestDelivery(preOrderRecordId);
      toast.success("Delivery requested! The seller will confirm shortly.");
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not request delivery. Please try again.");
    }
  };

  const filteredOrders =
    activeTab === "all" || activeTab === "pre-orders"
      ? orders
      : orders.filter(o => o.orderStatus === activeTab);

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="skeleton-shimmer h-8 w-36 rounded-lg mb-4" />
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-shimmer h-8 w-20 rounded-full" />)}
        </div>
        <SkeletonList count={6} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="font-satoshi text-2xl font-bold mb-4 text-slate-800">My Orders</h1>

        {fetchError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{fetchError}</span>
            <button onClick={fetchOrders} className="text-xs font-semibold underline underline-offset-2 ml-4">Retry</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {TAB_LIST.map(tab => {
            const count =
              tab.value === "pre-orders"
                ? preOrders.length
                : tab.value !== "all"
                ? getStatusCount(orders, tab.value)
                : 0;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1 text-[10px] rounded-full px-1.5 ${
                    tab.value === "pre-orders"
                      ? "bg-purple-600 text-white"
                      : "bg-indigo-100 text-indigo-600"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pre-orders tab content */}
        {activeTab === "pre-orders" ? (
          preOrders.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Package className="h-12 w-12 mx-auto text-slate-300" />
              <p className="text-slate-400 text-sm">No pre-orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {preOrders.map(r => (
                <PreOrderItem key={r.id} record={r} onRequestDelivery={handlePreOrderDelivery} />
              ))}
            </div>
          )
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Package className="h-16 w-16 mx-auto text-slate-200" />
            <p className="text-slate-400">
              {activeTab === "all" ? "No orders yet" : `No ${activeTab.toLowerCase()} orders`}
            </p>
            {activeTab === "all" && (
              <Link to="/" className="text-sm text-indigo-500 hover:text-indigo-600 hover:underline">
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(o => (
              <OrderItem key={o.orderId} order={o} onCancel={handleCancelOrder} onRefresh={fetchOrders} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
