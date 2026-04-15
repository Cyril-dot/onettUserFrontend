import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { productApi, cartApi } from "@/lib/api";
import { sampleCategories, sampleNewArrivals } from "@/lib/sampleData";
import HomeSkeleton from "@/components/HomeSkeleton";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTilt, useMagnetic } from "@/hooks/useMotion";

// ─── SVG Icon Components ──────────────────────────────────────────────────────
const IconArrowRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const IconSparkles = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" />
    <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" />
  </svg>
);
const IconZap = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconShieldCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const IconTruck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconMessageSquare = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconCamera = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const IconBrain = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.04-4.83A3 3 0 0 1 4.5 9.5a3 3 0 0 1 1.5-2.6A2.5 2.5 0 0 1 9.5 2z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.04-4.83A3 3 0 0 0 19.5 9.5a3 3 0 0 0-1.5-2.6A2.5 2.5 0 0 0 14.5 2z" />
  </svg>
);
const IconSearch = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const IconChevronRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const IconChevronLeft = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const IconClock = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const IconPackage = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const IconCalendarClock = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M16 2v4M8 2v4M3 10h5" />
    <circle cx="17" cy="17" r="4" />
    <path d="M17 15v2.2l1.4 1.4" />
  </svg>
);
const IconShoppingCart = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const IconFlame = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
const IconTag = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconWhatsapp = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.103 1.508 5.836L.057 23.25a.75.75 0 00.916.943l5.638-1.479A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.73 9.73 0 01-4.962-1.355l-.356-.212-3.686.967.984-3.595-.232-.371A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
  </svg>
);
const IconStar = ({ size = 12, filled = true }: { size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconEye = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconHeart = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// ─── Logo Mark ────────────────────────────────────────────────────────────────
function OnettLogoMark({ size = 36 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25,
      background: "linear-gradient(135deg,#E6640A,#cf5208)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", boxShadow: "0 2px 8px rgba(230,100,10,0.35)", flexShrink: 0,
    }}>
      <span style={{ color: "#fff", fontFamily: "'Satoshi', sans-serif", fontWeight: 800, fontSize: size * 0.3, lineHeight: 1, letterSpacing: "-0.5px" }}>ON</span>
      <span style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: size * 0.22, lineHeight: 1, letterSpacing: "0.5px" }}>ETT</span>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface CarouselProduct {
  id: string; name: string; brand: string; price: number;
  primaryImageUrl?: string; categoryName?: string; stockStatus?: string;
  availableInDays?: number | null; isDiscounted?: boolean;
  discountPercentage?: number; discountPrice?: number;
}
interface ProductCardData {
  id: string; name: string; brand?: string; price: number;
  primaryImageUrl?: string; images?: { imageUrl: string }[];
  isDiscounted?: boolean; discountPercentage?: number;
  discountPrice?: number; stock?: number; categoryName?: string; category?: { name: string };
}

function dedupeById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
}

