import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ChevronDown, Sparkles, Zap, Brain, Search, Code, GitMerge, Gift, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const PROVIDER_ICONS = {
  groq: Zap,
  gemini: Sparkles,
  claude: Brain,
  perplexity: Search,
  deepseek: Code,
  openrouter: GitMerge,
  free_ai: Gift,
};

const PROVIDER_LABELS = {
  groq: 'Groq (Ultra Rápido)',
  gemini: 'Google Gemini (Multimodal)',
  claude: 'Claude (Raciocínio)',
  perplexity: 'Perplexity (Pesquisa)',
  deepseek: 'DeepSeek (Código/Raciocínio)',
  openrouter: 'OpenRouter (Agregador)',
  free_ai: 'Free.ai (Plataforma)',
};

interface ProviderSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string, model?: string) => void;
  onModelChange: (model: string) => void;
  providers: any[];
  className?: string;
}

export default function ProviderSelector({ 
  selectedProvider, 
  selectedModel, 
  onProviderChange, 
  onModelChange, 
  providers,
  className = ''
}: ProviderSelectorProps) {
  const [providerModels, setProviderModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update available models when provider changes
  useEffect(() => {
    const provider = providers.find(p => p.type === selectedProvider);
    if (provider) {
      setProviderModels(provider.models || []);
    }
  }, [selectedProvider, providers]);

  const handleProviderChange = useCallback((value: string) => {
    const provider = providers.find(p => p.type === value);
    const defaultModel = provider?.default_model || (provider?.models?.[0]?.id);
    onProviderChange(value, defaultModel);
    if (defaultModel) {
      onModelChange(defaultModel);
    }
  }, [providers, onProviderChange, onModelChange]);

  const currentProvider = providers.find(p => p.type === selectedProvider);
  const hasKey = currentProvider?.has_key;
  const providerIcon = PROVIDER_ICONS[selectedProvider] || Sparkles;
  const providerLabel = PROVIDER_LABELS[selectedProvider] || selectedProvider;

  return (
    <div className={`provider-selector ${className}`}>
      <div className="flex flex-col gap-2">
        {/* Provider Selector */}
        <div className="relative">
          <Label className="text-xs text-gray-400 mb-1 block">Provedor IA</Label>
          <Select value={selectedProvider} onValueChange={handleProviderChange}>
            <SelectTrigger className={`h-9 bg-white/5 border-white/10 text-white text-sm ${!hasKey ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
              <SelectValue placeholder="Selecione provedor" />
              <ChevronDown className="h-4 w-4 opacity-70" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10 text-white">
              {providers.map((provider) => (
                <SelectItem key={provider.type} value={provider.type} className="flex items-center gap-2">
                  <provider.icon className="h-4 w-4" size={16} />
                  <span className="flex-1">{provider.name}</span>
                  {provider.has_key ? (
                    <span className="text-xs text-green-400">✓</span>
                  ) : (
                    <span className="text-xs text-amber-400">🔑</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!hasKey && (
            <div className="absolute -top-2 right-0 bg-amber-500/90 text-amber-900 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
              Requer chave API
            </div>
          )}
        </div>

        {/* Model Selector */}
        {providerModels.length > 0 && (
          <div className="relative">
            <Label className="text-xs text-gray-400 mb-1 block">Modelo</Label>
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="h-9 bg-white/5 border-white/10 text-white text-sm">
                <SelectValue placeholder="Selecione modelo" />
                <ChevronDown className="h-4 w-4 opacity-70" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white">
                {providerModels.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="flex items-center gap-2">
                    <span className="flex-1 text-sm">{model.name}</span>
                    <span className="text-xs text-gray-500">{model.context_window}k ctx</span>
                    {model.supports_vision && <span className="text-xs text-blue-400">👁️</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Provider Status Badge */}
        <div className="flex items-center gap-2 text-xs">
          <providerIcon className={`h-3 w-3 ${hasKey ? 'text-green-400' : 'text-gray-500'}`} size={12} />
          <span className={hasKey ? 'text-green-400' : 'text-amber-400'}>
            {hasKey ? 'Chave configurada' : 'Sem chave - use Emergent ou configure'}
          </span>
          {!hasKey && currentProvider?.website && (
            <a 
              href={currentProvider.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
              Obter chave <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}