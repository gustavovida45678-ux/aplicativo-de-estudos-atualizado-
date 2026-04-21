import React, { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Upload, Image as ImageIcon, X, Sparkles, FileText, BookOpen, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ExerciseGenerator() {
  const [activeMode, setActiveMode] = useState('similar'); // similar or create
  const [exerciseInput, setExerciseInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExercises, setGeneratedExercises] = useState([]);
  const [numberOfExercises, setNumberOfExercises] = useState(3);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateExercises = async () => {
    if (!exerciseInput.trim() && !selectedImage) {
      toast.error('Digite um exercício ou faça upload de uma imagem');
      return;
    }

    setIsGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append('reference_text', exerciseInput);
      formData.append('number_of_exercises', numberOfExercises);
      formData.append('mode', activeMode);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await axios.post(`${API}/exercises/generate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setGeneratedExercises(response.data.exercises || []);
      toast.success(`${response.data.exercises?.length || 0} exercícios gerados!`);
      
    } catch (error) {
      console.error('Error generating exercises:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao gerar exercícios';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Mode Selection */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setActiveMode('similar')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
            activeMode === 'similar'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
          data-testid="mode-similar-btn"
        >
          <Lightbulb className="inline mr-2" size={20} />
          Exercícios Semelhantes
        </button>
        
        <button
          onClick={() => setActiveMode('create')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
            activeMode === 'create'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
          data-testid="mode-create-btn"
        >
          <Sparkles className="inline mr-2" size={20} />
          Criar Exercícios Novos
        </button>
      </div>

      {/* Input Section */}
      <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-4">
          {activeMode === 'similar' ? '📚 Exercício de Referência' : '✨ Criar Exercícios Personalizados'}
        </h3>
        
        <p className="text-gray-400 text-sm mb-4">
          {activeMode === 'similar' 
            ? 'Forneça um exercício exemplo (texto ou imagem) para gerar exercícios semelhantes' 
            : 'Descreva o tipo de exercício que deseja criar ou envie uma imagem de exemplo'}
        </p>

        {/* Text Input */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <FileText className="inline mr-1" size={16} />
            Exercício em Texto
          </label>
          <textarea
            value={exerciseInput}
            onChange={(e) => setExerciseInput(e.target.value)}
            placeholder="Cole ou digite um exercício exemplo..."
            className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            data-testid="exercise-input"
          />
        </div>

        {/* Image Upload */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            <ImageIcon className="inline mr-1" size={16} />
            Ou faça upload de uma imagem
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {imagePreview ? (
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-w-xs rounded-lg border border-white/20"
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                data-testid="clear-image-btn"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-white/20 rounded-lg hover:border-blue-500 hover:bg-white/5 transition flex flex-col items-center justify-center text-gray-400 hover:text-blue-400"
              data-testid="upload-image-btn"
            >
              <Upload size={32} className="mb-2" />
              <span>Clique para fazer upload de uma imagem</span>
              <span className="text-xs mt-1">PNG, JPG, WebP até 5MB</span>
            </button>
          )}
        </div>

        {/* Number of Exercises */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Quantidade de exercícios
          </label>
          <select
            value={numberOfExercises}
            onChange={(e) => setNumberOfExercises(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
            data-testid="number-select"
          >
            <option value={1}>1 exercício</option>
            <option value={3}>3 exercícios</option>
            <option value={5}>5 exercícios</option>
            <option value={10}>10 exercícios</option>
          </select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateExercises}
          disabled={isGenerating || (!exerciseInput.trim() && !selectedImage)}
          className={`w-full py-3 text-lg font-semibold ${
            activeMode === 'similar' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
          }`}
          data-testid="generate-btn"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2" />
              Gerando exercícios...
            </>
          ) : (
            <>
              <Sparkles className="inline mr-2" size={20} />
              Gerar {numberOfExercises} Exercício{numberOfExercises > 1 ? 's' : ''}
            </>
          )}
        </Button>
      </Card>

      {/* Generated Exercises */}
      {generatedExercises.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white mb-4">
            <BookOpen className="inline mr-2" size={24} />
            Exercícios Gerados ({generatedExercises.length})
          </h3>

          {generatedExercises.map((exercise, index) => (
            <Card 
              key={index} 
              className="bg-black/40 backdrop-blur-xl border-white/10 p-6"
              data-testid={`exercise-card-${index}`}
            >
              {/* Exercise Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-white">
                  Exercício {index + 1}
                </h4>
                <Badge className="bg-blue-600">
                  {exercise.difficulty || 'Médio'}
                </Badge>
              </div>

              {/* Question */}
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-gray-300 leading-relaxed">
                  {exercise.question}
                </p>
              </div>

              {/* Options */}
              {exercise.options && (
                <div className="space-y-2 mb-4">
                  {exercise.options.map((option, optIndex) => (
                    <div 
                      key={optIndex}
                      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-blue-500/50 transition"
                    >
                      <span className="text-blue-400 font-medium mr-2">
                        {String.fromCharCode(65 + optIndex)})
                      </span>
                      <span className="text-gray-300">{option}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Solution */}
              {exercise.solution && (
                <details className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <summary className="cursor-pointer text-green-400 font-medium text-lg mb-2">
                    ✓ Ver Resposta e Resolução Completa
                  </summary>
                  
                  <div className="mt-4 space-y-4">
                    {/* Correct Answer */}
                    <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-3">
                      <p className="text-green-300">
                        <strong className="text-green-400">✓ Resposta Correta:</strong> {exercise.correct_answer}
                      </p>
                      {exercise.solution.final_answer && (
                        <p className="text-gray-300 text-sm mt-2">
                          {exercise.solution.final_answer}
                        </p>
                      )}
                    </div>

                    {/* Prerequisites */}
                    {exercise.solution.prerequisites && exercise.solution.prerequisites.length > 0 && (
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <h5 className="text-blue-400 font-semibold mb-3 flex items-center">
                          <BookOpen className="inline mr-2" size={18} />
                          O que você precisa saber:
                        </h5>
                        <div className="space-y-2">
                          {exercise.solution.prerequisites.map((prereq, idx) => (
                            <div key={idx} className="bg-blue-800/20 rounded p-2">
                              <p className="text-blue-300 font-medium text-sm">
                                • {prereq.topic}
                              </p>
                              <p className="text-gray-400 text-xs ml-4 mt-1">
                                {prereq.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Steps */}
                    {exercise.solution.steps && exercise.solution.steps.length > 0 && (
                      <div>
                        <h5 className="text-green-400 font-semibold mb-3">
                          📝 Resolução Passo a Passo:
                        </h5>
                        <div className="space-y-3">
                          {exercise.solution.steps.map((step, stepIdx) => (
                            <div 
                              key={stepIdx}
                              className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4"
                            >
                              <h6 className="text-purple-400 font-semibold mb-2 flex items-center">
                                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                                  {stepIdx + 1}
                                </span>
                                {step.title}
                              </h6>
                              <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                {step.content}
                              </p>
                              {step.calculation && (
                                <div className="bg-black/30 rounded p-2 mt-2 font-mono text-sm text-blue-300">
                                  {step.calculation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy simple solution (fallback) */}
                    {typeof exercise.solution === 'string' && (
                      <div className="text-gray-300 space-y-2">
                        <p className="text-sm leading-relaxed">{exercise.solution}</p>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isGenerating && generatedExercises.length === 0 && (
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-12 text-center">
          <Sparkles size={64} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">
            Nenhum exercício gerado ainda
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Preencha os campos acima e clique em gerar para começar
          </p>
        </Card>
      )}
    </div>
  );
}
