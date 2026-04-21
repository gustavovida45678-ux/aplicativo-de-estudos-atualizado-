import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Upload, ChevronLeft, ChevronRight, FileText, Video, Sparkles, Loader2, BookOpen, Youtube, Search, Play, Clock, Eye, BookMarked, ListChecks, ExternalLink, Camera, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import jsPDF from 'jspdf';
import StepNavigator from './StepNavigator';
import MathChatHelper from './MathChatHelper';
import html2canvas from 'html2canvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MathExplainer() {
  const [activeTab, setActiveTab] = useState('explain');
  
  // Explicação IA
  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const explanationRef = useRef(null);
  
  // Opções de Vídeo
  const [videoOptions, setVideoOptions] = useState({
    duration: 5,
    theme: 'dark',
    narration: false,
    quality: '1080p',
    progress: 0
  });
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [showVideoOptions, setShowVideoOptions] = useState(false);
  
  // YouTube Search
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Reduzir para máximo 1200px na maior dimensão
          const maxSize = 1200;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Comprimir para 80% de qualidade
          canvas.toBlob(
            (blob) => {
              console.log(`📉 Compressão: ${(file.size / 1024).toFixed(0)}KB → ${(blob.size / 1024).toFixed(0)}KB`);
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📷 Arquivo selecionado:', file.name, file.type, file.size);
      
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      try {
        // Comprimir imagem antes de usar
        toast.info('📉 Otimizando imagem...');
        const compressedFile = await compressImage(file);
        
        setQuestionImage(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
          console.log('✅ Preview da imagem criado');
          toast.success('✅ Imagem otimizada e pronta!');
        };
        reader.onerror = () => {
          console.error('❌ Erro ao ler arquivo');
          toast.error('Erro ao carregar imagem');
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('❌ Erro ao comprimir:', error);
        toast.error('Erro ao processar imagem');
      }
    } else {
      console.log('⚠️ Nenhum arquivo selecionado');
    }
  };

  const handleSubmit = async () => {
    if (!questionText && !questionImage) {
      toast.error('Por favor, digite ou envie uma foto da questão');
      return;
    }

    console.log('🚀 Iniciando envio...');
    console.log('📝 Texto:', questionText);
    console.log('📷 Imagem:', questionImage ? questionImage.name : 'nenhuma');

    setIsLoading(true);
    setExplanation(null);
    setCurrentStep(0);

    try {
      const formData = new FormData();
      if (questionImage) {
        formData.append('image', questionImage);
        console.log('✅ Imagem adicionada ao FormData');
      }
      formData.append('question', questionText || 'Explique e resolva esta questão matemática passo a passo');

      console.log('📡 Enviando para:', `${API}/math/explain`);
      
      const response = await axios.post(`${API}/math/explain`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 segundos
      });

      console.log('✅ Resposta recebida:', response.status);
      
      if (response.data && response.data.title) {
        setExplanation(response.data);
        toast.success('Explicação gerada com sucesso! 🎉');
      } else {
        console.error('❌ Resposta inválida:', response.data);
        toast.error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar:', error);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Tempo limite excedido. Tente com uma imagem menor.');
      } else if (error.response) {
        console.error('Erro do servidor:', error.response.status, error.response.data);
        toast.error(`Erro: ${error.response.data?.detail || 'Erro ao processar sua requisição'}`);
      } else if (error.request) {
        console.error('Sem resposta do servidor');
        toast.error('Sem resposta do servidor. Verifique sua conexão.');
      } else {
        toast.error('Erro ao enviar: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!explanationRef.current) return;

    try {
      toast.info('Gerando PDF...');
      const canvas = await html2canvas(explanationRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('explicacao-matematica.pdf');
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const generateVideo = async () => {
    if (!explanation) {
      toast.error('Gere uma explicação primeiro');
      return;
    }

    setIsGeneratingVideo(true);
    setVideoOptions(prev => ({ ...prev, progress: 0 }));
    
    try {
      toast.info('🎬 Iniciando geração de vídeo com IA (Sora 2)...', { duration: 4000 });
      toast.info('⏱️ Isso pode levar 2-5 minutos. Aguarde...', { duration: 6000 });
      
      // Start progress animation while waiting for backend
      const progressInterval = setInterval(() => {
        setVideoOptions(prev => {
          const newProgress = Math.min(prev.progress + 2, 95);
          return { ...prev, progress: newProgress };
        });
      }, 2000);
      
      // Call backend to generate real video
      const response = await axios.post(`${API}/math/generate-video`, {
        title: explanation.title,
        steps: explanation.steps,
        duration: videoOptions.duration,
        theme: videoOptions.theme,
        quality: videoOptions.quality
      });
      
      clearInterval(progressInterval);
      setVideoOptions(prev => ({ ...prev, progress: 100 }));
      
      if (response.data.success) {
        // Convert base64 to blob
        const videoBase64 = response.data.video_base64;
        const byteCharacters = atob(videoBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'video/mp4' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `video-explicacao-${Date.now()}.mp4`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        
        toast.success(`🎉 Vídeo MP4 gerado com sucesso! (${response.data.size_kb} KB)`, { duration: 8000 });
        toast.success('📥 Download iniciado automaticamente!', { duration: 5000 });
        
        setShowVideoOptions(false);
      }
      
    } catch (error) {
      console.error('Error generating video:', error);
      const errorMsg = error.response?.data?.detail || 'Erro ao gerar vídeo. Tente novamente.';
      toast.error(`❌ ${errorMsg}`, { duration: 8000 });
      
      if (errorMsg.includes('API key')) {
        toast.info('💡 Configure sua chave Emergent nas configurações', { duration: 6000 });
      }
    } finally {
      setIsGeneratingVideo(false);
      setVideoOptions(prev => ({ ...prev, progress: 0 }));
    }
  };

  const searchYouTube = async () => {
    if (!searchQuery && !questionText) {
      toast.error('Digite uma questão para buscar');
      return;
    }

    setIsSearching(true);
    try {
      const query = searchQuery || questionText;
      const response = await axios.post(`${API}/math/youtube-search`, {
        question: query
      });

      setYoutubeResults(response.data.results);
      toast.success(`${response.data.results.length} vídeos encontrados!`);
    } catch (error) {
      console.error('Error searching YouTube:', error);
      toast.error('Erro ao buscar vídeos. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const renderMathContent = (content) => {
    if (!content) return null;

    const parts = [];
    let lastIndex = 0;
    const mathRegex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
    let match;

    while ((match = mathRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      if (match[1]) {
        parts.push(
          <div key={`math-${match.index}`} className="my-4">
            <BlockMath math={match[1]} />
          </div>
        );
      } else if (match[2]) {
        parts.push(
          <span key={`math-${match.index}`}>
            <InlineMath math={match[2]} />
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="min-h-screen neural-void-bg p-2 sm:p-4">
      <div className="noise-overlay" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8 pt-4 sm:pt-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <BookOpen className="text-violet-400" size={28} />
            <h1 className="text-2xl sm:text-4xl font-bold" style={{ 
              fontFamily: 'Space Grotesk', 
              background: 'linear-gradient(to right, #c084fc, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Explicação Matemática
            </h1>
          </div>
          <p className="text-xs sm:text-base text-gray-400">Gere explicações detalhadas ou encontre vídeos</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/40 backdrop-blur-xl border border-white/10">
            <TabsTrigger value="explain" className="data-[state=active]:bg-violet-600">
              <Sparkles className="mr-2" size={18} />
              Explicação IA
            </TabsTrigger>
            <TabsTrigger value="youtube" className="data-[state=active]:bg-violet-600">
              <Youtube className="mr-2" size={18} />
              Buscar no YouTube
            </TabsTrigger>
          </TabsList>

          {/* Explicação IA Tab */}
          <TabsContent value="explain" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Input Section */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-white font-medium mb-2 block text-sm sm:text-base">Digite sua questão:</label>
                  <Textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Ex: Calcule o volume de um cone..."
                    className="min-h-24 sm:min-h-32 bg-white/5 border-white/10 text-white resize-none text-sm sm:text-base"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="text-gray-500 text-xs sm:text-sm">OU</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                <div>
                  <label className="text-white font-medium mb-2 block text-sm sm:text-base">Envie uma foto:</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                    aria-label="Capturar foto da câmera"
                  />
                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-white/10 hover:bg-white/5 text-xs sm:text-sm h-9 sm:h-10"
                      disabled={isLoading}
                    >
                      <Upload size={16} className="mr-1 sm:mr-2" />
                      {questionImage ? 'Trocar' : 'Galeria'}
                    </Button>
                    <Button
                      onClick={() => cameraInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-violet-500/30 hover:bg-violet-500/10 text-violet-400 text-xs sm:text-sm h-9 sm:h-10"
                      disabled={isLoading}
                    >
                      <Camera size={16} className="mr-1 sm:mr-2" />
                      Câmera
                    </Button>
                  </div>

                  {imagePreview && (
                    <div className="mt-3 sm:mt-4 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-auto max-h-64 sm:max-h-96 mx-auto rounded-lg border border-white/10 object-contain"
                      />
                      <Button
                        onClick={() => {
                          setImagePreview(null);
                          setQuestionImage(null);
                        }}
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white"
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || (!questionText && !questionImage)}
                  size="sm"
                  className="w-full bg-violet-600 hover:bg-violet-700 h-10 sm:h-11 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2" size={16} />
                      Gerar Explicação
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Explanation Display */}
            {explanation && (
              <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg sm:text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
                    Explicação Completa
                  </h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={exportToPDF}
                      variant="outline"
                      size="sm"
                      className="border-white/10 hover:bg-white/5 flex-1 sm:flex-none text-xs"
                    >
                      <FileText size={14} className="mr-1" />
                      PDF
                    </Button>
                    <Button
                      onClick={() => setShowVideoOptions(!showVideoOptions)}
                      variant="outline"
                      size="sm"
                      className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 flex-1 sm:flex-none text-xs"
                    >
                      <Video size={14} className="mr-1" />
                      Vídeo
                    </Button>
                  </div>
                </div>

                {/* Video Options Panel */}
                {showVideoOptions && (
                  <Card className="mb-6 bg-gradient-to-br from-emerald-900/30 to-green-900/30 border-2 border-emerald-500/40 p-4 sm:p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                        <Video size={20} className="text-emerald-400" />
                        Gerar Vídeo Explicativo
                      </h3>
                      <Button
                        onClick={() => setShowVideoOptions(false)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                        <p className="text-sm text-emerald-300">
                          ✨ O vídeo será gerado com base na explicação atual, incluindo todos os passos e fórmulas.
                        </p>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block text-sm">
                          Duração por Passo: {videoOptions.duration}s
                        </Label>
                        <input
                          type="range"
                          min="3"
                          max="15"
                          value={videoOptions.duration}
                          onChange={(e) => setVideoOptions(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>3s (Rápido)</span>
                          <span>15s (Detalhado)</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block text-sm">Tema do Vídeo</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {['dark', 'light', 'gradient'].map((theme) => (
                            <button
                              key={theme}
                              onClick={() => setVideoOptions(prev => ({ ...prev, theme }))}
                              className={`p-2 rounded-lg border-2 transition-all text-xs ${
                                videoOptions.theme === theme
                                  ? 'border-emerald-500 bg-emerald-500/20'
                                  : 'border-white/10 bg-white/5 hover:border-emerald-500/50'
                              }`}
                            >
                              {theme === 'dark' && '🌙 Escuro'}
                              {theme === 'light' && '☀️ Claro'}
                              {theme === 'gradient' && '🌈 Gradiente'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block text-sm">Qualidade</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: '720p', label: '720p HD' },
                            { value: '1080p', label: '1080p Full HD' }
                          ].map((quality) => (
                            <button
                              key={quality.value}
                              onClick={() => setVideoOptions(prev => ({ ...prev, quality: quality.value }))}
                              className={`p-2 rounded-lg border-2 transition-all text-xs ${
                                videoOptions.quality === quality.value
                                  ? 'border-emerald-500 bg-emerald-500/20'
                                  : 'border-white/10 bg-white/5 hover:border-emerald-500/50'
                              }`}
                            >
                              {quality.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {isGeneratingVideo && (
                        <div className="space-y-2 bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/30">
                          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-500 flex items-center justify-center"
                              style={{ width: `${videoOptions.progress}%` }}
                            >
                              <span className="text-xs font-bold text-white">{videoOptions.progress}%</span>
                            </div>
                          </div>
                          <p className="text-center text-sm text-emerald-300 font-medium">
                            Gerando vídeo... {videoOptions.progress}%
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={generateVideo}
                        disabled={isGeneratingVideo}
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 h-11 text-sm font-semibold"
                      >
                        {isGeneratingVideo ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={18} />
                            Gerando Vídeo...
                          </>
                        ) : (
                          <>
                            <Video size={18} className="mr-2" />
                            Gerar Vídeo Agora
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-gray-400 text-center">
                        O vídeo será baixado automaticamente quando estiver pronto
                      </p>
                    </div>
                  </Card>
                )}

                <div ref={explanationRef} className="space-y-4 sm:space-y-6">
                  {/* Title */}
                  <div className="text-center border-b border-white/10 pb-3 sm:pb-4">
                    <h3 className="text-base sm:text-xl font-semibold text-violet-300">
                      {explanation.title}
                    </h3>
                  </div>

                  {/* Steps Navigation */}
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 sm:p-4">
                    <Button
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm h-8 px-2 sm:px-4"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">Anterior</span>
                    </Button>
                    <span className="text-white text-xs sm:text-sm">
                      {currentStep + 1}/{explanation.steps.length}
                    </span>
                    <Button
                      onClick={() => setCurrentStep(Math.min(explanation.steps.length - 1, currentStep + 1))}
                      disabled={currentStep === explanation.steps.length - 1}
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm h-8 px-2 sm:px-4"
                    >
                      <span className="hidden sm:inline">Próximo</span>
                      <ChevronRight size={16} />
                    </Button>
                  </div>

                  {/* Step Navigator and Current Step Display */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Step Navigator */}
                    <div className="lg:col-span-1">
                      <StepNavigator
                        steps={explanation.steps}
                        currentStep={currentStep}
                        onStepClick={setCurrentStep}
                      />
                    </div>

                    {/* Right: Current Step Content */}
                    <div className="lg:col-span-2">
                      {/* Progress Indicator */}
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          Passo {currentStep + 1} de {explanation.steps.length}
                        </span>
                        <div className="flex-1 mx-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-violet-500 transition-all duration-500"
                            style={{ width: `${((currentStep + 1) / explanation.steps.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Current Step Card */}
                      <Card className="bg-gradient-to-br from-purple-900/40 via-violet-800/30 to-purple-900/40 border-2 border-purple-400/40 p-6 sm:p-8 shadow-2xl">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 border-2 border-purple-300 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                            {currentStep + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-2">
                              {explanation.steps[currentStep].title}
                            </h3>
                            <button
                              onClick={() => setIsChatOpen(true)}
                              className="text-cyan-400 text-sm flex items-center gap-2 hover:text-cyan-300 transition"
                            >
                              <MessageCircle size={16} />
                              Tirar dúvida desta seção
                            </button>
                          </div>
                        </div>

                        {/* Step Content */}
                        <div className="space-y-4">
                          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                            <div className="text-gray-100 leading-relaxed text-base">
                              {renderMathContent(explanation.steps[currentStep].content)}
                            </div>
                          </div>

                          {/* Formula Display */}
                          {explanation.steps[currentStep].formula && (
                            <div className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-400/30">
                              <div className="overflow-x-auto">
                                <BlockMath math={explanation.steps[currentStep].formula} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex gap-3 mt-6">
                          <Button
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0}
                            variant="outline"
                            className="flex-1 border-purple-500/30 hover:bg-purple-500/10"
                          >
                            <ChevronLeft size={18} className="mr-1" />
                            Anterior
                          </Button>
                          <Button
                            onClick={() => setCurrentStep(Math.min(explanation.steps.length - 1, currentStep + 1))}
                            disabled={currentStep === explanation.steps.length - 1}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                          >
                            Próximo
                            <ChevronRight size={18} className="ml-1" />
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Prerequisites Section */}
                  {explanation.prerequisites && explanation.prerequisites.length > 0 && (
                    <div className="mt-8 border-t border-white/10 pt-8">
                      <h4 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <BookMarked className="text-yellow-400" size={28} />
                        Tópicos Importantes para Estudar
                      </h4>
                      <p className="text-gray-400 mb-6">
                        Conceitos necessários para entender esta questão completamente
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {explanation.prerequisites.map((prereq, index) => (
                          <Card key={index} className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30 p-4 hover:border-yellow-500/50 transition-all">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h5 className="text-lg font-semibold text-white mb-2">
                                  {prereq.topic}
                                </h5>
                                <p className="text-gray-300 text-sm mb-3">
                                  {prereq.description}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                                  <Youtube className="text-red-500" size={16} />
                                  <span className="truncate">{prereq.video_title}</span>
                                  <Clock size={14} />
                                  <span>{prereq.duration}</span>
                                </div>
                                <Button
                                  onClick={() => {
                                    const videoId = prereq.video_id;
                                    console.log('Opening prerequisite video:', videoId);
                                    if (videoId && videoId.length > 0) {
                                      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
                                    } else {
                                      toast.error('ID de vídeo inválido');
                                    }
                                  }}
                                  size="sm"
                                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                                >
                                  <Play size={14} className="mr-2" />
                                  Assistir Aula
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Similar Questions Section */}
                  {explanation.similar_questions && explanation.similar_questions.length > 0 && (
                    <div className="mt-8 border-t border-white/10 pt-8">
                      <h4 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <ListChecks className="text-green-400" size={28} />
                        Questões Similares para Praticar
                      </h4>
                      <p className="text-gray-400 mb-6">
                        Pratique com questões parecidas e assista as resoluções
                      </p>
                      <div className="space-y-4">
                        {explanation.similar_questions.map((question, index) => (
                          <Card key={index} className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30 p-5 hover:border-green-500/50 transition-all">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-lg">
                                  {index + 1}
                                </div>
                                <Badge 
                                  className={`mt-2 ${
                                    question.difficulty === 'Fácil' ? 'bg-green-600' :
                                    question.difficulty === 'Médio' ? 'bg-yellow-600' :
                                    'bg-red-600'
                                  }`}
                                >
                                  {question.difficulty}
                                </Badge>
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium mb-3 leading-relaxed">
                                  {question.question}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                                  <Youtube className="text-red-500" size={16} />
                                  <span className="font-medium">{question.channel}</span>
                                  <span>•</span>
                                  <span className="truncate">{question.video_title}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const videoId = question.video_id;
                                      console.log('Opening similar question video:', videoId);
                                      if (videoId && videoId.length > 0) {
                                        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
                                      } else {
                                        toast.error('ID de vídeo inválido');
                                      }
                                    }}
                                    size="sm"
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <Play size={14} className="mr-2" />
                                    Ver Resolução
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setQuestionText(question.question);
                                      setActiveTab('explain');
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="border-green-500/30"
                                  >
                                    <Sparkles size={14} className="mr-2" />
                                    Resolver com IA
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* YouTube Search Tab */}
          <TabsContent value="youtube" className="space-y-6 mt-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-white font-medium mb-2 block flex items-center gap-2">
                    <Youtube size={20} className="text-red-500" />
                    Buscar Questões Similares no YouTube
                  </label>
                  <Textarea
                    value={searchQuery || questionText}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Digite a questão ou tema que deseja buscar..."
                    className="min-h-24 bg-white/5 border-white/10 text-white resize-none"
                  />
                </div>

                <Button
                  onClick={searchYouTube}
                  disabled={isSearching || (!searchQuery && !questionText)}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={20} />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2" size={20} />
                      Buscar no YouTube
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* YouTube Results */}
            {youtubeResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Youtube className="text-red-500" />
                  {youtubeResults.length} Vídeos Encontrados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {youtubeResults.map((video, index) => (
                    <Card
                      key={index}
                      className="bg-black/40 backdrop-blur-xl border-white/10 p-4 cursor-pointer hover:border-violet-500/50 transition-all"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="space-y-3">
                        <div className="relative">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full rounded-lg"
                          />
                          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                            <Clock size={12} />
                            {video.duration}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white font-medium line-clamp-2 mb-1">
                            {video.title}
                          </h4>
                          <p className="text-gray-400 text-sm">{video.channel}</p>
                          <div className="flex items-center gap-3 mt-2 text-gray-500 text-xs">
                            <span className="flex items-center gap-1">
                              <Eye size={12} />
                              {video.views}
                            </span>
                            <span>{video.publishedAt}</span>
                          </div>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVideo(video);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full border-white/10 hover:bg-white/5"
                        >
                          <Play size={16} className="mr-2" />
                          Assistir Agora
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Video Player Modal */}
            {selectedVideo && (
              <div
                className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedVideo(null)}
              >
                <div
                  className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg max-w-4xl w-full p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="aspect-video mb-4">
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedVideo.videoId}`}
                      title={selectedVideo.title}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {selectedVideo.title}
                    </h3>
                    <p className="text-gray-400">{selectedVideo.channel}</p>
                  </div>
                  <Button
                    onClick={() => setSelectedVideo(null)}
                    className="mt-4 w-full"
                    variant="outline"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Math Chat Helper - Floating Chat */}
      {explanation && (
        <MathChatHelper
          step={explanation.steps[currentStep]}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(!isChatOpen)}
        />
      )}
    </div>
  );
}
