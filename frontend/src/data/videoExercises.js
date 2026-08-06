export const VIDEO_EXERCISES = {
  'ed_1:0': [
    {
      question: 'Qual é a sintaxe correta para declarar uma função em C++?',
      options: ['funcao tipo nome()', 'tipo nome(parametros) { ... }', 'nome funcao(parametros)', 'tipo(nome, parametros)'],
      correct_answer: 1,
      explanation: 'Em C++ a função é declarada com o tipo de retorno primeiro, seguido do nome e dos parâmetros entre parênteses, ex.: int soma(int a, int b).',
    },
    {
      question: 'O que acontece se uma função é chamada antes de sua declaração (protótipo) no código?',
      options: ['Funciona normalmente', 'Erro de compilação', 'O programa trava', 'A função é ignorada'],
      correct_answer: 1,
      explanation: 'O compilador precisa conhecer o protótipo (tipo de retorno, nome e parâmetros) antes do ponto de chamada, caso contrário ocorre erro de compilação.',
    },
    {
      question: 'O que é o protótipo de uma função?',
      options: ['A implementação completa da função', 'A declaração com tipo de retorno, nome e parâmetros', 'O corpo da função em outro arquivo', 'A documentação da função'],
      correct_answer: 1,
      explanation: 'O protótipo é apenas a declaração (assinatura) da função, sem o corpo. Ele informa ao compilador como a função será chamada.',
    },
  ],
  'ed_1:1': [
    {
      question: 'Na passagem por valor em C++, a função recebe:',
      options: ['Uma referência à variável original', 'Uma cópia do valor da variável', 'O endereço de memória da variável', 'Um ponteiro para a variável'],
      correct_answer: 1,
      explanation: 'Na passagem por valor, uma cópia do argumento é criada. Alterações feitas dentro da função não afetam a variável original.',
    },
    {
      question: 'Como declarar um parâmetro por referência em C++?',
      options: ['void trocar(int* a, int* b)', 'void trocar(int &a, int &b)', 'void trocar(ref int a, int b)', 'void trocar(int a, int b)'],
      correct_answer: 1,
      explanation: 'O operador & na declaração do parâmetro indica passagem por referência: a função opera diretamente na variável original.',
    },
    {
      question: 'Em qual situação a passagem por referência é mais indicada?',
      options: ['Sempre, sem exceções', 'Quando a função precisa modificar a variável original ou evitar cópias caras de objetos grandes', 'Quando o parâmetro é um tipo primitivo', 'Apenas para números inteiros'],
      correct_answer: 1,
      explanation: 'Passagem por referência é usada quando a função deve alterar a variável original, ou para evitar o custo de copiar estruturas grandes.',
    },
  ],
  'ed_2:0': [
    {
      question: 'A notação Big O (O) mede principalmente:',
      options: ['O tempo exato de execução em segundos', 'A taxa de crescimento do tempo/memória em relação à entrada', 'A quantidade de linhas do algoritmo', 'O consumo de disco'],
      correct_answer: 1,
      explanation: 'Big O descreve o comportamento assintótico: como o custo cresce conforme o tamanho n da entrada aumenta.',
    },
    {
      question: 'Um algoritmo com complexidade O(1):',
      options: ['Cresce linearmente com n', 'Tem custo constante, independente de n', 'Tem custo logarítmico', 'É sempre o mais lento'],
      correct_answer: 1,
      explanation: 'O(1) significa custo constante: não importa o tamanho da entrada, o número de operações permanece o mesmo.',
    },
    {
      question: 'Qual é a complexidade de acessar um elemento de um vetor pelo índice?',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      correct_answer: 2,
      explanation: 'O acesso por índice em um vetor é O(1): o endereço é calculado diretamente a partir do índice.',
    },
  ],
  'ed_2:1': [
    {
      question: 'Um laço for que itera de 0 a n-1 executando operações constantes tem complexidade:',
      options: ['O(1)', 'O(n)', 'O(n²)', 'O(log n)'],
      correct_answer: 1,
      explanation: 'Um único laço com n iterações de custo constante é O(n).',
    },
    {
      question: 'Dois laços aninhados, cada um com n iterações, resultam em complexidade:',
      options: ['O(n)', 'O(2n)', 'O(n²)', 'O(log n)'],
      correct_answer: 2,
      explanation: 'Laços aninhados geram n × n operações, ou seja, O(n²).',
    },
    {
      question: 'A busca binária em um vetor ordenado tem complexidade:',
      options: ['O(n)', 'O(n²)', 'O(1)', 'O(log n)'],
      correct_answer: 3,
      explanation: 'A busca binária descarta metade dos elementos a cada passo, resultando em O(log n).',
    },
  ],
  'ed_3:0': [
    {
      question: 'Dado o vetor int v[5]; quais são os índices válidos?',
      options: ['1 a 5', '0 a 4', '0 a 5', '1 a 6'],
      correct_answer: 1,
      explanation: 'Em C/C++ os índices de um vetor de tamanho 5 vão de 0 a 4.',
    },
    {
      question: 'O primeiro elemento de um vetor v está em:',
      options: ['v[1]', 'v[0]', 'v[-1]', 'v[n]'],
      correct_answer: 1,
      explanation: 'Em C/C++ a indexação começa em 0, então o primeiro elemento é v[0].',
    },
    {
      question: 'Qual operação em um vetor tem complexidade O(1)?',
      options: ['Busca linear', 'Inserção no meio', 'Acesso por índice', 'Ordenação'],
      correct_answer: 2,
      explanation: 'O acesso direto por índice é O(1); buscas e inserções geralmente custam mais.',
    },
  ],
  'ed_3:1': [
    {
      question: 'No bubble sort, a cada passada, os elementos:',
      options: ['São inseridos na posição correta', 'Adjacentes são comparados e trocados', 'São divididos ao meio', 'São copiados para outro vetor'],
      correct_answer: 1,
      explanation: 'O bubble sort compara pares de elementos adjacentes e os troca quando estão fora de ordem, "empurrando" o maior para o fim.',
    },
    {
      question: 'No insertion sort, cada elemento é:',
      options: ['Trocado com o vizinho da direita', 'Inserido na posição correta da parte já ordenada', 'Escolhido como pivô', 'Duplicado'],
      correct_answer: 1,
      explanation: 'O insertion sort mantém uma parte ordenada e insere cada novo elemento na posição correta dessa parte.',
    },
    {
      question: 'Qual é a complexidade do bubble sort no pior caso?',
      options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
      correct_answer: 2,
      explanation: 'No pior caso (vetor inversamente ordenado), o bubble sort faz n passadas com n comparações, totalizando O(n²).',
    },
  ],
  'ed_4:0': [
    {
      question: 'A matriz int m[3][4] possui:',
      options: ['3 elementos', '4 elementos', '7 elementos', '12 elementos'],
      correct_answer: 3,
      explanation: 'Uma matriz 3×4 possui 3 linhas e 4 colunas, totalizando 12 elementos.',
    },
    {
      question: 'Na matriz int m[3][4], a expressão m[2][3] acessa:',
      options: ['Linha 3, coluna 4', 'Linha 2, coluna 3', 'Linha 2, coluna 4', 'Linha 3, coluna 3'],
      correct_answer: 1,
      explanation: 'O primeiro índice é a linha (0 a 2) e o segundo a coluna (0 a 3): m[2][3] acessa a linha 2, coluna 3.',
    },
    {
      question: 'Para percorrer uma matriz linha por linha, a estrutura correta é:',
      options: ['Laço externo sobre colunas e interno sobre linhas', 'Laço externo sobre linhas e interno sobre colunas', 'Um único laço', 'Dois laços independentes'],
      correct_answer: 1,
      explanation: 'Percorre-se primeiro as linhas (laço externo) e dentro de cada linha as colunas (laço interno).',
    },
  ],
  'ed_4:1': [
    {
      question: 'A instrução int *p = new int[n]; aloca:',
      options: ['Um único inteiro', 'n inteiros no heap', 'n inteiros na pilha', 'n bytes na pilha'],
      correct_answer: 1,
      explanation: 'new int[n] aloca um vetor de n inteiros no heap (memória dinâmica), retornando um ponteiro para o primeiro elemento.',
    },
    {
      question: 'Para alocar dinamicamente uma matriz m×n, a técnica comum é:',
      options: ['Alocar um vetor único de m*n e acessar com m[i][j]', 'Criar um vetor de m ponteiros e alocar um vetor de n para cada linha', 'Usar dois new int[n]', 'Não é possível alocar matrizes dinamicamente'],
      correct_answer: 1,
      explanation: 'Cria-se um vetor de ponteiros (as linhas) e aloca-se um vetor de n inteiros para cada linha.',
    },
    {
      question: 'Para liberar a memória de um vetor alocado com new[], deve-se usar:',
      options: ['delete p', 'free(p)', 'delete[] p', 'release(p)'],
      correct_answer: 2,
      explanation: 'Vetores alocados com new[] devem ser liberados com delete[] para que todos os elementos sejam destruídos.',
    },
  ],
  'ed_5:0': [
    {
      question: 'Dado int x = 10; int *p = &x; a variável p armazena:',
      options: ['O valor 10', 'Uma cópia de x', 'O endereço de memória de x', 'O endereço da variável p'],
      correct_answer: 2,
      explanation: 'O operador &x retorna o endereço de memória de x, que é armazenado no ponteiro p.',
    },
    {
      question: 'A expressão *p (desreferência) permite:',
      options: ['Acessar o endereço de p', 'Acessar o valor apontado por p', 'Criar um novo ponteiro', 'Somar um ao endereço'],
      correct_answer: 1,
      explanation: 'O operador * acessa o conteúdo do endereço apontado pelo ponteiro. Se p aponta para x, *p vale 10.',
    },
    {
      question: 'O que a expressão &x retorna?',
      options: ['O valor de x', 'Uma referência para x', 'O endereço de memória de x', 'O tamanho de x em bytes'],
      correct_answer: 2,
      explanation: '& é o operador de endereço: &x retorna o endereço de memória onde x está armazenado.',
    },
  ],
  'ed_5:1': [
    {
      question: 'O operador new aloca memória:',
      options: ['Na pilha (stack)', 'No heap (montículo)', 'No registro do processador', 'No disco rígido'],
      correct_answer: 1,
      explanation: 'new aloca memória no heap, que permanece válida até ser liberada com delete.',
    },
    {
      question: 'O operador delete é usado para:',
      options: ['Alocar memória', 'Redimensionar memória', 'Liberar memória alocada com new', 'Copiar memória'],
      correct_answer: 2,
      explanation: 'delete libera a memória de um único objeto alocado com new, chamando seu destrutor.',
    },
    {
      question: 'Esquecer de liberar memória alocada com new pode causar:',
      options: ['Segmentation fault imediato', 'Vazamento de memória (memory leak)', 'Erro de sintaxe', 'Aceleração do programa'],
      correct_answer: 1,
      explanation: 'Memória alocada sem delete nunca é devolvida ao sistema, causando vazamento de memória ao longo do programa.',
    },
  ],
  'ed_6:0': [
    {
      question: 'A estrutura de dados pilha (stack) segue o princípio:',
      options: ['FIFO - primeiro a entrar, primeiro a sair', 'LIFO - último a entrar, primeiro a sair', 'Fila de prioridade', 'Acesso aleatório'],
      correct_answer: 1,
      explanation: 'A pilha é LIFO: o último elemento inserido (topo) é o primeiro a ser removido.',
    },
    {
      question: 'A operação push em uma pilha:',
      options: ['Remove o elemento do topo', 'Insere um elemento no topo', 'Verifica se a pilha está vazia', 'Ordena os elementos'],
      correct_answer: 1,
      explanation: 'push insere um novo elemento no topo da pilha.',
    },
    {
      question: 'A operação pop em uma pilha:',
      options: ['Insere no topo', 'Remove o elemento do topo', 'Retorna o elemento do fundo', 'Duplica o topo'],
      correct_answer: 1,
      explanation: 'pop remove o elemento do topo da pilha (o último inserido).',
    },
  ],
  'ed_6:1': [
    {
      question: 'A estrutura de dados fila (queue) segue o princípio:',
      options: ['LIFO - último a entrar, primeiro a sair', 'FIFO - primeiro a entrar, primeiro a sair', 'Ordem aleatória', 'Último a entrar fica'],
      correct_answer: 1,
      explanation: 'A fila é FIFO: o primeiro elemento inserido (frente) é o primeiro a ser removido.',
    },
    {
      question: 'A operação enqueue em uma fila:',
      options: ['Remove o elemento da frente', 'Insere um elemento no fim', 'Insere um elemento no início', 'Espera um processo'],
      correct_answer: 1,
      explanation: 'enqueue insere um novo elemento no fim (traseira) da fila.',
    },
    {
      question: 'A operação dequeue em uma fila:',
      options: ['Insere no fim', 'Remove o elemento da frente', 'Remove o elemento do fim', 'Limpa a fila'],
      correct_answer: 1,
      explanation: 'dequeue remove o elemento que está na frente da fila (o mais antigo).',
    },
  ],
  'ed_7:0': [
    {
      question: 'Cada nó de uma lista simplesmente encadeada contém:',
      options: ['Apenas o dado', 'O dado e um ponteiro para o próximo nó', 'O dado e dois ponteiros', 'O dado e o índice'],
      correct_answer: 1,
      explanation: 'Um nó de lista simples tem o campo dado e um ponteiro (next) para o próximo nó.',
    },
    {
      question: 'Inserir um elemento no início de uma lista encadeada custa:',
      options: ['O(n) - depende do tamanho', 'O(n²)', 'O(1) - tempo constante', 'O(log n)'],
      correct_answer: 2,
      explanation: 'Basta criar o novo nó, apontar seu next para o início atual e atualizar a cabeça: O(1).',
    },
    {
      question: 'O fim de uma lista simplesmente encadeada é identificado quando:',
      options: ['next == nullptr', 'dado == 0', 'index == tamanho', 'o nó é a cabeça'],
      correct_answer: 0,
      explanation: 'O último nó tem o ponteiro next igual a nullptr, marcando o fim da lista.',
    },
  ],
  'ed_7:1': [
    {
      question: 'Cada nó de uma lista duplamente encadeada contém:',
      options: ['Dado e um ponteiro', 'Dado e dois ponteiros (prev e next)', 'Dado e três ponteiros', 'Apenas o dado'],
      correct_answer: 1,
      explanation: 'O nó da lista dupla tem os ponteiros prev (anterior) e next (próximo), além do dado.',
    },
    {
      question: 'A principal vantagem da lista duplamente encadeada sobre a simples é:',
      options: ['Menor consumo de memória', 'Permite percurso nos dois sentidos', 'Insere mais rápido na cabeça', 'Não precisa de ponteiros'],
      correct_answer: 1,
      explanation: 'Com o ponteiro prev, é possível percorrer a lista tanto para frente quanto para trás.',
    },
    {
      question: 'Com um ponteiro para um nó conhecido, removê-lo de uma lista dupla custa:',
      options: ['O(n) - precisa percorrer', 'O(n²)', 'O(log n)', 'O(1) - tempo constante'],
      correct_answer: 3,
      explanation: 'Basta ajustar prev->next e next->prev do nó removido, sem percorrer a lista: O(1).',
    },
  ],
  'ed_8:0': [
    {
      question: 'Cada nó de uma árvore binária contém:',
      options: ['Dado e um ponteiro', 'Dado e ponteiros para filho esquerdo e filho direito', 'Dado e ponteiro para o pai', 'Dado e dois inteiros'],
      correct_answer: 1,
      explanation: 'O nó de árvore binária tem o dado e dois ponteiros: esquerda e direita (filhos).',
    },
    {
      question: 'Um nó sem filhos em uma árvore é chamado de:',
      options: ['Raiz', 'Galho', 'Folha', 'Subárvore'],
      correct_answer: 2,
      explanation: 'Folha é o nó que não possui nenhum filho (esquerda e direita nulas).',
    },
    {
      question: 'A altura de uma árvore é definida como:',
      options: ['O número de folhas', 'O número de nós internos', 'O maior número de arestas da raiz até uma folha', 'O número total de nós'],
      correct_answer: 2,
      explanation: 'A altura é o comprimento do caminho mais longo entre a raiz e uma folha (em número de arestas).',
    },
  ],
  'ed_8:1': [
    {
      question: 'Em uma árvore binária de busca (BST), para todo nó vale:',
      options: ['Filhos à esquerda maiores que a raiz', 'Filhos à esquerda menores e à direita maiores que o nó', 'Os filhos são sempre iguais', 'Não há regra de ordenação'],
      correct_answer: 1,
      explanation: 'Na BST, todos os nós da subárvore esquerda são menores e todos os da direita são maiores que o nó.',
    },
    {
      question: 'A busca em uma BST balanceada tem complexidade:',
      options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
      correct_answer: 2,
      explanation: 'A cada comparação, uma das subárvores é descartada, reduzindo o espaço de busca pela metade: O(log n).',
    },
    {
      question: 'O percurso in-order (esquerda, raiz, direita) em uma BST produz:',
      options: ['Elementos em ordem decrescente', 'Elementos em ordem crescente', 'Elementos aleatórios', 'Apenas as folhas'],
      correct_answer: 1,
      explanation: 'O percurso in-order visita os nós em ordem crescente de chave na BST.',
    },
  ],
  'ed_8:2': [
    {
      question: 'O fator de balanceamento de um nó em uma árvore AVL é:',
      options: ['altura(esquerda) - altura(direita)', 'altura(direita) - número de nós', 'número de filhos - 1', 'altura total da árvore'],
      correct_answer: 0,
      explanation: 'O fator de balanceamento é a diferença entre as alturas das subárvores esquerda e direita.',
    },
    {
      question: 'Em uma árvore AVL, um nó é considerado balanceado quando seu fator é:',
      options: ['Sempre 0', '-1, 0 ou 1', '-2, -1, 0, 1, 2', 'Maior que 2'],
      correct_answer: 1,
      explanation: 'A árvore AVL exige que todo nó tenha fator de balanceamento entre -1 e 1.',
    },
    {
      question: 'Uma rotação LL (esquerda-esquerda) é aplicada quando:',
      options: ['O nó está desbalanceado para a direita', 'O desbalanceamento ocorre no filho esquerdo do filho esquerdo', 'A árvore está vazia', 'O nó é uma folha'],
      correct_answer: 1,
      explanation: 'A rotação simples à direita corrige o caso LL: o filho esquerdo do filho esquerdo é a causa do desbalanceamento.',
    },
  ],
  'ed_simulado:0': [
    {
      question: '(Simulado) A complexidade do acesso a um elemento de vetor por índice é:',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      correct_answer: 2,
      explanation: 'Acesso direto por índice em vetor é O(1).',
    },
    {
      question: '(Simulado) Qual estrutura utiliza o princípio LIFO?',
      options: ['Fila', 'Pilha', 'Vetor', 'Matriz'],
      correct_answer: 1,
      explanation: 'A pilha é LIFO (último a entrar, primeiro a sair).',
    },
    {
      question: '(Simulado) O percurso in-order de uma BST visitará os elementos:',
      options: ['Em ordem aleatória', 'Em ordem crescente', 'Em ordem decrescente', 'Somente os pares'],
      correct_answer: 1,
      explanation: 'O percurso in-order de uma árvore binária de busca gera os elementos em ordem crescente.',
    },
  ],
  'sd_1:0': [
    {
      question: 'O número binário 1011₂ equivale em decimal a:',
      options: ['9', '10', '11', '13'],
      correct_answer: 2,
      explanation: '1011₂ = 8 + 0 + 2 + 1 = 11.',
    },
    {
      question: 'O número decimal 13 em binário é:',
      options: ['1001', '1011', '1101', '1110'],
      correct_answer: 2,
      explanation: '13 = 8 + 4 + 1 = 1101₂.',
    },
    {
      question: 'Qual é a menor base possível para um sistema de numeração posicional?',
      options: ['1', '2', '8', '10'],
      correct_answer: 1,
      explanation: 'A menor base é 2 (sistema binário), pois é necessário pelo menos dois símbolos (0 e 1).',
    },
  ],
  'sd_1:1': [
    {
      question: 'O número hexadecimal 1A₁₆ equivale em decimal a:',
      options: ['16', '20', '26', '31'],
      correct_answer: 2,
      explanation: '1A₁₆ = 1×16 + 10 = 26.',
    },
    {
      question: 'O número octal 63₈ equivale em binário a:',
      options: ['110011', '101010', '100100', '111111'],
      correct_answer: 0,
      explanation: 'Cada dígito octal corresponde a 3 bits: 6 = 110 e 3 = 011, logo 110011₂.',
    },
    {
      question: 'O dígito BCD 8421 do número decimal 5 é:',
      options: ['0101', '0110', '1001', '1010'],
      correct_answer: 0,
      explanation: 'No código BCD 8421 cada dígito decimal é representado por seu equivalente binário de 4 bits: 5 = 0101.',
    },
  ],
  'sd_1:2': [
    {
      question: 'Qual é o resultado da soma binária 1 + 1?',
      options: ['10 (com "vai 1")', '01', '11', '00'],
      correct_answer: 0,
      explanation: '1 + 1 em binário resulta em 0 com "vai 1" (carry), formando 10₂.',
    },
    {
      question: 'Qual é o resultado de 1101₂ + 0101₂?',
      options: ['10001₂', '10010₂', '11000₂', '10100₂'],
      correct_answer: 1,
      explanation: '1101 + 0101 = 10010₂ (13 + 5 = 18).',
    },
    {
      question: 'O bit menos significativo (LSB) de um número binário é:',
      options: ['O bit mais à esquerda', 'O bit mais à direita', 'O maior bit', 'O bit do sinal'],
      correct_answer: 1,
      explanation: 'O LSB é o bit da extrema direita, que representa 2⁰ = 1.',
    },
  ],
  'sd_2:0': [
    {
      question: 'A porta lógica AND produz 1 (alto) somente quando:',
      options: ['Pelo menos uma entrada é 1', 'Todas as entradas são 1', 'Nenhuma entrada é 1', 'As entradas são diferentes'],
      correct_answer: 1,
      explanation: 'A porta AND só é 1 quando todas as entradas são 1. Basta uma entrada 0 para a saída ser 0.',
    },
    {
      question: 'A porta lógica OR produz 1 quando:',
      options: ['Todas as entradas são 1', 'Nenhuma entrada é 1', 'Pelo menos uma entrada é 1', 'As entradas são iguais'],
      correct_answer: 2,
      explanation: 'A porta OR é 1 se qualquer uma das entradas for 1.',
    },
    {
      question: 'A porta lógica NOT:',
      options: ['Inverte a entrada', 'Multiplica as entradas', 'Soma as entradas', 'Compara as entradas'],
      correct_answer: 0,
      explanation: 'A porta NOT (inversor) produz a negação lógica da entrada: 0 vira 1 e 1 vira 0.',
    },
  ],
  'sd_2:1': [
    {
      question: 'A porta NAND é equivalente a:',
      options: ['AND seguida de OR', 'AND seguida de NOT', 'OR seguida de NOT', 'XOR seguida de NOT'],
      correct_answer: 1,
      explanation: 'NAND = NOT(AND): produz 0 somente quando todas as entradas são 1.',
    },
    {
      question: 'A porta XOR produz 1 quando:',
      options: ['As entradas são iguais', 'As entradas são diferentes', 'Todas são 1', 'Nenhuma é 1'],
      correct_answer: 1,
      explanation: 'XOR (ou exclusivo) é 1 quando as entradas são diferentes (ex.: 1⊕0 = 1).',
    },
    {
      question: 'A porta NOR produz 1 somente quando:',
      options: ['Todas as entradas são 1', 'Todas as entradas são 0', 'Pelo menos uma é 1', 'As entradas são diferentes'],
      correct_answer: 1,
      explanation: 'NOR = NOT(OR): é 1 apenas quando todas as entradas são 0.',
    },
  ],
  'sd_2:2': [
    {
      question: 'Uma tabela-verdade de uma função com 3 variáveis possui quantas linhas?',
      options: ['4', '6', '8', '16'],
      correct_answer: 2,
      explanation: 'O número de linhas é 2ⁿ: para 3 variáveis, 2³ = 8 linhas.',
    },
    {
      question: 'Uma função com 2 variáveis possui quantas combinações de entrada?',
      options: ['2', '4', '8', '16'],
      correct_answer: 1,
      explanation: '2 variáveis geram 2² = 4 combinações: 00, 01, 10, 11.',
    },
    {
      question: 'A expressão A + B é igual a 0 somente quando:',
      options: ['A = 0 e B = 0', 'A = 1 e B = 0', 'A = 0 e B = 1', 'A = 1 e B = 1'],
      correct_answer: 0,
      explanation: 'A soma lógica (OR) só é 0 quando todas as entradas são 0.',
    },
  ],
  'sd_3:0': [
    {
      question: 'Pelo Teorema de De Morgan, ¬(A·B) é equivalente a:',
      options: ['¬A · ¬B', '¬A + ¬B', 'A · ¬B', '¬(A + B)'],
      correct_answer: 1,
      explanation: 'De Morgan: a negação do produto é a soma das negações: ¬(A·B) = ¬A + ¬B.',
    },
    {
      question: 'Pelo Teorema de De Morgan, ¬(A + B) é equivalente a:',
      options: ['¬A + ¬B', '¬A · ¬B', 'A · B', '¬A + B'],
      correct_answer: 1,
      explanation: 'De Morgan: a negação da soma é o produto das negações: ¬(A+B) = ¬A · ¬B.',
    },
    {
      question: 'A expressão A · ¬A (uma variável e sua negação) resulta em:',
      options: ['A', '1', '0', '¬A'],
      correct_answer: 2,
      explanation: 'Uma variável E sua negação nunca são 1 ao mesmo tempo, então A · ¬A = 0 (complemento).',
    },
  ],
  'sd_3:1': [
    {
      question: 'Pela propriedade de absorção, A + A·B é igual a:',
      options: ['A', 'B', 'A·B', '1'],
      correct_answer: 0,
      explanation: 'Absorção: A + A·B = A, pois A "absorve" o termo A·B.',
    },
    {
      question: 'A expressão A + ¬A (uma variável ou sua negação) resulta em:',
      options: ['A', '0', '¬A', '1'],
      correct_answer: 3,
      explanation: 'Uma variável OU sua negação é sempre 1 (teorema do complemento).',
    },
    {
      question: 'A expressão A · (A + B) é igual a:',
      options: ['A', 'B', 'A + B', 'A·B'],
      correct_answer: 0,
      explanation: 'Absorção dual: A · (A + B) = A.',
    },
  ],
  'sd_3:2': [
    {
      question: 'No mapa de Karnaugh, um grupo de 2 células adjacentes elimina quantas variáveis?',
      options: ['0', '1', '2', '3'],
      correct_answer: 1,
      explanation: 'Cada agrupamento de 2ⁿ células elimina n variáveis: 2 células = 2¹ elimina 1 variável.',
    },
    {
      question: 'Um grupo de 4 células em um mapa de Karnaugh elimina quantas variáveis?',
      options: ['1', '2', '3', '4'],
      correct_answer: 1,
      explanation: '4 células = 2², eliminando 2 variáveis do termo resultante.',
    },
    {
      question: 'No mapa de Karnaugh, duas células podem ser agrupadas somente se:',
      options: ['Estiverem na mesma linha', 'Diferirem em exatamente uma variável', 'Tiverem o mesmo valor', 'Estiverem na diagonal'],
      correct_answer: 1,
      explanation: 'Células adjacentes (inclusive nas bordas) diferem em apenas uma variável, permitindo a simplificação.',
    },
  ],
  'sd_4:0': [
    {
      question: 'Um meio somador (half adder) soma:',
      options: ['Dois bits e o carry de entrada', 'Apenas dois bits, gerando soma e carry', 'Quatro bits', 'Dois números de 4 bits'],
      correct_answer: 1,
      explanation: 'O half adder soma dois bits (A e B) e gera a soma (S) e o carry de saída (C).',
    },
    {
      question: 'Um somador completo (full adder) soma:',
      options: ['Dois bits', 'Dois bits mais o carry de entrada', 'Quatro bits', 'Dois números decimais'],
      correct_answer: 1,
      explanation: 'O full adder soma A, B e o carry vindo da etapa anterior (Cin), gerando S e Cout.',
    },
    {
      question: 'No meio somador, para entradas A = 1 e B = 1, as saídas são:',
      options: ['S = 1, C = 0', 'S = 0, C = 1', 'S = 1, C = 1', 'S = 0, C = 0'],
      correct_answer: 1,
      explanation: '1 + 1 = 10₂: soma S = 0 com carry C = 1.',
    },
  ],
  'sd_4:1': [
    {
      question: 'Quantas linhas de seleção são necessárias para um multiplexador 4:1?',
      options: ['1', '2', '3', '4'],
      correct_answer: 1,
      explanation: 'Um MUX com 2ⁿ entradas precisa de n seletores: 4 entradas → 2 seletores.',
    },
    {
      question: 'Um multiplexador 8:1 precisa de quantas linhas de seleção?',
      options: ['2', '3', '4', '8'],
      correct_answer: 1,
      explanation: '8 = 2³, logo são necessários 3 bits de seleção.',
    },
    {
      question: 'A função de um multiplexador é:',
      options: ['Dividir um sinal em várias saídas', 'Selecionar uma das entradas e enviá-la à saída', 'Armazenar dados', 'Converter analógico em digital'],
      correct_answer: 1,
      explanation: 'O MUX direciona para a saída uma das entradas, escolhida pelo código de seleção.',
    },
  ],
  'sd_4:2': [
    {
      question: 'Um decodificador BCD para display de 7 segmentos recebe quantas entradas?',
      options: ['3', '4', '7', '10'],
      correct_answer: 1,
      explanation: 'O BCD possui 4 bits, representando os dígitos de 0 a 9, acionando os 7 segmentos.',
    },
    {
      question: 'Um display de 7 segmentos possui:',
      options: ['7 segmentos, sendo um de cada cor', '7 segmentos (a a g) para formar os dígitos', '7 pinos de alimentação', '7 dígitos'],
      correct_answer: 1,
      explanation: 'O display tem 7 segmentos luminosos (a, b, c, d, e, f, g) que combinados formam os números.',
    },
    {
      question: 'Para acender o dígito 1 em um display de 7 segmentos, quais segmentos são acionados?',
      options: ['a e b', 'b e c', 'a, b e c', 'd, e e f'],
      correct_answer: 1,
      explanation: 'O número 1 é formado pelos segmentos b e c.',
    },
  ],
  'sd_5:0': [
    {
      question: 'No flip-flop RS, a combinação S = 1 e R = 0 faz:',
      options: ['Q = 0 (reset)', 'Q = 1 (set)', 'Q = Q (memória)', 'Estado proibido'],
      correct_answer: 1,
      explanation: 'S = 1 (set) coloca Q = 1; R = 1 (reset) coloca Q = 0.',
    },
    {
      question: 'No flip-flop JK, a combinação J = 1 e K = 1 faz:',
      options: ['Q = 0', 'Q = 1', 'Alternar o estado (toggle)', 'Manter o estado'],
      correct_answer: 2,
      explanation: 'Com J = K = 1, o flip-flop alterna o estado a cada pulso de clock (toggle).',
    },
    {
      question: 'No flip-flop D, a saída Q acompanha:',
      options: ['O valor de D apenas na borda do clock', 'O valor de J', 'O valor da entrada de reset', 'O valor da saída anterior sempre'],
      correct_answer: 0,
      explanation: 'O flip-flop D copia a entrada D para Q nas bordas do clock (data latch).',
    },
  ],
  'sd_5:1': [
    {
      question: 'Um registrador de deslocamento:',
      options: ['Armazena e desloca os bits a cada pulso de clock', 'Soma bits', 'Compara dois números', 'Converte binário em BCD'],
      correct_answer: 0,
      explanation: 'O registrador de deslocamento move os bits de posição a cada clock, permitindo conversões série-paralelo.',
    },
    {
      question: 'Em um contador assíncrono (ripple):',
      options: ['Todos os flip-flops recebem o mesmo clock', 'O clock de cada estágio vem da saída do estágio anterior', 'Não há clock', 'Só há um flip-flop'],
      correct_answer: 1,
      explanation: 'No contador assíncrono, a saída de um flip-flop serve de clock para o próximo (efeito cascata/ripple).',
    },
    {
      question: 'A vantagem do contador síncrono é:',
      options: ['Mais simples de construir', 'Todos os flip-flops são disparados pelo mesmo clock, sem atraso acumulado', 'Usa menos flip-flops', 'Não precisa de clock'],
      correct_answer: 1,
      explanation: 'No contador síncrono todos os flip-flops recebem o clock simultaneamente, evitando atrasos acumulados.',
    },
  ],
  'sd_5:2': [
    {
      question: 'A principal característica dos circuitos sequenciais é:',
      options: ['A saída depende apenas das entradas atuais', 'A saída depende das entradas e do estado anterior (memória)', 'Não possuem clock', 'São apenas somadores'],
      correct_answer: 1,
      explanation: 'Circuitos sequenciais têm memória: a saída depende das entradas atuais e do estado anterior, controladas pelo clock.',
    },
    {
      question: 'O flip-flop mestre-escravo foi criado para resolver:',
      options: ['O consumo de energia', 'O problema da corrida (race condition)', 'A velocidade', 'O tamanho do circuito'],
      correct_answer: 1,
      explanation: 'O arranjo mestre-escravo evita que o flip-flop alterne mais de uma vez por pulso de clock (race condition).',
    },
    {
      question: 'Um contador módulo 4 conta de:',
      options: ['1 a 4', '0 a 3', '0 a 7', '0 a 15'],
      correct_answer: 1,
      explanation: 'Um contador módulo 4 usa 2 flip-flops e conta de 00₂ (0) até 11₂ (3), voltando a 0.',
    },
  ],
  'sd_6:0': [
    {
      question: 'Um conversor D/A (digital-analógico):',
      options: ['Converte sinal analógico em digital', 'Converte um valor digital em tensão/corrente analógica', 'Amplifica sinais digitais', 'Armazena valores binários'],
      correct_answer: 1,
      explanation: 'O DAC recebe um valor binário e gera uma tensão (ou corrente) proporcional na saída.',
    },
    {
      question: 'Um conversor A/D (analógico-digital):',
      options: ['Converte tensão analógica em valor binário', 'Converte binário em tensão', 'Multiplica sinais', 'Filtra ruídos'],
      correct_answer: 0,
      explanation: 'O ADC amostra um sinal analógico e o converte em um valor digital de n bits.',
    },
    {
      question: 'A resolução de um conversor A/D de n bits é determinada por:',
      options: ['A velocidade do clock', 'O número de níveis (2ⁿ) em que a faixa é dividida', 'A temperatura', 'O tamanho do display'],
      correct_answer: 1,
      explanation: 'Com n bits, o conversor divide a faixa analógica em 2ⁿ níveis: quanto mais bits, maior a resolução.',
    },
  ],
  'sd_6:1': [
    {
      question: 'A característica principal da memória ROM é:',
      options: ['Ser volátil', 'Ser somente de leitura e não volátil', 'Ser regravável a cada ciclo', 'Armazenar apenas programas'],
      correct_answer: 1,
      explanation: 'A ROM (Read-Only Memory) é não volátil e destinada à leitura: seu conteúdo não se perde sem energia.',
    },
    {
      question: 'A memória EPROM é apagada utilizando:',
      options: ['Tensão alta', 'Radiação ultravioleta', 'Corrente elétrica da placa', 'Software de formatação'],
      correct_answer: 1,
      explanation: 'A EPROM é apagada por exposição à luz ultravioleta através de uma janela no encapsulamento.',
    },
    {
      question: 'A memória RAM é caracterizada por:',
      options: ['Ser não volátil', 'Ser volátil e permitir leitura e escrita', 'Permitir apenas leitura', 'Armazenar o firmware'],
      correct_answer: 1,
      explanation: 'A RAM é volátil (perde dados sem energia) e permite leitura e escrita a qualquer momento.',
    },
  ],
  'sd_6:2': [
    {
      question: 'A família lógica TTL é construída com:',
      options: ['Transistores MOS', 'Transistores bipolares (BJT)', 'Relés', 'Tubos de vácuo'],
      correct_answer: 1,
      explanation: 'A TTL (Transistor-Transistor Logic) usa transistores bipolares de junção.',
    },
    {
      question: 'A principal vantagem da família CMOS sobre a TTL é:',
      options: ['Maior velocidade sempre', 'Menor consumo de potência', 'Menor custo', 'Maior tensão de alimentação'],
      correct_answer: 1,
      explanation: 'O CMOS consome potência muito menor que o TTL, principalmente em repouso.',
    },
    {
      question: 'A tensão de alimentação típica da família TTL é:',
      options: ['3,3 V', '5 V', '12 V', '24 V'],
      correct_answer: 1,
      explanation: 'Os circuitos TTL padrão são alimentados com 5 V.',
    },
  ],
  'sd_simulado:0': [
    {
      question: '(Simulado) O valor hexadecimal 0xFF equivale em decimal a:',
      options: ['128', '255', '256', '511'],
      correct_answer: 1,
      explanation: '0xFF = 15×16 + 15 = 255.',
    },
    {
      question: '(Simulado) O resultado de 1 ⊕ 1 (XOR) é:',
      options: ['0', '1', '2', '10'],
      correct_answer: 0,
      explanation: 'A porta XOR é 1 apenas quando as entradas são diferentes; 1⊕1 = 0.',
    },
    {
      question: '(Simulado) Um contador com 3 flip-flops conta de 0 até:',
      options: ['3', '5', '7', '15'],
      correct_answer: 2,
      explanation: 'Com 3 flip-flops o contador conta de 000₂ (0) a 111₂ (7), ou seja, módulo 8.',
    },
  ],
  'sd-microprocessadores:0': [
    {
      question: 'A arquitetura de von Neumann é caracterizada por:',
      options: ['Separar totalmente dados e instruções em memórias distintas', 'Usar uma única memória para dados e instruções', 'Não possuir clock', 'Usar apenas registradores'],
      correct_answer: 1,
      explanation: 'Na arquitetura de von Neumann, instruções e dados compartilham a mesma memória e barramento.',
    },
    {
      question: 'O ciclo de instrução básico de uma CPU inclui:',
      options: ['Buscar (fetch), decodificar e executar', 'Apenas executar', 'Compilar e linkar', 'Ler e gravar no disco'],
      correct_answer: 0,
      explanation: 'A CPU executa ciclicamente: busca a instrução na memória, decodifica e a executa.',
    },
    {
      question: 'A unidade responsável pelo controle das operações da CPU é a:',
      options: ['Memória RAM', 'Unidade de Controle (UC)', 'Placa de vídeo', 'Fonte de alimentação'],
      correct_answer: 1,
      explanation: 'A Unidade de Controle decodifica as instruções e coordena os sinais de controle de toda a CPU.',
    },
  ],
  'sd-microprocessadores:1': [
    {
      question: 'A principal diferença entre microprocessador e microcontrolador é:',
      options: ['Não há diferença', 'O microcontrolador integra CPU, memória e periféricos em um único chip', 'O microprocessador tem mais energia', 'O microcontrolador é mais rápido sempre'],
      correct_answer: 1,
      explanation: 'O microcontrolador (MCU) reúne CPU, memória (RAM/ROM) e periféricos em um chip, ideal para sistemas embarcados.',
    },
    {
      question: 'O barramento que transporta os dados entre a CPU e a memória é o:',
      options: ['Barramento de dados', 'Barramento de energia', 'Barramento de refrigeração', 'Barramento de vídeo'],
      correct_answer: 0,
      explanation: 'O barramento de dados transporta as informações entre CPU, memória e dispositivos.',
    },
    {
      question: 'Em sistemas embarcados, os microcontroladores são preferidos por:',
      options: ['Serem mais caros', 'Baixo custo e baixo consumo de energia', 'Terem mais núcleos', 'Não precisarem de clock'],
      correct_answer: 1,
      explanation: 'Microcontroladores são baratos e de baixo consumo, ideais para aplicações embarcadas.',
    },
  ],
  'sd-projeto-digital:0': [
    {
      question: 'O primeiro passo do projeto de um circuito digital é:',
      options: ['Soldar os componentes', 'Definir a especificação e a tabela-verdade do problema', 'Comprar o protoboard', 'Escrever o código'],
      correct_answer: 1,
      explanation: 'Projeta-se partindo do enunciado: definir entradas, saídas e a tabela-verdade do circuito.',
    },
    {
      question: 'A sequência correta do projeto combinacional é:',
      options: ['Tabela-verdade → expressão booleana → simplificação → circuito', 'Circuito → tabela-verdade → expressão', 'Expressão → tabela-verdade → circuito → especificação', 'Protoboard → expressão → tabela'],
      correct_answer: 0,
      explanation: 'A metodologia é: especificação → tabela-verdade → expressão booleana → simplificação (Karnaugh) → implementação.',
    },
    {
      question: 'Um voltímetro digital converte a tensão medida em:',
      options: ['Sinal sonoro', 'Valor numérico exibido em display (com conversor A/D)', 'Luz intermitente', 'Onda analógica'],
      correct_answer: 1,
      explanation: 'O voltímetro digital usa um conversor A/D e um display para exibir o valor da tensão.',
    },
  ],
  'sd-projeto-digital:1': [
    {
      question: 'O protoboard é utilizado para:',
      options: ['Soldar componentes permanentemente', 'Montar e testar circuitos de forma rápida, sem solda', 'Apenas armazenar componentes', 'Medir tensão'],
      correct_answer: 1,
      explanation: 'O protoboard permite montar protótipos sem solda, facilitando testes e alterações.',
    },
    {
      question: 'Um relógio digital é construído com base em:',
      options: ['Contadores e registradores sincronizados por clock', 'Apenas portas AND', 'Somadores', 'Memórias ROM'],
      correct_answer: 0,
      explanation: 'O relógio digital usa contadores (segundos, minutos, horas) e registradores acionados por um clock.',
    },
    {
      question: 'No projeto do relógio digital, o contador de segundos deve ser do tipo:',
      options: ['Módulo 10 seguido de módulo 6', 'Módulo 8', 'Módulo 16', 'Módulo 100'],
      correct_answer: 0,
      explanation: '60 segundos = contador de módulo 10 (unidades) + módulo 6 (dezenas), gerando o "vai 1" para os minutos.',
    },
  ],
  'al-vetores:0': [
    {
      question: 'Um vetor geométrico é caracterizado por:',
      options: ['Apenas tamanho', 'Apenas direção', 'Magnitude (tamanho) e direção', 'Apenas cor'],
      correct_answer: 2,
      explanation: 'Um vetor possui magnitude (módulo) e direção (incluindo o sentido).',
    },
    {
      question: 'A soma de dois vetores geometricamente pode ser feita pela:',
      options: ['Regra do paralelogramo', 'Regra do produto escalar', 'Regra da mão direita', 'Divisão das componentes'],
      correct_answer: 0,
      explanation: 'A soma vetorial é representada pela regra do paralelogramo ou do triângulo.',
    },
    {
      question: 'O produto escalar de dois vetores resulta em:',
      options: ['Um vetor', 'Um número (escalar)', 'Uma matriz', 'Um ângulo'],
      correct_answer: 1,
      explanation: 'O produto escalar (a·b) produz um escalar: |a||b|cos(θ).',
    },
  ],
  'al-vetores:1': [
    {
      question: 'Se o produto escalar de dois vetores é zero, então eles são:',
      options: ['Paralelos', 'Ortogonais (perpendiculares)', 'Iguais', 'Colineares'],
      correct_answer: 1,
      explanation: 'a·b = 0 implica cos(θ) = 0, ou seja, θ = 90°: vetores ortogonais.',
    },
    {
      question: 'O módulo do vetor v = (3, 4) é:',
      options: ['5', '7', '12', '25'],
      correct_answer: 0,
      explanation: '|v| = √(3² + 4²) = √25 = 5.',
    },
    {
      question: 'O produto vetorial de dois vetores em R³ resulta em:',
      options: ['Um escalar', 'Um vetor perpendicular ao plano dos dois', 'Um ângulo', 'Uma matriz 2×2'],
      correct_answer: 1,
      explanation: 'O produto vetorial a×b gera um vetor perpendicular a a e b (regra da mão direita).',
    },
  ],
  'al-sistemas-lineares:0': [
    {
      question: 'O objetivo do método de eliminação de Gauss é transformar o sistema em:',
      options: ['Forma escalonada (triangular)', 'Uma equação única', 'Forma quadrática', 'Um sistema sem solução'],
      correct_answer: 0,
      explanation: 'Gauss usa operações elementares para obter uma matriz escalonada, resolvendo por substituição de baixo para cima.',
    },
    {
      question: 'Quais são as operações elementares sobre as linhas?',
      options: ['Somar, multiplicar e dividir colunas', 'Trocar linhas, multiplicar linha por escalar, somar múltiplo de uma linha a outra', 'Permutar colunas apenas', 'Elevar linhas ao quadrado'],
      correct_answer: 1,
      explanation: 'As três operações elementares são: trocar linhas, multiplicar uma linha por constante não nula e somar múltiplo de uma linha a outra.',
    },
    {
      question: 'Um sistema linear é impossível (sem solução) quando:',
      options: ['Há menos equações que incógnitas', 'A eliminação gera uma linha 0 = k (k ≠ 0)', 'Há mais equações que incógnitas', 'Os coeficientes são inteiros'],
      correct_answer: 1,
      explanation: 'Uma linha do tipo 0 0 ... 0 | k com k ≠ 0 indica contradição e o sistema não tem solução.',
    },
  ],
  'al-sistemas-lineares:1': [
    {
      question: 'Para multiplicar as matrizes A (m×n) por B (p×q), é necessário que:',
      options: ['m = q', 'n = p', 'n = q', 'm = p'],
      correct_answer: 1,
      explanation: 'O número de colunas de A deve ser igual ao número de linhas de B (n = p).',
    },
    {
      question: 'A matriz identidade I tem a propriedade:',
      options: ['I·A = A (multiplicação não altera a matriz)', 'I·A = 0', 'I·A = A²', 'I·A inverte A'],
      correct_answer: 0,
      explanation: 'A identidade é o elemento neutro da multiplicação: I·A = A·I = A.',
    },
    {
      question: 'Uma matriz A possui inversa A⁻¹ se:',
      options: ['A·A⁻¹ = I (e A⁻¹·A = I)', 'det(A) = 0', 'A é simétrica', 'A tem apenas zeros'],
      correct_answer: 0,
      explanation: 'A⁻¹ existe quando det(A) ≠ 0 e satisfaz A·A⁻¹ = A⁻¹·A = I.',
    },
  ],
  'al-espacos-vetoriais:0': [
    {
      question: 'Um conjunto é um espaço vetorial se, entre outras condições, for fechado em relação à:',
      options: ['Multiplicação de vetores', 'Soma e multiplicação por escalar', 'Divisão de vetores', 'Radiciação'],
      correct_answer: 1,
      explanation: 'O fechamento exige que a soma de dois vetores e a multiplicação por escalar permaneçam no conjunto.',
    },
    {
      question: 'O conjunto R² (pares ordenados reais) com as operações usuais:',
      options: ['É um espaço vetorial', 'Não é um espaço vetorial', 'É um espaço apenas se for finito', 'É um corpo'],
      correct_answer: 0,
      explanation: 'R² com soma e multiplicação por escalar usuais satisfaz todos os axiomas de espaço vetorial.',
    },
    {
      question: 'Uma combinação linear de vetores é:',
      options: ['Uma soma de múltiplos escalares dos vetores', 'Um produto de vetores', 'A inversa de uma matriz', 'Uma divisão de vetores'],
      correct_answer: 0,
      explanation: 'v = a₁v₁ + a₂v₂ + ... + aₙvₙ, com escalares aᵢ, é uma combinação linear.',
    },
  ],
  'al-espacos-vetoriais:1': [
    {
      question: 'Uma base de um espaço vetorial é:',
      options: ['Qualquer conjunto de vetores', 'Um conjunto linearmente independente que gera o espaço', 'O maior vetor do espaço', 'Um conjunto com mais vetores que a dimensão'],
      correct_answer: 1,
      explanation: 'Base = conjunto LI (independente) que gera todo o espaço: todo vetor é combinação única dos vetores da base.',
    },
    {
      question: 'A dimensão do espaço R² é:',
      options: ['1', '2', '3', '4'],
      correct_answer: 1,
      explanation: 'A dimensão de R² é 2 (por exemplo, a base canônica {(1,0), (0,1)} tem 2 vetores).',
    },
    {
      question: 'Um conjunto de vetores é linearmente dependente (LD) quando:',
      options: ['Todos são perpendiculares', 'Pelo menos um vetor é combinação linear dos demais', 'Os vetores têm o mesmo módulo', 'A soma dos vetores é zero'],
      correct_answer: 1,
      explanation: 'LD significa que existe combinação linear não trivial resultando em zero, ou seja, um vetor depende dos outros.',
    },
  ],
  'al-transformacoes:0': [
    {
      question: 'Uma transformação T é linear se, para quaisquer u, v e escalar c:',
      options: ['T(u+v) = T(u) + T(v) e T(c·u) = c·T(u)', 'T(u·v) = T(u)·T(v)', 'T(1) = 1 apenas', 'T(u) = u²'],
      correct_answer: 0,
      explanation: 'Linearidade exige preservar a soma e a multiplicação por escalar.',
    },
    {
      question: 'Para toda transformação linear T, o vetor nulo é levado em:',
      options: ['Qualquer vetor', 'O vetor nulo (T(0) = 0)', 'O vetor unitário', 'A matriz identidade'],
      correct_answer: 1,
      explanation: 'T(0) = T(0·v) = 0·T(v) = 0, portanto T leva o zero em zero.',
    },
    {
      question: 'T(v) = 2v (dilatação) é uma transformação:',
      options: ['Não linear', 'Linear', 'Quadratura', 'Nenhuma das opções'],
      correct_answer: 1,
      explanation: 'A dilatação preserva soma e escalar: T(u+v) = 2(u+v) = 2u + 2v = T(u) + T(v).',
    },
  ],
  'al-transformacoes:1': [
    {
      question: 'A matriz de uma transformação linear T: Rⁿ → Rᵐ tem dimensão:',
      options: ['n×m', 'm×n', 'n×n', 'm×m'],
      correct_answer: 1,
      explanation: 'A matriz que representa T: Rⁿ → Rᵐ é m×n: cada coluna é a imagem de um vetor da base.',
    },
    {
      question: 'O núcleo (kernel) de uma transformação linear é:',
      options: ['O conjunto dos vetores que T leva ao vetor nulo', 'O conjunto das imagens de T', 'A base do domínio', 'O complemento da imagem'],
      correct_answer: 0,
      explanation: 'Núcleo = {v : T(v) = 0}. É sempre um subespaço do domínio.',
    },
    {
      question: 'A imagem de uma transformação linear é:',
      options: ['O conjunto dos vetores v tais que T(v) = 0', 'O conjunto {T(v) : v ∈ domínio}', 'O núcleo de T⁻¹', 'A matriz de T'],
      correct_answer: 1,
      explanation: 'A imagem é o conjunto de todos os valores que T assume, um subespaço do contradomínio.',
    },
  ],
  'al-determinantes:0': [
    {
      question: 'A regra de Sarrus pode ser usada para calcular determinantes de matrizes:',
      options: ['De qualquer ordem', 'De ordem 3 (3×3) ou 2', 'Somente de ordem 4', 'Somente triangulares'],
      correct_answer: 1,
      explanation: 'Sarrus é aplicável apenas a matrizes 2×2 e 3×3.',
    },
    {
      question: 'O determinante da matriz 2×2 [[a, b], [c, d]] é:',
      options: ['ac - bd', 'ad - bc', 'ab - cd', 'a + d'],
      correct_answer: 1,
      explanation: 'det([[a,b],[c,d]]) = a·d - b·c.',
    },
    {
      question: 'A expansão por cofatores (Laplace) é útil para determinantes de:',
      options: ['Ordem 1 apenas', 'Ordem 2 apenas', 'Ordem 3 ou maior', 'Nenhuma matriz'],
      correct_answer: 2,
      explanation: 'Laplace expande o determinante ao longo de uma linha ou coluna e funciona para qualquer ordem.',
    },
  ],
  'al-determinantes:1': [
    {
      question: 'Se trocarmos duas linhas de uma matriz, o determinante:',
      options: ['Não muda', 'Muda de sinal', 'Vira zero', 'É duplicado'],
      correct_answer: 1,
      explanation: 'A troca de duas linhas (ou colunas) altera o sinal do determinante.',
    },
    {
      question: 'Se uma matriz possui duas linhas iguais, seu determinante é:',
      options: ['1', '-1', '0', 'Igual ao quadrado'],
      correct_answer: 2,
      explanation: 'Linhas proporcionais (incluindo iguais) tornam o determinante nulo.',
    },
    {
      question: 'Para matrizes A e B de mesma ordem, det(A·B) =',
      options: ['det(A) + det(B)', 'det(A)·det(B)', 'det(A) - det(B)', 'det(A)/det(B)'],
      correct_answer: 1,
      explanation: 'O determinante do produto é o produto dos determinantes: det(AB) = det(A)det(B).',
    },
  ],
  'al-autovalores:0': [
    {
      question: 'Um número λ é autovalor de A se existe v ≠ 0 tal que:',
      options: ['A·v = λ·v', 'A·v = 0', 'A = λ·I', 'A·v = v'],
      correct_answer: 0,
      explanation: 'Autovalor satisfaz Av = λv para algum vetor não nulo v (autovetor).',
    },
    {
      question: 'Os autovalores de A são as raízes de:',
      options: ['det(A) = 0', 'det(A - λI) = 0 (polinômio característico)', 'tr(A) = 0', 'A² = 0'],
      correct_answer: 1,
      explanation: 'O polinômio característico det(A - λI) tem como raízes os autovalores de A.',
    },
    {
      question: 'Se λ = 0 é autovalor de A, então A é:',
      options: ['Inversível', 'Singular (det(A) = 0)', 'Sempre identidade', 'Ortogonal'],
      correct_answer: 1,
      explanation: 'det(A - 0·I) = det(A) = 0, logo A não possui inversa (é singular).',
    },
  ],
  'al-autovalores:1': [
    {
      question: 'Uma matriz A é diagonalizável se possui:',
      options: ['Pelo menos um autovalor', 'n autovetores linearmente independentes', 'Autovalores todos iguais', 'det(A) = 0'],
      correct_answer: 1,
      explanation: 'A é diagonalizável se existe base de autovetores: n autovetores LI.',
    },
    {
      question: 'Na diagonalização P⁻¹AP = D, a matriz D contém:',
      options: ['Os autovetores', 'Os autovalores na diagonal', 'Os cofatores', 'A inversa de P'],
      correct_answer: 1,
      explanation: 'D é diagonal com os autovalores de A na diagonal principal; P tem os autovetores como colunas.',
    },
    {
      question: 'Uma matriz 2×2 com dois autovalores distintos:',
      options: ['Nunca é diagonalizável', 'É sempre diagonalizável', 'É singular', 'É a identidade'],
      correct_answer: 1,
      explanation: 'Autovalores distintos garantem autovetores independentes, logo a matriz é diagonalizável.',
    },
  ],
};
