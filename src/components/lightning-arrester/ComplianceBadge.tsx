import React from 'react';

interface ComplianceBadgeProps {
  standard: 'IEC' | 'NEC' | string;
  compliant: boolean;
}

const ComplianceBadge: React.FC<ComplianceBadgeProps> = ({ standard, compliant }) => {
  const badgeClass = compliant
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';

  const statusText = compliant ? 'Compliant' : 'Non-Compliant';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
      {standard} {statusText}
    </span>
  );
};

export default ComplianceBadge;