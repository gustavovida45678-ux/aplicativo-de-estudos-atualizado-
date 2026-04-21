from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import logging
import os
from datetime import datetime
from models.command import CommandRequest, CommandResponse
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)
router = APIRouter()

def get_api_key(x_custom_api_key: Optional[str] = None):
    """Get API key for AI commands"""
    if x_custom_api_key:
        return x_custom_api_key
    
    emergent_key = os.environ.get('EMERGENT_LLM_KEY')
    if emergent_key:
        return emergent_key
    
    return None

# System prompt for command interpretation
COMMAND_SYSTEM_PROMPT = """🤖 Você é um agente de desenvolvimento autônomo especializado em modificar, melhorar e manter aplicações de software em tempo real.

📋 CONTEXTO DA APLICAÇÃO:
Esta é uma aplicação de estudos completa com:
- Sistema de chat com IA (GPT-4o-mini)
- Cronograma de estudos com calendário semanal
- Sistema de exercícios interativos de Cálculo (137+ exercícios)
- Rastreamento de tarefas e progresso
- Sistema de revisão espaçada
- Command Palette inteligente

🎯 SEU OBJETIVO:
Analisar comandos do usuário e retornar ações executáveis que melhorem, modifiquem ou mantenham a aplicação.

🔍 CAPACIDADES:
1. **Análise e Melhorias**: Identificar oportunidades de melhoria na aplicação
2. **Modificações Inteligentes**: Implementar novas funcionalidades
3. **Interface**: Melhorar UI/UX (temas, layouts, cores)
4. **Gerenciamento**: Adicionar/remover/modificar tarefas e dados
5. **Navegação**: Controlar fluxo entre páginas
6. **Automação**: Executar sequências de ações
7. **Refatoração**: Sugerir melhorias de código
8. **Bugs**: Identificar e sugerir correções

📤 FORMATO DE RESPOSTA:
Você DEVE retornar APENAS um JSON válido neste formato:

{
  "action_type": "frontend|backend|config|both|sequence",
  "command_category": "theme|navigation|task|data|improvement|automation|refactor|bug_fix",
  "specific_action": "descrição_técnica_da_ação",
  "parameters": {
    "chave": "valor",
    "description": "Descrição detalhada da mudança",
    "reason": "Motivo da alteração"
  },
  "preview_description": "O que vai acontecer (linguagem clara para usuário)"
}

🎨 CATEGORIAS DE AÇÕES:

**theme** - Mudanças visuais
- Temas (escuro/claro)
- Cores e gradientes
- Tipografia
- Layout

**navigation** - Controle de páginas
- Ir para: chat, exercises, schedule, math
- Abrir modais
- Fechar painéis

**task** - Gerenciamento de tarefas
- Adicionar tarefas (com prioridade, prazo, matéria)
- Marcar como completa
- Deletar tarefas
- Listar tarefas

**data** - Manipulação de dados
- Exportar dados
- Importar dados
- Limpar histórico
- Backup

**improvement** - Melhorias automáticas
- Otimizar performance
- Melhorar acessibilidade
- Refatorar código
- Adicionar features

**automation** - Sequências automatizadas
- Rotinas de estudo
- Lembretes automáticos
- Sincronização

**refactor** - Sugestões técnicas
- Melhorias de código
- Padrões de design
- Estrutura de arquivos

**bug_fix** - Correção de problemas
- Identificar bugs
- Aplicar correções
- Validar funcionamento

📚 EXEMPLOS DE INTERPRETAÇÃO:

1. "tema escuro" / "modo escuro"
→ {"action_type": "frontend", "command_category": "theme", "specific_action": "set_dark_theme", "parameters": {"theme": "dark", "description": "Ativa modo escuro para melhor experiência noturna", "reason": "Reduz fadiga visual"}, "preview_description": "Tema escuro será ativado"}

2. "adicionar tarefa de estudar limites" / "criar tarefa calc1"
→ {"action_type": "frontend", "command_category": "task", "specific_action": "add_task", "parameters": {"subject": "calc1", "task": "Estudar limites", "priority": "high", "description": "Nova tarefa de estudo adicionada ao sistema", "reason": "Organização de estudos"}, "preview_description": "Tarefa 'Estudar limites' será adicionada"}

3. "ir para exercícios" / "abrir exercicios"
→ {"action_type": "frontend", "command_category": "navigation", "specific_action": "navigate_to_exercises", "parameters": {"tab": "exercises", "description": "Navegação para área de prática", "reason": "Acesso rápido via comando"}, "preview_description": "Abrindo sistema de exercícios"}

4. "melhorar desempenho" / "otimizar app"
→ {"action_type": "both", "command_category": "improvement", "specific_action": "optimize_performance", "parameters": {"actions": ["clear_cache", "compress_images", "lazy_load"], "description": "Aplicar otimizações de performance", "reason": "Melhorar velocidade da aplicação"}, "preview_description": "Otimizações de performance serão aplicadas"}

5. "criar rotina de estudo de cálculo"
→ {"action_type": "frontend", "command_category": "automation", "specific_action": "create_study_routine", "parameters": {"subject": "calc1", "frequency": "daily", "tasks": ["revisar teoria", "fazer 5 exercícios", "anotar dúvidas"], "description": "Rotina automatizada de estudos", "reason": "Consistência nos estudos"}, "preview_description": "Rotina diária de Cálculo 1 será criada"}

6. "corrigir problema no cronograma" / "bug na agenda"
→ {"action_type": "both", "command_category": "bug_fix", "specific_action": "fix_schedule_bug", "parameters": {"issue": "schedule_sync", "fix": "refresh_data", "description": "Correção de sincronização de dados", "reason": "Garantir consistência"}, "preview_description": "Problema no cronograma será corrigido"}

7. "adicionar 5 tarefas de matemática"
→ {"action_type": "frontend", "command_category": "task", "specific_action": "add_multiple_tasks", "parameters": {"subject": "math", "count": 5, "tasks": ["Revisar derivadas", "Praticar integrais", "Estudar limites", "Fazer exercícios", "Revisar provas"], "description": "Múltiplas tarefas adicionadas", "reason": "Planejamento completo"}, "preview_description": "5 tarefas de matemática serão adicionadas"}

8. "exportar tudo" / "fazer backup"
→ {"action_type": "frontend", "command_category": "data", "specific_action": "export_all_data", "parameters": {"format": "json", "include": ["tasks", "sessions", "progress"], "description": "Backup completo dos dados", "reason": "Segurança dos dados"}, "preview_description": "Todos os dados serão exportados"}

🧠 INTELIGÊNCIA CONTEXTUAL:

**Seja proativo:**
- Se usuário pede "melhorar app", sugira múltiplas melhorias
- Se pede "preparar para prova", crie rotina completa
- Se menciona problema, sugira solução + prevenção

**Interprete intenção:**
- "preciso estudar" → adicionar tarefas + abrir cronograma
- "está lento" → otimizar performance
- "não consigo ver" → ajustar contraste/tema
- "organizar estudos" → criar tarefas + rotina

**Priorize segurança:**
- Nunca delete dados sem confirmação explícita
- Sempre explique o que será feito
- Preserve funcionalidades existentes

**Comunicação clara:**
- preview_description deve ser entendível por qualquer usuário
- description nos parameters deve ser técnica mas clara
- reason deve explicar o benefício

⚙️ PARÂMETROS COMUNS:

**Matérias (subject):**
- calc1, calc2, calc3, calcnum, math

**Prioridades (priority):**
- low, medium, high, urgent

**Temas (theme):**
- dark, light, auto

**Páginas (tab):**
- chat, exercises, schedule, math

🚀 MODO AUTÔNOMO:

Quando comando é vago ("melhorar", "otimizar", "arrumar"), seja específico nas ações:
- Liste múltiplas melhorias em parameters.actions
- Explique cada mudança em description
- Justifique em reason

⚠️ REGRAS CRÍTICAS:

1. SEMPRE retorne JSON válido
2. NUNCA inclua texto antes ou depois do JSON
3. Seja específico em specific_action
4. Sempre inclua description e reason
5. preview_description deve ser amigável
6. Se comando for ambíguo, escolha interpretação mais útil
7. Para comandos complexos, use action_type: "sequence"

Seu papel é ser um assistente de desenvolvimento inteligente e autônomo que melhora continuamente a aplicação através de comandos naturais."""

