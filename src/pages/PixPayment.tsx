import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Copy, CheckCheck, QrCode, Package, ArrowLeft, Clock } from "lucide-react";
import { useState } from "react";
import { SiPix } from "react-icons/si";
import CheckoutHeader from "../components/header/CheckoutHeader";
import Footer from "../components/footer/Footer";
import { formatPriceFromCents } from "@/lib/utils";

interface PixPaymentState {
  pixCode: string;
  qrCodeImage: string;
  orderId: string;
  total: number;
  items: { name: string; image: string; size: string; price: number; quantity: number }[];
  customerName: string;
}

const PixPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PixPaymentState | null;
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    if (!state?.pixCode) {
      navigate("/checkout", { replace: true });
    }
  }, [state, navigate]);

  if (!state?.pixCode) return null;

  const { pixCode, qrCodeImage, orderId, total, items, customerName } = state;

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CheckoutHeader />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {/* Success header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#32BCAD]/15 border-2 border-[#32BCAD] flex items-center justify-center mb-3">
            <SiPix className="h-7 w-7 text-[#32BCAD]" />
          </div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-wide">Pedido Confirmado!</h1>
          <p className="text-gray-500 text-sm mt-1">Escaneie o QR Code abaixo para concluir o pagamento</p>
          <p className="text-xs text-gray-400 mt-1">Pedido <span className="font-mono font-bold text-gray-700">{orderId}</span></p>
        </div>

        {/* QR Code card */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="bg-[#32BCAD]/10 border-b border-[#32BCAD]/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SiPix className="h-4 w-4 text-[#32BCAD]" />
              <span className="text-sm font-black text-gray-800 uppercase tracking-wide">Pagar com PIX</span>
            </div>
            <span className="text-lg font-black text-gray-900">{formatPriceFromCents(total)}</span>
          </div>

          <div className="p-5 flex flex-col items-center gap-4">
            {/* QR code image */}
            <div className="bg-white rounded-2xl p-3 shadow-md border border-gray-100">
              {qrCodeImage
                ? <img src={qrCodeImage} alt="QR Code PIX" className="w-52 h-52" data-testid="img-pix-qrcode" />
                : <div className="w-52 h-52 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <QrCode className="h-10 w-10" />
                    <p className="text-xs text-center">QR Code indisponível<br/>Use o código abaixo</p>
                  </div>
              }
            </div>

            <div className="text-center">
              <p className="text-[#32BCAD] text-sm font-black uppercase tracking-wide">Escaneie com o app do banco</p>
              <p className="text-gray-500 text-xs mt-0.5">O valor já está preenchido automaticamente</p>
            </div>

            {/* Timer info */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 w-full">
              <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700">QR Code válido por <span className="font-bold">24 horas</span></p>
            </div>

            {/* Copy code */}
            <div className="w-full">
              <p className="text-gray-400 text-[11px] mb-1.5">Ou use o Pix Copia e Cola:</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-[11px] text-gray-500 truncate font-mono" data-testid="text-pix-code">
                  {pixCode.slice(0, 42)}...
                </div>
                <button
                  onClick={handleCopy}
                  data-testid="button-copy-pix"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#32BCAD] hover:bg-[#28a59a] rounded-xl text-white text-xs font-black transition-all whitespace-nowrap"
                >
                  {copiedPix
                    ? <><CheckCheck className="h-3.5 w-3.5" /> Copiado!</>
                    : <><Copy className="h-3.5 w-3.5" /> Copiar</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-4 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Resumo do pedido</h3>
          </div>
          <div className="px-4 py-3 space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3" data-testid={`row-order-item-${i}`}>
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">Tamanho: {item.size} • Qtd: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatPriceFromCents(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-sm font-black uppercase tracking-wide text-gray-700">Total PIX</span>
            <span className="text-lg font-black text-gray-900">{formatPriceFromCents(total)}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 mb-6 shadow-sm">
          <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">Como pagar</h3>
          <ol className="space-y-2">
            {[
              "Abra o app do seu banco",
              "Escolha a opção PIX → Ler QR Code",
              `Confirme o valor de ${formatPriceFromCents(total)}`,
              "Pagamento aprovado automaticamente!"
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#32BCAD] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-gray-600">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            to="/pedidos"
            data-testid="link-my-orders"
            className="flex items-center justify-center gap-2 w-full rounded-xl h-12 bg-gray-900 text-white font-black text-sm uppercase tracking-wide hover:bg-gray-800 transition-all"
          >
            <Package className="h-4 w-4" /> Ver meus pedidos
          </Link>
          <Link
            to="/"
            data-testid="link-continue-shopping"
            className="flex items-center justify-center gap-2 w-full rounded-xl h-12 border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Continuar comprando
          </Link>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default PixPayment;
