import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../lib/backendUrl';
import { FileText, Search, BookOpen, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

const API = `${BACKEND_URL}/api/study`;

const defaultDocument = {
  title: 'Documento de estudo',
  keywords: [],
  topics: [],
  questions: []
};

function normalizeText(text = '') {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchableText(doc) {
  const items = [];
  doc.keywords?.forEach((k) => items.push(k.term || k.name || ''));
  doc.topics?.forEach((t) => {
    items.push(t.title || '');
    items.push(t.summary || '');
    (t.keywords || []).forEach((k) => items.push(k));
  });
  return items.join(' ').toLowerCase();
}

export default function StudyDocument() {
  const [documentData, setDocumentData] = useState(defaultDocument);
  const [search, setSearch] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredTopics = useMemo(() => {
    if (!documentData.topics?.length) return [];
    if (!search.trim()) return documentData.topics;
    const q = search.toLowerCase();
    return documentData.topics.filter((t) => {
      const text = `${t.title} ${t.summary} ${(t.keywords || []).join(' ')}`.toLowerCase();
      return text.includes(q);
    });
  }, [documentData, search]);

  const filteredQuestions = useMemo(() => {
    if (!documentData.questions?.length) return [];
    if (!search.trim()) return documentData.questions;
    const q = search.toLowerCase();
    return documentData.questions.filter((question) => {
      const text = `${question.topic} ${question.keyword || ''} ${question.question} ${question.answer || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [documentData, search]);

  const relatedQuestions = useMemo(() => {
    if (!selectedKeyword) return documentData.questions || [];
    return (documentData.questions || []).filter((question) => {
      const match = question.keyword === selectedKeyword || question.topic === selectedKeyword;
      return match;
    });
  }, [documentData, selectedKeyword]);

  const handleGenerateFromText = async (text) => {
    if (!normalizeText(text)) {
      setError('Digite ou envie um material para gerar o documento.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API}/generate-document`, {
        source_text: text,
        title: 'Documento de estudo gerado'
      });
      const payload = response.data || defaultDocument;
      setDocumentData(payload);
      setSelectedKeyword(payload.keywords?.[0]?.term || null);
      setExpandedTopic(payload.topics?.[0]?.id || null);
      setSelectedQuestionId(payload.questions?.[0]?.id || null);
    } catch (err) {
      console.error(err);
      setError('Não foi possível gerar o documento. Tente novamente com outro material.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API}/generate-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const payload = response.data || defaultDocument;
      setDocumentData(payload);
      setSelectedKeyword(payload.keywords?.[0]?.term || null);
      setExpandedTopic(payload.topics?.[0]?.id || null);
      setSelectedQuestionId(payload.questions?.[0]?.id || null);
    } catch (err) {
      console.error(err);
      setError('O arquivo não pôde ser processado. Tente enviar texto simples, PDF ou documento legível.');
    } finally {
      setLoading(false);
    }
  };

  const activeTopic = documentData.topics?.find((topic) => topic.id === expandedTopic) || filteredTopics[0] || null;

  return (
    <div className="space-y-6 text-slate-800">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Documento Inteligente de Estudos</h2>
            <p className="text-sm text-slate-500">Palavras-chave, resumo e questões integrados em um único fluxo.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100">
              <FileText size={16} className="mr-2" />
              Enviar arquivo
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt,.md,.rtf" />
            </label>
            <button
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              onClick={() => handleGenerateFromText('Variáveis, funções e limites são conceitos fundamentais da matemática. O limite descreve o comportamento de uma função quando a variável se aproxima de um valor. A derivada representa a taxa de variação instantânea e é usada para otimizar problemas. Integrais calculam áreas acumuladas e volumes.')}
              disabled={loading}
            >
              Gerar exemplo
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={16} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar palavras-chave, tópicos ou questões"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Gerando documento ...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[22%_48%_30%]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Palavras-chave</h3>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                {documentData.keywords?.length || 0}
              </span>
            </div>
            <div className="space-y-3">
              {(documentData.keywords || []).map((keyword, index) => (
                <button
                  key={`${keyword.term}-${index}`}
                  type="button"
                  onClick={() => setSelectedKeyword(keyword.term)}
                  className={`w-full rounded-xl border p-3 text-left transition ${selectedKeyword === keyword.term ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{keyword.term}</span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">{keyword.importance}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{keyword.definition}</p>
                  <p className="mt-2 text-[11px] text-slate-500">Fórmulas: {keyword.formulas?.join(', ') || '—'}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Tema: {keyword.topic}</p>
                </button>
              ))}
            </div>
          </aside>

          <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Resumo detalhado</h3>
              <div className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                {filteredTopics.length} tópico(s)
              </div>
            </div>

            <div className="space-y-4">
              {(filteredTopics.length ? filteredTopics : documentData.topics || []).map((topic) => (
                <div key={topic.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <button
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{topic.title}</p>
                      <h4 className="text-xl font-bold text-slate-900">{topic.heading || topic.title}</h4>
                    </div>
                    {expandedTopic === topic.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  {expandedTopic === topic.id && (
                    <div className="mt-4 space-y-4">
                      <p className="leading-7 text-slate-700">{topic.summary}</p>

                      {topic.keywords?.length ? (
                        <div>
                          <p className="mb-2 text-sm font-semibold text-slate-800">Palavras-chave do tópico</p>
                          <div className="flex flex-wrap gap-2">
                            {topic.keywords.map((word, idx) => (
                              <button
                                key={`${word}-${idx}`}
                                onClick={() => setSelectedKeyword(word)}
                                className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                              >
                                {word}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {topic.formulas?.length ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="mb-2 text-sm font-semibold text-slate-800">Fórmulas e conceitos</p>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                            {topic.formulas.map((formula, idx) => <li key={`${formula}-${idx}`}>{formula}</li>)}
                          </ul>
                        </div>
                      ) : null}

                      {topic.examples?.length ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="mb-2 text-sm font-semibold text-slate-800">Exemplos</p>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                            {topic.examples.map((example, idx) => <li key={`${example}-${idx}`}>{example}</li>)}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </main>

          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Questões</h3>
              <button
                onClick={() => setShowAnswers((prev) => !prev)}
                className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
              >
                {showAnswers ? 'Ocultar gabarito' : 'Mostrar gabarito'}
              </button>
            </div>

            <div className="space-y-3">
              {(filteredQuestions.length ? filteredQuestions : documentData.questions || []).map((question) => (
                <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <button
                    type="button"
                    onClick={() => setSelectedQuestionId(selectedQuestionId === question.id ? null : question.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">{question.topic}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{question.level}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-800">{question.question}</p>
                  </button>

                  {selectedQuestionId === question.id && (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {question.options?.length ? (
                        <ul className="space-y-1 text-sm text-slate-700">
                          {question.options.map((opt, idx) => (
                            <li key={`${question.id}-${idx}`} className="rounded-md bg-white px-2 py-1">{opt}</li>
                          ))}
                        </ul>
                      ) : null}

                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        onClick={() => setShowAnswers((prev) => !prev)}
                      >
                        <CheckCircle2 size={14} />
                        Conferir resposta
                      </button>

                      {showAnswers && (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
                          <p><strong>Resposta:</strong> {question.answer}</p>
                          <p className="mt-1"><strong>Gabarito:</strong> {question.correct_answer || question.answer}</p>
                          <p className="mt-1"><strong>Resolução:</strong> {question.solution}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
