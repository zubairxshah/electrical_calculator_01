// Responsive calculator grid component for enhanced landing page
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CalculatorCard } from '../../types/ui';
import { RESPONSIVE_CONFIG } from '../../config/responsive';
import { ANIMATION_PRESETS } from '../../lib/animations';
import { EnhancedCalculatorCard } from '../ui/card-enhanced';

interface CalculatorGridProps {
  calculatorCards?: CalculatorCard[];
  isLoading?: boolean;
  error?: string;
}

export const CalculatorGrid: React.FC<CalculatorGridProps> = ({
  calculatorCards = [],
  isLoading = false,
  error
}) => {
  // Determine number of columns based on screen size
  const getColumnCount = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200; // default to 1200 for SSR

    if (width >= RESPONSIVE_CONFIG.xl) return RESPONSIVE_CONFIG.cardColumns.xl;
    if (width >= RESPONSIVE_CONFIG.lg) return RESPONSIVE_CONFIG.cardColumns.lg;
    if (width >= RESPONSIVE_CONFIG.md) return RESPONSIVE_CONFIG.cardColumns.md;
    return RESPONSIVE_CONFIG.cardColumns.sm;
  };

  const [columnCount, setColumnCount] = React.useState(getColumnCount());

  React.useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading state if loading
  if (isLoading) {
    const loadingCards = Array.from({ length: 6 }).map((_, index) => (
      <motion.div
        key={`loading-${index}`}
        variants={ANIMATION_PRESETS.slideUp}
        transition={{ duration: 0.3 }}
      >
        <EnhancedCalculatorCard isLoading={true} />
      </motion.div>
    ));

    return (
      <motion.div
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        }}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 1 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {loadingCards}
      </motion.div>
    );
  }

  // Show error state if error exists
  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Calculators</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          className="text-sm text-red-700 underline hover:no-underline"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show empty state if no calculator cards
  if (!calculatorCards || calculatorCards.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-800 mb-2">No Calculators Available</h3>
        <p className="text-gray-600">Please check back later for new calculator tools</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
      }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {calculatorCards.map((card, index) => (
        <motion.div
          key={card.id}
          variants={ANIMATION_PRESETS.slideUp}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <EnhancedCalculatorCard card={card} />
        </motion.div>
      ))}
    </motion.div>
  );
};