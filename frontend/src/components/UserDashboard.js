import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Users, Calendar, BookOpen, LogOut, User, Mail, Clock } from "lucide-react";
import WelcomeScreen from "./CinemaSeat";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function UserDashboard({ currentUser, onLogout }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayUsers: 0
  });

  useEffect(() => {
    loadUsers();
    
    // Show welcome for 3 seconds
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
    
    return () => clearTimeout(timer);
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
      toast.error("Erro ao carregar usuários");
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
      <div className="noise-overlay" />
      
      {/* Welcome Screen */}
      {showWelcome && (
        <div className="welcome-overlay">
          <WelcomeScreen userName={currentUser.name} />
        </div>
      )}
      
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 data-testid="dashboard-title">
              Olá, {currentUser.name}! 👋
            </h1>
            <p className="dashboard-subtitle">
              Bem-vindo ao painel de controle
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
          <div className="stat-card stat-card-purple">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total de Usuários</p>
              <p className="stat-value" data-testid="total-users">
                {stats.totalUsers}
              </p>
            </div>
          </div>

          <div className="stat-card stat-card-green">
            <div className="stat-icon">
              <Calendar size={32} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Cadastros Hoje</p>
              <p className="stat-value" data-testid="today-users">
                {stats.todayUsers}
              </p>
            </div>
          </div>

          <div className="stat-card stat-card-blue">
            <div className="stat-icon">
              <BookOpen size={32} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Sistema</p>
              <p className="stat-value">Ativo</p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="profile-section">
          <h2 className="section-title">Meu Perfil</h2>
          
          <div className="profile-card">
            <div className="profile-avatar">
              <User size={48} />
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
    </div>
  );
}
