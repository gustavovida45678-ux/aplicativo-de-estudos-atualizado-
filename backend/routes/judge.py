from fastapi import APIRouter, HTTPException, Query
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
    base_exercise_id: Optional[str] = None


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


def _extract_error_type(stderr: str, language: str) -> str:
    if not stderr:
        return ""
    if language == "python":
        m = re.search(r"(\w+Error):", stderr)
        if m:
            return m.group(1)
        if "SyntaxError" in stderr:
            return "SyntaxError"
        if "IndentationError" in stderr:
            return "IndentationError"
    elif language in ("c", "cpp"):
        if "error:" in stderr:
            m = re.search(r"error:\s*(.+)", stderr)
            return m.group(1).strip()[:120] if m else "Erro de compilação"
        if "undefined reference" in stderr:
            return "undefined reference"
        if "was not declared" in stderr:
            return "variável não declarada"
    elif language == "java":
        m = re.search(r"(\w+Exception):", stderr)
        if m:
            return m.group(1)
    return stderr.split("\n")[0][:120] if stderr else "Erro desconhecido"


def _build_explanation(code: str, language: str, error_type: str, stderr: str, stdout: str, expected: str, passed: bool) -> dict:
    explanation = {
        "error_type": error_type,
        "language": language,
        "passed": passed,
        "step_by_step": [],
        "code_analysis": "",
        "suggestion": "",
    }

    if passed:
        explanation["step_by_step"] = [
            {"step": 1, "title": "Código executado com sucesso", "detail": "Todos os casos de teste passaram. Seu código está correto!", "code_hint": None},
        ]
        explanation["code_analysis"] = "O código atende a todos os requisitos."
        explanation["suggestion"] = "Parabéns! Tente otimizar a performance ou usar uma abordagem diferente."
        return explanation

    if language == "python":
        explanation["step_by_step"] = _python_steps(code, error_type, stderr, expected, stdout)
    elif language in ("c", "cpp"):
        explanation["step_by_step"] = _c_steps(code, error_type, stderr, expected, stdout)
    else:
        explanation["step_by_step"] = _generic_steps(code, error_type, stderr, expected, stdout)

    explanation["code_analysis"] = _generate_code_analysis(code, language, error_type, stderr)
    explanation["suggestion"] = _generate_suggestion(error_type, language, stderr)
    return explanation


