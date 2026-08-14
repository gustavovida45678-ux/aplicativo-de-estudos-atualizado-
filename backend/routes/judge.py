from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests
import json
import re
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/judge", tags=["judge"])


def _user_id_from_auth(authorization: Optional[str]) -> Optional[str]:
    """Extrai o user_id (email) do JWT do app, se presente. Nunca lanca erro."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        from utils.auth import decode_access_token
        return decode_access_token(authorization.replace("Bearer ", "", 1))
    except Exception:
        return None


def _save_submission(user_id, problem_id, language, code, status, result):
    """Salva a resolucao (com detalhes e explicacoes) no Supabase. Falha silenciosa."""
    if not user_id:
        return
    try:
        from utils.supabase import get_supabase_admin
        sb = get_supabase_admin()
        sb.table("judge_submissions").insert({
            "user_id": user_id,
            "problem_id": problem_id or "",
            "language": language,
            "code": code,
            "status": status,
            "result": result,
        }).execute()
    except Exception as e:
        logger.warning(f"Falha ao salvar submissao no Supabase: {e}")

PISTON_URL = "https://emkc.org/api/v2/piston/execute"
SANDBOX_URL = "https://api.sandboxapi.dev/v1/execute"
WANDBOX_URL = "https://wandbox.org/api/compile.json"

LANG_NAMES = {
    "c": {"piston": "c", "sandbox": "c", "wandbox": "gcc-13.2.0-c", "file": "main.c", "run_timeout": 5000},
    "cpp": {"piston": "c++", "sandbox": "cpp", "wandbox": "gcc-13.2.0", "file": "main.cpp", "run_timeout": 5000},
    "python": {"piston": "python", "sandbox": "python", "wandbox": "cpython-3.13.8", "file": "main.py", "run_timeout": 5000},
}

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = "anthropic/claude-haiku-4.5"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

# Provedores OpenAI-compatible usados pelo juiz (IA de explicacao/passo a passo).
# A chave personalizada (X-Custom-API-Key do frontend) tem prioridade.
AI_PROVIDERS = [
    {
        "name": "OpenRouter",
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "env": "OPENROUTER_API_KEY",
        "model": "openai/gpt-4.1-mini",
        "headers": {
            "HTTP-Referer": "https://aplicativo-de-estudos-atualizado.onrender.com",
            "X-Title": "StudyApp Judge",
        },
        "reasoning": False,
    },
    {
        "name": "Groq",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "env": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
        "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"],
        "headers": {},
    },
    {
        "name": "Gemini",
        "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "env": "GEMINI_API_KEY",
        "model": "gemini-2.0-flash",
        "headers": {},
    },
    {
        "name": "DeepSeek",
        "url": "https://api.deepseek.com/v1/chat/completions",
        "env": "DEEPSEEK_API_KEY",
        "model": "deepseek-chat",
        "headers": {},
    },
    {
        "name": "OpenAI",
        "url": "https://api.openai.com/v1/chat/completions",
        "env": "OPENAI_API_KEY",
        "model": "gpt-4o-mini",
        "headers": {},
    },
    {
        "name": "Emergent",
        "url": "https://integrations.emergentagent.com/llm/chat/completions",
        "env": "EMERGENT_API_KEY",
        "model": "gpt-4o-mini",
        "headers": {},
    },
]


# Dicionario Inteligente de Expressoes (pesquisa por expressao/objetivo)
try:
    from data.expression_dictionary import EXPRESSIONS, OBJECTIVES, PATTERNS
except ImportError:
    from backend.data.expression_dictionary import EXPRESSIONS, OBJECTIVES, PATTERNS

# Rotacao de chaves gratuitas (GROQ_API_KEY, GROQ_API_KEY_2, ...)
try:
    from services.providers import get_env_key_list
except ImportError:
    from backend.services.providers import get_env_key_list


# Regras pedagogicas do Juiz Virtual (Professor + Juiz + Dicionario).
# Exigem que a IA explique o PORQUE de cada expressao, nunca apenas o "o que".
PEDAGOGY_RULES = """REGRAS PEDAGOGICAS OBRIGATORIAS (Juiz Virtual de Programacao):
Voce e um PROFESSOR, nao apenas um corretor. Para cada expressao importante (funcoes, operadores, estruturas, variaveis) presente no codigo, explique:
1. O QUE E: definicao simples da expressao.
2. O QUE SIGNIFICA: significado dentro da linguagem.
3. PARA QUE SERVE: finalidade geral.
4. POR QUE FOI UTILIZADA AQUI: qual problema daquele exercicio especifico ela resolve (a parte MAIS importante).
5. O QUE ACONTECERIA SE FOSSE REMOVIDA: erro ou mudanca de comportamento.
6. ALTERNATIVAS: outras formas de fazer o mesmo (e quando nao usar).
7. QUANDO USAR NOVAMENTE: regra pratica para reconhecer situacoes semelhantes.
8. COMO IDENTIFICAR NO ENUNCIADO: palavras do problema que indicam a necessidade dela.
NUNCA explique apenas sintaxe ("for e um loop"). Sempre responda "POR QUE essa expressao esta aqui neste exercicio".
No final, para cada expressao, use o formato:
EXPRESSAO: <nome>
POR QUE: <uso no exercicio>
SEM ELA: <o que aconteceria>
QUANDO USAR: <regra pratica>
COMO IDENTIFICAR: <palavras do enunciado>
ALTERNATIVAS: <opcoes>"""


JUDGE_VIRTUAL_RULES = """Voce e um JUIZ VIRTUAL DE PROGRAMACAO PARA INICIANTES.

Sua funcao e verificar se o codigo do aluno realmente resolve o exercicio.

REGRA PRINCIPAL
- Compare sempre: O QUE O EXERCICIO PEDE x O QUE O CODIGO FAZ.
- Nao considere correto apenas porque o codigo compila.

VERIFIQUE
1. O codigo le os dados pedidos?
2. Usa os dados corretamente?
3. Faz exatamente o calculo ou processamento pedido?
4. Mostra exatamente o que o exercicio pede?
5. Todos os itens do exercicio foram resolvidos?

ATENCAO - nao confunda:
- MOSTRAR valores com CONTAR valores.
- CALCULAR media com CONTAR valores acima da media.
- MOSTRAR numeros com GUARDAR numeros.
- Exemplo: se o exercicio pede "Mostre os numeros maiores que a media" e o aluno apenas incrementa um contador quando v[i] > media, isso esta PARCIALMENTE CORRETO: ele contou os numeros, mas nao mostrou quais sao.

SE O EXERCICIO TIVER ITENS a), b), c)
- Verifique cada item separadamente. Nao diga que esta correto se um dos itens estiver errado.

CLASSIFICACAO (use somente):
- CORRETO: tudo esta certo.
- PARCIALMENTE CORRETO: uma parte esta certa, mas falta alguma coisa.
- INCORRETO: existe um erro importante na logica.
- NAO COMPILA: o codigo possui erro que impede a compilacao.

FORMATO DA RESPOSTA (no campo verdict_detail):
- Se estiver correto:
  VEREDITO: CORRETO
  (explique em 1 ou 2 frases por que esta correto)
- Se estiver errado:
  VEREDITO: PARCIALMENTE CORRETO ou INCORRETO
  O que esta certo: explique rapidamente.
  O que esta errado: explique exatamente o problema.
  Como corrigir: mostre a alteracao de forma simples.

REGRA IMPORTANTE
- Se o exercicio pede uma coisa e o codigo faz outra, NAO diga que esta correto.
- Nao invente requisitos que nao aparecem no exercicio.
- Se uma solucao simples resolve o problema, prefira explicar a solucao simples.
- O objetivo e ser um Juiz Virtual claro, simples e educativo, ajudando o aluno a entender o erro sem complicar a explicacao."""


class TestCase(BaseModel):
    input: str
    expected: str


class SubmitRequest(BaseModel):
    language: str
    code: str
    test_cases: List[TestCase] = []
    problem_id: str = ""


class ExerciseRequest(BaseModel):
    topic: str
    difficulty: int = 1
    language: str = "python"


class WalkthroughRequest(BaseModel):
    language: str
    code: str
    test_cases: List[TestCase] = []
    input: str = ""
    statement: str = ""
    expected: str = ""


def _is_template(code: str, language: str) -> bool:
    low = code.lower()
    markers = ["seu codigo aqui", "seu código aqui", "seu codigo", "seu código", "your code here", "// seu"]
    for m in markers:
        if m in low:
            return True
    lines = [l.strip() for l in code.split("\n") if l.strip()]
    if language == "python" and lines and all(l.startswith("#") or l.startswith("'") or l.startswith('"') for l in lines):
        return True
    if language in ("c", "cpp") and len(lines) <= 4:
        body = [l for l in lines if l not in ("{", "}") and "return 0" not in l and "#include" not in l and "using" not in l and "main" not in l and not l.startswith("int main") and not l.startswith("//") and not l.startswith("/*")]
        if not body:
            return True
    return False


def _normalize(out: str) -> str:
    lines = (out or "").replace("\r\n", "\n").replace("\r", "\n").split("\n")
    while lines and lines[-1].strip() == "":
        lines.pop()
    return "\n".join(l.rstrip() for l in lines)


def _safe_eval(expr: str, variables: dict):
    import ast
    allowed = (ast.Expression, ast.BinOp, ast.UnaryOp, ast.Constant, ast.Name,
               ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Mod, ast.USub,
               ast.Compare, ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE,
               ast.BoolOp, ast.And, ast.Or, ast.Not, ast.Load, ast.Store, ast.Del)
    try:
        tree = ast.parse(expr, mode="eval")
        for node in ast.walk(tree):
            if not isinstance(node, allowed):
                return None
        return eval(compile(tree, "<expr>", "eval"), {"__builtins__": {}}, dict(variables))
    except Exception:
        return None


def _local_walkthrough(code: str, language: str, stdin: str) -> list:
    lines = code.split("\n")
    steps = []
    variables = {}
    output = ""
    tokens = (stdin or "").split()
    ti = 0
    lang = language.lower()

    def read_token():
        nonlocal ti
        if ti >= len(tokens):
            return None
        val = tokens[ti]
        ti += 1
        return val

    def to_value(tok):
        try:
            return int(tok)
        except (TypeError, ValueError):
            try:
                return float(tok)
            except (TypeError, ValueError):
                return tok

    for idx, raw in enumerate(lines, 1):
        line = raw.strip()
        if not line or line.startswith("//") or line.startswith("#") or line.startswith("*"):
            continue
        explanation = None

        try:
            if lang in ("c", "cpp"):
                decl_m = re.match(r'^(?:unsigned\s+|long\s+|short\s+)?(int|float|double|char)\s+(.+?);', line)
                if decl_m and "scanf" not in line and "printf" not in line and "main" not in line:
                    type_name = decl_m.group(1)
                    default = 0.0 if type_name in ("float", "double") else 0
                    new_vars = []
                    for n in decl_m.group(2).split(","):
                        var = n.strip().split()[0]
                        if re.match(r'^[a-zA-Z_]\w*$', var) and var not in variables:
                            variables[var] = default
                            new_vars.append(var)
                    if new_vars:
                        explanation = f"Declara a variavel {type_name}: {', '.join(new_vars)} (valor inicial {default})."

                scanf_m = re.search(r'scanf\s*\(\s*"([^"]*)",\s*([^)]*)\)', line)
                if scanf_m:
                    specs = re.findall(r'%(\w)', scanf_m.group(1))
                    args = re.findall(r'&([a-zA-Z_]\w*)', scanf_m.group(2))
                    descs = []
                    for spec, arg in zip(specs, args):
                        tok = read_token()
                        if tok is None:
                            break
                        val = to_value(tok)
                        variables[arg] = val
                        descs.append(f"{arg} = {val}")
                    if descs:
                        explanation = "Le da entrada padrão: " + "; ".join(descs) + "."

                cin_m = re.search(r'cin\s*>>(.*?);', line)
                if cin_m:
                    names = [n.strip() for n in cin_m.group(1).split(">>") if n.strip()]
                    descs = []
                    for name in names:
                        tok = read_token()
                        if tok is None:
                            break
                        variables[name] = to_value(tok)
                        descs.append(f"{name} = {variables[name]}")
                    if descs:
                        explanation = "Le da entrada padrão: " + "; ".join(descs) + "."

                printf_m = re.search(r'printf\s*\(\s*"([^"]*)"\s*(?:,\s*([^)]*))?\)', line)
                if printf_m:
                    fmt = printf_m.group(1)
                    args = [a.strip() for a in (printf_m.group(2) or "").split(",") if a.strip()]
                    parts = re.split(r'(%[a-zA-Z])', fmt)
                    out_piece = ""
                    ai = 0
                    for part in parts:
                        if re.match(r'^%[a-zA-Z]$', part):
                            if ai < len(args):
                                val = _safe_eval(args[ai], variables)
                                out_piece += str(val if val is not None else "?")
                            ai += 1
                        else:
                            out_piece += part.replace("\\n", "\n").replace("\\t", "\t")
                    output += out_piece
                    explanation = "Imprime na saida: " + repr(out_piece) + "."

                cout_m = re.search(r'cout\s*<<\s*(.*?);', line)
                if cout_m:
                    parts = [p.strip() for p in cout_m.group(1).split("<<") if p.strip()]
                    out_piece = ""
                    for p in parts:
                        if p.startswith('"') and p.endswith('"'):
                            out_piece += p.strip('"').replace("\\n", "\n").replace("\\t", "\t")
                        elif p == "endl":
                            out_piece += "\n"
                        else:
                            val = _safe_eval(p, variables)
                            out_piece += str(val if val is not None else "?")
                    output += out_piece
                    explanation = "Imprime na saida: " + repr(out_piece) + "."

                assign_m = re.match(r'^\s*([a-zA-Z_]\w*)\s*=\s*(.+?);', line)
                if assign_m and not re.match(r'^\s*(if|for|while|else)\b', line):
                    name, expr = assign_m.group(1), assign_m.group(2)
                    val = _safe_eval(expr, variables)
                    if val is not None:
                        variables[name] = val
                        explanation = f"Atribui a {name} o valor de {expr} = {val}."

                if re.match(r'^\s*return\b', line):
                    explanation = "Encerra a funcao main. O programa terminou."

                if re.match(r'^\s*(if|for|while|else)\b', line):
                    cond_m = re.search(r'\((.*?)\)', line)
                    if cond_m:
                        val = _safe_eval(cond_m.group(1), variables)
                        verdict = "verdadeira" if val else "falsa"
                        explanation = f"Verifica a condicao {cond_m.group(1)} -> {verdict}."

            elif lang == "python":
                if re.match(r'^\s*(if|elif|else|for|while|def|import|return)\b', line):
                    cond_m = re.search(r'\((.*?)\)', line) or re.search(r'^(\w+)\s+(.+?):\s*$', line)
                    if cond_m and re.match(r'^\s*(if|elif|while)\b', line):
                        val = _safe_eval(cond_m.group(1), variables)
                        verdict = "verdadeira" if val else "falsa"
                        explanation = f"Verifica a condicao {cond_m.group(1)} -> {verdict}."
                    elif re.match(r'^\s*return\b', line):
                        explanation = "Encerra a funcao e devolve o resultado."
                    elif re.match(r'^\s*for\b', line):
                        explanation = "Inicia um laco: repete o bloco abaixo para cada item."
                    elif re.match(r'^\s*while\b', line):
                        explanation = "Inicia um laco: repete enquanto a condicao for verdadeira."
                    elif re.match(r'^\s*else\b', line):
                        explanation = "Bloco executado quando a condicao anterior e falsa."
                    elif re.match(r'^\s*(def|import)\b', line):
                        explanation = "Define uma funcao (ou importa um modulo)."

                assign_m = re.match(r'^([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*=\s*(.+)$', line)
                if assign_m and "==" not in line and not re.match(r'^\s*(if|elif|for|while|else|def|import)\b', line):
                    names = [n.strip() for n in assign_m.group(1).split(",")]
                    rhs = assign_m.group(2)
                    if "input()" in rhs:
                        descs = []
                        for name in names:
                            tok = read_token()
                            if tok is None:
                                break
                            variables[name] = to_value(tok)
                            descs.append(f"{name} = {variables[name]}")
                        if descs:
                            explanation = "Le da entrada padrão: " + "; ".join(descs) + "."
                    else:
                        val = _safe_eval(rhs, variables)
                        if val is not None and len(names) == 1:
                            variables[names[0]] = val
                            explanation = f"Atribui a {names[0]} o valor de {rhs} = {val}."

                print_m = re.match(r'^\s*print\s*\((.*)\)\s*$', line)
                if print_m:
                    args = [a.strip() for a in print_m.group(1).split(",")]
                    vals = []
                    for a in args:
                        if a.startswith('"') and a.endswith('"'):
                            vals.append(a.strip('"'))
                        else:
                            val = _safe_eval(a, variables)
                            vals.append(str(val if val is not None else "?"))
                    out_piece = " ".join(vals)
                    output += out_piece + "\n"
                    explanation = "Imprime na saida: " + repr(out_piece) + "."
        except Exception as e:
            logger.warning(f"Walkthrough local error na linha {idx}: {e}")
            explanation = explanation or f"Executa a linha {idx}."

        if explanation:
            details = []
            for name, val in variables.items():
                if isinstance(val, float):
                    vtype = "float/double (numero decimal)"
                elif isinstance(val, int):
                    vtype = "int (numero inteiro)"
                elif isinstance(val, bool):
                    vtype = "bool (verdadeiro/falso)"
                else:
                    vtype = "texto/string"
                details.append({
                    "name": name,
                    "type": vtype,
                    "purpose": f"Guarda o valor {val} para ser usado nas proximas linhas do programa.",
                    "why": f"Precisa de uma variavel para armazenar esse valor em memoria; se nao guardasse, o valor seria perdido.",
                    "used_in": "Usado nos calculos e nas impressoes que vem a seguir.",
                })
            steps.append({
                "line": idx,
                "code": raw,
                "explanation": explanation,
                "variables": dict(variables),
                "variable_details": details,
                "output": output,
            })

    if not steps:
        steps.append({
            "line": 1,
            "code": lines[0] if lines else "",
            "explanation": "Codigo sem linhas executaveis identificadas.",
            "variables": {},
            "output": "",
        })
    return steps


def _salvage_json(raw: str):
    """Recupera JSON truncado: corta no ultimo ']' ou '}' e tenta parsear (perde passos incompletos do final)."""
    if not raw:
        return None
    for i in range(len(raw) - 1, -1, -1):
        if raw[i] in "}]":
            try:
                return _json_lenient(raw[:i + 1])
            except json.JSONDecodeError:
                continue
    return None


def _split_json_objects(text):
    """Divide multiplos objetos JSON concatenados (IA responde N exercicios de uma vez)
    e devolve o mais completo (mais casos de teste; empate -> ultimo)."""
    candidates = []
    i = 0
    n = len(text)
    while True:
        s = text.find("{", i)
        if s == -1:
            break
        depth = 0
        in_str = False
        esc = False
        j = s
        while j < n:
            ch = text[j]
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
            else:
                if ch == '"':
                    in_str = True
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        try:
                            d = json.loads(text[s : j + 1])
                            if isinstance(d, dict):
                                candidates.append(d)
                        except json.JSONDecodeError:
                            pass
                        break
            j += 1
        i = j + 1
    if not candidates:
        return None
    best = None
    best_tc = -1
    for d in candidates:
        if not (d.get("statement") or d.get("solution")):
            continue
        tc = len(d.get("test_cases") or [])
        if tc >= best_tc:
            best = d
            best_tc = tc
    return best


def _json_lenient(raw):
    """Parse de JSON gerado por IA, tolerante a:
    1) quebras de linha CRUAS dentro de strings (control chars invalidos
       que a IA insere e fazem json.loads falhar -> caia no banco de dados);
    2) aspas NAO escapadas dentro do campo "solution" (codigo C com
       printf/scanf(\"...\") que a IA deixa cruas);
    3) lixo/markdown em volta;
    4) truncamento (corta do primeiro { ate o ultimo })."""
    if not raw:
        return None
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```\w*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)

    # 0) Aspas-triplas (""" ... """) que a IA usa como delimitador de string
    #    (codigo/explicacao com quebras de linha): vira string JSON normal.
    parts = text.split('"""')
    if len(parts) > 1:
        rebuilt = []
        for i, p in enumerate(parts):
            if i % 2 == 1:
                # bloco """ ... """: vira string JSON normal (repor as aspas)
                out = []
                esc = False
                for ch in p:
                    if esc:
                        out.append(ch)
                        esc = False
                        continue
                    if ch == "\\":
                        out.append(ch)
                        esc = True
                        continue
                    if ch == '"':
                        out.append('\\"')
                        continue
                    if ord(ch) < 0x20:
                        out.append(json.dumps(ch)[1:-1])
                        continue
                    out.append(ch)
                if esc:
                    out.append("\\\\")
                rebuilt.append('"' + "".join(out) + '"')
            else:
                rebuilt.append(p)
        text = "".join(rebuilt)

    # Reparo do campo "solution" (codigo-fonte, unico que contem aspas)
    sol_key = '"solution":'
    ki = text.find(sol_key)
    if ki != -1:
        vs = text.find('"', ki + len(sol_key))
        if vs != -1:
            # fim do valor: aspas + separador + campo "explanation"
            m_end = re.search(r'",\s*"explanation"', text[vs + 1:])
            if m_end:
                raw_sol = text[vs + 1 : vs + 1 + m_end.start()]
                if raw_sol.count('"') > 2:
                    fixed = []
                    esc = False
                    for ch in raw_sol:
                        if esc:
                            fixed.append(ch)
                            esc = False
                            continue
                        if ch == "\\":
                            fixed.append(ch)
                            esc = True
                            continue
                        if ch == '"':
                            fixed.append('\\"')
                            continue
                        if ord(ch) < 0x20:
                            fixed.append(json.dumps(ch)[1:-1])
                            continue
                        fixed.append(ch)
                    if esc:
                        fixed.append("\\\\")
                    text = text[:vs + 1] + "".join(fixed) + text[vs + 1 + m_end.start():]

    # Escapa control chars que aparecerem DENTRO de strings JSON
    out = []
    in_str = False
    esc = False
    for ch in text:
        if in_str:
            if esc:
                out.append(ch)
                esc = False
                continue
            if ch == "\\":
                out.append(ch)
                esc = True
                continue
            if ch == '"':
                in_str = False
            elif ord(ch) < 0x20:
                out.append(json.dumps(ch)[1:-1])
                continue
            out.append(ch)
        else:
            if ch == '"':
                in_str = True
            out.append(ch)
    text = "".join(out)

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        if "Extra data" in str(e):
            # Multiplos objetos concatenados (IA respondeu N exercicios de uma vez)
            best = _split_json_objects(text)
            if best is not None:
                return best
        pass
    # Truncamento: corta do primeiro { ate o ultimo }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


