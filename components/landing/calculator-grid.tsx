'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalculatorCard } from '@/types/ui';
import {
  Battery, Zap, Cable, Sun, Settings,
  Shield, Lightbulb, CircuitBoard, Scale, Calculator
} from 'lucide-react';

interface CalculatorGridProps {
  calculatorCards: CalculatorCard[];
}

const iconMap = {
  battery: Battery,
  zap: Zap,
  cable: Cable,
  sun: Sun,
  settings: Settings,
  shield: Shield,
  lightbulb: Lightbulb,
  circuitboard: CircuitBoard,
  scale: Scale,
  calculator: Calculator,
};

export function CalculatorGrid({ calculatorCards }: CalculatorGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {calculatorCards.map((card) => {
        const IconComponent = iconMap[card.icon as keyof typeof iconMap] || Zap;

        return (
          <Link href={card.href} key={card.id}>
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {card.title}
                  </CardTitle>
                  {card.isNew && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {card.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {card.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="text-sm">
                  {card.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 pt-0">
                {card.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}