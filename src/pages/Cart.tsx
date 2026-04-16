import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowLeft,
  Upload, X, Clock, Info, CheckCircle2, Phone, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cartApi, orderApi, paymentApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import CartSkeleton from "@/components/CartSkeleton";
import { toast } from "sonner";

// ── Cart normaliser ───────────────────────────────────────────────────────────
function normaliseCart(data: any) {
  if (!data) return data;
  return {
    ...data,
    cartTotal:       Number(data.cartTotal       ?? 0),
    discountedTotal: Number(data.discountedTotal ?? 0),
    items: Array.isArray(data.items)
      ? data.items.map((item: any) => ({
          ...item,
          isDiscounted:  item.isDiscounted ?? item.discounted ?? false,
          unitPrice:     Number(item.unitPrice     ?? 0),
          originalPrice: item.originalPrice != null ? Number(item.originalPrice) : undefined,
          subTotal:      Number(item.subTotal      ?? 0),
          stockStatus:   item.stockStatus ?? "IN_STOCK",
        }))
      : [],
  };
}

function isPreOrderItem(item: any) {
  return item.stockStatus === "PRE_ORDER" || item.stockStatus === "COMING_SOON";
}
function cartHasPreOrder(items: any[]) {
  return items.some(isPreOrderItem);
}

// ── Step types ────────────────────────────────────────────────────────────────
type Step = "cart" | "address" | "payment" | "submitted";