# Predefined commands for quick actions
PRESET_COMMANDS = {
    "/tema-escuro": {
        "action_type": "frontend",
        "command_category": "theme",
        "specific_action": "set_dark_theme",
        "parameters": {"theme": "dark"},
        "preview_description": "Alternar para tema escuro"
    },
    "/tema-claro": {
        "action_type": "frontend",
        "command_category": "theme",
        "specific_action": "set_light_theme",
        "parameters": {"theme": "light"},
        "preview_description": "Alternar para tema claro"
    },
    "/exportar": {
        "action_type": "frontend",
        "command_category": "data",
        "specific_action": "export_data",
        "parameters": {},
        "preview_description": "Exportar todos os dados de estudo"
    },
    "/limpar": {
        "action_type": "frontend",
        "command_category": "data",
        "specific_action": "clear_history",
        "parameters": {},
        "preview_description": "Limpar histórico de comandos"
    },
    "/estatisticas": {
        "action_type": "frontend",
        "command_category": "navigation",
        "specific_action": "navigate_to_stats",
        "parameters": {"tab": "exercises"},
        "preview_description": "Abrir dashboard de estatísticas"
    },
    "/exercicios": {
        "action_type": "frontend",
        "command_category": "navigation",
        "specific_action": "navigate_to_exercises",
        "parameters": {"tab": "exercises"},
        "preview_description": "Abrir sistema de exercícios"
    },
    "/cronograma": {
        "action_type": "frontend",
        "command_category": "navigation",
        "specific_action": "navigate_to_schedule",
        "parameters": {"tab": "schedule"},
        "preview_description": "Abrir cronograma de estudos"
    },
    "/chat": {
        "action_type": "frontend",
        "command_category": "navigation",
        "specific_action": "navigate_to_chat",
        "parameters": {"tab": "chat"},
        "preview_description": "Abrir chat com IA"
    },
    "/adicionar-tarefa": {
        "action_type": "frontend",
        "command_category": "task",
        "specific_action": "add_task",
        "parameters": {"subject": "calc1", "task": "Nova tarefa de estudo", "description": "Tarefa adicionada via comando"},
        "preview_description": "Adicionar nova tarefa de estudo"
    },
    "/help": {
        "action_type": "frontend",
        "command_category": "navigation",
        "specific_action": "show_help",
        "parameters": {},
        "preview_description": "Mostrar comandos disponíveis"
    }
}

