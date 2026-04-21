import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';

export default function DebugPanel({ onNavigate }) {
  const [logs, setLogs] = useState([]);
  const [taskCount, setTaskCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Atualizar contagem de tarefas
    const updateCount = () => {
      const tasks = JSON.parse(localStorage.getItem('studyTasks') || '[]');
      setTaskCount(tasks.length);
    };
    
    updateCount();
    window.addEventListener('storage', updateCount);
    
    return () => window.removeEventListener('storage', updateCount);
  }, []);

  // Não renderizar no mobile
  if (isMobile) {
    return null;
  }

  const addLog = (message, type = 'info') => {
    const newLog = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  const testTema = () => {
    addLog('🎨 TESTE: Mudando para tema escuro...', 'info');
    document.body.style.backgroundColor = '#000000';
    document.body.style.color = '#ffffff';
    addLog('✅ TEMA ESCURO APLICADO! Tela deve estar preta!', 'success');
  };

  const testTemaClaro = () => {
    addLog('☀️ TESTE: Mudando para tema claro...', 'info');
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#000000';
    addLog('✅ TEMA CLARO APLICADO! Tela deve estar branca!', 'success');
  };

  const testTarefa = () => {
    addLog('📝 TESTE: Adicionando tarefa...', 'info');
    const tasks = JSON.parse(localStorage.getItem('studyTasks') || '[]');
    const before = tasks.length;
    
    const newTask = {
      id: Date.now(),
      subject: 'calc1',
      task: `Tarefa de Teste ${Date.now()}`,
      completed: false,
      created: new Date().toISOString(),
      priority: 'high'
    };
    
    tasks.push(newTask);
    localStorage.setItem('studyTasks', JSON.stringify(tasks));
    window.dispatchEvent(new Event('storage'));
    
    addLog(`✅ TAREFA ADICIONADA! Antes: ${before}, Agora: ${tasks.length}`, 'success');
    setTaskCount(tasks.length);
  };

  const testNavegacao = () => {
    addLog('🧭 TESTE: Navegando para exercícios...', 'info');
    if (onNavigate) {
      onNavigate('exercises');
      addLog('✅ NAVEGAÇÃO EXECUTADA! Página deve ter mudado!', 'success');
    } else {
      addLog('❌ onNavigate não disponível', 'error');
    }
  };

  const testCompleto = () => {
    addLog('🚀 INICIANDO TESTE COMPLETO...', 'info');
    
    setTimeout(() => {
      testTema();
    }, 500);
    
    setTimeout(() => {
      testTarefa();
    }, 1500);
    
    setTimeout(() => {
      testTemaClaro();
    }, 2500);
    
    setTimeout(() => {
      addLog('🎉 TESTE COMPLETO FINALIZADO!', 'success');
    }, 3500);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg"
      >
        Mostrar Debug
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] overflow-hidden bg-gray-900 border-2 border-red-500 text-white">
      <div className="p-4 border-b border-red-500/30 flex justify-between items-center bg-red-900/20">
        <div>
          <h3 className="font-bold text-lg">🔍 PAINEL DE TESTES</h3>
          <p className="text-xs text-gray-400">Veja as ações em tempo real</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Contador de Tarefas */}
      <div className="p-4 bg-blue-900/30 border-b border-blue-500/30">
        <div className="text-center">
          <p className="text-sm text-blue-300">Total de Tarefas</p>
          <p className="text-5xl font-bold text-blue-400">{taskCount}</p>
        </div>
      </div>

      {/* Botões de Teste */}
      <div className="p-4 space-y-2 border-b border-gray-700">
        <Button
          onClick={testCompleto}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          🚀 TESTE COMPLETO
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={testTema}
            className="bg-gray-800 hover:bg-gray-700 text-sm"
          >
            🌙 Tema Escuro
          </Button>
          <Button
            onClick={testTemaClaro}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm"
          >
            ☀️ Tema Claro
          </Button>
        </div>
        
        <Button
          onClick={testTarefa}
          className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
        >
          📝 Adicionar Tarefa
        </Button>
        
        <Button
          onClick={testNavegacao}
          className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
        >
          🧭 Navegar para Exercícios
        </Button>
      </div>

      {/* Logs */}
      <div className="p-4 overflow-y-auto max-h-64">
        <p className="text-xs text-gray-400 mb-2">Últimas Ações:</p>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma ação ainda. Clique nos botões acima!</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div
                key={log.id}
                className={`text-xs p-2 rounded border ${
                  log.type === 'success'
                    ? 'bg-green-900/30 border-green-500/50 text-green-300'
                    : log.type === 'error'
                    ? 'bg-red-900/30 border-red-500/50 text-red-300'
                    : 'bg-blue-900/30 border-blue-500/50 text-blue-300'
                }`}
              >
                <div className="flex justify-between">
                  <span>{log.message}</span>
                  <span className="text-gray-500">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
