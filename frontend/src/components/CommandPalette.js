import { useState, useEffect } from 'react';
import { Terminal, X, Zap, Sparkles, Code, Palette } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Lista de comandos disponíveis
  const commands = [
    {
      cmd: '/help',
      description: 'Mostra todos os comandos disponíveis',
      action: () => {
        return 'Comandos disponíveis:\n' + commands.map(c => `${c.cmd} - ${c.description}`).join('\n');
      }
    },
    {
      cmd: '/clear',
      description: 'Limpa o histórico de comandos',
      action: () => {
        setHistory([]);
        return 'Histórico limpo!';
      }
    },
    {
      cmd: '/theme [dark|light]',
      description: 'Muda o tema do aplicativo',
      action: (args) => {
        const theme = args[0];
        if (theme === 'dark' || theme === 'light') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
          return `Tema alterado para: ${theme}`;
        }
        return 'Use: /theme dark ou /theme light';
      }
    },
    {
      cmd: '/add-task [matéria] [descrição]',
      description: 'Adiciona uma tarefa rápida',
      action: (args) => {
        if (args.length < 2) return 'Use: /add-task [matéria] [descrição]';
        const [subject, ...descParts] = args;
        const description = descParts.join(' ');
        // Aqui você pode integrar com o sistema de tarefas
        return `✅ Tarefa adicionada: ${description} (${subject})`;
      }
    },
    {
      cmd: '/stats',
      description: 'Mostra estatísticas do aplicativo',
      action: () => {
        const stats = localStorage.getItem('studySessions');
        const sessions = stats ? JSON.parse(stats).length : 0;
        return `📊 Estatísticas:\n- Sessões de estudo: ${sessions}\n- Total de exercícios: 137\n- Tópicos disponíveis: 13`;
      }
    },
    {
      cmd: '/export',
      description: 'Exporta seus dados de estudo',
      action: () => {
        const data = {
          sessions: localStorage.getItem('studySessions'),
          tasks: localStorage.getItem('studyTasks'),
          subjects: localStorage.getItem('studySubjects'),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study-data-${new Date().toISOString()}.json`;
        a.click();
        return '📥 Dados exportados com sucesso!';
      }
    },
    {
      cmd: '/focus [matéria]',
      description: 'Define o foco de estudo para uma matéria',
      action: (args) => {
        if (args.length === 0) return 'Use: /focus [calc1|calc2|calc3|calcnum]';
        const subject = args[0];
        localStorage.setItem('focus_subject', subject);
        return `🎯 Foco definido em: ${subject}`;
      }
    }
  ];

  // Detectar Ctrl+K para abrir o command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Atualizar sugestões baseado no input
  useEffect(() => {
    if (command.startsWith('/')) {
      const filtered = commands.filter(c => 
        c.cmd.toLowerCase().includes(command.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [command]);

  const executeCommand = (cmd) => {
    const parts = cmd.trim().split(' ');
    const mainCmd = parts[0];
    const args = parts.slice(1);

    const commandObj = commands.find(c => c.cmd.split(' ')[0] === mainCmd);
    
    if (commandObj) {
      const result = commandObj.action(args);
      
      setHistory(prev => [...prev, { 
        command: cmd, 
        result, 
        timestamp: new Date().toLocaleTimeString() 
      }]);
      
      toast.success(result);
    } else {
      const errorMsg = `❌ Comando não encontrado: ${mainCmd}. Digite /help para ver comandos disponíveis.`;
      setHistory(prev => [...prev, { 
        command: cmd, 
        result: errorMsg, 
        timestamp: new Date().toLocaleTimeString(),
        error: true 
      }]);
      toast.error(errorMsg);
    }

    setCommand('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim()) {
      executeCommand(command);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 backdrop-blur-xl border border-white/20 rounded-full text-white text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-emerald-500/50"
        title="Abrir Command Palette (Ctrl+K)"
      >
        <Terminal size={18} />
        Comandos
        <kbd className="px-2 py-0.5 text-xs bg-black/30 rounded border border-white/20">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4" onClick={() => setIsOpen(false)}>
      <Card className="bg-gradient-to-br from-gray-900 to-black border-emerald-500/30 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Terminal className="text-emerald-400" size={24} />
            <h2 className="text-xl font-bold text-white">Command Palette</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Input Area */}
        <div className="p-4 border-b border-white/10">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Digite um comando (ex: /help)..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-lg font-mono"
              autoFocus
            />
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!command.trim()}
            >
              <Zap size={18} />
              Executar
            </Button>
          </form>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4 border-b border-white/10 bg-emerald-500/5">
            <p className="text-xs text-emerald-400 font-semibold mb-2">Sugestões:</p>
            <div className="space-y-1">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCommand(s.cmd)}
                  className="w-full text-left px-3 py-2 rounded bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <span className="text-emerald-300 font-mono text-sm">{s.cmd}</span>
                  <span className="text-gray-400 text-xs ml-2">- {s.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Code size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum comando executado ainda</p>
              <p className="text-xs mt-2">Digite <span className="font-mono text-emerald-400">/help</span> para ver comandos disponíveis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, i) => (
                <div key={i} className={`p-3 rounded border ${item.error ? 'bg-red-500/5 border-red-500/30' : 'bg-emerald-500/5 border-emerald-500/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-white">$ {item.command}</span>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                  <pre className={`text-xs whitespace-pre-wrap ${item.error ? 'text-red-300' : 'text-emerald-300'}`}>
                    {item.result}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Sparkles size={14} />
                {commands.length} comandos disponíveis
              </span>
              <span className="flex items-center gap-1">
                <Palette size={14} />
                Personalize seu aplicativo
              </span>
            </div>
            <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10 font-mono">
              ESC para fechar
            </kbd>
          </div>
        </div>
      </Card>
    </div>
  );
}
