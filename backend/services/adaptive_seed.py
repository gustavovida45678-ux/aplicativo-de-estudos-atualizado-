"""
Seed do banco global de questões adaptativas.

Reaproveita os exercícios já existentes no app:
- routes/exercises.py  -> EXERCISES_DB (Cálculo 2/3, Cálculo Numérico, ED, SD)
- routes/extra_exercises.py -> EXTRA_EXERCISES (ED e SD, formato de prova)
E adiciona questões de programação (prever saída) cobrindo os tópicos do juiz.

A seed roda de forma preguiçosa na primeira chamada (store.seed_questions).
"""

from routes.exercises import EXERCISES_DB
from routes.extra_exercises import EXTRA_EXERCISES
from routes.study import TOPICS_DATA

TOPIC_NAMES = {}
for subject_id, data in TOPICS_DATA.items():
    for t in data.get("topics", []):
        TOPIC_NAMES[t["id"]] = {"subject": subject_id, "name": t["name"]}
    TOPIC_NAMES.setdefault(subject_id, {"subject": subject_id, "name": data["name"]})


def _difficulty_num(label: str) -> int:
    label = (label or "").strip().lower()
    if "bas" in label:
        return 1
    if "avan" in label or "dific" in label:
        return 3
    return 2


def _to_question(q: dict, subject_fallback: str) -> dict:
    topic_id = q.get("topic_id") or q.get("topic", "")
    meta = TOPIC_NAMES.get(topic_id, {})
    return {
        "id": q.get("id") or f"seed_{topic_id}_{len(q.get('question', '')) % 997}",
        "subject": meta.get("subject", subject_fallback),
        "topic_id": topic_id,
        "topic_name": meta.get("name", topic_id),
        "question": q["question"],
        "options": q.get("options"),
        "correct_answer": q.get("correct_answer"),
        "answer": q.get("answer") if q.get("correct_answer") is None else None,
        "explanation": q.get("explanation", ""),
        "difficulty": _difficulty_num(q.get("difficulty", "Intermediário")),
        "type": "multiple_choice" if q.get("options") else "open",
        "source": "builtin",
    }


def build_question_pool() -> list:
    pool = []
    for subject_id, qlist in EXERCISES_DB.items():
        for q in qlist:
            pool.append(_to_question(q, subject_id))
    for topic_id, qlist in EXTRA_EXERCISES.items():
        for q in qlist:
            pool.append(_to_question(q, "extra"))
    pool.extend(PROGRAMMING_QUESTIONS)
    return pool


