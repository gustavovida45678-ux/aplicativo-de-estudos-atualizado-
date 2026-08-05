from fastapi import APIRouter, HTTPException
from typing import List
import logging
from models.exercise import Exercise, ExerciseAttemptCreate

logger = logging.getLogger(__name__)
router = APIRouter()

# Database de exercícios (em produção, viria do MongoDB)
EXERCISES_DB = {
    "calc1_1": [  # Limites
        {
            "id": "ex_calc1_1_1",
            "topic_id": "calc1_1",
            "question": "Calcule o limite: lim (x→2) (x² - 4)/(x - 2)",
            "options": ["0", "2", "4", "O limite não existe"],
            "correct_answer": 2,
            "explanation": "Fatorando o numerador: (x² - 4) = (x-2)(x+2). Simplificando: (x-2)(x+2)/(x-2) = x+2. Quando x→2, o resultado é 4.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_calc1_1_2",
            "topic_id": "calc1_1",
            "question": "Calcule: lim (x→0) (sen(x))/x",
            "options": ["0", "1", "∞", "O limite não existe"],
            "correct_answer": 1,
            "explanation": "Este é um limite fundamental: lim (x→0) sen(x)/x = 1. É um resultado importante usado em muitas demonstrações.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_calc1_1_3",
            "topic_id": "calc1_1",
            "question": "Para qual valor de 'a' a função f(x) = (x² + ax + 6)/(x - 2) é contínua em x = 2?",
            "options": ["a = -5", "a = -4", "a = 4", "Não existe tal valor"],
            "correct_answer": 0,
            "explanation": "Para ser contínua em x=2, o limite deve existir. O numerador deve ter (x-2) como fator: x²+ax+6=(x-2)(x+3)=x²+x-6. Logo a=-1... Ops! Vamos recalcular: (x-2)(x-b)=x²-(2+b)x+2b. Se 2b=6, b=3. Então -(2+3)=-5, logo a=-5.",
            "difficulty": "Avançado"
        }
    ],
    "calc1_2": [  # Derivadas
        {
            "id": "ex_calc1_2_1",
            "topic_id": "calc1_2",
            "question": "Calcule a derivada de f(x) = 3x² + 2x - 5",
            "options": ["6x + 2", "3x + 2", "6x² + 2x", "3x²"],
            "correct_answer": 0,
            "explanation": "Usando a regra da potência: d/dx(xⁿ) = n·xⁿ⁻¹. Portanto: f'(x) = 3·2x + 2·1 - 0 = 6x + 2",
            "difficulty": "Básico"
        },
        {
            "id": "ex_calc1_2_2",
            "topic_id": "calc1_2",
            "question": "Qual é a derivada de f(x) = sen(x)·cos(x)?",
            "options": ["cos²(x) - sen²(x)", "cos(x) - sen(x)", "cos(2x)", "sen²(x) - cos²(x)"],
            "correct_answer": 0,
            "explanation": "Usando a regra do produto: (uv)' = u'v + uv'. Então: f'(x) = cos(x)·cos(x) + sen(x)·(-sen(x)) = cos²(x) - sen²(x). Note que isso também equivale a cos(2x)!",
            "difficulty": "Intermediário"
        }
    ],
    "calc1_3": [  # Aplicações de Derivadas
        {
            "id": "ex_calc1_3_1",
            "topic_id": "calc1_3",
            "question": "Em que ponto a reta tangente à curva y = x³ é paralela à reta y = 3x + 1?",
            "options": ["x = 0", "x = 1", "x = -1 e x = 1", "x = 2"],
            "correct_answer": 2,
            "explanation": "A derivada y' = 3x² deve ser igual ao coeficiente angular 3. Logo 3x² = 3, então x² = 1, resultando em x = ±1.",
            "difficulty": "Intermediário"
        }
    ],
    "calc1_4": [  # Integrais
        {
            "id": "ex_calc1_4_1",
            "topic_id": "calc1_4",
            "question": "Calcule ∫ 2x dx",
            "options": ["x² + C", "2x² + C", "x²/2 + C", "2x"],
            "correct_answer": 0,
            "explanation": "∫ 2x dx = 2 · ∫ x dx = 2 · (x²/2) + C = x² + C",
            "difficulty": "Básico"
        },
        {
            "id": "ex_calc1_4_2",
            "topic_id": "calc1_4",
            "question": "Calcule ∫₀² (x² + 1) dx",
            "options": ["10/3", "14/3", "8/3", "6"],
            "correct_answer": 1,
            "explanation": "∫(x² + 1)dx = x³/3 + x. Aplicando os limites: [2³/3 + 2] - [0] = 8/3 + 2 = 8/3 + 6/3 = 14/3",
            "difficulty": "Intermediário"
        }
    ],
    "calc2_1": [  # Funções de Várias Variáveis
        {
            "id": "ex_calc2_1_1",
            "topic_id": "calc2_1",
            "question": "Qual é o domínio da função f(x,y) = √(x² + y² - 4)?",
            "options": ["Todo o plano", "Círculo de raio 2", "Fora do círculo de raio 2", "Apenas x² + y² = 4"],
            "correct_answer": 2,
            "explanation": "Para que a raiz quadrada seja real, precisamos x² + y² - 4 ≥ 0, ou seja, x² + y² ≥ 4. Isso representa pontos fora ou sobre o círculo de raio 2.",
            "difficulty": "Intermediário"
        }
    ],
    "calc2_2": [  # Derivadas Parciais
        {
            "id": "ex_calc2_2_1",
            "topic_id": "calc2_2",
            "question": "Calcule ∂f/∂x para f(x,y) = x²y + 3xy²",
            "options": ["2xy + 3y²", "x² + 6xy", "2xy + 3y", "xy + y²"],
            "correct_answer": 0,
            "explanation": "Ao derivar em relação a x, tratamos y como constante: ∂f/∂x = 2xy + 3y²",
            "difficulty": "Básico"
        }
    ],
    "calc2_3": [  # Integrais Múltiplas
        {
            "id": "ex_calc2_3_1",
            "topic_id": "calc2_3",
            "question": "Calcule ∫₀¹ ∫₀² xy dx dy",
            "options": ["1", "2", "1/2", "4"],
            "correct_answer": 0,
            "explanation": "Primeiro integramos em x: ∫₀² xy dx = [x²y/2]₀² = 2y. Depois em y: ∫₀¹ 2y dy = [y²]₀¹ = 1",
            "difficulty": "Intermediário"
        }
    ],
    "calc3_1": [  # Campos Vetoriais
        {
            "id": "ex_calc3_1_1",
            "topic_id": "calc3_1",
            "question": "Qual é a divergência do campo F(x,y,z) = (x, y, z)?",
            "options": ["0", "1", "2", "3"],
            "correct_answer": 3,
            "explanation": "div F = ∂x/∂x + ∂y/∂y + ∂z/∂z = 1 + 1 + 1 = 3",
            "difficulty": "Básico"
        }
    ],
    "calc3_2": [  # Integrais de Linha
        {
            "id": "ex_calc3_2_1",
            "topic_id": "calc3_2",
            "question": "Se F é um campo conservativo, o que podemos dizer sobre ∮ F·dr ao longo de uma curva fechada?",
            "options": ["É sempre zero", "Depende da curva", "É sempre 1", "É sempre positivo"],
            "correct_answer": 0,
            "explanation": "Para campos conservativos, a integral de linha sobre qualquer curva fechada é sempre zero. Isso é uma propriedade fundamental.",
            "difficulty": "Intermediário"
        }
    ],
    "calc3_3": [  # Teoremas de Green e Stokes
        {
            "id": "ex_calc3_3_1",
            "topic_id": "calc3_3",
            "question": "O Teorema de Green relaciona:",
            "options": [
                "Integral de linha com integral dupla",
                "Integral dupla com integral tripla",
                "Derivada com integral",
                "Limite com continuidade"
            ],
            "correct_answer": 0,
            "explanation": "O Teorema de Green relaciona a integral de linha ao longo de uma curva fechada com a integral dupla sobre a região delimitada por essa curva.",
            "difficulty": "Básico"
        }
    ],
    "calcnum_1": [  # Zeros de Funções
        {
            "id": "ex_calcnum_1_1",
            "topic_id": "calcnum_1",
            "question": "Qual método numérico usa a derivada para encontrar zeros de funções?",
            "options": ["Bisseção", "Newton-Raphson", "Posição Falsa", "Secante"],
            "correct_answer": 1,
            "explanation": "O método de Newton-Raphson usa tanto a função quanto sua derivada: xₙ₊₁ = xₙ - f(xₙ)/f'(xₙ)",
            "difficulty": "Básico"
        }
    ],
    "calcnum_2": [  # Sistemas Lineares
        {
            "id": "ex_calcnum_2_1",
            "topic_id": "calcnum_2",
            "question": "O método de Gauss-Seidel converge mais rápido que Jacobi porque:",
            "options": [
                "Usa valores atualizados imediatamente",
                "Usa menos iterações",
                "É mais simples",
                "Não requer matriz diagonal dominante"
            ],
            "correct_answer": 0,
            "explanation": "Gauss-Seidel usa os valores já calculados na mesma iteração, enquanto Jacobi usa apenas valores da iteração anterior, tornando a convergência geralmente mais rápida.",
            "difficulty": "Intermediário"
        }
    ],
    "calcnum_3": [  # Interpolação
        {
            "id": "ex_calcnum_3_1",
            "topic_id": "calcnum_3",
            "question": "Quantos pontos são necessários para uma interpolação polinomial de grau n?",
            "options": ["n pontos", "n+1 pontos", "n-1 pontos", "2n pontos"],
            "correct_answer": 1,
            "explanation": "Para determinar um polinômio de grau n são necessários n+1 pontos. Por exemplo, para uma reta (grau 1) precisamos de 2 pontos.",
            "difficulty": "Básico"
        }
    ],
    "ed_1": [  # Programação Estruturada e Modular
        {
            "id": "ex_ed_1_1",
            "topic_id": "ed_1",
            "question": "Qual é a principal característica da programação estruturada?",
            "options": [
                "Uso exclusivo do comando GOTO",
                "Uso de estruturas de controle (sequência, decisão e repetição)",
                "Ausência total de funções",
                "Dependência de variáveis globais"
            ],
            "correct_answer": 1,
            "explanation": "A programação estruturada baseia-se em três estruturas de controle: sequência, decisão (if/else) e repetição (laços), evitando o GOTO e deixando o código mais legível.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_1_2",
            "topic_id": "ed_1",
            "question": "Na programação modular, qual é o papel de uma função?",
            "options": [
                "Aumentar o acoplamento entre módulos",
                "Encapsular um bloco de código reutilizável e com responsabilidade única",
                "Substituir todas as variáveis do programa",
                "Evitar o uso de parâmetros"
            ],
            "correct_answer": 1,
            "explanation": "Funções encapsulam trechos de código com uma responsabilidade definida, permitindo reutilização, testes isolados e redução do acoplamento entre módulos.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_1_3",
            "topic_id": "ed_1",
            "question": "Em C++, qual é a declaração obrigatória que define o ponto de entrada de um programa executável?",
            "options": ["void init()", "int main()", "function main", "begin"],
            "correct_answer": 1,
            "explanation": "Em C++, o programa executável inicia sempre na função main: int main() { ... }. O retorno 0 (ou return EXIT_SUCCESS) indica execução sem erros.",
            "difficulty": "Básico"
        }
    ],
    "ed_2": [  # Análise de Algoritmos
        {
            "id": "ex_ed_2_1",
            "topic_id": "ed_2",
            "question": "Qual notação expressa o crescimento assintótico do tempo de execução de um algoritmo?",
            "options": ["Notação de Euler", "Notação Big-O (O)", "Notação científica", "Notação infixa"],
            "correct_answer": 1,
            "explanation": "A notação Big-O (O) descreve o comportamento do algoritmo para entradas grandes, ignorando constantes e termos de menor ordem.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_2_2",
            "topic_id": "ed_2",
            "question": "Qual é a complexidade da busca linear em um vetor de n elementos no pior caso?",
            "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
            "correct_answer": 2,
            "explanation": "No pior caso o elemento procurado está na última posição (ou não existe), exigindo percorrer os n elementos: O(n).",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_2_3",
            "topic_id": "ed_2",
            "question": "Um algoritmo de ordenação por inserção (insertion sort) tem complexidade média de:",
            "options": ["O(n)", "O(n²)", "O(n log n)", "O(log n)"],
            "correct_answer": 1,
            "explanation": "No caso médio e pior, o insertion sort realiza O(n²) comparações. No melhor caso (vetor quase ordenado) é O(n).",
            "difficulty": "Intermediário"
        }
    ],
    "ed_3": [  # Vetores e Strings
        {
            "id": "ex_ed_3_1",
            "topic_id": "ed_3",
            "question": "Como declarar um vetor de 10 inteiros em C++?",
            "options": ["int vetor[10];", "vetor(10);", "int[10] vetor;", "array vetor;"],
            "correct_answer": 0,
            "explanation": "Em C++ a sintaxe é: tipo nome[tamanho]; — int vetor[10]; declara um vetor com índices de 0 a 9.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_3_2",
            "topic_id": "ed_3",
            "question": "Considerando um vetor de 5 posições (índices 0 a 4), qual é o índice do último elemento?",
            "options": ["5", "4", "3", "Tanto faz"],
            "correct_answer": 1,
            "explanation": "Como os índices começam em 0, o último elemento de um vetor de tamanho n está no índice n-1, ou seja, 4.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_3_3",
            "topic_id": "ed_3",
            "question": "O que ocorre ao acessar vetor[5] quando o vetor declarado possui apenas índices 0 a 4?",
            "options": [
                "Retorna 0 automaticamente",
                "Comportamento indefinido (possível falha de segmentação)",
                "O programa compila com erro",
                "Acessa o elemento de índice 0"
            ],
            "correct_answer": 1,
            "explanation": "C/C++ não faz verificação de limites. Acessar vetor[5] ultrapassa os limites do array, gerando comportamento indefinido, que pode corromper memória ou causar segfault.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_3_4",
            "topic_id": "ed_3",
            "question": "Em C (estilo string.h), como uma string é representada em memória?",
            "options": [
                "Como um único caractere",
                "Como um vetor de caracteres terminado pelo caractere nulo '\\0'",
                "Como um número inteiro",
                "Como uma estrutura com tamanho implícito"
            ],
            "correct_answer": 1,
            "explanation": "No estilo C, string é um vetor de char encerrado por '\\0', o que permite funções como strlen e strcpy saberem onde a string termina.",
            "difficulty": "Intermediário"
        }
    ],
    "ed_4": [  # Matrizes Multidimensionais
        {
            "id": "ex_ed_4_1",
            "topic_id": "ed_4",
            "question": "Como declarar uma matriz 3x3 de inteiros em C++?",
            "options": ["int matriz[3][3];", "int matriz(3,3);", "int[3,3] matriz;", "matrix<int,3> m;"],
            "correct_answer": 0,
            "explanation": "Em C++, matrizes são vetores de vetores: int matriz[3][3]; — 3 linhas e 3 colunas, acessadas por matriz[linha][coluna].",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_4_2",
            "topic_id": "ed_4",
            "question": "Qual estrutura é necessária para percorrer todos os elementos de uma matriz?",
            "options": [
                "Um único laço for",
                "Dois laços aninhados (um para linhas e outro para colunas)",
                "Três laços aninhados sempre",
                "Nenhum laço, basta usar o endereço"
            ],
            "correct_answer": 1,
            "explanation": "Uma matriz possui duas dimensões; para percorrer todos os elementos usa-se um laço para as linhas e outro aninhado para as colunas.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_4_3",
            "topic_id": "ed_4",
            "question": "Em C/C++, como os elementos de uma matriz são armazenados em memória (armazenamento row-major)?",
            "options": [
                "Coluna a coluna (column-major)",
                "Linha a linha, elementos consecutivos na mesma linha ficam adjacentes",
                "Em ordem aleatória",
                "Cada elemento em um processo separado"
            ],
            "correct_answer": 1,
            "explanation": "C/C++ usa row-major: os elementos de uma linha são armazenados contiguamente na memória, o que favorece a localidade ao percorrer por linhas.",
            "difficulty": "Intermediário"
        }
    ],
    "ed_5": [  # Estruturas Estáticas e Dinâmicas
        {
            "id": "ex_ed_5_1",
            "topic_id": "ed_5",
            "question": "Em C++, quais operadores realizam alocação e liberação dinâmica de memória?",
            "options": ["malloc e free", "new e delete", "calloc e free", "alloc e release"],
            "correct_answer": 1,
            "explanation": "Em C++ a alocação dinâmica é feita com new (ex.: int* p = new int;) e liberada com delete. malloc/free são do C.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_5_2",
            "topic_id": "ed_5",
            "question": "O que é uma variável ponteiro?",
            "options": [
                "Uma variável que armazena o endereço de memória de outra variável",
                "Uma variável que armazena apenas valores reais",
                "Um sinônimo de variável global",
                "Uma variável com tamanho fixo de 1 byte"
            ],
            "correct_answer": 0,
            "explanation": "Um ponteiro armazena o endereço de memória de outra variável, permitindo acesso indireto e alocação dinâmica.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_5_3",
            "topic_id": "ed_5",
            "question": "Qual é a principal vantagem da alocação dinâmica em relação à estática?",
            "options": [
                "O tamanho pode ser definido em tempo de execução",
                "É sempre mais rápida",
                "Dispensa o uso de ponteiros",
                "Ocupa menos memória garantidamente"
            ],
            "correct_answer": 0,
            "explanation": "Com alocação dinâmica, o tamanho da estrutura pode ser decidido em tempo de execução (ex.: conforme os dados de entrada), flexibilizando o programa.",
            "difficulty": "Intermediário"
        }
    ],
    "ed_6": [  # Pilhas e Filas
        {
            "id": "ex_ed_6_1",
            "topic_id": "ed_6",
            "question": "Qual é o princípio de funcionamento de uma pilha (stack)?",
            "options": [
                "FIFO - o primeiro a entrar é o primeiro a sair",
                "LIFO - o último a entrar é o primeiro a sair",
                "Acesso aleatório aos elementos",
                "Ordenação automática"
            ],
            "correct_answer": 1,
            "explanation": "A pilha segue o princípio LIFO (Last In, First Out): o último elemento inserido (push) é o primeiro a ser removido (pop).",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_6_2",
            "topic_id": "ed_6",
            "question": "Quais são as duas operações fundamentais de uma pilha?",
            "options": [
                "enqueue e dequeue",
                "push e pop",
                "insert e remove",
                "add e delete"
            ],
            "correct_answer": 1,
            "explanation": "push insere um elemento no topo e pop remove o elemento do topo. O topo é o único local de inserção e remoção na pilha.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_6_3",
            "topic_id": "ed_6",
            "question": "Em uma fila (queue), onde ocorre a remoção de elementos?",
            "options": [
                "No mesmo local da inserção",
                "No início (frente) da fila",
                "No final da fila",
                "Em qualquer posição"
            ],
            "correct_answer": 1,
            "explanation": "A fila segue FIFO: inserções ocorrem no fim (enqueue/inserir) e remoções no início (dequeue/remover), como uma fila de banco.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_6_4",
            "topic_id": "ed_6",
            "question": "Uma aplicação clássica de pilha é:",
            "options": [
                "Fila de impressão",
                "Verificação de parênteses balanceados e notação pós-fixa",
                "Ordenação de dados em disco",
                "Compressão de imagens"
            ],
            "correct_answer": 1,
            "explanation": "Pilhas são usadas para balanceamento de parênteses, avaliação de expressões pós-fixas, chamadas recursivas e desfazer (undo) em editores.",
            "difficulty": "Intermediário"
        }
    ],
    "ed_7": [  # Listas Encadeadas
        {
            "id": "ex_ed_7_1",
            "topic_id": "ed_7",
            "question": "Um nó de uma lista simplesmente encadeada contém:",
            "options": [
                "Somente o valor armazenado",
                "O valor armazenado e um ponteiro para o próximo nó",
                "Um valor e dois ponteiros sempre",
                "Somente um ponteiro para o próximo nó"
            ],
            "correct_answer": 1,
            "explanation": "Na lista simplesmente encadeada, cada nó guarda o dado e um ponteiro para o próximo nó (next). O último nó aponta para nullptr.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_7_2",
            "topic_id": "ed_7",
            "question": "Qual é a vantagem da lista encadeada sobre o vetor estático?",
            "options": [
                "Acesso direto (O(1)) a qualquer posição",
                "Crescimento dinâmico e inserção/remoção no início em O(1)",
                "Menor consumo de memória por nó",
                "Melhor localidade de cache sempre"
            ],
            "correct_answer": 1,
            "explanation": "A lista cresce conforme necessário (alocação dinâmica por nó) e inserir/remover no início não exige deslocamento de elementos, custando O(1).",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_7_3",
            "topic_id": "ed_7",
            "question": "Qual é a complexidade para acessar o k-ésimo elemento de uma lista simplesmente encadeada?",
            "options": ["O(1)", "O(log n)", "O(k)", "O(1) se ordenada"],
            "correct_answer": 2,
            "explanation": "Não há acesso direto por índice; é necessário percorrer a lista a partir do primeiro nó, percorrendo k nós: O(k).",
            "difficulty": "Intermediário"
        }
    ],
    "ed_8": [  # Árvores
        {
            "id": "ex_ed_8_1",
            "topic_id": "ed_8",
            "question": "O que caracteriza uma árvore binária?",
            "options": [
                "Cada nó pode ter qualquer quantidade de filhos",
                "Cada nó possui no máximo dois filhos (esquerda e direita)",
                "Todos os nós possuem exatamente um filho",
                "É uma estrutura com raiz e sem nós internos"
            ],
            "correct_answer": 1,
            "explanation": "Em uma árvore binária, cada nó tem no máximo dois filhos, chamados de filho esquerdo e filho direito.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_8_2",
            "topic_id": "ed_8",
            "question": "No percurso em ordem (in-order), a visita dos nós ocorre na ordem:",
            "options": [
                "Raiz, esquerda, direita (pré-ordem)",
                "Esquerda, raiz, direita",
                "Esquerda, direita, raiz (pós-ordem)",
                "Direita, esquerda, raiz"
            ],
            "correct_answer": 1,
            "explanation": "O percurso in-order visita primeiro a subárvore esquerda, depois a raiz e então a subárvore direita. Em uma BST, produz os valores em ordem crescente.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_8_3",
            "topic_id": "ed_8",
            "question": "Em uma árvore binária de busca balanceada com n elementos, a complexidade da busca é:",
            "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
            "correct_answer": 1,
            "explanation": "Em uma BST balanceada, cada comparação descarta metade da árvore, resultando em O(log n). Em uma árvore degenerada isso degrada para O(n).",
            "difficulty": "Intermediário"
        }
    ],
    "sd_1": [  # Sistemas de Numeração
        {
            "id": "ex_sd_1_1",
            "topic_id": "sd_1",
            "question": "Qual é o valor decimal do número binário 1011₂?",
            "options": ["8", "11", "13", "10"],
            "correct_answer": 1,
            "explanation": "1011₂ = 1·2³ + 0·2² + 1·2¹ + 1·2⁰ = 8 + 0 + 2 + 1 = 11.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_1_2",
            "topic_id": "sd_1",
            "question": "Qual é a representação binária do número decimal 14?",
            "options": ["1110", "1101", "1011", "1001"],
            "correct_answer": 0,
            "explanation": "14 = 8 + 4 + 2 = 1·2³ + 1·2² + 1·2¹ + 0·2⁰ = 1110₂.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_1_3",
            "topic_id": "sd_1",
            "question": "Quantos símbolos (dígitos) são utilizados no sistema hexadecimal de numeração?",
            "options": ["8", "10", "16", "2"],
            "correct_answer": 2,
            "explanation": "O hexadecimal usa 16 símbolos: 0-9 e A-F. Cada dígito hexadecimal corresponde a 4 bits.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_1_4",
            "topic_id": "sd_1",
            "question": "O valor hexadecimal 0xFF equivale ao valor decimal:",
            "options": ["15", "128", "255", "256"],
            "correct_answer": 2,
            "explanation": "0xFF = F·16¹ + F·16⁰ = 15·16 + 15 = 240 + 15 = 255.",
            "difficulty": "Intermediário"
        }
    ],
    "sd_2": [  # Portas e Funções Lógicas
        {
            "id": "ex_sd_2_1",
            "topic_id": "sd_2",
            "question": "Qual é a saída de uma porta AND de duas entradas quando ambas as entradas são 1?",
            "options": ["0", "1", "Indefinida", "Alterna a cada ciclo"],
            "correct_answer": 1,
            "explanation": "A porta AND produz 1 somente quando todas as entradas são 1. Em qualquer outro caso a saída é 0.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_2_2",
            "topic_id": "sd_2",
            "question": "A porta NAND é equivalente a:",
            "options": [
                "Uma porta AND seguida de uma inversora (NOT)",
                "Uma porta OR seguida de uma inversora",
                "Uma porta XOR com saída invertida",
                "Duas portas AND em série"
            ],
            "correct_answer": 0,
            "explanation": "NAND = AND + NOT: sua saída é o complemento da porta AND, ou seja, 0 somente quando todas as entradas são 1.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_2_3",
            "topic_id": "sd_2",
            "question": "Em uma porta OU EXCLUSIVO (XOR) de duas entradas, a saída vale 1 quando:",
            "options": [
                "As duas entradas são iguais",
                "As duas entradas são diferentes",
                "Pelo menos uma entrada é 0",
                "Ambas as entradas são 1"
            ],
            "correct_answer": 1,
            "explanation": "O XOR produz 1 quando as entradas são diferentes (1,0 ou 0,1). Quando são iguais, a saída é 0.",
            "difficulty": "Intermediário"
        }
    ],
    "sd_3": [  # Álgebra de Boole e Simplificação
        {
            "id": "ex_sd_3_1",
            "topic_id": "sd_3",
            "question": "Pelo Teorema de De Morgan, NOT (A AND B) é equivalente a:",
            "options": [
                "(NOT A) AND (NOT B)",
                "(NOT A) OR (NOT B)",
                "A OR B",
                "A AND B"
            ],
            "correct_answer": 1,
            "explanation": "De Morgan: NOT(A·B) = (NOT A) + (NOT B). O complemento de um produto é a soma dos complementos.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_3_2",
            "topic_id": "sd_3",
            "question": "A expressão booleana A + A·B pode ser simplificada para:",
            "options": ["A", "A·B", "A + B", "B"],
            "correct_answer": 0,
            "explanation": "Usando o postulado da absorção: A + A·B = A·(1 + B) = A·1 = A.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_3_3",
            "topic_id": "sd_3",
            "question": "Qual é o valor do postulado A + 1 na álgebra de Boole?",
            "options": ["A", "0", "1", "A + 1"],
            "correct_answer": 2,
            "explanation": "A + 1 = 1, pois o OR com 1 sempre resulta em 1, independente do valor de A.",
            "difficulty": "Básico"
        }
    ],
    "sd_4": [  # Circuitos Combinacionais
        {
            "id": "ex_sd_4_1",
            "topic_id": "sd_4",
            "question": "A função de um multiplexador é:",
            "options": [
                "Selecionar uma entre várias entradas de dados e encaminhá-la à saída",
                "Somar dois números binários",
                "Armazenar um bit indefinidamente",
                "Converter analógico para digital"
            ],
            "correct_answer": 0,
            "explanation": "O multiplexador usa entradas de seleção para escolher qual das entradas de dados será conectada à saída.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_4_2",
            "topic_id": "sd_4",
            "question": "Um decodificador 3 para 8 possui:",
            "options": [
                "3 entradas e 8 saídas",
                "8 entradas e 3 saídas",
                "3 entradas e 3 saídas",
                "8 entradas e 8 saídas"
            ],
            "correct_answer": 0,
            "explanation": "Com 3 entradas binárias existem 2³ = 8 combinações possíveis, ativando exatamente uma das 8 saídas.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_4_3",
            "topic_id": "sd_4",
            "question": "Um meio somador (half adder) soma dois bits e produz:",
            "options": [
                "Soma e carry (vai-um)",
                "Apenas a soma",
                "Soma, carry e empréstimo",
                "Apenas o carry"
            ],
            "correct_answer": 0,
            "explanation": "O meio somador tem saídas S (soma) e CO (vai-um/carry). O somador completo também recebe o carry de entrada.",
            "difficulty": "Intermediário"
        }
    ],
    "sd_5": [  # Flip-Flops e Contadores
        {
            "id": "ex_sd_5_1",
            "topic_id": "sd_5",
            "question": "Em um flip-flop JK, quando J = 1 e K = 1 com a borda do clock, a saída Q:",
            "options": [
                "Permanece inalterada",
                "É zerada",
                "Alterna (toggle)",
                "É definida para 1"
            ],
            "correct_answer": 2,
            "explanation": "Com J=K=1 o flip-flop JK alterna o estado: se Q=0 passa a 1, se Q=1 passa a 0.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_5_2",
            "topic_id": "sd_5",
            "question": "O flip-flop tipo D, a cada pulso de clock, armazena:",
            "options": [
                "O valor presente na entrada D",
                "O complemento da entrada D",
                "Sempre 1",
                "O valor anterior indefinidamente"
            ],
            "correct_answer": 0,
            "explanation": "O flip-flop D captura o valor da entrada D na borda ativa do clock e o mantém (Q = D), funcionando como célula de memória de 1 bit.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_5_3",
            "topic_id": "sd_5",
            "question": "Em um contador assíncrono, os flip-flops:",
            "options": [
                "Compartilham o mesmo sinal de clock",
                "São disparados em cascata, o clock de um vem da saída do anterior",
                "Não utilizam flip-flops",
                "Utilizam apenas portas AND"
            ],
            "correct_answer": 1,
            "explanation": "No contador assíncrono (ripple), o clock do próximo flip-flop é a saída do anterior, o que gera atrasos de propagação acumulados.",
            "difficulty": "Intermediário"
        }
    ],
    "sd_6": [  # Conversores, Multiplex e Memórias
        {
            "id": "ex_sd_6_1",
            "topic_id": "sd_6",
            "question": "Um conversor analógico-digital (A/D) de n bits é capaz de distinguir quantos níveis discretos?",
            "options": ["n", "2n", "2ⁿ", "10ⁿ"],
            "correct_answer": 2,
            "explanation": "Com n bits a saída digital pode representar 2ⁿ níveis distintos (ex.: 8 bits → 256 níveis).",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_6_2",
            "topic_id": "sd_6",
            "question": "Uma memória ROM caracteriza-se por:",
            "options": [
                "Permitir leitura e escrita livremente",
                "Ser somente de leitura e não volátil",
                "Perder os dados ao desligar",
                "Ser apenas volátil"
            ],
            "correct_answer": 1,
            "explanation": "A ROM (Read-Only Memory) tem conteúdo gravado de fábrica, permite apenas leitura e mantém os dados sem alimentação.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_6_3",
            "topic_id": "sd_6",
            "question": "A memória RAM é classificada como:",
            "options": [
                "Somente leitura e não volátil",
                "Leitura/escrita e volátil (perde dados sem energia)",
                "Leitura/escrita e não volátil",
                "Somente escrita"
            ],
            "correct_answer": 1,
            "explanation": "A RAM permite leitura e escrita, mas é volátil: seu conteúdo se perde quando a alimentação é desligada.",
            "difficulty": "Básico"
        }
    ]
}

