-- Alternativa: Inserir como exercícios individuais na tabela exercises
-- Execute no Supabase SQL Editor

-- Substitua 'SEU_USER_ID' e opcionalmente 'STUDY_PLAN_ID' se já criou o plano acima

INSERT INTO public.exercises (user_id, study_plan_id, title, content, subject, difficulty, type, questions)
VALUES 
-- Módulo 1
('SEU_USER_ID', NULL, 'Palming - Módulo 1', '30 minutos por dia. Pode ser dividido em 3 a 4 x ao dia.', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
('SEU_USER_ID', NULL, 'Automassagem - Módulo 1', '1 x ao dia (em média 5 a 10 minutos)', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
('SEU_USER_ID', NULL, 'Exercícios Respiratórios para Ansiedade - Módulo 1', '2 a 3 x na semana', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
('SEU_USER_ID', NULL, 'Compressa Fria - Módulo 1', '5 minutos por dia', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
('SEU_USER_ID', NULL, 'Olhar e Seguir Moscas Volantes - Módulo 1', 'Olhar e seguir as moscas volantes com o olho até ela desaparecer e em seguida olhar longe. Caso tenha moscas nos 2 olhos, fazer primeiro cobrindo um, e depois o outro. Faça todos os dias até esta mosca desaparecer de vez. Não fuja das moscas, olhe para elas.', 'Saúde dos Olhos', 'medium', 'open', '[]'::jsonb),
-- Módulo 2
('SEU_USER_ID', NULL, 'Sunning (Ensolar) - Módulo 2', '10 minutos 4 x na semana', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
('SEU_USER_ID', NULL, 'Banho no Escuro - Módulo 2', 'Todas as noites', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
-- Módulo 3
('SEU_USER_ID', NULL, 'Exercícios para Piscar Melhor - Módulo 3', '1 x por dia', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
-- Módulo 4
('SEU_USER_ID', NULL, 'Olhar Longe - Módulo 4', '10 minutos por dia', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
-- Módulo 5
('SEU_USER_ID', NULL, 'Tampão e Bolinha (Olho Mais Fraco) - Módulo 5', '8 min 3 x na semana - se houver diferença entre um olho e outro', 'Saúde dos Olhos', 'medium', 'open', '[]'::jsonb),
-- Bônus
('SEU_USER_ID', NULL, 'Pausas no Computador/Leitura/TV - Bônus', 'A cada 40 minutos parar por 10 minutos no mínimo e descansar. 11 Dicas para usar o Computador e Celular sem cansar os olhos.', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
('SEU_USER_ID', NULL, 'Nutrição para Saúde dos Olhos - Bônus', 'Alimentação para Saúde dos Olhos', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
('SEU_USER_ID', NULL, 'Circulação Corporal para os Olhos - Bônus', 'Intensificar a circulação corporal', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
('SEU_USER_ID', NULL, 'Emoções e Exercícios Físicos - Bônus', 'Cuidar das emoções e praticar exercícios físicos regulares', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb),
('SEU_USER_ID', NULL, 'Investigar Causa das Moscas Volantes', 'Na maioria das vezes é stress, mas sempre investigue com o oftalmologista. Relaxe, elas são suas amigas, e estão te alertando para cuidar melhor de você e dos seus olhos.', 'Saúde dos Olhos', 'easy', 'open', '[]'::jsonb);
