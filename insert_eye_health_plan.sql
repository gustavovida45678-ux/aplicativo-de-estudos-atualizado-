-- Execute no Supabase SQL Editor (https://supabase.com/dashboard/project/SEU_PROJECT/sql)
-- Substitua 'SEU_USER_ID' pelo seu UUID do auth.users

-- Inserir plano de estudo para Saúde dos Olhos
INSERT INTO public.study_plans (user_id, title, description, subjects, schedule, is_active)
VALUES (
    'SEU_USER_ID',  -- SUBSTITUA PELO SEU USER ID (auth.uid())
    'Saúde dos Olhos - Protocolo Completo',
    'Protocolo diário/semanal de exercícios e cuidados para saúde ocular, incluindo palming, automassagem, compressas, sunning, exercícios para moscas volantes, piscar, olhar longe, tampão, pausas, nutrição e circulação.',
    '[
        {"id": "mod1-palming", "module": 1, "title": "Palming", "description": "30 minutos por dia. Pode ser dividido em 3 a 4 x ao dia.", "duration": "30 min/dia", "frequency": "diário", "completed": false},
        {"id": "mod1-automassagem", "module": 1, "title": "Automassagem", "description": "1 x ao dia (em média 5 a 10 minutos)", "duration": "5-10 min", "frequency": "diário", "completed": false},
        {"id": "mod1-respiracao", "module": 1, "title": "Exercícios Respiratórios para Ansiedade", "description": "2 a 3 x na semana", "duration": "--", "frequency": "2-3x/semana", "completed": false},
        {"id": "mod1-compressa", "module": 1, "title": "Compressa Fria", "description": "5 minutos por dia", "duration": "5 min", "frequency": "diário", "completed": false},
        {"id": "mod1-moscas", "module": 1, "title": "Olhar e Seguir Moscas Volantes", "description": "Olhar e seguir as moscas volantes com o olho até ela desaparecer e em seguida olhar longe. Caso tenha moscas nos 2 olhos, fazer primeiro cobrindo um, e depois o outro. Faça todos os dias até esta mosca desaparecer de vez. Não fuja das moscas, olhe para elas.", "duration": "até desaparecer", "frequency": "diário", "completed": false},
        {"id": "mod2-sunning", "module": 2, "title": "Sunning (Ensolar)", "description": "10 minutos 4 x na semana", "duration": "10 min", "frequency": "4x/semana", "completed": false},
        {"id": "mod2-banho-escuro", "module": 2, "title": "Banho no Escuro", "description": "Todas as noites", "duration": "--", "frequency": "diário (noite)", "completed": false},
        {"id": "mod3-piscar", "module": 3, "title": "Exercícios para Piscar Melhor", "description": "1 x por dia", "duration": "--", "frequency": "diário", "completed": false},
        {"id": "mod4-olhar-longe", "module": 4, "title": "Olhar Longe", "description": "10 minutos por dia", "duration": "10 min", "frequency": "diário", "completed": false},
        {"id": "mod5-tampao", "module": 5, "title": "Tampão e Bolinha (Olho Mais Fraco)", "description": "8 min 3 x na semana - se houver diferença entre um olho e outro", "duration": "8 min", "frequency": "3x/semana", "completed": false},
        {"id": "bonus-pausas", "module": "bônus", "title": "Pausas no Computador/Leitura/TV", "description": "A cada 40 minutos parar por 10 minutos no mínimo e descansar, fazer qualquer outra coisa e depois voltar. Bônus: 11 Dicas para usar o Computador e Celular sem cansar os olhos.", "duration": "10 min a cada 40 min", "frequency": "contínuo", "completed": false},
        {"id": "bonus-nutricao", "module": "bônus", "title": "Cuidar da Nutrição", "description": "Alimentação para Saúde dos Olhos", "duration": "--", "frequency": "diário", "completed": false},
        {"id": "bonus-circulacao", "module": "bônus", "title": "Intensificar a Circulação Corporal", "description": "Circulação para os Olhos", "duration": "--", "frequency": "regular", "completed": false},
        {"id": "bonus-emocoes", "module": "bônus", "title": "Cuidar das Emoções e Exercícios Físicos", "description": "Praticar exercícios físicos regulares", "duration": "--", "frequency": "regular", "completed": false},
        {"id": "investigacao", "module": "importante", "title": "Investigar Causa das Moscas Volantes", "description": "Na maioria das vezes é stress, mas sempre investigue com o oftalmologista. Relaxe, elas são suas amigas, e estão te alertando para cuidar melhor de você e dos seus olhos.", "duration": "--", "frequency": "conforme necessário", "completed": false}
    ]'::jsonb,
    '{"daily": ["mod1-palming", "mod1-automassagem", "mod1-compressa", "mod1-moscas", "mod2-banho-escuro", "mod3-piscar", "mod4-olhar-longe", "bonus-pausas"], "weekly": ["mod1-respiracao", "mod2-sunning", "mod5-tampao", "bonus-nutricao", "bonus-circulacao", "bonus-emocoes"]}'::jsonb,
    true
)
ON CONFLICT DO NOTHING;

-- Para obter seu user_id, execute no SQL Editor:
-- SELECT id, email FROM auth.users WHERE email = 'seu@email.com';
