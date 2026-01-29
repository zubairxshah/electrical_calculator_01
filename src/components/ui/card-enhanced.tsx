// Enhanced calculator card component with improved visual design
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Zap, Settings, Battery, Sun, Cable, CircuitBoard, Lightbulb, AlertCircle, Loader } from 'lucide-react';
import { CalculatorCard } from '../../types/ui';
import { ANIMATION_PRESETS } from '../../lib/animations';

interface EnhancedCalculatorCardProps {
  card?: CalculatorCard;
  isLoading?: boolean;
  error?: string;
}

export const EnhancedCalculatorCard: React.FC<EnhancedCalculatorCardProps> = ({ card, isLoading = false, error }) => {
  // Show loading state if loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-full flex flex-col">
        <div className="p-5 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader className="h-8 w-8 animate-spin text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if error exists
  if (error) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden shadow-sm h-full flex flex-col">
        <div className="p-5 flex-1">
          <div className="flex items-center mb-3">
            <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
            <h3 className="font-semibold text-red-800">Error Loading Card</h3>
          </div>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <div className="text-xs text-red-500 mt-auto">
            Please try again or contact support
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no card data
  if (!card) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-sm h-full flex flex-col opacity-70">
        <div className="p-5 flex-1 flex items-center justify-center">
          <div className="text-center">
            <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Get the appropriate icon based on the card's icon name
  const getIcon = () => {
    switch (card.icon.toLowerCase()) {
      case 'star':
        return <Star className="h-6 w-6" />;
      case 'zap':
        return <Zap className="h-6 w-6" />;
      case 'settings':
        return <Settings className="h-6 w-6" />;
      case 'battery':
        return <Battery className="h-6 w-6" />;
      case 'sun':
        return <Sun className="h-6 w-6" />;
      case 'cable':
        return <Cable className="h-6 w-6" />;
      case 'circuitboard':
      case 'circuit_board':
        return <CircuitBoard className="h-6 w-6" />;
      case 'lightbulb':
      case 'light_bulb':
        return <Lightbulb className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  // Get priority badge styling
  const getPriorityClass = () => {
    switch (card.priority) {
      case 'P1':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'P2':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'P3':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status badge styling
  const getStatusClass = () => {
    switch (card.status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'beta':
        return 'bg-purple-100 text-purple-800';
      case 'deprecated':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link href={card.href}>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
          <div className="p-5 flex-1">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 rounded-lg bg-gray-50 text-gray-700">
                {getIcon()}
              </div>
              {card.isNew && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  New
                </span>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{card.title}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{card.description}</p>

            <div className="flex flex-wrap gap-2">
              {card.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityClass()}`}>
              {card.priority}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass()}`}>
              {card.status}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};