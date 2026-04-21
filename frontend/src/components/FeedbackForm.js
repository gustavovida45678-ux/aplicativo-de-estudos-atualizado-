import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Send, MessageSquare, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function FeedbackForm({ currentUser }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Preencha o assunto e a mensagem');
      return;
    }

    setIsSending(true);

    try {
      await axios.post(`${API}/feedback/send`, {
        user_name: currentUser.name,
        user_email: currentUser.email,
        subject: subject,
        message: message
      });

      toast.success('Sugestão enviada com sucesso! Obrigado pelo feedback! 🎉');
      setSubject('');
      setMessage('');
      
    } catch (error) {
      console.error('Error sending feedback:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao enviar sugestão';
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lightbulb className="text-yellow-400" size={40} />
            <h1 className="text-3xl font-bold text-white">
              Sugestões e Melhorias
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Sua opinião é muito importante! Envie suas sugestões para melhorar a plataforma.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <MessageSquare className="text-blue-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-blue-300 text-sm font-medium mb-1">
                Como funciona?
              </p>
              <p className="text-gray-400 text-sm">
                Sua mensagem será enviada diretamente para nossa equipe. 
                Responderemos o mais breve possível no email: <strong>{currentUser.email}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Seu Nome
              </label>
              <input
                type="text"
                value={currentUser.name}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white cursor-not-allowed opacity-70"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Seu Email
              </label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white cursor-not-allowed opacity-70"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Assunto *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Sugestão de nova funcionalidade"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
              data-testid="feedback-subject"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Sua Sugestão ou Comentário *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva sua sugestão, problema ou ideia de melhoria..."
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              required
              data-testid="feedback-message"
            />
            <p className="text-gray-500 text-xs mt-2">
              Seja o mais detalhado possível para nos ajudar a entender melhor sua sugestão
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSending || !subject.trim() || !message.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg"
            data-testid="submit-feedback-btn"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="inline mr-2" size={20} />
                Enviar Sugestão
              </>
            )}
          </Button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            💡 Todas as sugestões são lidas e consideradas pela nossa equipe!
          </p>
        </div>
      </Card>
    </div>
  );
}
