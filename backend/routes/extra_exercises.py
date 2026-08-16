# Exercícios complementares de Estrutura de Dados e Sistemas Digitais
# elaborados em cima do conteúdo programático das disciplinas e do formato
# de simulado/prova (ED: listas 2,0 / simulado 3,0 / prova 5,0;
# SD: VAE1+PB1 e VAE2+PRO+PB2).

EXTRA_EXERCISES = {
    "ed_1": [  # Programação Estruturada e Modular
        {
            "id": "ex_ed_1_4",
            "topic_id": "ed_1",
            "question": "Qual estrutura de repetição executa o corpo pelo menos uma vez, antes de testar a condição?",
            "options": ["while", "do...while", "for", "if"],
            "correct_answer": 1,
            "explanation": "O do...while executa o bloco primeiro e só então verifica a condição de continuação, garantindo ao menos uma execução.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_1_5",
            "topic_id": "ed_1",
            "question": "Como declarar, em C++, uma função que recebe um inteiro por referência (alterando o valor do argumento na chamada)?",
            "options": ["void f(int x)", "void f(int &x)", "void f(int *x)", "void f(char x)"],
            "correct_answer": 1,
            "explanation": "O operador & no parâmetro declara passagem por referência: a função opera sobre a própria variável do chamador, não sobre uma cópia.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_1_6",
            "topic_id": "ed_1",
            "question": "Na programação modular, dividir o programa em funções pequenas e coesas tem como principal benefício:",
            "options": [
                "Aumentar o número de variáveis globais",
                "Facilitar a manutenção, o teste e o reuso de código",
                "Eliminar a necessidade de compilar",
                "Reduzir a memória utilizada em tempo de execução"
            ],
            "correct_answer": 1,
            "explanation": "Módulos pequenos e coesos permitem testar cada parte isoladamente, corrigir erros com mais facilidade e reaproveitar funções em outros programas.",
            "difficulty": "Intermediário"
        }
    ],
    "ed_2": [  # Análise de Algoritmos
        {
            "id": "ex_ed_2_4",
            "topic_id": "ed_2",
            "question": "Qual é o pré-requisito para aplicar a busca binária em um vetor?",
            "options": [
                "O vetor estar ordenado",
                "O vetor ter tamanho par",
                "O vetor conter apenas números positivos",
                "O vetor ter no máximo 100 elementos"
            ],
            "correct_answer": 0,
            "explanation": "A busca binária compara o elemento central e descarta metade do intervalo a cada passo, o que só é válido se os dados estiverem ordenados.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_2_5",
            "topic_id": "ed_2",
            "question": "Qual é a complexidade de tempo da busca binária em um vetor ordenado com n elementos?",
            "options": ["O(1)", "O(n)", "O(n log n)", "O(log n)"],
            "correct_answer": 3,
            "explanation": "A cada comparação o intervalo de busca é reduzido à metade; são necessários log₂(n) passos no pior caso: O(log n).",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_2_6",
            "topic_id": "ed_2",
            "question": "Um algoritmo com dois laços for aninhados, ambos de 0 até n, tem complexidade:",
            "options": ["O(n)", "O(n log n)", "O(n²)", "O(2n)"],
            "correct_answer": 2,
            "explanation": "Para cada iteração do laço externo (n vezes) o laço interno executa n vezes, totalizando n·n = n² operações: O(n²).",
            "difficulty": "Intermediário"
        }
    ],
    "ed_3": [  # Vetores e Strings
        {
            "id": "ex_ed_3_5",
            "topic_id": "ed_3",
            "question": "Em C, qual função de <cstring> retorna o número de caracteres de uma string (sem contar o '\\0')?",
            "options": ["strlen", "strcpy", "strcat", "strcmp"],
            "correct_answer": 0,
            "explanation": "strlen(s) percorre a string até o caractere nulo e retorna a quantidade de caracteres antes dele.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_3_6",
            "topic_id": "ed_3",
            "question": "Qual função de <cstring> concatena uma string no final de outra?",
            "options": ["strcat(dest, src)", "strcpy(dest, src)", "strlen(dest)", "strcmp(dest, src)"],
            "correct_answer": 0,
            "explanation": "strcat(dest, src) anexa os caracteres de src ao final de dest, removendo o '\\0' de dest e recolocando-o ao final da concatenação.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_3_7",
            "topic_id": "ed_3",
            "question": "Para inverter a ordem dos elementos de um vetor in-place, o algoritmo clássico utiliza:",
            "options": [
                "Uma variável auxiliar temporária para a troca de pares (i, n-1-i)",
                "Um segundo vetor obrigatoriamente",
                "A função strrev",
                "Um ponteiro para char"
            ],
            "correct_answer": 0,
            "explanation": "Troca-se vetor[i] com vetor[n-1-i] até o meio, usando uma variável temporária para não perder um dos valores durante a troca.",
            "difficulty": "Intermediário"
        }
    ],
    "ed_4": [  # Matrizes Multidimensionais
        {
            "id": "ex_ed_4_4",
            "topic_id": "ed_4",
            "question": "Quantos elementos possui a matriz declarada como int m[3][4]?",
            "options": ["7", "12", "34", "3"],
            "correct_answer": 1,
            "explanation": "O total de elementos é linhas × colunas = 3 × 4 = 12, acessados por índices 0..2 nas linhas e 0..3 nas colunas.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_4_5",
            "topic_id": "ed_4",
            "question": "A matriz transposta de A é construída:",
            "options": [
                "Invertendo o sinal dos elementos",
                "Trocando linhas por colunas (elemento A[i][j] vira AT[j][i])",
                "Duplicando os elementos da diagonal",
                "Ordenando cada linha"
            ],
            "correct_answer": 1,
            "explanation": "Na transposição, o elemento da linha i e coluna j da matriz original ocupa a linha j e coluna i da transposta.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_4_6",
            "topic_id": "ed_4",
            "question": "A soma de duas matrizes A e B é definida somente quando:",
            "options": [
                "A e B possuem o mesmo número de linhas e colunas",
                "A possui mais linhas que B",
                "A e B são quadradas e de mesmo tamanho",
                "O número de colunas de A é igual ao número de linhas de B"
            ],
            "correct_answer": 0,
            "explanation": "A soma C = A + B exige dimensões iguais: cada C[i][j] = A[i][j] + B[i][j]. A regra da alternativa D refere-se à multiplicação.",
            "difficulty": "Básico"
        }
    ],
    "ed_5": [  # Estruturas Estáticas e Dinâmicas
        {
            "id": "ex_ed_5_4",
            "topic_id": "ed_5",
            "question": "A instrução delete[] é usada para liberar a memória de:",
            "options": [
                "Um único valor alocado com new",
                "Um vetor alocado com new tipo[n]",
                "Uma variável declarada estaticamente",
                "Uma variável de referência"
            ],
            "correct_answer": 1,
            "explanation": "Arrays alocados dinamicamente com new tipo[n] devem ser liberados com delete[], enquanto valores únicos usam delete.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_5_5",
            "topic_id": "ed_5",
            "question": "O que é um memory leak (vazamento de memória)?",
            "options": [
                "Memória alocada dinamicamente e nunca liberada com delete",
                "Memória liberada duas vezes",
                "Um vetor estourado",
                "Um ponteiro não inicializado"
            ],
            "correct_answer": 0,
            "explanation": "Quando o programa perde as referências para um bloco alocado com new sem chamar delete, a memória permanece ocupada até o fim do processo.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_5_6",
            "topic_id": "ed_5",
            "question": "Chamar delete duas vezes sobre o mesmo ponteiro (double free) provoca:",
            "options": [
                "Nada, é inofensivo",
                "Comportamento indefinido, podendo corromper o gerenciador de memória",
                "Uma exceção sempre",
                "A liberação da segunda ocorrência automaticamente"
            ],
            "correct_answer": 1,
            "explanation": "Liberar memória já liberada é comportamento indefinido: o alocador pode estar reutilizando o bloco, corrompendo o heap.",
            "difficulty": "Avançado"
        }
    ],
    "ed_6": [  # Pilhas e Filas
        {
            "id": "ex_ed_6_5",
            "topic_id": "ed_6",
            "question": "O que a fila circular resolve em relação à fila implementada com vetor?",
            "options": [
                "O desperdício de espaço quando a fila parece cheia apesar de existirem posições livres",
                "A impossibilidade de armazenar caracteres",
                "A lentidão das operações push/pop",
                "A necessidade de ordenação dos elementos"
            ],
            "correct_answer": 0,
            "explanation": "Na fila linear com vetor, após remoções o início avança e as posições anteriores ficam ociosas. A fila circular reutiliza essas posições, tratando o vetor como um anel.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_6_6",
            "topic_id": "ed_6",
            "question": "Em uma pilha, o topo (top) é definido como:",
            "options": [
                "O elemento que está há mais tempo na pilha",
                "O elemento inserido mais recentemente",
                "O elemento do meio da pilha",
                "Qualquer elemento com valor máximo"
            ],
            "correct_answer": 1,
            "explanation": "Todas as operações da pilha (push, pop, top) ocorrem apenas no topo, que é o último elemento inserido (LIFO).",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_6_7",
            "topic_id": "ed_6",
            "question": "A estrutura mais adequada para controlar uma fila de impressão (o primeiro documento enviado é o primeiro a sair) é:",
            "options": ["Pilha (LIFO)", "Fila (FIFO)", "Árvore binária", "Vetor não ordenado"],
            "correct_answer": 1,
            "explanation": "A ordem de chegada deve ser respeitada: o primeiro documento enviado deve ser impresso primeiro, comportamento típico de fila FIFO.",
            "difficulty": "Básico"
        }
    ],
    "ed_7": [  # Listas Encadeadas
        {
            "id": "ex_ed_7_4",
            "topic_id": "ed_7",
            "question": "Qual laço percorre corretamente uma lista simplesmente encadeada do início ao fim?",
            "options": [
                "for (int i = 0; i < tamanho; i++)",
                "while (p != nullptr) { ...; p = p->proximo; }",
                "while (p == nullptr) { ... }",
                "for (;;) sempre",
            ],
            "correct_answer": 1,
            "explanation": "Como não há índice, percorre-se a lista por ponteiros: parte do primeiro nó e segue por p = p->proximo até encontrar nullptr.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_7_5",
            "topic_id": "ed_7",
            "question": "Em uma lista simplesmente encadeada com ponteiro para o primeiro nó, remover o nó inicial custa:",
            "options": ["O(n)", "O(log n)", "O(1)", "O(n²)"],
            "correct_answer": 2,
            "explanation": "Basta atualizar o ponteiro inicial para o segundo nó e liberar o antigo primeiro; não há deslocamento de elementos: O(1).",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_7_6",
            "topic_id": "ed_7",
            "question": "Na lista duplamente encadeada, cada nó armazena:",
            "options": [
                "Apenas o valor",
                "O valor, um ponteiro para o próximo e um ponteiro para o anterior",
                "O valor e um único ponteiro",
                "Dois valores e um ponteiro"
            ],
            "correct_answer": 1,
            "explanation": "O nó da lista duplamente encadeada possui ponteiros para o anterior (prev) e para o próximo (next), permitindo percorrimento nos dois sentidos.",
            "difficulty": "Básico"
        }
    ],
    "ed_8": [  # Árvores
        {
            "id": "ex_ed_8_4",
            "topic_id": "ed_8",
            "question": "No percurso pré-ordem (pre-order), a ordem de visita é:",
            "options": [
                "Esquerda, raiz, direita",
                "Raiz, esquerda, direita",
                "Esquerda, direita, raiz",
                "Direita, raiz, esquerda"
            ],
            "correct_answer": 1,
            "explanation": "O pré-ordem visita primeiro a raiz, depois a subárvore esquerda e então a subárvore direita.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_8_5",
            "topic_id": "ed_8",
            "question": "Uma árvore binária cheia com altura h (raiz no nível 1) possui no máximo:",
            "options": ["h", "2h", "2^h", "2^h - 1 nós"],
            "correct_answer": 3,
            "explanation": "O número máximo de nós de uma árvore binária de altura h é 2^h - 1 (soma 1 + 2 + 4 + ... + 2^(h-1)).",
            "difficulty": "Avançado"
        },
        {
            "id": "ex_ed_8_6",
            "topic_id": "ed_8",
            "question": "Em uma árvore binária de busca (BST), para todo nó, os valores da subárvore esquerda são:",
            "options": [
                "Maiores que o valor do nó",
                "Menores que o valor do nó",
                "Iguais ao valor do nó",
                "Arbitrários"
            ],
            "correct_answer": 1,
            "explanation": "A propriedade da BST garante: valores da subárvore esquerda são menores que o nó e os da direita, maiores. É isso que torna a busca eficiente.",
            "difficulty": "Intermediário"
        }
    ],
    "ed_simulado": [  # Estrutura de Dados - Simulado (formato de prova)
        {
            "id": "ex_ed_sim_1",
            "topic_id": "ed_simulado",
            "question": "O acesso direto ao elemento de índice i de um vetor tem complexidade:",
            "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
            "correct_answer": 0,
            "explanation": "O vetor armazena elementos contíguos; o endereço de vetor[i] é calculado diretamente (base + i × tamanho), independendo de n: O(1).",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_sim_2",
            "topic_id": "ed_simulado",
            "question": "Uma pilha sempre remove o elemento:",
            "options": [
                "Inserido por último (LIFO)",
                "Inserido primeiro (FIFO)",
                "De menor valor",
                "Do meio da estrutura"
            ],
            "correct_answer": 0,
            "explanation": "Pilha segue LIFO: o último elemento inserido (no topo) é o primeiro a sair.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_sim_3",
            "topic_id": "ed_simulado",
            "question": "Em uma lista simplesmente encadeada, inserir um novo nó no início custa:",
            "options": ["O(n)", "O(log n)", "O(1)", "O(n²)"],
            "correct_answer": 2,
            "explanation": "Basta criar o nó, apontá-lo para o primeiro atual e atualizar o ponteiro inicial: nenhum deslocamento é necessário, logo O(1).",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_sim_4",
            "topic_id": "ed_simulado",
            "question": "Uma árvore binária é caracterizada por cada nó possuir no máximo:",
            "options": ["1 filho", "2 filhos", "3 filhos", "N filhos"],
            "correct_answer": 1,
            "explanation": "Cada nó de uma árvore binária tem no máximo dois filhos: o filho esquerdo e o filho direito.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_sim_5",
            "topic_id": "ed_simulado",
            "question": "Em C, a string \"estudo\" ocupa quantos bytes de memória (incluindo o terminador)?",
            "options": ["5", "6", "7", "8"],
            "correct_answer": 2,
            "explanation": "\"estudo\" tem 6 caracteres mais o caractere nulo '\\0' que encerra a string: 6 + 1 = 7 bytes.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_sim_6",
            "topic_id": "ed_simulado",
            "question": "Para percorrer todos os elementos de uma matriz em C++, a estrutura adequada é:",
            "options": [
                "Um laço simples",
                "Dois laços aninhados (linhas e colunas)",
                "Três laços sempre",
                "Recursão obrigatória"
            ],
            "correct_answer": 1,
            "explanation": "Uma matriz tem duas dimensões; dois laços aninhados garantem o acesso a todas as combinações de linha e coluna.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_sim_7",
            "topic_id": "ed_simulado",
            "question": "Em C++, a alocação dinâmica de um único valor inteiro é feita com:",
            "options": ["int v = new;", "int* p = new int;", "int* p = malloc(int);", "int p = alloc();"],
            "correct_answer": 1,
            "explanation": "O operador new retorna um ponteiro para o espaço alocado no heap: int* p = new int; e a liberação usa delete p.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_sim_8",
            "topic_id": "ed_simulado",
            "question": "Uma fila (queue) opera segundo o princípio:",
            "options": ["LIFO", "FIFO", "Acesso aleatório", "Último a entrar, primeiro a sair"],
            "correct_answer": 1,
            "explanation": "Fila segue FIFO (First In, First Out): o primeiro elemento inserido é o primeiro a ser removido.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_ed_sim_9",
            "topic_id": "ed_simulado",
            "question": "A programação modular recomenda dividir o programa em módulos/funções porque:",
            "options": [
                "Cada módulo deve ter responsabilidade única, facilitando reuso e manutenção",
                "Aumenta o uso de GOTO",
                "Elimina a necessidade de variáveis locais",
                "Impõe o uso de uma única função main gigante"
            ],
            "correct_answer": 0,
            "explanation": "Módulos coesos com responsabilidade única tornam o código mais legível, testável e reutilizável.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_ed_sim_10",
            "topic_id": "ed_simulado",
            "question": "A busca em uma árvore binária de busca balanceada é O(log n) porque:",
            "options": [
                "Cada comparação elimina metade da árvore restante",
                "A árvore é percorrida inteiramente",
                "Os valores são armazenados em vetor",
                "A busca usa busca linear"
            ],
            "correct_answer": 0,
            "explanation": "A cada comparação com um nó decide-se ir para a esquerda ou direita, descartando a outra metade, resultando em altura e custo O(log n).",
            "difficulty": "Intermediário"
        }
    ],
    "sd_1": [  # Sistemas de Numeração
        {
            "id": "ex_sd_1_5",
            "topic_id": "sd_1",
            "question": "O número octal 17₈ equivale ao valor decimal:",
            "options": ["15", "17", "14", "21"],
            "correct_answer": 0,
            "explanation": "17₈ = 1·8¹ + 7·8⁰ = 8 + 7 = 15.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_1_6",
            "topic_id": "sd_1",
            "question": "Na adição binária, o resultado de 1 + 1 é:",
            "options": ["1", "0 com vai-um (10₂)", "2", "11₂"],
            "correct_answer": 1,
            "explanation": "Na base 2, 1 + 1 = 10₂: o bit da soma é 0 e gera um carry (vai-um) de 1 para a posição seguinte.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_1_7",
            "topic_id": "sd_1",
            "question": "O número binário fracionário 0.1₂ corresponde ao decimal:",
            "options": ["0.1", "0.25", "0.5", "1.0"],
            "correct_answer": 2,
            "explanation": "O primeiro bit após a vírgula representa 2⁻¹ = 0,5. Portanto 0.1₂ = 0,5 decimal.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_1_8",
            "topic_id": "sd_1",
            "question": "O código BCD (8421) do dígito decimal 9 é:",
            "options": ["1000", "1001", "1010", "1111"],
            "correct_answer": 1,
            "explanation": "O BCD usa 4 bits por dígito decimal; 9 = 8 + 1 = 1001₂. Os valores 1010 a 1111 são inválidos em BCD.",
            "difficulty": "Intermediário"
        }
    ],
    "sd_2": [  # Portas e Funções Lógicas
        {
            "id": "ex_sd_2_4",
            "topic_id": "sd_2",
            "question": "A saída de uma porta NOR de duas entradas vale 1 somente quando:",
            "options": [
                "Ambas as entradas são 1",
                "Todas as entradas são 0",
                "As entradas são diferentes",
                "Pelo menos uma entrada é 1"
            ],
            "correct_answer": 1,
            "explanation": "A NOR é a OR invertida: produz 1 apenas quando todas as entradas são 0; em qualquer outro caso, 0.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_2_5",
            "topic_id": "sd_2",
            "question": "A dupla negação NOT(NOT A) é equivalente a:",
            "options": ["0", "1", "A", "NOT A"],
            "correct_answer": 2,
            "explanation": "Inverter duas vezes retorna o valor original (princípio da involução na álgebra de Boole).",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_2_6",
            "topic_id": "sd_2",
            "question": "A porta XNOR (coincidência) produz 1 quando:",
            "options": [
                "As entradas são diferentes",
                "As entradas são iguais",
                "Pelo menos uma entrada é 0",
                "As entradas são ambas 0 apenas"
            ],
            "correct_answer": 1,
            "explanation": "A XNOR é o XOR negado: saída 1 quando as duas entradas são iguais (0,0 ou 1,1).",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_2_7",
            "topic_id": "sd_2",
            "question": "Um inversor (NOT) com entrada 0 produz na saída:",
            "options": ["0", "1", "Alta impedância", "Estado indefinido"],
            "correct_answer": 1,
            "explanation": "O inversor complementa a entrada: 0 → 1 e 1 → 0.",
            "difficulty": "Básico"
        }
    ],
    "sd_3": [  # Álgebra de Boole e Simplificação
        {
            "id": "ex_sd_3_4",
            "topic_id": "sd_3",
            "question": "Pela segunda lei de De Morgan, NOT (A OR B) é equivalente a:",
            "options": [
                "(NOT A) OR (NOT B)",
                "(NOT A) AND (NOT B)",
                "A OR B",
                "A AND B"
            ],
            "correct_answer": 1,
            "explanation": "De Morgan para OR: NOT(A + B) = (NOT A) · (NOT B). O complemento de uma soma é o produto dos complementos.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_3_5",
            "topic_id": "sd_3",
            "question": "Na álgebra de Boole, o valor de A · 0 é:",
            "options": ["A", "0", "1", "NOT A"],
            "correct_answer": 1,
            "explanation": "Qualquer variável AND 0 é sempre 0 (elemento absorvente do AND): A · 0 = 0.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_3_6",
            "topic_id": "sd_3",
            "question": "A expressão A · (A + B) pode ser simplificada para:",
            "options": ["A", "B", "A·B", "A + B"],
            "correct_answer": 0,
            "explanation": "Pela absorção: A · (A + B) = A·A + A·B = A + A·B = A.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_3_7",
            "topic_id": "sd_3",
            "question": "A expressão A + (NOT A · B) pode ser simplificada para:",
            "options": ["A + B", "A · B", "A", "B"],
            "correct_answer": 0,
            "explanation": "A + ¬A·B = (A + ¬A)·(A + B) = 1·(A + B) = A + B (teorema do consenso).",
            "difficulty": "Avançado"
        }
    ],
    "sd_4": [  # Circuitos Combinacionais
        {
            "id": "ex_sd_4_4",
            "topic_id": "sd_4",
            "question": "O somador completo (full adder) diferencia-se do meio somador (half adder) porque:",
            "options": [
                "Soma apenas dois bits",
                "Também recebe o carry de entrada (Cin)",
                "Não gera carry de saída",
                "Só trabalha com números negativos"
            ],
            "correct_answer": 1,
            "explanation": "O full adder soma três bits: os dois operandos e o Cin, produzindo Soma e Carry de saída, permitindo encadear somadores de n bits.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_4_5",
            "topic_id": "sd_4",
            "question": "Quantas células possui o mapa de Karnaugh para uma função de 3 variáveis?",
            "options": ["4", "8", "16", "3"],
            "correct_answer": 1,
            "explanation": "Um mapa de Karnaugh tem 2ⁿ células; para 3 variáveis: 2³ = 8 células.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_4_6",
            "topic_id": "sd_4",
            "question": "Um display de 7 segmentos, sem o ponto decimal, possui quantos segmentos controláveis?",
            "options": ["5", "6", "7", "8"],
            "correct_answer": 2,
            "explanation": "O display de 7 segmentos tem exatamente 7 segmentos (a-g), que combinados formam os dígitos de 0 a 9.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_4_7",
            "topic_id": "sd_4",
            "question": "A função de um codificador (encoder) é:",
            "options": [
                "Ativar uma saída correspondente ao código de entrada",
                "Converter uma entrada ativa em um código binário de saída",
                "Armazenar bits",
                "Inverter todas as entradas"
            ],
            "correct_answer": 1,
            "explanation": "O encoder faz o inverso do decoder: produz um código binário que identifica qual das entradas está ativa.",
            "difficulty": "Intermediário"
        }
    ],
    "sd_5": [  # Flip-Flops e Contadores
        {
            "id": "ex_sd_5_4",
            "topic_id": "sd_5",
            "question": "O flip-flop JK foi desenvolvido para eliminar o estado indefinido (inválido) do flip-flop:",
            "options": ["D", "RS (SR)", "T", "Mestre-escravo"],
            "correct_answer": 1,
            "explanation": "O flip-flop RS tem estado proibido quando R=S=1; o JK elimina esse problema atribuindo toggle (J=K=1) nessa condição.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_5_5",
            "topic_id": "sd_5",
            "question": "Em um contador síncrono:",
            "options": [
                "Cada flip-flop tem um clock próprio independente",
                "Todos os flip-flops recebem o mesmo sinal de clock simultaneamente",
                "Não há uso de flip-flops",
                "O clock é derivado da saída do último flip-flop"
            ],
            "correct_answer": 1,
            "explanation": "No contador síncrono o clock é comum a todos os flip-flops, evitando o atraso acumulado (ripple) dos contadores assíncronos.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_5_6",
            "topic_id": "sd_5",
            "question": "Um registrador de deslocamento é utilizado, entre outras aplicações, para:",
            "options": [
                "Conversão série-paralelo de dados",
                "Somar números binários",
                "Simplificar funções booleanas",
                "Gerar o clock do sistema"
            ],
            "correct_answer": 0,
            "explanation": "O registrador de deslocamento desloca bits a cada clock, permitindo converter dados recebidos em série para a forma paralela (e vice-versa).",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_5_7",
            "topic_id": "sd_5",
            "question": "Com N flip-flops, um contador binário pode contar até (número máximo de estados):",
            "options": ["N", "2N", "2^N", "10^N"],
            "correct_answer": 2,
            "explanation": "N flip-flops representam 2^N combinações distintas, contando de 0 a 2^N - 1 (ex.: 4 flip-flops → módulo 16, de 0 a 15).",
            "difficulty": "Intermediário"
        }
    ],
    "sd_6": [  # Conversores, Multiplex e Memórias
        {
            "id": "ex_sd_6_4",
            "topic_id": "sd_6",
            "question": "Um multiplexador com 8 entradas de dados necessita de quantos sinais de seleção?",
            "options": ["2", "3", "4", "8"],
            "correct_answer": 1,
            "explanation": "Com S bits de seleção é possível escolher 2^S entradas; para 8 entradas: 2³ = 8, logo S = 3.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_6_5",
            "topic_id": "sd_6",
            "question": "A memória EEPROM diferencia-se da EPROM porque:",
            "options": [
                "A EEPROM é apagada por luz ultravioleta",
                "A EEPROM pode ser apagada eletricamente, sem remoção do circuito",
                "A EEPROM é volátil",
                "A EEPROM não pode ser gravada"
            ],
            "correct_answer": 1,
            "explanation": "A EPROM é apagada por luz ultravioleta e precisa ser removida do circuito; a EEPROM é apagada/gravada eletricamente no próprio sistema.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_6_6",
            "topic_id": "sd_6",
            "question": "Em um conversor digital-analógico (D/A), a saída é:",
            "options": [
                "Um valor analógico proporcional ao código digital de entrada",
                "Sempre 0 ou 1",
                "Um código binário maior que o de entrada",
                "A mesma entrada sem alteração"
            ],
            "correct_answer": 0,
            "explanation": "O D/A transforma o valor digital (ex.: 8 bits) em um nível de tensão/corrente analógico proporcional, usado para controlar atuadores e sinais.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_6_7",
            "topic_id": "sd_6",
            "question": "TTL e CMOS são exemplos de:",
            "options": [
                "Famílias lógicas de circuitos digitais",
                "Conversores A/D",
                "Memórias voláteis",
                "Display de 7 segmentos"
            ],
            "correct_answer": 0,
            "explanation": "TTL (Transistor-Transistor Logic) e CMOS (Complementary Metal-Oxide-Semiconductor) são famílias lógicas que definem características elétricas das portas.",
            "difficulty": "Básico"
        }
    ],
    "sd_simulado": [  # Sistemas Digitais - Simulado (formato de prova)
        {
            "id": "ex_sd_sim_1",
            "topic_id": "sd_simulado",
            "question": "O número decimal 25 em binário é:",
            "options": ["11001", "10011", "10101", "11100"],
            "correct_answer": 0,
            "explanation": "25 = 16 + 8 + 1 = 1·2⁴ + 1·2³ + 0·2² + 0·2¹ + 1·2⁰ = 11001₂.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_sim_2",
            "topic_id": "sd_simulado",
            "question": "Uma porta NAND com suas duas entradas ligadas entre si funciona como:",
            "options": ["Porta AND", "Inversor (NOT)", "Porta OR", "Porta XOR"],
            "correct_answer": 1,
            "explanation": "Com A = B, a NAND(A,A) = NOT(A·A) = NOT A: a porta se comporta como um inversor.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_sim_3",
            "topic_id": "sd_simulado",
            "question": "Pelo Teorema de De Morgan, NOT (A + B) é igual a:",
            "options": [
                "(NOT A) + (NOT B)",
                "(NOT A) · (NOT B)",
                "A · B",
                "A + B"
            ],
            "correct_answer": 1,
            "explanation": "A 2ª lei de De Morgan: o complemento de uma soma é o produto dos complementos: ¬(A+B) = ¬A · ¬B.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_sim_4",
            "topic_id": "sd_simulado",
            "question": "Um mapa de Karnaugh para uma função de 4 variáveis possui:",
            "options": ["4 células", "8 células", "16 células", "32 células"],
            "correct_answer": 2,
            "explanation": "O mapa de Karnaugh possui 2ⁿ células; para n = 4: 2⁴ = 16 células.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_sim_5",
            "topic_id": "sd_simulado",
            "question": "Um decodificador 4 para 16 possui:",
            "options": [
                "4 entradas e 16 saídas",
                "16 entradas e 4 saídas",
                "4 entradas e 4 saídas",
                "16 entradas e 16 saídas"
            ],
            "correct_answer": 0,
            "explanation": "Com 4 entradas binárias existem 2⁴ = 16 combinações; o decodificador ativa exatamente uma das 16 saídas.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_sim_6",
            "topic_id": "sd_simulado",
            "question": "Em um flip-flop JK com J = 1 e K = 1, a cada borda ativa do clock a saída:",
            "options": [
                "Permanece inalterada",
                "Alterna de estado (toggle)",
                "Vai para 0",
                "Vai para 1"
            ],
            "correct_answer": 1,
            "explanation": "Com J = K = 1, o JK alterna: Q passa de 0 para 1 ou de 1 para 0 a cada pulso de clock.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_sim_7",
            "topic_id": "sd_simulado",
            "question": "Um contador binário de 4 bits (módulo 16) conta de:",
            "options": ["0 a 15", "1 a 16", "0 a 16", "0 a 31"],
            "correct_answer": 0,
            "explanation": "Com 4 bits há 16 estados possíveis (2⁴), numerados de 0 a 15; após 1111 o contador retorna a 0000.",
            "difficulty": "Intermediário"
        },
        {
            "id": "ex_sd_sim_8",
            "topic_id": "sd_simulado",
            "question": "Um multiplexador 4:1 (quatro entradas de dados) usa quantos bits de seleção?",
            "options": ["1", "2", "3", "4"],
            "correct_answer": 1,
            "explanation": "2^S = 4 entradas → S = 2 bits de seleção escolhem qual das 4 entradas será enviada à saída.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_sim_9",
            "topic_id": "sd_simulado",
            "question": "Qual memória NÃO perde seu conteúdo quando a alimentação é desligada?",
            "options": ["RAM", "ROM", "Cache SRAM", "Registrador do processador"],
            "correct_answer": 1,
            "explanation": "A ROM é não volátil: mantém os dados gravados sem energia, ao contrário da RAM e das caches, que são voláteis.",
            "difficulty": "Básico"
        },
        {
            "id": "ex_sd_sim_10",
            "topic_id": "sd_simulado",
            "question": "Um conversor analógico-digital (A/D) de 4 bits pode representar quantos níveis de tensão?",
            "options": ["4", "8", "16", "32"],
            "correct_answer": 2,
            "explanation": "Com n bits o A/D representa 2ⁿ níveis; para 4 bits: 2⁴ = 16 níveis discretos.",
            "difficulty": "Intermediário"
        }
    ]
}
