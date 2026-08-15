# Cronograma de Estudo — Estrutura de Dados (IFG Jataí)

Plano completo em 8 etapas, unindo os **fundamentos** (leitura de vetores, soma/média,
list comprehensions, métodos de listas e condicionais) ao **núcleo** de Estrutura de Dados
(complexidade, busca/ordenação, recursão, listas encadeadas, pilhas, filas, árvores, hash e grafos).

**Método por etapa:** teoria (vídeo/resumo) → prática no Juiz Virtual/Beecrowd → revisão no dia seguinte.
Estude 1–2 etapas por semana.

---

## Etapa 1 — Fundamentos

> Base do cronograma. Domine 100% antes de seguir.

- **Leitura de dados e armazenamento em vetores** — `input().split()`, laço de preenchimento, percurso, acesso por índice
- **Cálculo de soma e média** — acumulador, média de vetor, valores maiores/menores que a média
- **Condições `if` para comparar valores** — `if/elif/else`, maior/menor de N números, classificação
- **List comprehensions** — filtrar (`[x for x in v if x > 5]`), contabilizar (`sum(1 for ...)`), mapear
- **Métodos de listas** — `reverse()`, `count()`, `append()`, `sort()`, `index()`, `in`, `len()`

**Praticar:** no Juiz Virtual use "Criar exercício por texto" com, ex.:
*"leia 10 números, guarde num vetor e imprima a média e quantos estão acima dela"* — ou Beecrowd 1154, 1174, 1180.

## Etapa 2 — Vetores/Arrays e Matrizes (introdução à ED)

- Vetor: alocação, acesso O(1), percurso, cópias
- Matriz 2D: `matriz[i][j]`, soma de linhas/colunas/diagonais, transposta, identidade
- Ordenação simples de vetor (selection/bubble) e busca linear
- **Praticar:** Beecrowd 1181–1185, 1435

## Etapa 3 — Complexidade (Big-O) + Busca e Ordenação

- Notação Big-O: O(1), O(n), O(n²), O(log n)
- Busca linear vs binária (vetor ordenado)
- Ordenação: Bubble, Selection, Insertion (O(n²)) → Merge/Quick (O(n log n))
- **Praticar:** Beecrowd 1059, 1547, 1038

## Etapa 4 — Recursão

- Função que chama a si mesma, caso-base, pilha de chamadas
- Fatorial, Fibonacci, potência, soma de dígitos
- Converter recursão ↔ iterativo
- **Praticar:** Beecrowd 1161, 1169, 1029

## Etapa 5 — Listas Encadeadas, Pilhas e Filas (núcleo da ED)

- **Lista encadeada:** nó (valor + ponteiro), inserir/remover no início/fim, percorrer
- **Pilha (stack):** LIFO — `push/pop/top`, aplicação em parênteses/expressões
- **Fila (queue):** FIFO — `enqueue/dequeue/front`, aplicação em filas de processos
- **Praticar:** Beecrowd 1068 (parênteses), 1340, 1110, 1069

## Etapa 6 — Árvores e Tabelas Hash

- Árvore binária: raiz, filhos, folhas; percursos pré/pós/in-ordem
- Árvore binária de busca (BST): inserir/buscar
- Tabela hash: função hash, colisão, busca rápida (dict/set)
- **Praticar:** Beecrowd 1195, 1455, 1286

## Etapa 7 — Grafos (introdução)

- Grafo: vértices e arestas, representação (matriz/lista de adjacência)
- Busca em profundidade (DFS) e em largura (BFS)
- Menor caminho simples (conceito)
- **Praticar:** Beecrowd 1195, 1082, 1799

## Etapa 8 — Revisão e Simulado

- Refaça todos os exercícios "errados" do Juiz Virtual
- Simulado: 1 exercício de cada etapa em 1h
- Use o chat do app: *"explique a diferença entre pilha e fila com exemplo em Python"* ou *"gere um exercício de árvore binária"*

---

## Resumo

**Adicionados (núcleo de ED que estava faltando):** complexidade/Big-O, ordenação e busca binária,
recursão, listas encadeadas, pilhas, filas, árvores, tabelas hash e grafos.

**Base mantida (Etapa 1):** os tópicos de fundamentos — vetores, soma/média, list comprehensions,
métodos de listas e condicionais.