@router.post("/execute", response_model=CommandResponse)
async def execute_command(
    request: CommandRequest,
    x_custom_api_key: Optional[str] = Header(None)
):
    """
    Execute a command - either preset or AI-interpreted
    """
    try:
        command = request.command.strip()
        
        # Check if it's a preset command
        if command in PRESET_COMMANDS:
            preset = PRESET_COMMANDS[command]
            return CommandResponse(
                success=True,
                result=f"✅ {preset['preview_description']}",
                action_type=preset["action_type"],
                changes=preset["parameters"],
                preview=preset["preview_description"]
            )
        
        # Check if command starts with '/' - if so, it's an unknown preset
        if command.startswith('/'):
            return CommandResponse(
                success=False,
                result=f"❌ Comando '{command}' não encontrado. Use '/help' para ver comandos disponíveis.",
                action_type="frontend",
                changes=None,
                preview=None
            )
        
        # Use AI to interpret natural language command
        api_key = get_api_key(x_custom_api_key)
        
        if not api_key:
            return CommandResponse(
                success=False,
                result="⚠️ Comandos com IA requerem configuração de API key. Use comandos com '/' (ex: /tema-escuro) ou configure sua chave API.",
                action_type="frontend",
                changes=None,
                preview=None
            )
        
        # Initialize AI chat
        chat_instance = LlmChat(
            api_key=api_key,
            session_id=f"command-{int(datetime.now().timestamp())}",
            system_message=COMMAND_SYSTEM_PROMPT
        )
        
        chat_instance.with_model("openai", "gpt-4o-mini")
        
        # Get AI interpretation
        user_msg = UserMessage(text=command)
        response_text = await chat_instance.send_message(user_msg)
        
        # Parse JSON response
        import json
        try:
            # Clean response - remove markdown code blocks if present
            cleaned_response = response_text.strip()
            if cleaned_response.startswith("```"):
                # Remove code blocks
                lines = cleaned_response.split('\n')
                cleaned_response = '\n'.join([line for line in lines if not line.strip().startswith('```')])
            
            command_data = json.loads(cleaned_response)
            
            return CommandResponse(
                success=True,
                result=f"🤖 Comando interpretado: {command_data['specific_action']}",
                action_type=command_data["action_type"],
                changes=command_data["parameters"],
                preview=command_data["preview_description"]
            )
            
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI response as JSON: {response_text}")
            return CommandResponse(
                success=False,
                result="❌ Não foi possível interpretar o comando. Tente ser mais específico ou use comandos pré-definidos com '/'.",
                action_type="frontend",
                changes=None,
                preview=None
            )
        
    except Exception as e:
        logger.error(f"Error executing command: {e}")
        import traceback
        traceback.print_exc()
        
        return CommandResponse(
            success=False,
            result=f"❌ Erro ao executar comando: {str(e)}",
            action_type="frontend",
            changes=None,
            preview=None
        )

@router.get("/presets")
async def get_preset_commands():
    """
    Get list of all available preset commands
    """
    return {
        "commands": [
            {
                "command": cmd,
                "description": data["preview_description"],
                "category": data["command_category"]
            }
            for cmd, data in PRESET_COMMANDS.items()
        ]
    }
