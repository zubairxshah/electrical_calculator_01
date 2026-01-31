export interface CalculatorCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  priority: 'P1' | 'P2' | 'P3';
  status: 'active' | 'beta' | 'deprecated';
  category: string;
  isNew: boolean;
  tags: string[];
}