import { useState, useEffect, useCallback } from 'react';
import { Terminal, X, Zap, Sparkles, Code, Palette, Loader2, CheckCircle2, XCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CommandPaletteAdvanced({ onNavigate, onThemeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [presetCommands, setPresetCommands] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Load preset commands on mount
  useEffect(() => {
    loadPresetCommands();
  }, []);

  const loadPresetCommands = async () => {
    try {
      const response = await axios.get(`${API}/commands/presets`);
      setPresetCommands(response.data.commands);
    } catch (error) {
      console.error('Error loading preset commands:', error);
    }
  };

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowPreview(false);
        setPreviewData(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const executeCommand = async (cmd) => {
    setIsExecuting(true);
    setShowPreview(false);
    
    try {
      const response = await axios.post(`${API}/commands/execute`, {
        command: cmd,
        context: {}
      });

      const result = response.data;
      
      setHistory(prev => [...prev, {
        command: cmd,
        result: result.result,
        success: result.success,
        action_type: result.action_type,
        timestamp: new Date().toLocaleTimeString(),
        preview: result.preview
      }]);

      if (result.success) {
        console.log('🎯 COMANDO BEM-SUCEDIDO, EXECUTANDO AÇÃO...', result);
        
        // SEMPRE executar ações frontend
        executeFrontendAction(result);
        
        // Mostrar toast apenas depois de executar
        toast.success(result.result);
      } else {
        toast.error(result.result);
      }

      setCommand('');
      
    } catch (error) {
      console.error('Error executing command:', error);
      const errorMsg = error.response?.data?.detail || 'Erro ao executar comando';
      
      setHistory(prev => [...prev, {
        command: cmd,
        result: `❌ ${errorMsg}`,
        success: false,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      toast.error(errorMsg);
    } finally {
      setIsExecuting(false);
    }
  };

  const executeFrontendAction = (result) => {
    console.log('🚀 EXECUTANDO AÇÃO FRONTEND:', result);
    
    // ALERTA VISUAL IMEDIATO
    alert(`🎯 EXECUTANDO AGORA:\n${result.preview || 'Comando em execução'}`);
    
    if (!result.changes) {
      console.error('❌ SEM CHANGES!', result);
      alert('❌ ERRO: Sem mudanças para executar!');
      toast.error('Erro: Sem mudanças para executar');
      return;
    }

    const { changes } = result;
    console.log('📦 CHANGES:', JSON.stringify(changes, null, 2));

    // TEMA COM MUDANÇA EXTREMA
    if (changes.theme) {
      console.log('🎨 MUDANDO TEMA AGORA!');
      
      if (changes.theme === 'dark') {
        // Mudanças MUITO visíveis
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#000000';
        document.body.style.color = '#ffffff';
        
        // Mudar TODOS os elementos visíveis
        const main = document.querySelector('.App');
        if (main) {
          main.style.backgroundColor = '#000000';
          main.style.color = '#ffffff';
        }
        
        alert('🌙 TEMA ESCURO APLICADO!\nA TELA DEVE ESTAR PRETA AGORA!');
        toast.success('🌙 TEMA ESCURO ATIVADO - TELA PRETA!', { duration: 5000 });
        
      } else if (changes.theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#000000';
        
        const main = document.querySelector('.App');
        if (main) {
          main.style.backgroundColor = '#ffffff';
          main.style.color = '#000000';
        }
        
        alert('☀️ TEMA CLARO APLICADO!\nA TELA DEVE ESTAR BRANCA AGORA!');
        toast.success('☀️ TEMA CLARO ATIVADO - TELA BRANCA!', { duration: 5000 });
      }
      return;
    }

    // NAVEGAÇÃO COM ALERTA
    if (changes.tab) {
      console.log('🧭 NAVEGANDO AGORA!');
      alert(`📍 NAVEGANDO PARA: ${changes.tab.toUpperCase()}\nA PÁGINA VAI MUDAR AGORA!`);
      
      if (onNavigate) {
        onNavigate(changes.tab);
        setIsOpen(false);
        toast.success(`📍 PÁGINA MUDOU PARA: ${changes.tab}`, { duration: 5000 });
      }
      return;
    }

    // ADICIONAR MÚLTIPLAS TAREFAS COM ALERTA
    if (changes.count && changes.tasks) {
      console.log(`📝 ADICIONANDO ${changes.count} TAREFAS AGORA!`);
      
      const tasks = JSON.parse(localStorage.getItem('studyTasks') || '[]');
      const initialCount = tasks.length;
      
      changes.tasks.forEach((taskName, index) => {
        const newTask = {
          id: Date.now() + index,
          subject: changes.subject || 'calc1',
          task: taskName,
          completed: false,
          created: new Date().toISOString(),
          dueDate: new Date(Date.now() + (7+index)*24*60*60*1000).toISOString().split('T')[0],
          priority: changes.priority || 'high'
        };
        tasks.push(newTask);
        
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/schedule/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask)
        }).catch(err => console.error('Erro:', err));
      });
      
      localStorage.setItem('studyTasks', JSON.stringify(tasks));
      const finalCount = tasks.length;
      
      alert(`✅ ${changes.count} TAREFAS ADICIONADAS!\n\nAntes: ${initialCount} tarefas\nDepois: ${finalCount} tarefas\n\nVá para CRONOGRAMA → TAREFAS para ver!`);
      toast.success(`✅ ${changes.count} TAREFAS CRIADAS! Total: ${finalCount}`, { duration: 6000 });
      
      window.dispatchEvent(new Event('storage'));
      return;
    }

    // ADICIONAR TAREFA ÚNICA COM ALERTA
    if (changes.subject || changes.task || changes.description || result.preview?.includes('tarefa')) {
      console.log('📝 ADICIONANDO 1 TAREFA AGORA!');
      
      const tasks = JSON.parse(localStorage.getItem('studyTasks') || '[]');
      const before = tasks.length;
      
      const newTask = {
        id: Date.now(),
        subject: changes.subject || 'calc1',
        task: changes.task || changes.description || 'Nova tarefa',
        completed: false,
        created: new Date().toISOString(),
        dueDate: changes.dueDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
        priority: changes.priority || 'high'
      };
      
      tasks.push(newTask);
      localStorage.setItem('studyTasks', JSON.stringify(tasks));
      
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/schedule/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      }).catch(err => console.error('Erro:', err));
      
      alert(`✅ TAREFA CRIADA!\n\n"${newTask.task}"\n\nTarefas antes: ${before}\nTarefas agora: ${tasks.length}\n\nVá para CRONOGRAMA → TAREFAS!`);
      toast.success(`✅ TAREFA: "${newTask.task}" - Total: ${tasks.length}`, { duration: 6000 });
      
      window.dispatchEvent(new Event('storage'));
      return;
    }

    // OTIMIZAR COM ALERTA
    if (changes.actions && Array.isArray(changes.actions)) {
      console.log('⚡ OTIMIZANDO AGORA!');
      alert('⚡ OTIMIZANDO APLICATIVO!\nCache será limpo...');
      
      // Limpar cache
      const critical = ['studyTasks', 'studySessions', 'studySubjects'];
      let removed = 0;
      Object.keys(localStorage).forEach(key => {
        if (!critical.includes(key)) {
          localStorage.removeItem(key);
          removed++;
        }
      });
      
      alert(`⚡ OTIMIZAÇÃO COMPLETA!\n\n${removed} itens de cache removidos\nAplicativo mais rápido agora!`);
      toast.success(`⚡ OTIMIZADO! ${removed} itens removidos`, { duration: 5000 });
      return;
    }

    // EXPORTAR COM ALERTA
    if (result.preview?.includes('xportar') || result.preview?.includes('backup')) {
      console.log('📥 EXPORTANDO AGORA!');
      alert('📥 CRIANDO BACKUP!\nArquivo será baixado...');
      
      const data = {
        sessions: localStorage.getItem('studySessions'),
        tasks: localStorage.getItem('studyTasks'),
        subjects: localStorage.getItem('studySubjects'),
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      alert('📥 BACKUP BAIXADO!\nVerifique sua pasta de Downloads!');
      toast.success('📥 ARQUIVO BAIXADO!', { duration: 5000 });
      return;
    }

    // CRIAR ROTINA COM ALERTA
    if (changes.frequency && changes.tasks) {
      console.log('🔄 CRIANDO ROTINA AGORA!');
      
      const routine = {
        id: Date.now(),
        subject: changes.subject,
        frequency: changes.frequency,
        tasks: changes.tasks,
        created: new Date().toISOString()
      };
      
      localStorage.setItem('studyRoutine', JSON.stringify(routine));
      
      alert(`🔄 ROTINA CRIADA!\n\nFrequência: ${changes.frequency}\nTarefas: ${changes.tasks.length}\n\nRotina salva no sistema!`);
      toast.success(`🔄 ROTINA ${changes.frequency.toUpperCase()} CRIADA!`, { duration: 5000 });
      return;
    }

    // LIMPAR HISTÓRICO
    if (result.preview?.includes('Limpar') || result.preview?.includes('limpar')) {
      console.log('🗑️ LIMPANDO AGORA!');
      setHistory([]);
      alert('🗑️ HISTÓRICO LIMPO!\nO histórico do Command Palette foi limpo!');
      toast.success('🗑️ HISTÓRICO LIMPO!', { duration: 3000 });
      return;
    }

    // AÇÃO GENÉRICA
    alert(`✨ COMANDO EXECUTADO!\n\n${result.preview || 'Ação realizada'}`);
    toast.info(`✨ ${result.preview}`, { duration: 5000 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim() && !isExecuting) {
      executeCommand(command);
    }
  };

  const handlePreviewCommand = async (cmd) => {
    if (cmd.startsWith('/')) {
      // Preset commands don't need preview
      executeCommand(cmd);
      return;
    }

    // For natural language, show preview first
    setShowPreview(true);
    setPreviewData({
      command: cmd,
      loading: true
    });

    try {
      const response = await axios.post(`${API}/commands/execute`, {
        command: cmd,
        context: { preview_only: true }
      });

      setPreviewData({
        command: cmd,
        loading: false,
        data: response.data
      });
    } catch (error) {
      setShowPreview(false);
      setPreviewData(null);
      executeCommand(cmd);
    }
  };

  const getSuggestions = () => {
    if (!command) return [];
    
    if (command.startsWith('/')) {
      return presetCommands.filter(c => 
        c.command.toLowerCase().includes(command.toLowerCase())
      );
    }
    
    return [];
  };

  const suggestions = getSuggestions();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 backdrop-blur-xl border border-white/20 rounded-full text-white text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-emerald-500/50"
        title="Abrir Command Palette (Ctrl+K)"
      >
        <Terminal size={18} />
        Comandos IA
        <kbd className="px-2 py-0.5 text-xs bg-black/30 rounded border border-white/20">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4" 
      onClick={() => {
        setIsOpen(false);
        setShowPreview(false);
        setPreviewData(null);
      }}
    >
      <Card 
        className="bg-gradient-to-br from-gray-900 to-black border-emerald-500/30 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Terminal className="text-emerald-400" size={24} />
              {isExecuting && (
                <Loader2 className="absolute -top-1 -right-1 text-emerald-400 animate-spin" size={12} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Command Palette com IA</h2>
              <p className="text-xs text-gray-400">Controle a aplicação com comandos naturais ou pré-definidos</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsOpen(false);
              setShowPreview(false);
              setPreviewData(null);
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Input Area */}
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Digite um comando (ex: /tema-escuro) ou frase natural (ex: adicionar tarefa de cálculo)..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-lg font-mono"
              autoFocus
              disabled={isExecuting}
            />
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!command.trim() || isExecuting}
            >
              {isExecuting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Zap size={18} />
              )}
              Executar
            </Button>
          </form>

          {/* Help text */}
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Lightbulb size={12} />
              Use '/' para comandos rápidos
            </span>
            <span className="flex items-center gap-1">
              <Sparkles size={12} />
              Ou escreva em linguagem natural
            </span>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4 border-b border-white/10 bg-emerald-500/5 flex-shrink-0">
            <p className="text-xs text-emerald-400 font-semibold mb-2">Comandos disponíveis:</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCommand(s.command);
                    setTimeout(() => executeCommand(s.command), 100);
                  }}
                  className="w-full text-left px-3 py-2 rounded bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-emerald-300 font-mono text-sm">{s.command}</span>
                      <span className="text-gray-400 text-xs ml-2">- {s.description}</span>
                    </div>
                    <ArrowRight size={14} className="text-gray-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview Panel */}
        {showPreview && previewData && (
          <div className="p-4 border-b border-white/10 bg-blue-500/5 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-blue-400" size={16} />
              <p className="text-sm text-blue-400 font-semibold">Preview da Ação:</p>
            </div>
            {previewData.loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Interpretando comando com IA...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-white text-sm">{previewData.data?.preview}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowPreview(false);
                      executeCommand(previewData.command);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle2 size={14} className="mr-1" />
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowPreview(false);
                      setPreviewData(null);
                    }}
                    className="border-white/10"
                  >
                    <XCircle size={14} className="mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        <div className="p-4 flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Code size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum comando executado ainda</p>
              <p className="text-xs mt-2">
                Digite <span className="font-mono text-emerald-400">/help</span> para comandos rápidos ou
                escreva em linguagem natural
              </p>
              
              {/* Quick examples */}
              <div className="mt-6 grid grid-cols-2 gap-2 max-w-md mx-auto">
                <button
                  onClick={() => setCommand('/tema-escuro')}
                  className="p-2 text-xs bg-white/5 hover:bg-white/10 rounded border border-white/10 text-left"
                >
                  <span className="text-emerald-300">/tema-escuro</span>
                </button>
                <button
                  onClick={() => setCommand('/exercicios')}
                  className="p-2 text-xs bg-white/5 hover:bg-white/10 rounded border border-white/10 text-left"
                >
                  <span className="text-emerald-300">/exercicios</span>
                </button>
                <button
                  onClick={() => setCommand('adicionar tarefa')}
                  className="p-2 text-xs bg-white/5 hover:bg-white/10 rounded border border-white/10 text-left"
                >
                  <span className="text-blue-300">adicionar tarefa</span>
                </button>
                <button
                  onClick={() => setCommand('exportar dados')}
                  className="p-2 text-xs bg-white/5 hover:bg-white/10 rounded border border-white/10 text-left"
                >
                  <span className="text-blue-300">exportar dados</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice().reverse().map((item, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded border ${
                    item.success 
                      ? 'bg-emerald-500/5 border-emerald-500/30' 
                      : 'bg-red-500/5 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.success ? (
                        <CheckCircle2 className="text-emerald-400" size={16} />
                      ) : (
                        <XCircle className="text-red-400" size={16} />
                      )}
                      <span className="font-mono text-sm text-white">$ {item.command}</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                  <pre className={`text-xs whitespace-pre-wrap ${
                    item.success ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    {item.result}
                  </pre>
                  {item.preview && (
                    <div className="mt-2 text-xs text-gray-400 italic">
                      {item.preview}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Sparkles size={14} />
                IA + {presetCommands.length} comandos rápidos
              </span>
              <span className="flex items-center gap-1">
                <Palette size={14} />
                Controle total da aplicação
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
