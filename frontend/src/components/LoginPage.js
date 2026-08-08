import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { LogIn, User, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { BACKEND_URL } from "../lib/backendUrl";

const API = `${BACKEND_URL}/api`;

export default function LoginPage({ onLoginSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestAccess = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Preencha nome e email");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/auth/guest`, {
        name: name.trim(),
        email: email.trim()
      });

      localStorage.setItem("token", response.data.access_token);

      const userResponse = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${response.data.access_token}` }
      });

      localStorage.setItem("user", JSON.stringify(userResponse.data));
      toast.success(`Bem-vindo, ${userResponse.data.name}!`);
      onLoginSuccess(userResponse.data);

    } catch (error) {
      console.error("Guest access error:", error);
      const detail = error.response?.data?.detail;
      const errorMessage = typeof detail === 'string' ? detail : "Erro ao acessar. Tente novamente.";
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
            <h1 data-testid="login-title">Bem-vindo</h1>
            <p className="login-subtitle">
              Acesso rápido: informe seu nome e email para continuar seus estudos
            </p>
          </div>

          <form onSubmit={handleGuestAccess} className="login-form" data-testid="login-form">
            <div className="form-group">
              <label htmlFor="name">
                <User size={18} />
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                disabled={isLoading}
                data-testid="login-name-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isLoading}
                data-testid="login-email-input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary-full"
              disabled={isLoading}
              data-testid="login-submit-btn"
            >
              {isLoading ? (
                <span className="spinner-small" style={{ marginRight: 8 }} />
              ) : (
                <LogIn size={20} />
              )}
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="login-toggle">
            <p style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} />
              Sem senha, sem cadastro — apenas nome e email
            </p>
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
