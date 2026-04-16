import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart, MessageCircle, Store,
  Minus, Plus, Play, Package, ChevronRight,
  Tag, Truck, ShieldCheck, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { productApi, cartApi, chatApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ProductDetailSkeleton from "@/components/ProductDetailSkeleton";
import { toast } from "sonner";

function normaliseProduct(p: any) {
  if (!p) return p;
  return {
    ...p,
    isDiscounted: p.isDiscounted ?? p.discounted ?? false,
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : undefined,
    discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : undefined,
    price: Number(p.price),
    relatedProducts: Array.isArray(p.relatedProducts)
      ? p.relatedProducts.map((rp: any) => ({
          ...rp,
          isDiscounted: rp.isDiscounted ?? rp.discounted ?? false,
          discountPrice: rp.discountPrice != null ? Number(rp.discountPrice) : undefined,
          discountPercentage: rp.discountPercentage != null ? Number(rp.discountPercentage) : undefined,
          price: Number(rp.price),
        }))
      : p.relatedProducts,
  };
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isSeller } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ type: "image" | "video"; index: number }>({
    type: "image",
    index: 0,
  });

  useEffect(() => {
    if (!id) return;
    productApi
      .getDetails(id)
      .then(data => setProduct(normaliseProduct(data)))
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error("Please sign in"); return; }
    setAddingToCart(true);
    try {
      await cartApi.add(id!, quantity);
      toast.success(`${quantity} item${quantity > 1 ? "s" : ""} added to cart!`);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleOrderNow = () => {
    if (!isAuthenticated) { toast.error("Please sign in"); return; }
    handleAddToCart().then(() => navigate("/cart"));
  };

  const handleContactSeller = async () => {
    if (!isAuthenticated) { toast.error("Please sign in"); return; }
    try {
      const conversation = await chatApi.startConversation(id!);
      toast.success("Conversation started!");
      navigate(`/messages?conversation=${conversation.id}`);
    } catch {
      toast.error("Failed to start conversation");
    }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return (
    <>
      <Navbar />
      <div className="pd-not-found">
        <Package className="pd-not-found-icon" />
        <p className="pd-not-found-text">Product not found</p>
        <Link to="/" className="pd-not-found-link">Go back home</Link>
      </div>
    </>
  );

  const images: any[] = product.images || [];
  const video: any | null = product.video ?? null;

  const mediaItems = [
    ...images.map((img: any) => ({ type: "image" as const, url: img.imageUrl, id: img.id })),
    ...(video ? [{ type: "video" as const, url: video.videoUrl, thumbnailUrl: video.thumbnailUrl, id: video.id }] : []),
  ];

  const current = mediaItems[selectedMedia.index] ?? mediaItems[0];
  const inStock = product.stock > 0;
  const hasDiscount = product.isDiscounted && product.discountPrice;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;

  return (
    <div className="pd-page-root">
      <Navbar />

      <div className="pd-page-container">
        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <Link to="/" className="pd-breadcrumb-link">Home</Link>
          <ChevronRight className="pd-breadcrumb-sep" />
          {product.category && (
            <>
              <Link to={`/categories/${product.category.slug}`} className="pd-breadcrumb-link">
                {product.category.name}
              </Link>
              <ChevronRight className="pd-breadcrumb-sep" />
            </>
          )}
          <span className="pd-breadcrumb-current">{product.name}</span>
        </div>

        <div className="pd-product-layout">

          {/* ── Media Column ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="pd-media-col"
          >
            {/* Main viewer */}
            <div className="pd-main-viewer">
              {!current ? (
                <div className="pd-main-viewer-empty">
                  <Package className="pd-viewer-placeholder-icon" />
                </div>
              ) : current.type === "image" ? (
                <img src={current.url} alt={product.name} className="pd-main-viewer-img" />
              ) : (
                <video
                  key={current.url}
                  src={current.url}
                  controls
                  poster={current.thumbnailUrl ?? undefined}
                  className="pd-main-viewer-video"
                />
              )}

              {hasDiscount && (
                <div className="pd-main-discount-badge">
                  -{product.discountPercentage}% OFF
                </div>
              )}
              {!inStock && (
                <div className="pd-main-out-of-stock-overlay">
                  <span className="pd-main-out-of-stock-label">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {mediaItems.length > 1 && (
              <div className="pd-thumbnails-row">
                {mediaItems.map((item, i) => (
                  <button
                    key={item.id ?? i}
                    onClick={() => setSelectedMedia({ type: item.type, index: i })}
                    className={`pd-thumbnail-btn ${i === selectedMedia.index ? "pd-thumbnail-btn--active" : ""}`}
                  >
                    {item.type === "image" ? (
                      <img src={item.url} alt="" className="pd-thumbnail-img" />
                    ) : (
                      <>
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt="video" className="pd-thumbnail-img" />
                        ) : (
                          <div className="pd-thumbnail-video-placeholder">
                            <Play className="pd-thumbnail-play" />
                          </div>
                        )}
                        <div className="pd-thumbnail-video-overlay">
                          <Play className="pd-thumbnail-play-white" />
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Trust signals */}
            <div className="pd-trust-signals">
              <div className="pd-trust-row">
                <ShieldCheck className="pd-trust-icon pd-trust-icon--green" />
                <span className="pd-trust-text">Secure payment & buyer protection</span>
              </div>
              <div className="pd-trust-row">
                <Truck className="pd-trust-icon pd-trust-icon--blue" />
                <span className="pd-trust-text">Fast delivery across Ghana</span>
              </div>
            </div>
          </motion.div>

          {/* ── Info Column ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="pd-info-col"
          >
            {/* Category pill */}
            {product.category && (
              <Link to={`/categories/${product.category.slug}`} className="pd-category-pill">
                <Tag className="pd-category-pill-icon" />
                {product.category.name}
              </Link>
            )}

            {/* Product name */}
            <div className="pd-name-block">
              <h1 className="pd-product-name">{product.name}</h1>
              {product.brand && (
                <p className="pd-product-brand">
                  by <span className="pd-product-brand-name">{product.brand}</span>
                </p>
              )}
            </div>

            {/* Price block */}
            <div className="pd-price-card">
              <div className="pd-price-row">
                <span className="pd-price-main">
                  GHS {Number(displayPrice).toFixed(2)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="pd-price-original">
                      GHS {Number(product.price).toFixed(2)}
                    </span>
                    <span className="pd-price-save-badge">
                      Save GHS {(Number(product.price) - Number(product.discountPrice)).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
              <div className="pd-stock-row">
                <span className={`pd-stock-dot ${inStock ? "pd-stock-dot--in" : "pd-stock-dot--out"}`} />
                <span className="pd-stock-text">
                  {inStock ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>
            </div>

            {/* Description */}
            {product.productDescription && (
              <div className="pd-description-block">
                <h3 className="pd-description-heading">About this product</h3>
                <p className="pd-description-text">{product.productDescription}</p>
              </div>
            )}

            {/* Quantity + Actions */}
            {!isSeller && inStock && (
              <div className="pd-actions-block">
                <div className="pd-qty-row">
                  <span className="pd-qty-label">Qty:</span>
                  <div className="pd-qty-control">
                    <button
                      className="pd-qty-btn"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="pd-qty-btn-icon" />
                    </button>
                    <span className="pd-qty-value">{quantity}</span>
                    <button
                      className="pd-qty-btn"
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="pd-qty-btn-icon" />
                    </button>
                  </div>
                </div>

                <div className="pd-cta-row">
                  <button
                    className="pd-btn-add-cart"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                  >
                    <ShoppingCart className="pd-cta-icon" />
                    {addingToCart ? "Adding…" : "Add to Cart"}
                  </button>
                  <button
                    className="pd-btn-order-now"
                    onClick={handleOrderNow}
                  >
                    <ArrowRight className="pd-cta-icon" />
                    Order Now
                  </button>
                </div>
              </div>
            )}

            {/* Mobile trust signals */}
            <div className="pd-trust-signals-mobile">
              <div className="pd-trust-row">
                <ShieldCheck className="pd-trust-icon pd-trust-icon--green" />
                <span className="pd-trust-text">Secure payment & buyer protection</span>
              </div>
              <div className="pd-trust-row">
                <Truck className="pd-trust-icon pd-trust-icon--blue" />
                <span className="pd-trust-text">Fast delivery across Ghana</span>
              </div>
            </div>

            {/* Seller info */}
            {product.seller && (
              <div className="pd-seller-card">
                <p className="pd-seller-label">Sold by</p>
                <div className="pd-seller-row">
                  <Link to={`/store/${product.seller.id}`} className="pd-seller-info">
                    <div className="pd-seller-avatar">
                      {product.seller.profilePic?.imageUrl ? (
                        <img
                          src={product.seller.profilePic.imageUrl}
                          alt={product.seller.storeName}
                          className="pd-seller-avatar-img"
                        />
                      ) : (
                        <Store className="pd-seller-avatar-icon" />
                      )}
                    </div>
                    <div>
                      <p className="pd-seller-store-name">{product.seller.storeName}</p>
                      <p className="pd-seller-location">{product.seller.location ?? "Visit store →"}</p>
                    </div>
                  </Link>
                  {!isSeller && (
                    <button className="pd-btn-chat" onClick={handleContactSeller}>
                      <MessageCircle className="pd-chat-icon" />
                      Chat
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Related Products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pd-related-section"
          >
            <h2 className="pd-related-heading">You might also like</h2>
            <div className="pd-related-grid">
              {product.relatedProducts.map((rp: any) => {
                const rpHasDiscount = rp.isDiscounted && rp.discountPrice;
                const rpDisplayPrice = rpHasDiscount ? rp.discountPrice : rp.price;
                const rpImage = rp.primaryImageUrl || rp.images?.[0]?.imageUrl || null;
                return (
                  <Link key={rp.id} to={`/products/${rp.id}`} className="pd-related-card">
                    <div className="pd-related-image-wrap">
                      {rpImage ? (
                        <img src={rpImage} alt={rp.name} className="pd-related-image" loading="lazy" />
                      ) : (
                        <div className="pd-related-image-fallback">
                          <Package className="pd-related-placeholder-icon" />
                        </div>
                      )}
                      {rpHasDiscount && (
                        <div className="pd-related-discount-badge">
                          -{rp.discountPercentage}%
                        </div>
                      )}
                    </div>
                    <div className="pd-related-card-body">
                      <p className="pd-related-card-name">{rp.name}</p>
                      <div className="pd-related-price-row">
                        <p className="pd-related-price">GHS {Number(rpDisplayPrice).toFixed(2)}</p>
                        {rpHasDiscount && (
                          <p className="pd-related-original-price">GHS {Number(rp.price).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        .pd-page-root {
          min-height: 100vh;
          background: #ffffff;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .pd-page-container {
          max-width: 1152px;
          margin: 0 auto;
          padding: 16px;
        }
        @media (min-width: 768px) {
          .pd-page-container { padding: 24px 16px; }
        }
        .pd-not-found {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 0;
        }
        .pd-not-found-icon { width: 64px; height: 64px; color: #d1d5db; margin-bottom: 16px; }
        .pd-not-found-text { color: #6b7280; margin: 0 0 8px; }
        .pd-not-found-link { font-size: 13px; color: #f97316; text-decoration: none; }
        .pd-not-found-link:hover { text-decoration: underline; }

        /* Breadcrumb */
        .pd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .pd-breadcrumb-link { color: #9ca3af; text-decoration: none; transition: color 0.15s; }
        .pd-breadcrumb-link:hover { color: #111827; }
        .pd-breadcrumb-sep { width: 12px; height: 12px; color: #d1d5db; }
        .pd-breadcrumb-current {
          color: #111827;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Layout */
        .pd-product-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .pd-product-layout { grid-template-columns: 1fr 1fr; gap: 40px; }
        }
        @media (min-width: 1024px) {
          .pd-product-layout { gap: 64px; }
        }

        /* Media col */
        .pd-media-col { display: flex; flex-direction: column; gap: 12px; }
        .pd-main-viewer {
          aspect-ratio: 1/1;
          border-radius: 20px;
          overflow: hidden;
          background: #f9fafb;
          position: relative;
        }
        .pd-main-viewer-empty {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .pd-viewer-placeholder-icon { width: 80px; height: 80px; color: #d1d5db; }
        .pd-main-viewer-img { width: 100%; height: 100%; object-fit: cover; }
        .pd-main-viewer-video { width: 100%; height: 100%; object-fit: cover; }
        .pd-main-discount-badge {
          position: absolute; top: 12px; left: 12px;
          background: #ef4444; color: #fff;
          font-size: 12px; font-weight: 800;
          padding: 4px 10px; border-radius: 9999px;
          box-shadow: 0 2px 8px rgba(239,68,68,0.4);
        }
        .pd-main-out-of-stock-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          border-radius: 20px;
        }
        .pd-main-out-of-stock-label {
          background: rgba(0,0,0,0.8); color: #fff;
          font-size: 14px; font-weight: 700;
          padding: 6px 16px; border-radius: 9999px;
        }

        /* Thumbnails */
        .pd-thumbnails-row {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
        }
        .pd-thumbnail-btn {
          position: relative;
          width: 64px; height: 64px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #e5e7eb;
          flex-shrink: 0;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          background: none; padding: 0;
        }
        .pd-thumbnail-btn--active {
          border-color: #f97316;
          box-shadow: 0 0 0 2px rgba(249,115,22,0.25);
        }
        .pd-thumbnail-btn:not(.pd-thumbnail-btn--active):hover {
          border-color: rgba(249,115,22,0.5);
        }
        @media (min-width: 768px) {
          .pd-thumbnail-btn { width: 80px; height: 80px; }
        }
        .pd-thumbnail-img { width: 100%; height: 100%; object-fit: cover; }
        .pd-thumbnail-video-placeholder {
          width: 100%; height: 100%;
          background: #f3f4f6;
          display: flex; align-items: center; justify-content: center;
        }
        .pd-thumbnail-play { width: 20px; height: 20px; color: #9ca3af; }
        .pd-thumbnail-video-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.3);
        }
        .pd-thumbnail-play-white { width: 16px; height: 16px; color: #fff; fill: #fff; }

        /* Trust signals */
        .pd-trust-signals {
          display: none;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }
        @media (min-width: 768px) { .pd-trust-signals { display: flex; } }
        .pd-trust-signals-mobile {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        @media (min-width: 768px) { .pd-trust-signals-mobile { display: none; } }
        .pd-trust-row { display: flex; align-items: center; gap: 10px; }
        .pd-trust-icon { width: 16px; height: 16px; flex-shrink: 0; }
        .pd-trust-icon--green { color: #22c55e; }
        .pd-trust-icon--blue { color: #3b82f6; }
        .pd-trust-text { font-size: 12px; color: #9ca3af; }

        /* Info col */
        .pd-info-col { display: flex; flex-direction: column; gap: 20px; }

        .pd-category-pill {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700;
          color: #f97316;
          background: rgba(249,115,22,0.08);
          border: 1.5px solid rgba(249,115,22,0.25);
          padding: 3px 10px; border-radius: 9999px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .pd-category-pill:hover { background: rgba(249,115,22,0.16); }
        .pd-category-pill-icon { width: 12px; height: 12px; }

        .pd-name-block {}
        .pd-product-name {
          font-size: clamp(20px, 3vw, 28px);
          font-weight: 800;
          color: #111827;
          line-height: 1.25;
          margin: 0 0 4px;
        }
        .pd-product-brand { font-size: 13px; color: #9ca3af; margin: 0; }
        .pd-product-brand-name { font-weight: 600; color: #111827; }

        .pd-price-card {
          background: #fff;
          border: 1.5px solid #f3f4f6;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .pd-price-row {
          display: flex; align-items: baseline; gap: 12px;
          flex-wrap: wrap; margin-bottom: 8px;
        }
        .pd-price-main {
          font-size: clamp(24px, 3.5vw, 32px);
          font-weight: 800; color: #f97316;
        }
        .pd-price-original {
          font-size: 16px; color: #9ca3af; text-decoration: line-through;
        }
        .pd-price-save-badge {
          font-size: 12px; font-weight: 700;
          color: #ef4444;
          background: rgba(239,68,68,0.08);
          padding: 2px 8px; border-radius: 9999px;
        }
        .pd-stock-row { display: flex; align-items: center; gap: 6px; }
        .pd-stock-dot {
          width: 8px; height: 8px; border-radius: 50%; display: inline-block;
        }
        .pd-stock-dot--in { background: #22c55e; }
        .pd-stock-dot--out { background: #f87171; }
        .pd-stock-text { font-size: 12px; color: #9ca3af; }

        .pd-description-block {}
        .pd-description-heading {
          font-size: 14px; font-weight: 700; color: #111827;
          margin: 0 0 6px;
        }
        .pd-description-text {
          font-size: 14px; color: #6b7280; line-height: 1.65; margin: 0;
        }

        .pd-actions-block { display: flex; flex-direction: column; gap: 12px; }
        .pd-qty-row { display: flex; align-items: center; gap: 12px; }
        .pd-qty-label { font-size: 14px; font-weight: 600; color: #111827; }
        .pd-qty-control {
          display: flex; align-items: center;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          overflow: hidden;
        }
        .pd-qty-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          color: #374151; transition: background 0.15s;
        }
        .pd-qty-btn:hover:not(:disabled) { background: #f9fafb; }
        .pd-qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pd-qty-btn-icon { width: 14px; height: 14px; }
        .pd-qty-value {
          width: 40px; text-align: center;
          font-size: 14px; font-weight: 700; color: #111827;
        }

        .pd-cta-row { display: flex; gap: 8px; }
        .pd-btn-add-cart {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          height: 44px; border-radius: 12px;
          background: rgba(249,115,22,0.06);
          color: #f97316;
          border: 1.5px solid rgba(249,115,22,0.3);
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
        }
        .pd-btn-add-cart:hover:not(:disabled) { background: rgba(249,115,22,0.12); }
        .pd-btn-add-cart:disabled { opacity: 0.6; cursor: not-allowed; }
        .pd-btn-order-now {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          height: 44px; border-radius: 12px;
          background: #f97316; color: #ffffff;
          border: none; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
          box-shadow: 0 4px 14px rgba(249,115,22,0.35);
        }
        .pd-btn-order-now:hover { background: #c2410c; }
        .pd-cta-icon { width: 16px; height: 16px; }

        .pd-seller-card {
          background: #fff;
          border: 1.5px solid #f3f4f6;
          border-radius: 16px; padding: 16px;
        }
        .pd-seller-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #9ca3af; margin: 0 0 12px;
        }
        .pd-seller-row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .pd-seller-info {
          display: flex; align-items: center; gap: 12px;
          text-decoration: none;
        }
        .pd-seller-avatar {
          width: 40px; height: 40px;
          border-radius: 50%; overflow: hidden;
          background: rgba(249,115,22,0.1);
          border: 1.5px solid rgba(249,115,22,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .pd-seller-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .pd-seller-avatar-icon { width: 20px; height: 20px; color: #f97316; }
        .pd-seller-store-name {
          font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 2px;
          transition: color 0.15s;
        }
        .pd-seller-info:hover .pd-seller-store-name { color: #f97316; }
        .pd-seller-location { font-size: 12px; color: #9ca3af; margin: 0; }
        .pd-btn-chat {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: #374151;
          background: #fff; border: 1.5px solid #e5e7eb;
          padding: 6px 12px; border-radius: 10px;
          cursor: pointer; transition: border-color 0.15s, color 0.15s;
        }
        .pd-btn-chat:hover { border-color: rgba(249,115,22,0.4); color: #f97316; }
        .pd-chat-icon { width: 14px; height: 14px; }

        /* Related */
        .pd-related-section { margin-top: 48px; }
        @media (min-width: 768px) { .pd-related-section { margin-top: 64px; } }
        .pd-related-heading {
          font-size: clamp(17px, 2.5vw, 20px);
          font-weight: 800; color: #111827;
          margin: 0 0 16px;
        }
        .pd-related-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) { .pd-related-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 768px) { .pd-related-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1024px) { .pd-related-grid { grid-template-columns: repeat(5, 1fr); } }

        .pd-related-card {
          border-radius: 14px;
          border: 1.5px solid #f3f4f6;
          background: #fff; overflow: hidden;
          text-decoration: none;
          display: flex; flex-direction: column;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .pd-related-card:hover {
          box-shadow: 0 6px 20px rgba(249,115,22,0.12);
          border-color: rgba(249,115,22,0.25);
        }
        .pd-related-image-wrap {
          aspect-ratio: 1/1; background: #f9fafb;
          position: relative; overflow: hidden;
        }
        .pd-related-image { width: 100%; height: 100%; object-fit: cover; }
        .pd-related-image-fallback {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .pd-related-placeholder-icon { width: 32px; height: 32px; color: #d1d5db; }
        .pd-related-discount-badge {
          position: absolute; top: 6px; right: 6px;
          background: #ef4444; color: #fff;
          font-size: 9px; font-weight: 800;
          padding: 2px 6px; border-radius: 9999px;
          box-shadow: 0 2px 4px rgba(239,68,68,0.3);
        }
        .pd-related-card-body { padding: 10px; display: flex; flex-direction: column; flex: 1; }
        .pd-related-card-name {
          font-size: 12px; font-weight: 600; color: #111827;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; line-height: 1.4; flex: 1; margin: 0 0 6px;
        }
        .pd-related-price-row { display: flex; align-items: baseline; gap: 6px; }
        .pd-related-price { font-size: 12px; font-weight: 800; color: #f97316; margin: 0; }
        .pd-related-original-price {
          font-size: 10px; color: #9ca3af; text-decoration: line-through; margin: 0;
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;
