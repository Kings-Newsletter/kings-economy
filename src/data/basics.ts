/**
 * Trilha "Economia do zero": lições curtas, em ordem, para quem nunca estudou o assunto.
 * Cada lição tem uma ideia central, um exemplo do dia a dia e uma pergunta de verificação.
 * Nenhum número aqui representa dado oficial; os valores são exemplos de conta.
 */
export interface BasicLesson {
  id: string;
  title: string;
  inOneSentence: string;
  explanation: string[];
  everydayExample: string;
  check: {
    question: string;
    options: string[];
    correctIndex: number;
    whyCorrect: string;
  };
}

export const BASIC_LESSONS: BasicLesson[] = [
  {
    id: 'o-que-e-economia',
    title: 'O que é economia',
    inOneSentence:
      'Economia é o jeito como pessoas, empresas e governo decidem usar um dinheiro que nunca dá para tudo.',
    explanation: [
      'Ninguém tem dinheiro, tempo ou material infinitos. Por isso toda escolha tem um custo: o que você compra com o salário deixa de estar disponível para outra coisa.',
      'A economia estuda essas escolhas, da conta do mercado de uma família até o orçamento do país inteiro.',
    ],
    everydayExample:
      'Se o aluguel sobe e o salário continua igual, sobra menos para a feira, o transporte e o lazer. Essa troca é economia acontecendo dentro de casa.',
    check: {
      question: 'O salário não mudou, mas o aluguel subiu. O que acontece com o resto do orçamento?',
      options: ['Sobra menos para o resto', 'Sobra mais para o resto', 'Nada muda'],
      correctIndex: 0,
      whyCorrect: 'O dinheiro total é o mesmo. Se uma conta cresce, as outras precisam caber no que sobrou.',
    },
  },
  {
    id: 'inflacao',
    title: 'Inflação: quando tudo fica mais caro',
    inOneSentence:
      'Inflação é a alta geral dos preços, que faz o mesmo dinheiro comprar menos coisas com o tempo.',
    explanation: [
      'Um preço subir sozinho não é inflação. Inflação é quando a maioria dos preços sobe junta, mês após mês.',
      'No Brasil, a inflação oficial é medida pelo IPCA, calculado pelo IBGE com base nos gastos das famílias.',
    ],
    everydayExample:
      'Com inflação de 5% em um ano, o carrinho de compras que custava R$ 100 passa a custar cerca de R$ 105. A nota de R$ 100 continua igual, mas compra menos.',
    check: {
      question: 'A inflação do ano foi de 5%. Um carrinho que custava R$ 100 passa a custar cerca de:',
      options: ['R$ 95', 'R$ 105', 'R$ 150'],
      correctIndex: 1,
      whyCorrect: '5% de R$ 100 são R$ 5. Somando ao preço antigo, o carrinho vai para cerca de R$ 105.',
    },
  },
  {
    id: 'juros',
    title: 'Juros: o preço do dinheiro no tempo',
    inOneSentence:
      'Juro é o valor que se paga para usar hoje um dinheiro que é de outra pessoa.',
    explanation: [
      'Quem pega emprestado paga juros. Quem empresta, ou deixa o dinheiro aplicado, recebe juros.',
      'Quanto maior a taxa e mais longo o prazo, mais juros se acumulam, porque o juro de um mês passa a render juro no mês seguinte.',
    ],
    everydayExample:
      'Ao parcelar uma geladeira com juros, você paga no total mais do que o preço à vista. A diferença são os juros.',
    check: {
      question: 'Numa compra parcelada com juros, quem paga os juros?',
      options: ['A loja', 'Quem comprou parcelado', 'O Banco Central'],
      correctIndex: 1,
      whyCorrect: 'Quem usa o dinheiro antes de ter o valor todo paga pelo tempo de uso. Por isso o total parcelado fica maior.',
    },
  },
  {
    id: 'selic',
    title: 'Selic: a taxa que serve de base para as outras',
    inOneSentence:
      'A Selic é a taxa básica de juros do Brasil, definida pelo Banco Central para controlar a inflação.',
    explanation: [
      'A cada 45 dias, o Copom, comitê do Banco Central, decide se a Selic sobe, cai ou fica igual.',
      'Os bancos usam a Selic como base e somam outros custos. Por isso o juro do cartão é muito maior que a Selic, mas costuma subir e descer junto com ela.',
    ],
    everydayExample:
      'Quando a Selic sobe, financiamentos ficam mais caros, as pessoas compram menos a prazo e os preços passam a subir mais devagar.',
    check: {
      question: 'Quando o Banco Central sobe a Selic, o crédito tende a ficar:',
      options: ['Mais barato', 'Mais caro', 'Igual'],
      correctIndex: 1,
      whyCorrect: 'A Selic é a base dos juros dos bancos. Se a base sobe, o empréstimo ao consumidor tende a encarecer.',
    },
  },
  {
    id: 'cambio',
    title: 'Dólar e câmbio',
    inOneSentence:
      'Câmbio é o preço de uma moeda em outra, como quantos reais são necessários para comprar um dólar.',
    explanation: [
      'O dólar sobe quando mais gente quer comprar dólares do que vender. Isso muda todos os dias.',
      'Muitos produtos e insumos são cotados em dólar, como trigo, petróleo e peças eletrônicas. Quando o dólar sobe, eles chegam mais caros ao Brasil.',
    ],
    everydayExample:
      'Um celular importado, o combustível e até o pão (feito com trigo comprado lá fora) tendem a encarecer quando o dólar sobe.',
    check: {
      question: 'Se o dólar sobe em relação ao real, um celular importado tende a ficar:',
      options: ['Mais caro', 'Mais barato', 'Igual'],
      correctIndex: 0,
      whyCorrect: 'A loja precisa de mais reais para pagar o mesmo produto em dólar e repassa esse custo.',
    },
  },
  {
    id: 'pib',
    title: 'PIB: o tamanho da economia',
    inOneSentence:
      'PIB é a soma de tudo o que o país produz em bens e serviços num período.',
    explanation: [
      'Entram no PIB a colheita do campo, os carros da fábrica, o corte de cabelo e a consulta médica.',
      'Quando o PIB cresce, em geral há mais produção, mais vagas de trabalho e mais renda circulando. Quando encolhe, acontece o contrário.',
    ],
    everydayExample:
      'Num ano de PIB fraco, fica mais difícil achar emprego e as lojas vendem menos.',
    check: {
      question: 'PIB crescendo costuma significar:',
      options: ['Menos empregos', 'Mais produção e mais vagas', 'Preços congelados'],
      correctIndex: 1,
      whyCorrect: 'Para produzir mais, as empresas precisam de mais gente trabalhando.',
    },
  },
  {
    id: 'governo-impostos',
    title: 'Governo, impostos e dívida',
    inOneSentence:
      'O governo arrecada impostos para pagar serviços públicos e, quando gasta mais do que arrecada, se endivida.',
    explanation: [
      'Parte dos impostos é cobrada sobre o salário e a renda. Outra parte vem embutida no preço de quase tudo o que você compra.',
      'Quando falta dinheiro, o Tesouro Nacional pega emprestado vendendo títulos. Uma dívida grande pode pressionar os juros de todo o país.',
    ],
    everydayExample:
      'No preço de um pacote de arroz já estão incluídos impostos sobre o consumo, mesmo que eles não apareçam separados na etiqueta.',
    check: {
      question: 'Onde você paga impostos sobre o consumo?',
      options: ['Só na declaração do Imposto de Renda', 'Embutidos no preço do que compra', 'Em lugar nenhum'],
      correctIndex: 1,
      whyCorrect: 'Tributos como ICMS e PIS/Cofins fazem parte do preço final de produtos e serviços.',
    },
  },
];
