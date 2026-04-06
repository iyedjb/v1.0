import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect, Component, ErrorInfo, ReactNode } from "react";
import ScrollToTop from "./components/ScrollToTop";
import BottomNav from "./components/BottomNav";
import { AiAssistant } from "./components/AiAssistant";
import { StoreProvider } from "./contexts/StoreContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { db } from "./lib/firebase";
import { ref, push, serverTimestamp } from "firebase/database";

class LazyLoadErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Lazy load error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4 p-8 text-center">
          <p className="text-lg font-medium text-gray-800">Something went wrong loading this page.</p>
          <button
            className="px-6 py-2 bg-yellow-500 text-white rounded-md font-medium hover:bg-yellow-600 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Index = lazy(() => import("./pages/Index"));
const Category = lazy(() => import("./pages/Category"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OurStory = lazy(() => import("./pages/about/OurStory"));
const Sustainability = lazy(() => import("./pages/about/Sustainability"));
const SizeGuide = lazy(() => import("./pages/about/SizeGuide"));
const CustomerCare = lazy(() => import("./pages/about/CustomerCare"));
const StoreLocator = lazy(() => import("./pages/about/StoreLocator"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Admin = lazy(() => import("./pages/Admin"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const Cart = lazy(() => import("./pages/Cart"));
const Premios = lazy(() => import("./pages/promos/Premios"));
const Frete = lazy(() => import("./pages/promos/Frete"));
const Cupons = lazy(() => import("./pages/promos/Cupons"));
const More = lazy(() => import("./pages/More"));
const MeusPedidos = lazy(() => import("./pages/MeusPedidos"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
const Enderecos = lazy(() => import("./pages/Enderecos"));
const Pagamentos = lazy(() => import("./pages/Pagamentos"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const CardPayment = lazy(() => import("./pages/CardPayment"));
const Reembolso = lazy(() => import("./pages/Reembolso"));
const PixPayment = lazy(() => import("./pages/PixPayment"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const visitsRef = ref(db, "analytics/visits");
    push(visitsRef, {
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      path: window.location.pathname,
    }).catch(err => console.error("Failed to track visit:", err));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <StoreProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <div className="min-h-screen bg-[#F5F5F5] pb-16 md:pb-0">
                  <ScrollToTop />
                  <LazyLoadErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/category/:category" element={<Category />} />
                        <Route path="/product/:productId" element={<ProductDetail />} />
                        <Route path="/carrinho" element={<Cart />} />
                        <Route path="/checkout" element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        } />
                        <Route path="/checkout/success" element={
                          <ProtectedRoute>
                            <CheckoutSuccess />
                          </ProtectedRoute>
                        } />
                        <Route path="/checkout/card" element={
                          <ProtectedRoute>
                            <CardPayment />
                          </ProtectedRoute>
                        } />
                        <Route path="/checkout/pix" element={
                          <ProtectedRoute>
                            <PixPayment />
                          </ProtectedRoute>
                        } />
                        <Route path="/about/our-story" element={<OurStory />} />
                        <Route path="/about/sustainability" element={<Sustainability />} />
                        <Route path="/about/size-guide" element={<SizeGuide />} />
                        <Route path="/about/customer-care" element={<CustomerCare />} />
                        <Route path="/about/store-locator" element={<StoreLocator />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/admin" element={
                          <ProtectedRoute adminOnly>
                            <Admin />
                          </ProtectedRoute>
                        } />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/premios" element={<Premios />} />
                        <Route path="/frete-gratis" element={<Frete />} />
                        <Route path="/cupons" element={
                          <ProtectedRoute adminOnly>
                            <Cupons />
                          </ProtectedRoute>
                        } />
                        <Route path="/mais" element={<More />} />
                        <Route path="/meus-pedidos" element={<MeusPedidos />} />
                        <Route path="/pedidos" element={<MeusPedidos />} />
                        <Route path="/favoritos" element={<Favoritos />} />
                        <Route path="/enderecos" element={<Enderecos />} />
                        <Route path="/pagamentos" element={<Pagamentos />} />
                        <Route path="/notificacoes" element={<Notificacoes />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                        <Route path="/reembolso" element={<Reembolso />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </LazyLoadErrorBoundary>
                  <BottomNav />
                  <AiAssistant />
                </div>
              </TooltipProvider>
            </StoreProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
