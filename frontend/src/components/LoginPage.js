import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { UserPlus, LogIn, Mail, Lock, User, ShieldCheck, MailCheck, Copy, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Verification flow state
  const [verificationStep, setVerificationStep] = useState(null); // null | 'pending' | 'verifying' | 'verified'
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationLink, setVerificationLink] = useState("");

  // Detect ?verify=token in URL and confirm email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('verify');
    if (token) {
      (async () => {
        setVerificationStep('verifying');
        try {
          const r = await axios.post(`${API}/auth/verify-email`, { token });
          if (r.data?.success) {
            setVerificationStep('verified');
            toast.success("Email confirmado com sucesso! Faça login.");
            if (r.data?.email) setLoginEmail(r.data.email);
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (err) {
          toast.error(err.response?.data?.detail || "Token inválido ou expirado");
          setVerificationStep(null);
          window.history.replaceState({}, '', window.location.pathname);
        }
      })();
    }
  }, []);

  const copyVerificationLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationLink);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const resendVerification = async () => {
    if (!pendingEmail) return;
    setIsLoading(true);
    try {
      const r = await axios.post(`${API}/auth/resend-verification`, { email: pendingEmail });
      if (r.data?.verification_link) {
        setVerificationLink(r.data.verification_link);
        toast.success("Novo link gerado");
      } else if (r.data?.already_verified) {
        toast.success("Email já confirmado. Faça login.");
        setVerificationStep(null);
        setIsLogin(true);
      } else {
        toast.success(r.data?.message || "Link reenviado");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao reenviar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });

      localStorage.setItem("token", response.data.access_token);

      const userResponse = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${response.data.access_token}` }
      });

      localStorage.setItem("user", JSON.stringify(userResponse.data));
      toast.success(`Bem-vindo, ${userResponse.data.name}!`);
      onLoginSuccess(userResponse.data);

    } catch (error) {
      console.error("Login error:", error);
      const detail = error.response?.data?.detail;

      if (detail === "EMAIL_NOT_VERIFIED" || error.response?.status === 403) {
        setPendingEmail(loginEmail);
        setVerificationStep('pending');
        // Try to refresh the link
        try {
          const r = await axios.post(`${API}/auth/resend-verification`, { email: loginEmail });
          if (r.data?.verification_link) setVerificationLink(r.data.verification_link);
        } catch {}
        toast.error("Confirme seu email antes de fazer login");
      } else {
        const errorMessage = typeof detail === 'string' ? detail : "Erro ao fazer login";
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!registerName || !registerEmail || !registerPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    if (registerPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const r = await axios.post(`${API}/auth/register`, {
        name: registerName,
        email: registerEmail,
        password: registerPassword
      });

      // Mock mode returns the verification link
      const link = r.data?.verification_link;
      setPendingEmail(registerEmail);
      if (link) setVerificationLink(link);
      setVerificationStep('pending');

      toast.success("Cadastro realizado! Confirme seu email para continuar.");

    } catch (error) {
      console.error("Register error:", error);
      const errorMessage = error.response?.data?.detail || "Erro ao cadastrar";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" data-testid="login-page">
      <div className="noise-overlay" />
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-shield">
            <ShieldCheck size={28} />
          </div>

          <div className="login-header">
            <h1 data-testid="login-title">
              {verificationStep === 'verifying'
                ? "Confirmando email..."
                : verificationStep === 'pending'
                ? "Confirme seu email"
                : isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h1>
            <p className="login-subtitle">
              {verificationStep === 'verifying'
                ? "Aguarde enquanto validamos seu token"
                : verificationStep === 'pending'
                ? `Enviamos um link de confirmação para ${pendingEmail}`
                : isLogin
                ? "Acesse sua conta para continuar seus estudos"
                : "Comece sua jornada de aprendizado profissional"}
            </p>
          </div>

          {verificationStep === 'verifying' && (
            <div className="login-form" style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="spinner-large" style={{ margin: '0 auto' }} />
            </div>
          )}

          {verificationStep === 'pending' && (
            <div className="login-form" data-testid="verification-pending">
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 12,
                padding: '1rem 1.15rem',
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'flex-start'
              }}>
                <MailCheck size={22} style={{ color: '#60A5FA', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.55 }}>
                  Em modo de teste o link aparece abaixo. Em produção, ele será enviado para o email cadastrado.
                </div>
              </div>

              {verificationLink && (
                <div className="form-group">
                  <label>
                    <ExternalLink size={16} />
                    Link de confirmação
                  </label>
                  <input
                    type="text"
                    value={verificationLink}
                    readOnly
                    onFocus={(e) => e.target.select()}
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={copyVerificationLink}
                      className="btn-secondary"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Copy size={16} /> Copiar link
                    </button>
                    <a
                      href={verificationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{
                        flex: 1, textDecoration: 'none', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                      }}
                    >
                      <CheckCircle2 size={16} /> Confirmar agora
                    </a>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={resendVerification}
                disabled={isLoading}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? 'Gerando...' : 'Gerar novo link'}
              </button>

              <button
                type="button"
                onClick={() => { setVerificationStep(null); setIsLogin(true); }}
                className="toggle-btn"
                style={{ marginTop: '0.5rem' }}
              >
                ← Voltar para login
              </button>
            </div>
          )}

          {!verificationStep && isLogin ? (
            <form onSubmit={handleLogin} className="login-form" data-testid="login-form">
              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={18} />
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={isLoading}
                  data-testid="login-email-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <Lock size={18} />
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  data-testid="login-password-input"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary-full"
                disabled={isLoading}
                data-testid="login-submit-btn"
              >
                <LogIn size={20} />
                {isLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : !verificationStep ? (
            <form onSubmit={handleRegister} className="login-form" data-testid="register-form">
              <div className="form-group">
                <label htmlFor="name">
                  <User size={18} />
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Seu nome completo"
                  disabled={isLoading}
                  data-testid="register-name-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-email">
                  <Mail size={18} />
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={isLoading}
                  data-testid="register-email-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-password">
                  <Lock size={18} />
                  Senha
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                  data-testid="register-password-input"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn-primary-full"
                disabled={isLoading}
                data-testid="register-submit-btn"
              >
                <UserPlus size={20} />
                {isLoading ? "Cadastrando..." : "Criar Conta"}
              </button>
            </form>
          ) : null}

          {!verificationStep && (
            <div className="login-toggle">
            <p>
              {isLogin ? "Ainda não tem uma conta?" : "Já tem uma conta?"}
            </p>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="toggle-btn"
              disabled={isLoading}
              data-testid="toggle-form-btn"
            >
              {isLogin ? "Cadastre-se aqui" : "Faça login"}
            </button>
          </div>
          )}
        </div>

        <div className="login-decoration">
          <div className="decoration-circle decoration-circle-1" />
          <div className="decoration-circle decoration-circle-2" />
          <div className="decoration-circle decoration-circle-3" />
        </div>
      </div>
    </div>
  );
}
