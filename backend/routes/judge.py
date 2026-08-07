from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests
import json
import re
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/judge", tags=["judge"])

PISTON_URL = "https://emkc.org/api/v2/piston/execute"

LANG_NAMES = {
    "c": {"piston": "c", "file": "main.c", "run_timeout": 5000},
    "cpp": {"piston": "c++", "file": "main.cpp", "run_timeout": 5000},
    "python": {"piston": "python", "file": "main.py", "run_timeout": 5000},
}

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"


class TestCase(BaseModel):
    input: str
    expected: str


class SubmitRequest(BaseModel):
    language: str
    code: str
    test_cases: List[TestCase] = []


class ExerciseRequest(BaseModel):
    topic: str
    difficulty: int = 1
    language: str = "python"


def _normalize(out: str) -> str:
    lines = (out or "").replace("\r\n", "\n").replace("\r", "\n").split("\n")
    while lines and lines[-1].strip() == "":
        lines.pop()
    return "\n".join(l.rstrip() for l in lines)


def _run(lang: str, code: str, stdin: str) -> dict:
    conf = LANG_NAMES.get(lang)
    if not conf:
        raise HTTPException(status_code=400, detail="Linguagem nao suportada.")
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
        data = r.json()
        if "message" in data and "whitelist" in data.get("message", "").lower():
            logger.error("Piston API is now whitelist-only. Need alternative execution service.")
            return {"compile": {"code": -1, "stderr": "Servico de execucao indisponivel. Tente novamente mais tarde."}, "run": None}
        return data
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Falha ao acessar servico de execucao: {e}")
    except Exception:
        raise HTTPException(status_code=502, detail="Resposta invalida do servico de execucao.")


def _call_ai(system_prompt: str, user_prompt: str) -> Optional[str]:
    api_key = GROQ_API_KEY
    if not api_key:
        logger.warning("GROQ_API_KEY not set")
        return None

    try:
        logger.info(f"Calling Groq API with model {GROQ_MODEL}")
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 2000,
            },
            timeout=30,
        )

        if resp.status_code == 200:
            data = resp.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            if content:
                logger.info(f"Groq responded OK ({len(content)} chars)")
                return content
            else:
                logger.error("Groq returned empty content")
                return None
        else:
            logger.error(f"Groq API error {resp.status_code}: {resp.text[:500]}")
            return None
    except Exception as e:
        logger.error(f"Groq API failed: {e}")
        return None


