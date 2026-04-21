import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Settings, Key, AlertCircle, CheckCircle, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export default function ApiKeySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [emergentKey, setEmergentKey] = useState('');
  const [useCustomKeys, setUseCustomKeys] = useState(false);
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
    emergent: false,
  });

  useEffect(() => {
    const savedOpenai = localStorage.getItem('custom_openai_key');
    const savedAnthropic = localStorage.getItem('custom_anthropic_key');
    const savedGemini = localStorage.getItem('custom_gemini_key');
    const savedEmergent = localStorage.getItem('custom_emergent_key');
    const savedUseCustom = localStorage.getItem('use_custom_keys') === 'true';
    
    if (savedOpenai) setOpenaiKey(savedOpenai);
    if (savedAnthropic) setAnthropicKey(savedAnthropic);
    if (savedGemini) setGeminiKey(savedGemini);
    if (savedEmergent) setEmergentKey(savedEmergent);
    setUseCustomKeys(savedUseCustom);
  }, []);

  const saveSettings = () => {
    if (useCustomKeys && !openaiKey.trim() && !anthropicKey.trim() && !geminiKey.trim() && !emergentKey.trim()) {
      toast.error('Por favor, insira pelo menos uma chave válida');
      return;
    }

    localStorage.setItem('custom_openai_key', openaiKey);
    localStorage.setItem('custom_anthropic_key', anthropicKey);
    localStorage.setItem('custom_gemini_key', geminiKey);
    localStorage.setItem('custom_emergent_key', emergentKey);
    localStorage.setItem('use_custom_keys', useCustomKeys.toString());
    
    toast.success('✅ Configurações salvas! As chaves serão usadas nas próximas requisições.');
    setIsOpen(false);
  };

  const clearSettings = () => {
    localStorage.removeItem('custom_openai_key');
    localStorage.removeItem('custom_anthropic_key');
    localStorage.removeItem('custom_gemini_key');
    localStorage.removeItem('custom_emergent_key');
    localStorage.removeItem('use_custom_keys');
    setOpenaiKey('');
    setAnthropicKey('');
    setGeminiKey('');
    setEmergentKey('');
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

  if (!isOpen) {
    const hasEmergentKey = localStorage.getItem('custom_emergent_key');
    
    return (
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {/* Status indicator */}
        {hasEmergentKey ? (
          <div className="px-4 py-2 bg-black/90 backdrop-blur-xl border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-lg">
            <CheckCircle size={14} />
            Chave Emergent Configurada
          </div>
        ) : (
          <div className="px-4 py-2 bg-black/90 backdrop-blur-xl border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold flex items-center gap-2 shadow-lg">
            <AlertCircle size={14} />
            Configure sua Chave API
          </div>
        )}
        
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
      <Card className="bg-gradient-to-br from-gray-900 to-black border-white/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
          {/* Info Card */}
          <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <p className="text-sm text-emerald-100 font-semibold mb-1">
                  🔑 Chave Universal Emergent (Recomendado)
                </p>
                <p className="text-xs text-emerald-200/80 mb-2">
                  A Chave Universal Emergent funciona com OpenAI, Anthropic e Google através de um único token.
                  É a opção mais simples e econômica! Cole sua chave na aba "Emergent" abaixo.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/30 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-200">
                <strong>Alternativa:</strong> Você também pode usar suas chaves diretas de OpenAI, Anthropic ou Google AI se já tiver contas nesses serviços.
              </p>
            </div>
          </Card>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div>
              <Label className="text-white text-base font-semibold">Usar Minhas Chaves</Label>
              <p className="text-xs text-gray-400 mt-1">Suas próprias API keys (salvas apenas no navegador)</p>
            </div>
            <button
              onClick={() => setUseCustomKeys(!useCustomKeys)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all ${useCustomKeys ? 'bg-violet-600' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${useCustomKeys ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          {useCustomKeys ? (
            <Tabs defaultValue="emergent" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-black/40">
                <TabsTrigger value="emergent">🔑 Emergent</TabsTrigger>
                <TabsTrigger value="openai">OpenAI</TabsTrigger>
                <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
                <TabsTrigger value="gemini">Google AI</TabsTrigger>
              </TabsList>

              <TabsContent value="emergent" className="space-y-3 mt-4">
                <div>
                  <Label className="text-white mb-2 block text-sm font-semibold">🔑 Chave Universal Emergent</Label>
                  <div className="relative">
                    <Input
                      type={showKeys.emergent ? "text" : "password"}
                      value={emergentKey}
                      onChange={(e) => setEmergentKey(e.target.value)}
                      placeholder="sk-emergent-..."
                      className="bg-white/5 border-white/10 text-white pr-10"
                    />
                    <button
                      onClick={() => toggleShowKey('emergent')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showKeys.emergent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use OpenAI, Anthropic e Google com uma única chave • Obtenha em{' '}
                    <a href="https://emergent.sh" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">
                      emergent.sh
                    </a>
                  </p>
                  {emergentKey && (
                    <Card className="bg-green-500/10 border-green-500/30 p-2 mt-2">
                      <span className="text-xs text-green-200 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Configurada: {maskKey(emergentKey)}
                      </span>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="openai" className="space-y-3 mt-4">
                <div>
                  <Label className="text-white mb-2 block text-sm font-semibold">🤖 OpenAI API Key</Label>
                  <div className="relative">
                    <Input
                      type={showKeys.openai ? "text" : "password"}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="bg-white/5 border-white/10 text-white pr-10"
                    />
                    <button
                      onClick={() => toggleShowKey('openai')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showKeys.openai ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Para usar GPT-4, GPT-4o, etc.</p>
                  {openaiKey && (
                    <Card className="bg-green-500/10 border-green-500/30 p-2 mt-2">
                      <span className="text-xs text-green-200 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Configurada: {maskKey(openaiKey)}
                      </span>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="anthropic" className="space-y-3 mt-4">
                <div>
                  <Label className="text-white mb-2 block text-sm font-semibold">🧠 Anthropic API Key</Label>
                  <div className="relative">
                    <Input
                      type={showKeys.anthropic ? "text" : "password"}
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="bg-white/5 border-white/10 text-white pr-10"
                    />
                    <button
                      onClick={() => toggleShowKey('anthropic')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showKeys.anthropic ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Para usar Claude 3.5, Claude Opus, etc.</p>
                  {anthropicKey && (
                    <Card className="bg-green-500/10 border-green-500/30 p-2 mt-2">
                      <span className="text-xs text-green-200 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Configurada: {maskKey(anthropicKey)}
                      </span>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="gemini" className="space-y-3 mt-4">
                <div>
                  <Label className="text-white mb-2 block text-sm font-semibold">✨ Google AI API Key</Label>
                  <div className="relative">
                    <Input
                      type={showKeys.gemini ? "text" : "password"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIza..."
                      className="bg-white/5 border-white/10 text-white pr-10"
                    />
                    <button
                      onClick={() => toggleShowKey('gemini')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showKeys.gemini ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Para usar Gemini Pro, Gemini Flash, etc.</p>
                  {geminiKey && (
                    <Card className="bg-green-500/10 border-green-500/30 p-2 mt-2">
                      <span className="text-xs text-green-200 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Configurada: {maskKey(geminiKey)}
                      </span>
                    </Card>
                  )}
                </div>
              </TabsContent>
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
            {(openaiKey || anthropicKey || geminiKey || useCustomKeys) && (
              <Button 
                onClick={clearSettings} 
                variant="outline" 
                className="border-red-500/30 hover:bg-red-500/10 text-red-400"
              >
                <X size={16} className="mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export const getCustomApiKey = () => {
  const useCustom = localStorage.getItem('use_custom_keys') === 'true';
  if (!useCustom) return null;
  
  // Priority: Emergent key first (universal), then OpenAI
  const emergentKey = localStorage.getItem('custom_emergent_key');
  if (emergentKey) return emergentKey;
  
  const openaiKey = localStorage.getItem('custom_openai_key');
  return openaiKey || null;
};