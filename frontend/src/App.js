import { useState, useEffect, useRef } from "react";
import "./App.css";
import "@/styles/studySchedule.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Send, Image as ImageIcon, X, Sparkles, MessageSquare, BookOpen, GraduationCap, Calendar, LayoutDashboard, Lightbulb, Calculator, FileText, Zap, ListChecks, Library, BrainCircuit, Settings } from "lucide-react";
import { Toaster, toast } from "sonner";
import MathExplainer from "./components/MathExplainer";
import ExerciseSystem from "./components/ExerciseSystem";
import ApiKeySettings, { getCustomApiKey } from "./components/ApiKeySettings";
import StudyMaterials from "./components/StudyMaterials";
import LoginPage from "./components/LoginPage";
import UserDashboard from "./components/UserDashboard";
import SmartDashboard from "./components/SmartDashboard";
import FeedbackForm from "./components/FeedbackForm";
import AdaptiveStudy from "./components/adaptive/AdaptiveStudy";
// import DebugPanel from "./components/DebugPanel"; // Removed

import { BACKEND_URL } from "./lib/backendUrl";
const API = `${BACKEND_URL}/api`;

// Configure axios interceptor more safely
let interceptorAdded = false;
if (!interceptorAdded) {
  axios.interceptors.request.use((config) => {
    // Add custom API key for chat
    const customKey = getCustomApiKey();
    if (customKey && config.url && config.url.includes('/api/')) {
      config.headers['X-Custom-API-Key'] = customKey;
    }
    
    // Add JWT token for authentication
    const token = localStorage.getItem("token");
    if (token && config.url && config.url.includes('/api/')) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  }, (error) => {
    return Promise.reject(error);
  });
  interceptorAdded = true;
}

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adaptiveStart, setAdaptiveStart] = useState(false);
  const [adaptiveView, setAdaptiveView] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageGenModal, setShowImageGenModal] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState("");
  const [chatProviders, setChatProviders] = useState([]);
  const [selectedChatProvider, setSelectedChatProvider] = useState("auto");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load available AI providers for the chat selector
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await axios.get(`${API}/providers`);
        const list = response.data?.providers || [];
        setChatProviders(list);
        const saved = localStorage.getItem("chat_provider");
        if (saved && (saved === "auto" || list.some(p => p.type === saved))) {
          setSelectedChatProvider(saved);
        }
      } catch (error) {
        console.error("Error loading providers:", error);
      }
    };
    loadProviders();
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) {
      setIsCheckingAuth(false);
      setIsAuthenticated(false);
      return;
    }
    
    try {
      // Verify token is still valid
      const response = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCurrentUser(response.data);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error("Auth check failed:", error);
      // Clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab("dashboard");
    setAdaptiveStart(false);
    setAdaptiveView(null);
  };

  const openStudy = () => {
    setAdaptiveStart(false);
    setAdaptiveView(null);
    setActiveTab("adaptive");
  };

  const startStudyNow = () => {
    setAdaptiveStart(true);
    setAdaptiveView(null);
    setActiveTab("adaptive");
  };

  const openAdaptiveView = (view) => {
    setAdaptiveStart(false);
    setAdaptiveView(view);
    setActiveTab("adaptive");
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    // Load existing messages
    const loadMessages = async () => {
      try {
        const response = await axios.get(`${API}/messages`);
        setMessages(response.data);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };
    if (activeTab === 'chat') {
      loadMessages();
    }
  }, [activeTab]);

  // Drag and drop handlers
  useEffect(() => {
    if (activeTab !== 'chat') return;

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleMultipleFiles(files);
      }
    };

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) {
              handleImageFile(file);
              e.preventDefault();
            }
          }
        }
      }
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
      document.removeEventListener("paste", handlePaste);
    };
  }, [activeTab]);

  const handleImageFile = (file) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas arquivos de imagem (PNG, JPG, WEBP, etc.)");
      return;
    }
    
    // Add to existing images
    setSelectedImages(prev => [...prev, file]);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews(prev => [...prev, { file: file.name, preview: reader.result }]);
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith("image/")) {
        handleImageFile(file);
      }
    });
  };

  const handleImageSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleMultipleFiles(files);
    }
  };

  const clearImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputMessage.trim() && selectedImages.length === 0) || isLoading) return;

    const userMessage = inputMessage.trim() || "Analise estas imagens";
    
    // Check if user wants to generate an image with commands like "/gerar", "/imagem", etc.
    if (userMessage.toLowerCase().startsWith("/gerar ") || 
        userMessage.toLowerCase().startsWith("/imagem ") ||
        userMessage.toLowerCase().startsWith("/criar ")) {
      const prompt = userMessage.split(" ").slice(1).join(" ");
      if (prompt) {
        handleGenerateImage(prompt);
        setInputMessage("");
        return;
      }
    }
    
    setInputMessage("");
    setIsLoading(true);

    try {
      if (selectedImages.length > 0) {
        // Send images with message
        const formData = new FormData();
        
        // Use only the first image for now (backend expects single image)
        formData.append("image", selectedImages[0]);
        formData.append("message", userMessage);
        formData.append("provider", selectedChatProvider);
        const customKey = getCustomApiKey(selectedChatProvider);
        if (customKey) formData.append("custom_api_key", customKey);

        const response = await axios.post(`${API}/chat/images`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setMessages((prev) => [
          ...prev,
          response.data.user_message,
          response.data.assistant_message,
        ]);
        clearAllImages();
        toast.success("Imagem analisada com sucesso!");
      } else {
        // Send text only
        const payload = {
          message: userMessage,
          provider: selectedChatProvider,
        };
        const customKey = getCustomApiKey(selectedChatProvider);
        if (customKey) payload.custom_api_key = customKey;

        const response = await axios.post(`${API}/chat`, payload);

        setMessages((prev) => [
          ...prev,
          response.data.user_message,
          response.data.assistant_message,
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Get error message from backend - ensure it's always a string
      let errorMessage = "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.";
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Convert to string if it's an object
        errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail);
      } else if (error.response?.status === 400 || error.response?.status === 401) {
        errorMessage = "⚠️ Para usar o chat, você precisa configurar sua chave OpenAI.\n\n👉 Clique no botão roxo 'Configurar API Keys' no canto superior direito e adicione sua chave na aba OpenAI.";
      }
      
      toast.error(errorMessage, { duration: 6000 });
      
      // Add error message to chat (without status code prefix)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          content: userMessage,
          timestamp: new Date().toISOString(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: errorMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
      clearAllImages();
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleGenerateImage = async (prompt) => {
    setIsGeneratingImage(true);
    setShowImageGenModal(false);
    setImageGenPrompt("");

    try {
      const response = await axios.post(`${API}/generate-image`, {
        prompt: prompt,
        number_of_images: 1,
      });

      setMessages((prev) => [
        ...prev,
        response.data.user_message,
        response.data.assistant_message,
      ]);
      toast.success("Imagem gerada com sucesso!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Erro ao gerar imagem. Tente novamente.");
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          content: `🎨 Gerar imagem: ${prompt}`,
          timestamp: new Date().toISOString(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro ao gerar a imagem. Por favor, tente novamente.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsGeneratingImage(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="App neural-void-bg">
      <Toaster position="top-center" theme="dark" />
      <div className="noise-overlay" />
      
      {/* Show loading while checking auth */}
      {isCheckingAuth ? (
        <div className="auth-loading">
          <div className="spinner-large" />
          <p>Carregando...</p>
        </div>
      ) : !isAuthenticated ? (
        /* Show login page if not authenticated */
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        /* Show main app if authenticated */
        <>
          {/* API Key Settings */}
          <ApiKeySettings />

          {/* Navigation Tabs */}
          <div className="nav-tabs-container">
            <div className="nav-group">
              <span className="nav-group-label">Início</span>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
                data-testid="tab-dashboard"
              >
                <LayoutDashboard size={18} />
                <span className="nav-tab-text">Início</span>
              </button>
            </div>

            <div className="nav-group">
              <span className="nav-group-label">Estudar</span>
              <button
                onClick={() => setActiveTab("adaptive")}
                className={`nav-tab ${activeTab === "adaptive" ? "active" : ""}`}
                data-testid="tab-adaptive"
              >
                <BrainCircuit size={18} />
                <span className="nav-tab-text">Estudo</span>
              </button>
              <button
                onClick={() => setActiveTab("exercises")}
                className={`nav-tab exercises ${activeTab === "exercises" ? "active" : ""}`}
                data-testid="tab-exercises"
              >
                <GraduationCap size={18} />
                <span className="nav-tab-text">Exercícios</span>
              </button>
              <button
                onClick={() => setActiveTab("math")}
                className={`nav-tab ${activeTab === "math" ? "active" : ""}`}
                data-testid="tab-math"
              >
                <BookOpen size={18} />
                <span className="nav-tab-text">Matemática</span>
              </button>
              <button
                onClick={() => setActiveTab("materials")}
                className={`nav-tab materials ${activeTab === "materials" ? "active" : ""}`}
                data-testid="tab-materials"
              >
                <Library size={18} />
                <span className="nav-tab-text">Materiais</span>
              </button>
            </div>

            <div className="nav-group">
              <span className="nav-group-label">IA</span>
              <button
                onClick={() => setActiveTab("chat")}
                className={`nav-tab ${activeTab === "chat" ? "active" : ""}`}
                data-testid="tab-chat"
              >
                <MessageSquare size={18} />
                <span className="nav-tab-text">Chat</span>
              </button>
            </div>

            <div className="nav-group">
              <span className="nav-group-label">Conta</span>
              <button
                onClick={() => setActiveTab("feedback")}
                className={`nav-tab feedback ${activeTab === "feedback" ? "active" : ""}`}
                data-testid="tab-feedback"
              >
                <Lightbulb size={18} />
                <span className="nav-tab-text">Sugestões</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`nav-tab ${activeTab === "settings" ? "active" : ""}`}
                data-testid="tab-settings"
              >
                <Settings size={18} />
                <span className="nav-tab-text">Conta</span>
              </button>
            </div>
          </div>

{activeTab === "dashboard" ? (
            <SmartDashboard
              currentUser={currentUser}
              onStartStudy={startStudyNow}
              onOpenErrors={() => openAdaptiveView("errors")}
              onOpenDomain={() => openAdaptiveView("domain")}
              onOpenStudy={openStudy}
            />
          ) : activeTab === "adaptive" ? (
            <AdaptiveStudy
              autoStart={adaptiveStart}
              autoView={adaptiveView}
              onAutoConsumed={() => setAdaptiveStart(false)}
            />
          ) : activeTab === "settings" ? (
            <UserDashboard currentUser={currentUser} onLogout={handleLogout} />
          ) : activeTab === "feedback" ? (
            <FeedbackForm currentUser={currentUser} />
          ) : activeTab === "materials" ? (
            <StudyMaterials />
          ) : activeTab === "exercises" ? (
            <ExerciseSystem />
          ) : activeTab === "math" ? (
            <MathExplainer />
          ) : (
        <>
          {/* Drag and drop overlay */}
          {isDragging && (
        <div className="drag-drop-overlay" data-testid="drag-drop-overlay">
          <div className="drag-drop-content">
            <ImageIcon size={64} />
            <p>Solte a imagem aqui</p>
          </div>
        </div>
      )}

      {/* Image generation modal */}
      {showImageGenModal && (
        <div className="modal-overlay" onClick={() => setShowImageGenModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎨 Gerar Imagem com IA</h2>
              <button
                className="modal-close"
                onClick={() => setShowImageGenModal(false)}
                data-testid="close-modal-btn"
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Descreva a imagem que deseja criar. Seja o mais específico possível para melhores resultados.
              </p>
              <textarea
                value={imageGenPrompt}
                onChange={(e) => setImageGenPrompt(e.target.value)}
                placeholder="Ex: Uma paisagem futurista com montanhas flutuantes e cachoeiras luminosas ao pôr do sol..."
                className="image-gen-textarea"
                rows={4}
                data-testid="image-gen-prompt"
                autoFocus
              />
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowImageGenModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (imageGenPrompt.trim()) {
                      handleGenerateImage(imageGenPrompt.trim());
                    }
                  }}
                  disabled={!imageGenPrompt.trim()}
                  data-testid="generate-image-btn"
                >
                  <Sparkles size={18} />
                  Gerar Imagem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {messages.length === 0 && !isLoading ? (
        <div className="empty-state">
          <h1 data-testid="welcome-heading">
            Olá, {currentUser?.name || 'Usuário'}
          </h1>
          <p className="welcome-subtitle-chat">Como posso ajudar você hoje?</p>
          <p data-testid="welcome-message">
            Digite sua dúvida abaixo para começar.
          </p>
        </div>
      ) : (
        <div className="chat-container" data-testid="chat-container">
          {messages.map((message) => (
            <div
              key={message.id}
              data-testid={`message-${message.role}`}
              className={
                message.role === "user"
                  ? "message-bubble-user"
                  : "message-bubble-ai"
              }
            >
              {message.image_urls && message.image_urls.length > 0 && (
                <div className="message-images-grid">
                  {message.image_urls.map((url, idx) => (
                    <img
                      key={idx}
                      src={`${BACKEND_URL}${url}`}
                      alt={`Uploaded ${idx + 1}`}
                      className="message-image"
                    />
                  ))}
                </div>
              )}
              {message.image_url && (
                <img
                  src={`${BACKEND_URL}${message.image_url}`}
                  alt="Uploaded"
                  className="message-image"
                />
              )}
              {message.role === "user" ? (
                <div>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</div>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                </ReactMarkdown>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="typing-indicator" data-testid="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}

          {isGeneratingImage && (
            <div className="generating-indicator" data-testid="generating-indicator">
              <Sparkles className="sparkle-icon" size={32} />
              <p>Gerando imagem com IA...</p>
              <span className="generating-subtext">Isso pode levar até 1 minuto</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="input-command-bar"
        data-testid="chat-form"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          multiple
          style={{ display: "none" }}
        />

        <div className="chat-provider-bar">
          <select
            value={selectedChatProvider}
            onChange={(e) => {
              setSelectedChatProvider(e.target.value);
              localStorage.setItem("chat_provider", e.target.value);
            }}
            className="chat-provider-select"
            data-testid="chat-provider-select"
            title="Provedor de IA (auto escolhe o primeiro configurado)"
          >
            <option value="auto">🤖 Auto (Claude/Gemini/Groq)</option>
            {chatProviders.map((provider) => (
              <option key={provider.type} value={provider.type}>
                {provider.has_key ? "✓ " : "🔑 "}
                {provider.name}
              </option>
            ))}
          </select>
          <span className="chat-provider-hint">
            {selectedChatProvider === "auto"
              ? "Auto detecta o primeiro provedor com chave"
              : chatProviders.find(p => p.type === selectedChatProvider)?.free_tier || ""}
          </span>
        </div>

        {imagePreviews.length > 0 && (
          <div className="images-preview-container">
            {imagePreviews.map((img, index) => (
              <div key={index} className="image-preview-wrapper">
                <img src={img.preview} alt={`Preview ${index + 1}`} className="image-preview" />
                <button
                  type="button"
                  onClick={() => clearImage(index)}
                  className="clear-image-btn"
                  data-testid={`clear-image-btn-${index}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {imagePreviews.length > 1 && (
              <button
                type="button"
                onClick={clearAllImages}
                className="clear-all-btn"
                data-testid="clear-all-images-btn"
              >
                Limpar Todas
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="image-upload-btn"
          disabled={isLoading || isGeneratingImage}
          data-testid="image-upload-btn"
          title="Adicionar imagens (múltiplas)"
        >
          <ImageIcon size={20} />
          {imagePreviews.length > 0 && (
            <span className="image-count">{imagePreviews.length}</span>
          )}
        </button>

        <input
          ref={inputRef}
          type="text"
          data-testid="message-input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            imagePreviews.length > 0
              ? `${imagePreviews.length} imagem(ns) selecionada(s)...`
              : "Digite sua mensagem ou envie imagens..."
          }
          disabled={isLoading}
        />
        <button
          type="submit"
          data-testid="send-button"
          disabled={isLoading || isGeneratingImage || (!inputMessage.trim() && selectedImages.length === 0)}
        >
          <Send size={18} />
          Enviar
        </button>
      </form>
        </>
      )}
        </>
      )}
    </div>
  );
}

export default App;