def _python_steps(code: str, error_type: str, stderr: str, expected: str, stdout: str) -> list:
    steps = []
    lines = code.split("\n")

    if "NameError" in error_type:
        var_match = re.search(r"name '(\w+)' is not defined", stderr)
        var_name = var_match.group(1) if var_match else "desconhecida"
        steps = [
            {"step": 1, "title": "Identificar o erro", "detail": f"A variável '{var_name}' não foi definida antes de ser usada.", "code_hint": None},
            {"step": 2, "title": "Verificar escopo", "detail": "Verifique se a variável foi declarada no escopo correto (fora de loops/condicionais se necessário).", "code_hint": None},
            {"step": 3, "title": "Como corrigir", "detail": f"Adicione a declaração de '{var_name}' antes da linha que a referencia.", "code_hint": f"{var_name} = valor_inicial"},
        ]
    elif "TypeError" in error_type:
        steps = [
            {"step": 1, "title": "Identificar o erro", "detail": "Está havendo operação entre tipos incompatíveis (ex: somar string com número).", "code_hint": None},
            {"step": 2, "title": "Localizar a operação", "detail": "Procure no código operações que misturam tipos diferentes.", "code_hint": None},
            {"step": 3, "title": "Como corrigir", "detail": "Use int(), float() ou str() para converter o tipo antes da operação.", "code_hint": "resultado = int(valor_string) + valor_numero"},
        ]
    elif "IndexError" in error_type:
        steps = [
            {"step": 1, "title": "Identificar o erro", "detail": "Tentou acessar uma posição que não existe na lista/array.", "code_hint": None},
            {"step": 2, "title": "Verificar tamanho", "detail": f"Último índice válido é len(lista) - 1.", "code_hint": "ultimo_indice = len(minha_lista) - 1"},
            {"step": 3, "title": "Como corrigir", "detail": "Use len() para verificar o tamanho antes de acessar por índice.", "code_hint": "if indice < len(minha_lista): valor = minha_lista[indice]"},
        ]
    elif "IndentationError" in error_type or "SyntaxError" in error_type:
        steps = [
            {"step": 1, "title": "Identificar o erro", "detail": "A indentação do código está incorreta ou há erro de sintaxe.", "code_hint": None},
            {"step": 2, "title": "Verificar espaços", "detail": "Python usa espaços (4 espaços padrão) para definir blocos. Não misture tabs com espaços.", "code_hint": None},
            {"step": 3, "title": "Como corrigir", "detail": "Use um editor com visibilidade de whitespace. Reindent o código com Ctrl+Shift+I (VS Code).", "code_hint": None},
        ]
    elif "ZeroDivisionError" in error_type:
        steps = [
            {"step": 1, "title": "Identificar o erro", "detail": "Tentou dividir por zero, o que é matematicamente impossível.", "code_hint": None},
            {"step": 2, "title": "Verificar divisor", "detail": "Verifique se o divisor pode ser zero antes da operação.", "code_hint": None},
            {"step": 3, "title": "Como corrigir", "detail": "Adicione uma verificação antes da divisão.", "code_hint": "if divisor != 0: resultado = numerador / divisor"},
        ]
    elif "KeyError" in error_type:
        key_match = re.search(r"KeyError:\s*['\"](.+?)['\"]", stderr)
        key_name = key_match.group(1) if key_match else "desconhecida"
        steps = [
            {"step": 1, "title": "Identificar o erro", "detail": f"A chave '{key_name}' não existe no dicionário.", "code_hint": None},
            {"step": 2, "title": "Verificar chaves", "detail": "Use dict.keys() para ver todas as chaves disponíveis.", "code_hint": "print(meus_dicionario.keys())"},
            {"step": 3, "title": "Como corrigir", "detail": "Use .get() com valor padrão ou verifique se a chave existe.", "code_hint": f"valor = meu_dict.get('{key_name}', valor_padrao)"},
        ]
    elif stdout and expected:
        steps = [
            {"step": 1, "title": "Código compilou, mas saída incorreta", "detail": f"Sua saída:\n{stdout[:200]}\nEsperado:\n{expected[:200]}", "code_hint": None},
            {"step": 2, "title": "Comparar linha por linha", "detail": "Compare cada linha da saída com o esperado. Verifique espaços, quebras de linha e formatação.", "code_hint": None},
            {"step": 3, "title": "Dicas comuns", "detail": "Cuidado com: print() adiciona '\\n', espaços extras,.case-sensitive, ordem de saída.", "code_hint": None},
        ]
    else:
        steps = _generic_steps(code, error_type, stderr, expected, stdout)

    return steps


def _c_steps(code: str, error_type: str, stderr: str, expected: str, stdout: str) -> list:
    steps = []
    if "error:" in stderr:
        err_line = re.search(r"(\d+):\d+:\s*error:\s*(.+)", stderr)
        line_num = err_line.group(1) if err_line else "?"
        msg = err_line.group(2) if err_line else error_type
        steps = [
            {"step": 1, "title": f"Erro na linha {line_num}", "detail": msg, "code_hint": None},
            {"step": 2, "title": "Verificar sintaxe", "detail": "Verifique se há ; faltando, parênteses desbalanceados, ouinclude ausente.", "code_hint": None},
            {"step": 3, "title": "Como corrigir", "detail": "Corrija o erro indicado e compile novamente.", "code_hint": None},
        ]
    elif "undefined reference" in stderr:
        func_match = re.search(r"undefined reference to `(\w+)'", stderr)
        func_name = func_match.group(1) if func_match else "função"
        steps = [
            {"step": 1, "title": f"Função '{func_name}' não implementada", "detail": "O compilador não encontrou a definição desta função.", "code_hint": None},
            {"step": 2, "title": "Verificar declaração", "detail": "Certifique-se de que a função está declarada e implementada.", "code_hint": f"return_type {func_name}(params) {{ /* implementation */ }}"},
            {"step": 3, "title": "Link corretamente", "detail": "Se estiver em mais de um arquivo, compile todos juntos.", "code_hint": "gcc main.c utils.c -o programa"},
        ]
    elif stdout and expected:
        steps = [
            {"step": 1, "title": "Código compilou, mas saída incorreta", "detail": f"Sua saída:\n{stdout[:200]}\nEsperado:\n{expected[:200]}", "code_hint": None},
            {"step": 2, "title": "Verificar printf/scanf", "detail": "Verifique o formato exato do printf. Use '\\n' para quebras de linha.", "code_hint": None},
            {"step": 3, "title": "Dicas comuns", "detail": "Cuidado com: '\\n' no final, espaços extras, caso sensitivo.", "code_hint": None},
        ]
    else:
        steps = _generic_steps(code, error_type, stderr, expected, stdout)
    return steps