@router.get("/topics/{topic_id}/exercises")
async def get_exercises_for_topic(topic_id: str):
    """
    Get all exercises for a specific topic
    """
    try:
        exercises = EXERCISES_DB.get(topic_id, [])
        
        # Get topic name from the topics data
        topic_names = {
            "calc1_1": {"name": "Limites", "category": "Cálculo 1", "difficulty": "Básico"},
            "calc1_2": {"name": "Derivadas", "category": "Cálculo 1", "difficulty": "Intermediário"},
            "calc1_3": {"name": "Aplicações de Derivadas", "category": "Cálculo 1", "difficulty": "Intermediário"},
            "calc1_4": {"name": "Integrais", "category": "Cálculo 1", "difficulty": "Avançado"},
            "calc2_1": {"name": "Funções de Várias Variáveis", "category": "Cálculo 2", "difficulty": "Intermediário"},
            "calc2_2": {"name": "Derivadas Parciais", "category": "Cálculo 2", "difficulty": "Avançado"},
            "calc2_3": {"name": "Integrais Múltiplas", "category": "Cálculo 2", "difficulty": "Avançado"},
            "calc3_1": {"name": "Campos Vetoriais", "category": "Cálculo 3", "difficulty": "Intermediário"},
            "calc3_2": {"name": "Integrais de Linha", "category": "Cálculo 3", "difficulty": "Avançado"},
            "calc3_3": {"name": "Teoremas de Green e Stokes", "category": "Cálculo 3", "difficulty": "Avançado"},
            "calcnum_1": {"name": "Zeros de Funções", "category": "Cálculo Numérico", "difficulty": "Intermediário"},
            "calcnum_2": {"name": "Sistemas Lineares", "category": "Cálculo Numérico", "difficulty": "Avançado"},
            "calcnum_3": {"name": "Interpolação", "category": "Cálculo Numérico", "difficulty": "Intermediário"},
            "ed_1": {"name": "Programação Estruturada e Modular", "category": "Estrutura de Dados", "difficulty": "Básico"},
            "ed_2": {"name": "Análise de Algoritmos", "category": "Estrutura de Dados", "difficulty": "Intermediário"},
            "ed_3": {"name": "Vetores e Strings", "category": "Estrutura de Dados", "difficulty": "Intermediário"},
            "ed_4": {"name": "Matrizes Multidimensionais", "category": "Estrutura de Dados", "difficulty": "Básico"},
            "ed_5": {"name": "Estruturas Estáticas e Dinâmicas", "category": "Estrutura de Dados", "difficulty": "Intermediário"},
            "ed_6": {"name": "Pilhas e Filas", "category": "Estrutura de Dados", "difficulty": "Intermediário"},
            "ed_7": {"name": "Listas Encadeadas", "category": "Estrutura de Dados", "difficulty": "Intermediário"},
            "ed_8": {"name": "Árvores", "category": "Estrutura de Dados", "difficulty": "Avançado"},
            "sd_1": {"name": "Sistemas de Numeração", "category": "Sistemas Digitais", "difficulty": "Básico"},
            "sd_2": {"name": "Portas e Funções Lógicas", "category": "Sistemas Digitais", "difficulty": "Básico"},
            "sd_3": {"name": "Álgebra de Boole e Simplificação", "category": "Sistemas Digitais", "difficulty": "Intermediário"},
            "sd_4": {"name": "Circuitos Combinacionais", "category": "Sistemas Digitais", "difficulty": "Intermediário"},
            "sd_5": {"name": "Flip-Flops e Contadores", "category": "Sistemas Digitais", "difficulty": "Intermediário"},
            "sd_6": {"name": "Conversores, Multiplex e Memórias", "category": "Sistemas Digitais", "difficulty": "Avançado"}
        }
        
        topic_info = topic_names.get(topic_id, {"name": "Tópico Desconhecido", "category": "Desconhecido", "difficulty": "Intermediário"})
        
        return {
            "topic": topic_info,
            "exercises": exercises,
            "total": len(exercises)
        }
        
    except Exception as e:
        logger.error(f"Error getting exercises: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exercises/attempt")
async def submit_exercise_attempt(attempt: ExerciseAttemptCreate):
    """
    Submit an exercise attempt and save to database
    """
    try:
        # In production, save to MongoDB
        # For now, just log and return success
        logger.info(f"Exercise attempt: user={attempt.user_id}, exercise={attempt.exercise_id}, correct={attempt.is_correct}, time={attempt.time_spent}s")
        
        return {
            "success": True,
            "is_correct": attempt.is_correct,
            "message": "Resposta registrada com sucesso!"
        }
        
    except Exception as e:
        logger.error(f"Error submitting attempt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/exercises/stats/{user_id}")
async def get_user_exercise_stats(user_id: str):
    """
    Get exercise statistics for a user
    """
    try:
        # In production, query MongoDB for actual stats
        # For now, return mock data
        return {
            "total_attempts": 0,
            "correct_answers": 0,
            "accuracy": 0.0,
            "topics_completed": [],
            "time_spent_total": 0
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
