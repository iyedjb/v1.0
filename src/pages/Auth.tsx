import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Sparkles } from "lucide-react";
import { resetPassword } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import vuroLogo from "@/assets/vuro-logo-light.svg";
import vuroLogoDark from "@/assets/vuro-logo.svg";
import heroImage from "@/assets/lifestyle-street.jpg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { signIn, signUp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, insira seu email");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      toast({
        title: "Sucesso",
        description: "Email de recuperação enviado! Verifique sua caixa de entrada.",
      });
      setIsResetting(false);
      setIsLogin(true);
    } catch (err: any) {
      setError("Erro ao enviar email de recuperação. Verifique o endereço digitado.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorCode = err.code;
      switch (errorCode) {
        case "auth/email-already-in-use":
          setError("Este email já está em uso");
          break;
        case "auth/invalid-email":
          setError("Email inválido");
          break;
        case "auth/wrong-password":
        case "auth/user-not-found":
        case "auth/invalid-credential":
          setError("Email ou senha incorretos");
          break;
        case "auth/weak-password":
          setError("A senha é muito fraca");
          break;
        default:
          setError("Erro ao processar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        setError("Popup bloqueado. Abra o site no Chrome ou Safari do seu celular.");
      } else if (err.message?.includes("storage") || err.message?.includes("sessionStorage")) {
        setError("Este navegador não suporta login com Google. Abra o site no Chrome ou Safari.");
      } else {
        setError("Erro ao entrar com Google. Tente abrir no Chrome ou Safari.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ 
            backgroundImage: `url(${heroImage})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors w-fit">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Voltar à loja</span>
          </Link>
          
          <div className="space-y-6">
            <img src={vuroLogo} alt="VURO" className="h-16" />
            <p className="text-xl text-white/70 max-w-md leading-relaxed">
              Streetwear premium para quem vive o estilo urbano. Entre para ter acesso exclusivo.
            </p>
          </div>

        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Voltar</span>
            </Link>
            <img src={vuroLogoDark} alt="VURO" className="h-10" />
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-primary text-sm font-medium uppercase tracking-wider">
                {isResetting ? "Recuperação" : (isLogin ? "Acesso" : "Novo membro")}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isResetting ? "Recuperar senha" : (isLogin ? "Bem-vindo de volta" : "Criar sua conta")}
            </h2>
            <p className="text-gray-500">
              {isResetting 
                ? "Insira seu email para receber um link de recuperação"
                : (isLogin 
                  ? "Entre para acessar sua conta e continuar comprando" 
                  : "Registre-se para ter acesso exclusivo às nossas coleções")
              }
            </p>
          </div>

          {!isResetting && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 mb-6 gap-3 font-medium bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all"
              onClick={handleGoogleSignIn}
              disabled={loading}
              data-testid="button-google-signin"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#4285F4"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </Button>
          )}

          {!isResetting && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-400">ou continue com email</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium" data-testid="text-auth-error">
              {error}
            </div>
          )}

          <form onSubmit={isResetting ? handleResetPassword : handleSubmit} className="space-y-5">
            {!isLogin && !isResetting && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-600 text-sm">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12 h-14 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 rounded-xl"
                    data-testid="input-name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-600 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 rounded-xl"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>

            {!isResetting && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-600 text-sm">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 rounded-xl"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {!isLogin && !isResetting && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-600 text-sm">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 h-14 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary/20 rounded-xl"
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>
            )}

            {isLogin && !isResetting && (
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => { setIsResetting(true); setError(""); }}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  data-testid="link-forgot-password"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-primary/20"
              disabled={loading}
              data-testid="button-submit-auth"
            >
              {loading ? "Processando..." : (isResetting ? "Enviar Link" : (isLogin ? "Entrar" : "Criar conta"))}
            </Button>
            
            {isResetting && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
                onClick={() => { setIsResetting(false); setError(""); }}
              >
                Voltar para o Login
              </Button>
            )}
          </form>

          {!isResetting && (
            <p className="text-center mt-8 text-gray-500">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-primary font-bold hover:text-primary/80 transition-colors"
                data-testid="button-toggle-auth-mode"
              >
                {isLogin ? "Registre-se" : "Entrar"}
              </button>
            </p>
          )}

          <p className="text-center mt-10 text-xs text-gray-400">
            Ao continuar, você concorda com nossos{" "}
            <Link to="/about/terms" className="underline hover:text-gray-600 transition-colors">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link to="/about/privacy" className="underline hover:text-gray-600 transition-colors">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
