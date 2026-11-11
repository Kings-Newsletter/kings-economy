export type EconomicSectionId =
  | 'brasil-internacional'
  | 'mercado-investimentos'
  | 'inflacao-custo-vida'
  | 'juros-selic'
  | 'dolar-cambio'
  | 'pib-atividade'
  | 'emprego-renda'
  | 'contas-publicas'
  | 'impostos-fiscal';

export interface EditorialSection {
  id: EconomicSectionId;
  title: string;
  shortTitle: string;
  subtitle: string;
  keyQuestion: string;
  whatIsMeasured: string;
  dailyImpact: string;
  officialSource: string;
  relatedIndicators: string[];
  accentColor: string;
}

export interface IndicatorArchitectureItem {
  id: string;
  code: string;
  name: string;
  fullName: string;
  institution: string;
  frequency: string;
  unit: string;
  sectionId: EconomicSectionId;
  whatItMeasures: string;
  whyItMatters: string;
  howToReadUp: string;
  howToReadDown: string;
  methodologyNote: string;
}

export interface DidacticGuide {
  id: string;
  sectionId: EconomicSectionId;
  title: string;
  readingTime: string;
  level: 'Iniciante' | 'Intermediário' | 'Essencial';
  summary: string;
  mechanismSteps: string[];
  practicalTakeaway: string;
}

export interface GlossaryEntry {
  term: string;
  category: string;
  plainDefinition: string;
  practicalExample: string;
  relatedTerms: string[];
}
