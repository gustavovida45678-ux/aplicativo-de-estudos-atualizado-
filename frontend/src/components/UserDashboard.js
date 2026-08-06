import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Users, Calendar, BookOpen, LogOut, User, Mail, Clock, Activity, CheckCircle2, Zap, Brain, Globe, Shield, Code, Terminal, ExternalLink } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ACTIVE_SUBJECTS = [
  'Cálculo 1',
  'Cálculo 2',
  'Cálculo 3',
  'Cálculo Numérico',
  'Estrutura de Dados',
  'Sistemas Digitais',
];

const FREE_AI_PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['Gemini 3.5 Flash', 'Gemini 3.1 Pro (limitado)'],
    features: ['Busca web', 'Geração de imagens (~20/dia)', 'Análise de vídeos YouTube', 'Deep Research (5/mês)', 'Integração Google Workspace'],
    url: 'https://gemini.google.com',
    category: 'Multimodal',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    freeTier: 'Generoso - uso diário limitado'
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    models: ['Claude 3.5 Sonnet', 'Claude 3.5 Haiku'],
    features: ['200K tokens de contexto', 'Busca web incluída', 'Análise de documentos longos', 'Raciocínio avançado', 'Artefatos (código/visual)'],
    url: 'https://claude.ai',
    category: 'Raciocínio',
    icon: Brain,
    color: 'from-orange-500 to-red-500',
    freeTier: 'Limites variáveis por hora'
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    models: ['Modelo base', 'Pro Search (3-5/dia)'],
    features: ['Cita fontes em cada resposta', 'Busca em tempo real', 'Menos alucinações', 'Interface focada em pesquisa', 'Verificação contra fontes'],
    url: 'https://perplexity.ai',
    category: 'Pesquisa',
    icon: Globe,
    color: 'from-purple-500 to-pink-500',
    freeTier: 'Buscas básicas ilimitadas'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: ['DeepSeek V4 Flash', 'DeepSeek V4 Pro', 'DeepSeek R1 (reasoning)'],
    features: ['Sem limites práticos (500 msgs/hora anti-bot)', 'R1 para raciocínio passo a passo', 'Excelente para código', 'Contexto longo', 'API gratuita disponível'],
    url: 'https://chat.deepseek.com',
    category: 'Código/Raciocínio',
    icon: Code,
    color: 'from-green-500 to-teal-500',
    freeTier: 'Quase ilimitado'
  },
  {
    id: 'copilot',
    name: 'Microsoft Copilot',
    models: ['Família GPT-5 (seleção automática)'],
    features: ['Acesso a modelos OpenAI grátis', 'Geração de imagens (DALL-E)', 'Busca web via Bing', 'Integração Windows/Edge', 'Plugins disponíveis'],
    url: 'https://copilot.microsoft.com',
    category: 'Geral',
    icon: Globe,
    color: 'from-blue-600 to-indigo-600',
    freeTier: 'Limites diários de conversa'
  },
  {
    id: 'huggingchat',
    name: 'HuggingChat',
    models: ['115+ modelos open-source (Llama, Mistral, Qwen, DeepSeek, etc.)'],
    features: ['Transparência total (open source)', 'Escolha entre 115+ modelos', 'Sem tracking comercial', 'Busca web disponível', 'Sem conta necessária'],
    url: 'https://huggingface.co/chat',
    category: 'Open Source',
    icon: Shield,
    color: 'from-yellow-500 to-orange-500',
    freeTier: 'Totalmente gratuito'
  },
  {
    id: 'meta-ai',
    name: 'Meta AI (Llama 4)',
    models: ['Llama 4 Maverick', 'Llama 4 Scout'],
    features: ['Nativo multimodal (MoE)', 'Contexto de 10M tokens (API)', 'Integrado no WhatsApp/Instagram/Facebook', 'Sem conta adicional', 'Arquitetura inovadora'],
    url: 'https://meta.ai',
    category: 'Social',
    icon: Users,
    color: 'from-blue-500 to-blue-700',
    freeTier: 'Gratuito nas redes Meta'
  },
  {
    id: 'free-ai',
    name: 'Free.ai',
    models: ['Qwen 2.5 (7B-72B)', 'FLUX (imagem)', 'CogVideoX (vídeo)', 'Kokoro (TTS)', 'Whisper (STT)', '340+ via provedores externos'],
    features: ['30K tokens/dia grátis', 'Auto-hospedado em A100', 'API compatível OpenAI', 'Uso comercial OK', 'Latência zero (modelos próprios)'],
    url: 'https://free.ai',
    category: 'Plataforma Completa',
    icon: Zap,
    color: 'from-purple-600 to-pink-600',
    freeTier: '30.000 tokens/dia'
  },
  {
    id: 'groq',
    name: 'Groq',
    models: ['Llama 3.3 70B', 'Mixtral 8x7B', 'Gemma 2 9B'],
    features: ['Inferência ultra-rápida (LPU)', 'Tokens/seg extremamente altos', 'API gratuita generosa', 'Modelos open-source', 'Ótimo para streaming'],
    url: 'https://console.groq.com',
    category: 'Velocidade',
    icon: Zap,
    color: 'from-green-400 to-emerald-600',
    freeTier: '14.400 req/dia (grátis)'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: ['300+ modelos (grátis e pagos)', 'Gratuitos: Nemotron 3 Ultra, Qwen, Mistral, etc.'],
    features: ['Acesso unificado a centenas de modelos', 'Roteamento inteligente', 'Créditos grátis diários', 'API unificada', 'Ranking de modelos'],
    url: 'https://openrouter.ai',
    category: 'Agregador',
    icon: Globe,
    color: 'from-teal-500 to-cyan-500',
    freeTier: 'Créditos diários grátis'
  }
];