def _generic_steps(code: str, error_type: str, stderr: str, expected: str, stdout: str) -> list:
    return [
        {"step": 1, "title": "Identificar o erro", "detail": f"Tipo: {error_type}\nDetalhes: {stderr[:300] if stderr else 'Sem detalhes'}", "code_hint": None},
        {"step": 2, "title": "Analisar o código", "detail": "Revise a lógica do programa, especialmente onde o erro ocorre.", "code_hint": None},
        {"step": 3, "title": "Como corrigir", "detail": "Use print() para debugar variáveis e entender o fluxo de execução.", "code_hint": None},
    ]


def _generate_code_analysis(code: str, language: str, error_type: str, stderr: str) -> str:
    lines = code.split("\n")
    analysis_parts = []
    analysis_parts.append(f"O código tem {len(lines)} linhas.")
    if "import" in code or "#include" in code:
        analysis_parts.append("Dependências externas detectadas.")
    if language == "python":
        funcs = re.findall(r"def (\w+)", code)
        if funcs:
            analysis_parts.append(f"Funções definidas: {', '.join(funcs)}.")
        loops = re.findall(r"(for|while)", code)
        analysis_parts.append(f"{len(loops)} loop(s) encontrado(s).")
    elif language in ("c", "cpp"):
        funcs = re.findall(r"\w+\s+\w+\s*\(", code)
        if funcs:
            analysis_parts.append(f"Funções/chamadas detectadas: {len(funcs)}.")
    if stderr:
        analysis_parts.append(f"Erro reportado: {error_type}.")
    return " ".join(analysis_parts)


def _generate_suggestion(error_type: str, language: str, stderr: str) -> str:
    suggestions = {
        "python": {
            "NameError": "Declare a variável antes de usá-la. Ex: x = 0",
            "TypeError": "Converta os tipos antes da operação. Ex: int(str_val)",
            "IndexError": "Use len() para verificar limites. Ex: if i < len(lista)",
            "IndentationError": "Use 4 espaços por nível de indentação.",
            "SyntaxError": "Verifique parênteses, dois-pontos e vírgulas.",
            "ZeroDivisionError": "Adicione verificação: if divisor != 0",
            "KeyError": "Use .get() ou verifique se a chave existe com 'in'.",
        },
        "c": {
            "error": "Verifique incluições (#include), ponto-e-vírgula e parênteses.",
            "undefined reference": "Implemente a função ou inclua o arquivo correto.",
            "variável não declarada": "Declare a variável antes de usar: tipo nome;",
        },
        "cpp": {
            "error": "Verifique namespaces (using namespace std), incluições e sintaxe.",
            "undefined reference": "Implemente a função ou verifique links de compilação.",
        },
    }
    lang_suggestions = suggestions.get(language, {})
    for key, value in lang_suggestions.items():
        if key.lower() in error_type.lower() or key.lower() in (stderr or "").lower():
            return value
    return "Revise o código, adicione prints para debugar e compare com o esperado."


