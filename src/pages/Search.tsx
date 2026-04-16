import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { productApi, cartApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import SkeletonGrid from "@/components/SkeletonGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Package,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const EMPTY_FILTERS = { brand: "", minPrice: "", maxPrice: "", categorySlug: "" };

function normaliseProduct(p: any) {
  return {
    ...p,
    isDiscounted: p.isDiscounted ?? p.discounted ?? false,
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : undefined,
    discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : undefined,
    price: Number(p.price),
  };
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState(keyword);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const hasFilters =
          !!appliedFilters.brand ||
          !!appliedFilters.minPrice ||
          !!appliedFilters.maxPrice ||
          !!appliedFilters.categorySlug;

        let res;
        if (keyword && !hasFilters) {
          res = await productApi.globalSearch(keyword.trim());
        } else {
          const params: Record<string, string> = {};
          if (keyword) params.keyword = keyword;
          if (appliedFilters.brand) params.brand = appliedFilters.brand;
          if (appliedFilters.minPrice) params.minPrice = appliedFilters.minPrice;
          if (appliedFilters.maxPrice) params.maxPrice = appliedFilters.maxPrice;
          if (appliedFilters.categorySlug) params.categorySlug = appliedFilters.categorySlug;
          res = await productApi.searchWithFilters(params);
        }
        setProducts((res?.products ?? []).map(normaliseProduct));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [keyword, appliedFilters]);

  const sortedProducts = [...products].sort((a, b) => {
    const pa = a.isDiscounted && a.discountPrice ? a.discountPrice : a.price;
    const pb = b.isDiscounted && b.discountPrice ? b.discountPrice : b.price;
    if (sortBy === "price_asc") return pa - pb;
    if (sortBy === "price_desc") return pb - pa;
    return 0;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) { handleClear(); return; }
    setSearchParams({ keyword: query.trim() });
  };

  const handleClear = () => {
    setQuery("");
    setSearchParams({});
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setShowFilters(false);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const removeFilter = (key: keyof typeof EMPTY_FILTERS) => {
    setFilters(f => ({ ...f, [key]: "" }));
    setAppliedFilters(f => ({ ...f, [key]: "" }));
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error("Please sign in to add items to cart"); return; }
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

  const hasActiveSearch = !!keyword;
  const hasActiveFilters = Object.values(appliedFilters).some(Boolean);
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  return (
    <div className="srch-page-root">
      <Navbar />

      {/* Sticky search bar */}
      <div className="srch-bar-wrapper">
        <form onSubmit={handleSubmit} className="srch-bar-form">
          <div className="srch-input-wrap">
            <SearchIcon className="srch-input-icon" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products, brands..."
              className="srch-input"
            />
            {query && (
              <button type="button" onClick={handleClear} className="srch-input-clear">
                <X className="srch-input-clear-icon" />
              </button>
            )}
          </div>

          <button type="submit" className="srch-submit-btn">Search</button>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`srch-filter-toggle ${showFilters || hasActiveFilters ? "srch-filter-toggle--active" : ""}`}
          >
            <SlidersHorizontal className="srch-filter-toggle-icon" />
            {activeFilterCount > 0 && (
              <span className="srch-filter-badge">{activeFilterCount}</span>
            )}
          </button>
        </form>
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <div className="srch-filter-drawer">
          <div className="srch-filter-grid">
            <div className="srch-filter-field srch-filter-field--full">
              <label className="srch-filter-label">Brand</label>
              <input
                placeholder="e.g. Nike, Samsung..."
                value={filters.brand}
                onChange={e => setFilters(f => ({ ...f, brand: e.target.value }))}
                className="srch-filter-input"
              />
            </div>
            <div className="srch-filter-field">
              <label className="srch-filter-label">Min (GHS)</label>
              <input
                placeholder="0"
                type="number"
                inputMode="numeric"
                value={filters.minPrice}
                onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                className="srch-filter-input"
              />
            </div>
            <div className="srch-filter-field">
              <label className="srch-filter-label">Max (GHS)</label>
              <input
                placeholder="Any"
                type="number"
                inputMode="numeric"
                value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                className="srch-filter-input"
              />
            </div>
            <div className="srch-filter-field srch-filter-field--full">
              <label className="srch-filter-label">Category</label>
              <input
                placeholder="e.g. sneakers, phones..."
                value={filters.categorySlug}
                onChange={e => setFilters(f => ({ ...f, categorySlug: e.target.value }))}
                className="srch-filter-input"
              />
            </div>
          </div>
          <div className="srch-filter-actions">
            <button onClick={handleApplyFilters} className="srch-filter-apply-btn">
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="srch-filter-clear-btn">
                <X className="srch-filter-clear-icon" /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Page body */}
      <div className="srch-body">

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="srch-chips-row">
            {appliedFilters.brand && (
              <span className="srch-chip">
                {appliedFilters.brand}
                <button onClick={() => removeFilter("brand")} className="srch-chip-remove"><X className="srch-chip-remove-icon" /></button>
              </span>
            )}
            {appliedFilters.minPrice && (
              <span className="srch-chip">
                Min GHS {appliedFilters.minPrice}
                <button onClick={() => removeFilter("minPrice")} className="srch-chip-remove"><X className="srch-chip-remove-icon" /></button>
              </span>
            )}
            {appliedFilters.maxPrice && (
              <span className="srch-chip">
                Max GHS {appliedFilters.maxPrice}
                <button onClick={() => removeFilter("maxPrice")} className="srch-chip-remove"><X className="srch-chip-remove-icon" /></button>
              </span>
            )}
            {appliedFilters.categorySlug && (
              <span className="srch-chip">
                {appliedFilters.categorySlug}
                <button onClick={() => removeFilter("categorySlug")} className="srch-chip-remove"><X className="srch-chip-remove-icon" /></button>
              </span>
            )}
          </div>
        )}

        {/* Result count + sort */}
        <div className="srch-results-bar">
          <div className="srch-results-info">
            <h1 className="srch-results-title">
              {hasActiveSearch ? `"${keyword}"` : "All Products"}
            </h1>
            {!loading && (
              <p className="srch-results-count">
                {sortedProducts.length} product{sortedProducts.length !== 1 ? "s" : ""}
                {hasActiveSearch ? " found" : ""}
              </p>
            )}
          </div>
          <div className="srch-results-controls">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="srch-sort-select"
            >
              <option value="default">Default</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
            {(hasActiveSearch || hasActiveFilters) && (
              <button onClick={handleClear} className="srch-clear-all-btn">
                <X className="srch-clear-all-icon" /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Product list */}
        {loading ? (
          <SkeletonGrid count={8} />
        ) : sortedProducts.length === 0 ? (
          <div className="srch-empty-state">
            <Package className="srch-empty-icon" />
            <p className="srch-empty-title">No products found</p>
            {(hasActiveSearch || hasActiveFilters) && (
              <p className="srch-empty-hint">
                Try different filters or{" "}
                <button onClick={handleClear} className="srch-empty-browse-link">browse all</button>
              </p>
            )}
          </div>
        ) : (
          <div className="srch-product-list">
            {sortedProducts.map((p: any) => {
              const hasDiscount = p.isDiscounted && p.discountPrice;
              const displayPrice = hasDiscount ? p.discountPrice : p.price;
              const imageUrl = p.primaryImageUrl || p.images?.[0]?.imageUrl || null;

              return (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  className="srch-product-card"
                >
                  {/* Image */}
                  <div className="srch-card-image-wrap">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={p.name}
                        className="srch-card-image"
                        loading="lazy"
                        onError={e => {
                          const el = e.currentTarget as HTMLImageElement;
                          el.style.display = "none";
                          const parent = el.parentElement;
                          if (parent) {
                            const div = document.createElement("div");
                            div.className = "srch-card-image-fallback";
                            div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="srch-card-fallback-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/></svg>`;
                            parent.appendChild(div);
                          }
                        }}
                      />
                    ) : (
                      <div className="srch-card-image-fallback">
                        <Package className="srch-card-fallback-icon" />
                      </div>
                    )}

                    {hasDiscount && (
                      <div className="srch-card-discount-badge">-{p.discountPercentage}%</div>
                    )}
                    {p.hasVideo && (
                      <span className="srch-card-video-badge">VIDEO</span>
                    )}
                    {p.stock === 0 && (
                      <div className="srch-card-out-of-stock-overlay">
                        <span className="srch-card-out-of-stock-label">Out of stock</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="srch-card-body">
                    <div className="srch-card-meta">
                      {p.brand && (
                        <p className="srch-card-brand">{p.brand}</p>
                      )}
                      <p className="srch-card-name">{p.name}</p>
                      {p.categoryName && (
                        <p className="srch-card-category">{p.categoryName}</p>
                      )}
                    </div>

                    <div className="srch-card-pricing">
                      <div className="srch-card-price-row">
                        <span className="srch-card-price">GHS {Number(displayPrice).toFixed(2)}</span>
                        {hasDiscount && (
                          <span className="srch-card-original-price">GHS {Number(p.price).toFixed(2)}</span>
                        )}
                      </div>

                      {p.stock !== 0 && (
                        <div className="srch-card-actions">
                          <button
                            onClick={(e) => handleAddToCart(e, p.id)}
                            disabled={addingToCart === p.id}
                            className="srch-card-btn-cart"
                          >
                            <ShoppingCart className="srch-card-btn-icon" />
                            {addingToCart === p.id ? "…" : "Cart"}
                          </button>
                          <button
                            onClick={(e) => handleOrder(e, p.id)}
                            className="srch-card-btn-order"
                          >
                            <ArrowRight className="srch-card-btn-icon" />
                            Order
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .srch-page-root {
          min-height: 100vh;
          background: #ffffff;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* Search bar */
        .srch-bar-wrapper {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(8px);
          border-bottom: 1.5px solid #f3f4f6;
          padding: 10px 12px;
        }
        .srch-bar-form { display: flex; gap: 8px; align-items: center; }
        .srch-input-wrap {
          position: relative; flex: 1; min-width: 0;
        }
        .srch-input-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          width: 16px; height: 16px; color: #9ca3af; pointer-events: none;
        }
        .srch-input {
          width: 100%; height: 40px;
          padding: 0 32px 0 38px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          font-size: 14px; color: #111827;
          background: #fff;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .srch-input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
        .srch-input-clear {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          color: #9ca3af; background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 0;
        }
        .srch-input-clear:hover { color: #111827; }
        .srch-input-clear-icon { width: 14px; height: 14px; }
        .srch-submit-btn {
          height: 40px; padding: 0 16px;
          border-radius: 12px;
          background: #f97316; color: #ffffff;
          border: none; font-size: 14px; font-weight: 700;
          cursor: pointer; flex-shrink: 0;
          transition: background 0.15s;
        }
        .srch-submit-btn:hover { background: #c2410c; }
        .srch-filter-toggle {
          position: relative;
          width: 40px; height: 40px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; cursor: pointer;
          color: #9ca3af; transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .srch-filter-toggle--active {
          background: rgba(249,115,22,0.08);
          border-color: rgba(249,115,22,0.5);
          color: #f97316;
        }
        .srch-filter-toggle-icon { width: 16px; height: 16px; }
        .srch-filter-badge {
          position: absolute; top: -4px; right: -4px;
          background: #f97316; color: #fff;
          font-size: 9px; font-weight: 800;
          width: 16px; height: 16px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }

        /* Filter drawer */
        .srch-filter-drawer {
          background: #fff;
          border-bottom: 1.5px solid #f3f4f6;
          padding: 16px 12px;
        }
        .srch-filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .srch-filter-field { display: flex; flex-direction: column; }
        .srch-filter-field--full { grid-column: 1 / -1; }
        .srch-filter-label {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: #9ca3af; margin-bottom: 6px;
        }
        .srch-filter-input {
          height: 40px;
          padding: 0 12px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          font-size: 14px; color: #111827;
          outline: none; background: #fff;
          transition: border-color 0.15s;
        }
        .srch-filter-input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
        .srch-filter-actions { display: flex; gap: 8px; }
        .srch-filter-apply-btn {
          flex: 1; height: 40px;
          border-radius: 12px;
          background: #f97316; color: #fff;
          border: none; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
        }
        .srch-filter-apply-btn:hover { background: #c2410c; }
        .srch-filter-clear-btn {
          display: flex; align-items: center; gap: 6px;
          height: 40px; padding: 0 16px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background: #fff; color: #374151;
          font-size: 14px; font-weight: 600;
          cursor: pointer; flex-shrink: 0;
          transition: border-color 0.15s;
        }
        .srch-filter-clear-btn:hover { border-color: #d1d5db; }
        .srch-filter-clear-icon { width: 14px; height: 14px; }

        /* Body */
        .srch-body { padding: 12px 12px 40px; display: flex; flex-direction: column; gap: 12px; }

        /* Chips */
        .srch-chips-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .srch-chip {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(249,115,22,0.08); color: #f97316;
          font-size: 11px; font-weight: 700;
          padding: 4px 10px; border-radius: 9999px;
        }
        .srch-chip-remove { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: #f97316; }
        .srch-chip-remove-icon { width: 10px; height: 10px; }

        /* Results bar */
        .srch-results-bar { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .srch-results-info { min-width: 0; }
        .srch-results-title {
          font-size: 14px; font-weight: 800; color: #111827;
          margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .srch-results-count { font-size: 12px; color: #9ca3af; margin: 2px 0 0; }
        .srch-results-controls { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .srch-sort-select {
          height: 32px; padding: 0 8px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: #fff; color: #374151;
          font-size: 12px; cursor: pointer;
          outline: none;
        }
        .srch-sort-select:focus { border-color: #f97316; }
        .srch-clear-all-btn {
          display: flex; align-items: center; gap: 4px;
          height: 32px; padding: 0 10px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: #fff; color: #9ca3af;
          font-size: 12px; cursor: pointer;
          transition: color 0.15s;
        }
        .srch-clear-all-btn:hover { color: #111827; }
        .srch-clear-all-icon { width: 12px; height: 12px; }

        /* Empty state */
        .srch-empty-state {
          display: flex; flex-direction: column; align-items: center;
          padding: 80px 0; color: #9ca3af;
        }
        .srch-empty-icon { width: 56px; height: 56px; color: #e5e7eb; margin-bottom: 12px; }
        .srch-empty-title { font-size: 16px; font-weight: 700; color: #374151; margin: 0 0 6px; }
        .srch-empty-hint { font-size: 14px; color: #9ca3af; margin: 0; }
        .srch-empty-browse-link {
          color: #f97316; font-weight: 600; text-decoration: underline;
          background: none; border: none; cursor: pointer;
        }

        /* Product list */
        .srch-product-list {
          display: flex; flex-direction: column; gap: 12px;
        }
        @media (min-width: 640px) {
          .srch-product-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 768px) {
          .srch-product-list { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .srch-product-list { grid-template-columns: repeat(4, 1fr); }
        }

        /* Product card */
        .srch-product-card {
          display: flex;
          border-radius: 18px;
          background: #fff;
          border: 1.5px solid #f3f4f6;
          overflow: hidden;
          text-decoration: none;
          transition: transform 0.1s, box-shadow 0.2s, border-color 0.2s;
        }
        .srch-product-card:active { transform: scale(0.98); }
        .srch-product-card:hover {
          box-shadow: 0 8px 24px rgba(249,115,22,0.1);
          border-color: rgba(249,115,22,0.25);
        }
        @media (min-width: 640px) {
          .srch-product-card { flex-direction: column; }
        }

        /* Card image */
        .srch-card-image-wrap {
          position: relative;
          width: 112px; height: 112px;
          flex-shrink: 0;
          background: #f9fafb; overflow: hidden;
        }
        @media (min-width: 640px) {
          .srch-card-image-wrap {
            width: 100%; height: auto;
            aspect-ratio: 1 / 1;
          }
        }
        .srch-card-image {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.3s;
        }
        .srch-product-card:hover .srch-card-image { transform: scale(1.05); }
        .srch-card-image-fallback {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .srch-card-fallback-icon { width: 32px; height: 32px; color: #d1d5db; }
        .srch-card-fallback-svg { width: 32px; height: 32px; color: #d1d5db; }
        .srch-card-discount-badge {
          position: absolute; top: 6px; right: 6px;
          background: #ef4444; color: #fff;
          font-size: 9px; font-weight: 800;
          padding: 2px 6px; border-radius: 9999px;
          box-shadow: 0 1px 4px rgba(239,68,68,0.35);
        }
        .srch-card-video-badge {
          position: absolute; bottom: 4px; left: 4px;
          background: rgba(0,0,0,0.6); color: #fff;
          font-size: 9px; font-weight: 700;
          padding: 2px 6px; border-radius: 6px;
        }
        .srch-card-out-of-stock-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
        }
        .srch-card-out-of-stock-label {
          background: rgba(0,0,0,0.75); color: #fff;
          font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 9999px;
        }

        /* Card body */
        .srch-card-body {
          flex: 1; min-width: 0;
          padding: 12px;
          display: flex; flex-direction: column; justify-content: space-between;
          gap: 4px;
        }
        .srch-card-meta { display: flex; flex-direction: column; gap: 2px; }
        .srch-card-brand {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .srch-card-name {
          font-size: 14px; font-weight: 600; color: #111827;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; line-height: 1.4; margin: 0;
        }
        .srch-card-category {
          font-size: 10px; color: rgba(107,114,128,0.6);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .srch-card-pricing {}
        .srch-card-price-row {
          display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px;
        }
        .srch-card-price { font-size: 14px; font-weight: 800; color: #f97316; }
        .srch-card-original-price { font-size: 10px; color: #9ca3af; text-decoration: line-through; }

        /* Card actions */
        .srch-card-actions { display: flex; gap: 6px; }
        .srch-card-btn-cart {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
          padding: 6px 0;
          border-radius: 8px;
          background: rgba(249,115,22,0.08); color: #ea580c;
          border: 1.5px solid rgba(249,115,22,0.2);
          font-size: 11px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
        }
        .srch-card-btn-cart:hover:not(:disabled) { background: rgba(249,115,22,0.16); }
        .srch-card-btn-cart:active { background: rgba(249,115,22,0.25); }
        .srch-card-btn-cart:disabled { opacity: 0.6; cursor: not-allowed; }
        .srch-card-btn-order {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
          padding: 6px 0;
          border-radius: 8px;
          background: #f97316; color: #ffffff;
          border: none; font-size: 11px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
        }
        .srch-card-btn-order:hover { background: #c2410c; }
        .srch-card-btn-order:active { background: #9a3412; }
        .srch-card-btn-icon { width: 12px; height: 12px; }
      `}</style>
    </div>
  );
};

export default Search;