def _ai_explain(code: str, language: str, stderr: str, stdout: str, expected: str, compile_error: bool) -> Optional[dict]:
    lang_name = {"c": "C", "cpp": "C++", "python": "Python"}.get(language, language)

    system_prompt = """Voce e um professor de programacao expert. Analise o codigo do aluno, identifique TODOS os erros e explique passo a passo como corrigir.

REGRAS OBRIGATORIAS:
- Responda APENAS com JSON valido (sem markdown, sem ```)
- Seja MUITO especifico: aponte linhas exatas, variaveis, operadores errados
- Mostre o codigo CORRETO como hint em cada passo
- Inclua o codigo corrigido completo no campo corrected_code
- Em cada passo, explique O QUE o aluno precisa aprender para nao errar de novo
- Use portugues simples e didatico

ESTRUTURA DO JSON:
{
  "error_type": "tipo do erro resumido",
  "analysis": "analise detalhada do que esta errado",
  "step_by_step": [
    {
      "step": 1,
      "title": "Titulo claro do passo",
      "detail": "explicacao completa e didatica",
      "code_hint": "exemplo de codigo correto ou null",
      "concept": "conceito que o aluno precisa aprender"
    }
  ],
  "suggestion": "dica final de como corrigir",
  "corrected_code": "codigo completo corrigido ou null",
  "youtube_search": "termo de busca para video aula no youtube"
}"""

    if compile_error:
        context = f"""CODIGO {lang_name} DO ALUNO COM ERRO DE COMPILACAO:

```{language}
{code}
```

ERRO DE COMPILACAO:
{stderr[:2000]}

Analise CADA erro, aponte a LINHA EXATA e explique como corrigir. Mostre o codigo correto."""
    elif stdout and expected:
        context = f"""CODIGO {lang_name} DO ALUNO - SAIDA INCORRETA:

```{language}
{code}
```

SAIDA DO ALUNO:
{stdout[:500]}

SAIDA ESPERADA:
{expected[:500]}

Explique POR QUE a saida esta errada e como corrigir a logica."""
    else:
        context = f"""CODIGO {lang_name} DO ALUNO FALHOU NA EXECUCAO:

```{language}
{code}
```

ERRO:
{stderr[:2000]}

Analise o erro e explique como corrigir."""

    raw = _call_ai(system_prompt, context)
    if not raw:
        return None

    try:
        if raw.startswith("```"):
            raw = re.sub(r"^```\w*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
        parsed = json.loads(raw)
        return parsed
    except json.JSONDecodeError:
        logger.error(f"Failed to parse AI response as JSON: {raw[:500]}")
        return {
            "error_type": "explicacao da IA",
            "analysis": raw[:1000],
            "step_by_step": [{"step": 1, "title": "Analise da IA", "detail": raw[:1000], "code_hint": None, "concept": None}],
            "suggestion": "Revise o codigo com base na analise acima.",
            "corrected_code": None,
            "youtube_search": f"{language} programacao erros comuns",
        }


def _get_youtube_videos(error_type: str, language: str, code: str = "") -> list:
    videos = []
    lang_lower = language.lower()

    if "compilacao" in error_type.lower() or "compile" in error_type.lower():
        if lang_lower == "c":
            videos.extend([
                {"title": "Aprenda C do Zero - Aula 1: Primeiro Programa", "url": "https://www.youtube.com/watch?v=edXaRMEVfDg", "thumbnail": "https://img.youtube.com/vi/edXaRMEVfDg/mqdefault.jpg"},
                {"title": "Erros Comuns em C - Compilacao e Sintaxe", "url": "https://www.youtube.com/results?search_query=erros+compilacao+linguagem+C+tutorial"},
                {"title": "C com Guy Virtuelle - Variaveis e Tipos", "url": "https://www.youtube.com/results?search_query=c+linguagem+variaveis+tipos+tutorial+portugues"},
            ])
        elif lang_lower == "cpp":
            videos.extend([
                {"title": "C++ do Zero - Aula Completa", "url": "https://www.youtube.com/results?search_query=C%2B%2B+do+zero+aula+completa+portugues"},
                {"title": "Erros Comuns em C++", "url": "https://www.youtube.com/results?search_query=erros+compilacao+C%2B%2B+tutorial"},
            ])
        else:
            videos.extend([
                {"title": "Python do Zero - Aula Completa", "url": "https://www.youtube.com/results?search_query=python+do+zero+aula+completa+portugues"},
                {"title": "Erros Comuns em Python", "url": "https://www.youtube.com/results?search_query=erros+python+sintaxe+tutorial+portugues"},
            ])
    elif "saida" in error_type.lower() or "incorreta" in error_type.lower():
        videos.extend([
            {"title": f"Logica de Programacao - Como Pensar como Programador", "url": "https://www.youtube.com/results?search_query=logica+programacao+como+pensar+programador+portugues"},
            {"title": f"{lang_lower.upper()} - Debug e Encontrar Erros", "url": f"https://www.youtube.com/results?search_query={lang_lower}+debug+encontrar+erros+portugues"},
        ])
    else:
        videos.extend([
            {"title": f"Curso Completo {language.upper()} - Programacao", "url": f"https://www.youtube.com/results?search_query=curso+completo+{lang_lower}+programacao+portugues"},
            {"title": "Logica de Programacao para Iniciantes", "url": "https://www.youtube.com/results?search_query=logica+programacao+iniciantes+portugues"},
        ])

    return videos


def _analyze_code_errors(code: str, language: str, stderr: str) -> list:
    errors_found = []
    code_lines = code.split("\n")

    if language in ("c", "cpp"):
        for i, line in enumerate(code_lines, 1):
            stripped = line.strip()
            if not stripped or stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*") or stripped.startswith("#"):
                continue

            if stripped.startswith("int main") or stripped.startswith("void main") or stripped.startswith("int ") and "(" in stripped:
                if not stripped.endswith("{") and "{" not in stripped and i < len(code_lines):
                    next_line = code_lines[i].strip() if i < len(code_lines) else ""
                    if not next_line.startswith("{"):
                        pass

            if "scanf" in stripped and language == "c":
                if "%d" in stripped:
                    scan_vars = re.findall(r'&(\w+)', stripped)
                    for var in scan_vars:
                        declared = any(f"int {var}" in cl or f"float {var}" in cl or f"char {var}" in cl or f"double {var}" in cl for cl in code_lines)
                        if not declared:
                            errors_found.append({
                                "line": i,
                                "error": f"Variavel '{var}' usada no scanf mas nao foi declarada",
                                "hint": f"Adicione 'int {var};' antes do scanf",
                                "concept": "Declaracao de variaveis em C",
                            })

            if re.match(r'^\s*(int|float|double|char)\s+\w+\s*=', stripped):
                pass

            if language == "c" and re.search(r'\b(bol|bool|Boolean)\b', stripped):
                errors_found.append({
                    "line": i,
                    "error": f"Tipo '{stripped.split()[0]}' nao existe em C padrao. Use 'int' para valores 0/1",
                    "hint": "int variavel = 0;  // 0 = falso, 1 = verdadeiro",
                    "concept": "Tipos de dados em C",
                })

            if re.search(r'\bif\s*\([^)]*\)=', stripped):
                errors_found.append({
                    "line": i,
                    "error": "Operador de atribuicao (=) usado em vez de comparacao (==) no if",
                    "hint": "if (a == b)  // duplo igual para comparar",
                    "concept": "Diferenca entre = (atribuicao) e == (comparacao)",
                })

            if re.search(r'\bif\s*\([^)]*[^=!<>]==[^=]', stripped) or re.search(r'\bif\s*\([^)]*[^=!<>]=[^=]', stripped):
                pass

            if re.search(r'\b(soma|resultado|media)\s*=\s*true\b', stripped):
                errors_found.append({
                    "line": i,
                    "error": f"Atribuicao invalida: 'true' nao e um valor numerico",
                    "hint": "int soma = 0;  // Use valor numerico, nao 'true'",
                    "concept": "Atribuicao de valores em C",
                })

            if re.search(r'\bif\s*\(\s*\w+\s*\+\s*\w+\s*\)\s*=', stripped):
                errors_found.append({
                    "line": i,
                    "error": "Expressao matematica no if com = em vez de ==",
                    "hint": "if (a + b == resultado)  // use == para comparar",
                    "concept": "Expressoes condicionais em C",
                })

            if "(" in stripped and ")" not in stripped and ";" not in stripped and "{" not in stripped:
                next_line = code_lines[i].strip() if i < len(code_lines) else ""
                if not next_line.startswith("{"):
                    pass

            if re.search(r'\breturn\s+\w+\s*;', stripped):
                pass

        all_errors = re.findall(r"(\d+):\d+:\s*(error|warning):\s*(.+)", stderr or "")
        for line_num_str, err_type, err_msg in all_errors:
            line_num = int(line_num_str)
            if line_num <= len(code_lines):
                problem_line = code_lines[line_num - 1].strip()
                already_found = any(e["line"] == line_num for e in errors_found)
                if not already_found:
                    hint = ""
                    concept = ""
                    if "expected" in err_msg.lower() and ";" in err_msg:
                        hint = f"Adicione ';' no final da linha {line_num}"
                        concept = "Ponto-e-virgula em C - toda instrucao termina com ;"
                    elif "undeclared" in err_msg.lower() or "not declared" in err_msg.lower():
                        var_m = re.search(r"'(\w+)'", err_msg)
                        var_n = var_m.group(1) if var_m else "variavel"
                        hint = f"int {var_n};  // declare antes de usar"
                        concept = "Declaracao de variaveis em C"
                    elif "redefinition" in err_msg.lower():
                        hint = "Remova a declaracao duplicada"
                        concept = "Escopo de variaveis - cada variavel so pode ser declarada uma vez"
                    elif "expected" in err_msg.lower() and ("')" in err_msg or "') " in err_msg):
                        hint = f"Verifique se ha parenteses ou aspas desbalanceados na linha {line_num}"
                        concept = "Balanceamento de parenteses e aspas"
                    elif "too few arguments" in err_msg.lower() or "too many arguments" in err_msg.lower():
                        hint = "Verifique a quantidade de argumentos passados para a funcao"
                        concept = "Parametros de funcoes em C"
                    elif "implicit declaration" in err_msg.lower():
                        hint = "Inclua o cabecalho correto (#include) ou declare a funcao antes de usar"
                        concept = "Declaracao de funcoes e include"
                    elif "format" in err_msg.lower() and "mismatch" in err_msg.lower():
                        hint = "Verifique se os tipos no printf/scanf combinam com as variaveis"
                        concept = "Formatacao de saida - printf e scanf"
                    else:
                        hint = f"Revise a linha {line_num}: {err_msg[:100]}"
                        concept = "Interpretacao de erros do compilador GCC"

                    errors_found.append({
                        "line": line_num,
                        "error": err_msg.strip()[:200],
                        "hint": hint,
                        "concept": concept,
                        "code_line": problem_line,
                    })

    elif language == "python":
        for i, line in enumerate(code_lines, 1):
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if re.search(r'\bdef\s+\w+\s*\(', stripped) and not stripped.endswith(":"):
                errors_found.append({
                    "line": i, "error": "Definicao de funcao sem ':' no final",
                    "hint": f"def minha_funcao():  // adicione : no final",
                    "concept": "Sintaxe de funcoes em Python",
                })

        py_errors = re.findall(r'File "(.+?)", line (\d+)', stderr or "")
        py_msg = re.search(r"(\w+Error):\s*(.+)", stderr or "")
        if py_msg and py_errors:
            line_num = int(py_errors[0][1])
            err_type = py_msg.group(1)
            err_detail = py_msg.group(2)
            if line_num <= len(code_lines):
                already = any(e["line"] == line_num for e in errors_found)
                if not already:
                    hint = ""
                    if "NameError" in err_type:
                        var_m = re.search(r"name '(\w+)'", err_detail)
                        var_n = var_m.group(1) if var_m else "variavel"
                        hint = f"{var_n} = valor  // declare antes de usar"
                    elif "SyntaxError" in err_type:
                        hint = "Verifique: dois-pontos, parenteses, indentacao"
                    elif "TypeError" in err_type:
                        hint = "Converta tipos: int(), float(), str()"
                    elif "IndexError" in err_type:
                        hint = "Use len(lista) para verificar limites"
                    errors_found.append({
                        "line": line_num, "error": f"{err_type}: {err_detail}",
                        "hint": hint, "concept": f"Erro {err_type} em Python",
                    })

    return errors_found


def _fallback_explanation(code: str, language: str, stderr: str, stdout: str, expected: str, compile_error: bool) -> dict:
    lang_name = {"c": "C", "cpp": "C++", "python": "Python"}.get(language, language)
    code_lines = code.split("\n")

    if compile_error:
        errors_found = _analyze_code_errors(code, language, stderr)
        step_by_step = []

        if errors_found:
            for idx, err in enumerate(errors_found[:5], 1):
                code_line = err.get("code_line", "")
                if not code_line and err["line"] <= len(code_lines):
                    code_line = code_lines[err["line"] - 1].strip()

                detail_parts = [f"Linha {err['line']}: {err['error']}"]
                if code_line:
                    detail_parts.append(f"Seu codigo: {code_line}")
                if err.get("hint"):
                    detail_parts.append(f"Como corrigir: {err['hint']}")

                step_by_step.append({
                    "step": idx,
                    "title": f"Erro na linha {err['line']}",
                    "detail": "\n".join(detail_parts),
                    "code_hint": err.get("hint"),
                    "concept": err.get("concept"),
                })
        else:
            all_errs = re.findall(r"(\d+):\d+:\s*(?:error|warning):\s*(.+)", stderr or "")
            if all_errs:
                for idx, (ln, msg) in enumerate(all_errs[:3], 1):
                    ln_int = int(ln)
                    code_line = code_lines[ln_int - 1].strip() if ln_int <= len(code_lines) else ""
                    step_by_step.append({
                        "step": idx,
                        "title": f"Erro na linha {ln}",
                        "detail": f"Mensagem: {msg}\nCodigo: {code_line}",
                        "code_hint": None,
                        "concept": "Interpretacao de erros do compilador",
                    })
            else:
                first_err = (stderr or "").split("\n")[0][:200] if stderr else "Erro desconhecido"
                step_by_step.append({
                    "step": 1,
                    "title": "Erro de compilacao",
                    "detail": f"Mensagem do compilador:\n{first_err}",
                    "code_hint": None,
                    "concept": "Interpretacao de erros do compilador GCC",
                })

        step_by_step.append({
            "step": len(step_by_step) + 1,
            "title": "Corrija e recompile",
            "detail": "Apos corrigir todos os erros acima, clique em 'Enviar para o juiz' novamente. Leia cada mensagem de erro cuidadosamente.",
            "code_hint": None,
            "concept": None,
        })

        err_summary = "; ".join([e["error"][:80] for e in errors_found[:3]]) if errors_found else (stderr.split("\n")[0][:100] if stderr else "Erro")
        return {
            "error_type": "Erro de compilacao",
            "analysis": f"O compilador {lang_name} encontrou {len(errors_found) or 1} erro(s). Veja abaixo a analise de cada erro.",
            "step_by_step": step_by_step,
            "suggestion": "Leia cada erro acima, entenda o que esta errado, e corrija o codigo. O compilador sempre aponta a linha exata.",
            "corrected_code": None,
            "youtube_search": f"compilador {lang_name} erros comuns tutorial",
        }

    elif stdout and expected:
        return {
            "error_type": "Saida incorreta",
            "analysis": f"O codigo {lang_name} compilou e executou, mas a saida esta diferente do esperado.",
            "step_by_step": [
                {"step": 1, "title": "Sua saida", "detail": f"Saida gerada pelo seu codigo:\n{stdout[:300]}", "code_hint": None, "concept": None},
                {"step": 2, "title": "Saida esperada", "detail": f"Saida que o exercicio espera:\n{expected[:300]}", "code_hint": None, "concept": None},
                {"step": 3, "title": "Compare e identifique a diferenca", "detail": "Compare linha por linha. Verifique: espacos extras, quebras de linha, formatacao de numeros, maiusculas/minusculas.", "code_hint": None, "concept": "Formatacao de saida em C - printf()"},
                {"step": 4, "title": "Corrija a logica", "detail": "Se a saida e numericamente diferente, revise os calculos. Se e de formatacao, ajuste o printf().", "code_hint": None, "concept": None},
            ],
            "suggestion": "Use printf() para debugar e ver intermediarios. Compare sua saida com a esperada caractere por caractere.",
            "corrected_code": None,
            "youtube_search": f"{lang_name} saida incorreta debug tutorial",
        }
    else:
        return {
            "error_type": "Erro na execucao",
            "analysis": stderr[:300] if stderr else "Erro desconhecido",
            "step_by_step": [
                {"step": 1, "title": "Erro detectado", "detail": stderr[:300] if stderr else "Sem detalhes do erro", "code_hint": None, "concept": None},
                {"step": 2, "title": "Revise o codigo", "detail": "Verifique logica, variaveis e operacoes.", "code_hint": None, "concept": None},
            ],
            "suggestion": "Adicione printf() para debugar o fluxo de execucao.",
            "corrected_code": None,
            "youtube_search": f"{lang_name} programacao debug tutorial",
        }


@router.post("/submit")
async def judge_submit(req: SubmitRequest):
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Codigo vazio.")
    if not req.test_cases:
        raise HTTPException(status_code=400, detail="Nenhum caso de teste enviado.")

    first_result = _run(req.language, req.code, req.test_cases[0].input)

    if first_result.get("compile") and first_result["compile"].get("code") is not None and first_result["compile"].get("code") != 0:
        compile_stderr = first_result["compile"].get("stderr", "")
        ai_explanation = _ai_explain(req.code, req.language, compile_stderr, "", "", True)
        if not ai_explanation:
            ai_explanation = _fallback_explanation(req.code, req.language, compile_stderr, "", "", True)
        ai_explanation["youtube_videos"] = _get_youtube_videos("compilacao", req.language, req.code)
        return {
            "compile": {"ok": False, "stderr": compile_stderr},
            "tests": [],
            "summary": {"passed": 0, "total": len(req.test_cases), "accepted": False},
            "explanation": ai_explanation,
        }

    if not first_result.get("run") or (first_result.get("run") and first_result["run"].get("stdout") is None and first_result["run"].get("code") != 0):
        stderr_val = (first_result.get("compile") or {}).get("stderr", "") or ((first_result.get("run") or {}).get("stderr", ""))
        ai_explanation = _ai_explain(req.code, req.language, stderr_val, "", "", True)
        if not ai_explanation:
            ai_explanation = _fallback_explanation(req.code, req.language, stderr_val, "", "", True)
        ai_explanation["youtube_videos"] = _get_youtube_videos("execucao", req.language, req.code)
        return {
            "compile": {"ok": True, "stderr": ""},
            "tests": [],
            "summary": {"passed": 0, "total": len(req.test_cases), "accepted": False},
            "error": "Falha ao executar o codigo.",
            "explanation": ai_explanation,
        }

    results = [first_result]
    for tc in req.test_cases[1:]:
        results.append(_run(req.language, req.code, tc.input))

    tests = []
    passed = 0
    first_fail = None
    for i, (tc, res) in enumerate(zip(req.test_cases, results)):
        run = res.get("run") or {}
        stderr = run.get("stderr", "") or ""
        output = _normalize(run.get("stdout", ""))
        expected_norm = _normalize(tc.expected)
        ok = output == expected_norm
        if ok:
            passed += 1
        elif first_fail is None:
            first_fail = {"stderr": stderr, "output": output, "expected": expected_norm}
        tests.append({
            "index": i + 1,
            "passed": ok,
            "expected": tc.expected,
            "actual": run.get("stdout", ""),
            "stderr": stderr[:500],
            "exit_code": run.get("code"),
            "wall_time_ms": run.get("wall_time"),
        })

    explanation = None
    if first_fail and passed < len(req.test_cases):
        ai_explanation = _ai_explain(
            req.code, req.language,
            first_fail["stderr"], first_fail["output"],
            first_fail["expected"], False
        )
        if not ai_explanation:
            ai_explanation = _fallback_explanation(
                req.code, req.language,
                first_fail["stderr"], first_fail["output"],
                first_fail["expected"], False
            )
        ai_explanation["youtube_videos"] = _get_youtube_videos("saida incorreta", req.language, req.code)
        explanation = ai_explanation

    return {
        "compile": {"ok": True, "stderr": (results[0].get("compile") or {}).get("stderr", "")},
        "tests": tests,
        "summary": {
            "passed": passed,
            "total": len(req.test_cases),
            "accepted": passed == len(req.test_cases),
        },
        "explanation": explanation,
    }


@router.post("/explain")
async def explain_error(req: SubmitRequest):
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Codigo vazio.")

    result = _run(req.language, req.code, "")
    compile_error = False
    error_text = ""

    if result.get("compile") and result["compile"].get("code") is not None and result["compile"].get("code") != 0:
        error_text = result["compile"].get("stderr", "")
        compile_error = True
    elif result.get("run"):
        error_text = (result.get("run") or {}).get("stderr", "")

    ai_explanation = _ai_explain(req.code, req.language, error_text, "", "", compile_error)
    if not ai_explanation:
        ai_explanation = _fallback_explanation(req.code, req.language, error_text, "", "", compile_error)
    ai_explanation["youtube_videos"] = _get_youtube_videos("erro", req.language, req.code)
    return ai_explanation


def _generate_new_exercise(topic: str, difficulty: int, language: str) -> dict:
    exercises_db = {
        "variaveis": [
            {"title": "Soma de Dois Numeros", "statement": "Leia dois inteiros A e B e imprima a soma A + B.",
             "inputFormat": "Dois inteiros A B", "outputFormat": "Um inteiro (A+B)",
             "test_cases": [{"input": "2 3", "expected": "5"}, {"input": "10 5", "expected": "15"}, {"input": "-1 1", "expected": "0"}]},
            {"title": "Troca de Valores", "statement": "Leia dois inteiros e troque seus valores.",
             "inputFormat": "Dois inteiros A B", "outputFormat": "Dois inteiros B A",
             "test_cases": [{"input": "3 7", "expected": "7 3"}, {"input": "100 200", "expected": "200 100"}]},
        ],
        "condicionais": [
            {"title": "Par ou Impar", "statement": "Leia um inteiro e diga se e par ou impar.",
             "inputFormat": "Um inteiro N", "outputFormat": "PAR ou IMPAR",
             "test_cases": [{"input": "4", "expected": "PAR"}, {"input": "7", "expected": "IMPAR"}]},
            {"title": "Maior de Tres", "statement": "Leia 3 numeros e mostre o maior.",
             "inputFormat": "Tres inteiros", "outputFormat": "O maior valor",
             "test_cases": [{"input": "3 7 5", "expected": "7"}, {"input": "10 2 8", "expected": "10"}]},
        ],
        "loops": [
            {"title": "Fatorial", "statement": "Leia N e calcule N!.",
             "inputFormat": "Um inteiro N", "outputFormat": "O valor de N!",
             "test_cases": [{"input": "5", "expected": "120"}, {"input": "0", "expected": "1"}]},
            {"title": "Fibonacci", "statement": "Leia N e imprima os N primeiros numeros de Fibonacci.",
             "inputFormat": "Um inteiro N", "outputFormat": "N numeros separados por espaco",
             "test_cases": [{"input": "5", "expected": "0 1 1 2 3"}, {"input": "1", "expected": "0"}]},
        ],
        "strings": [
            {"title": "Inverter String", "statement": "Leia uma string e imprima invertida.",
             "inputFormat": "Uma string S", "outputFormat": "A string invertida",
             "test_cases": [{"input": "hello", "expected": "olleh"}, {"input": "abc", "expected": "cba"}]},
        ],
        "arrays": [
            {"title": "Soma dos Elementos", "statement": "Leia N numeros e calcule a soma.",
             "inputFormat": "N seguido de N numeros", "outputFormat": "A soma total",
             "test_cases": [{"input": "3\n1 2 3", "expected": "6"}]},
        ],
        "estruturas_dados": [
            {"title": "Verificacao de Parenteses", "statement": "Verifique se uma expressao tem parenteses balanceados.",
             "inputFormat": "Uma string com expressao", "outputFormat": "SIM ou NAO",
             "test_cases": [{"input": "(a+b)", "expected": "SIM"}, {"input": "((a+b)", "expected": "NAO"}]},
        ],
        "recursao": [
            {"title": "Potencia Recursiva", "statement": "Calcule X^N usando recursao.",
             "inputFormat": "Dois inteiros X N", "outputFormat": "X^N",
             "test_cases": [{"input": "2 3", "expected": "8"}, {"input": "5 0", "expected": "1"}]},
        ],
    }

    topic_lower = topic.lower().replace(" ", "_").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    possible = exercises_db.get(topic_lower, exercises_db["variaveis"])
    import random
    ex = random.choice(possible)

    starter_codes = {
        "python": f"# {ex['title']}\n# {ex['statement']}\n\nvalores = input().split()\nA = int(valores[0])\nB = int(valores[1])\nprint(A + B)\n",
        "c": f"/* {ex['title']} */\n#include <stdio.h>\n\nint main() {{\n    int A, B;\n    scanf(\"%d %d\", &A, &B);\n    printf(\"%d\\n\", A + B);\n    return 0;\n}}\n",
        "cpp": f"// {ex['title']}\n#include <iostream>\nusing namespace std;\n\nint main() {{\n    int A, B;\n    cin >> A >> B;\n    cout << A + B << endl;\n    return 0;\n}}\n",
    }

    return {
        "id": f"custom_{topic_lower}",
        "title": ex["title"],
        "statement": ex["statement"],
        "topic": topic,
        "difficulty": difficulty,
        "inputFormat": ex["inputFormat"],
        "outputFormat": ex["outputFormat"],
        "test_cases": ex["test_cases"],
        "starter_code": starter_codes.get(language, starter_codes["python"]),
    }


@router.post("/generate-exercise")
def generate_exercise(req: ExerciseRequest):
    return _generate_new_exercise(req.topic, req.difficulty, req.language)


@router.get("/topics")
def get_topics():
    return {
        "topics": [
            {"id": "variaveis", "name": "Variaveis e Tipos"},
            {"id": "condicionais", "name": "Condicionais (if/else)"},
            {"id": "loops", "name": "Loops (for/while)"},
            {"id": "strings", "name": "Strings"},
            {"id": "arrays", "name": "Arrays/Listas"},
            {"id": "estruturas_dados", "name": "Estruturas de Dados"},
            {"id": "recursao", "name": "Recursao"},
        ]
    }