def _get_youtube_videos(error_type: str, language: str) -> list:
    search_terms = {
        "python": {
            "NameError": ["python name error tutorial", "python variavel nao definida"],
            "TypeError": ["python type error tutorial", "python concatenar string numero"],
            "IndexError": ["python index error tutorial", "python lista indice fora limites"],
            "IndentationError": ["python indentacao tutorial", "python spaces tabs"],
            "SyntaxError": ["python syntax error tutorial", "python erro sintaxe"],
            "ZeroDivisionError": ["python divisao por zero tutorial"],
            "KeyError": ["python dictionary key error tutorial", "python dicionario chave"],
        },
        "c": {
            "error": ["c programming errors tutorial", "c compilation errors"],
            "undefined reference": ["c undefined reference tutorial", "c linking errors"],
            "variável não declarada": ["c variable declaration tutorial"],
        },
        "cpp": {
            "error": ["c++ compilation errors tutorial", "c++ errors tutorial"],
            "undefined reference": ["c++ undefined reference tutorial"],
        },
    }
    lang_terms = search_terms.get(language, {})
    terms = lang_terms.get(error_type, [f"{language} programming error tutorial", f"{error_type} {language} tutorial"])

    videos = []
    for term in terms[:2]:
        encoded = term.replace(" ", "+")
        videos.append({
            "title": f"Tutorial: {term.title()}",
            "search_url": f"https://www.youtube.com/results?search_query={encoded}",
            "query": term,
        })

    videos.append({
        "title": f"Curso completo de {language.upper()} - YouTube",
        "search_url": f"https://www.youtube.com/results?search_query=curso+completo+{language}",
        "query": f"curso completo {language}",
    })

    return videos


