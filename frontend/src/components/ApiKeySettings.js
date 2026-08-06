import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Settings, Key, AlertCircle, CheckCircle, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const PROVIDER_CONFIG = {
  emergent: {
    label: '🔑 Emergent Universal',
    placeholder: 'sk-emergent-...',
    url: 'https://emergent.sh',
    env: 'EMERGENT_LLM_KEY',
    description: 'Funciona com OpenAI, Anthropic, Google via token único'
  },
  openai: {
    label: '🤖 OpenAI',
    placeholder: 'sk-...',
    url: 'https://platform.openai.com/api-keys',
    env: 'OPENAI_API_KEY',
    description: 'Para GPT-4, GPT-4o, o1, DALL-E'
  },
  anthropic: {
    label: '🧠 Anthropic',
    placeholder: 'sk-ant-...',
    url: 'https://console.anthropic.com/',
    env: 'ANTHROPIC_API_KEY',
    description: 'Para Claude 3.5 Sonnet, Haiku, Opus'
  },
  gemini: {
    label: '✨ Google AI (Gemini)',
    placeholder: 'AIza...',
    url: 'https://aistudio.google.com/apikey',
    env: 'GEMINI_API_KEY',
    description: 'Para Gemini 1.5 Pro, Flash, Flash-8B'
  },
  deepseek: {
    label: '🔵 DeepSeek',
    placeholder: 'sk-...',
    url: 'https://platform.deepseek.com/',
    env: 'DEEPSEEK_API_KEY',
    description: 'DeepSeek V3 Chat e R1 Reasoning - quase ilimitado'
  },
  groq: {
    label: '⚡ Groq',
    placeholder: 'gsk_...',
    url: 'https://console.groq.com/keys',
    env: 'GROQ_API_KEY',
    description: 'Llama 3.3 70B, Mixtral, Gemma 2 - ultra rápido (14.4k req/dia)'
  },
  perplexity: {
    label: '🔍 Perplexity',
    placeholder: 'pplx-...',
    url: 'https://www.perplexity.ai/settings/api',
    env: 'PERPLEXITY_API_KEY',
    description: 'Busca online com citações - Sonar models'
  },
  openrouter: {
    label: '🌐 OpenRouter',
    placeholder: 'sk-or-v1-...',
    url: 'https://openrouter.ai/keys',
    env: 'OPENROUTER_API_KEY',
    description: '300+ modelos (Nemotron, Qwen, Mistral grátis) - créditos diários'
  },
  free_ai: {
    label: '🎁 Free.ai',
    placeholder: 'sk-...',
    url: 'https://free.ai',
    env: 'FREE_AI_API_KEY',
    description: 'Qwen 2.5 72B auto-hospedado A100 - 30K tokens/dia'
  },
};

const PROVIDER_ORDER = ['emergent', 'groq', 'gemini', 'deepseek', 'openrouter', 'free_ai', 'openai', 'anthropic', 'perplexity'];