// ─── Sample fallback data ─────────────────────────────────────────────────────
const sampleUpcoming: CarouselProduct[] = [
  { id: "u1", name: "Sony WH-1000XM6", brand: "Sony", price: 1299, stockStatus: "PRE_ORDER", availableInDays: 5, primaryImageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" },
  { id: "u2", name: "Nike Air Max 2026", brand: "Nike", price: 680, stockStatus: "COMING_SOON", availableInDays: 14, primaryImageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
  { id: "u3", name: "MacBook Air M4", brand: "Apple", price: 8499, stockStatus: "PRE_ORDER", availableInDays: 3, primaryImageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
  { id: "u4", name: "Samsung Galaxy S25 Ultra", brand: "Samsung", price: 6499, stockStatus: "COMING_SOON", availableInDays: 21, primaryImageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80" },
  { id: "u5", name: "Dyson V16 Slim", brand: "Dyson", price: 2199, stockStatus: "PRE_ORDER", availableInDays: 7, primaryImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
];
const sampleFlashSale: CarouselProduct[] = [
  { id: "f1", name: "Samsung Galaxy S24 FE", brand: "Samsung", price: 5399, isDiscounted: true, discountPercentage: 35, discountPrice: 3499, primaryImageUrl: "https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=400&q=80" },
  { id: "f2", name: "Sony WH-1000XM5", brand: "Sony", price: 1499, isDiscounted: true, discountPercentage: 40, discountPrice: 899, primaryImageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" },
  { id: "f3", name: "Nike Air Max 270", brand: "Nike", price: 720, isDiscounted: true, discountPercentage: 25, discountPrice: 540, primaryImageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
  { id: "f4", name: "MacBook Air M3", brand: "Apple", price: 8499, isDiscounted: true, discountPercentage: 20, discountPrice: 6799, primaryImageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
  { id: "f5", name: "Kindle Paperwhite 7", brand: "Amazon", price: 499, isDiscounted: true, discountPercentage: 30, discountPrice: 349, primaryImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80" },
];
const sampleNewArrivalsCarousel: CarouselProduct[] = [
  { id: "n1", name: "AirPods Pro 3rd Gen", brand: "Apple", price: 1799, isDiscounted: true, discountPercentage: 10, discountPrice: 1619, primaryImageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80" },
  { id: "n2", name: "Adidas Ultraboost 25", brand: "Adidas", price: 720, primaryImageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80" },
  { id: "n3", name: "Levi's 501 Original", brand: "Levi's", price: 380, primaryImageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80" },
  { id: "n4", name: "Instant Pot Duo 7-in-1", brand: "Instant Pot", price: 550, primaryImageUrl: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80" },
  { id: "n5", name: "GoPro Hero 13 Black", brand: "GoPro", price: 1899, primaryImageUrl: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80" },
  { id: "n6", name: "PS5 Slim Digital", brand: "Sony", price: 3899, primaryImageUrl: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&q=80" },
];

const adBanners = [
  { id: "a1", bg: "linear-gradient(135deg,#0f2044,#1a3a6e)", icon: "💳", title: "MTN MoMo — Pay & save 5%", sub: "Use MoMo at checkout for instant cashback on every order", cta: "Try it" },
  { id: "a2", bg: "linear-gradient(135deg,#064e3b,#065f46)", icon: "🚚", title: "Free Delivery over GHS 200", sub: "DHL Express · Accra & Kumasi same-day available", cta: "Learn more" },
  { id: "a3", bg: "linear-gradient(135deg,#1e1b4b,#312e81)", icon: "🔐", title: "Sell on ONETT — It's free", sub: "Reach thousands of buyers across Ghana instantly", cta: "Start selling" },
];

const aiFeatures = [
  { icon: IconBrain, title: "Smart Picks", desc: "AI learns your taste and curates products you'll love", color: "#E6640A", bg: "rgba(230,100,10,0.1)" },
  { icon: IconCamera, title: "Image Search", desc: "Snap a photo and find matching products instantly", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { icon: IconMessageSquare, title: "AI Advisor", desc: "Chat for style advice, comparisons & budget tips", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  { icon: IconSearch, title: "Smart Search", desc: "Natural language that understands what you mean", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
];

// ── Updated hero image: vibrant online shopping / tech lifestyle ──
const HERO_BG_DESKTOP = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=85";
const HERO_BG_MOBILE  = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=85";

function normaliseToCarousel(p: any): CarouselProduct {
  return {
    id: String(p.id), name: p.name ?? "", brand: p.brand ?? "",
    price: Number(p.price),
    primaryImageUrl: p.primaryImageUrl ?? p.images?.[0]?.imageUrl ?? undefined,
    categoryName: p.categoryName ?? p.category?.name ?? undefined,
    stockStatus: p.stockStatus ?? undefined,
    availableInDays: p.availableInDays ?? null,
    isDiscounted: p.isDiscounted ?? p.discounted ?? false,
    discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : undefined,
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : undefined,
  };
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(productId: string, days: number | null | undefined) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!days || !productId) return;
    const key = `onett_cd_${productId}`;
    let target: number;
    const saved = localStorage.getItem(key);
    if (saved) {
      target = Number(saved);
      if (target < Date.now()) { target = Date.now() + days * 86_400_000; localStorage.setItem(key, String(target)); }
    } else { target = Date.now() + days * 86_400_000; localStorage.setItem(key, String(target)); }
    const tick = () => {
      const d = Math.max(0, target - Date.now());
      setT({ days: Math.floor(d / 86_400_000), hours: Math.floor((d / 3_600_000) % 24), minutes: Math.floor((d / 60_000) % 60), seconds: Math.floor((d / 1_000) % 60) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [days, productId]);
  return t;
}

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ rating = 4.5, count = 42 }: { rating?: number; count?: number }) {
  return (
    <div className="flex items-center gap-1 mt-2">
      <div className="flex items-center">
        {[1,2,3,4,5].map(s => (
          <svg key={s} className={`h-4 w-4 ${s <= Math.round(rating) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.8 4.2a2 2 0 0 0-3.6 0L8.4 8.4l-4.6.3a2 2 0 0 0-1.1 3.5l3.5 3-1 4.4c-.5 1.7 1.4 3 2.9 2.1l3.9-2.3 3.9 2.3c1.5 1 3.4-.4 3-2.1l-1-4.4 3.4-3a2 2 0 0 0-1.1-3.5l-4.6-.3-1.8-4.2Z" />
          </svg>
        ))}
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{rating}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">({count.toLocaleString()})</p>
    </div>
  );
}

// ─── Unified Product Card — fixed 260×480, same style everywhere ──────────────
function FlowbiteProductCard({ product }: { product: CarouselProduct | ProductCardData }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const imageUrl = (product as CarouselProduct).primaryImageUrl
    || ((product as ProductCardData).images?.[0]?.imageUrl)
    || null;

  const hasDiscount = product.isDiscounted && product.discountPrice;
  const displayPrice = hasDiscount ? product.discountPrice! : product.price;
  const inStock = ((product as ProductCardData).stock ?? 1) > 0;

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error("Please sign in to add to cart"); return; }
    setCartLoading(true);
    try { await cartApi.add(product.id, 1); toast.success("Added to cart!"); }
    catch { toast.error("Failed to add to cart"); }
    finally { setCartLoading(false); }
  };

  // stable rating per product id
  const seed = product.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rating = (4.5 + (seed % 10) * 0.05).toFixed(1);
  const reviewCount = 100 + (seed % 1900);

  return (
    <div
      style={{
        width: 260,
        height: 480,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
    >
      {/* ── IMAGE — 190px, fills full width, object-cover ── */}
      <div style={{ width: "100%", height: 190, flexShrink: 0, position: "relative", overflow: "hidden", background: "#f3f4f6" }}>
        <Link to={`/products/${product.id}`} style={{ display: "block", width: "100%", height: "100%" }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", transition: "transform 0.3s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db" }}>
              <IconPackage size={48} />
            </div>
          )}
        </Link>
        {!inStock && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 7 }}>Out of stock</span>
          </div>
        )}
      </div>

      {/* ── BODY — remaining 290px ── */}
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

        {/* Badge row + icons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          {hasDiscount ? (
            <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5 }}>
              Up to {product.discountPercentage}% off
            </span>
          ) : (product as CarouselProduct).stockStatus === "PRE_ORDER" ? (
            <span style={{ background: "#ffedd5", color: "#9a3412", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5 }}>Pre-order</span>
          ) : (product as CarouselProduct).stockStatus === "COMING_SOON" ? (
            <span style={{ background: "#dbeafe", color: "#1e3a8a", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5 }}>Coming Soon</span>
          ) : (
            <span style={{ background: "#dcfce7", color: "#166534", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5 }}>In Stock</span>
          )}
          <div style={{ display: "flex", gap: 4 }}>
            <button
              title="Quick look"
              onClick={() => navigate(`/products/${product.id}`)}
              style={{ width: 30, height: 30, borderRadius: 8, background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
            >
              <IconEye size={15} />
            </button>
            <button
              title="Favourite"
              onClick={() => setWishlisted(w => !w)}
              style={{ width: 30, height: 30, borderRadius: 8, background: wishlisted ? "#fee2e2" : "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: wishlisted ? "#ef4444" : "#6b7280" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Brand */}
        {(product as any).brand && (
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "#9ca3af", marginBottom: 4 }}>
            {(product as any).brand}
          </p>
        )}

        {/* Name — 2 lines max */}
        <Link
          to={`/products/${product.id}`}
          style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", lineHeight: 1.35, textDecoration: "none", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 6 }}
        >
          {product.name}
        </Link>

        {/* Stars */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 6 }}>
          {[1,2,3,4,5].map(s => (
            <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= Math.round(Number(rating)) ? "#fbbf24" : "#e5e7eb"}>
              <path d="M13.8 4.2a2 2 0 0 0-3.6 0L8.4 8.4l-4.6.3a2 2 0 0 0-1.1 3.5l3.5 3-1 4.4c-.5 1.7 1.4 3 2.9 2.1l3.9-2.3 3.9 2.3c1.5 1 3.4-.4 3-2.1l-1-4.4 3.4-3a2 2 0 0 0-1.1-3.5l-4.6-.3-1.8-4.2Z" />
            </svg>
          ))}
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#111", marginLeft: 3 }}>{rating}</span>
          <span style={{ fontSize: 11.5, color: "#9ca3af" }}>({reviewCount})</span>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#6b7280" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Fast Delivery
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#6b7280" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7V6c0-.6.4-1 1-1h11c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1h-1M3 18v-7c0-.6.4-1 1-1h11c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1H4a1 1 0 0 1-1-1Zm8-3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" strokeLinecap="round"/></svg>
            Best Price
          </div>
        </div>

        {/* Price + Cart — always visible at bottom */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", lineHeight: 1 }}>
              GHS {Number(displayPrice).toLocaleString()}
            </p>
            {hasDiscount && (
              <p style={{ fontSize: 11, color: "#d1d5db", textDecoration: "line-through", marginTop: 2 }}>
                GHS {Number(product.price).toLocaleString()}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={cartLoading || !inStock}
            onClick={handleCart}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: inStock ? "#1d4ed8" : "#9ca3af",
              color: "#fff", border: "none", borderRadius: 9,
              padding: "9px 13px", fontSize: 12, fontWeight: 700,
              cursor: inStock ? "pointer" : "not-allowed",
              whiteSpace: "nowrap", flexShrink: 0,
              transition: "background 0.15s",
              opacity: cartLoading ? 0.7 : 1,
            }}
            onMouseEnter={e => inStock && ((e.currentTarget as HTMLButtonElement).style.background = "#1e40af")}
            onMouseLeave={e => inStock && ((e.currentTarget as HTMLButtonElement).style.background = "#1d4ed8")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {!inStock ? "Out of stock" : cartLoading ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Scrollable Product Section (same style as flash sale) ───────────────────
function FlowbiteGridSection({
  title, subtitle, accent, icon: Icon,
  items, seeAllLink
}: {
  title: string; subtitle: string; accent: string; icon: React.ElementType;
  items: (CarouselProduct | ProductCardData)[]; seeAllLink?: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef   = useRef<HTMLDivElement>(null);
  const isInView   = useInView(sectionRef, { once: true, margin: "-80px" });
  const scroll = (dir: number) => trackRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <div ref={sectionRef}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={18} style={{ color: accent }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{title}</div>
            <div style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 2 }}>{subtitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {seeAllLink && (
            <Link to={seeAllLink} style={{ fontSize: 13, fontWeight: 700, color: "#E6640A", textDecoration: "none", marginRight: 4 }}>
              View all →
            </Link>
          )}
          <button onClick={() => scroll(-1)} style={{ width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#374151" }}>
            <IconChevronLeft size={14} />
          </button>
          <button onClick={() => scroll(1)} style={{ width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#374151" }}>
            <IconChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Horizontal scroll track */}
      <div
        ref={trackRef}
        style={{
          display: "flex",
          gap: 14,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          paddingBottom: 4,
          // bleed on mobile
          marginLeft: -14,
          paddingLeft: 14,
          marginRight: -14,
          paddingRight: 14,
        }}
      >
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", transition: { type: "spring", stiffness: 380, damping: 22 } }}
            style={{ flexShrink: 0 }}
          >
            <FlowbiteProductCard product={item} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── HScroll Card (kept for flash sale / upcoming sections) ──────────────────
function HScrollCard({ product, showTimer }: { product: CarouselProduct; showTimer?: boolean }) {
  const navigate = useNavigate();
  const { days, hours, minutes, seconds } = useCountdown(product.id, product.availableInDays);
  const hasDiscount  = product.isDiscounted && product.discountPrice;
  const isPreOrder   = product.stockStatus === "PRE_ORDER";
  const isComingSoon = product.stockStatus === "COMING_SOON";
  const hasStatus    = isPreOrder || isComingSoon;

  const { rotateX, rotateY, tiltProps } = useTilt({
    maxRotateX: 5, maxRotateY: 5,
    springStiffness: 120, springDamping: 25, perspective: 1200,
  });

  return (
    <Link to={`/products/${product.id}`} className="hs-card">
      <motion.div
        {...tiltProps}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", height: "100%", display: "flex", flexDirection: "column" }}
        transition={{ type: "spring", stiffness: 120, damping: 25 }}
      >
        <div className="hs-img">
          {product.primaryImageUrl
            ? <img src={product.primaryImageUrl} alt={product.name} className="hs-img-el" loading="lazy" />
            : <div className="hs-img-ph"><IconPackage size={32} /></div>}
          {hasDiscount && !showTimer && (
            <div className="hs-disc-badge">-{product.discountPercentage}%</div>
          )}
          {showTimer && hasStatus && (
            <div className={`hs-timer-badge${isPreOrder ? " tb-orange" : " tb-blue"}`}>
              <IconClock size={9} />
              {String(days).padStart(2, "0")}d:{String(hours).padStart(2, "0")}h:
              {String(minutes).padStart(2, "0")}m:{String(seconds).padStart(2, "0")}s
            </div>
          )}
        </div>
        <div className="hs-body">
          {hasStatus && (
            <div className={`hs-status${isPreOrder ? " st-orange" : " st-blue"}`}>
              <IconCalendarClock size={9} />
              {isPreOrder ? "Pre-order" : "Coming Soon"}
            </div>
          )}
          <div className="hs-brand">{product.brand}</div>
          <div className="hs-name">{product.name}</div>
          <div className="hs-stars">
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ color: s <= 4 ? "#f59e0b" : "#e2e0dc" }}>
                <IconStar size={9} filled={s <= 4} />
              </span>
            ))}
            <span className="hs-rating-count">(42)</span>
          </div>
          <div className="hs-price-row">
            {hasDiscount ? (
              <>
                <span className="hs-price">GHS {product.discountPrice?.toLocaleString()}</span>
                <span className="hs-price-old">GHS {product.price?.toLocaleString()}</span>
              </>
            ) : (
              <span className="hs-price-plain">GHS {product.price?.toLocaleString()}</span>
            )}
          </div>
          <div className="p-actions">
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/products/${product.id}`); }}
              className="p-btn-order w-full"
            >
              <IconShoppingCart size={11} />Add to cart
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── HScroll Section ──────────────────────────────────────────────────────────
function HScrollSection({ title, subtitle, accent, icon: Icon, items, showTimer, badge }: {
  title: string; subtitle: string; accent: string; icon: React.ElementType;
  items: CarouselProduct[]; showTimer?: boolean; badge?: React.ReactNode;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef   = useRef<HTMLDivElement>(null);
  const isInView   = useInView(sectionRef, { once: true, margin: "-80px" });
  const scroll = (dir: number) => trackRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  return (
    <div className="hs-section-inner" ref={sectionRef}>
      <div className="hs-header">
        <div className="hs-header-left">
          <motion.div
            className="hs-icon"
            style={{ background: `${accent}18` }}
            initial={{ scale: 0, rotate: -10 }}
            animate={isInView ? { scale: 1, rotate: 0 } : {}}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Icon size={16} style={{ color: accent }} />
          </motion.div>
          <div>
            <motion.div
              style={{ display: "flex", alignItems: "center", gap: 8 }}
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <span className="hs-title">{title}</span>
              {badge}
            </motion.div>
            <motion.div
              className="hs-sub"
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {subtitle}
            </motion.div>
          </div>
        </div>
        <div className="hs-nav-btns">
          <button className="hs-nav-btn" onClick={() => scroll(-1)}><IconChevronLeft size={14} /></button>
          <button className="hs-nav-btn" onClick={() => scroll(1)}><IconChevronRight size={14} /></button>
        </div>
      </div>
      <div ref={trackRef} className="hs-track">
        {items.map((item, i) => {
          const fromTop = i % 2 === 0;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: fromTop ? -50 : 50, scale: 0.88, rotate: fromTop ? -3 : 3 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.55, delay: Math.min(i * 0.07, 0.5), ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 20 } }}
            >
              <HScrollCard product={item} showTimer={showTimer} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Ad Banner ────────────────────────────────────────────────────────────────
function AdBanner({ ad }: { ad: typeof adBanners[0] }) {
  return (
    <div className="ad-banner" style={{ background: ad.bg }}>
      <span className="ad-label">Ad</span>
      <div className="ad-icon">{ad.icon}</div>
      <div className="ad-body">
        <div className="ad-title">{ad.title}</div>
        <div className="ad-sub">{ad.sub}</div>
      </div>
      <button className="ad-cta">{ad.cta}</button>
    </div>
  );
}

// ─── Welcome Popup ────────────────────────────────────────────────────────────
const WELCOME_KEY = "onett_welcome_v5";

function WelcomePopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(WELCOME_KEY)) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(WELCOME_KEY, "1");
  }, []);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  if (!visible) return null;

  const perks = [
    { icon: IconBrain,       label: "AI-Powered Picks", desc: "Curated just for you" },
    { icon: IconShieldCheck, label: "Secure Checkout",  desc: "Encrypted & trusted" },
    { icon: IconTruck,       label: "Fast Delivery",    desc: "Across all of Ghana" },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(5,8,18,0.85)",
            backdropFilter: "blur(8px) saturate(0.6)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <motion.div
            key="popup-sheet"
            initial={{ opacity: 0, y: 72 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 56 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            className="popup-sheet"
          >
            <div className="popup-hero-strip">
              <div className="popup-hero-overlay" />
              <div className="popup-logo-wrap">
                <div className="popup-logo-box">
                  <span className="popup-logo-on">ON</span>
                  <span className="popup-logo-ett">ETT</span>
                </div>
              </div>
              <button onClick={close} className="popup-close-btn">
                <IconX size={13} />
              </button>
            </div>
            <div className="popup-body">
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <span className="popup-badge"><IconSparkles size={10} />Welcome to ONETT</span>
              </div>
              <h2 className="popup-h2">
                Shop Smarter,<br />
                <span style={{ color: "#E6640A" }}>Every Day.</span>
              </h2>
              <p className="popup-sub">
                Ghana's AI-powered marketplace.<br />
                Personalized picks & unbeatable deals.
              </p>
              <div className="popup-perks">
                {perks.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="popup-perk">
                    <div className="popup-perk-icon">
                      <Icon size={16} style={{ color: "#E6640A" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="popup-perk-label">{label}</div>
                      <div className="popup-perk-desc">{desc}</div>
                    </div>
                    <div className="popup-perk-arrow">
                      <IconChevronRight size={10} />
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/search?keyword=" onClick={close} className="popup-cta-btn">
                Start Shopping <IconArrowRight size={16} />
              </Link>
              <button onClick={close} className="popup-skip-btn">Maybe later</button>
            </div>
            <div className="popup-safe-bottom" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Injected CSS ─────────────────────────────────────────────────────────────
const MOBILE_STYLES = `
  * { box-sizing: border-box; }
  button, a { -webkit-tap-highlight-color: transparent; }

  .onett-page { background: #f9fafb; }
  @media (prefers-color-scheme: dark) { .onett-page { background: #111827; } }

  .sdiv { height: 12px; }
  @media (min-width: 640px) { .sdiv { height: 16px; } }

  .pg {
    padding-left: max(14px, env(safe-area-inset-left));
    padding-right: max(14px, env(safe-area-inset-right));
    max-width: 1280px; margin: 0 auto; width: 100%;
  }
  @media (min-width: 640px)  { .pg { padding-left: 24px; padding-right: 24px; } }
  @media (min-width: 1024px) { .pg { padding-left: 40px; padding-right: 40px; } }

  /* ── SECTION CARD WRAPPER ── */
  .section-card {
    background: #fff;
    border-radius: 20px;
    border: 1px solid rgba(0,0,0,0.07);
    padding: 24px 16px 28px;
    margin: 0 12px;
  }
  @media (prefers-color-scheme: dark) { .section-card { background: #1f2937; border-color: rgba(255,255,255,0.07); } }
  @media (min-width: 640px) { .section-card { border-radius: 24px; padding: 28px 24px 32px; margin: 0 16px; } }
  @media (min-width: 1024px) { .section-card { margin: 0; } }

  /* ── CATEGORIES ── */
  .cats-wrap { padding: 8px 0; }
  .cats-scroll {
    display: flex; gap: 10px;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    scrollbar-width: none; padding-bottom: 4px;
    margin-left: -14px; padding-left: 14px;
    margin-right: -14px; padding-right: 14px;
  }
  @media (min-width: 640px) {
    .cats-scroll { margin-left: 0; padding-left: 0; margin-right: 0; padding-right: 0; flex-wrap: wrap; overflow-x: visible; }
  }
  .cats-scroll::-webkit-scrollbar { display: none; }
  .cat-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; min-width: 64px; text-decoration: none; }
  .cat-icon-box {
    width: 58px; height: 58px; border-radius: 16px;
    background: #fff; border: 1px solid rgba(0,0,0,0.08);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  .cat-item:active .cat-icon-box { transform: scale(0.93); }
  @media (min-width: 640px) { .cat-icon-box { width: 66px; height: 66px; } }
  .cat-icon-img { width: 100%; height: 100%; object-fit: cover; }
  .cat-lbl { font-size: 10.5px; font-weight: 600; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 66px; color: #111; }
  @media (prefers-color-scheme: dark) { .cat-lbl { color: #f3f4f6; } }

  /* ── HSCROLL ── */
  .hs-section { width: 100%; padding: 8px 0; }
  .hs-section-inner { width: 100%; }
  .hs-header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 14px; }
  .hs-header-left { display: flex; align-items: center; gap: 10px; }
  .hs-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .hs-title { font-family: 'Satoshi', sans-serif; font-size: 15px; font-weight: 800; color: #111; letter-spacing: -0.3px; }
  @media (prefers-color-scheme: dark) { .hs-title { color: #f9fafb; } }
  .hs-sub { font-size: 11.5px; color: #888; margin-top: 1px; }
  .hs-nav-btns { display: flex; gap: 6px; }
  .hs-nav-btn { width: 32px; height: 32px; border-radius: 50%; background: #f3f4f6; border: 1px solid rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; cursor: pointer; color: #111; transition: background 0.15s; }
  .hs-nav-btn:hover { background: rgba(0,0,0,0.08); }
  .hs-track {
    display: flex; gap: 10px; align-items: stretch;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    scrollbar-width: none; padding-bottom: 4px;
    margin-left: -14px; padding-left: 14px;
    margin-right: -14px; padding-right: 14px;
  }
  @media (min-width: 640px) { .hs-track { margin-left: 0; padding-left: 0; margin-right: 0; padding-right: 0; gap: 12px; } }
  .hs-track::-webkit-scrollbar { display: none; }
  #flash-track::-webkit-scrollbar { display: none; }
  .prod-track::-webkit-scrollbar { display: none; }

  .hs-card {
    width: 168px; flex-shrink: 0;
    background: #fff; border: 1px solid rgba(0,0,0,0.09);
    border-radius: 16px; overflow: hidden;
    text-decoration: none;
    display: flex; flex-direction: column;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    transition: box-shadow 0.2s;
  }
  @media (prefers-color-scheme: dark) { .hs-card { background: #1f2937; border-color: rgba(255,255,255,0.07); } }
  .hs-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.10); }
  @media (max-width: 374px) { .hs-card { width: 152px; } }
  @media (min-width: 640px) { .hs-card { width: 200px; } }

  .hs-img { width: 100%; height: 152px; position: relative; overflow: hidden; background: #f5f4f2; flex-shrink: 0; }
  .hs-img-el { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; width: 100%; height: 100%; transition: transform 0.35s ease; }
  .hs-card:hover .hs-img-el { transform: scale(1.05); }
  .hs-img-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #c8c5c0; }
  .hs-disc-badge { position: absolute; top: 8px; left: 8px; background: #ef4444; color: #fff; font-size: 9.5px; font-weight: 800; padding: 3px 7px; border-radius: 6px; }
  .hs-timer-badge { position: absolute; bottom: 7px; left: 7px; background: rgba(0,0,0,0.72); color: #fff; font-size: 9px; font-weight: 700; padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums; }
  .tb-orange { background: rgba(230,100,10,0.92) !important; }
  .tb-blue   { background: rgba(59,130,246,0.92) !important; }

  .hs-body { padding: 11px 11px 12px; display: flex; flex-direction: column; gap: 0; flex: 1; }
  .hs-status { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 5px; letter-spacing: 0.3px; width: fit-content; margin-bottom: 6px; }
  .st-orange { background: rgba(230,100,10,0.1); color: #E6640A; }
  .st-blue   { background: rgba(59,130,246,0.1); color: #3b82f6; }
  .hs-brand { font-size: 9.5px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px; }
  .hs-name { font-size: 12px; font-weight: 600; color: #111; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 32px; margin-bottom: 6px; }
  @media (prefers-color-scheme: dark) { .hs-name { color: #f9fafb; } }
  .hs-stars { display: flex; align-items: center; gap: 2px; margin-bottom: 6px; }
  .hs-rating-count { font-size: 9.5px; color: #bbb; margin-left: 3px; }
  .hs-price-row { display: flex; align-items: baseline; gap: 5px; margin-bottom: 8px; }
  .hs-price       { font-size: 13.5px; font-weight: 800; color: #E6640A; letter-spacing: -0.3px; }
  .hs-price-old   { font-size: 10px; color: #c0b8b0; text-decoration: line-through; }
  .hs-price-plain { font-size: 13.5px; font-weight: 800; color: #111; letter-spacing: -0.3px; }
  @media (prefers-color-scheme: dark) { .hs-price-plain { color: #f9fafb; } }

  /* ── SHARED ACTION BUTTONS ── */
  .p-actions { display: flex; gap: 5px; margin-top: auto; }
  .p-btn-cart { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; background: #f3f4f6; border: 1px solid rgba(0,0,0,0.09); color: #333; font-size: 10.5px; font-weight: 700; padding: 7px 8px; border-radius: 9px; cursor: pointer; white-space: nowrap; transition: background 0.15s; }
  .p-btn-cart:hover { background: rgba(0,0,0,0.08); }
  .p-btn-cart:disabled { opacity: 0.5; cursor: not-allowed; }
  .p-btn-order { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; background: #E6640A; border: none; color: #fff; font-size: 10.5px; font-weight: 700; padding: 7px 8px; border-radius: 9px; cursor: pointer; white-space: nowrap; transition: background 0.15s; }
  .p-btn-order:hover { background: #d45a09; }

  /* ── AD BANNER ── */
  .ad-banner { border-radius: 18px; padding: 16px; display: flex; align-items: center; gap: 12px; position: relative; overflow: hidden; }
  @media (min-width: 640px) { .ad-banner { padding: 20px 24px; border-radius: 22px; gap: 16px; } }
  .ad-icon { font-size: 26px; flex-shrink: 0; }
  .ad-body { flex: 1; min-width: 0; }
  .ad-title { font-family: 'Satoshi', sans-serif; font-size: clamp(13px,3.5vw,15px); font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ad-sub { font-size: clamp(11px,2.8vw,13px); color: rgba(255,255,255,0.6); margin-top: 2px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .ad-label { position: absolute; top: 8px; right: 8px; font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.08); border-radius: 4px; padding: 2px 5px; letter-spacing: 0.5px; }
  .ad-cta { flex-shrink: 0; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.22); color: #fff; font-size: 12px; font-weight: 700; padding: 8px 14px; border-radius: 10px; cursor: pointer; white-space: nowrap; }
  .ad-dots { display: flex; justify-content: center; gap: 6px; margin-top: 10px; }
  .ad-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(0,0,0,0.15); cursor: pointer; transition: background 0.2s, transform 0.2s; }
  .ad-dot.active { background: #E6640A; transform: scale(1.3); }

  /* ── AI FEATURES ── */
  .ai-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
  @media (min-width: 900px) { .ai-grid { grid-template-columns: repeat(4,1fr); } }
  .ai-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 15px 13px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  @media (prefers-color-scheme: dark) { .ai-card { background: #1f2937; border-color: rgba(255,255,255,0.07); } }
  .ai-card-icon { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
  .ai-card-title { font-family: 'Satoshi', sans-serif; font-size: 13.5px; font-weight: 700; color: #111; margin-bottom: 4px; }
  @media (prefers-color-scheme: dark) { .ai-card-title { color: #f9fafb; } }
  .ai-card-desc { font-size: 11.5px; color: #666; line-height: 1.55; }

  /* ── TRUST GRID ── */
  .trust-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
  @media (min-width: 900px) { .trust-grid { grid-template-columns: repeat(4,1fr); } }
  .trust-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 15px; padding: 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  @media (prefers-color-scheme: dark) { .trust-card { background: #1f2937; border-color: rgba(255,255,255,0.07); } }
  @media (min-width: 640px) { .trust-card { padding: 18px 16px; flex-direction: row; align-items: flex-start; gap: 12px; } }
  .trust-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(230,100,10,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .trust-title { font-size: 13px; font-weight: 700; color: #111; }
  @media (prefers-color-scheme: dark) { .trust-title { color: #f9fafb; } }
  .trust-desc { font-size: 11.5px; color: #666; margin-top: 2px; line-height: 1.5; }

  /* ── CTA BANNER ── */
  .cta-banner { position: relative; overflow: hidden; border-radius: 22px; background: linear-gradient(135deg,#0d0d0d 0%,#1a0800 60%,#2d1000 100%); border: 1px solid rgba(230,100,10,0.18); padding: 28px 20px; display: flex; flex-direction: column; gap: 0; }
  @media (min-width: 640px) { .cta-banner { padding: 40px 36px; flex-direction: row; align-items: center; justify-content: space-between; } }
  .cta-content { position: relative; z-index: 1; }
  .cta-h2 { font-family: 'Satoshi', sans-serif; font-size: clamp(22px,6vw,32px); font-weight: 800; color: #fff; line-height: 1.2; letter-spacing: -0.5px; margin: 0 0 10px; }
  .cta-p { font-size: clamp(13px,3.5vw,14.5px); color: rgba(255,255,255,0.5); line-height: 1.65; margin: 0 0 20px; max-width: 380px; }
  .cta-btns { display: flex; gap: 10px; flex-wrap: wrap; }
  .cta-btn-w, .cta-btn-g { display: inline-flex; align-items: center; gap: 7px; padding: 13px 22px; border-radius: 12px; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 14px; text-decoration: none; cursor: pointer; }
  .cta-btn-w { background: #E6640A; color: #fff; }
  .cta-btn-g { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); color: #fff; }
  .cta-logo { display: none; }
  @media (min-width: 640px) { .cta-logo { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; position: relative; z-index: 1; } }
  .cta-logo-box { width: 64px; height: 64px; border-radius: 18px; background: linear-gradient(135deg,#E6640A,#cf5208); display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 8px 28px rgba(230,100,10,0.4); }
  .cta-logo-on  { font-family: 'Satoshi', sans-serif; font-weight: 900; font-size: 22px; color: #fff; line-height: 1; letter-spacing: -1px; }
  .cta-logo-ett { font-family: 'Satoshi', sans-serif; font-weight: 700; font-size: 11px; color: rgba(255,255,255,0.55); line-height: 1; letter-spacing: 2px; }
  .cta-logo-name { font-family: 'Satoshi', sans-serif; font-weight: 800; font-size: 16px; color: rgba(255,255,255,0.7); letter-spacing: -0.5px; }
  .cta-glow { position: absolute; top: -60px; right: -60px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle,rgba(230,100,10,0.18) 0%,transparent 70%); pointer-events: none; }

  /* ── HERO ── */
  @media (max-width: 639px) {
    .hero { min-height: 85dvh !important; }
    .hero-inner { padding-top: 80px !important; padding-bottom: 48px !important; }
    .hero-h1 { font-size: clamp(32px,9vw,48px) !important; }
    .hero-p { font-size: 14px !important; max-width: 90% !important; }
    .hero-btns { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
    .h-btn-primary, .h-btn-ghost { width: 100% !important; justify-content: center !important; padding: 15px 20px !important; font-size: 15px !important; }
  }

  /* ── POPUP ── */
  .popup-sheet { position: relative; width: 100%; max-width: 420px; border-radius: 26px 26px 0 0; overflow: hidden; background: #0f0f0f; border: 1px solid rgba(255,255,255,0.08); border-bottom: none; box-shadow: 0 -24px 60px rgba(0,0,0,0.55); max-height: 92dvh; overflow-y: auto; }
  @media (min-width: 600px) { .popup-sheet { border-radius: 26px; border-bottom: 1px solid rgba(255,255,255,0.08); max-height: 90vh; } }
  .popup-hero-strip { width: 100%; height: 138px; background: linear-gradient(135deg, #1c0900 0%, #3d1500 45%, #b84d08 100%); position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .popup-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(15,15,15,0.25) 0%, rgba(15,15,15,0.92) 100%); }
  .popup-logo-wrap { position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; }
  .popup-logo-box { width: 62px; height: 62px; border-radius: 18px; background: linear-gradient(135deg, #E6640A, #c14f06); display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 0 8px rgba(230,100,10,0.16), 0 12px 40px rgba(230,100,10,0.45); }
  .popup-logo-on  { font-family: 'Satoshi', sans-serif; font-weight: 900; font-size: 21px; color: #fff; line-height: 1; letter-spacing: -1px; }
  .popup-logo-ett { font-family: 'Satoshi', sans-serif; font-weight: 700; font-size: 10px; color: rgba(255,255,255,0.6); line-height: 1; letter-spacing: 2px; }
  .popup-close-btn { position: absolute; top: 12px; right: 12px; z-index: 10; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.12); cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.7); transition: background 0.15s; }
  .popup-body { padding: 20px 20px 22px; }
  @media (min-width: 400px) { .popup-body { padding: 22px 24px 24px; } }
  .popup-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(230,100,10,0.12); border: 1px solid rgba(230,100,10,0.22); color: #fb923c; font-size: 10.5px; font-weight: 700; padding: 4px 12px; border-radius: 99px; }
  .popup-h2 { text-align: center; font-family: 'Satoshi', sans-serif; font-size: clamp(22px,6vw,26px); font-weight: 800; color: #fff; line-height: 1.18; margin: 10px 0 8px; letter-spacing: -0.5px; }
  .popup-sub { text-align: center; font-size: 13px; color: rgba(255,255,255,0.38); line-height: 1.65; margin: 0 0 18px; }
  .popup-perks { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
  .popup-perk { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 11px 13px; }
  .popup-perk-icon { width: 38px; height: 38px; border-radius: 11px; background: rgba(230,100,10,0.14); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .popup-perk-label { font-size: 13px; font-weight: 700; color: #fff; }
  .popup-perk-desc { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }
  .popup-perk-arrow { width: 22px; height: 22px; border-radius: 50%; background: rgba(230,100,10,0.16); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: rgba(255,255,255,0.55); margin-left: auto; }
  .popup-cta-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: #E6640A; color: #fff; border-radius: 14px; padding: 15px 0; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: clamp(14px,4vw,15px); text-decoration: none; margin-bottom: 10px; }
  .popup-cta-btn:hover { background: #d45a09; }
  .popup-skip-btn { display: block; width: 100%; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); background: transparent; border: none; cursor: pointer; padding: 6px 0; }
  .popup-safe-bottom { height: env(safe-area-inset-bottom, 0px); }

  /* ── live / shimmer badges ── */
  .live-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.22); color: #ef4444; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 5px; letter-spacing: 0.5px; }
  .live-dot { width: 5px; height: 5px; border-radius: 50%; background: #ef4444; animation: live-pulse 1.2s ease-in-out infinite; }
  @keyframes live-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
  .shimmer-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.22); color: #8b5cf6; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 5px; letter-spacing: 0.3px; }

  .flash-section-header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 14px; }
  .flash-section-left   { display: flex; align-items: center; gap: 10px; }

  /* ── FOOTER ── */
  .footer { background: #f9fafb; border-top: 1px solid rgba(0,0,0,0.08); }
  @media (prefers-color-scheme: dark) { .footer { background: #111827; } }
  .footer-inner { max-width: 1280px; margin: 0 auto; padding: 36px 16px 24px; }
  @media (min-width: 640px)  { .footer-inner { padding: 48px 24px 28px; } }
  @media (min-width: 1024px) { .footer-inner { padding: 56px 40px 32px; } }
  .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px 20px; }
  @media (min-width: 640px) { .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px; } }
  .footer-brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .footer-brand-name { font-family: 'Satoshi', sans-serif; font-weight: 800; font-size: 20px; color: #111; letter-spacing: -0.5px; }
  @media (prefers-color-scheme: dark) { .footer-brand-name { color: #f9fafb; } }
  .footer-brand-name em { color: #E6640A; font-style: normal; }
  .footer-tagline { font-size: 13px; color: #666; line-height: 1.6; margin: 0 0 12px; }
  .footer-wa { display: inline-flex; align-items: center; gap: 7px; background: #25D366; color: #fff; font-size: 13px; font-weight: 700; padding: 9px 16px; border-radius: 10px; text-decoration: none; }
  .footer-col { grid-column: span 1; }
  .footer-col:first-child { grid-column: 1 / -1; }
  @media (min-width: 640px) { .footer-col:first-child { grid-column: span 1; } }
  .footer-col-title { font-family: 'Satoshi', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; color: #666; margin-bottom: 12px; }
  .footer-links { display: flex; flex-direction: column; gap: 8px; }
  .footer-link { font-size: 13.5px; color: #111; text-decoration: none; opacity: 0.75; transition: opacity 0.15s; }
  @media (prefers-color-scheme: dark) { .footer-link { color: #e5e7eb; } }
  .footer-link:hover { opacity: 1; }
  .footer-bottom { border-top: 1px solid rgba(0,0,0,0.08); margin-top: 28px; padding-top: 20px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  @media (min-width: 640px) { .footer-bottom { flex-direction: row; justify-content: space-between; } }
  .footer-copy { font-size: 12px; color: #888; margin: 0; }
`;

function InjectStyles() {
  useEffect(() => {
    const id = "onett-mobile-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = MOBILE_STYLES;
      document.head.appendChild(el);
    }
  }, []);
  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const Index = () => {
  const [categories,           setCategories]           = useState<any[]>([]);
  const [newArrivals,          setNewArrivals]          = useState<ProductCardData[]>([]);
  const [newArrivalsCarousel,  setNewArrivalsCarousel]  = useState<CarouselProduct[]>([]);
  const [upcomingCarousel,     setUpcomingCarousel]     = useState<CarouselProduct[]>([]);
  const [flashSale,            setFlashSale]            = useState<CarouselProduct[]>([]);
  const [adIdx,                setAdIdx]                = useState(0);
  const [loading,              setLoading]              = useState(true);

  const magnet1 = useMagnetic({ strength: 0.3 });
  const magnet2 = useMagnetic({ strength: 0.3 });

  useEffect(() => {
    const fetchAll = async () => {
      const [homeResult, upcomingResult] = await Promise.allSettled([
        productApi.getHome(),
        productApi.getUpcoming(),
      ]);

      if (homeResult.status === "fulfilled" && homeResult.value) {
        const home = homeResult.value;
        const rawArrivals = Array.isArray(home.newArrivals) ? home.newArrivals : [];
        const arrivals: ProductCardData[] = rawArrivals.map((p: any) => ({
          ...p, id: String(p.id),
          isDiscounted: p.isDiscounted ?? p.discounted ?? false,
          discountPrice: p.discountPrice != null ? Number(p.discountPrice) : undefined,
          discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : undefined,
        }));
        const dedupedArrivals = dedupeById(arrivals);
        setCategories(Array.isArray(home.categories) ? home.categories : []);
        setNewArrivals(dedupedArrivals);
        const carouselArrivals = dedupeById(dedupedArrivals.map(normaliseToCarousel));
        setNewArrivalsCarousel(carouselArrivals.length > 0 ? carouselArrivals : sampleNewArrivalsCarousel);
        const discounted = dedupeById(
          dedupedArrivals.filter(p => p.isDiscounted && p.discountPrice).map(normaliseToCarousel)
        );
        setFlashSale(discounted.length > 0 ? discounted : sampleFlashSale);
      } else {
        setCategories(sampleCategories);
        setNewArrivals(sampleNewArrivals.map((p: any) => ({ ...p, id: String(p.id) })));
        setNewArrivalsCarousel(sampleNewArrivalsCarousel);
        setFlashSale(sampleFlashSale);
      }

      if (upcomingResult.status === "fulfilled" && upcomingResult.value) {
        const upcoming = upcomingResult.value;
        const pre  = Array.isArray(upcoming.preOrder)   ? upcoming.preOrder.map(normaliseToCarousel)   : [];
        const soon = Array.isArray(upcoming.comingSoon) ? upcoming.comingSoon.map(normaliseToCarousel) : [];
        const merged = dedupeById([...pre, ...soon]);
        setUpcomingCarousel(merged.length > 0 ? merged : sampleUpcoming);
      } else {
        setUpcomingCarousel(sampleUpcoming);
      }

      setLoading(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAdIdx(i => (i + 1) % adBanners.length), 5000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <HomeSkeleton />;

  return (
    <>
      <InjectStyles />
      <div className="onett-page">
        <WelcomePopup />
        <Navbar />

        {/* ── HERO — updated background image ── */}
        <section
          className="hero relative overflow-hidden"
          style={{ minHeight: "92dvh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
        >
          {/* Desktop bg */}
          <img
            src={HERO_BG_DESKTOP}
            alt="Shopping"
            className="absolute inset-0 h-full w-full object-cover object-center hidden sm:block"
            loading="eager"
          />
          {/* Mobile bg */}
          <img
            src={HERO_BG_MOBILE}
            alt="Shopping"
            className="absolute inset-0 h-full w-full object-cover object-center block sm:hidden"
            loading="eager"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content */}
          <div
            className="relative z-10 pg hero-inner"
            style={{ paddingTop: 96, paddingBottom: 64 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="hero-badge inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm mb-5"
              >
                <IconSparkles size={13} />
                AI-Powered · Ghana's Smartest Shop
              </div>
              <h1
                className="hero-h1 font-extrabold text-white mb-4"
                style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "clamp(40px,8vw,72px)", lineHeight: 1.08, letterSpacing: "-1.5px", maxWidth: 700 }}
              >
                Shop Smarter<br />with <em style={{ color: "#E6640A", fontStyle: "normal" }}>ONETT.</em>
              </h1>
              <p
                className="hero-p text-white/70 mb-8"
                style={{ fontSize: "clamp(15px,2.5vw,18px)", lineHeight: 1.65, maxWidth: 480 }}
              >
                Personalized picks, snap-to-search, budget advice, and unbeatable deals — all in one place.
              </p>
              <div
                className="hero-btns flex gap-3"
                style={{ flexWrap: "wrap" }}
              >
                <motion.div style={{ x: magnet1.x, y: magnet1.y }}>
                  <Link
                    to="/search?keyword="
                    className="h-btn-primary inline-flex items-center gap-2 rounded-xl bg-[#E6640A] px-6 py-3.5 text-base font-bold text-white transition-all hover:bg-[#d45a09]"
                    {...magnet1.magneticProps}
                  >
                    Start Shopping <IconArrowRight size={16} />
                  </Link>
                </motion.div>
                <motion.div style={{ x: magnet2.x, y: magnet2.y }}>
                  <Link
                    to="/ai-assistant"
                    className="h-btn-ghost inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-base font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                    {...magnet2.magneticProps}
                  >
                    <IconSparkles size={14} />Try AI Assistant
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CATEGORIES ── */}
        <div className="cats-wrap">
          <div className="pg">
            <div className="section-card">
              <div className="mb-4 flex items-end justify-between sm:flex md:mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ background: "rgba(230,100,10,0.08)" }}>
                    <IconTag size={18} style={{ color: "#E6640A" }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Browse Categories</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Find exactly what you're looking for</p>
                  </div>
                </div>
                <Link to="/categories" className="flex items-center gap-1 text-sm font-bold text-primary-700 hover:text-primary-800 dark:text-primary-400">
                  View all <IconChevronRight size={14} />
                </Link>
              </div>
              <div className="cats-scroll">
                {(categories.length > 0 ? categories : sampleCategories).slice(0, 12).map((cat: any) => (
                  <Link key={cat.id} to={`/categories/${cat.slug}`} className="cat-item">
                    <div className="cat-icon-box">
                      {cat.icon?.imageUrl
                        ? <img src={cat.icon.imageUrl} alt={cat.name} className="cat-icon-img" loading="lazy" />
                        : <IconPackage size={22} />}
                    </div>
                    <span className="cat-lbl">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sdiv" />

        {/* ── FLASH SALE — horizontal scroll ── */}
        {flashSale.length > 0 && (
          <div className="hs-section">
            <div className="pg">
              <div className="section-card">
                <div className="flash-section-header">
                  <div className="flash-section-left">
                    <div className="hs-icon" style={{ background: "rgba(239,68,68,0.08)" }}>
                      <IconFlame size={16} style={{ color: "#ef4444" }} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="hs-title">Flash Sale</span>
                        <div className="live-badge"><div className="live-dot" />LIVE</div>
                      </div>
                      <div className="hs-sub">Limited time — grab it before it's gone</div>
                    </div>
                  </div>
                  <div className="hs-nav-btns">
                    <button className="hs-nav-btn" onClick={() => document.getElementById("flash-track")?.scrollBy({ left: -260, behavior: "smooth" })}>
                      <IconChevronLeft size={14} />
                    </button>
                    <button className="hs-nav-btn" onClick={() => document.getElementById("flash-track")?.scrollBy({ left: 260, behavior: "smooth" })}>
                      <IconChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <div id="flash-track" style={{ display: "flex", gap: 14, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", paddingBottom: 4 }}>
                  {flashSale.map(item => (
                    <motion.div
                      key={item.id}
                      style={{ flexShrink: 0 }}
                      whileHover={{ y: -4, transition: { type: "spring", stiffness: 380, damping: 22 } }}
                    >
                      <FlowbiteProductCard product={item} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="sdiv" />

        {/* ── AD BANNER ── */}
        <div className="pg">
          <AnimatePresence mode="wait">
            <motion.div
              key={adBanners[adIdx].id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.28 }}
            >
              <AdBanner ad={adBanners[adIdx]} />
            </motion.div>
          </AnimatePresence>
          <div className="ad-dots">
            {adBanners.map((_, i) => (
              <div key={i} className={`ad-dot${i === adIdx ? " active" : ""}`} onClick={() => setAdIdx(i)} />
            ))}
          </div>
        </div>

        <div className="sdiv" />

        {/* ── NEW ARRIVALS — Flowbite 4-col grid ── */}
        {newArrivalsCarousel.length > 0 && (
          <section className="py-6">
            <div className="pg">
              <FlowbiteGridSection
                title="New Arrivals"
                subtitle="Fresh products added this week"
                accent="#f59e0b"
                icon={IconZap}
                items={newArrivalsCarousel}
                seeAllLink="/search?keyword=new"
              />
            </div>
          </section>
        )}

        <div className="sdiv" />

        {/* ── UPCOMING DROPS — horizontal scroll with timers ── */}
        {upcomingCarousel.length > 0 && (
          <div className="hs-section">
            <div className="pg">
              <div className="section-card">
                <HScrollSection
                  title="Upcoming Drops"
                  subtitle="Pre-order & coming soon — with live countdowns"
                  accent="#8b5cf6"
                  icon={IconCalendarClock}
                  items={upcomingCarousel}
                  showTimer
                  badge={
                    <span className="shimmer-badge">
                      <IconClock size={9} />Live timer
                    </span>
                  }
                />
              </div>
            </div>
          </div>
        )}

        <div className="sdiv" />

        {/* ── JUST DROPPED — Flowbite 4-col grid ── */}
        {newArrivals.length > 0 && (
          <section className="py-6">
            <div className="pg">
              <FlowbiteGridSection
                title="Just Dropped"
                subtitle="Browse all the latest products"
                accent="#E6640A"
                icon={IconFlame}
                items={dedupeById(newArrivals.map(p => ({
                  ...normaliseToCarousel(p),
                  stock: (p as ProductCardData).stock,
                })))}
                seeAllLink="/search?keyword="
              />
            </div>
          </section>
        )}

        <div className="sdiv" />

        {/* ── AI FEATURES ── */}
        <div className="pg">
          <div className="section-card">
            <div className="mb-4 flex items-center gap-3 md:mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ background: "rgba(230,100,10,0.08)" }}>
                <IconSparkles size={18} style={{ color: "#E6640A" }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Shopping, Reimagined</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Powered by AI</p>
              </div>
            </div>
            <div className="ai-grid">
              {aiFeatures.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="ai-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5, scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 18 } }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="ai-card-icon" style={{ background: f.bg }}>
                    <f.icon size={17} style={{ color: f.color }} />
                  </div>
                  <div className="ai-card-title">{f.title}</div>
                  <div className="ai-card-desc">{f.desc}</div>
                </motion.div>
              ))}
            </div>
            <div style={{ textAlign: "center", paddingTop: 16 }}>
              <Link to="/ai-assistant" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "rgba(230,100,10,0.08)", border: "1px solid rgba(230,100,10,0.18)",
                color: "#E6640A", fontFamily: "'Manrope',sans-serif",
                fontSize: 13, fontWeight: 700,
                padding: "11px 22px", borderRadius: 11, textDecoration: "none",
              }}>
                <IconSparkles size={13} />Try AI Assistant Now
              </Link>
            </div>
          </div>
        </div>

        <div className="sdiv" />

        {/* ── AD BANNER 2 ── */}
        <div className="pg">
          <AdBanner ad={adBanners[(adIdx + 1) % adBanners.length]} />
        </div>

        <div className="sdiv" />

        {/* ── CTA BANNER ── */}
        <div className="pg">
          <motion.div
            className="cta-banner"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="cta-glow" />
            <div className="cta-content">
              <h2 className="cta-h2">Not sure what to buy?<br />Let AI decide.</h2>
              <p className="cta-p">Describe what you need, set your budget, and our AI will curate the perfect selection just for you.</p>
              <div className="cta-btns">
                <Link to="/ai-assistant" className="cta-btn-w">
                  <IconSparkles size={14} />Chat with AI
                </Link>
                <Link to="/register" className="cta-btn-g">Create Free Account</Link>
              </div>
            </div>
            <div className="cta-logo">
              <div className="cta-logo-box">
                <div className="cta-logo-on">ON</div>
                <div className="cta-logo-ett">ETT</div>
              </div>
              <span className="cta-logo-name">ONETT<span style={{ opacity: 0.55 }}>.</span></span>
            </div>
          </motion.div>
        </div>

        <div className="sdiv" />

        {/* ── TRUST GRID ── */}
        <div className="pg">
          <div className="trust-grid">
            {[
              { icon: IconShieldCheck,   title: "Secure Payments",  desc: "Every transaction is encrypted and protected" },
              { icon: IconTruck,         title: "Fast Delivery",    desc: "Real-time tracking from purchase to doorstep" },
              { icon: IconSparkles,      title: "AI-Powered",       desc: "Smart recommendations tailored just for you" },
              { icon: IconMessageSquare, title: "24/7 Support",     desc: "Connect with sellers and get instant help" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                className="trust-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="trust-icon"><f.icon size={20} style={{ color: "#E6640A" }} /></div>
                <div>
                  <div className="trust-title">{f.title}</div>
                  <div className="trust-desc">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="sdiv" />

        {/* ── FOOTER ── */}
        <motion.footer
          className="footer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="footer-inner">
            <motion.div
              className="footer-grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            >
              <motion.div
                className="footer-col"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}
              >
                <div className="footer-brand-row">
                  <OnettLogoMark size={34} />
                  <span className="footer-brand-name">ONETT<em>.</em></span>
                </div>
                <p className="footer-tagline">Ghana's AI-powered marketplace. Shop smarter, not harder.</p>
                <a
                  href="https://wa.me/233257765011?text=Hi%2C%20I%20found%20you%20on%20ONETT"
                  target="_blank" rel="noopener noreferrer"
                  className="footer-wa"
                >
                  <IconWhatsapp size={15} /> Chat with a Seller
                </a>
              </motion.div>

              {[
                { title: "Shop", links: [
                  { label: "Categories",   to: "/categories" },
                  { label: "All Products", to: "/search?keyword=" },
                  { label: "Flash Sales",  to: "/search?discount=true" },
                ]},
                { title: "Account", links: [
                  { label: "Sign In",        to: "/login" },
                  { label: "Create Account", to: "/register" },
                  { label: "My Orders",      to: "/orders" },
                ]},
                { title: "Features", links: [
                  { label: "AI Assistant", to: "/ai-assistant" },
                  { label: "Messages",     to: "/messages" },
                ]},
              ].map(col => (
                <motion.div
                  key={col.title}
                  className="footer-col"
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="footer-col-title">{col.title}</div>
                  <div className="footer-links">
                    {col.links.map(link => (
                      <Link key={link.label} to={link.to} className="footer-link">{link.label}</Link>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="footer-bottom"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="footer-copy">© 2026 ONETT. All rights reserved.</p>
              <p className="footer-copy">Smart Buying · Affordable Access</p>
            </motion.div>
          </div>
        </motion.footer>
      </div>
    </>
  );
};

export default Index;
