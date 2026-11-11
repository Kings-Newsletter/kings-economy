import type { LucideIcon } from 'lucide-react';
import {
  BadgeDollarSign,
  Banknote,
  Briefcase,
  Building2,
  CandlestickChart,
  Factory,
  Globe2,
  Landmark,
  Receipt,
  ShoppingCart,
  Users,
  Scale,
} from 'lucide-react';
import { EconomicSectionId } from '../types/economy';

/** Ícone de cada editoria, usado no índice de temas e nos selos dos indicadores. */
export const SECTION_ICONS: Record<EconomicSectionId, LucideIcon> = {
  'brasil-internacional': Globe2,
  'mercado-investimentos': CandlestickChart,
  'inflacao-custo-vida': ShoppingCart,
  'juros-selic': Landmark,
  'dolar-cambio': BadgeDollarSign,
  'pib-atividade': Factory,
  'emprego-renda': Briefcase,
  'contas-publicas': Scale,
  'impostos-fiscal': Receipt,
};

/** Ícone por indicador do painel. */
export const INDICATOR_ICONS: Record<string, LucideIcon> = {
  selic: Landmark,
  ipca: ShoppingCart,
  ptax: Banknote,
  pib: Factory,
  pnad: Users,
  primario: Building2,
};
