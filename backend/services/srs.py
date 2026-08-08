"""
Motor de repetição espaçada adaptativa (SRS).

Regras pedagógicas:
- Errou / não sabia  -> intervalo colapsa (0.3x), domínio cai
- Acertou com dificuldade -> intervalo cresce pouco (1.2x)
- Acertou com confiança média -> intervalo cresce (1.7x)
- Acertou com alta confiança -> intervalo cresce muito (2.5x)
- Domínio usa ganho/perda por dificuldade e confiança, decai com atraso
  da revisão (esquecimento).
"""

from datetime import date

# Faixas de domínio (porcentagem -> rótulo)
DOMAIN_RANGES = [
    (91, 100, "Dominado"),
    (76, 90, "Bom"),
    (61, 75, "Básico"),
    (41, 60, "Em desenvolvimento"),
    (21, 40, "Muito fraco"),
    (0, 20, "Crítico"),
]

# Escada conceitual de intervalos (dias)
INTERVAL_LADDER = [1, 3, 7, 14, 30, 60]

MAX_INTERVAL_DAYS = 180


def mastery_label(mastery: float) -> str:
    """Converte porcentagem de domínio em rótulo (0-20 Crítico ... 91-100 Dominado)."""
    for lo, hi, label in DOMAIN_RANGES:
        if lo <= mastery <= hi:
            return label
    return "Crítico"


def mastery_state(mastery: float) -> str:
    """Estado simplificado usado nas recomendações: critico / fraco / ok."""
    if mastery < 21:
        return "critico"
    if mastery < 41:
        return "muito_fraco"
    if mastery < 61:
        return "desenvolvimento"
    if mastery < 76:
        return "basico"
    if mastery < 91:
        return "bom"
    return "dominado"


def result_grade(result: str, confidence: int) -> int:
    """
    Converte resultado + confiança em grau 0..3 (SM-2 adaptado).
    result: 'wrong' | 'dont_know' | 'hard' | 'correct'
    """
    if result in ("wrong", "dont_know"):
        return 0
    if result == "hard":
        return 1
    if confidence >= 80:
        return 3
    if confidence >= 50:
        return 2
    return 1


def next_interval(current_days: int, grade: int) -> int:
    """
    Calcula o próximo intervalo (dias) com base no grau 0..3.
    Aplica multiplicadores adaptativos ao intervalo atual.
    """
    mult = {0: 0.3, 1: 1.2, 2: 1.7, 3: 2.5}[grade]
    if grade == 0:
        return max(1, int(current_days * mult))
    if current_days <= 0:
        return 1
    return min(MAX_INTERVAL_DAYS, max(1, int(current_days * mult)))


def mastery_delta(result: str, confidence: int, difficulty: int) -> float:
    """
    Variação do domínio por resposta.
    difficulty: 1 (fácil) a 3 (difícil).
    """
    difficulty = max(1, min(3, int(difficulty or 1)))
    if result in ("wrong", "dont_know"):
        # Errar conceito difícil custa mais
        return -(10 + 4 * difficulty)
    if result == "hard":
        return 3.0
    gain = 7 + (confidence // 10) + 2 * difficulty
    return float(gain)


def update_mastery(current: float, result: str, confidence: int, difficulty: int) -> float:
    """Atualiza e limita o domínio em [0, 100]."""
    m = (current or 0) + mastery_delta(result, confidence, difficulty)
    return round(max(0.0, min(100.0, m)), 1)


def decay_mastery(mastery: float, overdue_days: int) -> float:
    """
    Aplica esquecimento: cada dia atrasado reduz o domínio (até ~34% em 14 dias).
    Não reduz abaixo de 0.
    """
    if overdue_days <= 0:
        return mastery
    factor = 0.97 ** min(overdue_days, 14)
    return round(max(0.0, mastery * factor), 1)


def days_between(a: date, b: date) -> int:
    return (b - a).days


def initial_skill(topic_id: str, subject: str = "", topic_name: str = "") -> dict:
    """Estado inicial de um tópico no mapa de domínio."""
    return {
        "topic_id": topic_id,
        "subject": subject,
        "topic_name": topic_name,
        "mastery": 0.0,
        "reviews_count": 0,
        "correct_count": 0,
        "wrong_count": 0,
        "last_review": None,
        "next_review": None,
        "interval_days": 0,
        "streak": 0,
        "difficulty": 1,
        "confidence_sum": 0,
    }


def apply_result(skill: dict, result: str, confidence: int, difficulty: int, today: date) -> dict:
    """
    Aplica um resultado a um tópico e devolve o estado atualizado.
    Atualiza domínio, contadores, intervalo e próxima revisão.
    """
    grade = result_grade(result, confidence)
    skill = dict(skill)
    skill["mastery"] = update_mastery(skill.get("mastery") or 0, result, confidence, difficulty)
    skill["reviews_count"] = (skill.get("reviews_count") or 0) + 1
    if result in ("wrong", "dont_know"):
        skill["wrong_count"] = (skill.get("wrong_count") or 0) + 1
        skill["streak"] = 0
    else:
        skill["correct_count"] = (skill.get("correct_count") or 0) + 1
        skill["streak"] = (skill.get("streak") or 0) + 1 if result != "hard" else (skill.get("streak") or 0)
    skill["interval_days"] = next_interval(skill.get("interval_days") or 0, grade)
    skill["last_review"] = today.isoformat()
    skill["next_review"] = add_days(today, skill["interval_days"]).isoformat()
    skill["difficulty"] = int(difficulty or 1)
    skill["confidence_sum"] = (skill.get("confidence_sum") or 0) + confidence
    return skill


def add_days(d: date, days: int) -> date:
    from datetime import timedelta
    return d + timedelta(days=days)


def skill_confidence(skill: dict) -> int:
    """Confiança média registrada no tópico (0-100)."""
    n = skill.get("reviews_count") or 0
    if not n:
        return 0
    return int((skill.get("confidence_sum") or 0) / n)