def _walkthrough_ai(code: str, language: str, stdin: str, statement: str = "", expected: str = "", is_template: bool = False, custom_key: Optional[str] = None, compile_error: Optional[str] = None):
    lang_name = {"c": "C", "cpp": "C++", "python": "Python"}.get(language, language)
    if is_template:
        system_prompt = f"""Voce e um professor de {lang_name} muito didatico. O aluno enviou um CODIGO VAZIO (apenas o esqueleto com '// seu codigo aqui').

Sua tarefa: PREENCHER AUTOMATICAMENTE a solucao completa do problema abaixo e simular a execucao dela passo a passo, linha por linha, com os valores concretos da ENTRADA do teste.

{PEDAGOGY_RULES}

Responda APENAS com JSON (sem markdown, sem ```), com esta estrutura exata:
{{
  "template": true,
  "corrected_code": "codigo completo corrigido em {lang_name} que resolve o problema",
  "steps": [
    {{"line": 1, "code": "texto exato da linha do corrected_code", "explanation": "explicacao didatica em portugues do que esta linha faz, com valores concretos", "variables": {{"A": 2}}, "variable_details": [{{"name": "A", "type": "int", "purpose": "para que serve essa variavel no programa", "why": "por que foi usado esse tipo e esse nome", "used_in": "onde essa variavel e usada (linhas/frases)"}}], "expressions": [{{"expression": "input()", "why": "por que foi usada nesta linha deste exercicio", "what_if_removed": "o que aconteceria sem ela", "when_to_use": "regra pratica", "alternatives": "outras formas"}}], "output": "saida acumulada ate aqui"}}
  ]
}}

REGRAS:
- Primeiro passo: explique que o codigo enviado estava vazio e que a solucao foi preenchida automaticamente
- Depois, simule CADA linha da solucao preenchida usando os valores reais da entrada
- `line` deve corresponder a linha correspondente dentro do corrected_code (1-based)
- Preencha `variable_details` e `expressions` apenas nos passos mais importantes (declaracao de variaveis, leitura, calculo, impressao) - sem repeticao nos demais passos
- Seja MUITO didatico, como aula particular para alguem que nunca programou
- No maximo 8 passos"""
    elif compile_error:
        system_prompt = f"""Voce e um professor de {lang_name} muito didatico. O codigo do aluno NAO COMPILOU.

Erro de compilacao reportado:
{compile_error[:800]}

Sua tarefa: CORRIGIR o codigo do aluno (apenas o necessario para compilar e resolver o problema) e simular a execucao do CODIGO CORRIGIDO passo a passo, linha por linha, com os valores concretos da ENTRADA do teste.

{PEDAGOGY_RULES}

Responda APENAS com JSON (sem markdown, sem ```), com esta estrutura exata:
{{
  "corrected_code": "codigo completo corrigido em {lang_name} que compila e resolve o problema",
  "steps": [
    {{"line": 1, "code": "texto exato da linha do corrected_code", "explanation": "explicacao didatica em portugues do que esta linha faz, com valores concretos", "variables": {{"A": 2}}, "variable_details": [{{"name": "A", "type": "int", "purpose": "para que serve essa variavel no programa", "why": "por que foi usado esse tipo e esse nome", "used_in": "onde essa variavel e usada (linhas/frases)"}}], "expressions": [{{"expression": "input()", "why": "por que foi usada nesta linha deste exercicio", "what_if_removed": "o que aconteceria sem ela", "when_to_use": "regra pratica", "alternatives": "outras formas"}}], "output": "saida acumulada ate aqui"}}
  ]
}}

REGRAS:
- Primeiro passo: explique de forma resumida qual era o erro de compilacao e o que foi corrigido (sem lengalenga, 1-2 frases)
- Depois, simule CADA linha do CODIGO CORRIGIDO usando os valores reais da entrada
- `line` deve corresponder a linha correspondente dentro do corrected_code (1-based)
- Preencha `variable_details` e `expressions` apenas nos passos mais importantes (declaracao de variaveis, leitura, calculo, impressao) - sem repeticao
- Seja MUITO didatico, como aula particular para alguem que nunca programou
- No maximo 8 passos"""
    else:
        system_prompt = f"""Voce e um JUIZ VIRTUAL DE PROGRAMACAO especializado em {lang_name} e algoritmos basicos, e tambem um professor MUITO didatico.

Antes de simular, AVALIE o codigo do aluno com maxima precisao, comparando-o diretamente com o enunciado do exercicio.

{JUDGE_VIRTUAL_RULES}

Depois de avaliar, simule a execucao do codigo passo a passo, linha por linha, como se o aluno nunca tivesse programado.

{PEDAGOGY_RULES}

Dado o CODIGO e a ENTRADA, simule a execucao e gere um passo para CADA linha executada (declarar variaveis, ler da entrada, calcular, imprimir, fechar chaves quando encerrar). Pule linhas vazias e comentarios. NUNCA invente linhas que nao existem no codigo.

Responda APENAS com JSON (sem markdown, sem ```), com esta estrutura exata:
{{
  "verdict": "CORRETO | PARCIALMENTE CORRETO | INCORRETO | NAO COMPILA",
  "verdict_detail": "avaliacao no formato do JUIZ VIRTUAL PARA INICIANTES (correto: 1-2 frases explicando por que; errado: O QUE ESTA CERTO, O QUE ESTA ERRADO e COMO CORRIGIR)",
  "steps": [
    {{"line": numero da linha (1-based), "code": "texto exato da linha", "explanation": "explicacao didatica detalhada em portugues do que esta linha faz, com os valores concretos", "variables": {{"A": 2, "B": 3}}, "variable_details": [{{"name": "A", "type": "int", "purpose": "para que serve essa variavel", "why": "por que foi usado esse tipo e por que ela existe", "used_in": "onde e usada nas proximas linhas"}}], "expressions": [{{"expression": "input()", "why": "por que foi usada nesta linha", "what_if_removed": "o que aconteceria sem ela", "when_to_use": "quando usar novamente", "alternatives": "alternativas possiveis"}}], "output": "saida acumulada ate este passo"}}
  ]
}}

REGRAS:
- O veredito deve refletir as VERIFICACOES do JUIZ VIRTUAL (leitura dos dados, uso correto, processamento exato, saida exata e todos os itens resolvidos)
- Nao confunda mostrar valores com contar valores, nem calcular media com contar acima da media
- Use os valores REAIS da execucao (ex: A=2, B=3, soma=5)
- Cada passo deve referenciar uma linha que REALMENTE existe no codigo fornecido
- Preencha `variable_details` apenas nos passos de declaracao/leitura/calculo/impressao de variaveis, e `expressions` apenas para as expressoes mais importantes - sem repeticao nos demais passos
- Quando a linha imprimir, mostre em output a saida acumulada usando \\n
- Seja MUITO didatico, como aula particular
- No maximo 8 passos"""

    context_parts = [f"LINGUAGEM: {lang_name}"]
    if statement:
        context_parts.append(f"ENUNCIADO DO PROBLEMA:\n{statement}")
    if expected:
        context_parts.append(f"SAIDA ESPERADA DO TESTE:\n{expected}")
    context_parts.append(f"ENTRADA DO TESTE:\n{stdin or '(vazia)'}")
    context_parts.append(f"CODIGO:\n```{language}\n{code}\n```")
    context = "\n\n".join(context_parts)

    raw = _call_ai(system_prompt, context, custom_key, max_tokens=3000)
    if not raw:
        return None, None, None
    try:
        cleaned = re.sub(r"^```\w*\n?", "", raw.strip())
        cleaned = re.sub(r"\n?```$", "", cleaned)
        data = _json_lenient(cleaned)
        corrected_code = None
        verdict = None
        if isinstance(data, dict):
            corrected_code = data.get("corrected_code") or data.get("template_code")
            verdict = {"class": str(data.get("verdict") or ""), "detail": str(data.get("verdict_detail") or "")}
            if not verdict["class"]:
                verdict = None
            data = data.get("steps") or data.get("step_by_step") or []
        if not isinstance(data, list) or not data:
            return None, corrected_code, verdict
        steps = []
        for i, s in enumerate(data):
            if not isinstance(s, dict):
                continue
            var_details = s.get("variable_details") or s.get("variables_usage") or []
            if isinstance(var_details, dict):
                var_details = [
                    {"name": k, "purpose": v.get("purpose") if isinstance(v, dict) else "", "why": v.get("why") if isinstance(v, dict) else "", "used_in": v.get("used_in") if isinstance(v, dict) else ""}
                    for k, v in var_details.items()
                ]
            steps.append({
                "line": int(s.get("line") or i + 1),
                "code": s.get("code") or "",
                "explanation": s.get("explanation") or s.get("detail") or "",
                "variables": s.get("variables") or {},
                "variable_details": var_details if isinstance(var_details, list) else [],
                "expressions": s.get("expressions") if isinstance(s.get("expressions"), list) else [],
                "output": s.get("output") or "",
            })
        return (steps if steps else None), corrected_code, verdict
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        logger.error(f"Falha ao parsear walkthrough da IA: {e}: {raw[:300]}")
        salvaged = _salvage_json(cleaned)
        if salvaged is not None:
            logger.info("JSON truncado recuperado parcialmente")
            corrected_code = None
            if isinstance(salvaged, dict):
                corrected_code = salvaged.get("corrected_code") or salvaged.get("template_code")
                salvaged = salvaged.get("steps") or salvaged.get("step_by_step") or []
            if isinstance(salvaged, list) and salvaged:
                steps = []
                for i, s in enumerate(salvaged):
                    if not isinstance(s, dict):
                        continue
                    steps.append({
                        "line": int(s.get("line") or i + 1),
                        "code": s.get("code") or "",
                        "explanation": s.get("explanation") or s.get("detail") or "",
                        "variables": s.get("variables") or {},
                        "variable_details": s.get("variable_details") if isinstance(s.get("variable_details"), list) else [],
                        "expressions": s.get("expressions") if isinstance(s.get("expressions"), list) else [],
                        "output": s.get("output") or "",
                    })
                if steps:
                    return steps, corrected_code, verdict
        return None, None, verdict


def _run_wandbox(conf: dict, code: str, stdin: str):
    try:
        payload = {
            "compiler": conf["wandbox"],
            "code": code,
            "stdin": stdin or "",
            "save": False,
        }
        r = requests.post(WANDBOX_URL, json=payload, timeout=30)
        if r.status_code != 200:
            logger.warning(f"Wandbox HTTP {r.status_code}: {r.text[:200]}")
            return None
        data = r.json()
        status = str(data.get("status", "0"))
        if status == "0":
            return {
                "compile": {"code": 0, "stderr": ""},
                "run": {
                    "stdout": data.get("program_output", "") or "",
                    "stderr": data.get("program_error", "") or "",
                    "code": 0,
                },
            }
        if status == "1":
            compile_stderr = (data.get("compiler_error", "") or "") or (data.get("program_error", "") or "")
            return {
                "compile": {"code": 1, "stderr": compile_stderr},
                "run": {"stdout": data.get("program_output", "") or "", "stderr": "", "code": 1},
            }
        exit_code = int(status) if status.isdigit() else 1
        return {
            "compile": {"code": 0, "stderr": ""},
            "run": {
                "stdout": data.get("program_output", "") or "",
                "stderr": (data.get("program_error", "") or "") or (data.get("program_message", "") or ""),
                "code": exit_code,
            },
        }
    except Exception as e:
        logger.warning(f"Wandbox failed: {e}, trying next execution service...")
        return None


