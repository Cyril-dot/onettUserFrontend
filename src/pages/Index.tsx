// ONETT — Homepage (Live API Integration · Real Auth · No Demo Data)

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { productApi, cartApi } from "@/lib/api";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const TOKEN = {
  brand:     "#E6640A",
  brandDark: "#C4520A",
  brandGlow: "rgba(230,100,10,0.18)",
  white:     "#FFFFFF",
  offWhite:  "#F8F7F4",
  surface:   "#FFFFFF",
  surfaceEl: "#F5F3EF",
  border:    "rgba(0,0,0,0.07)",
  borderMid: "rgba(0,0,0,0.12)",
  text:      "#1A1A1A",
  textMid:   "#5A5A5A",
  textDim:   "#9A9A9A",
  red:       "#EF4444",
  blue:      "#3B82F6",
  green:     "#22C55E",
  amber:     "#F59E0B",
  purple:    "#8B5CF6",
};

// ─── INJECTED GLOBAL CSS ──────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
  body { background: #F8F7F4; color: #1A1A1A; font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }
  button, a { -webkit-tap-highlight-color: transparent; }
  img { display: block; }
  ::-webkit-scrollbar { width: 6px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }

  .scroll-track {
    display: flex; gap: 12px; overflow-x: auto;
    -webkit-overflow-scrolling: touch; scrollbar-width: none;
    padding-bottom: 8px; align-items: stretch;
    margin-left: -16px; padding-left: 16px;
    margin-right: -16px; padding-right: 16px;
  }
  .scroll-track::-webkit-scrollbar { display: none; }
  @media (min-width: 640px) {
    .scroll-track { margin-left: 0; padding-left: 0; margin-right: 0; padding-right: 0; gap: 14px; }
  }

  .pg {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
    max-width: 1320px; margin: 0 auto; width: 100%;
  }
  @media (min-width: 640px)  { .pg { padding-left: 24px; padding-right: 24px; } }
  @media (min-width: 1024px) { .pg { padding-left: 48px; padding-right: 48px; } }

  .sdiv { height: 40px; }
  @media (min-width: 768px) { .sdiv { height: 56px; } }

  /* ── SKELETON ── */
  .skeleton {
    background: linear-gradient(90deg, #f0ede8 25%, #e8e4de 50%, #f0ede8 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 10px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── PRODUCT CARD ── */
  .pcard {
    width: 158px; flex-shrink: 0;
    background: #FFFFFF;
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: 18px; overflow: hidden;
    display: flex; flex-direction: column;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .pcard:hover {
    border-color: rgba(230,100,10,0.3);
    box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(230,100,10,0.15);
  }
  @media (min-width: 480px)  { .pcard { width: 190px; } }
  @media (min-width: 768px)  { .pcard { width: 218px; } }
  @media (min-width: 1024px) { .pcard { width: 248px; } }

  .pcard-img {
    width: 100%; aspect-ratio: 1 / 1;
    position: relative; overflow: hidden;
    background: #F5F3EF; flex-shrink: 0;
  }
  .pcard-img img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
    transition: transform 0.45s cubic-bezier(0.22,1,0.36,1);
    display: block;
  }
  .pcard:hover .pcard-img img { transform: scale(1.07); }

  .pcard-disc {
    position: absolute; top: 10px; left: 10px; z-index: 2;
    background: #EF4444; color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 9px; font-weight: 800; letter-spacing: 0.3px;
    padding: 3px 8px; border-radius: 99px;
    backdrop-filter: blur(4px);
  }

  .pcard-wish {
    position: absolute; top: 10px; right: 10px; z-index: 2;
    width: 30px; height: 30px; border-radius: 9px;
    background: rgba(255,255,255,0.85); border: 1px solid rgba(0,0,0,0.08);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #9A9A9A; transition: all 0.15s;
    backdrop-filter: blur(8px); flex-shrink: 0;
  }
  .pcard-wish:hover { color: #EF4444; border-color: rgba(239,68,68,0.35); background: rgba(255,255,255,0.95); }
  .pcard-wish.active { color: #EF4444; background: rgba(255,255,255,0.95); border-color: rgba(239,68,68,0.35); }

  .pcard-body {
    padding: 12px 13px 14px;
    display: flex; flex-direction: column; flex: 1;
    gap: 0;
  }
  @media (min-width: 480px)  { .pcard-body { padding: 13px 15px 15px; } }
  @media (min-width: 1024px) { .pcard-body { padding: 14px 16px 16px; } }

  .pcard-brand {
    font-size: 9px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: #9A9A9A; margin-bottom: 5px;
  }

  .pcard-name {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12.5px; font-weight: 600; color: #2A2A2A;
    line-height: 1.4; display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; margin-bottom: 8px; flex: 1;
    text-decoration: none;
    transition: color 0.15s;
  }
  .pcard-name:hover { color: #E6640A; }
  @media (min-width: 480px)  { .pcard-name { font-size: 13px; } }
  @media (min-width: 1024px) { .pcard-name { font-size: 13.5px; } }

  .pcard-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 9px; font-weight: 700; letter-spacing: 0.3px;
    padding: 3px 9px; border-radius: 6px; margin-bottom: 10px;
    width: fit-content;
  }
  .badge-sale   { background: rgba(239,68,68,0.08);  border: 1px solid rgba(239,68,68,0.2);  color: #DC2626; }
  .badge-new    { background: rgba(34,197,94,0.08);  border: 1px solid rgba(34,197,94,0.2);  color: #16A34A; }
  .badge-pre    { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); color: #D97706; }
  .badge-soon   { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); color: #2563EB; }
  .badge-stock  { background: rgba(34,197,94,0.08);  border: 1px solid rgba(34,197,94,0.2);  color: #16A34A; }

  .pcard-footer {
    display: flex; align-items: center; justify-content: space-between;
    gap: 6px; padding-top: 10px;
    border-top: 1px solid rgba(0,0,0,0.06);
    margin-top: auto;
  }

  .pcard-price {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 15px; font-weight: 800; color: #1A1A1A;
    letter-spacing: -0.4px; line-height: 1;
  }
  @media (min-width: 480px)  { .pcard-price { font-size: 16px; } }
  @media (min-width: 1024px) { .pcard-price { font-size: 17px; } }

  .pcard-price-old {
    font-size: 10px; color: #B0B0B0;
    text-decoration: line-through; margin-top: 2px; line-height: 1;
  }

  .pcard-cart {
    display: inline-flex; align-items: center; justify-content: center; gap: 4px;
    background: #E6640A; color: #fff; border: none;
    border-radius: 10px; padding: 8px 11px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 10px; font-weight: 800; cursor: pointer;
    white-space: nowrap; flex-shrink: 0;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
    box-shadow: 0 2px 8px rgba(230,100,10,0.3);
  }
  .pcard-cart:hover { background: #C4520A; box-shadow: 0 4px 16px rgba(230,100,10,0.4); transform: translateY(-1px); }
  .pcard-cart:active { transform: translateY(0); }
  .pcard-cart:disabled { background: #E5E5E5; color: #A0A0A0; box-shadow: none; cursor: not-allowed; }
  @media (min-width: 480px)  { .pcard-cart { padding: 9px 13px; font-size: 11px; } }
  @media (min-width: 1024px) { .pcard-cart { padding: 10px 14px; font-size: 11.5px; } }

  /* ── SECTION HEADER ── */
  .sec-hdr {
    display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;
  }
  @media (min-width: 500px) {
    .sec-hdr { flex-direction: row; align-items: center; justify-content: space-between; }
  }
  .sec-hdr-l { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
  .sec-hdr-r { display: flex; align-items: center; gap: 8px; flex-shrink: 0; padding-left: 50px; }
  @media (min-width: 500px) { .sec-hdr-r { padding-left: 0; } }

  .sec-ico {
    width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .sec-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 18px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.4px; line-height: 1.2;
  }
  @media (min-width: 768px) { .sec-title { font-size: 20px; } }
  .sec-sub { font-size: 12.5px; color: #9A9A9A; margin-top: 3px; line-height: 1.4; }

  .sec-link {
    font-size: 12px; font-weight: 700; color: #E6640A;
    text-decoration: none; white-space: nowrap;
    padding: 6px 12px; border-radius: 8px;
    background: rgba(230,100,10,0.08);
    border: 1px solid rgba(230,100,10,0.2);
    transition: background 0.15s;
  }
  .sec-link:hover { background: rgba(230,100,10,0.15); }

  .nav-btn {
    width: 33px; height: 33px; border-radius: 50%;
    background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.1);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6A6A6A;
    transition: all 0.15s;
  }
  .nav-btn:hover { background: rgba(0,0,0,0.08); color: #1A1A1A; border-color: rgba(0,0,0,0.15); }

  /* ── HERO ── */
  .hero-section {
    position: relative; min-height: 100dvh;
    display: flex; flex-direction: column; justify-content: flex-end;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center;
  }
  .hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      to top,
      rgba(248,247,244,0.98) 0%,
      rgba(248,247,244,0.55) 45%,
      rgba(248,247,244,0.15) 100%
    );
  }
  .hero-content {
    position: relative; z-index: 2;
    padding: 0 16px 56px; max-width: 1320px; margin: 0 auto; width: 100%;
  }
  @media (min-width: 640px)  { .hero-content { padding: 0 24px 72px; } }
  @media (min-width: 1024px) { .hero-content { padding: 0 48px 88px; } }

  .hero-kicker {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(230,100,10,0.10); border: 1px solid rgba(230,100,10,0.25);
    color: #C4520A; font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 6px 14px; border-radius: 99px; margin-bottom: 20px;
  }
  .hero-h1 {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(38px, 8vw, 78px);
    font-weight: 800; color: #1A1A1A; line-height: 1.05;
    letter-spacing: -2px; margin-bottom: 18px; max-width: 720px;
  }
  .hero-h1 em { color: #E6640A; font-style: normal; }
  .hero-p {
    font-size: clamp(14px, 2.5vw, 17px); color: rgba(0,0,0,0.45);
    line-height: 1.7; max-width: 460px; margin-bottom: 32px;
  }
  .hero-btns { display: flex; gap: 10px; flex-wrap: wrap; }
  @media (max-width: 480px) {
    .hero-btns { flex-direction: column; }
    .hero-btns a, .hero-btns button { width: 100%; justify-content: center; }
  }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: #E6640A; color: #fff; border: none;
    border-radius: 13px; padding: 15px 26px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 800; text-decoration: none; cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
    box-shadow: 0 4px 20px rgba(230,100,10,0.35);
  }
  .btn-primary:hover { background: #C4520A; box-shadow: 0 8px 32px rgba(230,100,10,0.45); transform: translateY(-1px); }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.85); color: #1A1A1A;
    border: 1px solid rgba(0,0,0,0.12);
    border-radius: 13px; padding: 15px 26px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700; text-decoration: none; cursor: pointer;
    backdrop-filter: blur(8px);
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
  }
  .btn-ghost:hover { background: rgba(255,255,255,1); border-color: rgba(0,0,0,0.2); transform: translateY(-1px); }

  .hero-stats { display: flex; gap: 24px; margin-top: 40px; flex-wrap: wrap; }
  .hero-stat { display: flex; flex-direction: column; gap: 2px; }
  .hero-stat-num {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 22px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.5px;
  }
  .hero-stat-lbl { font-size: 11px; color: rgba(0,0,0,0.4); font-weight: 600; letter-spacing: 0.3px; }
  .hero-stat-div { width: 1px; background: rgba(0,0,0,0.1); align-self: stretch; }

  /* ── CATEGORY PILLS ── */
  .cat-grid {
    display: flex; gap: 10px;
    overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
    padding-bottom: 4px;
    margin-left: -16px; padding-left: 16px;
    margin-right: -16px; padding-right: 16px;
  }
  .cat-grid::-webkit-scrollbar { display: none; }
  @media (min-width: 640px) {
    .cat-grid { flex-wrap: wrap; overflow-x: visible;
      margin-left: 0; padding-left: 0; margin-right: 0; padding-right: 0; }
  }
  .cat-pill {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    flex-shrink: 0; text-decoration: none;
  }
  .cat-pill-ico {
    width: 64px; height: 64px; border-radius: 18px;
    background: #FFFFFF; border: 1px solid rgba(0,0,0,0.08);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  .cat-pill:hover .cat-pill-ico {
    border-color: rgba(230,100,10,0.35);
    box-shadow: 0 6px 20px rgba(230,100,10,0.15);
    transform: translateY(-3px);
  }
  .cat-pill-ico img { width: 100%; height: 100%; object-fit: cover; }
  .cat-pill-lbl {
    font-size: 11px; font-weight: 600; color: #7A7A7A;
    text-align: center; white-space: nowrap;
    max-width: 70px; overflow: hidden; text-overflow: ellipsis;
    transition: color 0.15s;
  }
  .cat-pill:hover .cat-pill-lbl { color: #E6640A; }
  @media (min-width: 640px) { .cat-pill-ico { width: 72px; height: 72px; border-radius: 20px; } }

  /* ── AD STRIP ── */
  .ad-strip {
    border-radius: 20px; padding: 18px 20px;
    display: flex; align-items: center; gap: 14px;
    overflow: hidden; position: relative;
  }
  @media (min-width: 640px) { .ad-strip { padding: 22px 28px; border-radius: 24px; gap: 18px; } }
  .ad-strip-icon { font-size: 28px; flex-shrink: 0; }
  .ad-strip-body { flex: 1; min-width: 0; }
  .ad-strip-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(13px, 3.5vw, 15px); font-weight: 700; color: #fff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ad-strip-sub {
    font-size: clamp(11px, 2.5vw, 12.5px); color: rgba(255,255,255,0.55);
    margin-top: 2px; line-height: 1.5;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .ad-strip-cta {
    flex-shrink: 0; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25);
    color: #fff; font-size: 12px; font-weight: 700; padding: 9px 16px; border-radius: 11px;
    cursor: pointer; white-space: nowrap; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background 0.15s;
  }
  .ad-strip-cta:hover { background: rgba(255,255,255,0.28); }
  .ad-strip-label {
    position: absolute; top: 8px; right: 8px;
    font-size: 8px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
    color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.1);
    border-radius: 4px; padding: 2px 5px;
  }
  .ad-dots { display: flex; justify-content: center; gap: 6px; margin-top: 12px; }
  .ad-dot {
    width: 6px; height: 6px; border-radius: 99px;
    background: rgba(0,0,0,0.12); cursor: pointer; border: none; padding: 0;
    transition: background 0.2s, width 0.2s;
  }
  .ad-dot.on { width: 20px; background: #E6640A; }

  /* ── FLASH SALE ── */
  .live-chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
    color: #DC2626; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;
    text-transform: uppercase; padding: 3px 8px; border-radius: 6px;
  }
  .live-dot { width: 5px; height: 5px; border-radius: 50%; background: #EF4444; animation: livePulse 1.2s ease-in-out infinite; }
  @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.75)} }

  .shimmer-chip {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2);
    color: #7C3AED; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 6px;
  }

  /* ── UPCOMING CARD ── */
  .hs-card {
    width: 168px; flex-shrink: 0;
    background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07);
    border-radius: 18px; overflow: hidden;
    display: flex; flex-direction: column;
    text-decoration: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .hs-card:hover {
    border-color: rgba(139,92,246,0.3);
    box-shadow: 0 12px 40px rgba(0,0,0,0.1);
  }
  @media (min-width: 480px) { .hs-card { width: 196px; } }
  @media (min-width: 768px) { .hs-card { width: 220px; } }

  .hs-img { width: 100%; aspect-ratio: 1; position: relative; overflow: hidden; background: #F5F3EF; }
  .hs-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; display: block; }
  .hs-card:hover .hs-img img { transform: scale(1.06); }

  .hs-timer {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4));
    padding: 8px; display: flex; align-items: center; justify-content: center; gap: 4px;
  }
  .hs-timer-unit { display: flex; flex-direction: column; align-items: center; min-width: 28px; }
  .hs-timer-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 15px; font-weight: 800; color: #fff; line-height: 1; font-variant-numeric: tabular-nums; }
  .hs-timer-lbl { font-size: 7.5px; font-weight: 700; color: rgba(255,255,255,0.55); text-transform: uppercase; }
  .hs-timer-sep { font-size: 13px; font-weight: 900; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
  .timer-purple { border-top: 1px solid rgba(139,92,246,0.3); }
  .timer-amber  { border-top: 1px solid rgba(245,158,11,0.3); }

  .hs-body { padding: 12px 13px 14px; display: flex; flex-direction: column; flex: 1; }
  .hs-status {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 6px;
    margin-bottom: 8px; width: fit-content;
  }
  .hs-brand { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #B0B0B0; margin-bottom: 5px; }
  .hs-name {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12.5px; font-weight: 600; color: #2A2A2A; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; min-height: 35px; margin-bottom: 10px; flex: 1;
  }
  .hs-price-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 10px; }
  .hs-price { font-family: 'Bricolage Grotesque', sans-serif; font-size: 14px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.3px; }
  .hs-price-old { font-size: 10px; color: #B0B0B0; text-decoration: line-through; }
  .hs-btn {
    display: flex; align-items: center; justify-content: center; gap: 5px;
    background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2);
    color: #7C3AED; border-radius: 10px; padding: 9px;
    font-size: 11px; font-weight: 700; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background 0.15s;
  }
  .hs-btn:hover { background: rgba(139,92,246,0.14); }

  /* ── AI FEATURES GRID ── */
  .ai-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  @media (min-width: 900px) { .ai-grid { grid-template-columns: repeat(4, 1fr); } }

  .ai-card {
    background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07);
    border-radius: 18px; padding: 18px 16px;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  .ai-card:hover { border-color: rgba(0,0,0,0.12); transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
  .ai-card-ico { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
  .ai-card-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; font-weight: 700; color: #1A1A1A; margin-bottom: 5px; }
  .ai-card-desc { font-size: 11.5px; color: #8A8A8A; line-height: 1.6; }

  /* ── TRUST CARDS ── */
  .trust-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  @media (min-width: 900px) { .trust-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; } }

  .trust-card {
    background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07);
    border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    transition: border-color 0.2s;
  }
  .trust-card:hover { border-color: rgba(230,100,10,0.25); }
  @media (min-width: 640px) { .trust-card { flex-direction: row; align-items: flex-start; padding: 20px 18px; gap: 14px; } }
  .trust-ico { width: 38px; height: 38px; border-radius: 11px; background: rgba(230,100,10,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .trust-title { font-size: 13px; font-weight: 700; color: #1A1A1A; margin-bottom: 3px; }
  .trust-desc { font-size: 11.5px; color: #8A8A8A; line-height: 1.55; }

  /* ── CTA BANNER ── */
  .cta-block {
    position: relative; overflow: hidden;
    border-radius: 24px;
    background: linear-gradient(135deg, #1A1A1A 0%, #2D1205 50%, #3A1A08 100%);
    border: 1px solid rgba(230,100,10,0.2);
    padding: 32px 20px;
    display: flex; flex-direction: column; gap: 0;
  }
  @media (min-width: 640px) { .cta-block { padding: 48px 44px; flex-direction: row; align-items: center; justify-content: space-between; gap: 32px; } }
  .cta-glow { position: absolute; top: -80px; right: -80px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(230,100,10,0.2) 0%, transparent 70%); pointer-events: none; }
  .cta-glow2 { position: absolute; bottom: -60px; left: -40px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%); pointer-events: none; }
  .cta-h2 {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(24px, 5vw, 36px); font-weight: 800; color: #fff;
    line-height: 1.15; letter-spacing: -0.7px; margin-bottom: 12px;
  }
  .cta-p { font-size: clamp(13px, 3vw, 14.5px); color: rgba(255,255,255,0.45); line-height: 1.7; margin-bottom: 24px; max-width: 420px; }
  .cta-btns { display: flex; gap: 10px; flex-wrap: wrap; }
  .cta-logo-wrap { display: none; }
  @media (min-width: 640px) {
    .cta-logo-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; z-index: 1; flex-shrink: 0; }
  }
  .cta-logo-box {
    width: 72px; height: 72px; border-radius: 20px;
    background: linear-gradient(135deg, #E6640A, #C4520A);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    box-shadow: 0 12px 40px rgba(230,100,10,0.4);
  }
  .cta-logo-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 17px; font-weight: 800; color: rgba(255,255,255,0.7); letter-spacing: -0.5px; }

  /* ── FOOTER ── */
  .footer {
    background: #1A1A1A; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 4px;
  }
  .footer-inner { max-width: 1320px; margin: 0 auto; padding: 48px 16px 28px; }
  @media (min-width: 640px)  { .footer-inner { padding: 56px 24px 32px; } }
  @media (min-width: 1024px) { .footer-inner { padding: 64px 48px 36px; } }
  .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px 20px; }
  @media (min-width: 640px) { .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; } }
  .footer-brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .footer-logo-box {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #E6640A, #C4520A);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    box-shadow: 0 2px 10px rgba(230,100,10,0.3);
  }
  .footer-logo-on  { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 900; font-size: 11px; color: #fff; line-height: 1; letter-spacing: -0.5px; }
  .footer-logo-ett { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 8px; color: rgba(255,255,255,0.6); line-height: 1; letter-spacing: 0.5px; }
  .footer-name { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 20px; color: #F4F4F5; letter-spacing: -0.5px; }
  .footer-name em { color: #E6640A; font-style: normal; }
  .footer-tag { font-size: 13px; color: #666; line-height: 1.65; margin: 0 0 14px; max-width: 240px; }
  .footer-wa {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.2);
    color: #22C55E; font-size: 12.5px; font-weight: 700;
    padding: 9px 16px; border-radius: 11px; text-decoration: none;
    transition: background 0.15s;
  }
  .footer-wa:hover { background: rgba(37,211,102,0.18); }
  .footer-col-first { grid-column: 1 / -1; }
  @media (min-width: 640px) { .footer-col-first { grid-column: span 1; } }
  .footer-col-title { font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #555; margin-bottom: 14px; }
  .footer-links { display: flex; flex-direction: column; gap: 9px; }
  .footer-link { font-size: 13.5px; color: #888; text-decoration: none; transition: color 0.15s; }
  .footer-link:hover { color: #F4F4F5; }
  .footer-bottom {
    border-top: 1px solid rgba(255,255,255,0.06); margin-top: 36px; padding-top: 22px;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  @media (min-width: 640px) { .footer-bottom { flex-direction: row; justify-content: space-between; } }
  .footer-copy { font-size: 12px; color: #555; }

  /* ── WELCOME POPUP ── */
  .wp-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(16px) saturate(0.6);
    display: flex; align-items: flex-end; justify-content: center;
  }
  @media (min-width: 600px) { .wp-overlay { align-items: center; } }
  .wp-sheet {
    width: 100%; max-width: 460px; border-radius: 28px 28px 0 0;
    background: #FFFFFF; border: 1px solid rgba(0,0,0,0.08);
    border-bottom: none; max-height: 90dvh; overflow-y: auto;
    box-shadow: 0 -40px 80px rgba(0,0,0,0.15);
  }
  @media (min-width: 600px) { .wp-sheet { border-radius: 28px; border-bottom: 1px solid rgba(0,0,0,0.08); } }
  .wp-visual {
    height: 210px; position: relative; display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    background: radial-gradient(ellipse at 50% 130%, var(--sc,#E6640A) 0%, transparent 65%),
                linear-gradient(180deg, #F5F3EF, #FFFFFF);
    transition: background 0.4s;
  }
  .wp-orb {
    width: 100px; height: 100px; border-radius: 28px;
    border: 1.5px solid var(--sc,#E6640A); background: rgba(255,255,255,0.7);
    display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 2; backdrop-filter: blur(12px);
  }
  .wp-orb::before {
    content: ""; position: absolute; inset: -20%; border-radius: 50%;
    background: var(--sc,#E6640A); opacity: 0.15; filter: blur(24px);
  }
  .wp-emoji { font-size: 48px; position: relative; z-index: 2; line-height: 1; }
  .wp-close {
    position: absolute; top: 14px; right: 14px; z-index: 10;
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.1);
    color: rgba(0,0,0,0.4); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .wp-close:hover { background: rgba(0,0,0,0.1); }
  .wp-chip {
    position: absolute; top: 14px; left: 14px; z-index: 10;
    background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.08);
    border-radius: 8px; padding: 4px 10px;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: 13px; color: #1A1A1A; letter-spacing: -0.3px;
  }
  .wp-chip em { color: #E6640A; font-style: normal; }
  .wp-body { padding: 24px 24px 20px; }
  .wp-kicker { font-size: 10px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 7px; }
  .wp-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(22px,6vw,27px); font-weight: 800; color: #1A1A1A; line-height: 1.15; letter-spacing: -0.5px; margin: 0 0 10px; }
  .wp-desc { font-size: 13.5px; color: rgba(0,0,0,0.45); line-height: 1.7; margin: 0 0 22px; }
  .wp-dots { display: flex; gap: 7px; margin-bottom: 18px; }
  .wp-dot { height: 5px; border-radius: 99px; background: rgba(0,0,0,0.12); border: none; cursor: pointer; padding: 0; transition: width 0.25s, background 0.25s; width: 16px; }
  .wp-dot.on { width: 28px; }
  .wp-cta {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; border: none; border-radius: 15px; padding: 16px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 15px;
    color: #fff; cursor: pointer; margin-bottom: 10px; text-decoration: none;
    transition: opacity 0.15s, transform 0.1s;
  }
  .wp-cta:hover { opacity: 0.9; transform: scale(0.99); }
  .wp-skip { display: block; width: 100%; text-align: center; font-size: 12px; color: rgba(0,0,0,0.2); background: transparent; border: none; cursor: pointer; padding: 6px 0; }
  .wp-skip:hover { color: rgba(0,0,0,0.4); }
  .wp-safe { height: env(safe-area-inset-bottom, 0); }

  /* ── NAVBAR ── */
  .navbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    padding: 0 16px; height: 62px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    background: rgba(248,247,244,0.9); border-bottom: 1px solid rgba(0,0,0,0.08);
    backdrop-filter: blur(20px) saturate(1.5);
    transition: background 0.3s, box-shadow 0.3s;
  }
  @media (min-width: 640px) { .navbar { padding: 0 24px; height: 66px; } }
  @media (min-width: 1024px) { .navbar { padding: 0 48px; } }
  .navbar.scrolled { background: rgba(248,247,244,0.97); box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .nav-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0; }
  .nav-logo-box {
    width: 32px; height: 32px; border-radius: 9px;
    background: linear-gradient(135deg, #E6640A, #C4520A);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .nav-logo-on  { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 900; font-size: 10px; color: #fff; line-height: 1; }
  .nav-logo-ett { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 7px; color: rgba(255,255,255,0.65); line-height: 1; }
  .nav-name { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 17px; color: #1A1A1A; letter-spacing: -0.3px; }
  .nav-name em { color: #E6640A; font-style: normal; }

  .nav-search {
    flex: 1; max-width: 400px;
    background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.09);
    border-radius: 11px; height: 40px;
    align-items: center; gap: 8px; padding: 0 12px;
    cursor: text; transition: border-color 0.15s, background 0.15s;
    display: none;
  }
  @media (min-width: 768px) { .nav-search { display: flex; } }
  .nav-search:hover { border-color: rgba(0,0,0,0.14); background: rgba(0,0,0,0.06); }
  .nav-search input {
    background: none; border: none; outline: none;
    font-size: 13px; color: #1A1A1A; width: 100%;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .nav-search input::placeholder { color: #A0A0A0; }

  .nav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  .nav-icon-btn {
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6A6A6A; transition: all 0.15s; position: relative;
    text-decoration: none;
  }
  .nav-icon-btn:hover { background: rgba(0,0,0,0.08); color: #1A1A1A; border-color: rgba(0,0,0,0.14); }

  .nav-cart-badge {
    position: absolute; top: -4px; right: -4px;
    min-width: 16px; height: 16px; border-radius: 50%;
    background: #E6640A; color: #fff;
    font-size: 8.5px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    border: 1.5px solid #F8F7F4;
    padding: 0 3px;
  }

  .nav-sign-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: #E6640A; color: #fff; border: none;
    border-radius: 10px; padding: 8px 16px;
    font-size: 12.5px; font-weight: 700; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    white-space: nowrap;
    transition: background 0.15s; text-decoration: none;
  }
  .nav-sign-btn:hover { background: #C4520A; }

  .nav-avatar {
    width: 38px; height: 38px; border-radius: 10px;
    background: linear-gradient(135deg, #E6640A, #C4520A);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #fff; font-weight: 800; font-size: 14px;
    font-family: 'Bricolage Grotesque', sans-serif;
    border: none; position: relative;
    transition: box-shadow 0.15s;
    flex-shrink: 0;
  }
  .nav-avatar:hover { box-shadow: 0 4px 16px rgba(230,100,10,0.4); }
  .nav-avatar-online {
    position: absolute; bottom: -2px; right: -2px;
    width: 10px; height: 10px; border-radius: 50%;
    background: #22C55E; border: 2px solid #F8F7F4;
  }

  .nav-menu-btn {
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #3A3A3A; transition: all 0.15s;
    flex-shrink: 0;
  }
  .nav-menu-btn:hover { background: rgba(0,0,0,0.08); }
  @media (min-width: 768px) { .nav-menu-btn { display: none; } }

  .mobile-drawer-overlay {
    position: fixed; inset: 0; z-index: 1100;
    background: rgba(0,0,0,0.35); backdrop-filter: blur(6px);
  }
  .mobile-drawer {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 1200;
    width: min(320px, 88vw);
    background: #FFFFFF; box-shadow: -20px 0 60px rgba(0,0,0,0.12);
    display: flex; flex-direction: column;
    overflow-y: auto;
  }
  .md-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(0,0,0,0.07);
  }
  .md-close {
    width: 34px; height: 34px; border-radius: 9px;
    background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.08);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #5A5A5A; transition: background 0.15s;
  }
  .md-close:hover { background: rgba(0,0,0,0.1); }
  .md-body { padding: 16px 20px; flex: 1; }
  .md-user {
    display: flex; align-items: center; gap: 12px;
    background: rgba(230,100,10,0.06); border: 1px solid rgba(230,100,10,0.15);
    border-radius: 14px; padding: 14px 16px; margin-bottom: 20px;
  }
  .md-user-avatar {
    width: 44px; height: 44px; border-radius: 12px;
    background: linear-gradient(135deg, #E6640A, #C4520A);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 16px;
    font-family: 'Bricolage Grotesque', sans-serif;
    flex-shrink: 0;
  }
  .md-user-name { font-weight: 700; font-size: 14px; color: #1A1A1A; }
  .md-user-email { font-size: 12px; color: #8A8A8A; margin-top: 1px; }
  .md-search {
    display: flex; align-items: center; gap: 8px;
    background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.09);
    border-radius: 11px; padding: 10px 14px; margin-bottom: 20px;
  }
  .md-search input {
    background: none; border: none; outline: none;
    font-size: 14px; color: #1A1A1A; width: 100%;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .md-search input::placeholder { color: #A0A0A0; }
  .md-nav-label { font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #B0B0B0; margin-bottom: 8px; margin-top: 16px; }
  .md-nav-links { display: flex; flex-direction: column; gap: 2px; }
  .md-nav-link {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; border-radius: 11px;
    font-size: 14px; font-weight: 600; color: #2A2A2A;
    text-decoration: none; transition: background 0.15s, color 0.15s;
  }
  .md-nav-link:hover { background: rgba(230,100,10,0.07); color: #E6640A; }
  .md-nav-link svg { flex-shrink: 0; }
  .md-footer { padding: 16px 20px 32px; border-top: 1px solid rgba(0,0,0,0.07); }
  .md-signout {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; border: 1px solid rgba(0,0,0,0.1); border-radius: 11px;
    padding: 12px; font-size: 13px; font-weight: 700; color: #5A5A5A;
    background: transparent; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background 0.15s;
  }
  .md-signout:hover { background: rgba(0,0,0,0.04); }

  /* ── EMPTY STATE ── */
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 40px 20px; gap: 10px; min-width: 200px;
  }
  .empty-state-icon { font-size: 32px; opacity: 0.3; }
  .empty-state-text { font-size: 13px; color: #A0A0A0; font-weight: 500; text-align: center; }
`;

function InjectCSS() {
  useEffect(() => {
    const id = "onett-v3-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);
  return null;
}

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Ico = {
  Arrow:    (p: any={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  Sparkles: (p: any={}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z"/></svg>,
  Flame:    (p: any={}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Zap:      (p: any={}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Tag:      (p: any={}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Cart:     (p: any={}) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Heart:    (p: any={}) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Shield:   (p: any={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  Truck:    (p: any={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Chat:     (p: any={}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Brain:    (p: any={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.04-4.83A3 3 0 0 1 4.5 9.5a3 3 0 0 1 1.5-2.6A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.04-4.83A3 3 0 0 0 19.5 9.5a3 3 0 0 0-1.5-2.6A2.5 2.5 0 0 0 14.5 2z"/></svg>,
  Camera:   (p: any={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Search:   (p: any={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Clock:    (p: any={}) => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Calendar: (p: any={}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M16 2v4M8 2v4M3 10h5"/><circle cx="17" cy="17" r="4"/><path d="M17 15v2.2l1.4 1.4"/></svg>,
  ChevR:    (p: any={}) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 18l6-6-6-6"/></svg>,
  ChevL:    (p: any={}) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 18l-6-6 6-6"/></svg>,
  X:        (p: any={}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Menu:     (p: any={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Home:     (p: any={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Package:  (p: any={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  User:     (p: any={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  LogOut:   (p: any={}) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Wa:       (p: any={}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.103 1.508 5.836L.057 23.25a.75.75 0 00.916.943l5.638-1.479A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.73 9.73 0 01-4.962-1.355l-.356-.212-3.686.967.984-3.595-.232-.371A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>,
  Pkg:      (p: any={}) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Wishlist: (p: any={}) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Notif:    (p: any={}) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

// ─── COUNTDOWN HOOK ───────────────────────────────────────────────────────────
function useCountdown(id: string, days: number) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!days || !id) return;
    const target = Date.now() + days * 86_400_000;
    const tick = () => {
      const d = Math.max(0, target - Date.now());
      setT({ days: Math.floor(d/86_400_000), hours: Math.floor((d/3_600_000)%24), minutes: Math.floor((d/60_000)%60), seconds: Math.floor((d/1_000)%60) });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [days, id]);
  return t;
}

// ─── SKELETON CARDS ───────────────────────────────────────────────────────────
function SkeletonProductCard() {
  return (
    <div className="pcard" style={{ flexShrink: 0 }}>
      <div className="pcard-img skeleton" />
      <div className="pcard-body" style={{ gap: 8 }}>
        <div className="skeleton" style={{ height: 10, width: "40%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 13, width: "90%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 13, width: "70%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 18, width: "50%", borderRadius: 8, marginTop: 4 }} />
      </div>
    </div>
  );
}

function SkeletonCategoryPill() {
  return (
    <div className="cat-pill" style={{ flexShrink: 0 }}>
      <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 18 }} />
      <div className="skeleton" style={{ width: 50, height: 10, borderRadius: 6 }} />
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, index = 0, onCartUpdate }: { product: any; index?: number; onCartUpdate?: () => void }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const img = product.primaryImageUrl || null;
  const hasDiscount = product.isDiscounted && product.discountPrice;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;
  const inStock = product.stock == null || product.stock > 0;
  const isNew = !product.isDiscounted && !product.stockStatus;

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (addingCart || !inStock) return;
    setAddingCart(true);
    try {
      await cartApi.add(product.id, 1);
      setCartAdded(true);
      onCartUpdate?.();
      setTimeout(() => setCartAdded(false), 2000);
    } catch (err) {
      console.error("[Cart] add failed:", err);
    } finally {
      setAddingCart(false);
    }
  };

  return (
    <motion.div
      ref={ref}
      style={{ display: "flex", flexDirection: "column", alignSelf: "stretch", flexShrink: 0 }}
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.35), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, transition: { type: "spring", stiffness: 360, damping: 22 } }}
    >
      <div className="pcard" style={{ flex: 1 }}>
        <div className="pcard-img">
          <a href={`/products/${product.id}`} style={{ display: "block", width: "100%", height: "100%" }}>
            {img
              ? <img src={img} alt={product.name} loading="lazy" />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#C0C0C0" }}><Ico.Pkg /></div>}
          </a>
          {hasDiscount && <div className="pcard-disc">-{product.discountPercentage}%</div>}
          {!inStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ background: "#fff", color: "#8A8A8A", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)" }}>Out of Stock</span>
            </div>
          )}
          <button className={`pcard-wish${wishlisted ? " active" : ""}`} onClick={e => { e.preventDefault(); e.stopPropagation(); setWishlisted(w => !w); }} aria-label="Add to wishlist">
            <Ico.Heart style={{ fill: wishlisted ? "currentColor" : "none" }} />
          </button>
        </div>
        <div className="pcard-body">
          {product.brand && <div className="pcard-brand">{product.brand}</div>}
          <a href={`/products/${product.id}`} className="pcard-name">{product.name}</a>
          <div style={{ marginBottom: 8 }}>
            {hasDiscount
              ? <span className="pcard-badge badge-sale">Sale</span>
              : product.stockStatus === "PRE_ORDER"
              ? <span className="pcard-badge badge-pre">Pre-order</span>
              : product.stockStatus === "COMING_SOON"
              ? <span className="pcard-badge badge-soon">Coming Soon</span>
              : isNew
              ? <span className="pcard-badge badge-new">New</span>
              : <span className="pcard-badge badge-stock">In Stock</span>}
          </div>
          <div className="pcard-footer">
            <div>
              <div className="pcard-price">GHS {Number(displayPrice).toLocaleString()}</div>
              {hasDiscount && <div className="pcard-price-old">GHS {Number(product.price).toLocaleString()}</div>}
            </div>
            <button
              className="pcard-cart"
              onClick={handleCart}
              disabled={addingCart || !inStock}
              aria-label="Add to cart"
              style={cartAdded ? { background: "#22C55E" } : {}}
            >
              <Ico.Cart />
              {!inStock ? "Sold out" : addingCart ? "…" : cartAdded ? "Added!" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub, accent, Icon, seeAllHref, trackId }: any) {
  const scroll = (dir: number) => { document.getElementById(trackId)?.scrollBy({ left: dir * 280, behavior: "smooth" }); };
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div className="sec-hdr" ref={ref}>
      <div className="sec-hdr-l">
        <motion.div className="sec-ico" style={{ background: `${accent}14` }} initial={{ scale: 0, rotate: -10 }} animate={inView ? { scale: 1, rotate: 0 } : {}} transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}>
          <Icon style={{ color: accent, width: 18, height: 18 }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.38, delay: 0.06 }}>
          <div className="sec-title">{title}</div>
          <div className="sec-sub">{sub}</div>
        </motion.div>
      </div>
      <div className="sec-hdr-r">
        {seeAllHref && <a href={seeAllHref} className="sec-link">See all →</a>}
        {trackId && <>
          <button className="nav-btn" onClick={() => scroll(-1)}><Ico.ChevL /></button>
          <button className="nav-btn" onClick={() => scroll(1)}><Ico.ChevR /></button>
        </>}
      </div>
    </div>
  );
}

function ProductSection({ title, sub, accent, Icon, items, loading, seeAllHref, id, onCartUpdate }: any) {
  return (
    <div className="pg">
      <SectionHeader title={title} sub={sub} accent={accent} Icon={Icon} seeAllHref={seeAllHref} trackId={id} />
      <div id={id} className="scroll-track">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonProductCard key={i} />)
          : items.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">Nothing here yet — check back soon!</div></div>
          : items.map((item: any, i: number) => <ProductCard key={item.id} product={item} index={i} onCartUpdate={onCartUpdate} />)}
      </div>
    </div>
  );
}

// ─── UPCOMING CARD ────────────────────────────────────────────────────────────
function UpcomingCard({ product, index = 0 }: { product: any; index?: number }) {
  const { days, hours, minutes, seconds } = useCountdown(product.id, product.availableInDays || 7);
  const isPre = product.stockStatus === "PRE_ORDER";
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.a ref={ref} href={`/products/${product.id}`} className="hs-card"
      initial={{ opacity: 0, y: index % 2 === 0 ? -28 : 28, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.4), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, transition: { type: "spring", stiffness: 360, damping: 22 } }}
    >
      <div className="hs-img">
        {product.primaryImageUrl
          ? <img src={product.primaryImageUrl} alt={product.name} loading="lazy" />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#C0C0C0" }}><Ico.Pkg /></div>}
        <div className={`hs-timer ${isPre ? "timer-amber" : "timer-purple"}`}>
          {[{ v: days, l: "d" }, null, { v: hours, l: "h" }, null, { v: minutes, l: "m" }, null, { v: seconds, l: "s" }].map((u: any, i) =>
            u === null
              ? <span key={i} className="hs-timer-sep">:</span>
              : <div key={i} className="hs-timer-unit"><span className="hs-timer-num">{String(u.v).padStart(2, "0")}</span><span className="hs-timer-lbl">{u.l}</span></div>
          )}
        </div>
      </div>
      <div className="hs-body">
        <div className={`hs-status ${isPre ? "badge-pre" : "badge-soon"}`} style={{ marginBottom: 7 }}><Ico.Calendar />{isPre ? "Pre-order" : "Coming Soon"}</div>
        {product.brand && <div className="hs-brand">{product.brand}</div>}
        <div className="hs-name">{product.name}</div>
        <div className="hs-price-row"><span className="hs-price">GHS {product.price?.toLocaleString()}</span></div>
        <button className="hs-btn"><Ico.Cart />{isPre ? "Pre-order Now" : "Notify Me"}</button>
      </div>
    </motion.a>
  );
}

// ─── AD STRIP ─────────────────────────────────────────────────────────────────
const ADS = [
  { id: "a1", bg: "linear-gradient(135deg,#0e1f3e,#1a3877)", icon: "💳", title: "MTN MoMo — Pay & save 5%", sub: "Use MoMo at checkout for instant cashback on every order", cta: "Try it" },
  { id: "a2", bg: "linear-gradient(135deg,#052e1e,#064c30)", icon: "🚚", title: "Free Delivery over GHS 200", sub: "DHL Express — Accra & Kumasi same-day delivery available", cta: "Learn more" },
  { id: "a3", bg: "linear-gradient(135deg,#1c1040,#2d1f60)", icon: "🔐", title: "Sell on ONETT — It's free", sub: "Reach thousands of buyers across Ghana instantly today", cta: "Start selling" },
];

function AdStrip({ adIdx, setAdIdx }: { adIdx: number; setAdIdx: (i: number) => void }) {
  return (
    <div className="pg">
      <AnimatePresence mode="wait">
        <motion.div key={ADS[adIdx].id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
          <div className="ad-strip" style={{ background: ADS[adIdx].bg }}>
            <span className="ad-strip-label">Sponsored</span>
            <div className="ad-strip-icon">{ADS[adIdx].icon}</div>
            <div className="ad-strip-body">
              <div className="ad-strip-title">{ADS[adIdx].title}</div>
              <div className="ad-strip-sub">{ADS[adIdx].sub}</div>
            </div>
            <button className="ad-strip-cta">{ADS[adIdx].cta}</button>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="ad-dots">
        {ADS.map((_, i) => <button key={i} className={`ad-dot${i === adIdx ? " on" : ""}`} onClick={() => setAdIdx(i)} aria-label={`Ad ${i + 1}`} />)}
      </div>
    </div>
  );
}

// ─── STATIC CONTENT ───────────────────────────────────────────────────────────
const AI_FEATURES = [
  { icon: Ico.Brain,   title: "Smart Picks",  desc: "AI learns your taste and curates products you'll love",         color: "#E6640A", bg: "rgba(230,100,10,0.08)" },
  { icon: Ico.Camera,  title: "Image Search", desc: "Snap a photo and find matching products instantly",             color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  { icon: Ico.Chat,    title: "AI Advisor",   desc: "Chat for style advice, comparisons & budget tips",              color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
  { icon: Ico.Search,  title: "Smart Search", desc: "Natural language that understands exactly what you mean",       color: "#22C55E", bg: "rgba(34,197,94,0.08)" },
];

const TRUST = [
  { Icon: Ico.Shield,   title: "Secure Payments", desc: "Every transaction is encrypted and fully protected end-to-end" },
  { Icon: Ico.Truck,    title: "Fast Delivery",   desc: "Real-time tracking from purchase to your doorstep" },
  { Icon: Ico.Sparkles, title: "AI-Powered",      desc: "Smart recommendations tailored specifically for you" },
  { Icon: Ico.Chat,     title: "24/7 Support",    desc: "Connect with sellers and get instant help any time" },
];

const WP_SLIDES = [
  { emoji: "✨", kicker: "Welcome to ONETT", title: "Ghana's Smartest Marketplace", desc: "Shop 10,000+ products with AI-powered recommendations tailored to your style and budget.", color: "#E6640A" },
  { emoji: "🤖", kicker: "Meet Your AI Shopper", title: "Shop by Simply Chatting", desc: "Describe what you need in plain language — our AI finds the perfect match in seconds.", color: "#8B5CF6" },
  { emoji: "🚀", kicker: "Deals Waiting for You", title: "Ready to Explore?", desc: "Exclusive flash sales, pre-orders, and new arrivals drop every day. Don't miss out.", color: "#22C55E" },
];

// ─── MOBILE DRAWER ────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, isAuthenticated, user, onLogout }: any) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navLinks = [
    { icon: Ico.Home,     label: "Home",         href: "/" },
    { icon: Ico.Tag,      label: "Categories",   href: "/categories" },
    { icon: Ico.Flame,    label: "Flash Sales",  href: "/search?discount=true" },
    { icon: Ico.Zap,      label: "New Arrivals", href: "/search?keyword=new" },
    { icon: Ico.Calendar, label: "Upcoming",     href: "/upcoming" },
    { icon: Ico.Sparkles, label: "AI Assistant", href: "/ai-assistant" },
    { icon: Ico.Package,  label: "My Orders",    href: "/orders" },
    { icon: Ico.Wishlist, label: "Wishlist",     href: "/wishlist" },
  ];

  const displayName = user?.fullName || user?.storeName || "Account";
  const displayEmail = user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      {open && <>
        <motion.div className="mobile-drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="mobile-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 340, damping: 32 }}>
          <div className="md-header">
            <a href="/" className="nav-logo" onClick={onClose}>
              <div className="nav-logo-box"><div className="nav-logo-on">ON</div><div className="nav-logo-ett">ETT</div></div>
              <span className="nav-name">ONETT<em>.</em></span>
            </a>
            <button className="md-close" onClick={onClose}><Ico.X /></button>
          </div>
          <div className="md-body">
            <div className="md-search">
              <Ico.Search style={{ color: "#A0A0A0", width: 14, height: 14, flexShrink: 0 }} />
              <input type="text" placeholder="Search 10,000+ products…" />
            </div>
            {isAuthenticated ? (
              <div className="md-user">
                <div className="md-user-avatar">{initial}</div>
                <div>
                  <div className="md-user-name">{displayName}</div>
                  <div className="md-user-email">{displayEmail}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <a href="/login" onClick={onClose} className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "11px 16px", fontSize: 13, borderRadius: 11 }}>Sign In</a>
                <a href="/register" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "11px 16px", fontSize: 13, borderRadius: 11 }}>Register</a>
              </div>
            )}
            <div className="md-nav-label">Navigation</div>
            <div className="md-nav-links">
              {navLinks.map(link => (
                <a key={link.label} href={link.href} className="md-nav-link" onClick={onClose}>
                  <link.icon style={{ color: "#E6640A" }} />{link.label}
                </a>
              ))}
            </div>
          </div>
          {isAuthenticated && (
            <div className="md-footer">
              <button className="md-signout" onClick={() => { onLogout(); onClose(); }}>
                <Ico.LogOut />Sign Out
              </button>
            </div>
          )}
          <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
        </motion.div>
      </>}
    </AnimatePresence>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ cartCount, onCartUpdate }: { cartCount: number; onCartUpdate: () => void }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const displayName = user?.fullName || user?.storeName || "";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <a href="/" className="nav-logo">
          <div className="nav-logo-box">
            <div className="nav-logo-on">ON</div>
            <div className="nav-logo-ett">ETT</div>
          </div>
          <span className="nav-name">ONETT<em>.</em></span>
        </a>

        <div className="nav-search">
          <Ico.Search style={{ color: "#A0A0A0", width: 14, height: 14, flexShrink: 0 }} />
          <input type="text" placeholder="Search 10,000+ products…" />
        </div>

        <div className="nav-right">
          {/* Notifications (authenticated only) */}
          {isAuthenticated && (
            <a href="/notifications" className="nav-icon-btn" title="Notifications" style={{ display: "flex" }}>
              <Ico.Notif style={{ width: 15, height: 15 }} />
            </a>
          )}

          {/* Cart */}
          <a href="/cart" className="nav-icon-btn" title="Cart">
            <Ico.Cart style={{ width: 15, height: 15 }} />
            {cartCount > 0 && <span className="nav-cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>}
          </a>

          {/* Auth */}
          {isAuthenticated ? (
            <button className="nav-avatar" title={`Signed in as ${displayName}`} onClick={() => window.location.href = "/profile"}>
              {initial}
              <span className="nav-avatar-online" />
            </button>
          ) : (
            <a href="/login" className="nav-sign-btn">Sign in</a>
          )}

          {/* Hamburger */}
          <button className="nav-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Ico.Menu />
          </button>
        </div>
      </nav>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={logout}
      />
    </>
  );
}

// ─── WELCOME POPUP ────────────────────────────────────────────────────────────
function WelcomePopup() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show once per session
    const seen = sessionStorage.getItem("onett-welcome-seen");
    if (!seen) {
      setTimeout(() => setVisible(true), 900);
    }
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem("onett-welcome-seen", "1");
  }, []);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  if (!visible) return null;
  const s = WP_SLIDES[step];
  const isLast = step === WP_SLIDES.length - 1;

  return (
    <AnimatePresence>
      <motion.div className="wp-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
        <motion.div className="wp-sheet" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }} onClick={e => e.stopPropagation()}>
          <div className="wp-visual" style={{ "--sc": s.color } as any}>
            <motion.div className="wp-orb" key={step} initial={{ scale: 0.65, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.65, opacity: 0 }} transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}>
              <span className="wp-emoji">{s.emoji}</span>
            </motion.div>
            <button className="wp-close" onClick={close}><Ico.X /></button>
            <div className="wp-chip">ON<em>ETT.</em></div>
          </div>
          <div className="wp-body">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28 }}>
                <div className="wp-kicker" style={{ color: s.color }}>{s.kicker}</div>
                <h2 className="wp-title">{s.title}</h2>
                <p className="wp-desc">{s.desc}</p>
              </motion.div>
            </AnimatePresence>
            <div className="wp-dots">
              {WP_SLIDES.map((_, i) => (
                <button key={i} className={`wp-dot${i === step ? " on" : ""}`} style={i === step ? { background: s.color } : {}} onClick={() => setStep(i)} />
              ))}
            </div>
            {isLast
              ? <a href="/search?keyword=" onClick={close} className="wp-cta" style={{ background: s.color }}>Start Shopping <Ico.Arrow /></a>
              : <button className="wp-cta" style={{ background: s.color }} onClick={() => setStep(p => p + 1)}>Next <Ico.Arrow /></button>}
            <button onClick={close} className="wp-skip">Skip intro</button>
          </div>
          <div className="wp-safe" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ONETTHomepage() {
  const [adIdx, setAdIdx] = useState(0);

  // ── Live data state ────────────────────────────────────────────
  const [categories,   setCategories]   = useState<any[]>([]);
  const [flashItems,   setFlashItems]   = useState<any[]>([]);
  const [newArrivals,  setNewArrivals]  = useState<any[]>([]);
  const [homeItems,    setHomeItems]    = useState<any[]>([]);
  const [upcomingItems,setUpcomingItems]= useState<any[]>([]);
  const [cartCount,    setCartCount]    = useState(0);

  const [loadingCats,    setLoadingCats]    = useState(true);
  const [loadingFlash,   setLoadingFlash]   = useState(true);
  const [loadingNew,     setLoadingNew]     = useState(true);
  const [loadingHome,    setLoadingHome]    = useState(true);
  const [loadingUpcoming,setLoadingUpcoming]= useState(true);

  // ── Fetch cart count ────────────────────────────────────────────
  const refreshCartCount = useCallback(async () => {
    try {
      const res = await cartApi.getCount();
      // API may return { count: N } or just a number
      const count = typeof res === "number" ? res : res?.count ?? res?.totalItems ?? 0;
      setCartCount(count);
    } catch {
      // not logged in or error — silently ignore
    }
  }, []);

  // ── Fetch all data on mount ──────────────────────────────────────
  useEffect(() => {
    // Categories
    productApi.getCategories()
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));

    // Flash / discounted
    productApi.getDiscounted()
      .then(data => setFlashItems(Array.isArray(data) ? data : []))
      .catch(() => setFlashItems([]))
      .finally(() => setLoadingFlash(false));

    // New arrivals
    productApi.getNewArrivals()
      .then(data => setNewArrivals(Array.isArray(data) ? data : []))
      .catch(() => setNewArrivals([]))
      .finally(() => setLoadingNew(false));

    // Home / Just Dropped (may return object with sections)
    productApi.getHome()
      .then(data => {
        // Backend might return { products: [...] } or an array directly
        const arr = Array.isArray(data) ? data : data?.products ?? data?.items ?? [];
        setHomeItems(arr);
      })
      .catch(() => setHomeItems([]))
      .finally(() => setLoadingHome(false));

    // Upcoming: combine coming soon + pre-order
    Promise.allSettled([
      productApi.getComingSoon(),
      productApi.getPreOrder(),
    ]).then(([cs, po]) => {
      const comingSoon = cs.status === "fulfilled" && Array.isArray(cs.value) ? cs.value : [];
      const preOrder   = po.status === "fulfilled" && Array.isArray(po.value) ? po.value : [];
      setUpcomingItems([...preOrder, ...comingSoon]);
    }).finally(() => setLoadingUpcoming(false));

    // Cart count (best-effort)
    refreshCartCount();
  }, [refreshCartCount]);

  // ── Ad auto-rotate ──────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => setAdIdx(i => (i + 1) % ADS.length), 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      <InjectCSS />
      <div style={{ background: "#F8F7F4", minHeight: "100vh" }}>
        <WelcomePopup />
        <Navbar cartCount={cartCount} onCartUpdate={refreshCartCount} />

        {/* ════ HERO ════ */}
        <section className="hero-section">
          <img className="hero-bg" src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=85" alt="Hero" loading="eager" />
          <div className="hero-overlay" />
          <div className="hero-content pg">
            <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div className="hero-kicker"><Ico.Sparkles style={{ width: 12, height: 12 }} />AI-Powered · Ghana's Smartest Shop</div>
              <h1 className="hero-h1">Shop Smarter<br />with <em>ONETT.</em></h1>
              <p className="hero-p">Personalized picks, snap-to-search, budget advice, and unbeatable deals — all in one place.</p>
              <div className="hero-btns">
                <a href="/search?keyword=" className="btn-primary">Start Shopping <Ico.Arrow /></a>
                <a href="/ai-assistant" className="btn-ghost"><Ico.Sparkles />Try AI Assistant</a>
              </div>
              <div className="hero-stats">
                <div className="hero-stat"><div className="hero-stat-num">10K+</div><div className="hero-stat-lbl">Products</div></div>
                <div className="hero-stat-div" />
                <div className="hero-stat"><div className="hero-stat-num">50K+</div><div className="hero-stat-lbl">Happy Buyers</div></div>
                <div className="hero-stat-div" />
                <div className="hero-stat"><div className="hero-stat-num">4.8★</div><div className="hero-stat-lbl">Avg Rating</div></div>
                <div className="hero-stat-div" />
                <div className="hero-stat"><div className="hero-stat-num">2-Day</div><div className="hero-stat-lbl">Delivery</div></div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="sdiv" />

        {/* ════ CATEGORIES ════ */}
        <div className="pg">
          <SectionHeader title="Browse Categories" sub="Find exactly what you're looking for" accent="#E6640A" Icon={Ico.Tag} seeAllHref="/categories" />
          <div className="cat-grid">
            {loadingCats
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCategoryPill key={i} />)
              : categories.length === 0
              ? <div className="empty-state"><div className="empty-state-icon">🗂️</div><div className="empty-state-text">Categories coming soon</div></div>
              : categories.map((cat, i) => (
                  <motion.a key={cat.id} href={`/categories/${cat.slug}`} className="cat-pill"
                    initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.04 }}>
                    <div className="cat-pill-ico">
                      {cat.icon?.imageUrl
                        ? <img src={cat.icon.imageUrl} alt={cat.name} loading="lazy" />
                        : <Ico.Pkg style={{ width: 22, height: 22, color: "#C0C0C0" }} />}
                    </div>
                    <span className="cat-pill-lbl">{cat.name}</span>
                  </motion.a>
                ))}
          </div>
        </div>

        <div className="sdiv" />

        {/* ════ FLASH SALE ════ */}
        <div className="pg">
          <div className="sec-hdr">
            <div className="sec-hdr-l">
              <div className="sec-ico" style={{ background: "rgba(239,68,68,0.08)" }}>
                <Ico.Flame style={{ color: "#EF4444", width: 18, height: 18 }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <span className="sec-title">Flash Sale</span>
                  <span className="live-chip"><span className="live-dot" />LIVE</span>
                </div>
                <div className="sec-sub">Limited time — grab it before it's gone</div>
              </div>
            </div>
            <div className="sec-hdr-r">
              <a href="/search?discount=true" className="sec-link">See all →</a>
              <button className="nav-btn" onClick={() => document.getElementById("flash-track")?.scrollBy({ left: -280, behavior: "smooth" })}><Ico.ChevL /></button>
              <button className="nav-btn" onClick={() => document.getElementById("flash-track")?.scrollBy({ left: 280, behavior: "smooth" })}><Ico.ChevR /></button>
            </div>
          </div>
          <div id="flash-track" className="scroll-track">
            {loadingFlash
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonProductCard key={i} />)
              : flashItems.length === 0
              ? <div className="empty-state"><div className="empty-state-icon">🔥</div><div className="empty-state-text">No flash deals right now — check back soon!</div></div>
              : flashItems.map((item, i) => <ProductCard key={item.id} product={item} index={i} onCartUpdate={refreshCartCount} />)}
          </div>
        </div>

        <div className="sdiv" />

        {/* ════ AD STRIP ════ */}
        <AdStrip adIdx={adIdx} setAdIdx={setAdIdx} />

        <div className="sdiv" />

        {/* ════ NEW ARRIVALS ════ */}
        <ProductSection
          id="new-track"
          title="New Arrivals"
          sub="Fresh products added this week"
          accent="#F59E0B"
          Icon={Ico.Zap}
          items={newArrivals}
          loading={loadingNew}
          seeAllHref="/search?keyword=new"
          onCartUpdate={refreshCartCount}
        />

        <div className="sdiv" />

        {/* ════ UPCOMING DROPS ════ */}
        <div className="pg">
          <div className="sec-hdr">
            <div className="sec-hdr-l">
              <div className="sec-ico" style={{ background: "rgba(139,92,246,0.08)" }}>
                <Ico.Calendar style={{ color: "#8B5CF6", width: 18, height: 18 }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <span className="sec-title">Upcoming Drops</span>
                  <span className="shimmer-chip"><Ico.Clock />Live timer</span>
                </div>
                <div className="sec-sub">Pre-order &amp; coming soon — secure yours early</div>
              </div>
            </div>
            <div className="sec-hdr-r">
              <button className="nav-btn" onClick={() => document.getElementById("upcoming-track")?.scrollBy({ left: -240, behavior: "smooth" })}><Ico.ChevL /></button>
              <button className="nav-btn" onClick={() => document.getElementById("upcoming-track")?.scrollBy({ left: 240, behavior: "smooth" })}><Ico.ChevR /></button>
            </div>
          </div>
          <div id="upcoming-track" className="scroll-track">
            {loadingUpcoming
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonProductCard key={i} />)
              : upcomingItems.length === 0
              ? <div className="empty-state"><div className="empty-state-icon">🚀</div><div className="empty-state-text">No upcoming drops yet</div></div>
              : upcomingItems.map((item, i) => <UpcomingCard key={item.id} product={item} index={i} />)}
          </div>
        </div>

        <div className="sdiv" />

        {/* ════ AI FEATURES ════ */}
        <div className="pg">
          <SectionHeader title="Shopping, Reimagined" sub="Powered by AI · Built for you" accent="#E6640A" Icon={Ico.Sparkles} />
          <div className="ai-grid">
            {AI_FEATURES.map((f, i) => (
              <motion.div key={f.title} className="ai-card"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.42, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}>
                <div className="ai-card-ico" style={{ background: f.bg }}><f.icon style={{ color: f.color, width: 18, height: 18 }} /></div>
                <div className="ai-card-title">{f.title}</div>
                <div className="ai-card-desc">{f.desc}</div>
              </motion.div>
            ))}
          </div>
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <a href="/ai-assistant" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(230,100,10,0.08)", border: "1px solid rgba(230,100,10,0.2)", color: "#E6640A", fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif", padding: "11px 24px", borderRadius: 12, textDecoration: "none", transition: "background 0.15s" }}>
              <Ico.Sparkles />Try AI Assistant Now
            </a>
          </div>
        </div>

        <div className="sdiv" />

        {/* ════ AD STRIP 2 ════ */}
        <AdStrip adIdx={(adIdx + 1) % ADS.length} setAdIdx={setAdIdx} />

        <div className="sdiv" />

        {/* ════ JUST DROPPED ════ */}
        <ProductSection
          id="dropped-track"
          title="Just Dropped"
          sub="Browse all the latest products"
          accent="#E6640A"
          Icon={Ico.Flame}
          items={homeItems}
          loading={loadingHome}
          seeAllHref="/search?keyword="
          onCartUpdate={refreshCartCount}
        />

        <div className="sdiv" />

        {/* ════ CTA BANNER ════ */}
        <div className="pg">
          <motion.div className="cta-block" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="cta-glow" />
            <div className="cta-glow2" />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 className="cta-h2">Not sure what<br />to buy? Let AI<br />decide.</h2>
              <p className="cta-p">Describe what you need, set your budget, and our AI will curate the perfect selection just for you.</p>
              <div className="cta-btns">
                <a href="/ai-assistant" className="btn-primary"><Ico.Sparkles />Chat with AI</a>
                <a href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 13, padding: "15px 26px", fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "background 0.15s" }}>Create Free Account</a>
              </div>
            </div>
            <div className="cta-logo-wrap">
              <div className="cta-logo-box">
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 900, fontSize: 24, color: "#fff", lineHeight: 1, letterSpacing: -1 }}>ON</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1, letterSpacing: 2 }}>ETT</div>
              </div>
              <span className="cta-logo-name">ONETT<span style={{ opacity: 0.45 }}>.</span></span>
            </div>
          </motion.div>
        </div>

        <div className="sdiv" />

        {/* ════ TRUST ════ */}
        <div className="pg">
          <div className="trust-grid">
            {TRUST.map((t, i) => (
              <motion.div key={t.title} className="trust-card"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.42, delay: i * 0.08 }}>
                <div className="trust-ico"><t.Icon style={{ color: "#E6640A" }} /></div>
                <div><div className="trust-title">{t.title}</div><div className="trust-desc">{t.desc}</div></div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="sdiv" />

        {/* ════ FOOTER ════ */}
        <motion.footer className="footer" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55 }}>
          <div className="footer-inner">
            <div className="footer-grid">
              <div className="footer-col-first">
                <div className="footer-brand-row">
                  <div className="footer-logo-box"><div className="footer-logo-on">ON</div><div className="footer-logo-ett">ETT</div></div>
                  <span className="footer-name">ONETT<em>.</em></span>
                </div>
                <p className="footer-tag">Ghana's AI-powered marketplace. Shop smarter, not harder.</p>
                <a href="https://wa.me/233257765011" target="_blank" rel="noopener noreferrer" className="footer-wa"><Ico.Wa />Chat with a Seller</a>
              </div>
              {[
                { title: "Shop",     links: [{ l: "Categories", h: "/categories" }, { l: "All Products", h: "/search?keyword=" }, { l: "Flash Sales", h: "/search?discount=true" }] },
                { title: "Account",  links: [{ l: "Sign In", h: "/login" }, { l: "Create Account", h: "/register" }, { l: "My Orders", h: "/orders" }] },
                { title: "Features", links: [{ l: "AI Assistant", h: "/ai-assistant" }, { l: "Messages", h: "/messages" }, { l: "Sell on ONETT", h: "/sell" }] },
              ].map(col => (
                <div key={col.title}>
                  <div className="footer-col-title">{col.title}</div>
                  <div className="footer-links">{col.links.map(link => <a key={link.l} href={link.h} className="footer-link">{link.l}</a>)}</div>
                </div>
              ))}
            </div>
            <div className="footer-bottom">
              <p className="footer-copy">© 2026 ONETT. All rights reserved.</p>
              <p className="footer-copy">Smart Buying · Affordable Access</p>
            </div>
          </div>
        </motion.footer>
      </div>
    </>
  );
}