def _generate_new_exercise(topic: str, difficulty: int, language: str) -> dict:
    exercises_db = {
        "variaveis": [
            {"title": "Troca de Valores", "statement": "Leia dois valores inteiros e troque seus valores (o primeiro passa a ter o valor do segundo e vice-versa). Imprima os valores trocados.", "inputFormat": "Dois inteiros A e B", "outputFormat": "Dois inteiros B A (na ordem trocada)"},
            {"title": "Soma e Média", "statement": "Leia 3 notas de um aluno e calcule a média aritmética simples.", "inputFormat": "Três números reais", "outputFormat": "A média com 2 casas decimais"},
        ],
        "condicionais": [
            {"title": "Par ou Ímpar", "statement": "Leia um número inteiro e diga se é par ou ímpar.", "inputFormat": "Um inteiro N", "outputFormat": "PAR ou IMPAR"},
            {"title": "Maior de Três", "statement": "Leia 3 números e mostre o maior deles.", "inputFormat": "Três inteiros", "outputFormat": "O maior valor"},
        ],
        "loops": [
            {"title": "Fatorial", "statement": "Leia um número N e calcule o seu fatorial (N!).", "inputFormat": "Um inteiro N (0 <= N <= 20)", "outputFormat": "O valor de N!"},
            {"title": "Sequência de Fibonacci", "statement": "Leia N e imprima os N primeiros números da sequência de Fibonacci.", "inputFormat": "Um inteiro N (1 <= N <= 30)", "outputFormat": "N números separados por espaço"},
        ],
        "strings": [
            {"title": "Inverter String", "statement": "Leia uma string e imprima ela invertida.", "inputFormat": "Uma string S", "outputFormat": "A string invertida"},
            {"title": "Contar Vogais", "statement": "Leia uma string e conte quantas vogais ela contém.", "inputFormat": "Uma string S (pode ter espaços)", "outputFormat": "Um inteiro com a quantidade de vogais"},
        ],
        "arrays": [
            {"title": "Maior e Menor", "statement": "Leia N números e encontre o maior e o menor entre eles.", "inputFormat": "Um inteiro N, seguido de N números", "outputFormat": "Maior e menor separados por espaço"},
            {"title": "Soma dos Elementos", "statement": "Leia N números e calcule a soma de todos eles.", "inputFormat": "Um inteiro N, seguido de N números", "outputFormat": "A soma total"},
        ],
        "estruturas_dados": [
            {"title": "Pilha - Verificação de Parênteses", "statement": "Verifique se uma expressão matemática tem parênteses balanceados.", "inputFormat": "Uma string com a expressão", "outputFormat": "SIM ou NAO"},
            {"title": "Fila - Atendimento", "statement": "Simule um sistema de fila: enfileirar (E x), desenfileirar (D), mostrar frente (F).", "inputFormat": "Operações até EOF", "outputFormat": "Resultados de cada operação"},
        ],
        "recursao": [
            {"title": "Potência Recursiva", "statement": "Calcule X^N usando recursão (sem usar ** ou pow).", "inputFormat": "Dois inteiros X e N", "outputFormat": "O resultado de X^N"},
            {"title": "Soma Recursiva", "statement": "Calcule a soma de 1 até N usando recursão.", "inputFormat": "Um inteiro N", "outputFormat": "A soma de 1+2+...+N"},
        ],
    }

    topic_lower = topic.lower().replace(" ", "_").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    possible_topics = exercises_db.get(topic_lower, exercises_db.get("variaveis"))
    import random
    ex = random.choice(possible_topics)

    test_cases = []
    if "Fibonacci" in ex["title"]:
        test_cases = [
            {"input": "5", "expected": "0 1 1 2 3"},
            {"input": "1", "expected": "0"},
            {"input": "10", "expected": "0 1 1 2 3 5 8 13 21 34"},
        ]
    elif "Fatorial" in ex["title"]:
        test_cases = [
            {"input": "5", "expected": "120"},
            {"input": "0", "expected": "1"},
            {"input": "10", "expected": "3628800"},
        ]
    elif "Par" in ex["title"]:
        test_cases = [
            {"input": "4", "expected": "PAR"},
            {"input": "7", "expected": "IMPAR"},
            {"input": "0", "expected": "PAR"},
        ]
    elif "Maior" in ex["title"] and "Três" in ex["title"]:
        test_cases = [
            {"input": "3 7 5", "expected": "7"},
            {"input": "10 2 8", "expected": "10"},
            {"input": "1 1 1", "expected": "1"},
        ]
    elif "Troca" in ex["title"]:
        test_cases = [
            {"input": "3 7", "expected": "7 3"},
            {"input": "100 200", "expected": "200 100"},
        ]
    elif "Média" in ex["title"] or "Soma e" in ex["title"]:
        test_cases = [
            {"input": "7 8 9", "expected": "8.00"},
            {"input": "10 10 10", "expected": "10.00"},
        ]
    elif "Inverter" in ex["title"]:
        test_cases = [
            {"input": "hello", "expected": "olleh"},
            {"input": "abc", "expected": "cba"},
        ]
    elif "Vogais" in ex["title"]:
        test_cases = [
            {"input": "hello", "expected": "2"},
            {"input": "aeiou", "expected": "5"},
        ]
    elif "Maior e Menor" in ex["title"]:
        test_cases = [
            {"input": "5\n3 7 1 9 2", "expected": "9 1"},
        ]
    elif "Soma dos" in ex["title"]:
        test_cases = [
            {"input": "3\n1 2 3", "expected": "6"},
        ]
    elif "Parênteses" in ex["title"]:
        test_cases = [
            {"input": "(a+b)", "expected": "SIM"},
            {"input": "((a+b)", "expected": "NAO"},
            {"input": ")( ", "expected": "NAO"},
        ]
    elif "Potência" in ex["title"]:
        test_cases = [
            {"input": "2 3", "expected": "8"},
            {"input": "5 0", "expected": "1"},
        ]
    elif "Soma Recursiva" in ex["title"]:
        test_cases = [
            {"input": "5", "expected": "15"},
            {"input": "1", "expected": "1"},
        ]
    else:
        test_cases = [{"input": "1", "expected": "1"}]

    starter_codes = {
        "python": f"# {ex['title']}\n# {ex['statement']}\n\ndef main():\n    # sua solucao aqui\n    pass\n\nif __name__ == '__main__':\n    main()\n",
        "c": f"/* {ex['title']} */\n/* {ex['statement']} */\n\n#include <stdio.h>\n\nint main() {{\n    // sua solucao aqui\n    return 0;\n}}\n",
        "cpp": f"// {ex['title']}\n// {ex['statement']}\n\n#include <iostream>\nusing namespace std;\n\nint main() {{\n    // sua solucao aqui\n    return 0;\n}}\n",
    }

    return {
        "title": ex["title"],
        "statement": ex["statement"],
        "topic": topic,
        "difficulty": difficulty,
        "inputFormat": ex["inputFormat"],
        "outputFormat": ex["outputFormat"],
        "test_cases": test_cases,
        "starter_code": starter_codes.get(language, starter_codes["python"]),
        "youtube_videos": [
            {"title": f"Tutorial: {ex['title']} em {language.upper()}", "search_url": f"https://www.youtube.com/results?search_query={ex['title'].replace(' ', '+')}+{language}+tutorial"},
        ],
    }


