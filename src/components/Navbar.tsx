import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, Search, User, MessageCircle, LogOut,
  Menu, X, Sparkles, Bell, Package, Home, Sun, Moon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { notificationApi } from "@/lib/api";
import "../Navbar.css";

function OnettLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.25),
      background: "linear-gradient(135deg,#E6640A 0%,#cf5208 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      flexShrink: 0, boxShadow: "0 2px 8px rgba(230,100,10,0.35)",
    }}>
      <span style={{ color: "#fff", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: size * 0.3, lineHeight: 1, letterSpacing: "-0.5px" }}>ON</span>
      <span style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: size * 0.22, lineHeight: 1, letterSpacing: "0.5px" }}>ETT</span>
    </div>
  );
}

const Navbar = () => {
  const { user, isAuthenticated, isSeller, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try { const res = await notificationApi.getUnreadCount(); setUnreadCount(res?.unreadCount ?? 0); }
    catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  useEffect(() => {
    (window as any).__refreshNotifBadge = fetchUnreadCount;
    return () => { delete (window as any).__refreshNotifBadge; };
  }, [fetchUnreadCount]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileOpen(false);
    }
  };
  const closeMobile = () => setMobileOpen(false);

  /* ── Bell button — reused in desktop + drawer ── */
  const BellBtn = ({ mobile = false }: { mobile?: boolean }) =>
    mobile ? (
      <Link to="/notifications" onClick={closeMobile} className="onett-nav__menu-item">
        <Bell size={18} style={{ color: "#888", flexShrink: 0 }} />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="onett-nav__notif-pill">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    ) : (
      <Link to="/notifications" className="onett-nav__icon-btn" title="Notifications">
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="onett-nav__dot">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    );

  return (
    <>
      <nav className={`onett-nav${scrolled ? " scrolled" : ""}`}>
        <div className="onett-nav__inner">

          {/* ── Brand ── */}
          <Link to="/" className="onett-nav__brand" onClick={closeMobile}>
            <OnettLogo size={34} />
            <span className="onett-nav__brand-name">ONETT<em>.</em></span>
          </Link>

          {/* ── Desktop search ── */}
          <form onSubmit={handleSearch} className="onett-nav__search-form">
            <div className="onett-nav__search-wrap">
              <Search size={15} className="onett-nav__search-ico" />
              <input
                className="onett-nav__search-input"
                placeholder="Search products, brands, categories…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* ── Desktop actions ── */}
          <div className="onett-nav__actions">
            <Link to="/" className="onett-nav__icon-btn" title="Home">
              <Home size={17} />
            </Link>
            <Link to="/ai-assistant" className="onett-nav__icon-btn" title="AI Assistant">
              <Sparkles size={17} />
            </Link>
            <button
              onClick={() => setDarkMode(d => !d)}
              className="onett-nav__icon-btn"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {isAuthenticated && (
              <>
                <Link to="/messages" className="onett-nav__icon-btn" title="Messages">
                  <MessageCircle size={17} />
                </Link>
                <BellBtn />
                {!isSeller && (
                  <Link to="/orders" className="onett-nav__icon-btn" title="Orders">
                    <Package size={17} />
                  </Link>
                )}
                {!isSeller && (
                  <Link to="/cart" className="onett-nav__icon-btn" title="Cart">
                    <ShoppingCart size={17} />
                  </Link>
                )}
              </>
            )}

            <div className="onett-nav__sep" />

            {isAuthenticated ? (
              <>
                <Link
                  to={isSeller ? "/seller/dashboard" : "/profile"}
                  className="onett-nav__user-btn"
                >
                  <div className="onett-nav__user-av">
                    <User size={14} color="#E6640A" />
                  </div>
                  <span className="onett-nav__user-name">
                    {user?.fullName?.split(" ")[0]}
                  </span>
                </Link>
                <button
                  className="onett-nav__icon-btn"
                  title="Log out"
                  onClick={logout}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="onett-nav__btn-signin">Sign In</Link>
                <Link to="/register" className="onett-nav__btn-register">Get Started</Link>
              </>
            )}
          </div>

          {/* ── Mobile icon row ── */}
          <div className="onett-nav__mob">
            <Link to="/search" className="onett-nav__mob-btn" title="Search">
              <Search size={19} />
            </Link>
            {isAuthenticated && (
              <Link to="/messages" className="onett-nav__mob-btn" title="Messages">
                <MessageCircle size={19} />
              </Link>
            )}
            {isAuthenticated && !isSeller && (
              <Link to="/cart" className="onett-nav__mob-btn" title="Cart">
                <ShoppingCart size={19} />
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/notifications" className="onett-nav__mob-btn" title="Notifications">
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="onett-nav__dot" style={{ top: 5, right: 5, fontSize: 8, minWidth: 14, height: 14 }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              className="onett-nav__menu-btn"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>

        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          <div className="onett-nav__overlay" onClick={closeMobile} />
          <div className="onett-nav__drawer">

            {/* head */}
            <div className="onett-nav__drawer-head">
              <span className="onett-nav__drawer-title">ONETT<em>.</em></span>
              <button className="onett-nav__drawer-close" onClick={closeMobile} aria-label="Close menu">
                <X size={15} />
              </button>
            </div>

            {/* body */}
            <div className="onett-nav__drawer-body">

              {/* search */}
              <form onSubmit={handleSearch} className="onett-nav__drawer-search">
                <Search size={15} className="onett-nav__drawer-search-ico" />
                <input
                  className="onett-nav__drawer-search-input"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </form>

              {/* explore links */}
              <div className="onett-nav__sec-label">Explore</div>
              <Link to="/" onClick={closeMobile} className="onett-nav__menu-item">
                <Home size={18} style={{ color: "#E6640A", flexShrink: 0 }} />
                <span>Home</span>
              </Link>
              <Link to="/ai-assistant" onClick={closeMobile} className="onett-nav__menu-item">
                <Sparkles size={18} style={{ color: "#E6640A", flexShrink: 0 }} />
                <span>AI Assistant</span>
                <span className="onett-nav__badge-new">New</span>
              </Link>
              <button
                onClick={() => { setDarkMode(d => !d); closeMobile(); }}
                className="onett-nav__menu-item"
              >
                {darkMode
                  ? <Sun  size={18} style={{ color: "#E6640A", flexShrink: 0 }} />
                  : <Moon size={18} style={{ color: "#888",    flexShrink: 0 }} />}
                <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <Link to="/search?keyword=" onClick={closeMobile} className="onett-nav__menu-item">
                <Search  size={18} style={{ color: "#888", flexShrink: 0 }} />
                <span>All Products</span>
              </Link>
              <Link to="/categories" onClick={closeMobile} className="onett-nav__menu-item">
                <Package size={18} style={{ color: "#888", flexShrink: 0 }} />
                <span>Categories</span>
              </Link>

              {/* account links */}
              {isAuthenticated && (
                <>
                  <div className="onett-nav__sec-label">Account</div>
                  <Link
                    to={isSeller ? "/seller/dashboard" : "/profile"}
                    onClick={closeMobile}
                    className="onett-nav__user-card"
                  >
                    <div className="onett-nav__user-card-av">
                      <User size={18} color="#E6640A" />
                    </div>
                    <div>
                      <div className="onett-nav__user-card-name">{user?.fullName ?? "Profile"}</div>
                      <div className="onett-nav__user-card-sub">
                        {isSeller ? "Seller Dashboard" : "View profile"}
                      </div>
                    </div>
                  </Link>
                  <Link to="/messages" onClick={closeMobile} className="onett-nav__menu-item">
                    <MessageCircle size={18} style={{ color: "#888", flexShrink: 0 }} />
                    <span>Messages</span>
                  </Link>
                  <BellBtn mobile />
                  {!isSeller && (
                    <Link to="/orders" onClick={closeMobile} className="onett-nav__menu-item">
                      <Package size={18} style={{ color: "#888", flexShrink: 0 }} />
                      <span>My Orders</span>
                    </Link>
                  )}
                  {!isSeller && (
                    <Link to="/cart" onClick={closeMobile} className="onett-nav__menu-item">
                      <ShoppingCart size={18} style={{ color: "#888", flexShrink: 0 }} />
                      <span>Cart</span>
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* footer */}
            <div className="onett-nav__drawer-footer">
              {isAuthenticated ? (
                <button
                  className="onett-nav__logout-btn"
                  onClick={() => { logout(); closeMobile(); }}
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              ) : (
                <div className="onett-nav__drawer-footer-auth">
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="onett-nav__drawer-btn-signin"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobile}
                    className="onett-nav__drawer-btn-register"
                  >
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
