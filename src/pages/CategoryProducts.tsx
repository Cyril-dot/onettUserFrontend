import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productApi, cartApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import SkeletonGrid from "@/components/SkeletonGrid";
import { Package, ShoppingCart, ArrowRight, Tag } from "lucide-react";
import { toast } from "sonner";

function normaliseProduct(p: any) {
  return {
    ...p,
    isDiscounted: p.isDiscounted ?? p.discounted ?? false,
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : undefined,
    discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : undefined,
    price: Number(p.price),
  };
}

const CategoryProducts = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    productApi
      .getByCategory(slug)
      .then(res => {
        if (!res) { setData(null); return; }
        setData({
          ...res,
          products: Array.isArray(res.products)
            ? res.products.map(normaliseProduct)
            : [],
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error("Please sign in"); return; }
    setAddingToCart(productId);
    try {
      await cartApi.add(productId, 1);
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  const handleOrder = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${productId}`);
  };

  if (loading) return (
    <div className="cat-page-root">
      <Navbar />
      <div className="cat-page-container">
        <div className="cat-header-skeleton">
          <div className="cat-skeleton-icon-row">
            <div className="cat-skeleton-icon" />
            <div className="cat-skeleton-label" />
          </div>
          <div className="cat-skeleton-title" />
        </div>
        <SkeletonGrid count={10} />
      </div>
    </div>
  );

  const products = data?.products || [];
  const categoryName = data?.category?.name || slug;

  return (
    <div className="cat-page-root">
      <Navbar />
      <div className="cat-page-container">

        {/* Header */}
        <div className="cat-page-header">
          <div className="cat-header-eyebrow">
            <div className="cat-eyebrow-icon-wrap">
              <Tag className="cat-eyebrow-icon" />
            </div>
            <span className="cat-eyebrow-text">Category</span>
          </div>
          <h1 className="cat-page-title">{categoryName}</h1>
          <p className="cat-page-subtitle">
            {products.length} product{products.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="cat-empty-state">
            <Package className="cat-empty-icon" />
            <p className="cat-empty-text">No products in this category yet</p>
            <Link to="/categories" className="cat-empty-link">
              Browse other categories
            </Link>
          </div>
        ) : (
          <div className="cat-product-grid">
            {products.map((product: any) => {
              const hasDiscount = product.isDiscounted && product.discountPrice;
              const displayPrice = hasDiscount ? product.discountPrice : product.price;
              const imageUrl = product.primaryImageUrl || product.images?.[0]?.imageUrl || null;

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="cat-product-card"
                >
                  {/* Image */}
                  <div className="cat-card-image-wrap">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="cat-card-image"
                        loading="lazy"
                        onError={(e) => {
                          const el = e.currentTarget as HTMLImageElement;
                          el.style.display = "none";
                          const parent = el.parentElement;
                          if (parent) {
                            const placeholder = document.createElement("div");
                            placeholder.className = "cat-card-image-fallback";
                            placeholder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="cat-fallback-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`;
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div className="cat-card-image-fallback">
                        <Package className="cat-fallback-icon" />
                      </div>
                    )}

                    {hasDiscount && (
                      <div className="cat-discount-badge">
                        -{product.discountPercentage}%
                      </div>
                    )}

                    {product.stock === 0 && (
                      <div className="cat-out-of-stock-overlay">
                        <span className="cat-out-of-stock-label">Out of stock</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="cat-card-body">
                    {product.brand && (
                      <p className="cat-card-brand">{product.brand}</p>
                    )}
                    <p className="cat-card-name">{product.name}</p>

                    <div className="cat-card-price-row">
                      <span className="cat-card-price">
                        GHS {Number(displayPrice).toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="cat-card-original-price">
                          GHS {Number(product.price).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {product.stock !== 0 && (
                      <div className="cat-card-actions">
                        <button
                          onClick={(e) => handleAddToCart(e, product.id)}
                          disabled={addingToCart === product.id}
                          className="cat-btn-cart"
                        >
                          <ShoppingCart className="cat-btn-icon" />
                          {addingToCart === product.id ? "…" : "Cart"}
                        </button>
                        <button
                          onClick={(e) => handleOrder(e, product.id)}
                          className="cat-btn-order"
                        >
                          <ArrowRight className="cat-btn-icon" />
                          Order
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .cat-page-root {
          min-height: 100vh;
          background: #ffffff;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .cat-page-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .cat-header-skeleton {
          margin-bottom: 24px;
        }
        .cat-skeleton-icon-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .cat-skeleton-icon {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          background: #f0f0f0;
          animation: cat-shimmer 1.4s infinite;
        }
        .cat-skeleton-label {
          width: 64px;
          height: 12px;
          border-radius: 9999px;
          background: #f0f0f0;
          animation: cat-shimmer 1.4s infinite;
        }
        .cat-skeleton-title {
          width: 192px;
          height: 32px;
          border-radius: 8px;
          background: #f0f0f0;
          animation: cat-shimmer 1.4s infinite;
          margin-top: 8px;
        }
        @keyframes cat-shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .cat-page-header {
          margin-bottom: 24px;
        }
        .cat-header-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .cat-eyebrow-icon-wrap {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          background: rgba(249, 115, 22, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cat-eyebrow-icon {
          width: 14px;
          height: 14px;
          color: #f97316;
        }
        .cat-eyebrow-text {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .cat-page-title {
          font-size: clamp(22px, 4vw, 30px);
          font-weight: 800;
          color: #111827;
          line-height: 1.2;
          margin: 0 0 4px;
        }
        .cat-page-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
        .cat-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 0;
        }
        .cat-empty-icon {
          width: 64px;
          height: 64px;
          color: #d1d5db;
          margin-bottom: 16px;
        }
        .cat-empty-text {
          font-size: 16px;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 8px;
        }
        .cat-empty-link {
          font-size: 13px;
          color: #f97316;
          text-decoration: none;
        }
        .cat-empty-link:hover {
          text-decoration: underline;
        }
        .cat-product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .cat-product-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 768px) {
          .cat-product-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
        }
        @media (min-width: 1024px) {
          .cat-product-grid { grid-template-columns: repeat(5, 1fr); }
        }
        .cat-product-card {
          border-radius: 14px;
          background: #ffffff;
          border: 1.5px solid #f3f4f6;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s;
        }
        .cat-product-card:hover {
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.12);
          border-color: rgba(249, 115, 22, 0.3);
          transform: translateY(-2px);
        }
        .cat-card-image-wrap {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #f9fafb;
          overflow: hidden;
        }
        .cat-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .cat-product-card:hover .cat-card-image {
          transform: scale(1.05);
        }
        .cat-card-image-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cat-fallback-icon {
          width: 40px;
          height: 40px;
          color: #d1d5db;
        }
        .cat-fallback-svg {
          width: 40px;
          height: 40px;
          color: #d1d5db;
        }
        .cat-discount-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ef4444;
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
        }
        .cat-out-of-stock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cat-out-of-stock-label {
          background: rgba(0, 0, 0, 0.75);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
        }
        .cat-card-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .cat-card-brand {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #9ca3af;
          margin: 0 0 2px;
        }
        .cat-card-name {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
          margin: 0 0 8px;
        }
        .cat-card-price-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
        }
        .cat-card-price {
          font-size: 14px;
          font-weight: 800;
          color: #f97316;
        }
        .cat-card-original-price {
          font-size: 10px;
          color: #9ca3af;
          text-decoration: line-through;
        }
        .cat-card-actions {
          display: flex;
          gap: 6px;
        }
        .cat-btn-cart {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 0;
          border-radius: 8px;
          background: rgba(249, 115, 22, 0.08);
          color: #ea580c;
          font-size: 10px;
          font-weight: 700;
          border: 1.5px solid rgba(249, 115, 22, 0.2);
          cursor: pointer;
          transition: background 0.15s;
        }
        .cat-btn-cart:hover:not(:disabled) {
          background: rgba(249, 115, 22, 0.18);
        }
        .cat-btn-cart:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cat-btn-order {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 0;
          border-radius: 8px;
          background: #f97316;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cat-btn-order:hover {
          background: #c2410c;
        }
        .cat-btn-icon {
          width: 12px;
          height: 12px;
        }
      `}</style>
    </div>
  );
};

export default CategoryProducts;