def _run_sandbox(conf: dict, code: str, stdin: str):
    if not os.environ.get("SANDBOX_API_KEY"):
        return None
    try:
        sandbox_payload = {
            "language": conf["sandbox"],
            "stdin": stdin or "",
            "files": [{"name": conf["file"], "content": code}],
        }
        headers = {"X-RapidAPI-Proxy-Secret": os.environ["SANDBOX_API_KEY"]}
        r = requests.post(SANDBOX_URL, json=sandbox_payload, headers=headers, timeout=30)
        if r.status_code != 200:
            logger.warning(f"SandboxAPI HTTP {r.status_code}")
            return None
        data = r.json()
        run_result = data.get("run", {})
        compile_result = data.get("compile", {})
        stdout_val = run_result.get("stdout", "") or ""
        stderr_val = (run_result.get("stderr", "") or "") + (compile_result.get("stderr", "") or "")
        exit_code = run_result.get("code", compile_result.get("code", 0))
        return {
            "compile": {"code": compile_result.get("code", 0), "stderr": compile_result.get("stderr", "")},
            "run": {"stdout": stdout_val, "stderr": stderr_val, "code": exit_code},
        }
    except Exception as e:
        logger.warning(f"SandboxAPI failed: {e}, trying Piston...")
        return None


def _run_local(conf: dict, code: str, stdin: str):
    """Executa o codigo localmente no servidor (fallback quando os
    servicos externos de execucao estao indisponiveis: Piston virou
    whitelist-only e o Wandbox pode falhar). Usa gcc/g++ se existirem
    e python3 (sempre presente, pois o backend roda em Python)."""
    import shutil as _shutil
    import subprocess as _sp
    import tempfile as _tf

    lang = conf.get("sandbox") or conf.get("piston")
    run_timeout = conf.get("run_timeout", 5000) / 1000.0
    stdin_bytes = (stdin or "").encode("utf-8", "replace")
    try:
        if lang == "python":
            py = _shutil.which("python3") or _shutil.which("python")
            if not py:
                return None
            src = None
            try:
                with _tf.NamedTemporaryFile(suffix=".py", delete=False) as f:
                    f.write(code.encode("utf-8", "replace"))
                    src = f.name
                try:
                    rp = _sp.run([py, src], input=stdin_bytes, capture_output=True, timeout=run_timeout)
                except _sp.TimeoutExpired:
                    return {"compile": {"code": 0, "stderr": ""}, "run": {"stdout": "", "stderr": "Tempo limite excedido", "code": 124}}
                return {
                    "compile": {"code": 0, "stderr": ""},
                    "run": {"stdout": rp.stdout.decode("utf-8", "replace"), "stderr": rp.stderr.decode("utf-8", "replace"), "code": rp.returncode},
                }
            finally:
                if src:
                    try:
                        os.remove(src)
                    except Exception:
                        pass
        elif lang in ("c", "cpp"):
            cc = _shutil.which("gcc") if lang == "c" else (_shutil.which("g++") or _shutil.which("c++"))
            if not cc:
                return None
            with _tf.TemporaryDirectory() as d:
                src = os.path.join(d, "main.c" if lang == "c" else "main.cpp")
                exe = os.path.join(d, "main")
                with open(src, "w", encoding="utf-8") as f:
                    f.write(code)
                try:
                    cp = _sp.run([cc, src, "-o", exe, "-O2", "-lm"], capture_output=True, timeout=20)
                except _sp.TimeoutExpired:
                    return {"compile": {"code": 1, "stderr": "Tempo de compilacao excedido"}, "run": {"stdout": "", "stderr": "", "code": 1}}
                if cp.returncode != 0:
                    return {"compile": {"code": cp.returncode, "stderr": cp.stderr.decode("utf-8", "replace")[:2000]}, "run": {"stdout": "", "stderr": "", "code": 1}}
                try:
                    rp = _sp.run([exe], input=stdin_bytes, capture_output=True, timeout=run_timeout)
                except _sp.TimeoutExpired:
                    return {"compile": {"code": 0, "stderr": ""}, "run": {"stdout": "", "stderr": "Tempo limite excedido", "code": 124}}
                return {
                    "compile": {"code": 0, "stderr": ""},
                    "run": {"stdout": rp.stdout.decode("utf-8", "replace"), "stderr": rp.stderr.decode("utf-8", "replace"), "code": rp.returncode},
                }
    except Exception as e:
        logger.warning(f"Execucao local falhou: {e}")
        return None
    return None


def _run_piston(conf: dict, code: str, stdin: str):
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


def _run(lang: str, code: str, stdin: str) -> dict:
    conf = LANG_NAMES.get(lang)
    if not conf:
        raise HTTPException(status_code=400, detail="Linguagem nao suportada.")

    result = _run_wandbox(conf, code, stdin)
    if result:
        return result

    result = _run_sandbox(conf, code, stdin)
    if result:
        return result

    # Execucao local: nao depende de servicos externos (Piston whitelist-only)
    result = _run_local(conf, code, stdin)
    if result:
        return result

    return _run_piston(conf, code, stdin)


def _call_ai(system_prompt: str, user_prompt: str, custom_key: Optional[str] = None, max_tokens: int = 3000) -> Optional[str]:
    import concurrent.futures

    def _post_with_deadline(url: str, headers: dict, payload: dict, timeout: int = 45):
        """POST com timeout TOTAL real (requests nao impoe tempo total, so por-leitura)."""
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            fut = ex.submit(requests.post, url, headers=headers, json=payload, timeout=timeout)
            try:
                return fut.result(timeout=timeout)
            except concurrent.futures.TimeoutError:
                logger.error(f"IA timeout total de {timeout}s")
                return None

    def _call_openai_compat(url: str, api_key: str, model: str, extra_headers: dict = None, provider=None) -> Optional[str]:
        try:
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            if extra_headers:
                headers.update(extra_headers)
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.3,
                "max_tokens": max_tokens,
            }
            if provider and provider.get("reasoning"):
                payload["reasoning"] = {"enabled": False}
            resp = _post_with_deadline(
                url,
                headers,
                payload,
                timeout=45,
            )
            if resp is None:
                return None
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if content:
                    logger.info(f"IA OK via {model} ({len(content)} chars)")
                    return content
                logger.error(f"IA retornou conteudo vazio em {model}")
                return None
            logger.error(f"IA erro {resp.status_code} em {model}: {resp.text[:300]}")
            return None
        except Exception as e:
            logger.error(f"IA falha em {model}: {e}")
            return None

    # 1) Chave personalizada do frontend (X-Custom-API-Key) tem prioridade.
    if custom_key:
        for provider in AI_PROVIDERS[:3]:
            content = _call_openai_compat(provider["url"], custom_key, provider["model"], provider["headers"], provider)
            if content:
                return content

    # 2) Depois tenta todas as chaves configuradas no servidor, em ordem.
    #    Se o modelo principal estiver em rate limit (TPD do Groq e por modelo),
    #    tenta os modelos alternativos do mesmo provider com a mesma chave.
    for provider in AI_PROVIDERS:
        key = os.environ.get(provider["env"])
        if not key:
            continue
        for model in provider.get("models", [provider["model"]]):
            content = _call_openai_compat(provider["url"], key, model, provider["headers"], provider)
            if content:
                return content

    # 3) Ultimo recurso: provedores gratuitos publicos sem chave, para o juiz
    #    nunca parar de gerar correcoes/explicacoes quando todas as chaves falham.
    keyless_endpoints = [
        ("https://text.pollinations.ai/openai", "openai"),
        ("https://enter.pollinations.ai/openai", "openai"),
        ("https://api.glfh.chat/v1/chat/completions", "gpt-4o-mini"),
    ]
    for url, model in keyless_endpoints:
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.3,
                "max_tokens": max_tokens,
            }
            resp = _post_with_deadline(url, {"Content-Type": "application/json"}, payload, timeout=45)
            if resp is None:
                continue
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if content:
                    logger.warning(f"Juiz IA via keyless fallback {url}")
                    return content
        except Exception as e:
            logger.warning(f"Keyless fallback {url} falhou: {type(e).__name__}: {str(e)[:100]}")

    logger.warning("Nenhuma chave de IA configurada ou todas falharam")
    return None


# ===== Endpoints educacionais (Modo Aprender / Explicacoes) =====
# Estes endpoints alimentam os componentes juiz/LearningMode, ErrorExplanation,
# CodeExplanation e LineByLineExplanation do frontend. Reaproveitam os helpers
# de IA existentes (_call_ai, _ai_explain, _fallback_explanation, etc.).

class EducationalRequest(BaseModel):
    language: str
    code: str
    statement: str = ""
    topic: str = ""
    error: str = ""
    tests: List[dict] = []
    summary: Optional[dict] = None


class WalkRequest(BaseModel):
    language: str
    code: str
    statement: str = ""
    topic: str = ""
    currentStep: int = 0
    steps: List[str] = []


class HintRequest(BaseModel):
    language: str
    code: str
    statement: str = ""
    topic: str = ""
    step: str = ""
    level: int = 1


class SelectionRequest(BaseModel):
    language: str
    code: str
    selection: str
    statement: str = ""
    topic: str = ""
    mode: str = "simple"


class ReasoningRequest(BaseModel):
    language: str
    code: str
    statement: str = ""
    topic: str = ""


class LineRequest(BaseModel):
    language: str
    code: str
    lineNumber: int = 1
    totalLines: int = 0
    statement: str = ""
    topic: str = ""


class ErrorHintRequest(BaseModel):
    language: str
    code: str
    statement: str = ""
    topic: str = ""
    errorType: str = ""
    analysis: str = ""
    level: int = 1


def _educ_lang_name(language: str) -> str:
    return {"c": "C", "cpp": "C++", "python": "Python 3"}.get(language, language)


def _educ_json(raw, fallback):
    if not raw:
        return fallback
    try:
        data = _json_lenient(raw)
        return data if isinstance(data, dict) else fallback
    except Exception:
        logger.error(f"IA: falha ao parsear JSON: {str(raw)[:400]}")
        return fallback


