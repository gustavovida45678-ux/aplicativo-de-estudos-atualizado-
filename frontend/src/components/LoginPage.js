import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { UserPlus, LogIn, Mail, Lock, User, ShieldCheck } from "lucide-react";

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

  // Bible verse
  const bibleVerse = {
    text: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13"
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
      
      // Save token to localStorage
      localStorage.setItem("token", response.data.access_token);
      
      // Get user info
      const userResponse = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`
        }
      });
      
      // Save user info
      localStorage.setItem("user", JSON.stringify(userResponse.data));
      
      toast.success(`Bem-vindo, ${userResponse.data.name}! 🎉`);
      
      // Call parent callback
      onLoginSuccess(userResponse.data);
      
    } catch (error) {
      console.error("Login error:", error);
      
      const errorMessage = error.response?.data?.detail || "Erro ao fazer login";
      toast.error(errorMessage);
      
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
      // Register user
      await axios.post(`${API}/auth/register`, {
        name: registerName,
        email: registerEmail,
        password: registerPassword
      });
      
      toast.success("Cadastro realizado com sucesso! Faça login.");
      
      // Switch to login form
      setIsLogin(true);
      setLoginEmail(registerEmail);
      setLoginPassword(registerPassword);
      
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
              {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h1>
            <p className="login-subtitle">
              {isLogin
                ? "Acesse sua conta para continuar seus estudos"
                : "Comece sua jornada de aprendizado profissional"}
            </p>
          </div>

          {isLogin ? (
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
          ) : (
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
          )}

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
