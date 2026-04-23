import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowLeft,
  Upload, X, Clock, Info, CheckCircle2, Phone, User, Truck,
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

type CheckoutStep = "cart" | "address" | "payment" | "submitted";

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

const FREE_DELIVERY_AREAS = [
  "Ashaiman", "Spintex", "Tema", "East Legon", "Madina",
  "Adenta", "Lashibi", "Community 25", "Sakumono",
];

const CartPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [initiating, setInitiating] = useState(false);

  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orderHidden, setOrderHidden] = useState(false);
  const handleHideOrder = () => {
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
        notes: orderNotes.trim() || undefined,
      });
      if (!order?.orderId) { toast.error("Failed to create order. Please try again."); return; }
      setCurrentOrder(order);
      setCheckoutStep("payment");
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
    setPaymentScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const clearScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitPayment = async () => {
    if (!payerName.trim()) { toast.error("Enter your account name"); return; }
    if (!payerPhone.trim()) { toast.error("Enter your phone number"); return; }
    if (!paymentScreenshot) { toast.error("Upload your payment screenshot"); return; }
    if (!currentOrder?.orderId) { toast.error("No order found. Please restart checkout."); return; }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await paymentApi.submitOrderPayment(
        currentOrder.orderId,
        payerName.trim(),
        payerPhone.trim(),
        paymentScreenshot,
      );
      setCheckoutStep("submitted");
    } catch (err: any) {
      toast.error(err?.message ?? "Payment submission failed. Please try again.");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (isLoading || loading) return <CartSkeleton />;

  const cartItems: any[] = cart?.items ?? [];
  const cartTotal = Number(cart?.cartTotal ?? 0);
  const discountedTotal = Number(cart?.discountedTotal ?? 0);
  const totalItems = cart?.totalItems ?? 0;

  const displayTotal = discountedTotal > 0 && discountedTotal < cartTotal ? discountedTotal : cartTotal;
  const hasDiscounts = discountedTotal > 0 && discountedTotal < cartTotal;

  const isPreOrder = cartHasPreOrder(cartItems);
  const depositAmount = isPreOrder ? Math.round((displayTotal / 2) * 100) / 100 : null;
  const remainingAmount = isPreOrder && depositAmount != null
    ? Math.round((displayTotal - depositAmount) * 100) / 100 : null;

  const chargeAmount = currentOrder?.chargeAmount != null
    ? Number(currentOrder.chargeAmount)
    : (isPreOrder && depositAmount != null ? depositAmount : displayTotal);

  const qualifiesForFreeDelivery = displayTotal >= 250;

  return (
    <div className="cart-page">
      <Navbar />
      <div className="cart-page__container">

        {/* Back nav */}
        {checkoutStep === "cart" && (
          <Link to="/" className="cart-page__back-link">
            <ArrowLeft className="cart-page__back-icon" /> Continue Shopping
          </Link>
        )}
        {(checkoutStep === "address" || checkoutStep === "payment") && (
          <button
            onClick={() => setCheckoutStep(checkoutStep === "payment" ? "address" : "cart")}
            className="cart-page__back-link"
          >
            <ArrowLeft className="cart-page__back-icon" /> Back
          </button>
        )}

        {/* ── STEP: CART ── */}
        {checkoutStep === "cart" && (
          <>
            <h1 className="cart-page__title">Shopping Cart</h1>

            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <ShoppingBag className="cart-empty-state__icon" />
                <p className="cart-empty-state__text">Your cart is empty</p>
                <Link to="/" className="cart-empty-state__cta">Start Shopping</Link>
              </div>
            ) : (
              <div className="cart-content">
                {/* Items */}
                <div className="cart-items">
                  {cartItems.map((item: any) => {
                    const itemIsPreOrder = isPreOrderItem(item);
                    return (
                      <div
                        key={item.cartItemId}
                        className={`cart-item ${itemIsPreOrder ? "cart-item--preorder" : ""}`}
                      >
                        <div className="cart-item__img-wrap">
                          {item.primaryImageUrl ? (
                            <img
                              src={item.primaryImageUrl}
                              alt={item.productName}
                              className="cart-item__img"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="cart-item__img-fallback">
                              <ShoppingBag className="cart-item__img-fallback-icon" />
                            </div>
                          )}
                          {itemIsPreOrder && (
                            <div className="cart-item__preorder-tag">PRE-ORDER</div>
                          )}
                        </div>

                        <div className="cart-item__info">
                          <Link to={`/products/${item.productId}`} className="cart-item__name">
                            {item.productName}
                          </Link>
                          {item.brand && <p className="cart-item__brand">{item.brand}</p>}
                          <div className="cart-item__price-row">
                            <p className="cart-item__unit-price">GHS {item.unitPrice.toFixed(2)} each</p>
                            {item.isDiscounted && item.originalPrice && (
                              <p className="cart-item__original-price">GHS {item.originalPrice.toFixed(2)}</p>
                            )}
                          </div>
                          <p className="cart-item__subtotal">GHS {item.subTotal.toFixed(2)}</p>
                          {itemIsPreOrder && (
                            <p className="cart-item__deposit-note">
                              <Clock className="cart-item__deposit-clock" />
                              Deposit due now: GHS {(item.subTotal / 2).toFixed(2)}
                            </p>
                          )}
                          <div className="cart-item__qty-row">
                            <div className="cart-qty-control">
                              <button
                                className="cart-qty-control__btn"
                                onClick={() => updateQty(item.cartItemId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="cart-qty-control__icon" />
                              </button>
                              <span className="cart-qty-control__value">{item.quantity}</span>
                              <button
                                className="cart-qty-control__btn"
                                onClick={() => updateQty(item.cartItemId, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus className="cart-qty-control__icon" />
                              </button>
                            </div>
                            <button
                              className="cart-item__remove-btn"
                              onClick={() => removeItem(item.cartItemId)}
                            >
                              <Trash2 className="cart-item__remove-icon" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pre-order banner */}
                {isPreOrder && (
                  <div className="cart-preorder-banner">
                    <div className="cart-preorder-banner__title">
                      <Info className="cart-preorder-banner__icon" />
                      Your cart contains a pre-order item
                    </div>
                    <p className="cart-preorder-banner__text">
                      Pre-order and coming-soon products require a <strong>50% deposit</strong> today.
                      The remaining balance is collected once your item is ready for delivery.
                    </p>
                  </div>
                )}

                {/* Order summary */}
                <div className="cart-summary">
                  <div className="cart-summary__row cart-summary__row--muted">
                    <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
                  </div>

                  {hasDiscounts && (
                    <>
                      <div className="cart-summary__row cart-summary__row--muted">
                        <span>Subtotal (before discounts)</span>
                        <span className="cart-summary__strikethrough">GHS {cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="cart-summary__row cart-summary__row--savings">
                        <span>You save</span>
                        <span>GHS {(cartTotal - discountedTotal).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="cart-summary__divider" />

                  <div className="cart-summary__row">
                    <span className="cart-summary__label-muted">Order total</span>
                    <div className="cart-summary__total-right">
                      <span className="cart-summary__total-value">GHS {displayTotal.toFixed(2)}</span>
                      {hasDiscounts && (
                        <p className="cart-summary__discount-badge">Discounts applied ✓</p>
                      )}
                    </div>
                  </div>

                  {isPreOrder && depositAmount != null && remainingAmount != null && (
                    <>
                      <div className="cart-preorder-breakdown">
                        <p className="cart-preorder-breakdown__heading">Payment breakdown</p>
                        <div className="cart-summary__row">
                          <span className="cart-preorder-breakdown__deposit-label">Deposit due now (50%)</span>
                          <span className="cart-preorder-breakdown__deposit-value">GHS {depositAmount.toFixed(2)}</span>
                        </div>
                        <div className="cart-summary__row cart-summary__row--muted" style={{ fontSize: 12 }}>
                          <span>Remaining balance (paid later)</span>
                          <span>GHS {remainingAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="cart-summary__row cart-summary__row--pay-today">
                        <span>You pay today</span>
                        <span className="cart-summary__pay-today-amount">GHS {depositAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {!isPreOrder && (
                    <div className="cart-summary__row cart-summary__row--grand-total">
                      <span>Total</span>
                      <span>GHS {displayTotal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Free delivery nudge on cart page */}
                  {qualifiesForFreeDelivery ? (
                    <div className="cart-free-delivery-banner cart-free-delivery-banner--earned">
                      <Truck className="cart-free-delivery-banner__icon" />
                      <div>
                        <p className="cart-free-delivery-banner__title">You've unlocked free delivery! 🎉</p>
                        <p className="cart-free-delivery-banner__desc">
                          Orders above GHS 250 get free delivery to Ashaiman, Spintex, Tema, East Legon, Madina, Adenta, Lashibi, Sakumono &amp; more.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="cart-free-delivery-banner cart-free-delivery-banner--nudge">
                      <Truck className="cart-free-delivery-banner__icon" />
                      <div>
                        <p className="cart-free-delivery-banner__title">
                          Add GHS {(250 - displayTotal).toFixed(2)} more for free delivery
                        </p>
                        <p className="cart-free-delivery-banner__desc">
                          Spend GHS 250+ to get free delivery to Ashaiman, Spintex, Tema, East Legon, Madina &amp; other Accra areas.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="cart-momo-pill">
                    <Phone className="cart-momo-pill__icon" />
                    Payment via Mobile Money — you'll upload your transfer screenshot at checkout.
                  </div>

                  <button className="cart-checkout-btn" onClick={() => setCheckoutStep("address")}>
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── STEP: ADDRESS ── */}
        {checkoutStep === "address" && (
          <div className="cart-address-step">
            <h1 className="cart-page__title">Delivery Details</h1>

            <div className="cart-address-card">
              <div className="cart-form-field">
                <label className="cart-form-label">Delivery address *</label>
                <input
                  placeholder="e.g. 14 Osu Badu Street, Accra"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  className="cart-form-input"
                />
              </div>
              <div className="cart-form-field">
                <label className="cart-form-label">
                  Notes <span className="cart-form-label__optional">(optional)</span>
                </label>
                <textarea
                  placeholder="Any special instructions for delivery…"
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  rows={3}
                  className="cart-form-textarea"
                />
              </div>
            </div>

            {/* Free delivery notice on address step */}
            {qualifiesForFreeDelivery && (
              <div className="cart-free-delivery-banner cart-free-delivery-banner--earned">
                <Truck className="cart-free-delivery-banner__icon" />
                <div>
                  <p className="cart-free-delivery-banner__title">Free delivery on this order! 🎉</p>
                  <p className="cart-free-delivery-banner__desc">
                    Your order qualifies for free delivery to Ashaiman, Spintex, Tema, East Legon, Madina, Adenta, Lashibi, Community 25, Sakumono &amp; selected Accra areas.
                  </p>
                </div>
              </div>
            )}

            <div className="cart-mini-summary">
              <p className="cart-mini-summary__heading">Order summary</p>
              <div className="cart-summary__row">
                <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
                <span className="cart-mini-summary__total">GHS {displayTotal.toFixed(2)}</span>
              </div>
              {isPreOrder && depositAmount != null && (
                <div className="cart-summary__row cart-mini-summary__deposit-row">
                  <span>You pay today (50% deposit)</span>
                  <span className="cart-mini-summary__deposit-value">GHS {depositAmount.toFixed(2)}</span>
                </div>
              )}
              {qualifiesForFreeDelivery && (
                <div className="cart-summary__row cart-mini-summary__free-delivery-row">
                  <span>Delivery</span>
                  <span className="cart-mini-summary__free-delivery-value">FREE ✓</span>
                </div>
              )}
            </div>

            <button
              className="cart-checkout-btn"
              onClick={handleProceedToPayment}
              disabled={initiating}
            >
              {initiating ? "Creating order…" : "Continue to Payment"}
            </button>
          </div>
        )}

        {/* ── STEP: PAYMENT ── */}
        {checkoutStep === "payment" && currentOrder && (
          <div className="cart-payment-step">
            <h1 className="cart-page__title">Pay via Mobile Money</h1>

            {/* Free delivery notice on payment step */}
            {qualifiesForFreeDelivery && (
              <div className="cart-free-delivery-banner cart-free-delivery-banner--earned">
                <Truck className="cart-free-delivery-banner__icon" />
                <div>
                  <p className="cart-free-delivery-banner__title">Free delivery included 🎉</p>
                  <p className="cart-free-delivery-banner__desc">
                    Your order qualifies for free delivery to Ashaiman, Spintex, Tema, East Legon, Madina, Adenta, Lashibi, Community 25, Sakumono &amp; selected Accra areas. Our team will confirm your delivery zone.
                  </p>
                </div>
              </div>
            )}

            {/* Amount due */}
            <div className={`cart-amount-due ${isPreOrder ? "cart-amount-due--preorder" : "cart-amount-due--regular"}`}>
              <p className="cart-amount-due__label">
                {isPreOrder ? "Deposit due now" : "Amount due"}
              </p>
              <p className={`cart-amount-due__value ${isPreOrder ? "cart-amount-due__value--preorder" : "cart-amount-due__value--regular"}`}>
                GHS {chargeAmount.toFixed(2)}
              </p>
              {isPreOrder && remainingAmount != null && (
                <p className="cart-amount-due__remaining-note">
                  Remaining balance of GHS {remainingAmount.toFixed(2)} will be collected when your item is ready.
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="cart-momo-instructions">
              <p className="cart-momo-instructions__title">How to pay</p>
              <ol className="cart-momo-instructions__steps">
                <li>Send <strong>GHS {chargeAmount.toFixed(2)}</strong> via MoMo to our merchant number</li>
                <li>Take a screenshot of the transfer confirmation</li>
                <li>Fill in your sender details below and upload the screenshot</li>
              </ol>
              <div className="cart-momo-number">MoMo: 0257765011</div>
            </div>

            {/* Sender details */}
            <div className="cart-sender-details">
              <p className="cart-sender-details__title">Your MoMo details</p>

              <div className="cart-form-field">
                <label className="cart-form-label cart-form-label--icon">
                  <User className="cart-form-label__icon" /> Account name *
                </label>
                <input
                  placeholder="Name on your MoMo account"
                  value={payerName}
                  onChange={e => setPayerName(e.target.value)}
                  className="cart-form-input"
                />
              </div>

              <div className="cart-form-field">
                <label className="cart-form-label cart-form-label--icon">
                  <Phone className="cart-form-label__icon" /> Phone number *
                </label>
                <input
                  placeholder="e.g. 024 000 0000"
                  value={payerPhone}
                  onChange={e => setPayerPhone(e.target.value)}
                  type="tel"
                  className="cart-form-input"
                />
              </div>

              <div className="cart-form-field">
                <label className="cart-form-label">Payment screenshot *</label>

                {screenshotPreview ? (
                  <div className="cart-screenshot-preview">
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot preview"
                      className="cart-screenshot-preview__img"
                    />
                    <button onClick={clearScreenshot} className="cart-screenshot-preview__clear-btn">
                      <X className="cart-screenshot-preview__clear-icon" />
                    </button>
                    <div className="cart-screenshot-preview__ready-badge">
                      <CheckCircle2 className="cart-screenshot-preview__ready-icon" /> Screenshot ready
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="cart-screenshot-upload"
                  >
                    <Upload className="cart-screenshot-upload__icon" />
                    <span className="cart-screenshot-upload__label">Tap to upload screenshot</span>
                    <span className="cart-screenshot-upload__hint">JPG, PNG up to 10 MB</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="cart-hidden-file-input"
                  onChange={handleScreenshotChange}
                />
              </div>
            </div>

            <button
              className={`cart-submit-payment-btn ${isPreOrder ? "cart-submit-payment-btn--preorder" : ""}`}
              onClick={handleSubmitPayment}
              disabled={submitting}
            >
              {submitting ? "Submitting payment…" : `Submit payment · GHS ${chargeAmount.toFixed(2)}`}
            </button>

            <p className="cart-payment-disclaimer">
              Your payment will be confirmed by our team within a few hours. You'll receive a notification once confirmed.
            </p>
          </div>
        )}

        {/* ── STEP: SUBMITTED ── */}
        {checkoutStep === "submitted" && (
          <div
            style={{ display: orderHidden ? "none" : undefined }}
            className="cart-success-state"
          >
            <div className="cart-success-state__icon-wrap">
              <CheckCircle2 className="cart-success-state__icon" />
            </div>
            <div className="cart-success-state__message">
              <h1 className="cart-success-state__title">Payment submitted!</h1>
              <p className="cart-success-state__desc">
                We've received your payment screenshot and will confirm your order within a few hours.
                You'll get a notification once it's approved.
              </p>
            </div>
            <div className="cart-success-state__details">
              <p className="cart-success-state__detail-row">
                <span className="cart-success-state__detail-label">Order ID:</span>
                <span className="cart-success-state__order-id">{currentOrder?.orderId?.toString().slice(0, 8).toUpperCase()}</span>
              </p>
              <p className="cart-success-state__detail-row">
                <span className="cart-success-state__detail-label">Amount:</span>
                <span className="cart-success-state__detail-value">GHS {chargeAmount.toFixed(2)}</span>
              </p>
              {qualifiesForFreeDelivery && (
                <p className="cart-success-state__detail-row">
                  <span className="cart-success-state__detail-label">Delivery:</span>
                  <span className="cart-success-state__free-delivery-value">FREE (selected Accra areas)</span>
                </p>
              )}
              {isPreOrder && (
                <p className="cart-success-state__preorder-note">
                  This is a pre-order deposit. The remaining balance will be requested when your item is available.
                </p>
              )}
            </div>
            <Link to="/orders" className="cart-success-state__orders-btn">View my orders</Link>
            <Link to="/" className="cart-success-state__continue-link">Continue shopping</Link>
            <button onClick={handleHideOrder} className="cart-success-state__delete-btn">
              <Trash2 className="cart-success-state__delete-icon" />
              Delete order confirmation
            </button>
          </div>
        )}
      </div>

      <style>{`
        .cart-page {
          min-height: 100vh;
          background: #ffffff;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .cart-page__container {
          max-width: 672px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .cart-page__back-link {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 14px; color: #9ca3af; text-decoration: none;
          margin-bottom: 24px;
          background: none; border: none; cursor: pointer;
          transition: color 0.15s;
        }
        .cart-page__back-link:hover { color: #f97316; }
        .cart-page__back-icon { width: 16px; height: 16px; }
        .cart-page__title {
          font-size: clamp(22px, 4vw, 26px);
          font-weight: 800; color: #111827; margin: 0 0 24px;
        }

        /* Cart items */
        .cart-content { display: flex; flex-direction: column; gap: 24px; }
        .cart-items { display: flex; flex-direction: column; gap: 12px; }
        .cart-item {
          display: flex; gap: 16px;
          border-radius: 16px;
          background: #ffffff;
          border: 1.5px solid #ffedd5;
          padding: 16px;
          transition: border-color 0.15s;
        }
        .cart-item--preorder { border-color: #fed7aa; }
        .cart-item__img-wrap {
          position: relative;
          width: 80px; height: 80px;
          flex-shrink: 0;
          border-radius: 12px;
          overflow: hidden;
          background: #fff7ed;
          border: 1.5px solid #ffedd5;
        }
        .cart-item__img { width: 100%; height: 100%; object-fit: cover; }
        .cart-item__img-fallback {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .cart-item__img-fallback-icon { width: 28px; height: 28px; color: #fdba74; }
        .cart-item__preorder-tag {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(249,115,22,0.9); color: #fff;
          font-size: 9px; font-weight: 800;
          text-align: center; padding: 2px 0;
          letter-spacing: 0.05em;
        }
        .cart-item__info { flex: 1; min-width: 0; }
        .cart-item__name {
          font-size: 14px; font-weight: 700; color: #111827;
          text-decoration: none; display: block;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 0.15s;
        }
        .cart-item__name:hover { color: #f97316; }
        .cart-item__brand { font-size: 12px; color: #9ca3af; margin: 2px 0 0; }
        .cart-item__price-row { display: flex; align-items: center; gap: 6px; margin: 2px 0 0; }
        .cart-item__unit-price { font-size: 12px; font-weight: 600; color: #f97316; margin: 0; }
        .cart-item__original-price { font-size: 11px; color: #9ca3af; text-decoration: line-through; margin: 0; }
        .cart-item__subtotal { font-size: 14px; font-weight: 800; color: #111827; margin: 4px 0 0; }
        .cart-item__deposit-note {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: #ea580c; margin: 4px 0 0;
        }
        .cart-item__deposit-clock { width: 12px; height: 12px; flex-shrink: 0; }
        .cart-item__qty-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
        .cart-qty-control {
          display: flex; align-items: center;
          border: 1.5px solid #fed7aa; border-radius: 10px; overflow: hidden;
        }
        .cart-qty-control__btn {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          color: #374151; transition: background 0.15s;
        }
        .cart-qty-control__btn:hover:not(:disabled) { background: #fff7ed; }
        .cart-qty-control__btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cart-qty-control__icon { width: 12px; height: 12px; }
        .cart-qty-control__value { width: 28px; text-align: center; font-size: 12px; font-weight: 700; color: #111827; }
        .cart-item__remove-btn {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          color: #f97316; border-radius: 8px;
          transition: background 0.15s;
        }
        .cart-item__remove-btn:hover { background: rgba(249,115,22,0.1); }
        .cart-item__remove-icon { width: 14px; height: 14px; }

        /* Pre-order banner */
        .cart-preorder-banner {
          border-radius: 14px;
          background: #fff7ed;
          border: 1.5px solid #fed7aa;
          padding: 16px;
        }
        .cart-preorder-banner__title {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: #c2410c; margin-bottom: 4px;
        }
        .cart-preorder-banner__icon { width: 16px; height: 16px; flex-shrink: 0; }
        .cart-preorder-banner__text { font-size: 13px; color: #ea580c; line-height: 1.5; margin: 0; }

        /* Free delivery banner */
        .cart-free-delivery-banner {
          display: flex; align-items: flex-start; gap: 12px;
          border-radius: 14px; padding: 14px 16px;
        }
        .cart-free-delivery-banner--earned {
          background: #f0fdf4;
          border: 1.5px solid #86efac;
        }
        .cart-free-delivery-banner--nudge {
          background: #fffbeb;
          border: 1.5px dashed #fcd34d;
        }
        .cart-free-delivery-banner__icon {
          width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px;
        }
        .cart-free-delivery-banner--earned .cart-free-delivery-banner__icon { color: #16a34a; }
        .cart-free-delivery-banner--nudge .cart-free-delivery-banner__icon { color: #d97706; }
        .cart-free-delivery-banner__title {
          font-size: 13px; font-weight: 700; margin: 0 0 3px;
        }
        .cart-free-delivery-banner--earned .cart-free-delivery-banner__title { color: #15803d; }
        .cart-free-delivery-banner--nudge .cart-free-delivery-banner__title { color: #92400e; }
        .cart-free-delivery-banner__desc {
          font-size: 12px; line-height: 1.5; margin: 0;
        }
        .cart-free-delivery-banner--earned .cart-free-delivery-banner__desc { color: #16a34a; }
        .cart-free-delivery-banner--nudge .cart-free-delivery-banner__desc { color: #b45309; }

        /* Summary */
        .cart-summary {
          border-radius: 16px;
          background: #fff;
          border: 1.5px solid #ffedd5;
          padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 2px 12px rgba(249,115,22,0.06);
        }
        .cart-summary__row {
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: 14px; color: #374151;
        }
        .cart-summary__row--muted { color: #9ca3af; }
        .cart-summary__row--savings { color: #16a34a; font-weight: 600; }
        .cart-summary__strikethrough { text-decoration: line-through; }
        .cart-summary__divider { height: 1px; background: #ffedd5; }
        .cart-summary__label-muted { color: #9ca3af; }
        .cart-summary__total-right { text-align: right; }
        .cart-summary__total-value { font-weight: 700; color: #111827; }
        .cart-summary__discount-badge { font-size: 11px; color: #16a34a; margin: 2px 0 0; }
        .cart-preorder-breakdown {
          border-radius: 12px;
          background: #fff7ed; border: 1.5px solid #fed7aa;
          padding: 12px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .cart-preorder-breakdown__heading {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #c2410c; margin: 0;
        }
        .cart-preorder-breakdown__deposit-label { color: #ea580c; font-size: 14px; }
        .cart-preorder-breakdown__deposit-value { color: #c2410c; font-weight: 800; font-size: 14px; }
        .cart-summary__row--pay-today { font-size: 18px; font-weight: 800; padding-top: 4px; }
        .cart-summary__pay-today-amount { color: #f97316; }
        .cart-summary__row--grand-total {
          font-size: 18px; font-weight: 800;
          border-top: 1.5px solid #ffedd5;
          padding-top: 12px; color: #111827;
        }
        .cart-momo-pill {
          display: flex; align-items: center; gap: 8px;
          background: #fff7ed; border-radius: 10px;
          padding: 10px 12px;
          font-size: 12px; color: #9a3412;
          border: 1px solid #fed7aa;
        }
        .cart-momo-pill__icon { width: 14px; height: 14px; flex-shrink: 0; color: #f97316; }

        /* Empty state */
        .cart-empty-state {
          display: flex; flex-direction: column; align-items: center;
          padding: 64px 0; gap: 16px;
        }
        .cart-empty-state__icon { width: 64px; height: 64px; color: #fed7aa; }
        .cart-empty-state__text { font-size: 16px; color: #9ca3af; margin: 0; }
        .cart-empty-state__cta {
          display: inline-block;
          background: #f97316; color: #fff;
          font-size: 14px; font-weight: 700;
          padding: 10px 24px; border-radius: 12px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .cart-empty-state__cta:hover { background: #ea580c; }

        /* Checkout button */
        .cart-checkout-btn {
          width: 100%; height: 48px;
          border-radius: 14px;
          background: #f97316; color: #ffffff;
          border: none; font-size: 16px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
          box-shadow: 0 4px 16px rgba(249,115,22,0.3);
        }
        .cart-checkout-btn:hover:not(:disabled) { background: #ea580c; }
        .cart-checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Address step */
        .cart-address-step { display: flex; flex-direction: column; gap: 20px; }
        .cart-address-card {
          border-radius: 16px; background: #fff;
          border: 1.5px solid #ffedd5; padding: 20px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .cart-form-field { display: flex; flex-direction: column; gap: 6px; }
        .cart-form-label {
          font-size: 14px; font-weight: 600; color: #374151;
          display: flex; align-items: center; gap: 6px;
        }
        .cart-form-label--icon { display: flex; align-items: center; gap: 6px; }
        .cart-form-label__icon { width: 14px; height: 14px; color: #f97316; }
        .cart-form-label__optional { font-weight: 400; color: #9ca3af; }
        .cart-form-input {
          height: 44px; padding: 0 14px;
          border-radius: 12px; border: 1.5px solid #fed7aa;
          font-size: 14px; color: #111827; background: #fff;
          outline: none; transition: border-color 0.15s; width: 100%;
          box-sizing: border-box;
        }
        .cart-form-input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
        .cart-form-textarea {
          padding: 12px 14px;
          border-radius: 12px; border: 1.5px solid #fed7aa;
          font-size: 14px; color: #111827; background: #fff;
          outline: none; transition: border-color 0.15s;
          resize: vertical; font-family: inherit; width: 100%;
          box-sizing: border-box;
        }
        .cart-form-textarea:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }

        /* Mini summary */
        .cart-mini-summary {
          border-radius: 14px; background: #fff;
          border: 1.5px solid #ffedd5; padding: 16px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .cart-mini-summary__heading { font-size: 13px; font-weight: 700; color: #9ca3af; margin: 0; }
        .cart-mini-summary__total { font-weight: 600; color: #111827; }
        .cart-mini-summary__deposit-row { color: #f97316; font-size: 14px; }
        .cart-mini-summary__deposit-value { font-weight: 800; color: #ea580c; }
        .cart-mini-summary__free-delivery-row { color: #15803d; font-size: 14px; }
        .cart-mini-summary__free-delivery-value { font-weight: 700; color: #16a34a; }

        /* Payment step */
        .cart-payment-step { display: flex; flex-direction: column; gap: 20px; }
        .cart-amount-due {
          border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 4px;
        }
        .cart-amount-due--regular {
          background: #fff7ed; border: 1.5px solid #fed7aa;
        }
        .cart-amount-due--preorder {
          background: #fff7ed; border: 1.5px solid #fdba74;
        }
        .cart-amount-due__label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin: 0;
        }
        .cart-amount-due__value {
          font-size: clamp(28px, 5vw, 36px); font-weight: 800; margin: 0;
        }
        .cart-amount-due__value--regular { color: #ea580c; }
        .cart-amount-due__value--preorder { color: #c2410c; }
        .cart-amount-due__remaining-note { font-size: 12px; color: #f97316; margin: 0; }

        .cart-momo-instructions {
          border-radius: 16px; background: #fff;
          border: 1.5px solid #ffedd5; padding: 20px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .cart-momo-instructions__title { font-size: 14px; font-weight: 700; color: #111827; margin: 0; }
        .cart-momo-instructions__steps {
          font-size: 14px; color: #6b7280; margin: 0; padding-left: 20px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .cart-momo-number {
          background: #fff7ed; border-radius: 10px;
          padding: 12px 16px;
          font-family: 'Courier New', monospace;
          font-size: 14px; font-weight: 700;
          text-align: center; letter-spacing: 0.15em;
          color: #c2410c; border: 1.5px solid #fed7aa;
        }

        .cart-sender-details {
          border-radius: 16px; background: #fff;
          border: 1.5px solid #ffedd5; padding: 20px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .cart-sender-details__title { font-size: 14px; font-weight: 700; color: #111827; margin: 0; }

        /* Screenshot */
        .cart-screenshot-preview {
          position: relative; border-radius: 14px; overflow: hidden;
          border: 1.5px solid #fed7aa;
        }
        .cart-screenshot-preview__img {
          width: 100%; max-height: 240px; object-fit: contain;
          background: #fff7ed; display: block;
        }
        .cart-screenshot-preview__clear-btn {
          position: absolute; top: 8px; right: 8px;
          border-radius: 50%; background: rgba(255,255,255,0.9);
          border: 1.5px solid #fed7aa; padding: 4px;
          cursor: pointer; display: flex; align-items: center;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          color: #374151;
        }
        .cart-screenshot-preview__clear-btn:hover {
          background: #f97316; color: #fff; border-color: #f97316;
        }
        .cart-screenshot-preview__clear-icon { width: 16px; height: 16px; }
        .cart-screenshot-preview__ready-badge {
          position: absolute; bottom: 8px; left: 8px;
          display: flex; align-items: center; gap: 4px;
          background: #16a34a; color: #fff;
          font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 9999px;
        }
        .cart-screenshot-preview__ready-icon { width: 12px; height: 12px; }
        .cart-screenshot-upload {
          width: 100%; border-radius: 14px;
          border: 2px dashed #fed7aa;
          background: none; cursor: pointer;
          padding: 40px 0;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          color: #fdba74; transition: border-color 0.15s, color 0.15s;
        }
        .cart-screenshot-upload:hover { border-color: #f97316; color: #f97316; }
        .cart-screenshot-upload__icon { width: 32px; height: 32px; }
        .cart-screenshot-upload__label { font-size: 14px; font-weight: 600; }
        .cart-screenshot-upload__hint { font-size: 12px; }
        .cart-hidden-file-input { display: none; }

        .cart-submit-payment-btn {
          width: 100%; height: 48px;
          border-radius: 14px;
          background: #f97316; color: #fff;
          border: none; font-size: 16px; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(249,115,22,0.3);
          transition: background 0.15s;
        }
        .cart-submit-payment-btn:hover:not(:disabled) { background: #ea580c; }
        .cart-submit-payment-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cart-submit-payment-btn--preorder {
          background: #ea580c;
          box-shadow: 0 4px 16px rgba(234,88,12,0.3);
        }
        .cart-submit-payment-btn--preorder:hover:not(:disabled) { background: #c2410c; }
        .cart-payment-disclaimer {
          font-size: 12px; text-align: center; color: #9ca3af; margin: 0;
        }

        /* Success state */
        .cart-success-state {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 64px 0; gap: 20px;
        }
        .cart-success-state__icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: rgba(249,115,22,0.1);
          display: flex; align-items: center; justify-content: center;
        }
        .cart-success-state__icon { width: 40px; height: 40px; color: #f97316; }
        .cart-success-state__message { display: flex; flex-direction: column; gap: 8px; }
        .cart-success-state__title {
          font-size: clamp(22px, 4vw, 26px); font-weight: 800; color: #111827; margin: 0;
        }
        .cart-success-state__desc {
          font-size: 14px; color: #6b7280; max-width: 300px; margin: 0;
        }
        .cart-success-state__details {
          border-radius: 14px; background: #fff7ed;
          padding: 16px; width: 100%; text-align: left;
          display: flex; flex-direction: column; gap: 8px;
          border: 1.5px solid #ffedd5;
        }
        .cart-success-state__detail-row { font-size: 14px; color: #374151; margin: 0; }
        .cart-success-state__detail-label { color: #9ca3af; margin-right: 4px; }
        .cart-success-state__order-id {
          font-family: 'Courier New', monospace;
          font-weight: 700; color: #c2410c;
        }
        .cart-success-state__detail-value { font-weight: 700; color: #111827; }
        .cart-success-state__free-delivery-value { font-weight: 700; color: #16a34a; }
        .cart-success-state__preorder-note { font-size: 12px; color: #ea580c; margin: 0; }
        .cart-success-state__orders-btn {
          display: inline-flex; align-items: center;
          background: #fff; border: 1.5px solid #fed7aa;
          color: #374151; font-size: 14px; font-weight: 600;
          padding: 10px 24px; border-radius: 12px;
          text-decoration: none; transition: border-color 0.15s;
        }
        .cart-success-state__orders-btn:hover { border-color: #f97316; color: #f97316; }
        .cart-success-state__continue-link {
          font-size: 14px; color: #f97316; text-decoration: none;
        }
        .cart-success-state__continue-link:hover { text-decoration: underline; }
        .cart-success-state__delete-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; color: #9ca3af;
          background: none; border: none; cursor: pointer;
          transition: color 0.15s;
        }
        .cart-success-state__delete-btn:hover { color: #f97316; }
        .cart-success-state__delete-icon { width: 14px; height: 14px; }
      `}</style>
    </div>
  );
};

export default CartPage;
