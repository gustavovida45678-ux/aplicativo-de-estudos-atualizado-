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
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=502, detail=f"Falha ao acessar o servico de execucao: {e}"
        )
    try:
        return r.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Resposta invalida do servico de execucao.")


def _ai_explain(code: str, language: str, stderr: str, stdout: str, expected: str, compile_error: bool) -> Optional[dict]:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        logger.warning("OPENROUTER_API_KEY not set, skipping AI explanation")
        return None

    lang_name = {"c": "C", "cpp": "C++", "python": "Python"}.get(language, language)

    if compile_error:
        context = f"""O codigo {lang_name} do aluno tem ERRO DE COMPILACAO.

CODIGO DO ALUNO:
```{language}
{code}
```

ERRO DE COMPILACAO:
{stderr[:1500]}

Gere uma explicacao passo a passo em formato JSON com esta estrutura EXATA:
{{
  "error_type": "tipo do erro resumido",
  "analysis": "analise do que esta errado no codigo, apontando linhas especificas",
  "step_by_step": [
    {{"step": 1, "title": "Titulo do passo", "detail": "explicacao detalhada", "code_hint": "exemplo de codigo correto ou null"}}
  ],
  "suggestion": "dica final de como corrigir",
  "corrected_code": "codigo completo corrigido ou null"
}}

Seja DIRETO e DIDATICO. Aponte EXATAMENTE onde esta o erro linha por linha."""
    elif stdout and expected:
        context = f"""O codigo {lang_name} do aluno COMPILOU mas a SAIDA esta INCORRETA.

CODIGO DO ALUNO:
```{language}
{code}
```

SAIDA DO ALUNO:
{stdout[:500]}

SAIDA ESPERADA:
{expected[:500]}

Gere uma explicacao passo a passo em formato JSON com esta estrutura EXATA:
{{
  "error_type": "saida incorreta",
  "analysis": "analise de por que a saida nao bate com o esperado",
  "step_by_step": [
    {{"step": 1, "title": "Titulo do passo", "detail": "explicacao detalhada", "code_hint": "exemplo de codigo correto ou null"}}
  ],
  "suggestion": "dica final de como corrigir a saida",
  "corrected_code": "codigo completo corrigido ou null"
}}

Seja DIRETO e DIDATICO."""
    else:
        context = f"""O codigo {lang_name} do aluno falhou na execucao.

CODIGO DO ALUNO:
```{language}
{code}
```

ERRO:
{stderr[:1500]}

Gere uma explicacao passo a passo em formato JSON com esta estrutura EXATA:
{{
  "error_type": "tipo do erro",
  "analysis": "analise do erro",
  "step_by_step": [
    {{"step": 1, "title": "Titulo do passo", "detail": "explicacao detalhada", "code_hint": "exemplo de codigo correto ou null"}}
  ],
  "suggestion": "dica final",
  "corrected_code": "codigo completo corrigido ou null"
}}"""

    system_prompt = """Voce e um professor de programacao expert. Analise o codigo do aluno, identifique TODOS os erros e explique passo a passo como corrigir.

REGRAS:
- Responda APENAS com JSON valido (sem markdown, sem ```)
- Seja especifico: aponte linhas, variaveis, operadores errados
- Mostre o codigo CORRETO como hint em cada passo quando aplicavel
- Inclua o codigo corrigido completo no campo corrected_code
- Use portugues simples e direto"""

    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://aplicativo-de-estudos-atualizado.onrender.com",
                "X-Title": "StudyApp Judge",
            },
            json={
                "model": "anthropic/claude-3.5-haiku",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": context},
                ],
                "temperature": 0.3,
                "max_tokens": 2000,
            },
            timeout=30,
        )

        if resp.status_code != 200:
            logger.error(f"OpenRouter API error {resp.status_code}: {resp.text[:500]}")
            return None

        data = resp.json()
        raw = data["choices"][0]["message"]["content"].strip()
        logger.info(f"AI explanation response: {raw[:200]}")

        if raw.startswith("```"):
            raw = re.sub(r"^```\w*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)

        parsed = json.loads(raw)
        return parsed

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}\nRaw: {raw[:500] if 'raw' in dir() else 'N/A'}")
        return {
            "error_type": "explicacao gerada",
            "analysis": raw[:800] if 'raw' in dir() else "Nao foi possivel analisar",
            "step_by_step": [{"step": 1, "title": "Resposta da IA", "detail": raw[:800] if 'raw' in dir() else "Sem detalhes", "code_hint": None}],
            "suggestion": "Revise o codigo com base na analise acima.",
            "corrected_code": None,
        }
    except Exception as e:
        logger.error(f"AI explanation failed: {e}")
        return None


