import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useFCM } from "@/hooks/useFCM";
import LoadingScreen from "@/components/LoadingScreen";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Search from "./pages/Search";
import Categories from "./pages/Categories";
import CategoryProducts from "./pages/CategoryProducts";
import SellerStore from "./pages/SellerStore";
import Orders from "./pages/Orders";
import AiAssistant from "./pages/AiAssistant";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import NotificationsPage from "./pages/NotificationsPage";
import PaymentCallback from "./pages/PaymentCallback";
// Seller pages
import SellerDashboardPage from "./pages/seller/SellerDashboardPage";
import SellerProductsPage from "./pages/seller/SellerProductsPage";
import SellerCategoriesPage from "./pages/seller/SellerCategoriesPage";
import SellerOrdersPage from "./pages/seller/SellerOrdersPage";
import SellerMessagesPage from "./pages/seller/SellerMessagesPage";
import SellerAiToolsPage from "./pages/seller/SellerAiToolsPage";

const queryClient = new QueryClient();

const FCMInitializer = () => {
  const { isAuthenticated } = useAuth();
  useFCM(isAuthenticated);
  return null;
};

const App = () => {
  const [showLoader, setShowLoader] = useState(true);

  return (
    <AnimatePresence>
      {showLoader && (
        <LoadingScreen onComplete={() => setShowLoader(false)} minDuration={100} />
      )}

      <QueryClientProvider client={queryClient} key="app">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <FCMInitializer />
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/"                    element={<Index />} />
                  <Route path="/login"               element={<Login />} />
                  <Route path="/register"            element={<Register />} />
                  <Route path="/products/:id"        element={<ProductDetails />} />
                  <Route path="/notifications"       element={<NotificationsPage />} />
                  <Route path="/cart"                element={<Cart />} />
                  <Route path="/search"              element={<Search />} />
                  <Route path="/categories"          element={<Categories />} />
                  <Route path="/categories/:slug"    element={<CategoryProducts />} />
                  <Route path="/store/:sellerId"     element={<SellerStore />} />
                  <Route path="/orders"              element={<Orders />} />
                  <Route path="/ai-assistant"        element={<AiAssistant />} />
                  <Route path="/messages"            element={<Messages />} />
                  <Route path="/profile"             element={<Profile />} />
                  <Route path="/payment/callback"    element={<PaymentCallback />} />
                  <Route path="/seller/dashboard"    element={<SellerDashboardPage />} />
                  <Route path="/seller/products"     element={<SellerProductsPage />} />
                  <Route path="/seller/categories"  element={<SellerCategoriesPage />} />
                  <Route path="/seller/orders"       element={<SellerOrdersPage />} />
                  <Route path="/seller/messages"     element={<SellerMessagesPage />} />
                  <Route path="/seller/ai-tools"     element={<SellerAiToolsPage />} />
                  <Route path="*"                    element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AnimatePresence>
  );
};

export default App;
