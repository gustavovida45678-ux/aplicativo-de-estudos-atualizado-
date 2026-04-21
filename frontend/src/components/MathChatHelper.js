import React, { useState } from 'react';
import { Send, X, MessageCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const MathChatHelper = ({ step, explanation, questionText, isOpen, onClose }) => {
  const [userQuestion, setUserQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: 'Olá! Estou aqui para tirar suas dúvidas sobre este problema matemático. Como posso ajudar? 🤓',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendQuestion = async () => {
    if (!userQuestion.trim()) return;

    const newUserMessage = {
      role: 'user',
      content: userQuestion,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, newUserMessage]);
    setUserQuestion('');
    setIsLoading(true);

    try {
      // Monta contexto COMPLETO com toda a explicação
      const fullContext = `
QUESTÃO ORIGINAL: ${questionText || 'Não especificada'}

EXPLICAÇÃO COMPLETA:
Título: ${explanation?.title || ''}

TODOS OS PASSOS DA RESOLUÇÃO:
${explanation?.steps?.map((s, i) => `
Passo ${i + 1}: ${s.title}
Conteúdo: ${s.content}
${s.formula ? `Fórmula: ${s.formula}` : ''}
${s.calculation ? `Cálculo: ${s.calculation}` : ''}
`).join('\n') || ''}

PRÉ-REQUISITOS NECESSÁRIOS:
${explanation?.prerequisites?.map(p => `- ${p.topic}: ${p.description}`).join('\n') || ''}

PASSO ATUAL EM ANÁLISE:
${step?.title || ''}
${step?.content || ''}

DÚVIDA DO ALUNO: ${userQuestion}

Por favor, explique de forma CLARA e DETALHADA, usando linguagem simples. Se houver fórmulas matemáticas, explique o significado de cada variável. Seja um professor paciente e didático.`;

      const response = await axios.post(`${API}/api/chat/send`, {
        message: fullContext,
        session_id: `math-help-${Date.now()}`
      });

      const assistantMessage = {
        role: 'assistant',
        content: typeof response.data.response === 'string' 
          ? response.data.response 
          : response.data.assistant_message?.content || 'Desculpe, não consegui processar sua pergunta. Por favor, reformule sua dúvida.',
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      
      let errorMessage = '⚠️ Ocorreu um erro ao processar sua pergunta.';
      
      // Check for budget error
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string' && (detail.includes('budget') || detail.includes('Budget'))) {
          errorMessage = '⚠️ Orçamento da chave API esgotado. Para continuar usando o chat de dúvidas com IA, adicione créditos em Profile → Universal Key → Add Balance.';
        } else {
          errorMessage = typeof detail === 'string' ? detail : '⚠️ Erro desconhecido. Tente reformular sua pergunta.';
        }
      }
      
      toast.error('Erro ao enviar mensagem');
      
      const errorMsg = {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onClose}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 group"
      >
        <MessageCircle size={24} />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-purple-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Sparkles className="text-cyan-500" size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Dexter IA</h3>
            <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full">Beta</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-1 rounded-full transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-cyan-50 text-gray-800 rounded-bl-none border border-cyan-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-cyan-50 p-3 rounded-2xl rounded-bl-none border border-cyan-200">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white rounded-b-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
            placeholder="Digite sua dúvida..."
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-cyan-400 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendQuestion}
            disabled={isLoading || !userQuestion.trim()}
            className="bg-cyan-500 text-white p-2 rounded-full hover:bg-cyan-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MathChatHelper;