@router.post("/explain-error")
async def explain_error(req: EducationalRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
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
    ai_explanation = _ai_explain(req.code, req.language, error_text, "", "", compile_error, x_custom_api_key)
    if not ai_explanation:
        ai_explanation = _fallback_explanation(req.code, req.language, error_text, "", "", compile_error)
    _enrich_explanation(ai_explanation, req.language)
    ai_explanation["youtube_videos"] = _get_youtube_videos(ai_explanation.get("error_type", "erro"), req.language, req.code)
    return ai_explanation


@router.post("/error-hint")
async def error_hint(req: ErrorHintRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    lang_name = _educ_lang_name(req.language)
    levels = {
        1: ("Explicacao simples", "Explique em linguagem simples, sem mostrar codigo."),
        2: ("Dica direcionada", "Dê uma dica didatica que orienta o aluno a achar a solucao por si, sem entregar codigo completo."),
        3: ("Trecho de codigo", "Forneca apenas o trecho de codigo necessario para corrigir o erro, minimalista."),
    }
    label, guidance = levels.get(req.level, levels[1])
    system = f"Voce e um professor de {lang_name} expert. Gere um HINT de nivel {req.level} ({label}). {PEDAGOGY_RULES}\n{guidance}\nResponda em portugues, breve e didatico. Nivel 1/2: sem codigo. Nivel 3: apenas o trecho entre crases simples.\nENUNCIADO: {req.statement or '(nao informado)'}\nERRO/TIPO: {req.errorType}\nANALISE: {req.analysis}\nCODIGO:\n```\n{req.code}\n```"
    fallbacks = {
        1: "Releia a mensagem de erro e localize a linha indicada. Verifique se a logica de entrada -> calculo -> saida esta completa e se usou os comandos de impressao corretos para a linguagem.",
        2: "Confirme se leu todas as entradas antes de usa-las, se declarou todas as variaveis e se a operacao produz exatamente a saida esperada.",
        3: "int main() { /* leia, calcule e imprima conforme o enunciado */ }",
    }
    hint = (_call_ai(system, "", x_custom_api_key) or "").strip() or fallbacks.get(req.level, fallbacks[1])
    return {"hint": hint}


@router.post("/next-step")
async def next_step(req: WalkRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    lang_name = _educ_lang_name(req.language)
    previous = "\n".join(f"- {s}" for s in req.steps[:10]) if req.steps else "Nenhum passo anterior."
    system = f"""Voce e um professor de {lang_name} expert. Ajude o aluno a dar o PROXIMO passo logico para resolver o exercicio, SEM entregar a solucao completa.
{PEDAGOGY_RULES}
Responda APENAS com JSON valido (sem markdown, sem crases). Campos:
{{"summary": "texto curto do passo (ate 12 palavras)", "explanation": "por que este passo e necessario neste exercicio", "why": "por que esse conceito resolve este problema", "concept": "conceito fundamental envolvido"}}
ENUNCIADO: {req.statement or '(nao informado)'}
TEMA: {req.topic}
PASSOS ANTERIORES: {previous}
CODIGO ATUAL:
```{req.language}
{req.code}
```"""
    fallback = {
        "step": {
            "summary": "Analise a entrada e planeje a saida",
            "explanation": "Primeiro entenda o que o enunciado pede: quais sao as entradas e qual saida e esperada.",
            "why": "Ter clareza da entrada/saida evita erros de formato.",
            "concept": "Formato de entrada e saida",
        }
    }
    raw = _call_ai(system, "", x_custom_api_key)
    data = _educ_json(raw, fallback)
    if "step" not in data and "summary" in data:
        data = {"step": data}
    if "step" not in data:
        data = fallback
    return data


@router.post("/hint")
async def hint(req: HintRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    lang_name = _educ_lang_name(req.language)
    levels = {
        1: "Explicacao simples (sem codigo), responda o que fazer.",
        2: "Dica direcionada que guia o aluno sem entregar codigo.",
        3: "Forneca apenas o trecho de codigo necessario entre crases simples.",
    }
    guidance = levels.get(req.level, levels[1])
    if req.level == 1:
        style_rule = "MAXIMO 2 FRASES curtas e diretas, em portugues. PROIBIDO listas, PROIBIDO numeracao, PROIBIDO analisar expressoes, variaveis ou linhas do codigo. Apenas diga O QUE o aluno deve fazer no passo atual, como uma instrucao."
    elif req.level == 2:
        style_rule = "MAXIMO 3 FRASES direcionadas. Sem codigo. Mencione pontualmente o que falta no raciocinio do aluno, sem analisar cada expressao."
    else:
        style_rule = "Responda SOMENTE com o trecho de codigo necessario entre crases simples, sem nenhuma explicacao fora das crases."
    system = f"Voce e um professor de {lang_name}. Gere uma dica de nivel {req.level}. {guidance}\n{style_rule}\nPEDAGOGY: {PEDAGOGY_RULES}\nENUNCIADO: {req.statement or '(nao informado)'}\nPASSO/EXPRESSAO: {req.step}\nCODIGO:\n```\n{req.code}\n```"
    fallbacks = {
        1: "Reflite sobre o passo atual e relacione-o com a entrada e saida do problema.",
        2: "Identifique qual dado falta processar nesse passo e como a linguagem le/calcula/imprime.",
        3: "int main() { /* implemente o passo atual aqui */ }",
    }
    return {"hint": (_call_ai(system, "", x_custom_api_key) or "").strip() or fallbacks.get(req.level, fallbacks[1])}


@router.post("/reasoning")
async def reasoning(req: ReasoningRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    lang_name = _educ_lang_name(req.language)
    system = f"""Voce e um professor de {lang_name} expert. Explique o RACIOCINIO da solucao passo a passo (Modo Professor).
{PEDAGOGY_RULES}
Responda APENAS com JSON: {{"steps": [{{"title": "...", "description": "...", "concept": "..."}}]}} com de 3 a 6 passos.
ENUNCIADO: {req.statement or '(nao informado)'}
TEMA: {req.topic}
CODIGO:
```{req.language}
{req.code}
```"""
    fallback = {"steps": [
        {"title": "Entender o problema", "description": "Leia o enunciado, identifique entradas e saida esperada.", "concept": "Leitura de especificacao"},
        {"title": "Planejar a solucao", "description": "Defina a sequencia: ler, processar, imprimir.", "concept": "Algoritmo"},
    ]}
    raw = _call_ai(system, "", x_custom_api_key)
    data = _educ_json(raw, fallback)
    return data if "steps" in data else fallback


@router.post("/explain-selection")
async def explain_selection(req: SelectionRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    lang_name = _educ_lang_name(req.language)
    mode_guide = {"simple": "linguagem simples, para iniciantes", "technical": "detalhado e tecnico", "examples": "com exemplos praticos"}.get(req.mode, "simples")
    system = f"""Voce e um professor de {lang_name}. Explique o trecho de codigo SELECIONADO para um aluno, em {mode_guide}.
{PEDAGOGY_RULES}
Responda APENAS com JSON: {{"what": "...", "syntax": "...", "logic": "...", "purpose": "...", "types": [{{"name":"...","type":"...","description":"..."}}], "alternatives": ["..."], "commonErrors": ["..."], "relationToProblem": "..."}}. Campos sao opcionais; inclua apenas os relevantes.
ENUNCIADO: {req.statement or '(nao informado)'}
CODIGO COMPLETO:
```{req.language}
{req.code}
```
SELECIONADO:
{req.selection}"""
    fallback = {"what": "Segue a logica do trecho selecionado.", "purpose": "Contribui para a resolucao do exercicio.", "relationToProblem": "Relacione a entrada, o processamento e a saida do problema."}
    data = _educ_json(_call_ai(system, "", x_custom_api_key), fallback)
    data.setdefault("examples", [])
    data.setdefault("concepts", [])
    return {"explanation": data, "examples": data.get("examples", []), "concepts": data.get("concepts", [])}


_explain_compile_cache = {}
_explain_compile_in_progress = set()

# Caches em memoria para NAO gastar creditos de IA repetindo geracoes iguais.
_gen_cache = {}
_walkthrough_cache = {}
_ai_explain_cache = {}


def _cache_get(store, key):
    return store.get(key)


def _cache_put(store, key, value, maxsize=200):
    if key in store:
        store[key] = value
        return
    if len(store) >= maxsize:
        oldest = next(iter(store))
        del store[oldest]
    store[key] = value


# --- Cache persistente no Supabase (L2) para nao gastar creditos de IA ---
# Tabela: generated_content (cache_key text primary key, payload jsonb, created_at timestamptz)
# Se a tabela nao existir, as chamadas falham silenciosamente e so o cache em memoria atua.
import hashlib as _hashlib


def _db_cache_key(kind: str, parts) -> str:
    raw = kind + "|" + "|".join(str(p) for p in parts)
    return f"{kind}:{_hashlib.sha1(raw.encode('utf-8')).hexdigest()}"


def _db_cache_get(key: str):
    try:
        from utils.supabase import get_supabase_admin
        sb = get_supabase_admin()
        res = sb.table("generated_content").select("payload").eq("cache_key", key).limit(1).execute()
        rows = getattr(res, "data", res)
        if rows:
            return rows[0].get("payload")
    except Exception as e:
        logger.warning(f"DB cache get falhou ({type(e).__name__}): {str(e)[:120]}")
    return None


def _db_cache_put(key: str, payload: dict):
    try:
        from utils.supabase import get_supabase_admin
        sb = get_supabase_admin()
        sb.table("generated_content").upsert(
            {"cache_key": key, "payload": payload},
            on_conflict="cache_key",
        ).execute()
    except Exception as e:
        logger.warning(f"DB cache put falhou ({type(e).__name__}): {str(e)[:120]}")


def _cache_lookup(mem_store, mem_key, db_key):
    """L1 memoria -> L2 Supabase. Retorna o payload ou None."""
    cached = _cache_get(mem_store, mem_key)
    if cached is not None:
        return cached
    db_val = _db_cache_get(db_key)
    if db_val is not None:
        _cache_put(mem_store, mem_key, db_val)
        logger.info(f"Cache Supabase acertou para {db_key[:40]}")
    return db_val


def _cache_store(mem_store, mem_key, db_key, value):
    _cache_put(mem_store, mem_key, value)
    _db_cache_put(db_key, value)


def _explain_compile_status(language: str, code: str, custom_key: Optional[str] = None):
    """Checa compilacao e corrige o codigo se preciso. Cacheado por (linguagem, codigo)."""
    key = (language, code)
    if key in _explain_compile_cache:
        return _explain_compile_cache[key]
    if key in _explain_compile_in_progress:
        return None
    _explain_compile_in_progress.add(key)
    try:
        error = None
        if language == "python":
            try:
                import ast
                ast.parse(code)
            except SyntaxError as e:
                error = f"Erro de sintaxe (linha {e.lineno}): {e.msg}"
        else:
            try:
                run_result = _run(language, code, "")
                if run_result and isinstance(run_result, dict):
                    compile_res = run_result.get("compile") or {}
                    if compile_res.get("code") not in (0, None, -1):
                        error = (compile_res.get("stderr") or "Erro de compilacao.").strip()[:800]
            except HTTPException:
                pass
            except Exception as e:
                logger.warning(f"Falha ao checar compilacao no explain-line: {e}")
        corrected = _fix_code_ai(code, language, error, custom_key) if error else None
        result = (error, corrected)
        if len(_explain_compile_cache) > 100:
            _explain_compile_cache.clear()
        _explain_compile_cache[key] = result
        return result
    finally:
        _explain_compile_in_progress.discard(key)


@router.post("/explain-line")
async def explain_line(req: LineRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    lang_name = _educ_lang_name(req.language)
    lines = req.code.split("\n")
    line_text = lines[req.lineNumber - 1] if 1 <= req.lineNumber <= len(lines) else ""

    compile_error = corrected_code = None
    key = (req.language, req.code)
    if req.code.strip() and key not in _explain_compile_cache:
        import threading
        t = threading.Thread(target=_explain_compile_status, args=(req.language, req.code, x_custom_api_key), daemon=True)
        t.start()
        t.join(timeout=4)
    if key in _explain_compile_cache:
        compile_error, corrected_code = _explain_compile_cache[key]

    system = f"""Voce e um professor de {lang_name}. Explique a LINHA {req.lineNumber} do codigo para um aluno iniciante.
{PEDAGOGY_RULES}
Responda APENAS com JSON: {{"what": "...", "syntax": "...", "purpose": "...", "commonError": "..."}}. Campos opcionais.
ENUNCIADO: {req.statement or '(nao informado)'}"""
    user = f"LINHA {req.lineNumber}: {line_text}"
    if compile_error:
        user += f"""

ERRO DE COMPILACAO DO CODIGO (pode ser nesta linha ou em outra):
{compile_error[:600]}

CODIGO CORRIGIDO:
```{req.language}
{corrected_code or "(correcao indisponivel)"}
```

SE esta linha tiver relacao com o erro, explique o que esta errado nela, por que, e como ela fica na versao corrigida."""
    fallback = {"what": "Processa ou manipula dados conforme o enunciado.", "syntax": "Sintaxe propria da linguagem.", "purpose": "Contribui para a resolucao do exercicio.", "commonError": "Erros comuns incluem esquecer ponto e virgula ou declarar variavel."}
    data = _educ_json(_call_ai(system, user, x_custom_api_key), fallback)
    return {"explanation": data, "compile_error": compile_error, "corrected_code": corrected_code}


@router.post("/check-compile")
async def check_compile(req: LineRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    if not req.code.strip():
        return {"compile_error": None, "corrected_code": None}
    import threading
    key = (req.language, req.code)
    if key not in _explain_compile_cache:
        t = threading.Thread(target=_explain_compile_status, args=(req.language, req.code, x_custom_api_key), daemon=True)
        t.start()
        t.join(timeout=8)
    compile_error, corrected_code = _explain_compile_cache.get(key, (None, None))
    return {"compile_error": compile_error, "corrected_code": corrected_code}


def _ai_explain(code: str, language: str, stderr: str, stdout: str, expected: str, compile_error: bool, custom_key: Optional[str] = None) -> Optional[dict]:
    explain_key = ("explain", language, code, stderr, stdout, expected, compile_error)
    cached = _cache_lookup(_ai_explain_cache, explain_key, _db_cache_key("explain", (language, code, stderr, stdout, expected, compile_error)))
    if cached is not None:
        logger.info("Explicacao de erro reutilizada do cache (sem gastar creditos)")
        return cached
    lang_name = {"c": "C", "cpp": "C++", "python": "Python"}.get(language, language)

    system_prompt = f"""Voce e um professor de programacao {lang_name} expert e detalhista. Analise o codigo do aluno, identifique TODOS os erros e explique passo a passo de forma MUITO detalhada e didatica.

{PEDAGOGY_RULES}

REGRAS OBRIGATORIAS:
- Responda APENAS com JSON valido (sem markdown, sem ```)
- Seja EXTREMAMENTE especifico: aponte linhas exatas, variaveis, operadores errados
- Mostre o codigo CORRETO como hint em cada passo
- Inclua o codigo corrigido completo no campo corrected_code
- Em CADA passo, explique detalhadamente:
  * O QUE esta errado e POR QUE esta errado
  * QUEM usa esse recurso e POR QUE ele existe na linguagem
  * QUAL e a diferenca entre o que o aluno fez e o correto
  * COMO o compilador/interpretador entende esse codigo
  * Se o passo envolve uma expressao/conceito, adicione "expressions": [{{"expression": "...", "why": "por que existe na linguagem e neste codigo", "what_if_removed": "o que aconteceria sem ela", "when_to_use": "regra pratica", "alternatives": "outras formas"}}]
- Use portugues simples, didatico, como se fosse aula particular
- Se o codigo usa if, for, while, variaveis, funcoes, arrays, etc., explique O QUE cada um serve e POR QUE e necessario naquele contexto
- NUNCA assuma que o aluno sabe o basico - explique tudo como se fosse a primeira aula sobre aquele conceito

ESTRUTURA DO JSON:
{{
  "error_type": "tipo do erro resumido",
  "analysis": "analise detalhada e completa do que esta errado, explicando o contexto geral",
  "step_by_step": [
    {{
      "step": 1,
      "title": "Titulo claro e descritivo do passo",
      "detail": "explicacao MUITO completa e detalhada. Inclua: o que aconteceu, por que aconteceu, como a linguagem funciona nesse aspecto, e como o aluno deve pensar para nao errar de novo. Minimo 3-4 frases explicativas.",
      "code_hint": "exemplo de codigo correto e completo ou null",
      "concept": "conceito fundamental que o aluno precisa aprender",
      "expressions": [{{"expression": "input()", "why": "por que foi usada aqui", "what_if_removed": "o que aconteceria sem ela", "when_to_use": "quando usar", "alternatives": "alternativas"}}],
      "youtube_search": "termo de busca especifico para video aula sobre ESSE conceito especifico"
    }}
  ],
  "suggestion": "dica final detalhada de como corrigir e evitar o erro no futuro",
  "corrected_code": "codigo completo corrigido e funcional ou null",
  "youtube_search": "termo de busca geral para video aula sobre o tema"
}}"""

    if compile_error:
        context = f"""CODIGO {lang_name} DO ALUNO COM ERRO DE COMPILACAO:

```{language}
{code}
```

ERRO DE COMPILACAO:
{stderr[:2000]}

IMPORTANTE: Analise CADA erro detalhadamente. Para cada erro:
1. Aponte a LINHA EXATA onde esta o erro
2. Explique O QUE o compilador esta tentando dizer com essa mensagem de erro
3. Explique POR QUE esse erro aconteceu (o que o compilador espera vs o que o aluno escreveu)
4. Mostre como seria o codigo CORRETO
5. Explique o conceito por tras do erro (ex: se e erro de tipo, explique tipos de dados; se e erro de sintaxe, explique a sintaxe correta)
6. Adicione um campo "youtube_search" com termos para encontrar video sobre esse erro especifico"""
    elif stdout and expected:
        context = f"""CODIGO {lang_name} DO ALUNO - SAIDA INCORRETA:

```{language}
{code}
```

SAIDA DO ALUNO:
{stdout[:500]}

SAIDA ESPERADA:
{expected[:500]}

IMPORTANTE: Explique detalhadamente:
1. O QUE o codigo esta fazendo (passo a passo da logica do aluno)
2. POR QUE a saida esta errada (onde a logica falhou)
3. COMO o compilador/interpretador executa cada linha
4. COMO corrigir a logica para obter a saida correta
5. Explique conceitos como if/else, loops, variaveis que podem ter causado o problema
6. Adicione um campo "youtube_search" com termos para encontrar video sobre a logica envolvida"""
    elif not stdout and expected:
        context = f"""CODIGO {lang_name} DO ALUNO QUE NAO IMPRIMIU NADA:

```{language}
{code}
```

O programa compilou e executou sem erros, mas a SAIDA FICOU VAZIA (nenhum caractere impresso).
A saida esperada era:
{expected[:500]}

IMPORTANTE: Explique detalhadamente:
1. Que o codigo compilou e rodou, mas nao tem nenhum comando de impressao em execucao (printf/cout/print)
2. Que o template "// seu codigo aqui" com apenas "return 0;" gera saida vazia
3. Que o programa precisa de 3 partes: ler a entrada, calcular, e IMPRIMIR o resultado
4. Mostre no corrected_code o codigo completo corrigido
5. Aponte a linha exata onde falta a impressao (se houver print, verifique se esta dentro de bloco que nunca executa)
6. Adicione "youtube_search" com termos para video sobre como imprimir em {lang_name}"""
    else:
        context = f"""CODIGO {lang_name} DO ALUNO FALHOU NA EXECUCAO:

```{language}
{code}
```

ERRO:
{stderr[:2000]}

IMPORTANTE: Analise o erro detalhadamente:
1. O QUE causou o erro de execucao
2. POR QUE esse erro so aparece na execucao e nao na compilacao
3. COMO prevenir esse tipo de erro no futuro
4. Explique o conceito envolvido
5. Adicione um campo "youtube_search" com termos para encontrar video sobre esse erro"""

    raw = _call_ai(system_prompt, context, custom_key)
    if not raw:
        _cache_put(_ai_explain_cache, explain_key, None)
        return None

    try:
        parsed = _json_lenient(raw)
        _cache_store(_ai_explain_cache, explain_key, _db_cache_key("explain", (language, code, stderr, stdout, expected, compile_error)), parsed)
        return parsed
    except json.JSONDecodeError:
        logger.error(f"Failed to parse AI response as JSON: {raw[:500]}")
        fallback = {
            "error_type": "explicacao da IA",
            "analysis": raw[:1000],
            "step_by_step": [{"step": 1, "title": "Analise da IA", "detail": raw[:1000], "code_hint": None, "concept": None}],
            "suggestion": "Revise o codigo com base na analise acima.",
            "corrected_code": None,
            "youtube_search": f"{language} programacao erros comuns",
        }
        _cache_store(_ai_explain_cache, explain_key, _db_cache_key("explain", (language, code, stderr, stdout, expected, compile_error)), fallback)
        return fallback


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
                    "youtube_search": f"{lang_name} {err.get('concept', 'erro compilacao')} tutorial passo a passo",
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
                        "youtube_search": f"{lang_name} erro compilador tutorial",
                    })
            else:
                first_err = (stderr or "").split("\n")[0][:200] if stderr else "Erro desconhecido"
                step_by_step.append({
                    "step": 1,
                    "title": "Erro de compilacao",
                    "detail": f"Mensagem do compilador:\n{first_err}",
                    "code_hint": None,
                    "concept": "Interpretacao de erros do compilador GCC",
                    "youtube_search": f"{lang_name} erros compilador tutorial",
                })

        step_by_step.append({
            "step": len(step_by_step) + 1,
            "title": "Corrija e recompile",
            "detail": "Apos corrigir todos os erros acima, clique em 'Enviar para o juiz' novamente. Leia cada mensagem de erro cuidadosamente.",
            "code_hint": None,
            "concept": None,
            "youtube_search": f"{lang_name} compilacao tutorial",
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
                {"step": 1, "title": "Sua saida", "detail": f"Saida gerada pelo seu codigo:\n{stdout[:300]}", "code_hint": None, "concept": None, "youtube_search": f"{lang_name} saida debug tutorial"},
                {"step": 2, "title": "Saida esperada", "detail": f"Saida que o exercicio espera:\n{expected[:300]}", "code_hint": None, "concept": None, "youtube_search": f"{lang_name} saida esperada tutorial"},
                {"step": 3, "title": "Compare e identifique a diferenca", "detail": "Compare linha por linha. Verifique: espacos extras, quebras de linha, formatacao de numeros, maiusculas/minusculas.", "code_hint": None, "concept": "Formatacao de saida - printf()", "youtube_search": f"{lang_name} printf formatacao saida tutorial"},
                {"step": 4, "title": "Corrija a logica", "detail": "Se a saida e numericamente diferente, revise os calculos. Se e de formatacao, ajuste o printf().", "code_hint": None, "concept": None, "youtube_search": f"{lang_name} logica programacao debug tutorial"},
            ],
            "suggestion": "Use printf() para debugar e ver intermediarios. Compare sua saida com a esperada caractere por caractere.",
            "corrected_code": None,
            "youtube_search": f"{lang_name} saida incorreta debug tutorial",
        }
    elif not stdout and expected:
        return {
            "error_type": "Sem saida",
            "analysis": f"O codigo {lang_name} compilou e terminou sem erro, mas NAO imprimiu nada na saida.",
            "step_by_step": [
                {"step": 1, "title": "Seu codigo nao imprimiu nada", "detail": f"O programa rodou e encerrou, mas a saida ficou vazia (esperado: {expected[:200]}). Isso acontece quando o codigo nao tem nenhum comando de impressao, ou a impressao esta dentro de um bloco que nunca executa.", "code_hint": None, "concept": "Comandos de saida: printf(), cout, print()", "youtube_search": f"{lang_name} printf cout print como imprimir tutorial"},
                {"step": 2, "title": "Verifique o comando de impressao", "detail": "Confira se o codigo tem a linha que imprime a resposta: C usa printf(), C++ usa cout <<, Python usa print(). O template '// seu codigo aqui' precisa ser SUBSTITUIDO pela solucao completa.", "code_hint": {"c": "printf(\"%d\\n\", A + B);", "cpp": "cout << A + B << endl;", "python": "print(A + B)"}.get(lang_name and language.lower(), "print(...)"), "concept": "Estrutura do programa: ler -> calcular -> imprimir", "youtube_search": f"{lang_name} primeiro programa hello world tutorial"},
                {"step": 3, "title": "Estrutura completa", "detail": f"Para este exercicio o programa precisa: 1) ler os dados com {'scanf' if language == 'c' else 'cin' if language == 'cpp' else 'input()'}, 2) calcular, 3) imprimir o resultado. Se faltou qualquer um desses passos, a saida sai vazia ou errada.", "code_hint": None, "concept": "Entrada -> Processamento -> Saida", "youtube_search": f"{lang_name} ler entrada imprimir saida tutorial"},
                {"step": 4, "title": "Envie novamente", "detail": "Substitua TODO o codigo no editor pela solucao completa (com leitura, calculo e impressao) e clique em 'Enviar para o juiz'.", "code_hint": None, "concept": None, "youtube_search": f"{lang_name} soma de dois numeros tutorial"},
            ],
            "suggestion": "O juiz nao le codigo 'a parte': tudo que o programa imprimir na tela e a resposta. Escreva a solucao inteira dentro do main().",
            "corrected_code": None,
            "youtube_search": f"{lang_name} imprimir saida console tutorial",
        }
    else:
        return {
            "error_type": "Erro na execucao",
            "analysis": stderr[:300] if stderr else "Erro desconhecido",
            "step_by_step": [
                {"step": 1, "title": "Erro detectado", "detail": stderr[:300] if stderr else "Sem detalhes do erro", "code_hint": None, "concept": None, "youtube_search": f"{lang_name} erro execucao tutorial"},
                {"step": 2, "title": "Revise o codigo", "detail": "Verifique logica, variaveis e operacoes.", "code_hint": None, "concept": None, "youtube_search": f"{lang_name} programacao debug tutorial"},
            ],
            "suggestion": "Adicione printf() para debugar o fluxo de execucao.",
            "corrected_code": None,
            "youtube_search": f"{lang_name} programacao debug tutorial",
        }


@router.post("/submit")
async def judge_submit(req: SubmitRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key"), authorization: Optional[str] = Header(None)):
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Codigo vazio.")
    if not req.test_cases:
        raise HTTPException(status_code=400, detail="Nenhum caso de teste enviado.")
    user_id = _user_id_from_auth(authorization)

    first_result = _run(req.language, req.code, req.test_cases[0].input)

    if first_result.get("compile") and first_result["compile"].get("code") is not None and first_result["compile"].get("code") != 0:
        compile_stderr = first_result["compile"].get("stderr", "")
        corrected_code = _fix_code_ai(req.code, req.language, compile_stderr, x_custom_api_key) if compile_stderr else None
        ai_explanation = _ai_explain(req.code, req.language, compile_stderr, "", "", True, x_custom_api_key)
        if not ai_explanation:
            ai_explanation = _fallback_explanation(req.code, req.language, compile_stderr, "", "", True)
        _enrich_explanation(ai_explanation, req.language)
        ai_explanation["youtube_videos"] = _get_youtube_videos("compilacao", req.language, req.code)
        _save_submission(user_id, req.problem_id, req.language, req.code, "compile_error", {
            "compile": {"ok": False, "stderr": compile_stderr},
            "summary": {"passed": 0, "total": len(req.test_cases), "accepted": False},
            "corrected_code": corrected_code,
            "explanation": ai_explanation,
        })
        return {
            "compile": {"ok": False, "stderr": compile_stderr},
            "tests": [],
            "summary": {"passed": 0, "total": len(req.test_cases), "accepted": False},
            "corrected_code": corrected_code,
            "explanation": ai_explanation,
        }

    if not first_result.get("run") or (first_result.get("run") and first_result["run"].get("stdout") is None and first_result["run"].get("code") != 0):
        stderr_val = (first_result.get("compile") or {}).get("stderr", "") or ((first_result.get("run") or {}).get("stderr", ""))
        corrected_code = _fix_code_ai(req.code, req.language, stderr_val, x_custom_api_key) if stderr_val else None
        ai_explanation = _ai_explain(req.code, req.language, stderr_val, "", "", True, x_custom_api_key)
        if not ai_explanation:
            ai_explanation = _fallback_explanation(req.code, req.language, stderr_val, "", "", True)
        _enrich_explanation(ai_explanation, req.language)
        ai_explanation["youtube_videos"] = _get_youtube_videos("execucao", req.language, req.code)
        _save_submission(user_id, req.problem_id, req.language, req.code, "runtime_error", {
            "compile": {"ok": True, "stderr": ""},
            "summary": {"passed": 0, "total": len(req.test_cases), "accepted": False},
            "error": "Falha ao executar o codigo.",
            "corrected_code": corrected_code,
            "explanation": ai_explanation,
        })
        return {
            "compile": {"ok": True, "stderr": ""},
            "tests": [],
            "summary": {"passed": 0, "total": len(req.test_cases), "accepted": False},
            "error": "Falha ao executar o codigo.",
            "corrected_code": corrected_code,
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
            first_fail = {"stderr": stderr, "output": output, "expected": expected_norm, "input": tc.input}
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
            first_fail["expected"], False, x_custom_api_key
        )
        if not ai_explanation:
            ai_explanation = _fallback_explanation(
                req.code, req.language,
                first_fail["stderr"], first_fail["output"],
                first_fail["expected"], False
            )
        _enrich_explanation(ai_explanation, req.language)
        ai_explanation["youtube_videos"] = _get_youtube_videos("saida incorreta", req.language, req.code)
        explanation = ai_explanation
        corrected_code = _fix_wrong_answer(
            req.code, req.language,
            first_fail.get("input", ""), first_fail["output"], first_fail["expected"],
            x_custom_api_key,
        )

    return {
        "compile": {"ok": True, "stderr": (results[0].get("compile") or {}).get("stderr", "")},
        "tests": tests,
        "summary": {
            "passed": passed,
            "total": len(req.test_cases),
            "accepted": passed == len(req.test_cases),
        },
        "corrected_code": corrected_code if first_fail else None,
        "explanation": explanation,
    }


@router.post("/explain")
async def explain_error(req: SubmitRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
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

    ai_explanation = _ai_explain(req.code, req.language, error_text, "", "", compile_error, x_custom_api_key)
    if not ai_explanation:
        ai_explanation = _fallback_explanation(req.code, req.language, error_text, "", "", compile_error)
    _enrich_explanation(ai_explanation, req.language)
    ai_explanation["youtube_videos"] = _get_youtube_videos("erro", req.language, req.code)
    return ai_explanation


def _fix_code_ai(code: str, language: str, compile_error: str, custom_key=None):
    """Chamada curta dedicada a corrigir o codigo com erro de compilacao."""
    lang_name = {"c": "C", "cpp": "C++", "python": "Python"}.get(language, language)
    system_prompt = f"""Voce e um professor de {lang_name}. O codigo do aluno NAO COMPILA.

CORRIJA o codigo para compilar e resolver o problema, mantendo a logica e o estilo do aluno o mais proximo possivel do original. Nao reescreva o codigo do zero, nao mude a estrutura, nao adicione funcionalidades novas. Apenas conserte os erros de sintaxe/compilacao.

Responda APENAS com o codigo corrigido completo (sem markdown, sem ```, sem comentarios adicionais)."""
    context = f"""LINGUAGEM: {lang_name}
ERRO DE COMPILACAO:
{compile_error[:600]}

CODIGO DO ALUNO:
```{language}
{code}
```"""
    raw = _call_ai(system_prompt, context, custom_key, max_tokens=1200)
    if not raw:
        return None
    cleaned = re.sub(r"^```\w*\n?", "", raw.strip()).strip()
    cleaned = re.sub(r"\n?```$", "", cleaned)
    if not cleaned or cleaned.lower().startswith(("desculpe", "não ", "nao ", "erro")):
        return None
    return cleaned


def _fix_wrong_answer(code: str, language: str, test_input: str, actual: str, expected: str, custom_key=None):
    """Corrige o codigo que compila mas produz saida errada no juiz."""
    lang_name = {"c": "C", "cpp": "C++", "python": "Python"}.get(language, language)
    system_prompt = f"""Voce e um professor de {lang_name}. O codigo do aluno COMPILA mas falha nos testes do juiz online (saida incorreta).

CORRIJA o codigo para passar nos testes, mantendo a logica e o estilo do aluno o mais proximo possivel do original. Nao reescreva do zero, nao mude a estrutura, nao adicione funcionalidades novas. Conserte apenas o que esta errado (leitura da entrada, calculo, formatacao exata da saida).

Responda APENAS com o codigo corrigido completo (sem markdown, sem ```, sem comentarios adicionais)."""
    context = f"""LINGUAGEM: {lang_name}

ENTRADA DO TESTE:
{test_input[:500]}

SAIDA PRODUZIDA (incorreta):
{actual[:500]}

SAIDA ESPERADA:
{expected[:500]}

CODIGO DO ALUNO:
```{language}
{code}
```"""
    raw = _call_ai(system_prompt, context, custom_key, max_tokens=1400)
    if not raw:
        return None
    cleaned = re.sub(r"^```\w*\n?", "", raw.strip()).strip()
    cleaned = re.sub(r"\n?```$", "", cleaned)
    if not cleaned or cleaned.lower().startswith(("desculpe", "não ", "nao ", "erro")):
        return None
    return cleaned


@router.post("/walkthrough")
def judge_walkthrough(req: WalkthroughRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Codigo vazio.")
    stdin = req.input or (req.test_cases[0].input if req.test_cases else "")
    expected = req.expected or (req.test_cases[0].expected if req.test_cases else "")

    walk_key = ("walk", req.language, req.code, req.statement, stdin, expected)
    cached = _cache_lookup(_walkthrough_cache, walk_key, _db_cache_key("walk", (req.language, req.code, req.statement, stdin, expected)))
    if cached:
        logger.info("Walkthrough reutilizado do cache (sem gastar creditos)")
        return cached

    is_template = _is_template(req.code, req.language)
    compile_error = None

    def _check_compile():
        nonlocal compile_error
        try:
            run_result = _run(req.language, req.code, stdin)
            if run_result and isinstance(run_result, dict):
                compile_res = run_result.get("compile") or {}
                if compile_res.get("code") not in (0, None, -1):
                    compile_error = (compile_res.get("stderr") or "Erro de compilacao.").strip()[:800]
        except HTTPException:
            pass
        except Exception as e:
            logger.warning(f"Falha ao executar no walkthrough: {e}")

    # Roda o check de compilacao em paralelo, mas espera ate ~7s antes de chamar a IA:
    # o Wandbox costuma responder em ~5s, e com o erro conhecido a IA ja corrige numa unica chamada.
    if not is_template:
        import threading

        check_thread = threading.Thread(target=_check_compile, daemon=True)
        check_thread.start()
        check_thread.join(timeout=7)
        if check_thread.is_alive():
            # nao terminou: segue sem o erro; o fix dedicado rodara depois se necessario
            check_thread = None
    else:
        check_thread = None

    try:
        steps, corrected_code, verdict = _walkthrough_ai(
            req.code, req.language, stdin, req.statement, expected,
            is_template, x_custom_api_key, compile_error=compile_error,
        )
    finally:
        if check_thread:
            check_thread.join(timeout=8)

    if not steps:
        # IA falhou ou nao produziu steps: re-tenta com o erro de compilacao conhecido
        if compile_error and not is_template:
            steps, corrected_code, verdict = _walkthrough_ai(
                req.code, req.language, stdin, req.statement, expected,
                False, x_custom_api_key, compile_error=compile_error,
            )
    if not corrected_code and compile_error and not is_template:
        # Erro de compilacao real e a IA nao corrigiu: chamada curta dedicada a corrigir
        corrected_code = _fix_code_ai(req.code, req.language, compile_error, x_custom_api_key)
    if not steps:
        if is_template:
            steps = [{
                "line": 1,
                "code": req.code.split("\n")[0] if req.code.strip() else "",
                "explanation": "Seu codigo esta vazio (so o esqueleto do template). Preencha o codigo com a solucao completa (ler a entrada, calcular e imprimir) e clique em 'Passo a Passo' de novo para ver a execucao.",
                "variables": {},
                "output": "",
            }]
        elif compile_error:
            # IA falhou: usa o codigo corrigido se veio, senão mostra o erro de compilacao
            if corrected_code:
                steps = _local_walkthrough(corrected_code, req.language, stdin)
                for s in steps:
                    s["explanation"] = f"(Codigo corrigido) {s.get('explanation', '')}"
            else:
                steps = [{
                    "line": 1,
                    "code": req.code.split("\n")[0] if req.code.strip() else "",
                    "explanation": f"Seu codigo nao compilou:\n{compile_error[:400]}\n\nCorrija o erro e clique em 'Passo a Passo' de novo, ou use 'Explicar Erro' para ajuda detalhada.",
                    "variables": {},
                    "output": "",
                }]
        else:
            steps = _local_walkthrough(req.code, req.language, stdin)
    # Garante que cada passo detalhe TODAS as expressoes do dicionario presentes na linha
    _enrich_steps(steps, req.language)
    response = {
        "steps": steps,
        "total": len(steps),
        "language": req.language,
        "stdin": stdin,
        "template": is_template,
        "corrected_code": corrected_code,
        "compile_error": compile_error,
        "verdict": verdict,
    }
    _cache_store(_walkthrough_cache, walk_key, _db_cache_key("walk", (req.language, req.code, req.statement, stdin, expected)), response)
    return response


class VismoPromptRequest(BaseModel):
    language: str = "python"
    code: str = ""
    statement: str = ""
    title: str = ""
    input: str = ""


@router.post("/vismo-prompt")
def vismo_prompt(req: VismoPromptRequest):
    """
    Gera um prompt pronto para o Vismo Studio (https://vismo.studio/create),
    com narracao passo a passo da construcao do codigo, o por que de cada
    variavel e o por que de cada expressao usada.
    """
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Codigo vazio.")

    lang_name = {"c": "C", "cpp": "C++", "python": "Python 3"}.get(req.language, req.language)
    steps = _local_walkthrough(req.code, req.language, req.input or "")
    _enrich_steps(steps, req.language)

    title = req.title.strip() or f"Construindo um codigo em {lang_name} passo a passo"
    lines = []
    lines.append(f"TITULO DO VIDEO: {title}")
    lines.append("")
    lines.append(
        f"ESTILO: Video educativo de programacao em {lang_name}, em formato de aula particular, "
        "tela limpa e escura, o codigo aparecendo linha por linha enquanto uma voz didatica narra "
        "por que cada linha e cada variavel existe."
    )
    lines.append("")
    if req.statement.strip():
        lines.append(f"ENUNCIADO DO EXERCICIO: {req.statement.strip()}")
        lines.append("")
    lines.append("NARRACAO PASSO A PASSO DA CONSTRUCAO DO CODIGO:")
    lines.append("")

    seen_vars = set()
    for i, step in enumerate(steps, 1):
        code_line = step.get("code") or ""
        expl = step.get("explanation") or ""
        lines.append(f"Cena {i}:")
        lines.append(f"  - Mostrar na tela a linha: {code_line}")
        lines.append(f"  - Narrar: {expl}")

        var_details = step.get("variable_details") or []
        if var_details:
            lines.append("  - POR QUE DAS VARIAVEIS desta cena:")
            for v in var_details:
                name = v.get("name")
                if not name or name in seen_vars:
                    continue
                seen_vars.add(name)
                purpose = v.get("purpose") or ""
                why = v.get("why") or ""
                lines.append(f"      * '{name}': {why} {purpose}".rstrip())
        exprs = step.get("expressions") or []
        for ex in exprs:
            if isinstance(ex, dict) and ex.get("expression"):
                why = ex.get("why") or ex.get("why_used") or ""
                lines.append(f"  - CONCEITO '{ex['expression']}': {why}".rstrip())
        lines.append("")

    lines.append(
        "CENA FINAL: Resuma o que foi construido: 'Pronto! O codigo resolve o exercicio: "
        "le a entrada, calcula o resultado e imprime a saida exata que o juiz espera.'"
    )
    lines.append("")
    lines.append("Observacao: use linguagem simples, de preferencia em portugues, e destaque "
                 "na tela cada variavel com seu valor conforme a execucao avanca.")
    prompt = "\n".join(lines)
    return {
        "prompt": prompt,
        "total": len(steps),
        "language": req.language,
        "ok": True,
    }


def _generate_new_exercise(topic: str, difficulty: int, language: str, description: str = "") -> dict:
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
            {"title": "Acima da Media", "statement": "Leia N notas, armazene-as em um vetor, calcule a media inteira e imprima quantas notas estao acima dela.",
             "inputFormat": "N seguido de N notas", "outputFormat": "A media inteira e a quantidade de notas acima dela",
             "test_cases": [{"input": "4\n5 8 7 6", "expected": "6\n2"}, {"input": "3\n10 9 8", "expected": "9\n1"}]},
            {"title": "Contagem de Ocorrencias", "statement": "Leia N numeros e um valor de referencia R. Imprima quantos sao maiores que R, quantos sao menores e quantas vezes R aparece.",
             "inputFormat": "N, depois N numeros, depois R", "outputFormat": "maiores, menores e ocorrencias de R",
             "test_cases": [{"input": "5\n1 5 5 9 10\n5", "expected": "2 1 2"}, {"input": "3\n4 4 4\n4", "expected": "0 0 3"}]},
            {"title": "Inverter Vetor", "statement": "Leia N numeros e imprima-os na ordem inversa.",
             "inputFormat": "N seguido de N numeros", "outputFormat": "Os N numeros na ordem inversa",
             "test_cases": [{"input": "4\n1 2 3 4", "expected": "4 3 2 1"}, {"input": "3\n7 8 9", "expected": "9 8 7"}]},
            {"title": "Filtrar Pares", "statement": "Leia N numeros e imprima apenas os pares, na ordem em que aparecem (ou VAZIO se nao houver).",
             "inputFormat": "N seguido de N numeros", "outputFormat": "Os numeros pares separados por espaco ou VAZIO",
             "test_cases": [{"input": "5\n1 2 3 4 5", "expected": "2 4"}, {"input": "3\n1 3 5", "expected": "VAZIO"}]},
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
    if description:
        # Escolhe o exercicio do banco que mais combina com a descricao
        # (em vez de sortear um que pode nao ter relacao com a questao).
        text = description.lower()
        best, best_score = possible[0], -1
        for cand in possible:
            hay = " ".join([cand["statement"], cand["inputFormat"], cand["outputFormat"]]).lower()
            score = sum(1 for kw in hay.split() if len(kw) > 3 and kw in text)
            if score > best_score:
                best, best_score = cand, score
        ex = best
    else:
        ex = random.choice(possible)

    starters = {
        "Soma de Dois Numeros": {
            "python": "# {t}\n# {s}\n\nvalores = input().split()\nA = int(valores[0])\nB = int(valores[1])\nprint(A + B)\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int A, B;\n    scanf(\"%d %d\", &A, &B);\n    printf(\"%d\\n\", A + B);\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\nusing namespace std;\n\nint main() {{\n    int A, B;\n    cin >> A >> B;\n    cout << A + B << endl;\n    return 0;\n}}\n",
        },
        "Troca de Valores": {
            "python": "# {t}\n# {s}\n\nvalores = input().split()\nA = int(valores[0])\nB = int(valores[1])\nprint(B, A)\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int A, B;\n    scanf(\"%d %d\", &A, &B);\n    printf(\"%d %d\\n\", B, A);\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\nusing namespace std;\n\nint main() {{\n    int A, B;\n    cin >> A >> B;\n    cout << B << \" \" << A << endl;\n    return 0;\n}}\n",
        },
        "Par ou Impar": {
            "python": "# {t}\n# {s}\n\nN = int(input())\nif N % 2 == 0:\n    print(\"PAR\")\nelse:\n    print(\"IMPAR\")\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int N;\n    scanf(\"%d\", &N);\n    if (N % 2 == 0) {{\n        printf(\"PAR\\n\");\n    }} else {{\n        printf(\"IMPAR\\n\");\n    }}\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\nusing namespace std;\n\nint main() {{\n    int N;\n    cin >> N;\n    if (N % 2 == 0) {{\n        cout << \"PAR\" << endl;\n    }} else {{\n        cout << \"IMPAR\" << endl;\n    }}\n    return 0;\n}}\n",
        },
        "Maior de Tres": {
            "python": "# {t}\n# {s}\n\nvalores = input().split()\nA = int(valores[0])\nB = int(valores[1])\nC = int(valores[2])\nprint(max(A, B, C))\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int A, B, C, maior;\n    scanf(\"%d %d %d\", &A, &B, &C);\n    maior = A;\n    if (B > maior) maior = B;\n    if (C > maior) maior = C;\n    printf(\"%d\\n\", maior);\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\nusing namespace std;\n\nint main() {{\n    int A, B, C, maior;\n    cin >> A >> B >> C;\n    maior = A;\n    if (B > maior) maior = B;\n    if (C > maior) maior = C;\n    cout << maior << endl;\n    return 0;\n}}\n",
        },
        "Fatorial": {
            "python": "# {t}\n# {s}\n\nN = int(input())\nfat = 1\nfor i in range(2, N + 1):\n    fat = fat * i\nprint(fat)\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int N, i;\n    long long fat = 1;\n    scanf(\"%d\", &N);\n    for (i = 2; i <= N; i++) {{\n        fat = fat * i;\n    }}\n    printf(\"%lld\\n\", fat);\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\nusing namespace std;\n\nint main() {{\n    int N;\n    long long fat = 1;\n    cin >> N;\n    for (int i = 2; i <= N; i++) {{\n        fat = fat * i;\n    }}\n    cout << fat << endl;\n    return 0;\n}}\n",
        },
        "Fibonacci": {
            "python": "# {t}\n# {s}\n\nN = int(input())\nseq = []\na, b = 0, 1\nfor _ in range(N):\n    seq.append(a)\n    a, b = b, a + b\nprint(\" \".join(map(str, seq)))\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int N, i, a = 0, b = 1, temp;\n    scanf(\"%d\", &N);\n    for (i = 0; i < N; i++) {{\n        printf(\"%d%c\", a, (i < N - 1) ? ' ' : '\\n');\n        temp = a + b;\n        a = b;\n        b = temp;\n    }}\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\nusing namespace std;\n\nint main() {{\n    int N, a = 0, b = 1;\n    cin >> N;\n    for (int i = 0; i < N; i++) {{\n        cout << a << (i < N - 1 ? \" \" : \"\\n\");\n        int temp = a + b;\n        a = b;\n        b = temp;\n    }}\n    return 0;\n}}\n",
        },
        "Inverter String": {
            "python": "# {t}\n# {s}\n\nS = input()\nprint(S[::-1])\n",
            "c": "/* {t} */\n#include <stdio.h>\n#include <string.h>\n\nint main() {{\n    char S[1000];\n    int i, len;\n    scanf(\"%s\", S);\n    len = strlen(S);\n    for (i = len - 1; i >= 0; i--) {{\n        printf(\"%c\", S[i]);\n    }}\n    printf(\"\\n\");\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {{\n    string S;\n    cin >> S;\n    reverse(S.begin(), S.end());\n    cout << S << endl;\n    return 0;\n}}\n",
        },
        "Soma dos Elementos": {
            "python": "# {t}\n# {s}\n\nN = int(input())\nvalores = input().split()\nsoma = 0\nfor v in valores:\n    soma = soma + int(v)\nprint(soma)\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int N, i, v, soma = 0;\n    scanf(\"%d\", &N);\n    for (i = 0; i < N; i++) {{\n        scanf(\"%d\", &v);\n        soma = soma + v;\n    }}\n    printf(\"%d\\n\", soma);\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\nusing namespace std;\n\nint main() {{\n    int N, v, soma = 0;\n    cin >> N;\n    for (int i = 0; i < N; i++) {{\n        cin >> v;\n        soma = soma + v;\n    }}\n    cout << soma << endl;\n    return 0;\n}}\n",
        },
        "Acima da Media": {
            "python": "# {t}\n# {s}\n\nN = int(input())\nnotas = list(map(int, input().split()))\nmedia = sum(notas) // N\nprint(media, sum(1 for n in notas if n > media), sep=\"\\n\")\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int N, soma = 0, acima = 0, media, notas[1000];\n    scanf(\"%d\", &N);\n    for (int i = 0; i < N; i++) {{\n        scanf(\"%d\", &notas[i]);\n        soma += notas[i];\n    }}\n    media = soma / N;\n    for (int i = 0; i < N; i++)\n        if (notas[i] > media) acima++;\n    printf(\"%d\\n%d\\n\", media, acima);\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {{\n    int N, soma = 0, acima = 0, media;\n    cin >> N;\n    vector<int> notas(N);\n    for (int i = 0; i < N; i++) {{\n        cin >> notas[i];\n        soma += notas[i];\n    }}\n    media = soma / N;\n    for (int n : notas)\n        if (n > media) acima++;\n    cout << media << \"\\n\" << acima << endl;\n    return 0;\n}}\n",
        },
        "Contagem de Ocorrencias": {
            "python": "# {t}\n# {s}\n\nN = int(input())\nnums = list(map(int, input().split()))\nR = int(input())\nprint(sum(1 for x in nums if x > R), sum(1 for x in nums if x < R), nums.count(R))\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int N, i, R, nums[1000], maior = 0, menor = 0, iguais = 0;\n    scanf(\"%d\", &N);\n    for (i = 0; i < N; i++) scanf(\"%d\", &nums[i]);\n    scanf(\"%d\", &R);\n    for (i = 0; i < N; i++) {{\n        if (nums[i] > R) maior++;\n        else if (nums[i] < R) menor++;\n        else iguais++;\n    }}\n    printf(\"%d %d %d\\n\", maior, menor, iguais);\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {{\n    int N, R, maior = 0, menor = 0, iguais = 0;\n    cin >> N;\n    vector<int> nums(N);\n    for (int i = 0; i < N; i++) cin >> nums[i];\n    cin >> R;\n    for (int x : nums) {{\n        if (x > R) maior++;\n        else if (x < R) menor++;\n        else iguais++;\n    }}\n    cout << maior << \" \" << menor << \" \" << iguais << endl;\n    return 0;\n}}\n",
        },
        "Inverter Vetor": {
            "python": "# {t}\n# {s}\n\nN = int(input())\nnums = list(map(int, input().split()))\nnums.reverse()\nprint(\" \".join(map(str, nums)))\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int N, i, nums[1000];\n    scanf(\"%d\", &N);\n    for (i = 0; i < N; i++) scanf(\"%d\", &nums[i]);\n    for (i = N - 1; i >= 0; i--) {{\n        if (i < N - 1) printf(\" \");\n        printf(\"%d\", nums[i]);\n    }}\n    printf(\"\\n\");\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {{\n    int N;\n    cin >> N;\n    vector<int> nums(N);\n    for (int i = 0; i < N; i++) cin >> nums[i];\n    reverse(nums.begin(), nums.end());\n    for (int i = 0; i < N; i++) {{\n        if (i) cout << \" \";\n        cout << nums[i];\n    }}\n    cout << endl;\n    return 0;\n}}\n",
        },
        "Filtrar Pares": {
            "python": "# {t}\n# {s}\n\nN = int(input())\nnums = list(map(int, input().split()))\npares = [x for x in nums if x % 2 == 0]\nprint(\" \".join(map(str, pares)) if pares else \"VAZIO\")\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nint main() {{\n    int N, i, nums[1000], prim = 1;\n    scanf(\"%d\", &N);\n    for (i = 0; i < N; i++) scanf(\"%d\", &nums[i]);\n    for (i = 0; i < N; i++) {{\n        if (nums[i] % 2 == 0) {{\n            if (!prim) printf(\" \");\n            printf(\"%d\", nums[i]);\n            prim = 0;\n        }}\n    }}\n    if (prim) printf(\"VAZIO\");\n    printf(\"\\n\");\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {{\n    int N, prim = 1;\n    cin >> N;\n    vector<int> nums(N);\n    for (int i = 0; i < N; i++) cin >> nums[i];\n    for (int x : nums) {{\n        if (x % 2 == 0) {{\n            if (!prim) cout << \" \";\n            cout << x;\n            prim = 0;\n        }}\n    }}\n    if (prim) cout << \"VAZIO\";\n    cout << endl;\n    return 0;\n}}\n",
        },
        "Verificacao de Parenteses": {
            "python": "# {t}\n# {s}\n\nexpr = input()\npilha = 0\nok = True\nfor ch in expr:\n    if ch == \"(\":\n        pilha += 1\n    elif ch == \")\":\n        pilha -= 1\n        if pilha < 0:\n            ok = False\nif pilha != 0:\n    ok = False\nprint(\"SIM\" if ok else \"NAO\")\n",
            "c": "/* {t} */\n#include <stdio.h>\n#include <string.h>\n\nint main() {{\n    char expr[1000];\n    int i, len, pilha = 0, ok = 1;\n    scanf(\"%s\", expr);\n    len = strlen(expr);\n    for (i = 0; i < len; i++) {{\n        if (expr[i] == '(') {{\n            pilha++;\n        }} else if (expr[i] == ')') {{\n            pilha--;\n            if (pilha < 0) ok = 0;\n        }}\n    }}\n    if (pilha != 0) ok = 0;\n    printf(\"%s\\n\", ok ? \"SIM\" : \"NAO\");\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {{\n    string expr;\n    int pilha = 0;\n    bool ok = true;\n    cin >> expr;\n    for (char ch : expr) {{\n        if (ch == '(') {{\n            pilha++;\n        }} else if (ch == ')') {{\n            pilha--;\n            if (pilha < 0) ok = false;\n        }}\n    }}\n    if (pilha != 0) ok = false;\n    cout << (ok ? \"SIM\" : \"NAO\") << endl;\n    return 0;\n}}\n",
        },
        "Potencia Recursiva": {
            "python": "# {t}\n# {s}\n\ndef potencia(x, n):\n    if n == 0:\n        return 1\n    return x * potencia(x, n - 1)\n\nvalores = input().split()\nX = int(valores[0])\nN = int(valores[1])\nprint(potencia(X, N))\n",
            "c": "/* {t} */\n#include <stdio.h>\n\nlong long potencia(int x, int n) {{\n    if (n == 0) return 1;\n    return x * potencia(x, n - 1);\n}}\n\nint main() {{\n    int X, N;\n    scanf(\"%d %d\", &X, &N);\n    printf(\"%lld\\n\", potencia(X, N));\n    return 0;\n}}\n",
            "cpp": "// {t}\n#include <iostream>\nusing namespace std;\n\nlong long potencia(int x, int n) {{\n    if (n == 0) return 1;\n    return x * potencia(x, n - 1);\n}}\n\nint main() {{\n    int X, N;\n    cin >> X >> N;\n    cout << potencia(X, N) << endl;\n    return 0;\n}}\n",
        },
    }

    def starter_code() -> str:
        chosen = starters.get(ex["title"], starters["Soma de Dois Numeros"])
        code = chosen.get(language, chosen["python"])
        return code.format(t=ex["title"], s=ex["statement"])

    return {
        "id": f"custom_{topic_lower}",
        "title": ex["title"],
        "statement": ex["statement"],
        "topic": topic,
        "difficulty": difficulty,
        "inputFormat": ex["inputFormat"],
        "outputFormat": ex["outputFormat"],
        "test_cases": ex["test_cases"],
        "starter_code": starter_code(),
    }


@router.post("/generate-exercise")
def generate_exercise(req: ExerciseRequest):
    return _generate_new_exercise(req.topic, req.difficulty, req.language)


class TextExerciseRequest(BaseModel):
    description: str
    language: str = "python"
    difficulty: int = 1


_TOPIC_KEYWORDS = {
    "recursao": ["recursi", "potencia", "recursiva"],
    "estruturas_dados": ["pilha", "fila", "parenteses", "lista encadeada", "arvore", "balancead"],
    "arrays": ["vetor", "array", "lista", "elementos", "sequencia", "na ordem", "ordem inversa", "reverter", "inverta o vetor", "ocorrencia", "contagem", "acima da media", "pares", "media das notas", "armazene-os em um vetor", "armazene em um vetor"],
    "strings": ["string", "texto", "vogal", "palavra", "inverta", "maiuscula", "minuscula", "caractere"],
    "loops": ["loop", "repeti", "tabuada", "fatorial", "fibonacci", "contar de", "de 1 a", "ate n"],
    "condicionais": ["par", "impar", "positivo", "negativo", "maior", "menor", "condicao", "classifique", "compare", "se for", "aprovado", "reprovado", "recuperacao"],
    "variaveis": ["soma", "multiplica", "divisao", "resto", "media", "numero", "inteiro", "calcule", "calcular", "leia dois"],
}


def _detect_topic(description: str) -> str:
    text = (description or "").lower()
    for topic, kws in _TOPIC_KEYWORDS.items():
        if any(kw in text for kw in kws):
            return topic
    return "variaveis"


def _validate_generated_solution(language: str, solution: str, test_cases: list) -> bool:
    """Executa a solucao gerada contra os test_cases; True so se TODOS passarem.

    Garante que o gabarito devolvido pelo juiz esteja correto (mesmo quando a IA
    gera codigo quebrado ou gabarito inconsistente com os testes).
    """
    if not solution or not test_cases:
        return False
    conf = LANG_NAMES.get(language)
    if not conf:
        return False
    try:
        for tc in test_cases:
            inp = str(tc.get("input", ""))
            expected = _normalize(str(tc.get("expected", "")))
            result = _run_local(conf, solution, inp)
            if not result:
                result = _run(language, solution, inp)
            if not result:
                return False
            stdout = _normalize(result.get("run", {}).get("stdout", ""))
            if stdout != expected:
                logger.info(f"generate_from_text: solucao divergente. esperado={expected!r} obtido={stdout!r}")
                return False
    except Exception as e:
        logger.warning(f"generate_from_text: validacao falhou ({type(e).__name__}): {str(e)[:200]}")
        return False
    return True


def _generate_from_text_ai(description: str, language: str, custom_key: Optional[str]) -> Optional[dict]:
    """Tenta gerar o exercicio completo (com resposta) via IA."""
    lang_name = {"c": "C", "cpp": "C++", "python": "Python 3"}.get(language, language)
    system_prompt = (
        "Voce e um professor de programacao que cria exercicios no modelo de juiz online "
        "(Beecrowd/URI). Responda APENAS com JSON valido (sem markdown, sem ```)."
    )
    user_prompt = (
        f"Crie um exercicio de programacao em {lang_name} a partir desta solicitacao do aluno:\n\n"
        f'"{description}"\n\n'
        "Responda com JSON EXATAMENTE neste formato:\n"
        '{"title": "titulo curto", '
        '"statement": "enunciado completo do problema, como um juiz online", '
        '"input_format": "descricao da entrada", '
        '"output_format": "descricao da saida", '
        '"examples": [{"input": "...", "output": "..."}], '
        '"test_cases": [{"input": "...", "expected": "..."}], '
        '"solution": "codigo COMPLETO e funcional da resposta em ' + lang_name + '", '
        '"explanation": "explicacao didatica passo a passo da solucao"}'
        "\n\nRegras: no minimo 2 test_cases; solution deve ler a entrada, calcular e imprimir "
        "exatamente o que os test_cases esperam; statement em portugues."
        "\nIMPORTANTE: gere APENAS UM exercicio. Se a solicitacao contiver varios itens "
        "numerados (1., 2., ...), crie UM exercicio unico que englobe a questao completa "
        "(o mais completo possivel), nunca um exercicio por item."
    )
    # max_tokens moderado: modelos de fallback do Groq (ex. gpt-oss-20b) tem teto
    # menor que 8000 e rejeitam a requisicao; o parser leniente abaixo cobre o caso
    # real de resposta longa (que tinha quebras de linha e aspas cruas no JSON).
    for attempt in range(2):
        raw = _call_ai(system_prompt, user_prompt, custom_key, max_tokens=4096)
        if not raw:
            continue
        try:
            data = _json_lenient(raw)
            if not isinstance(data, dict):
                logger.error(f"generate_from_text: IA retornou JSON nao-objeto: {type(data).__name__}")
                continue
            title = str(data.get("title") or "Exercicio Gerado")[:120]
            statement = str(data.get("statement") or "").strip()
            solution = str(data.get("solution") or "").strip()
            explanation = str(data.get("explanation") or "").strip()
            if not statement or not solution:
                continue
            # A IA as vezes envolve o codigo em aspas/ticks de bloco -> limpa
            if solution.startswith('"""') or solution.startswith("'''"):
                solution = solution[3:]
            if solution.endswith('"""') or solution.endswith("'''"):
                solution = solution[:-3]
            sol_lines = [ln.strip() for ln in solution.split("\n")]
            while sol_lines and (sol_lines[0] in ('"', "'", "`", '"""', "'''", "```")
                                 or (sol_lines[0] and set(sol_lines[0]) <= {'"', "'", "`"})):
                sol_lines.pop(0)
            while sol_lines and (sol_lines[-1] in ('"', "'", "`", '"""', "'''", "```")
                                 or (sol_lines[-1] and set(sol_lines[-1]) <= {'"', "'", "`"})):
                sol_lines.pop()
            solution = "\n".join(sol_lines).strip()
            examples = data.get("examples") or []
            if not isinstance(examples, list):
                examples = []
            test_cases = data.get("test_cases") or []
            if not isinstance(test_cases, list):
                test_cases = []
            for ex in examples:
                if isinstance(ex, dict) and {"input", "output"} <= set(ex.keys()):
                    if not any(t.get("input") == ex["input"] for t in test_cases):
                        test_cases.append({"input": str(ex["input"]), "expected": str(ex["output"])})
            test_cases = [
                {"input": str(t.get("input", "")), "expected": str(t.get("expected", ""))}
                for t in test_cases if t.get("input") is not None
            ][:6]
            if not test_cases:
                continue
            # VALIDACAO: o gabarito precisa passar nos testes antes de ser devolvido
            if not _validate_generated_solution(language, solution, test_cases):
                logger.info(f"generate_from_text: tentativa {attempt + 1} da IA reprovada na validacao")
                continue
            return {
                "title": title,
                "statement": statement,
                "input_format": str(data.get("input_format") or "Entrada conforme o enunciado"),
                "output_format": str(data.get("output_format") or "Saida conforme o enunciado"),
                "examples": examples[:3],
                "test_cases": test_cases,
                "solution": solution,
                "explanation": explanation,
            }
        except Exception as e:
            logger.error(f"generate_from_text: parse da IA falhou ({type(e).__name__}): {str(e)[:200]}")
            continue
    return None


@router.post("/generate-from-text")
def generate_from_text(req: TextExerciseRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    """Cria um exercicio no modelo do juiz a partir de um texto livre, com a resposta (gabarito).

    Usa IA quando há chave configurada; caso contrário, cai em um banco real de
    exercícios correspondente ao tema detectado.
    """
    description = (req.description or "").strip()
    if len(description) < 10:
        raise HTTPException(status_code=400, detail="Descreva o exercício com pelo menos 10 caracteres")
    req.language = req.language if req.language in ("python", "c", "cpp") else "python"
    req.difficulty = max(1, min(5, req.difficulty or 1))

    gen_key = ("from_text", description, req.language, req.difficulty)
    cached = _cache_lookup(_gen_cache, gen_key, _db_cache_key("from_text", (description, req.language, req.difficulty)))
    if cached:
        logger.info("Exercicio reutilizado do cache (sem gastar creditos)")
        return cached

    topic = _detect_topic(description)
    try:
        generated = _generate_from_text_ai(description, req.language, x_custom_api_key)
    except Exception:
        logger.exception("generate_from_text: IA falhou com excecao; usando banco")
        generated = None

    if generated:
        topic_meta = {"id": topic, "name": topic, "description": ""}
        result = {
            "id": f"text_{abs(hash(description)) % 100000}",
            "title": generated["title"],
            "statement": generated["statement"],
            "topic": topic_meta,
            "difficulty": req.difficulty,
            "inputFormat": generated["input_format"],
            "outputFormat": generated["output_format"],
            "examples": generated["examples"],
            "test_cases": generated["test_cases"],
            "starter_code": {
                "python": "# seu codigo aqui\n",
                "c": "#include <stdio.h>\n\nint main() {\n    // seu codigo aqui\n    return 0;\n}\n",
                "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // seu codigo aqui\n    return 0;\n}\n",
            }.get(req.language, "# seu codigo aqui\n"),
            "solution": generated["solution"],
            "explanation": generated["explanation"],
            "mode": "ia",
        }
        _cache_store(_gen_cache, gen_key, _db_cache_key("from_text", (description, req.language, req.difficulty)), result)
        return result

    base = _generate_new_exercise(topic, req.difficulty, req.language, description)
    explanation = (
        f"O programa deve: (1) ler a entrada descrita em '{base['inputFormat']}'; "
        f"(2) aplicar a logica do enunciado; (3) imprimir exatamente '{base['outputFormat']}'. "
        "A solução abaixo já atende aos casos de teste do exercício. "
        "Para fixar: execute, confira a saída esperada e tente reescrever do zero sem olhar."
    )
    result = {
        "id": f"text_{abs(hash(description)) % 100000}",
        "title": base["title"],
        "statement": base["statement"],
        "topic": topic,
        "difficulty": req.difficulty,
        "inputFormat": base["inputFormat"],
        "outputFormat": base["outputFormat"],
        "examples": base["test_cases"][:2],
        "test_cases": base["test_cases"],
        "starter_code": base["starter_code"],
        "solution": base["starter_code"],
        "explanation": explanation,
        "mode": "banco",
    }
    _cache_store(_gen_cache, gen_key, _db_cache_key("from_text", (description, req.language, req.difficulty)), result)
    return result


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


class SimilarExerciseRequest(BaseModel):
    topic: str
    difficulty: int = 1
    language: str = "python"
    original_title: str = ""


@router.post("/generate-similar")
def generate_similar_exercise(req: SimilarExerciseRequest):
    import random
    similar_db = {
        "variaveis": [
            {"title": "Multiplicacao de Inteiros", "statement": "Leia dois inteiros A e B e imprima o produto A * B.",
             "inputFormat": "Dois inteiros A B", "outputFormat": "Um inteiro (A*B)",
             "test_cases": [{"input": "3 4", "expected": "12"}, {"input": "7 1", "expected": "7"}, {"input": "0 5", "expected": "0"}]},
            {"title": "Diferenca Absoluta", "statement": "Leia dois inteiros A e B e imprima a diferenca absoluta |A - B|.",
             "inputFormat": "Dois inteiros A B", "outputFormat": "Um inteiro (modulo da diferenca)",
             "test_cases": [{"input": "10 3", "expected": "7"}, {"input": "3 10", "expected": "7"}, {"input": "5 5", "expected": "0"}]},
            {"title": "Media de Notas", "statement": "Leia 3 notas (float) e imprima a media aritmetica.",
             "inputFormat": "Tres numeros reais", "outputFormat": "A media com 1 casa decimal",
             "test_cases": [{"input": "7.0 8.0 9.0", "expected": "8.0"}, {"input": "5.5 6.5 7.5", "expected": "6.5"}]},
            {"title": "Resto da Divisao", "statement": "Leia dois inteiros A e B e imprima o resto da divisao A / B.",
             "inputFormat": "Dois inteiros A B", "outputFormat": "Um inteiro (resto)",
             "test_cases": [{"input": "10 3", "expected": "1"}, {"input": "7 2", "expected": "1"}, {"input": "8 4", "expected": "0"}]},
        ],
        "condicionais": [
            {"title": "Positivo Negativo ou Zero", "statement": "Leia um inteiro e diga se e POSITIVO, NEGATIVO ou ZERO.",
             "inputFormat": "Um inteiro N", "outputFormat": "POSITIVO, NEGATIVO ou ZERO",
             "test_cases": [{"input": "5", "expected": "POSITIVO"}, {"input": "-3", "expected": "NEGATIVO"}, {"input": "0", "expected": "ZERO"}]},
            {"title": "Maior de Dois", "statement": "Leia dois inteiros e mostre o maior.",
             "inputFormat": "Dois inteiros A B", "outputFormat": "O maior valor",
             "test_cases": [{"input": "3 7", "expected": "7"}, {"input": "10 5", "expected": "10"}, {"input": "4 4", "expected": "4"}]},
            {"title": "Classificacao de Idade", "statement": "Leia uma idade e classifique: crianca (<12), adolescente (12-17), adulto (>=18).",
             "inputFormat": "Um inteiro idade", "outputFormat": "Classificacao",
             "test_cases": [{"input": "10", "expected": "crianca"}, {"input": "15", "expected": "adolescente"}, {"input": "25", "expected": "adulto"}]},
        ],
        "loops": [
            {"title": "Tabuada", "statement": "Leia um inteiro N e imprima a tabuada de 1 a 10.",
             "inputFormat": "Um inteiro N", "outputFormat": "10 linhas: N x i = resultado",
             "test_cases": [{"input": "3", "expected": "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30"}]},
            {"title": "Soma de 1 a N", "statement": "Leia N e calcule a soma de 1 + 2 + ... + N.",
             "inputFormat": "Um inteiro N", "outputFormat": "A soma total",
             "test_cases": [{"input": "5", "expected": "15"}, {"input": "10", "expected": "55"}, {"input": "1", "expected": "1"}]},
        ],
        "strings": [
            {"title": "Contar Vogais", "statement": "Leia uma string e conte quantas vogais tem.",
             "inputFormat": "Uma string S", "outputFormat": "Numero de vogais",
             "test_cases": [{"input": "hello", "expected": "2"}, {"input": "aeiou", "expected": "5"}, {"input": "xyz", "expected": "0"}]},
            {"title": "Maiusculas e Minusculas", "statement": "Leia uma string e imprima em maiusculas e depois em minusculas.",
             "inputFormat": "Uma string S", "outputFormat": "Duas linhas: MAIUSCULA e minuscula",
             "test_cases": [{"input": "Hello", "expected": "HELLO\nhello"}]},
        ],
        "arrays": [
            {"title": "Maior e Menor", "statement": "Leia N numeros e encontre o maior e o menor.",
             "inputFormat": "N seguido de N numeros", "outputFormat": "Maior e menor",
             "test_cases": [{"input": "5\n3 7 1 9 4", "expected": "9 1"}]},
            {"title": "Inverter Array", "statement": "Leia N numeros e imprima na ordem inversa.",
             "inputFormat": "N seguido de N numeros", "outputFormat": "Numeros na ordem inversa",
             "test_cases": [{"input": "3\n1 2 3", "expected": "3 2 1"}]},
        ],
        "estruturas_dados": [
            {"title": "Pilha Simples", "statement": "Implemente uma pilha com push, pop e peek.",
             "inputFormat": "Operacoes: push X, pop, peek", "outputFormat": "Resultado de cada operacao",
             "test_cases": [{"input": "push 1\npush 2\npeek\npop\npeek", "expected": "1\n2\n2"}]},
        ],
        "recursao": [
            {"title": "Fibonacci Recursivo", "statement": "Calcule o N-esimo numero de Fibonacci usando recursao.",
             "inputFormat": "Um inteiro N", "outputFormat": "O N-esimo Fibonacci",
             "test_cases": [{"input": "5", "expected": "5"}, {"input": "0", "expected": "0"}, {"input": "1", "expected": "1"}]},
            {"title": "Soma Recursiva", "statement": "Calcule a soma dos elementos de uma lista usando recursao.",
             "inputFormat": "Lista de inteiros", "outputFormat": "A soma",
             "test_cases": [{"input": "1 2 3 4", "expected": "10"}, {"input": "5", "expected": "5"}]},
        ],
    }

    topic_lower = req.topic.lower().replace(" ", "_").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    possible = similar_db.get(topic_lower, similar_db["variaveis"])

    same_topic = [e for e in possible if e["title"] != req.original_title]
    if not same_topic:
        same_topic = possible

    ex = random.choice(same_topic)

    starter_codes = {
        "python": f"# {ex['title']}\n# {ex['statement']}\n\n# seu codigo aqui\n",
        "c": f"/* {ex['title']} */\n#include <stdio.h>\n\nint main() {{\n    // seu codigo aqui\n    return 0;\n}}\n",
        "cpp": f"// {ex['title']}\n#include <iostream>\nusing namespace std;\n\nint main() {{\n    // seu codigo aqui\n    return 0;\n}}\n",
    }

    return {
        "id": f"similar_{topic_lower}_{random.randint(1000,9999)}",
        "title": ex["title"],
        "statement": ex["statement"],
        "topic": req.topic,
        "difficulty": req.difficulty,
        "inputFormat": ex["inputFormat"],
        "outputFormat": ex["outputFormat"],
        "test_cases": ex["test_cases"],
        "starter_code": starter_codes.get(req.language, starter_codes["python"]),
    }


class QuestionRequest(BaseModel):
    language: str = "python"
    code: str = ""
    statement: str = ""
    topic: str = ""
    question: str = ""


@router.post("/question")
def ask_question(req: QuestionRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Pergunta vazia.")

    lang_name = {"c": "C", "cpp": "C++", "python": "Python"}.get(req.language, "Python")

    system_prompt = f"""Voce e um professor de programacao {lang_name} expert e paciente. 
O aluno esta resolvendo um exercicio do juiz online e tem uma duvida.
Responda de forma clara, didatica e em portugues. Seja objetivo mas completo.
Se for relevante, referenciom codigos ou conceitos do exercicio.

{PEDAGOGY_RULES}

Se a duvida for sobre uma expressao/conceito especifico, use o formato:
EXPRESSAO: <nome>
O QUE E: <definicao>
POR QUE: <uso neste exercicio>
SEM ELA: <o que aconteceria>
QUANDO USAR: <regra pratica>
COMO IDENTIFICAR NO ENUNCIADO: <palavras que indicam>
ALTERNATIVAS: <outras formas>"""

    code_section = f"\n\nCODIGO DO ALUNO ({lang_name}):\n```{req.language}\n{req.code}\n```" if req.code.strip() else ""
    ctx_parts = []
    if req.statement:
        ctx_parts.append(f"ENUNCIADO DO EXERCICIO:\n{req.statement}")
    if req.topic:
        ctx_parts.append(f"TÓPICO: {req.topic}")
    if code_section:
        ctx_parts.append(code_section.strip())

    context = "\n\n".join(ctx_parts)

    user_prompt = f"""DUVIDA DO ALUNO:
{req.question}

CONTEXTO DO EXERCICIO:
{context}"""

    raw = _call_ai(system_prompt, user_prompt, x_custom_api_key)
    if raw:
        return {"answer": raw, "ok": True}

    return {
        "answer": "Desculpe, nao consegui processar sua duvida agora. Tente reformular a pergunta ou verifique se a API de IA esta configurada.",
        "ok": False,
    }


class DictionarySearchRequest(BaseModel):
    query: str
    language: str = ""


def _normalize_query(q: str) -> str:
    return (q or "").lower().strip()


def _search_expressions(query: str, language: str = "") -> list:
    """Pesquisa no dicionario por nome de expressao, categoria, objetivo ou descricao."""
    q = _normalize_query(query)
    if not q:
        return []
    lang = language.lower()
    results = []
    for e in EXPRESSIONS:
        if lang and e["language"] != lang:
            continue
        haystack = _normalize_query(
            e["expression"] + " " + e["category"] + " " + e["purpose"] + " "
            + e["what_is"] + " " + e["how_to_identify"] + " " + e["when_to_use"]
            + " " + " ".join(e.get("keywords", [])) + " " + " ".join(e.get("related", []))
        )
        # Busca por fragmento do nome da expressao (ex: "split" acha "split()")
        expr = e["expression"].lower().replace("()", "").replace("(", "").replace(")", "")
        matched = False
        for token in q.split():
            if token in haystack or token in expr or token in e["expression"].lower():
                matched = True
                break
        if matched:
            results.append(e)
    return results


def _search_objectives(query: str, language: str = "") -> list:
    """Pesquisa reversa: o aluno diz o OBJETIVO e o sistema recomenda expressoes."""
    q = _normalize_query(query)
    if not q:
        return []
    lang = language.lower()
    results = []
    for o in OBJECTIVES:
        if lang and o.get("language") and o["language"] != lang:
            continue
        haystack = _normalize_query(o["objective"] + " " + " ".join(o["keywords"]))
        if any(tok in haystack for tok in q.split()):
            results.append(o)
    return results


def _search_patterns(query: str, language: str = "") -> list:
    q = _normalize_query(query)
    if not q:
        return []
    lang = language.lower()
    results = []
    for p in PATTERNS:
        if lang and p.get("language") and p["language"] != lang:
            continue
        haystack = _normalize_query(p["name"] + " " + p["explanation"] + " " + " ".join(p["expressions"]))
        if any(tok in haystack for tok in q.split()):
            results.append(p)
    return results


@router.post("/dictionary/search")
def dictionary_search(req: DictionarySearchRequest):
    """Pesquisa por expressao, objetivo ou problema no Dicionario Inteligente."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Pesquisa vazia.")
    return {
        "query": req.query,
        "language": req.language,
        "expressions": _search_expressions(req.query, req.language),
        "objectives": _search_objectives(req.query, req.language),
        "patterns": _search_patterns(req.query, req.language),
    }


@router.post("/dictionary/objective")
def dictionary_objective(req: DictionarySearchRequest):
    """Pesquisa reversa: informa o OBJETIVO e devolve as expressoes recomendadas."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Objetivo vazio.")
    objectives = _search_objectives(req.query, req.language)
    if not objectives:
        # fallback: busca ampla no dicionario e agrupa por categoria
        expressions = _search_expressions(req.query, req.language)
        return {
            "query": req.query,
            "language": req.language,
            "objectives": [],
            "expressions": expressions,
            "message": "Nenhum objetivo exato encontrado; mostrando expressoes relacionadas.",
        }
    recommended = {}
    for o in objectives:
        for expr in o["expressions"]:
            entries = [e for e in EXPRESSIONS if e["expression"] == expr]
            if entries:
                recommended[expr] = entries[0]
    return {
        "query": req.query,
        "language": req.language,
        "objectives": objectives,
        "recommended": list(recommended.values()),
    }


@router.get("/dictionary")
def dictionary_all(language: str = ""):
    """Lista todo o dicionario (filtro opcional por linguagem: python, c, cpp)."""
    lang = language.lower()
    entries = [e for e in EXPRESSIONS if not lang or e["language"] == lang]
    categories = {}
    for e in entries:
        categories.setdefault(e["category"], []).append(e["expression"])
    return {
        "total": len(entries),
        "categories": categories,
        "expressions": entries,
    }


class ExplainSolutionRequest(BaseModel):
    language: str
    code: str
    statement: str = ""
    input: str = ""
    expected: str = ""
    test_cases: List[TestCase] = []


def _expr_match_keys(expr: str) -> list:
    """
    Gera chaves de busca para casar uma expressao do dicionario com codigo.
    - 'input()' -> ['input', 'input()']
    - 'if / elif / else' -> 'if', 'elif', 'else'
    - 'for ... in range()' -> 'for', 'range', 'range()'
    """
    keys = set()
    e = expr.strip().lower()
    for part in e.split("/"):
        part = part.strip()
        if not part:
            continue
        if part.endswith("()"):
            keys.add(part[:-2])
        keys.add(part)
        for tok in re.findall(r"[a-z_][a-z0-9_]*", part):
            keys.add(tok)
    return [k for k in keys if k]


def _line_matches_expr(line: str, entry: dict) -> bool:
    """Verifica se uma linha de codigo contem a expressao do dicionario."""
    low = line.lower()
    expr = entry["expression"].lower()
    # Normaliza sufixos tipo "(cpp)", "(resto / modulo)", "(vetor/array)"
    expr_norm = re.sub(r"\s*\([^)]*\)\s*$", "", expr)

    # Operadores e construcoes especiais (nao sao identificadores simples)
    special = {
        "=": r"(?<![=!<>+\-*/%])=(?!=)",
        "+": r"(?<![+\-*/%])[+](?![+\-*/])",
        "-": r"(?<![\+\-*/])-(?![\+\-*/])",
        "*": r"(?<![+\-*/])[*](?![+\-*/])",
        "/": r"(?<![/])/(?![/])",
        "==": r"(?<![=!<>+\-*/])==(?!=)",
        "!=": r"!=",
        "+=": r"(?<![=!<>+\-*/%])\+=(?!=)",
        ">": r"(?:[\w\d]|\]|\))\s+>\s+[\w\d(]",
        "<": r"(?<!include )(?:[\w\d]|\]|\))\s+<\s+[\w\d(]",
        ">= / <=": r">=|<=",
        "&& / || / !": r"&&|\|\||(?<![\w=!])!(?!=)",
        "%": r"\s%\s",
        "% (resto / modulo)": r"\s%\s",
        "list / [ ]": r"(?:\blist\b|\[)",
        "f-string": r"f[\"']",
        "int main() { }": r"\bmain\s*\(",
        "vector<int>": r"\bvector\b",
        "int / float / double / char": r"\b(?:int|float|double|char)\s+(?!main\s*\()\w+",
        "int v[n];": r"\bint\s+\w+\s*\[",
        "for (int i = 0; ... )": r"\bfor\s*\(",
        "#include <iostream>": r"#include\s*<\s*(?:iostream|bits/stdc\+\+\.h)\s*>",
        "#include <vector>": r"#include\s*<\s*vector\s*>",
        "#include <stdio.h>": r"#include\s*<\s*stdio\.h\s*>",
        "#include <string.h>": r"#include\s*<\s*string\.h\s*>",
        "&": r"&[A-Za-z_]",
        "string": r"\bstring\b",
    }
    if expr in special:
        return bool(re.search(special[expr], line))
    if expr_norm in special:
        return bool(re.search(special[expr_norm], line))

    for k in _expr_match_keys(expr):
        if re.search(r"\b" + re.escape(k) + r"\b", low):
            return True
    return False


def _extract_expressions_from_code(code: str, language: str) -> list:
    """Identifica expressoes conhecidas presentes no codigo, a partir do dicionario."""
    found = []
    for e in EXPRESSIONS:
        if e["language"] != language:
            continue
        for raw_line in code.split("\n"):
            if _line_matches_expr(raw_line, e):
                found.append(e)
                break
    return found


def _enrich_step_expressions(step: dict, language: str) -> dict:
    """
    Garante que o passo detalhe TODAS as expressoes do dicionario presentes
    na linha, mesmo que a IA nao tenha retornado o campo `expressions`.
    """
    code_line = step.get("code") or ""
    dict_hits = [e for e in EXPRESSIONS if e["language"] == language and _line_matches_expr(code_line, e)]

    ai_exprs = step.get("expressions") if isinstance(step.get("expressions"), list) else []
    merged = []
    seen = set()

    def norm(name: str) -> str:
        return (name or "").lower().replace("()", "").replace("(", "").replace(")", "").strip()

    for x in ai_exprs:
        if isinstance(x, dict) and x.get("expression"):
            name = x["expression"]
            if norm(name) not in seen:
                seen.add(norm(name))
                merged.append(x)

    for e in dict_hits:
        if norm(e["expression"]) in seen:
            continue
        seen.add(norm(e["expression"]))
        merged.append({k: v for k, v in e.items()})

    step["expressions"] = merged
    return step


def _enrich_steps(steps: list, language: str) -> list:
    """Aplica o enriquecimento de expressoes a todos os passos."""
    for step in steps:
        if isinstance(step, dict):
            _enrich_step_expressions(step, language)
    return steps


def _enrich_explanation(explanation: dict, language: str) -> dict:
    """Enriquece os passos de uma explicacao (IA ou fallback) com as expressoes do dicionario."""
    if explanation and isinstance(explanation.get("step_by_step"), list):
        _enrich_steps(explanation["step_by_step"], language)
    return explanation


@router.post("/explain-solution")
def explain_solution(req: ExplainSolutionRequest, x_custom_api_key: Optional[str] = Header(None, alias="X-Custom-API-Key")):
    """
    Analise pedagogica COMPLETA de uma solucao (especificacao secao 20):
    o que o problema pede, estrategia, codigo, linha por linha, POR QUE cada
    expressao foi usada, como reconhecer em outros exercicios, alternativas,
    dicionario, testes reais, complexidade e veredito do juiz.
    """
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Codigo vazio.")

    lang_name = {"c": "C", "cpp": "C++", "python": "Python"}.get(req.language, req.language)

    # 1) Execucao REAL de cada caso de teste (nunca inventar resultados)
    stdin = req.input or (req.test_cases[0].input if req.test_cases else "")
    test_results = []
    total = len(req.test_cases)
    passed = 0
    run_error = None
    for i, tc in enumerate(req.test_cases):
        try:
            res = _run(req.language, req.code, tc.input)
            run = res.get("run") or {}
            compile_err = (res.get("compile") or {}).get("code") or 0
            if compile_err:
                test_results.append({
                    "index": i + 1, "input": tc.input, "expected": tc.expected,
                    "actual": "", "passed": False, "error": (res.get("compile") or {}).get("stderr", "")[:300],
                })
                continue
            output = _normalize(run.get("stdout", ""))
            expected_norm = _normalize(tc.expected)
            ok = output == expected_norm
            if ok:
                passed += 1
            test_results.append({
                "index": i + 1, "input": tc.input, "expected": tc.expected,
                "actual": run.get("stdout", ""), "passed": ok,
                "error": (run.get("stderr", "") or "")[:300],
            })
        except Exception as e:
            run_error = str(e)
            test_results.append({
                "index": i + 1, "input": tc.input, "expected": tc.expected,
                "actual": "", "passed": False, "error": str(e)[:300],
            })

    verdict = "ACEITO" if passed == total and total > 0 else "ERRO"
    known_expressions = _extract_expressions_from_code(req.code, req.language)

    system_prompt = f"""Voce e um professor de programacao {lang_name} e produz analises pedagogicas completas de solucoes de exercicios, exatamente no formato do Juiz Virtual (Professor + Juiz + Dicionario Inteligente).

{PEDAGOGY_RULES}

Responda APENAS com JSON valido (sem markdown, sem ```), com esta estrutura exata:
{{
  "summary": "1. O QUE O PROBLEMA PEDE: resumo claro do enunciado",
  "strategy": "2. ESTRATEGIA: como o codigo resolve o problema (ideia geral, em passos)",
  "line_by_line": [
    {{"line": 1, "code": "texto da linha", "explanation": "o que esta linha faz", "why": "por que esta linha existe neste exercicio", "would_happen_without": "o que aconteceria sem ela", "alternatives": "outras formas de fazer"}}
  ],
  "expressions": [
    {{"expression": "input()", "why": "por que foi usada NESTE codigo", "what_if_removed": "o que aconteceria sem ela", "when_to_use": "quando usar novamente", "how_to_identify": "como identificar no enunciado", "alternatives": "alternativas possiveis"}}
  ],
  "recognition_pattern": "6. COMO RECONHECER ESTE PADRAO EM OUTROS EXERCICIOS: dica para o aluno reconhecer quando precisara dessas expressoes de novo",
  "complexity": {{"time": "complexidade de tempo (Big-O)", "memory": "complexidade de memoria (Big-O)"}},
  "verdict_comment": "comentario didatico sobre o veredito do juiz (por que passou ou falhou)"
}}

REGRAS:
- A analise e SEMPRE baseada no codigo real do aluno e nos resultados de execucao fornecidos; NUNCA invente execucoes
- `line_by_line` deve cobrir TODAS as linhas importantes, uma por objeto
- `expressions` deve cobrir TODAS as expressoes importantes do codigo (funcoes, operadores, estruturas, variaveis)
- Use portugues didatico, como aula particular"""

    context_parts = [f"LINGUAGEM: {lang_name}"]
    if req.statement:
        context_parts.append(f"ENUNCIADO:\n{req.statement}")
    context_parts.append(f"CODIGO:\n```{req.language}\n{req.code}\n```")
    if req.test_cases:
        context_parts.append(f"RESULTADOS REAIS DOS TESTES (executados de verdade):\n{json.dumps(test_results, ensure_ascii=False, indent=2)}")
    context_parts.append(f"VEREDITO: {verdict} ({passed}/{total} testes passaram)")
    if run_error:
        context_parts.append(f"ERRO DE EXECUCAO: {run_error}")
    context = "\n\n".join(context_parts)

    ai_result = None
    raw = _call_ai(system_prompt, context, x_custom_api_key)
    if raw:
        try:
            parsed = _json_lenient(raw)
            if isinstance(parsed, dict):
                ai_result = parsed
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            logger.error(f"Falha ao parsear explain-solution da IA: {e}: {raw[:300]}")

    return {
        "language": req.language,
        "statement": req.statement,
        "tests": test_results,
        "summary": {"passed": passed, "total": total, "accepted": passed == total and total > 0, "verdict": verdict},
        "dictionary_entries": known_expressions,
        "pedagogical": ai_result,
        "note": "Resultados de testes obtidos por execucao real do codigo."
    }


SPIACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30, 60]

class ReviewCalendarRequest(BaseModel):
    topic: str = ""
    topic_name: str = ""
    difficulty: int = 1
    failed: bool = True

class ReviewItem(BaseModel):
    id: str
    topic: str
    topic_name: str
    difficulty: int
    title: str
    description: str
    date: str
    day_offset: int
    completed: bool = False

class ReviewCalendarResponse(BaseModel):
    reviews: List[ReviewItem]
    spaced_intervals: List[int]

@router.post("/review-calendar")
def generate_review_calendar(req: ReviewCalendarRequest):
    from datetime import datetime, timedelta
    import uuid

    today = datetime.now()
    intervals = SPIACED_REPETITION_INTERVALS
    reviews = []

    topic_display = req.topic_name or req.topic or "Progremacao"

    review_descriptions = [
        (f"Revisao 1: Revise o conceito de {topic_display}", "Revisar conceitos fundamentais do topico"),
        (f"Revisao 2: Faca 3 exercicios semelhantes sobre {topic_display}", "Praticar com exercicios"),
        (f"Revisao 3: Reescreva a solucao do zero sem olhar", "Recodificar a solucao da memoria"),
        (f"Revisao 4: Identifique onde errou e explique o erro", "Refletir sobre os erros cometidos"),
        (f"Revisao 5: Ensine o conceito a alguem ou explique em voz alta", "Ensinar solidifica o conhecimento"),
        (f"Revisao 6: Resolva um exercicio mais avancado sobre {topic_display}", "Aplicar em nivel avancado"),
    ]

    for i, (days, (title, desc)) in enumerate(zip(intervals, review_descriptions)):
        review_date = today + timedelta(days=days)
        reviews.append({
            "id": f"review_{uuid.uuid4().hex[:8]}",
            "topic": req.topic,
            "topic_name": topic_display,
            "difficulty": req.difficulty,
            "title": title,
            "description": desc,
            "date": review_date.strftime("%Y-%m-%d"),
            "day_offset": days,
            "completed": False,
        })

    return {
        "reviews": reviews,
        "spaced_intervals": intervals,
    }


class ReviewCompleteRequest(BaseModel):
    id: str

@router.post("/review-complete")
def complete_review(req: ReviewCompleteRequest):
    review_id = req.id
    if not review_id:
        raise HTTPException(status_code=400, detail="ID da revisao nao informado.")
    return {"success": True, "id": review_id, "message": "Revisao marcada como concluida."}