const Cart = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [step, setStep]         = useState<Step>("cart");

  // address step
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes]                     = useState("");

  // order created by /initiate
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [initiating, setInitiating]     = useState(false);

  // payment step
  const [senderName, setSenderName]           = useState("");
  const [senderPhone, setSenderPhone]         = useState("");
  const [screenshot, setScreenshot]           = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting]           = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── fetch cart ──────────────────────────────────────────────────────────────
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

  // ── cart actions ────────────────────────────────────────────────────────────
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

  // ── step 1 → 2: address → initiate order ───────────────────────────────────
  const handleProceedToPayment = async () => {
    if (!deliveryAddress.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }
    setInitiating(true);
    try {
      const order = await orderApi.initiate({
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim() || undefined,
      });
      if (!order?.orderId) {
        toast.error("Failed to create order. Please try again.");
        return;
      }
      setCurrentOrder(order);
      setStep("payment");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create order.");
    } finally {
      setInitiating(false);
    }
  };

  // ── screenshot pick ─────────────────────────────────────────────────────────
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10 MB");
      return;
    }
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const clearScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── step 2: submit payment ──────────────────────────────────────────────────
  const handleSubmitPayment = async () => {
    if (!senderName.trim())  { toast.error("Enter your account name"); return; }
    if (!senderPhone.trim()) { toast.error("Enter your phone number"); return; }
    if (!screenshot)         { toast.error("Upload your payment screenshot"); return; }
    if (!currentOrder?.orderId) { toast.error("No order found. Please restart checkout."); return; }

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
    }
  };

  // ── derived values ──────────────────────────────────────────────────────────
  if (isLoading || loading) return <CartSkeleton />;

  const items: any[]    = cart?.items ?? [];
  const cartTotal       = Number(cart?.cartTotal ?? 0);
  const discountedTotal = Number(cart?.discountedTotal ?? 0);
  const totalItems      = cart?.totalItems ?? 0;

  const displayTotal = discountedTotal > 0 && discountedTotal < cartTotal
    ? discountedTotal : cartTotal;
  const hasDiscounts = discountedTotal > 0 && discountedTotal < cartTotal;

  const isPreOrder      = cartHasPreOrder(items);
  const depositAmount   = isPreOrder ? Math.round((displayTotal / 2) * 100) / 100 : null;
  const remainingAmount = isPreOrder && depositAmount != null
    ? Math.round((displayTotal - depositAmount) * 100) / 100 : null;

  // what the user actually pays today
  const chargeAmount = currentOrder?.chargeAmount != null
    ? Number(currentOrder.chargeAmount)
    : (isPreOrder && depositAmount != null ? depositAmount : displayTotal);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-3xl">

        {/* ── Back link ── */}
        {step === "cart" && (
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>
        )}
        {(step === "address" || step === "payment") && (
          <button
            onClick={() => setStep(step === "payment" ? "address" : "cart")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        {/* ════════════════════════════════════════════════════════
            STEP: CART
        ════════════════════════════════════════════════════════ */}
        {step === "cart" && (
          <>
            <h1 className="font-satoshi text-2xl font-bold mb-6">Shopping Cart</h1>

            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <Link to="/"><Button>Start Shopping</Button></Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item: any) => {
                    const itemIsPreOrder = isPreOrderItem(item);
                    return (
                      <div
                        key={item.cartItemId}
                        className={`flex gap-4 rounded-xl bg-card border p-4 ${
                          itemIsPreOrder ? "border-purple-200" : "border-border"
                        }`}
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary/50 border border-border">
                          {item.primaryImageUrl ? (
                            <img
                              src={item.primaryImageUrl}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ShoppingBag className="h-7 w-7 text-muted-foreground/30" />
                            </div>
                          )}
                          {itemIsPreOrder && (
                            <div className="absolute bottom-0 left-0 right-0 bg-purple-600/90 text-white text-[9px] font-bold text-center py-0.5 tracking-wide">
                              PRE-ORDER
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.productId}`}
                            className="text-sm font-semibold hover:text-primary line-clamp-1"
                          >
                            {item.productName}
                          </Link>
                          {item.brand && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.brand}</p>
                          )}
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <p className="text-xs font-medium text-primary">
                              GHS {item.unitPrice.toFixed(2)} each
                            </p>
                            {item.isDiscounted && item.originalPrice && (
                              <p className="text-xs text-muted-foreground line-through">
                                GHS {item.originalPrice.toFixed(2)}
                              </p>
                            )}
                          </div>
                          <p className="text-sm font-bold text-foreground mt-1">
                            GHS {item.subTotal.toFixed(2)}
                          </p>
                          {itemIsPreOrder && (
                            <p className="text-xs text-purple-600 mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              Deposit due now: GHS {(item.subTotal / 2).toFixed(2)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center rounded-md border border-border">
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => updateQty(item.cartItemId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => updateQty(item.cartItemId, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.cartItemId)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pre-order info banner */}
                {isPreOrder && (
                  <div className="rounded-xl bg-purple-50 border border-purple-200 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-purple-800 font-semibold text-sm">
                      <Info className="h-4 w-4 shrink-0" />
                      Your cart contains a pre-order item
                    </div>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      Pre-order and coming-soon products require a{" "}
                      <strong>50% deposit</strong> today. The remaining balance is collected
                      once your item is ready for delivery.
                    </p>
                  </div>
                )}

                {/* Order summary */}
                <div className="rounded-xl bg-card border border-border p-4 space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
                  </div>

                  {hasDiscounts && (
                    <>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal (before discounts)</span>
                        <span className="line-through">GHS {cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>You save</span>
                        <span>GHS {(cartTotal - discountedTotal).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-sm border-t border-border pt-3">
                    <span className="text-muted-foreground">Order total</span>
                    <div className="text-right">
                      <span className="font-semibold">GHS {displayTotal.toFixed(2)}</span>
                      {hasDiscounts && (
                        <p className="text-xs text-green-600">Discounts applied ✓</p>
                      )}
                    </div>
                  </div>

                  {isPreOrder && depositAmount != null && remainingAmount != null && (
                    <>
                      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 space-y-2">
                        <p className="text-[11px] font-semibold text-purple-800 uppercase tracking-wide">
                          Payment breakdown
                        </p>
                        <div className="flex justify-between text-sm text-purple-700">
                          <span>Deposit due now (50%)</span>
                          <span className="font-bold text-purple-900">GHS {depositAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-purple-600">
                          <span>Remaining balance (paid later)</span>
                          <span>GHS {remainingAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-baseline text-lg font-bold pt-1">
                        <span>You pay today</span>
                        <span className="text-purple-700">GHS {depositAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {!isPreOrder && (
                    <div className="flex justify-between items-baseline text-lg font-bold border-t border-border pt-3">
                      <span>Total</span>
                      <span>GHS {displayTotal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* MoMo info pill */}
                  <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    Payment via Mobile Money — you'll upload your transfer screenshot at checkout.
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-orange-700 text-white font-semibold"
                    onClick={() => setStep("address")}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════
            STEP: ADDRESS
        ════════════════════════════════════════════════════════ */}
        {step === "address" && (
          <div className="space-y-6">
            <h1 className="font-satoshi text-2xl font-bold">Delivery Details</h1>

            <div className="rounded-xl bg-card border border-border p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Delivery address *</label>
                <Input
                  placeholder="e.g. 14 Osu Badu Street, Accra"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea
                  placeholder="Any special instructions for delivery…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Mini order summary */}
            <div className="rounded-xl bg-card border border-border p-4 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Order summary</p>
              <div className="flex justify-between text-sm">
                <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
                <span className="font-medium">GHS {displayTotal.toFixed(2)}</span>
              </div>
              {isPreOrder && depositAmount != null && (
                <div className="flex justify-between text-sm text-purple-700">
                  <span>You pay today (50% deposit)</span>
                  <span className="font-bold">GHS {depositAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Button
              className="w-full bg-primary hover:bg-orange-700 text-white font-semibold"
              onClick={handleProceedToPayment}
              disabled={initiating}
            >
              {initiating ? "Creating order…" : "Continue to Payment"}
            </Button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            STEP: PAYMENT (MoMo screenshot upload)
        ════════════════════════════════════════════════════════ */}
        {step === "payment" && currentOrder && (
          <div className="space-y-6">
            <h1 className="font-satoshi text-2xl font-bold">Pay via Mobile Money</h1>

            {/* Amount due */}
            <div className={`rounded-xl border p-4 space-y-1 ${
              isPreOrder ? "bg-purple-50 border-purple-200" : "bg-orange-50 border-orange-200"
            }`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isPreOrder ? "Deposit due now" : "Amount due"}
              </p>
              <p className={`text-3xl font-bold ${isPreOrder ? "text-purple-800" : "text-orange-700"}`}>
                GHS {chargeAmount.toFixed(2)}
              </p>
              {isPreOrder && remainingAmount != null && (
                <p className="text-xs text-purple-600">
                  Remaining balance of GHS {remainingAmount.toFixed(2)} will be collected when your item is ready.
                </p>
              )}
            </div>

            {/* MoMo instructions */}
            <div className="rounded-xl bg-card border border-border p-5 space-y-3">
              <p className="text-sm font-semibold">How to pay</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Send <strong className="text-foreground">GHS {chargeAmount.toFixed(2)}</strong> via MoMo to our merchant number</li>
                <li>Take a screenshot of the transfer confirmation</li>
                <li>Fill in your sender details below and upload the screenshot</li>
              </ol>
              {/* Replace with your actual MoMo number */}
              <div className="rounded-lg bg-muted px-4 py-3 text-sm font-mono font-semibold text-center tracking-widest">
                MoMo: 055 XXX XXXX
              </div>
            </div>

            {/* Sender details */}
            <div className="rounded-xl bg-card border border-border p-5 space-y-4">
              <p className="text-sm font-semibold">Your MoMo details</p>

              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Account name *
                </label>
                <Input
                  placeholder="Name on your MoMo account"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone number *
                </label>
                <Input
                  placeholder="e.g. 024 000 0000"
                  value={senderPhone}
                  onChange={e => setSenderPhone(e.target.value)}
                  type="tel"
                />
              </div>

              {/* Screenshot upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment screenshot *</label>

                {screenshotPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot preview"
                      className="w-full max-h-60 object-contain bg-secondary/30"
                    />
                    <button
                      onClick={clearScreenshot}
                      className="absolute top-2 right-2 rounded-full bg-background/90 border border-border p-1 hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 rounded-full bg-green-600 text-white text-xs font-semibold px-2 py-0.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Screenshot ready
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors py-10 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <Upload className="h-8 w-8" />
                    <span className="text-sm font-medium">Tap to upload screenshot</span>
                    <span className="text-xs">JPG, PNG up to 10 MB</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScreenshotChange}
                />
              </div>
            </div>

            <Button
              className={`w-full font-semibold text-white ${
                isPreOrder
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-primary hover:bg-orange-700"
              }`}
              onClick={handleSubmitPayment}
              disabled={submitting}
            >
              {submitting
                ? "Submitting payment…"
                : `Submit payment · GHS ${chargeAmount.toFixed(2)}`
              }
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your payment will be confirmed by our team within a few hours. You'll receive a notification once confirmed.
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            STEP: SUBMITTED
        ════════════════════════════════════════════════════════ */}
        {step === "submitted" && (
          <div className="flex flex-col items-center text-center py-16 space-y-5">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="font-satoshi text-2xl font-bold">Payment submitted!</h1>
              <p className="text-muted-foreground text-sm max-w-xs">
                We've received your payment screenshot and will confirm your order within a few hours. You'll get a notification once it's approved.
              </p>
            </div>
            <div className="rounded-xl bg-muted p-4 w-full text-left space-y-1 text-sm">
              <p><span className="text-muted-foreground">Order ID:</span> <span className="font-mono font-semibold">{currentOrder?.orderId?.toString().slice(0, 8).toUpperCase()}</span></p>
              <p><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">GHS {chargeAmount.toFixed(2)}</span></p>
              {isPreOrder && <p className="text-purple-700 text-xs">This is a pre-order deposit. The remaining balance will be requested when your item is available.</p>}
            </div>
            <Link to="/orders">
              <Button variant="outline" className="gap-2">
                View my orders
              </Button>
            </Link>
            <Link to="/" className="text-sm text-primary hover:underline">
              Continue shopping
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default Cart;
