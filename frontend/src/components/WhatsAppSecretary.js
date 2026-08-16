import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Phone, QrCode, RefreshCw, Send, X, Loader2, CheckCircle, AlertCircle, LogOut, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = `${import.meta.env.VITE_API_URL || "https://aplicativo-de-estudos-atualizado-s.onrender.com"}/api/whatsapp`;

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

export function WhatsAppSecretary({ currentUser }) {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [qr, setQr] = useState(null);
  const [polling, setPolling] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedJid, setSelectedJid] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isPaired, setIsPaired] = useState(false);
  const pollRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API}/status`);
      const d = await r.json();
      setStatus(d);
      if (d.connection_state === "open") {
        setIsPaired(true);
        setQr(null);
      } else {
        setIsPaired(false);
      }
    } catch (e) {
      setStatus({ ok: false, error: "Backend inacessível" });
    }
  }, []);

  const fetchQr = useCallback(async () => {
    try {
      const r = await fetch(`${API}/qr`);
      const d = await r.json();
      if (d.qr) setQr(d.qr);
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const r = await fetch(`${API}/conversations`);
      const d = await r.json();
      if (d.ok && Array.isArray(d.conversations)) {
        setConversations(d.conversations);
        if (!selectedJid && d.conversations.length > 0) {
          setSelectedJid(d.conversations[0].jid);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [selectedJid]);

  const fetchMessages = useCallback(async (jid) => {
    if (!jid) return;
    try {
      const r = await fetch(`${API}/messages?jid=${encodeURIComponent(jid)}`);
      const d = await r.json();
      if (d.ok) setMessages(d.messages);
    } catch (e) {
      // ignore
    }
  }, []);

  const poll = useCallback(() => {
    setPolling(true);
    fetchStatus();
    const loop = setInterval(async () => {
      await fetchStatus();
      if (isPaired) {
        await fetchConversations();
        if (selectedJid) await fetchMessages(selectedJid);
      }
    }, 6000);
    pollRef.current = loop;
  }, [fetchStatus, fetchConversations, fetchMessages, isPaired, selectedJid]);

  useEffect(() => {
    poll();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      setPolling(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPaired && selectedJid) fetchMessages(selectedJid);
  }, [selectedJid, isPaired, fetchMessages]);

  const handlePairClick = () => {
    setShowQr(true);
    fetchQr();
    const t = setInterval(() => {
      fetchQr();
      fetchStatus();
    }, 4000);
    const stop = () => clearInterval(t);
    const observer = setInterval(() => {
      if (isPaired) {
        stop();
        clearInterval(observer);
        setShowQr(false);
      }
    }, 2000);
  };

  const handleSend = async () => {
    if (!selectedJid || !input.trim() || sending) return;
    setSending(true);
    try {
      const r = await fetch(`${API}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jid: selectedJid, text: input.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        setInput("");
        fetchMessages(selectedJid);
        toast({ title: "Mensagem enviada" });
      } else {
        toast({ title: "Falha ao enviar", description: JSON.stringify(d.detail || d) });
      }
    } catch (e) {
      toast({ title: "Erro de rede" });
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/logout`, { method: "POST" });
    } catch (e) {
      // ignore
    }
    setIsPaired(false);
    setQr(null);
    setConversations([]);
    setMessages([]);
    setSelectedJid(null);
    toast({ title: "WhatsApp desconectado" });
  };

  const stateLabel = {
    open: "Conectado ao WhatsApp",
    connecting: "Conectando...",
    close: "Desconectado",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 whatsapp-secretary">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-[#25d366]/15 text-[#25d366]">
          <MessageCircle size={28} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Secretaria Virtual</h1>
          <p className="text-sm text-gray-400">
            A IA responde suas dúvidas no WhatsApp automaticamente. Escaneie o QR code para conectar seu número.
          </p>
        </div>
        {isPaired && (
          <button className="btn-secondary text-xs flex items-center gap-1" onClick={handleLogout}>
            <LogOut size={14} /> Desconectar
          </button>
        )}
      </div>

      {!isPaired && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="p-6 rounded-2xl border border-gray-800 bg-[#161b22]">
            <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
              <QrCode size={18} /> Conectar WhatsApp
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              1. Abra o WhatsApp no celular · 2. Menu <strong className="text-white">Aparelhos conectados</strong> ·
              3. <strong className="text-white">Conectar um aparelho</strong> · 4. Escaneie o QR abaixo
            </p>
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={handlePairClick}>
              {showQr ? <RefreshCw size={16} /> : <QrCode size={16} />}
              {showQr ? "Atualizar QR" : "Gerar QR Code"}
            </button>
            {showQr && (
              <div className="mt-4 flex flex-col items-center gap-3">
                {qr ? (
                  <>
                    <img src={qr} alt="QR Code do WhatsApp" className="qr-code-image rounded-xl" />
                    <p className="text-xs text-gray-500">O QR expira em poucos minutos — atualize se necessário.</p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                    <Loader2 size={16} className="spin" /> Gerando QR code...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl border border-gray-800 bg-[#161b22]">
            <h2 className="font-semibold text-white mb-3">Como funciona</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-2">
                <CheckCircle size={16} className="text-[#25d366] shrink-0 mt-0.5" />
                Você escreve a dúvida no WhatsApp do seu próprio número e a Secretária responde com IA (estudos, matérias, rotina).
              </li>
              <li className="flex gap-2">
                <Volume2 size={16} className="text-[#25d366] shrink-0 mt-0.5" />
                Se configurado, ela pode responder também por áudio.
              </li>
              <li className="flex gap-2">
                <Phone size={16} className="text-[#25d366] shrink-0 mt-0.5" />
                As conversas ficam registradas aqui no painel.
              </li>
            </ul>
            <div className="mt-4 text-xs text-gray-500">
              Status: {status?.ok === false ? <span className="text-red-400">{status.error}</span> : (stateLabel[status?.connection_state] || "Verificando...")}
            </div>
          </div>
        </div>
      )}

      {isPaired && (
        <div className="grid md:grid-cols-[280px_1fr] gap-4 secretary-chat">
          <div className="rounded-2xl border border-gray-800 bg-[#161b22] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Conversas</span>
              <button className="text-gray-400 hover:text-white" onClick={fetchConversations} title="Atualizar">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Nenhuma conversa ainda. Envie uma mensagem para o seu número no WhatsApp.</div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.jid}
                    onClick={() => setSelectedJid(c.jid)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors ${selectedJid === c.jid ? "bg-gray-800/60" : ""}`}
                  >
                    <div className="text-sm font-medium text-white">{c.name || c.phone || c.jid}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{c.last_message}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#161b22] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#25d366]" />
              <span className="text-sm font-semibold text-white">
                {selectedJid ? (conversations.find(c => c.jid === selectedJid)?.name || selectedJid) : "Selecione uma conversa"}
              </span>
            </div>
            <div className="flex-1 min-h-[300px] max-h-[420px] overflow-y-auto p-4 space-y-2 bg-black/20">
              {messages.length === 0 ? (
                <div className="text-sm text-gray-500 text-center pt-10">
                  Ainda não há mensagens nesta conversa.
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                      m.direction === "outbound"
                        ? "bg-[#25d366]/15 text-white ml-auto"
                        : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    <div>{m.text}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{formatTime(m.created_at)}</div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-gray-800 flex gap-2">
              <input
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#25d366]"
                placeholder="Escreva uma mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                disabled={!selectedJid}
              />
              <button className="btn-primary px-4 flex items-center gap-2" onClick={handleSend} disabled={!selectedJid || !input.trim() || sending}>
                {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}