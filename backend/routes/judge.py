from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests
import json
import re

router = APIRouter(prefix="/judge", tags=["judge"])

PISTON_URL = "https://emkc.org/api/v2/piston/execute"

LANG_NAMES = {
    "c": {"piston": "c", "file": "main.c", "run_timeout": 5000},
    "cpp": {"piston": "c++", "file": "main.cpp", "run_timeout": 5000},
    "python": {"piston": "python", "file": "main.py", "run_timeout": 5000},
}

# Simple AI-based code explanation service (as fallback when OpenAI is not available)
class SimpleCodeExplainer:
    def __init__(self):
        self.explanations = {}
    
    def generate_explanation(self, code: str, language: str, error_type: str, error_details: str) -> dict:
        """Generate a simple step-by-step explanation of the error and how to fix it"""
        explanation = self._analyze_error(code, language, error_type, error_details)
        return {
            "title": "Análise do Erro",
            "steps": explanation["steps"],
            "debugging_suggestions": explanation["suggestions"],
            "key_concepts": explanation["concepts"],
            "alternative_approaches": explanation["approaches"]
        }
    
    def _analyze_error(self, code: str, language: str, error_type: str, error_details: str) -> dict:
        """Simple error analysis based on common patterns"""
        
        # Common error patterns for different languages
        python_patterns = {
            "NameError": {
                "title": "Variável não definida",
                "steps": [
                    {
                        "title": "Identificar a variável faltante",
                        "content": "O Python não consegue encontrar a variável referenciada. Procure por possíveis erros de digitação, escopo incorreto ou declaração anterior.",
                        "formula": None
                    },
                    {
                        "title": "Verificar a declaração",
                        "content": "Declare a variável antes de usá-la. Use print(type(variable)) para confirmar se a variável existe.",
                        "formula": None
                    },
                    {
                        "title": "Teste de debugging",
                        "content": "Adicione esta linha no início do código: __import__('pdb'); __import__('pdb').set_trace()",
                        "formula": None
                    }
                ],
                "suggestions": "1. Use um IDE com verificação de tipos 2. Verifique a indentação 3. Use linters de código",
                "concepts": ["Escopo de variáveis Python", "Declaração de variáveis", "Debugging Python"],
                "approaches": [
                    "Use variáveis globais para debug se necessário",
                    "Utilize o debugger do VS Code ou PyCharm",
                    "Verifique se não há quebras de linha ou espaços extras"
                ]
            },
            "TypeError": {
                "title": "Tipo incompatível de operação",
                "steps": [
                    {
                        "title": "Identificar tipos incompatíveis",
                        "content": "O Python encontrou uma operação que não pode ser realizada com os tipos fornecidos. Ex: tentar concatenar strings com números.",
                        "formula": None
                    },
                    {
                        "title": "Converter tipos",
                        "content": "Use a função int(), float(), str() ou list() para converter os tipos conforme necessário.",
                        "formula": None
                    },
                    {
                        "title": "Validar entrada",
                        "content": "Valide os tipos dos parâmetros de entrada antes de realizar operações.",
                        "formula": None
                    }
                ],
                "suggestions": "1. Use type() para inspecionar tipos 2. Implemente verificações de tipo robustas 3. Use anotações de tipo para prevenir erros",
                "concepts": ["Inferência de tipo Python", "Conversão de tipo", "Verificação de tipo dinâmica"],
                "approaches": [
                    "Adicione cast('string', variable) para converter tipos",
                    "Utilize try/except para tratar operações não numéricas",
                    "Implemente função de ajuda validate_input()"
                ]
            },
            "IndexError": {
                "title": "Acesso a índice fora dos limites",
                "steps": [
                    {
                        "title": "Identificar a lista/array",
                        "content": "O Python tentou acessar um índice que não existe na lista. Reveja o tamanho da lista e o índice.",
                        "formula": None
                    },
                    {
                        "title": "Verificar limites",
                        "content": "Use len(minha_lista) - 1 para obter o último índice válido. Verifique também o uso de range() em loops.",
                        "formula": None
                    },
                    {
                        "title": "Impedir acesso fora dos limites",
                        "content": "Adicione verificações de limites: if índice < len(minha_lista): em vez de acessar diretamente.",
                        "formula": None
                    }
                ],
                "suggestions": "1. Use .append() para adicionar elementos 2. Crie wrappers de listas seguros 3. Implemente tratamento de exceções melhorado",
                "concepts": ["Índice de lista Python", "Acesso seguro a lista", "Tratamento de exceções"],
                "approaches": [
                    "Utilize try/except para IndexError como padrão",
                    "Crie helper function safe_get() para listas",
                    "Use enumerate() em vez de range(len())"
                ]
            }
        }
        
        java_patterns = {
            "NullPointerException": {
                "title": "Referência a objeto nula",
                "steps": [
                    {
                        "title": "Identificar onde nulo é acessado",
                        "content": "O Java não consegue acessar métodos/atributos em um objeto que é null. Procure por variáveis ou referências que não foram inicializadas.",
                        "formula": None
                    },
                    {
                        "title": "Verificar inicialização",
                        "content": "Certifique-se de que todos os objetos são inicializados corretamente. Use null checks:",
                        "formula": "if (variable != null) { /* usar variável */ }"
                    },
                    {
                        "title": "Usar métodos seguros",
                        "content": "Utilize métodos auxiliares para verificar nulos antes de usar as variáveis.",
                        "formula": "ObjectUtils.isNotEmpty(object) // helper method"
                    }
                ],
                "suggestions": "1. Use Optional<> para objetos que podem ser null 2. Implemente verificação de null 3. Use IDEs com verificação de NPE",
                "concepts": ["Referências nulas Java", "Optional<> API", "Verificação de ponteiros nulos"],
                "approaches": [
                    "Use Objects.requireNonNull() para validação obrigatória",
                    "Adicione guard clauses no início dos métodos",
                    "Utilize assertNotNull() para hipóteses de entrada"
                ]
            },
            "ArrayIndexOutOfBoundsException": {
                "title": "Índice de array fora dos limites",
                "steps": [
                    {
                        "title": "Verificar índices do array",
                        "content": "O Java não consegue acessar um índice que não existe no array. Arrays têm índices de 0 a length-1.",
                        "formula": None
                    },
                    {
                        "title": "Usar loops seguros",
                        "content": "Use enhanced for loop ou arrays.stream() para evitar erros de índice manualmente.",
                        "formula": "for (int i = 0; i < array.length; i++)"
                    },
                    {
                        "title": "Validar acesso a array",
                        "content": "Adicione verificações: if (index >= 0 && index < array.length)",
                        "formula": None
                    }
                ],
                "suggestions": "1. Use Arrays.stream() para processamento funcional 2. Implemente verificações seguras de limites 3. Utilize List em vez de arrays para maior segurança",
                "concepts": ["Índices de array Java", "Segurança de limites de array", "Melhores práticas de arrays"],
                "approaches": [
                    "Crie helper function safeGet(array, index) returns null if invalid",
                    "Use Guava Arrays.asList() para segurança extra",
                    "Utilize java.util.Collections.singletonList() para listas singleton"
                ]
            }
        }
        
        # Se não encontrar padrão específico, retorne análise genérica
        if error_type == "NameError" and language == "python":
            return python_patterns["NameError"]
        elif error_type == "TypeError" and language == "python":
            return python_patterns["TypeError"]
        elif error_type == "IndexError" and language == "python":
            return python_patterns["IndexError"]
        elif error_type == "NullPointerException" and language == "java":
            return java_patterns["NullPointerException"]
        elif error_type == "ArrayIndexOutOfBoundsException" and language == "java":
            return java_patterns["ArrayIndexOutOfBoundsException"]
        
        # Explicação genérica para casos não identificados
        return {
            "title": "Erro Detectado - Guia de Correção",
            "steps": [
                {
                    "title": "Identificar o Erro",
                    "content": f"Ocorreu um {error_type} no seu código. O erro básico é: {error_details}",
                    "formula": None
                },
                {
                    "title": "Analisar Causas",
                    "content": "Procure por erros de sintaxe, uso incorreto de variáveis, ou acesso fora dos limites. Verifique também a entrada do usuário.",
                    "formula": None
                },
                {
                    "title": "Teste de Debugging",
                    "content": "Adicione print statements para verificar variáveis, ou use o debugger do IDE para depurar passo a passo.",
                    "formula": None
                }
            ],
            "suggestions": "1. Verifique a sintaxe do código 2. Teste com inputs simples 3. Utilize o debugger para execução passo a passo 4. Leia mensagens de erro completas",
            "concepts": [f"Debugging {language}", "Mensagens de erro comuns", "Testes unitários"],
            "approaches": [
                "Crie testes unitários de caso simples",
                "Utilize print()/console.log() para depuração",
                "Considere usar ferramentas de análise estática",
                "Implemente logs de exceção detalhados"
            ]
        }


