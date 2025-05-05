import React from 'react';
import { Button } from '@/components/ui/button';
import { SeatSection } from '../../types';

/**
 * Section Tabs Component
 * Allows users to navigate between different seating sections
 */
interface SectionTabsProps {
  sections: SeatSection[];
  activeSection: string | null;
  onSectionChange: (sectionId: string) => void;
}

const SectionTabs: React.FC<SectionTabsProps> = ({ 
  sections, 
  activeSection, 
  onSectionChange 
}) => {
  return (
    <div className="flex overflow-x-auto pb-2 mb-4 gap-2">
      {sections.map((section) => (
        <Button
          key={section.id}
          variant={activeSection === section.id ? "default" : "outline"}
          onClick={() => onSectionChange(section.id)}
          className="whitespace-nowrap"
        >
          {section.name}
        </Button>
      ))}
    </div>
  );
};

export default SectionTabs; 