def _get_youtube_videos(error_type: str, language: str, code: str = "") -> list:
    videos = []

    if "compilacao" in error_type.lower() or "compile" in error_type.lower():
        videos.append({
            "title": f"Erros de compilacao em {language.upper()} - como resolver",
            "url": f"https://www.youtube.com/results?search_query=erros+compilacao+{language}+como+resolver",
        })
        if language in ("c", "cpp"):
            videos.append({
                "title": "GCC/Clang - erros comuns e como interpretar",
                "url": "https://www.youtube.com/results?search_query=gcc+clang+erros+comuns+c+compilacao",
            })
    elif "saida" in error_type.lower() or "output" in error_type.lower():
        videos.append({
            "title": f"{language.upper()} - saida incorreta debug",
            "url": f"https://www.youtube.com/results?search_query={language}+saida+incorreta+debug",
        })
    else:
        videos.append({
            "title": f"Debug em {language.upper()} - como encontrar erros",
            "url": f"https://www.youtube.com/results?search_query=debug+{language}+como+encontrar+erros",
        })

    videos.append({
        "title": f"Curso completo {language.upper()} - YouTube",
        "url": f"https://www.youtube.com/results?search_query=curso+completo+{language}+programacao",
    })

    return videos


def _fallback_explanation(code: str, language: str, stderr: str, stdout: str, expected: str, compile_error: bool) -> dict:
    if compile_error:
        err_line = re.search(r"(\d+):\d+", stderr)
        line_num = err_line.group(1) if err_line else "?"
        err_msg = stderr.split("\n")[0][:200] if stderr else "Erro desconhecido"
        return {
            "error_type": "Erro de compilacao",
            "analysis": f"Erro na linha {line_num}: {err_msg}",
            "step_by_step": [
                {"step": 1, "title": f"Erro detectado na linha {line_num}", "detail": err_msg, "code_hint": None},
                {"step": 2, "title": "Verifique a sintaxe", "detail": "Revise a linha indicada. Verifique: ponto-e-virgula, parenteses, chaves, tipo de variavel.", "code_hint": None},
                {"step": 3, "title": "Corrija e recompile", "detail": "Apos corrigir, compile novamente.", "code_hint": None},
            ],
            "suggestion": "Leia a mensagem de erro completa. O compilador sempre aponta a linha exata do problema.",
            "corrected_code": None,
        }
    elif stdout and expected:
        return {
            "error_type": "Saida incorreta",
            "analysis": f"O codigo executou mas gerou saida diferente do esperado.",
            "step_by_step": [
                {"step": 1, "title": "Sua saida", "detail": stdout[:300], "code_hint": None},
                {"step": 2, "title": "Saida esperada", "detail": expected[:300], "code_hint": None},
                {"step": 3, "title": "Compare e corrija", "detail": "Verifique formatacao, espacos, quebras de linha e logica.", "code_hint": None},
            ],
            "suggestion": "Use print() para debugar e comparar saida linha por linha.",
            "corrected_code": None,
        }
    else:
        return {
            "error_type": "Erro na execucao",
            "analysis": stderr[:300] if stderr else "Erro desconhecido",
            "step_by_step": [
                {"step": 1, "title": "Erro detectado", "detail": stderr[:300] if stderr else "Sem detalhes", "code_hint": None},
                {"step": 2, "title": "Revise o codigo", "detail": "Verifique logica, variaveis e operacoes.", "code_hint": None},
            ],
            "suggestion": "Adicione prints para debugar o fluxo de execucao.",
            "corrected_code": None,
        }


@router.post("/submit")
async def judge_submit(req: SubmitRequest):
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Codigo vazio.")
    if not req.test_cases:
        raise HTTPException(status_code=400, detail="Nenhum caso de teste enviado.")

    first_result = _run(req.language, req.code, req.test_cases[0].input)
    compile_ok = True
    compile_stderr = ""

    if first_result.get("compile") and first_result["compile"].get("code") is not None and first_result["compile"].get("code") != 0:
        compile_ok = False
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

    if not first_result.get("run"):
        stderr_val = (first_result.get("compile") or {}).get("stderr", "")
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
        expected = _normalize(tc.expected)
        ok = output == expected
        if ok:
            passed += 1
        elif first_fail is None:
            first_fail = {"stderr": stderr, "output": output, "expected": expected}
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
        error_label = "execucao"
        if first_fail["stderr"] and ("error" in first_fail["stderr"].lower() or "exception" in first_fail["stderr"].lower()):
            error_label = "runtime error"

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
        ai_explanation["youtube_videos"] = _get_youtube_videos(error_label, req.language, req.code)
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
    stderr = ""
    compile_stderr = ""
    compile_error = False

    if result.get("compile") and result["compile"].get("code") is not None and result["compile"].get("code") != 0:
        compile_stderr = result["compile"].get("stderr", "")
        compile_error = True

    if result.get("run"):
        stderr = (result.get("run") or {}).get("stderr", "")

    error_text = compile_stderr or stderr
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
            {"title": "Contar Vogais", "statement": "Conte quantas vogais uma string tem.",
             "inputFormat": "Uma string S", "outputFormat": "Quantidade de vogais",
             "test_cases": [{"input": "hello", "expected": "2"}, {"input": "aeiou", "expected": "5"}]},
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