export default function ApiKeySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [keys, setKeys] = useState({});
  const [useCustomKeys, setUseCustomKeys] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const [activeTab, setActiveTab] = useState('emergent');

  useEffect(() => {
    const savedKeys = {};
    PROVIDER_ORDER.forEach(provider => {
      const saved = localStorage.getItem(`custom_${provider}_key`);
      if (saved) savedKeys[provider] = saved;
      setShowKeys(prev => ({ ...prev, [provider]: false }));
    });
    setKeys(savedKeys);
    setUseCustomKeys(localStorage.getItem('use_custom_keys') === 'true');
  }, []);

  const saveSettings = () => {
    if (useCustomKeys && Object.values(keys).every(k => !k?.trim())) {
      toast.error('Por favor, insira pelo menos uma chave válida');
      return;
    }

    PROVIDER_ORDER.forEach(provider => {
      const value = keys[provider] || '';
      if (value) {
        localStorage.setItem(`custom_${provider}_key`, value);
      } else {
        localStorage.removeItem(`custom_${provider}_key`);
      }
    });
    localStorage.setItem('use_custom_keys', useCustomKeys.toString());
    
    toast.success('✅ Configurações salvas! As chaves serão usadas nas próximas requisições.');
    setIsOpen(false);
  };

  const clearSettings = () => {
    PROVIDER_ORDER.forEach(provider => {
      localStorage.removeItem(`custom_${provider}_key`);
    });
    localStorage.removeItem('use_custom_keys');
    setKeys({});
    setUseCustomKeys(false);
    toast.success('Configurações limpas.');
  };

  const maskKey = (key) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 7) + '...' + key.substring(key.length - 4);
  };

  const toggleShowKey = (keyType) => {
    setShowKeys(prev => ({ ...prev, [keyType]: !prev[keyType] }));
  };

  const hasAnyKey = () => {
    return PROVIDER_ORDER.some(p => keys[p] || localStorage.getItem(`custom_${p}_key`));
  };

  if (!isOpen) {
    const hasEmergentKey = localStorage.getItem('custom_emergent_key') || keys.emergent;
    const configuredCount = PROVIDER_ORDER.filter(p => keys[p] || localStorage.getItem(`custom_${p}_key`)).length;
    
    return (
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {/* Status indicator */}
        <div className={`px-4 py-2 bg-black/90 backdrop-blur-xl border rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg ${
          hasEmergentKey ? 'border-emerald-500/30 text-emerald-400' : 
          configuredCount > 0 ? 'border-blue-500/30 text-blue-400' :
          'border-amber-500/30 text-amber-400'
        }`}>
          {hasEmergentKey ? (
            <>
              <CheckCircle size={14} />
              Chave Emergent Configurada
            </>
          ) : configuredCount > 0 ? (
            <>
              <CheckCircle size={14} />
              {configuredCount} chave(s) configurada(s)
            </>
          ) : (
            <>
              <AlertCircle size={14} />
              Configure suas API Keys
            </>
          )}
        </div>
        
        {/* Config button */}
        <button
          onClick={() => setIsOpen(true)}
          className="px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 backdrop-blur-xl border border-white/20 rounded-full text-white text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-violet-500/50"
        >
          <Key size={16} />
          Configurar API Keys
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
      <Card className="bg-gradient-to-br from-gray-900 to-black border-white/20 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Key className="text-violet-400" size={24} />
            Configurar API Keys
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Info Card - Emergent Recommended */}
          <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <p className="text-sm text-emerald-100 font-semibold mb-1">
                  🔑 Chave Universal Emergent (Recomendado - Mais Simples)
                </p>
                <p className="text-xs text-emerald-200/80 mb-2">
                  Uma única chave funciona com OpenAI, Anthropic e Google. Configure na aba "Emergent" abaixo.
                  Obtenha em <a href="https://emergent.sh" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline">emergent.sh</a>
                </p>
              </div>
            </div>
          </Card>

          {/* Free Providers Highlight */}
          <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-200">
                <strong>Provedores Gratuitos Recomendados:</strong>{' '}
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">Groq</a> (Llama 3.3 70B ultra-rápido), 
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">Gemini</a> (Flash grátis), 
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">OpenRouter</a> (Nemotron, Qwen, Mistral grátis), 
                <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">DeepSeek</a> (quase ilimitado).
              </p>
            </div>
          </Card>

          {/* Toggle Custom Keys */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div>
              <Label className="text-white text-base font-semibold">Usar Minhas Chaves (Salvas apenas no navegador)</Label>
              <p className="text-xs text-gray-400 mt-1">Prioridade: Chave do provedor selecionado no chat → Emergent → Chave específica do provedor</p>
            </div>
            <button
              onClick={() => setUseCustomKeys(!useCustomKeys)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all ${useCustomKeys ? 'bg-violet-600' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${useCustomKeys ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          {useCustomKeys ? (
            <Tabs defaultValue="emergent" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 bg-black/40 overflow-x-auto pb-2">
                {PROVIDER_ORDER.map(provider => (
                  <TabsTrigger 
                    key={provider} 
                    value={provider} 
                    className="px-3 py-2 text-xs whitespace-nowrap"
                  >
                    {PROVIDER_CONFIG[provider].label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {PROVIDER_ORDER.map(provider => {
                const config = PROVIDER_CONFIG[provider];
                const key = keys[provider] || '';
                return (
                  <TabsContent key={provider} value={provider} className="space-y-3 mt-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-white mb-0 block text-sm font-semibold">{config.label}</Label>
                        <a 
                          href={config.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                        >
                          Obter chave <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="relative">
                        <Input
                          type={showKeys[provider] ? "text" : "password"}
                          value={key}
                          onChange={(e) => setKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                          placeholder={config.placeholder}
                          className="bg-white/5 border-white/10 text-white pr-10"
                        />
                        <button
                          onClick={() => toggleShowKey(provider)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showKeys[provider] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                      {key && (
                        <Card className="bg-green-500/10 border-green-500/30 p-2 mt-2">
                          <span className="text-xs text-green-200 flex items-center gap-1">
                            <CheckCircle size={14} />
                            Configurada: {maskKey(key)}
                          </span>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-violet-400" size={24} />
                <div>
                  <p className="text-base font-semibold text-white">✅ Chave Universal Emergent Ativa</p>
                  <p className="text-xs text-gray-400 mt-1">Funciona com OpenAI, Anthropic e Google • Sem custos extras</p>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button 
              onClick={saveSettings} 
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold"
            >
              💾 Salvar Configurações
            </Button>
            {hasAnyKey() && (
              <Button 
                onClick={clearSettings} 
                variant="outline" 
                className="border-red-500/30 hover:bg-red-500/10 text-red-400"
              >
                <X size={16} className="mr-1" />
                Limpar Tudo
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export const getCustomApiKey = (provider?: string) => {
  const useCustom = localStorage.getItem('use_custom_keys') === 'true';
  if (!useCustom) return null;
  
  // Priority: specific provider key > emergent > openai
  if (provider && localStorage.getItem(`custom_${provider}_key`)) {
    return localStorage.getItem(`custom_${provider}_key`);
  }
  
  const emergentKey = localStorage.getItem('custom_emergent_key');
  if (emergentKey) return emergentKey;
  
  const openaiKey = localStorage.getItem('custom_openai_key');
  return openaiKey || null;
};