@router.post("/submit")
def judge_submit(req: SubmitRequest):
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Código vazio.")
    if not req.test_cases:
        raise HTTPException(status_code=400, detail="Nenhum caso de teste enviado.")

    first_result = _run(req.language, req.code, req.test_cases[0].input)
    if first_result.get("compile") and first_result["compile"].get("code") is not None and first_result["compile"].get("code") != 0:
        compile_stderr = first_result["compile"].get("stderr", "")
        error_type = _extract_error_type(compile_stderr, req.language)
        explanation = _build_explanation(req.code, req.language, error_type, compile_stderr, "", "", False)
        explanation["youtube_videos"] = _get_youtube_videos(error_type, req.language)
        return {
            "compile": {"ok": False, "stderr": compile_stderr},
            "tests": [],
            "summary": {"passed": 0, "total": len(req.test_cases), "accepted": False},
            "explanation": explanation,
        }

    if not first_result.get("run"):
        stderr = (first_result.get("compile") or {}).get("stderr", "")
        error_type = _extract_error_type(stderr, req.language)
        explanation = _build_explanation(req.code, req.language, error_type, stderr, "", "", False)
        explanation["youtube_videos"] = _get_youtube_videos(error_type, req.language)
        return {
            "compile": {"ok": True, "stderr": ""},
            "tests": [],
            "summary": {"passed": 0, "total": len(req.test_cases), "accepted": False},
            "error": "Falha ao executar o código. Verifique erros de sintaxe/compilação.",
            "explanation": explanation,
        }

    results = [first_result]
    for tc in req.test_cases[1:]:
        results.append(_run(req.language, req.code, tc.input))

    tests = []
    passed = 0
    first_error = None
    for i, (tc, res) in enumerate(zip(req.test_cases, results)):
        run = res.get("run") or {}
        stderr = run.get("stderr", "") or ""
        output = _normalize(run.get("stdout", ""))
        expected = _normalize(tc.expected)
        ok = output == expected
        if ok:
            passed += 1
        else:
            if first_error is None:
                first_error = {"stderr": stderr, "output": output, "expected": expected}
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
    if first_error:
        error_type = _extract_error_type(first_error["stderr"], req.language)
        explanation = _build_explanation(
            req.code, req.language, error_type,
            first_error["stderr"], first_error["output"],
            first_error["expected"], passed == len(req.test_cases)
        )
        explanation["youtube_videos"] = _get_youtube_videos(error_type, req.language)

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
def explain_error(req: SubmitRequest):
    if not req.code.strip():
        raise HTTPException(status_code=400, detail="Código vazio.")

    result = _run(req.language, req.code, "")
    stderr = ""
    compile_stderr = ""

    if result.get("compile") and result["compile"].get("code") is not None and result["compile"].get("code") != 0:
        compile_stderr = result["compile"].get("stderr", "")

    if result.get("run"):
        stderr = (result.get("run") or {}).get("stderr", "")

    error_text = compile_stderr or stderr
    error_type = _extract_error_type(error_text, req.language)
    explanation = _build_explanation(req.code, req.language, error_type, error_text, "", "", False)
    explanation["youtube_videos"] = _get_youtube_videos(error_type, req.language)
    return explanation


@router.post("/generate-exercise")
def generate_exercise(req: ExerciseRequest):
    exercise = _generate_new_exercise(req.topic, req.difficulty, req.language)
    return exercise


@router.get("/topics")
def get_topics():
    return {
        "topics": [
            {"id": "variaveis", "name": "Variáveis e Tipos", "icon": "variables"},
            {"id": "condicionais", "name": "Condicionais (if/else)", "icon": "git-branch"},
            {"id": "loops", "name": "Loops (for/while)", "icon": "repeat"},
            {"id": "strings", "name": "Strings", "icon": "type"},
            {"id": "arrays", "name": "Arrays/Listas", "icon": "list"},
            {"id": "estruturas_dados", "name": "Estruturas de Dados", "icon": "database"},
            {"id": "recursao", "name": "Recursão", "icon": "corner-down-right"},
        ]
    }