export default function UserDashboard({ currentUser, onLogout }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayUsers: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.get(`${API}/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUsers(response.data);
      
      // Calculate stats
      const today = new Date().toDateString();
      const todayUsers = response.data.filter(user => {
        const userDate = new Date(user.created_at).toDateString();
        return userDate === today;
      }).length;
      
      setStats({
        totalUsers: response.data.length,
        todayUsers: todayUsers
      });
      
    } catch (error) {
      console.error("Error loading users:", error);
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        toast.error("Erro ao carregar usuários");
      }
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Até logo! 👋");
    onLogout();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="dashboard-page" data-testid="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 data-testid="dashboard-title">
              Olá, {currentUser.name}!
            </h1>
            <p className="dashboard-subtitle">
              Bem-vindo ao seu painel de estudos — IFG Câmpus Jataí
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="logout-btn"
            data-testid="logout-btn"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-purple" data-testid="stat-total">
            <div className="stat-icon">
              <Users size={26} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total de Usuários</p>
              <p className="stat-value" data-testid="total-users">
                {stats.totalUsers}
              </p>
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: `${Math.min(stats.totalUsers * 10, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-green" data-testid="stat-today">
            <div className="stat-icon">
              <Calendar size={26} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Cadastros Hoje</p>
              <p className="stat-value" data-testid="today-users">
                {stats.todayUsers}
              </p>
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: `${Math.min(stats.todayUsers * 20, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-blue" data-testid="stat-subjects">
            <div className="stat-icon">
              <BookOpen size={26} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Matérias Ativas</p>
              <p className="stat-value" data-testid="active-subjects">
                {ACTIVE_SUBJECTS.length}
              </p>
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-green" data-testid="stat-system">
            <div className="stat-icon">
              <Activity size={26} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Sistema</p>
              <p className="stat-value">Online</p>
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Matérias Ativas */}
        <div className="subjects-section">
          <h2 className="section-title">Minhas Matérias</h2>
          <div className="subjects-grid">
            {ACTIVE_SUBJECTS.map((subject) => (
              <div className="subject-chip" key={subject}>
                <BookOpen size={16} />
                {subject}
              </div>
            ))}
          </div>
        </div>

        {/* User Profile Card */}
        <div className="profile-section">
          <h2 className="section-title">Meu Perfil</h2>
          
          <div className="profile-card">
            <div className="profile-avatar">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User size={38} />}
            </div>
            
            <div className="profile-info">
              <div className="profile-row">
                <User size={18} />
                <div>
                  <p className="profile-label">Nome</p>
                  <p className="profile-value" data-testid="user-name">
                    {currentUser.name}
                  </p>
                </div>
              </div>

              <div className="profile-row">
                <Mail size={18} />
                <div>
                  <p className="profile-label">Email</p>
                  <p className="profile-value" data-testid="user-email">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="profile-row">
                <Clock size={18} />
                <div>
                  <p className="profile-label">Cadastrado em</p>
                  <p className="profile-value" data-testid="user-created">
                    {formatDate(currentUser.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="users-section">
          <h2 className="section-title">Usuários Cadastrados</h2>
          
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state-small">
              <Users size={48} />
              <p>Nenhum usuário cadastrado ainda</p>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table" data-testid="users-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Data de Cadastro</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id} data-testid={`user-row-${index}`}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-small">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Provedores de IA Gratuitos */}
      <div className="ai-providers-section">
        <div className="section-header">
          <h2 className="section-title">
            <Zap size={22} />
            Provedores de IA Gratuitos
          </h2>
          <p className="section-subtitle">
            Acesse modelos poderosos sem custo — ideal para estudos, pesquisa e desenvolvimento
          </p>
        </div>
        <div className="ai-providers-grid">
          {FREE_AI_PROVIDERS.map((provider) => (
            <a
              key={provider.id}
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ai-provider-card"
            >
              <div className="provider-header">
                <div className={`provider-icon ${provider.color}`}>
                  <provider.icon size={24} />
                </div>
                <div className="provider-meta">
                  <h3 className="provider-name">{provider.name}</h3>
                  <span className="provider-category">{provider.category}</span>
                </div>
              </div>
              
              <div className="provider-models">
                <strong>Modelos:</strong>
                <ul>
                  {provider.models.map((model, idx) => (
                    <li key={idx}>{model}</li>
                  ))}
                </ul>
              </div>

              <div className="provider-features">
                <strong>Recursos:</strong>
                <ul>
                  {provider.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="provider-footer">
                <span className="free-tier-badge">{provider.freeTier}</span>
                <button className="visit-btn">
                  Acessar <ExternalLink size={14} />
                </button>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