class TestCase(BaseModel):
    input: str
    expected: str


class SubmitRequest(BaseModel):
    language: str
    code: str
    test_cases: List[TestCase] = []


def _normalize(out: str) -> str:
    lines = (out or "").replace("\r\n", "\n").replace("\r", "\n").split("\n")
    while lines and lines[-1].strip() == "":
        lines.pop()
    return "\n".join(l.rstrip() for l in lines)


def _run(lang: str, code: str, stdin: str) -> dict:
    conf = LANG_NAMES.get(lang)
    if not conf:
        raise HTTPException(status_code=400, detail="Linguagem não suportada.")
    payload = {
        "language": conf["piston"],
        "version": "*",
        "files": [{"name": conf["file"], "content": code}],
        "stdin": stdin,
        "compile_timeout": 10000,
        "run_timeout": conf["run_timeout"],
    }
    try:
        r = requests.post(PISTON_URL, json=payload, timeout=60)
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=502, detail=f"Falha ao acessar o serviço de execução: {e}"
        )
    try:
        return r.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Resposta inválida do serviço de execução.")


@router.post("/submit")
def judge_submit(req: SubmitRequest):
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Código vazio.")
    if not req.test_cases:
        raise HTTPException(status_code=400, detail="Nenhum caso de teste enviado.")

    compile_out = None
    first_result = _run(req.language, req.code, req.test_cases[0].input)
    if first_result.get("compile") and first_result["compile"].get("code") is not None and first_result["compile"].get("code") != 0:
        return {
            "compile": {"ok": False, "stderr": first_result["compile"].get("stderr", "")},
            "tests": [],
            "summary": {"passed": 0, "total": len(req.test_cases), "accepted": False},
        }
    if not first_result.get("run"):
        return {
            "compile": {"ok": True, "stderr": ""},
            "tests": [],
            "summary": {"passed": 0, "total": len(req.test_cases), "accepted": False},
            "error": "Falha ao executar o código. Verifique erros de sintaxe/compilação.",
            "stderr": (first_result.get("compile") or {}).get("stderr", ""),
        }

    results = [first_result]
    for tc in req.test_cases[1:]:
        results.append(_run(req.language, req.code, tc.input))

    tests = []
    passed = 0
    for i, (tc, res) in enumerate(zip(req.test_cases, results)):
        run = res.get("run") or {}
        stderr = run.get("stderr", "") or ""
        output = _normalize(run.get("stdout", ""))
        expected = _normalize(tc.expected)
        ok = output == expected
        if ok:
            passed += 1
        tests.append(
            {
                "index": i + 1,
                "passed": ok,
                "expected": tc.expected,
                "actual": run.get("stdout", ""),
                "stderr": stderr[:500],
                "exit_code": run.get("code"),
                "wall_time_ms": run.get("wall_time"),
            }
        )

    return {
        "compile": {"ok": True, "stderr": (results[0].get("compile") or {}).get("stderr", "")},
        "tests": tests,
        "summary": {
            "passed": passed,
            "total": len(req.test_cases),
            "accepted": passed == len(req.test_cases),
        },
    }