# ---------------------------------------------------------------- programação
# Questões de múltipla escolha (prever saída / conceito) por tópico do juiz.
PROGRAMMING_QUESTIONS = [
    {
        "id": "prog_var_1",
        "subject": "programacao",
        "topic_id": "variaveis",
        "topic_name": "Variáveis e Tipos",
        "question": "O que o trecho imprime?\n```python\na = 5\nb = a + 2\na = 10\nprint(b)\n```",
        "options": ["10", "7", "5", "12"],
        "correct_answer": 1,
        "answer": None,
        "explanation": "b guarda a = 5 + 2 = 7. Depois a muda para 10, mas b não é recalculado.",
        "difficulty": 1,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_var_2",
        "subject": "programacao",
        "topic_id": "variaveis",
        "topic_name": "Variáveis e Tipos",
        "question": "Qual linha declara uma variável inteira em Python?",
        "options": ["int a = 5;", "a = 5", "var a = 5", "declare a as int"],
        "correct_answer": 1,
        "answer": None,
        "explanation": "Em Python não há declaração com tipo: a atribuição a = 5 já cria a variável.",
        "difficulty": 1,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_cond_1",
        "subject": "programacao",
        "topic_id": "condicionais",
        "topic_name": "Condicionais (if/else)",
        "question": "O que imprime?\n```python\nx = 10\nif x > 5:\n    print('A')\nelif x > 8:\n    print('B')\nelse:\n    print('C')\n```",
        "options": ["A", "B", "C", "A e B"],
        "correct_answer": 0,
        "answer": None,
        "explanation": "x > 5 é verdadeiro, então o bloco if executa e o elif/else são ignorados.",
        "difficulty": 1,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_cond_2",
        "subject": "programacao",
        "topic_id": "condicionais",
        "topic_name": "Condicionais (if/else)",
        "question": "Qual condição testa se um número N é par?",
        "options": ["if N / 2 == 0", "if N % 2 == 0", "if N % 2 = 0", "if N // 2 == 0"],
        "correct_answer": 1,
        "answer": None,
        "explanation": "O resto da divisão por 2 (% 2) é 0 apenas para pares. Atenção: comparar usa ==, não =.",
        "difficulty": 1,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_loop_1",
        "subject": "programacao",
        "topic_id": "loops",
        "topic_name": "Loops (for/while)",
        "question": "Quantas vezes a linha 'oi' é impressa?\n```python\nfor i in range(3):\n    print('oi')\n```",
        "options": ["2", "3", "4", "1"],
        "correct_answer": 1,
        "answer": None,
        "explanation": "range(3) gera 0, 1 e 2: o bloco executa 3 vezes.",
        "difficulty": 1,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_loop_2",
        "subject": "programacao",
        "topic_id": "loops",
        "topic_name": "Loops (for/while)",
        "question": "O que imprime?\n```python\nsoma = 0\nfor i in range(1, 5):\n    soma += i\nprint(soma)\n```",
        "options": ["15", "10", "12", "14"],
        "correct_answer": 1,
        "answer": None,
        "explanation": "range(1,5) = 1,2,3,4 -> soma = 1+2+3+4 = 10 (o 5 é excluído).",
        "difficulty": 2,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_loop_3",
        "subject": "programacao",
        "topic_id": "loops",
        "topic_name": "Loops (for/while)",
        "question": "O que imprime?\n```python\ni = 0\nwhile i < 3:\n    print(i, end=' ')\n    i += 1\n```",
        "options": ["0 1 2", "1 2 3", "0 1 2 3", "loop infinito"],
        "correct_answer": 0,
        "answer": None,
        "explanation": "i começa em 0 e o loop imprime enquanto i < 3, então imprime 0 1 2. Sem o i += 1 seria infinito.",
        "difficulty": 2,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_str_1",
        "subject": "programacao",
        "topic_id": "strings",
        "topic_name": "Strings",
        "question": "O que imprime?\n```python\ns = 'abcde'\nprint(s[1:3])\n```",
        "options": ["abc", "bc", "bcd", "bcde"],
        "correct_answer": 1,
        "answer": None,
        "explanation": "Slicing s[1:3] pega índices 1 e 2 (o fim é exclusivo): 'b' e 'c'.",
        "difficulty": 1,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_str_2",
        "subject": "programacao",
        "topic_id": "strings",
        "topic_name": "Strings",
        "question": "Qual função devolve o tamanho de uma string em Python?",
        "options": ["size(s)", "length(s)", "len(s)", "strlen(s)"],
        "correct_answer": 2,
        "answer": None,
        "explanation": "len() devolve o número de caracteres em Python. strlen é da biblioteca string.h em C.",
        "difficulty": 1,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_arr_1",
        "subject": "programacao",
        "topic_id": "arrays",
        "topic_name": "Arrays/Listas",
        "question": "O que imprime?\n```python\nv = [10, 20, 30]\nprint(v[-1])\n```",
        "options": ["10", "30", "índice inválido", "20"],
        "correct_answer": 1,
        "answer": None,
        "explanation": "v[-1] acessa o último elemento (índice negativo conta do fim): 30.",
        "difficulty": 1,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_arr_2",
        "subject": "programacao",
        "topic_id": "arrays",
        "topic_name": "Arrays/Listas",
        "question": "O que imprime?\n```python\nv = [1, 2, 3]\nfor x in v:\n    if x % 2 == 0:\n        print(x)\n```",
        "options": ["2", "1 2 3", "1 3", "2 4"],
        "correct_answer": 0,
        "answer": None,
        "explanation": "O for percorre cada elemento; só o 2 é par, então só ele é impresso.",
        "difficulty": 2,
        "type": "multiple_choice",
        "source": "builtin",
    },
    {
        "id": "prog_io_1",
        "subject": "programacao",
        "topic_id": "entrada_saida",
        "topic_name": "Entrada e Saída",
        "question": "Em Python, qual linha lê DOIS inteiros separados por espaço?",
        "options": [
            "a, b = int(input(), input())",
            "a, b = map(int, input().split())",
            "scanf(\"%d %d\", &a, &b)",
            "a = input(2)",
        ],
        "correct_answer": 1,
        "answer": None,
        "explanation": "input().split() separa por espaço e map(int, ...) converte cada parte para inteiro.",
        "difficulty": 1,
        "type": "multiple_choice",
        "source": "builtin",
    },
]
