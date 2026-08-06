from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import requests

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
