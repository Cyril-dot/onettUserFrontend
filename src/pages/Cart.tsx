import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowLeft,
  Upload, X, Clock, Info, CheckCircle2, Phone, User,
} from "lucide-react";
import { cartApi, orderApi, paymentApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import CartSkeleton from "@/components/CartSkeleton";
import { toast } from "sonner";

function normaliseCart(data: any) {
  if (!data) return data;
  return {
    ...data,
    cartTotal: Number(data.cartTotal ?? 0),
    discountedTotal: Number(data.discountedTotal ?? 0),
    items: Array.isArray(data.items)
      ? data.items.map((item: any) => {
          const rawQty = Number(item.quantity);
          const quantity = Number.isFinite(rawQty) && rawQty >= 1 ? Math.floor(rawQty) : 1;
          return {
            ...item,
            quantity,
            isDiscounted: item.isDiscounted ?? item.discounted ?? false,
            unitPrice: Number(item.unitPrice ?? 0),
            originalPrice: item.originalPrice != null ? Number(item.originalPrice) : undefined,
            subTotal: Number(item.subTotal ?? 0),
            stockStatus: item.stockStatus ?? "IN_STOCK",
          };
        })
      : [],
  };
}

function isPreOrderItem(item: any) {
  return item.stockStatus === "PRE_ORDER" || item.stockStatus === "COMING_SOON";
}
function cartHasPreOrder(items: any[]) {
  return items.some(isPreOrderItem);
}

type Step = "cart" | "address" | "payment" | "submitted";

const HIDDEN_ORDERS_KEY = "hidden_submitted_orders";
function getHiddenOrders(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_ORDERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}
function hideOrder(orderId: string) {
  try {
    const existing = getHiddenOrders();
    existing.add(orderId);
    localStorage.setItem(HIDDEN_ORDERS_KEY, JSON.stringify([...existing]));
  } catch {}
}

const Cart = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("cart");

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [initiating, setInitiating] = useState(false);

  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orderHidden, setOrderHidden] = useState(false);
  const handleDeleteOrder = () => {
    if (currentOrder?.orderId) hideOrder(String(currentOrder.orderId));
    setOrderHidden(true);
  };

  const initiatingRef = useRef(false);
  const submittingRef = useRef(false);

  const fetchCart = async () => {
    try {
      const data = await cartApi.get();
      setCart(normaliseCart(data));
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { navigate("/login"); return; }
    fetchCart();
  }, [isAuthenticated, isLoading]);

  const updateQty = async (cartItemId: string, qty: number) => {
    try {
      const updated = await cartApi.updateQuantity(cartItemId, qty);
      setCart(normaliseCart(updated));
    } catch { toast.error("Failed to update quantity"); }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      const updated = await cartApi.remove(cartItemId);
      setCart(normaliseCart(updated));
    } catch { toast.error("Failed to remove item"); }
  };

  const handleProceedToPayment = async () => {
    if (!deliveryAddress.trim()) { toast.error("Please enter a delivery address"); return; }
    if (initiatingRef.current) return;
    initiatingRef.current = true;
    setInitiating(true);
    try {
      const order = await orderApi.initiate({
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim() || undefined,
      });
      if (!order?.orderId) { toast.error("Failed to create order. Please try again."); return; }
      setCurrentOrder(order);
      setStep("payment");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create order.");
    } finally {
      setInitiating(false);
      initiatingRef.current = false;
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be smaller than 10 MB"); return; }
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const clearScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitPayment = async () => {
    if (!senderName.trim()) { toast.error("Enter your account name"); return; }
    if (!senderPhone.trim()) { toast.error("Enter your phone number"); return; }
    if (!screenshot) { toast.error("Upload your payment screenshot"); return; }
    if (!currentOrder?.orderId) { toast.error("No order found. Please restart checkout."); return; }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await paymentApi.submitOrderPayment(
        currentOrder.orderId,
        senderName.trim(),
        senderPhone.trim(),
        screenshot,
      );
      setStep("submitted");
    } catch (err: any) {
      toast.error(err?.message ?? "Payment submission failed. Please try again.");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (isLoading || loading) return <CartSkeleton />;

  const items: any[] = cart?.items ?? [];
  const cartTotal = Number(cart?.cartTotal ?? 0);
  const discountedTotal = Number(cart?.discountedTotal ?? 0);
  const totalItems = cart?.totalItems ?? 0;

  const displayTotal = discountedTotal > 0 && discountedTotal < cartTotal ? discountedTotal : cartTotal;
  const hasDiscounts = discountedTotal > 0 && discountedTotal < cartTotal;

  const isPreOrder = cartHasPreOrder(items);
  const depositAmount = isPreOrder ? Math.round((displayTotal / 2) * 100) / 100 : null;
  const remainingAmount = isPreOrder && depositAmount != null
    ? Math.round((displayTotal - depositAmount) * 100) / 100 : null;

  const chargeAmount = currentOrder?.chargeAmount != null
    ? Number(currentOrder.chargeAmount)
    : (isPreOrder && depositAmount != null ? depositAmount : displayTotal);

  return (
    <div className="crt-page-root">
      <Navbar />
      <div className="crt-page-container">

        {/* Back link */}
        {step === "cart" && (
          <Link to="/" className="crt-back-link">
            <ArrowLeft className="crt-back-icon" /> Continue Shopping
          </Link>
        )}
        {(step === "address" || step === "payment") && (
          <button onClick={() => setStep(step === "payment" ? "address" : "cart")} className="crt-back-link">
            <ArrowLeft className="crt-back-icon" /> Back
          </button>
        )}

        {/* ── STEP: CART ── */}
        {step === "cart" && (
          <>
            <h1 className="crt-page-title">Shopping Cart</h1>

            {items.length === 0 ? (
              <div className="crt-empty-state">
                <ShoppingBag className="crt-empty-icon" />
                <p className="crt-empty-text">Your cart is empty</p>
                <Link to="/" className="crt-empty-cta">Start Shopping</Link>
              </div>
            ) : (
              <div className="crt-cart-content">
                {/* Items */}
                <div className="crt-items-list">
                  {items.map((item: any) => {
                    const itemIsPreOrder = isPreOrderItem(item);
                    return (
                      <div
                        key={item.cartItemId}
                        className={`crt-item-card ${itemIsPreOrder ? "crt-item-card--preorder" : ""}`}
                      >
                        <div className="crt-item-image-wrap">
                          {item.primaryImageUrl ? (
                            <img
                              src={item.primaryImageUrl}
                              alt={item.productName}
                              className="crt-item-image"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="crt-item-image-fallback">
                              <ShoppingBag className="crt-item-fallback-icon" />
                            </div>
                          )}
                          {itemIsPreOrder && (
                            <div className="crt-item-preorder-tag">PRE-ORDER</div>
                          )}
                        </div>

                        <div className="crt-item-info">
                          <Link to={`/products/${item.productId}`} className="crt-item-name">
                            {item.productName}
                          </Link>
                          {item.brand && <p className="crt-item-brand">{item.brand}</p>}
                          <div className="crt-item-unit-price-row">
                            <p className="crt-item-unit-price">GHS {item.unitPrice.toFixed(2)} each</p>
                            {item.isDiscounted && item.originalPrice && (
                              <p className="crt-item-original-price">GHS {item.originalPrice.toFixed(2)}</p>
                            )}
                          </div>
                          <p className="crt-item-subtotal">GHS {item.subTotal.toFixed(2)}</p>
                          {itemIsPreOrder && (
                            <p className="crt-item-deposit-note">
                              <Clock className="crt-deposit-clock" />
                              Deposit due now: GHS {(item.subTotal / 2).toFixed(2)}
                            </p>
                          )}
                          <div className="crt-item-qty-row">
                            <div className="crt-qty-control">
                              <button
                                className="crt-qty-btn"
                                onClick={() => updateQty(item.cartItemId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="crt-qty-icon" />
                              </button>
                              <span className="crt-qty-value">{item.quantity}</span>
                              <button
                                className="crt-qty-btn"
                                onClick={() => updateQty(item.cartItemId, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus className="crt-qty-icon" />
                              </button>
                            </div>
                            <button
                              className="crt-remove-btn"
                              onClick={() => removeItem(item.cartItemId)}
                            >
                              <Trash2 className="crt-remove-icon" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pre-order info */}
                {isPreOrder && (
                  <div className="crt-preorder-banner">
                    <div className="crt-preorder-banner-title">
                      <Info className="crt-preorder-info-icon" />
                      Your cart contains a pre-order item
                    </div>
                    <p className="crt-preorder-banner-text">
                      Pre-order and coming-soon products require a <strong>50% deposit</strong> today.
                      The remaining balance is collected once your item is ready for delivery.
                    </p>
                  </div>
                )}

                {/* Order summary */}
                <div className="crt-summary-card">
                  <div className="crt-summary-row crt-summary-row--muted">
                    <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
                  </div>

                  {hasDiscounts && (
                    <>
                      <div className="crt-summary-row crt-summary-row--muted">
                        <span>Subtotal (before discounts)</span>
                        <span className="crt-summary-strikethrough">GHS {cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="crt-summary-row crt-summary-row--savings">
                        <span>You save</span>
                        <span>GHS {(cartTotal - discountedTotal).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="crt-summary-divider" />

                  <div className="crt-summary-row">
                    <span className="crt-summary-label-muted">Order total</span>
                    <div className="crt-summary-total-right">
                      <span className="crt-summary-total-value">GHS {displayTotal.toFixed(2)}</span>
                      {hasDiscounts && (
                        <p className="crt-summary-discount-applied">Discounts applied ✓</p>
                      )}
                    </div>
                  </div>

                  {isPreOrder && depositAmount != null && remainingAmount != null && (
                    <>
                      <div className="crt-preorder-breakdown">
                        <p className="crt-preorder-breakdown-heading">Payment breakdown</p>
                        <div className="crt-summary-row">
                          <span className="crt-preorder-deposit-label">Deposit due now (50%)</span>
                          <span className="crt-preorder-deposit-value">GHS {depositAmount.toFixed(2)}</span>
                        </div>
                        <div className="crt-summary-row crt-summary-row--muted" style={{ fontSize: 12 }}>
                          <span>Remaining balance (paid later)</span>
                          <span>GHS {remainingAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="crt-summary-row crt-summary-pay-today">
                        <span>You pay today</span>
                        <span className="crt-pay-today-amount">GHS {depositAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {!isPreOrder && (
                    <div className="crt-summary-row crt-summary-grand-total">
                      <span>Total</span>
                      <span>GHS {displayTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="crt-momo-info-pill">
                    <Phone className="crt-momo-pill-icon" />
                    Payment via Mobile Money — you'll upload your transfer screenshot at checkout.
                  </div>

                  <button
                    className="crt-checkout-btn"
                    onClick={() => setStep("address")}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── STEP: ADDRESS ── */}
        {step === "address" && (
          <div className="crt-step-address">
            <h1 className="crt-page-title">Delivery Details</h1>

            <div className="crt-address-card">
              <div className="crt-form-field">
                <label className="crt-form-label">Delivery address *</label>
                <input
                  placeholder="e.g. 14 Osu Badu Street, Accra"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  className="crt-form-input"
                />
              </div>
              <div className="crt-form-field">
                <label className="crt-form-label">
                  Notes <span className="crt-form-label-optional">(optional)</span>
                </label>
                <textarea
                  placeholder="Any special instructions for delivery…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="crt-form-textarea"
                />
              </div>
            </div>

            <div className="crt-mini-summary-card">
              <p className="crt-mini-summary-heading">Order summary</p>
              <div className="crt-summary-row">
                <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
                <span className="crt-mini-summary-total">GHS {displayTotal.toFixed(2)}</span>
              </div>
              {isPreOrder && depositAmount != null && (
                <div className="crt-summary-row crt-preorder-deposit-row">
                  <span>You pay today (50% deposit)</span>
                  <span className="crt-preorder-deposit-bold">GHS {depositAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <button
              className="crt-checkout-btn"
              onClick={handleProceedToPayment}
              disabled={initiating}
            >
              {initiating ? "Creating order…" : "Continue to Payment"}
            </button>
          </div>
        )}

        {/* ── STEP: PAYMENT ── */}
        {step === "payment" && currentOrder && (
          <div className="crt-step-payment">
            <h1 className="crt-page-title">Pay via Mobile Money</h1>

            {/* Amount due */}
            <div className={`crt-amount-due-card ${isPreOrder ? "crt-amount-due-card--preorder" : "crt-amount-due-card--regular"}`}>
              <p className="crt-amount-due-label">
                {isPreOrder ? "Deposit due now" : "Amount due"}
              </p>
              <p className={`crt-amount-due-value ${isPreOrder ? "crt-amount-due-value--preorder" : "crt-amount-due-value--regular"}`}>
                GHS {chargeAmount.toFixed(2)}
              </p>
              {isPreOrder && remainingAmount != null && (
                <p className="crt-amount-remaining-note">
                  Remaining balance of GHS {remainingAmount.toFixed(2)} will be collected when your item is ready.
                </p>
              )}
            </div>

            {/* MoMo instructions */}
            <div className="crt-momo-instructions-card">
              <p className="crt-momo-instructions-title">How to pay</p>
              <ol className="crt-momo-steps">
                <li>Send <strong>GHS {chargeAmount.toFixed(2)}</strong> via MoMo to our merchant number</li>
                <li>Take a screenshot of the transfer confirmation</li>
                <li>Fill in your sender details below and upload the screenshot</li>
              </ol>
              <div className="crt-momo-number">MoMo: 055 XXX XXXX</div>
            </div>

            {/* Sender details */}
            <div className="crt-sender-card">
              <p className="crt-sender-card-title">Your MoMo details</p>

              <div className="crt-form-field">
                <label className="crt-form-label crt-form-label--icon">
                  <User className="crt-form-label-icon" /> Account name *
                </label>
                <input
                  placeholder="Name on your MoMo account"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="crt-form-input"
                />
              </div>

              <div className="crt-form-field">
                <label className="crt-form-label crt-form-label--icon">
                  <Phone className="crt-form-label-icon" /> Phone number *
                </label>
                <input
                  placeholder="e.g. 024 000 0000"
                  value={senderPhone}
                  onChange={e => setSenderPhone(e.target.value)}
                  type="tel"
                  className="crt-form-input"
                />
              </div>

              <div className="crt-form-field">
                <label className="crt-form-label">Payment screenshot *</label>

                {screenshotPreview ? (
                  <div className="crt-screenshot-preview-wrap">
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot preview"
                      className="crt-screenshot-preview-img"
                    />
                    <button onClick={clearScreenshot} className="crt-screenshot-clear-btn">
                      <X className="crt-screenshot-clear-icon" />
                    </button>
                    <div className="crt-screenshot-ready-badge">
                      <CheckCircle2 className="crt-screenshot-ready-icon" /> Screenshot ready
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="crt-screenshot-upload-area"
                  >
                    <Upload className="crt-upload-icon" />
                    <span className="crt-upload-label">Tap to upload screenshot</span>
                    <span className="crt-upload-hint">JPG, PNG up to 10 MB</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="crt-hidden-file-input"
                  onChange={handleScreenshotChange}
                />
              </div>
            </div>

            <button
              className={`crt-submit-payment-btn ${isPreOrder ? "crt-submit-payment-btn--preorder" : ""}`}
              onClick={handleSubmitPayment}
              disabled={submitting}
            >
              {submitting ? "Submitting payment…" : `Submit payment · GHS ${chargeAmount.toFixed(2)}`}
            </button>

            <p className="crt-payment-disclaimer">
              Your payment will be confirmed by our team within a few hours. You'll receive a notification once confirmed.
            </p>
          </div>
        )}

        {/* ── STEP: SUBMITTED ── */}
        {step === "submitted" && (
          <div
            style={{ display: orderHidden ? "none" : undefined }}
            className="crt-submitted-state"
          >
            <div className="crt-submitted-icon-wrap">
              <CheckCircle2 className="crt-submitted-icon" />
            </div>
            <div className="crt-submitted-message">
              <h1 className="crt-submitted-title">Payment submitted!</h1>
              <p className="crt-submitted-desc">
                We've received your payment screenshot and will confirm your order within a few hours.
                You'll get a notification once it's approved.
              </p>
            </div>
            <div className="crt-submitted-details">
              <p className="crt-submitted-detail-row">
                <span className="crt-submitted-detail-label">Order ID:</span>
                <span className="crt-submitted-order-id">{currentOrder?.orderId?.toString().slice(0, 8).toUpperCase()}</span>
              </p>
              <p className="crt-submitted-detail-row">
                <span className="crt-submitted-detail-label">Amount:</span>
                <span className="crt-submitted-detail-value">GHS {chargeAmount.toFixed(2)}</span>
              </p>
              {isPreOrder && (
                <p className="crt-submitted-preorder-note">
                  This is a pre-order deposit. The remaining balance will be requested when your item is available.
                </p>
              )}
            </div>
            <Link to="/orders" className="crt-view-orders-btn">View my orders</Link>
            <Link to="/" className="crt-continue-shopping-link">Continue shopping</Link>
            <button onClick={handleDeleteOrder} className="crt-delete-order-btn">
              <Trash2 className="crt-delete-order-icon" />
              Delete order confirmation
            </button>
          </div>
        )}
      </div>

      <style>{`
        .crt-page-root {
          min-height: 100vh;
          background: #ffffff;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .crt-page-container {
          max-width: 672px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .crt-back-link {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 14px; color: #9ca3af; text-decoration: none;
          margin-bottom: 24px;
          background: none; border: none; cursor: pointer;
          transition: color 0.15s;
        }
        .crt-back-link:hover { color: #111827; }
        .crt-back-icon { width: 16px; height: 16px; }
        .crt-page-title {
          font-size: clamp(22px, 4vw, 26px);
          font-weight: 800; color: #111827; margin: 0 0 24px;
        }

        /* Cart items */
        .crt-cart-content { display: flex; flex-direction: column; gap: 24px; }
        .crt-items-list { display: flex; flex-direction: column; gap: 12px; }
        .crt-item-card {
          display: flex; gap: 16px;
          border-radius: 16px;
          background: #ffffff;
          border: 1.5px solid #f3f4f6;
          padding: 16px;
          transition: border-color 0.15s;
        }
        .crt-item-card--preorder { border-color: #ddd6fe; }
        .crt-item-image-wrap {
          position: relative;
          width: 80px; height: 80px;
          flex-shrink: 0;
          border-radius: 12px;
          overflow: hidden;
          background: #f9fafb;
          border: 1.5px solid #f3f4f6;
        }
        .crt-item-image { width: 100%; height: 100%; object-fit: cover; }
        .crt-item-image-fallback {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .crt-item-fallback-icon { width: 28px; height: 28px; color: #d1d5db; }
        .crt-item-preorder-tag {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(124,58,237,0.9); color: #fff;
          font-size: 9px; font-weight: 800;
          text-align: center; padding: 2px 0;
          letter-spacing: 0.05em;
        }
        .crt-item-info { flex: 1; min-width: 0; }
        .crt-item-name {
          font-size: 14px; font-weight: 700; color: #111827;
          text-decoration: none; display: block;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 0.15s;
        }
        .crt-item-name:hover { color: #f97316; }
        .crt-item-brand { font-size: 12px; color: #9ca3af; margin: 2px 0 0; }
        .crt-item-unit-price-row { display: flex; align-items: center; gap: 6px; margin: 2px 0 0; }
        .crt-item-unit-price { font-size: 12px; font-weight: 600; color: #f97316; margin: 0; }
        .crt-item-original-price { font-size: 11px; color: #9ca3af; text-decoration: line-through; margin: 0; }
        .crt-item-subtotal { font-size: 14px; font-weight: 800; color: #111827; margin: 4px 0 0; }
        .crt-item-deposit-note {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: #7c3aed; margin: 4px 0 0;
        }
        .crt-deposit-clock { width: 12px; height: 12px; flex-shrink: 0; }
        .crt-item-qty-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
        .crt-qty-control {
          display: flex; align-items: center;
          border: 1.5px solid #e5e7eb; border-radius: 10px; overflow: hidden;
        }
        .crt-qty-btn {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          color: #374151; transition: background 0.15s;
        }
        .crt-qty-btn:hover:not(:disabled) { background: #f9fafb; }
        .crt-qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .crt-qty-icon { width: 12px; height: 12px; }
        .crt-qty-value { width: 28px; text-align: center; font-size: 12px; font-weight: 700; color: #111827; }
        .crt-remove-btn {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          color: #ef4444; border-radius: 8px;
          transition: background 0.15s;
        }
        .crt-remove-btn:hover { background: rgba(239,68,68,0.08); }
        .crt-remove-icon { width: 14px; height: 14px; }

        /* Pre-order banner */
        .crt-preorder-banner {
          border-radius: 14px;
          background: #f5f3ff;
          border: 1.5px solid #ddd6fe;
          padding: 16px;
        }
        .crt-preorder-banner-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: #5b21b6; margin-bottom: 4px;
        }
        .crt-preorder-info-icon { width: 16px; height: 16px; flex-shrink: 0; }
        .crt-preorder-banner-text {
          font-size: 13px; color: #6d28d9; line-height: 1.5; margin: 0;
        }

        /* Summary card */
        .crt-summary-card {
          border-radius: 16px;
          background: #fff;
          border: 1.5px solid #f3f4f6;
          padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .crt-summary-row {
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: 14px; color: #374151;
        }
        .crt-summary-row--muted { color: #9ca3af; }
        .crt-summary-row--savings { color: #16a34a; font-weight: 600; }
        .crt-summary-strikethrough { text-decoration: line-through; }
        .crt-summary-divider { height: 1px; background: #f3f4f6; }
        .crt-summary-label-muted { color: #9ca3af; }
        .crt-summary-total-right { text-align: right; }
        .crt-summary-total-value { font-weight: 700; color: #111827; }
        .crt-summary-discount-applied { font-size: 11px; color: #16a34a; margin: 2px 0 0; }
        .crt-preorder-breakdown {
          border-radius: 12px;
          background: #f5f3ff; border: 1.5px solid #ddd6fe;
          padding: 12px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .crt-preorder-breakdown-heading {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #5b21b6; margin: 0;
        }
        .crt-preorder-deposit-label { color: #6d28d9; font-size: 14px; }
        .crt-preorder-deposit-value { color: #4c1d95; font-weight: 800; font-size: 14px; }
        .crt-summary-pay-today { font-size: 18px; font-weight: 800; padding-top: 4px; }
        .crt-pay-today-amount { color: #7c3aed; }
        .crt-summary-grand-total {
          font-size: 18px; font-weight: 800;
          border-top: 1.5px solid #f3f4f6;
          padding-top: 12px; color: #111827;
        }
        .crt-momo-info-pill {
          display: flex; align-items: center; gap: 8px;
          background: #f9fafb; border-radius: 10px;
          padding: 10px 12px;
          font-size: 12px; color: #6b7280;
        }
        .crt-momo-pill-icon { width: 14px; height: 14px; flex-shrink: 0; color: #9ca3af; }

        /* Empty state */
        .crt-empty-state {
          display: flex; flex-direction: column; align-items: center;
          padding: 64px 0; gap: 16px;
        }
        .crt-empty-icon { width: 64px; height: 64px; color: #d1d5db; }
        .crt-empty-text { font-size: 16px; color: #9ca3af; margin: 0; }
        .crt-empty-cta {
          display: inline-block;
          background: #f97316; color: #fff;
          font-size: 14px; font-weight: 700;
          padding: 10px 24px; border-radius: 12px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .crt-empty-cta:hover { background: #c2410c; }

        /* Shared checkout button */
        .crt-checkout-btn {
          width: 100%; height: 48px;
          border-radius: 14px;
          background: #f97316; color: #ffffff;
          border: none; font-size: 16px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
          box-shadow: 0 4px 16px rgba(249,115,22,0.3);
        }
        .crt-checkout-btn:hover:not(:disabled) { background: #c2410c; }
        .crt-checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Address step */
        .crt-step-address { display: flex; flex-direction: column; gap: 20px; }
        .crt-address-card {
          border-radius: 16px; background: #fff;
          border: 1.5px solid #f3f4f6; padding: 20px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .crt-form-field { display: flex; flex-direction: column; gap: 6px; }
        .crt-form-label {
          font-size: 14px; font-weight: 600; color: #374151;
          display: flex; align-items: center; gap: 6px;
        }
        .crt-form-label--icon { display: flex; align-items: center; gap: 6px; }
        .crt-form-label-icon { width: 14px; height: 14px; color: #9ca3af; }
        .crt-form-label-optional { font-weight: 400; color: #9ca3af; }
        .crt-form-input {
          height: 44px; padding: 0 14px;
          border-radius: 12px; border: 1.5px solid #e5e7eb;
          font-size: 14px; color: #111827; background: #fff;
          outline: none; transition: border-color 0.15s; width: 100%;
          box-sizing: border-box;
        }
        .crt-form-input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
        .crt-form-textarea {
          padding: 12px 14px;
          border-radius: 12px; border: 1.5px solid #e5e7eb;
          font-size: 14px; color: #111827; background: #fff;
          outline: none; transition: border-color 0.15s;
          resize: vertical; font-family: inherit; width: 100%;
          box-sizing: border-box;
        }
        .crt-form-textarea:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }

        /* Mini summary */
        .crt-mini-summary-card {
          border-radius: 14px; background: #fff;
          border: 1.5px solid #f3f4f6; padding: 16px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .crt-mini-summary-heading { font-size: 13px; font-weight: 700; color: #9ca3af; margin: 0; }
        .crt-mini-summary-total { font-weight: 600; color: #111827; }
        .crt-preorder-deposit-row { color: #7c3aed; font-size: 14px; }
        .crt-preorder-deposit-bold { font-weight: 800; }

        /* Payment step */
        .crt-step-payment { display: flex; flex-direction: column; gap: 20px; }
        .crt-amount-due-card {
          border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 4px;
        }
        .crt-amount-due-card--regular {
          background: rgba(249,115,22,0.06); border: 1.5px solid rgba(249,115,22,0.25);
        }
        .crt-amount-due-card--preorder {
          background: #f5f3ff; border: 1.5px solid #ddd6fe;
        }
        .crt-amount-due-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin: 0;
        }
        .crt-amount-due-value {
          font-size: clamp(28px, 5vw, 36px); font-weight: 800; margin: 0;
        }
        .crt-amount-due-value--regular { color: #c2410c; }
        .crt-amount-due-value--preorder { color: #4c1d95; }
        .crt-amount-remaining-note { font-size: 12px; color: #7c3aed; margin: 0; }

        .crt-momo-instructions-card {
          border-radius: 16px; background: #fff;
          border: 1.5px solid #f3f4f6; padding: 20px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .crt-momo-instructions-title { font-size: 14px; font-weight: 700; color: #111827; margin: 0; }
        .crt-momo-steps {
          font-size: 14px; color: #6b7280; margin: 0; padding-left: 20px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .crt-momo-number {
          background: #f9fafb; border-radius: 10px;
          padding: 12px 16px;
          font-family: 'Courier New', monospace;
          font-size: 14px; font-weight: 700;
          text-align: center; letter-spacing: 0.15em;
          color: #111827;
        }

        .crt-sender-card {
          border-radius: 16px; background: #fff;
          border: 1.5px solid #f3f4f6; padding: 20px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .crt-sender-card-title { font-size: 14px; font-weight: 700; color: #111827; margin: 0; }

        /* Screenshot */
        .crt-screenshot-preview-wrap {
          position: relative; border-radius: 14px; overflow: hidden;
          border: 1.5px solid #f3f4f6;
        }
        .crt-screenshot-preview-img {
          width: 100%; max-height: 240px; object-fit: contain;
          background: #f9fafb; display: block;
        }
        .crt-screenshot-clear-btn {
          position: absolute; top: 8px; right: 8px;
          border-radius: 50%; background: rgba(255,255,255,0.9);
          border: 1.5px solid #e5e7eb; padding: 4px;
          cursor: pointer; display: flex; align-items: center;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          color: #374151;
        }
        .crt-screenshot-clear-btn:hover {
          background: #ef4444; color: #fff; border-color: #ef4444;
        }
        .crt-screenshot-clear-icon { width: 16px; height: 16px; }
        .crt-screenshot-ready-badge {
          position: absolute; bottom: 8px; left: 8px;
          display: flex; align-items: center; gap: 4px;
          background: #16a34a; color: #fff;
          font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 9999px;
        }
        .crt-screenshot-ready-icon { width: 12px; height: 12px; }
        .crt-screenshot-upload-area {
          width: 100%; border-radius: 14px;
          border: 2px dashed #e5e7eb;
          background: none; cursor: pointer;
          padding: 40px 0;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          color: #9ca3af; transition: border-color 0.15s, color 0.15s;
        }
        .crt-screenshot-upload-area:hover { border-color: rgba(249,115,22,0.5); color: #f97316; }
        .crt-upload-icon { width: 32px; height: 32px; }
        .crt-upload-label { font-size: 14px; font-weight: 600; }
        .crt-upload-hint { font-size: 12px; }
        .crt-hidden-file-input { display: none; }

        .crt-submit-payment-btn {
          width: 100%; height: 48px;
          border-radius: 14px;
          background: #f97316; color: #fff;
          border: none; font-size: 16px; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(249,115,22,0.3);
          transition: background 0.15s;
        }
        .crt-submit-payment-btn:hover:not(:disabled) { background: #c2410c; }
        .crt-submit-payment-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .crt-submit-payment-btn--preorder {
          background: #7c3aed;
          box-shadow: 0 4px 16px rgba(124,58,237,0.3);
        }
        .crt-submit-payment-btn--preorder:hover:not(:disabled) { background: #5b21b6; }
        .crt-payment-disclaimer {
          font-size: 12px; text-align: center; color: #9ca3af; margin: 0;
        }

        /* Submitted step */
        .crt-submitted-state {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 64px 0; gap: 20px;
        }
        .crt-submitted-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: rgba(22,163,74,0.1);
          display: flex; align-items: center; justify-content: center;
        }
        .crt-submitted-icon { width: 40px; height: 40px; color: #16a34a; }
        .crt-submitted-message { display: flex; flex-direction: column; gap: 8px; }
        .crt-submitted-title {
          font-size: clamp(22px, 4vw, 26px); font-weight: 800; color: #111827; margin: 0;
        }
        .crt-submitted-desc {
          font-size: 14px; color: #6b7280; max-width: 300px; margin: 0;
        }
        .crt-submitted-details {
          border-radius: 14px; background: #f9fafb;
          padding: 16px; width: 100%; text-align: left;
          display: flex; flex-direction: column; gap: 8px;
        }
        .crt-submitted-detail-row { font-size: 14px; color: #374151; margin: 0; }
        .crt-submitted-detail-label { color: #9ca3af; margin-right: 4px; }
        .crt-submitted-order-id {
          font-family: 'Courier New', monospace;
          font-weight: 700; color: #111827;
        }
        .crt-submitted-detail-value { font-weight: 700; color: #111827; }
        .crt-submitted-preorder-note { font-size: 12px; color: #7c3aed; margin: 0; }
        .crt-view-orders-btn {
          display: inline-flex; align-items: center;
          background: #fff; border: 1.5px solid #e5e7eb;
          color: #374151; font-size: 14px; font-weight: 600;
          padding: 10px 24px; border-radius: 12px;
          text-decoration: none; transition: border-color 0.15s;
        }
        .crt-view-orders-btn:hover { border-color: #f97316; color: #f97316; }
        .crt-continue-shopping-link {
          font-size: 14px; color: #f97316; text-decoration: none;
        }
        .crt-continue-shopping-link:hover { text-decoration: underline; }
        .crt-delete-order-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; color: #9ca3af;
          background: none; border: none; cursor: pointer;
          transition: color 0.15s;
        }
        .crt-delete-order-btn:hover { color: #ef4444; }
        .crt-delete-order-icon { width: 14px; height: 14px; }
      `}</style>
    </div>
  );
};

export default Cart;
