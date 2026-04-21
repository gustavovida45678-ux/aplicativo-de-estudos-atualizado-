from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import logging
from utils.auth import get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter()


class ImportScheduleRequest(BaseModel):
    user_id: str
    subject_name: str
    start_date: str  # ISO format: "2026-04-01"
    end_date: str    # ISO format: "2026-07-10"


@router.post("/import-detailed-schedule")
async def import_detailed_schedule(
    request: ImportScheduleRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Import the complete study schedule for Cálculo Numérico
    Professor Thiago Vedovato | IFJ - Jataí/GO
    """
    try:
        logger.info(f"📚 Importing schedule for user: {current_user['email']}")
        
        from motor.motor_asyncio import AsyncIOMotorClient
        import os
        
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        # Parse dates
        start_date = datetime.fromisoformat(request.start_date)
        
        # Create subject
        subject_id = f"subject-calculo-numerico-{current_user['id']}"
        subject = {
            "id": subject_id,
            "user_id": current_user['id'],
            "name": "Cálculo Numérico (EDOs)",
            "color": "#8b5cf6",
            "professor": "Thiago Vedovato",
            "institution": "IFJ - Jataí/GO",
            "course": "Engenharia Elétrica",
            "created_at": datetime.now().isoformat()
        }
        
        await db.subjects.update_one(
            {"id": subject_id},
            {"$set": subject},
            upsert=True
        )
        
        # Create all tasks organized by phases
        tasks = []
        current_day = start_date
        
        # Helper function to add days
        def add_task(day_offset, title, description, task_type="study"):
            task_date = start_date + timedelta(days=day_offset - 1)
            return {
                "id": f"task-{current_user['id']}-{day_offset}",
                "user_id": current_user['id'],
                "subject_id": subject_id,
                "title": title,
                "description": description,
                "date": task_date.isoformat(),
                "completed": False,
                "type": task_type,
                "created_at": datetime.now().isoformat()
            }
        
        # FASE 1: REVISÃO E FUNDAMENTOS (21 dias)
        logger.info("📖 Adding Phase 1: Review and Fundamentals")
        
        # Semana 1
        tasks.append(add_task(1, "Matemática Básica - Parte 1", "Operações fundamentais e propriedades"))
        tasks.append(add_task(2, "Matemática Básica - Parte 2", "Continuação: operações e propriedades"))
        tasks.append(add_task(3, "Funções e Gráficos - Parte 1", "Estudo de funções básicas"))
        tasks.append(add_task(4, "Funções e Gráficos - Parte 2", "Análise de gráficos"))
        tasks.append(add_task(5, "Exercícios Práticos - Mat. Básica", "Resolver 20+ exercícios", "exercise"))
        tasks.append(add_task(6, "Exercícios Práticos - Cont.", "Continuar exercícios", "exercise"))
        tasks.append(add_task(7, "🔄 REVISÃO Matemática Básica", "Revisão completa + Autoavaliação", "revision"))
        
        # Semana 2
        tasks.append(add_task(8, "Operações com Matrizes", "Soma, multiplicação, propriedades"))
        tasks.append(add_task(9, "Operações com Matrizes - Cont.", "Exercícios de operações"))
        tasks.append(add_task(10, "Determinantes e Matrizes Inversas", "Cálculo e aplicações"))
        tasks.append(add_task(11, "Determinantes - Exercícios", "Resolver problemas", "exercise"))
        tasks.append(add_task(12, "Sistemas Lineares - Gauss", "Método de eliminação de Gauss"))
        tasks.append(add_task(13, "Sistemas Lineares - Cramer", "Regra de Cramer e aplicações"))
        tasks.append(add_task(14, "✏️ LISTA 1 - Matrizes", "Lista completa de atividades", "exercise"))
        
        # Semana 3
        tasks.append(add_task(15, "Limites e Continuidade", "Revisão de limites"))
        tasks.append(add_task(16, "Limites - Exercícios", "Resolução de problemas", "exercise"))
        tasks.append(add_task(17, "Derivadas - Revisão", "Regras de derivação"))
        tasks.append(add_task(18, "Integrais - Revisão", "Técnicas de integração"))
        tasks.append(add_task(19, "Geometria Analítica - Vetores", "Operações com vetores"))
        tasks.append(add_task(20, "Geometria Analítica - Retas e Planos", "Equações e aplicações"))
        tasks.append(add_task(21, "🔄 REVISÃO GERAL Fase 1", "Revisão completa da Fase 1", "revision"))
        
        # FASE 2: EQUAÇÕES DIFERENCIAIS BÁSICAS (28 dias)
        logger.info("📖 Adding Phase 2: Basic Differential Equations")
        
        # Semana 4
        tasks.append(add_task(22, "Introdução às EDOs", "Conceitos fundamentais e classificação"))
        tasks.append(add_task(23, "Classificação de EDOs", "Ordem, grau, linearidade"))
        tasks.append(add_task(24, "Soluções Gerais e Particulares", "Tipos de soluções"))
        tasks.append(add_task(25, "Soluções - Exercícios", "Verificação de soluções", "exercise"))
        tasks.append(add_task(26, "Problemas de Valor Inicial (PVI)", "Condições iniciais"))
        tasks.append(add_task(27, "PVI - Aplicações", "Resolução de PVIs"))
        tasks.append(add_task(28, "✏️ EXERCÍCIOS Introdução EDOs", "Lista de exercícios", "exercise"))
        
        # Semana 5
        tasks.append(add_task(29, "EDOs 1ª Ordem - Separáveis", "Método de separação de variáveis"))
        tasks.append(add_task(30, "Separáveis - Exercícios", "Resolver 10+ problemas", "exercise"))
        tasks.append(add_task(31, "EDOs Lineares 1ª Ordem", "Forma padrão e solução"))
        tasks.append(add_task(32, "Lineares 1ª Ordem - Exercícios", "Aplicações", "exercise"))
        tasks.append(add_task(33, "Fator Integrante - Teoria", "Método do fator integrante"))
        tasks.append(add_task(34, "Fator Integrante - Prática", "Exercícios resolvidos", "exercise"))
        tasks.append(add_task(35, "✏️ LISTA 2 - EDOs 1ª Ordem Parte I", "Lista completa", "exercise"))
        
        # Semana 6
        tasks.append(add_task(36, "Equações Exatas - Teoria", "Definição e critério de exatidão"))
        tasks.append(add_task(37, "Equações Exatas - Prática", "Resolução de problemas", "exercise"))
        tasks.append(add_task(38, "Equações de Bernoulli", "Substituição e solução"))
        tasks.append(add_task(39, "Bernoulli - Exercícios", "Aplicações práticas", "exercise"))
        tasks.append(add_task(40, "Aplicações em Circuitos RC", "EDOs em circuitos elétricos"))
        tasks.append(add_task(41, "Aplicações - Problemas", "Resolver problemas de engenharia", "exercise"))
        tasks.append(add_task(42, "🔄 REVISÃO EDOs 1ª Ordem", "Revisão completa", "revision"))
        
        # Semana 7
        tasks.append(add_task(43, "Problemas Complexos - Parte 1", "Exercícios avançados"))
        tasks.append(add_task(44, "Problemas Complexos - Parte 2", "Continuação", "exercise"))
        tasks.append(add_task(45, "Aplicações em Eng. Elétrica - 1", "Problemas práticos"))
        tasks.append(add_task(46, "Aplicações em Eng. Elétrica - 2", "Mais aplicações", "exercise"))
        tasks.append(add_task(47, "⭐ ATIVIDADE AVALIATIVA 1 - Prep", "Preparação para avaliação", "exercise"))
        tasks.append(add_task(48, "⭐ ATIVIDADE AVALIATIVA 1", "ENTREGA DA AVALIAÇÃO", "delivery"))
        tasks.append(add_task(49, "🔄 REVISÃO Fase 2", "Revisão completa da Fase 2", "revision"))
        
        # FASE 3: SÉRIES E MÉTODOS (21 dias)
        logger.info("📖 Adding Phase 3: Series and Methods")
        
        # Semana 8
        tasks.append(add_task(50, "Sequências - Definição", "Conceito e convergência"))
        tasks.append(add_task(51, "Convergência de Sequências", "Critérios e testes"))
        tasks.append(add_task(52, "Séries Infinitas - Introdução", "Definição e propriedades"))
        tasks.append(add_task(53, "Testes de Convergência", "Teste da razão, comparação, etc"))
        tasks.append(add_task(54, "Séries de Potências - Teoria", "Introdução e conceitos"))
        tasks.append(add_task(55, "Séries de Potências - Exercícios", "Problemas resolvidos", "exercise"))
        tasks.append(add_task(56, "✏️ EXERCÍCIOS Séries", "Lista de exercícios", "exercise"))
        
        # Semana 9
        tasks.append(add_task(57, "Séries de Taylor - Teoria", "Desenvolvimento em séries"))
        tasks.append(add_task(58, "Séries de Taylor - Aplicações", "Exercícios", "exercise"))
        tasks.append(add_task(59, "Raio de Convergência - Teoria", "Cálculo do raio"))
        tasks.append(add_task(60, "Raio de Convergência - Prática", "Exercícios", "exercise"))
        tasks.append(add_task(61, "Aplicações em EDOs - Parte 1", "Soluções em série"))
        tasks.append(add_task(62, "Aplicações em EDOs - Parte 2", "Mais aplicações"))
        tasks.append(add_task(63, "🔄 REVISÃO Séries", "Revisão completa", "revision"))
        
        # Semana 10
        tasks.append(add_task(64, "Pontos Ordinários - Teoria", "Soluções em pontos regulares"))
        tasks.append(add_task(65, "Pontos Ordinários - Exercícios", "Problemas", "exercise"))
        tasks.append(add_task(66, "Pontos Singulares - Teoria", "Método de Frobenius"))
        tasks.append(add_task(67, "Pontos Singulares - Prática", "Aplicações", "exercise"))
        tasks.append(add_task(68, "✏️ LISTA 3 - Métodos das Séries", "Lista completa", "exercise"))
        tasks.append(add_task(69, "Revisão de Métodos", "Consolidação"))
        tasks.append(add_task(70, "🔄 REVISÃO Fase 3", "Revisão completa da Fase 3", "revision"))
        
        # FASE 4: EDOs DE ORDEM SUPERIOR (21 dias)
        logger.info("📖 Adding Phase 4: Higher Order ODEs")
        
        # Semana 11
        tasks.append(add_task(71, "EDOs 2ª Ordem Homogêneas", "Introdução e conceitos"))
        tasks.append(add_task(72, "Equação Característica", "Resolução e análise"))
        tasks.append(add_task(73, "Raízes Reais Distintas", "Solução geral"))
        tasks.append(add_task(74, "Raízes Reais - Exercícios", "Problemas", "exercise"))
        tasks.append(add_task(75, "Raízes Complexas e Repetidas", "Casos especiais"))
        tasks.append(add_task(76, "Casos Especiais - Exercícios", "Aplicações", "exercise"))
        tasks.append(add_task(77, "✏️ EXERCÍCIOS 2ª Ordem", "Lista de exercícios", "exercise"))
        
        # Semana 12
        tasks.append(add_task(78, "EDOs Não-Homogêneas - Intro", "Solução geral"))
        tasks.append(add_task(79, "Coeficientes Indeterminados - Teoria", "Método explicado"))
        tasks.append(add_task(80, "Coeficientes Indeterminados - Prática", "Exercícios", "exercise"))
        tasks.append(add_task(81, "Variação dos Parâmetros - Teoria", "Método de Lagrange"))
        tasks.append(add_task(82, "Variação dos Parâmetros - Prática", "Aplicações", "exercise"))
        tasks.append(add_task(83, "Sistemas Vibratórios", "Aplicações físicas"))
        tasks.append(add_task(84, "⭐ ATIVIDADE AVALIATIVA 2", "ENTREGA DA AVALIAÇÃO", "delivery"))
        
        # Semana 13
        tasks.append(add_task(85, "EDOs de Ordem n - Teoria", "Generalização"))
        tasks.append(add_task(86, "EDOs Ordem n - Métodos", "Resolução geral"))
        tasks.append(add_task(87, "Existência e Unicidade", "Teoremas fundamentais"))
        tasks.append(add_task(88, "Teoremas - Aplicações", "Análise de problemas"))
        tasks.append(add_task(89, "Aplicações Práticas - Parte 1", "Problemas de engenharia"))
        tasks.append(add_task(90, "Aplicações Práticas - Parte 2", "Mais problemas", "exercise"))
        tasks.append(add_task(91, "🔄 REVISÃO Fase 4", "Revisão completa da Fase 4", "revision"))
        
        # FASE 5: TRANSFORMADA DE LAPLACE (7 dias)
        logger.info("📖 Adding Phase 5: Laplace Transform")
        
        # Semana 14
        tasks.append(add_task(92, "Transformada de Laplace - Definição", "Conceito e propriedades"))
        tasks.append(add_task(93, "Propriedades Fundamentais", "Linearidade, translação, etc"))
        tasks.append(add_task(94, "Solução de EDOs com Laplace", "Método completo"))
        tasks.append(add_task(95, "Laplace - Condições Iniciais", "Aplicação do método"))
        tasks.append(add_task(96, "Aplicações em Sistemas Dinâmicos", "Problemas práticos"))
        tasks.append(add_task(97, "Aplicações em Circuitos", "EDOs em circuitos RLC"))
        tasks.append(add_task(98, "✏️ LISTA 4 - Laplace", "Lista completa de exercícios", "exercise"))
        
        # FASE 6: REVISÃO FINAL E ENTREGA (12 dias)
        logger.info("📖 Adding Phase 6: Final Review and Delivery")
        
        tasks.append(add_task(99, "Revisão: EDOs 1ª Ordem", "Manhã: revisão completa", "revision"))
        tasks.append(add_task(100, "Revisão: EDOs 2ª Ordem", "Tarde: revisão completa", "revision"))
        tasks.append(add_task(101, "Revisão: Séries e Métodos", "Noite: revisão", "revision"))
        tasks.append(add_task(102, "Revisão: Laplace e Aplicações", "Revisão final", "revision"))
        tasks.append(add_task(103, "Revisão Geral - Parte 1", "Tópicos 1-5", "revision"))
        tasks.append(add_task(104, "Revisão Geral - Parte 2", "Tópicos 6-10", "revision"))
        tasks.append(add_task(105, "Revisão Geral - Parte 3", "Todos os tópicos", "revision"))
        tasks.append(add_task(106, "🎯 SIMULADO COMPLETO", "Simulado de todas as matérias", "exercise"))
        tasks.append(add_task(107, "Análise do Simulado", "Revisar erros e acertos"))
        tasks.append(add_task(108, "Organização do Material", "Preparar para entrega"))
        tasks.append(add_task(109, "Revisão Final de Entregas", "Verificar todas as listas"))
        tasks.append(add_task(110, "📦 ENTREGA FINAL - DIA D", "ENTREGA ATÉ 23:59", "delivery"))
        
        # Insert all tasks
        logger.info(f"💾 Inserting {len(tasks)} tasks into database")
        
        for task in tasks:
            await db.tasks.update_one(
                {"id": task["id"]},
                {"$set": task},
                upsert=True
            )
        
        # Create study sessions for tracking
        sessions_created = len(tasks)
        
        client.close()
        
        logger.info("✅ Schedule import completed successfully")
        
        return {
            "success": True,
            "message": "Cronograma completo importado com sucesso!",
            "details": {
                "subject": subject["name"],
                "professor": "Thiago Vedovato",
                "institution": "IFJ - Jataí/GO",
                "total_tasks": len(tasks),
                "start_date": request.start_date,
                "end_date": request.end_date,
                "duration_days": 110,
                "phases": 6,
                "activities": {
                    "study": len([t for t in tasks if t["type"] == "study"]),
                    "exercises": len([t for t in tasks if t["type"] == "exercise"]),
                    "revisions": len([t for t in tasks if t["type"] == "revision"]),
                    "deliveries": len([t for t in tasks if t["type"] == "delivery"])
                }
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error importing schedule: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao importar cronograma: {str(e)}"
        )
