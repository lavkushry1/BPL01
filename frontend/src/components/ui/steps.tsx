import React from 'react';
import { cn } from '@/lib/utils';

interface StepsProps {
  children: React.ReactNode;
  currentStep: number;
  className?: string;
}

interface StepProps {
  children: React.ReactNode;
}

interface StepIndicatorProps {
  children?: React.ReactNode;
}

export const Steps = ({ children, currentStep, className }: StepsProps) => {
  const steps = React.Children.toArray(children);
  
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {steps.map((step, index) => {
        const isActive = index + 1 === currentStep;
        const isCompleted = index + 1 < currentStep;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <div className={cn(
                "flex-1 h-1 mx-2",
                isCompleted ? "bg-primary" : "bg-muted"
              )} />
            )}
            
            <div className={cn(
              "relative flex items-center",
              isActive && "text-primary"
            )}>
              {React.cloneElement(step as React.ReactElement, {
                isActive,
                isCompleted,
                stepNumber: index + 1,
              })}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Step = ({ children, ...props }: StepProps & { 
  isActive?: boolean; 
  isCompleted?: boolean;
  stepNumber?: number;
}) => {
  const { isActive, isCompleted } = props;
  
  return (
    <div 
      className={cn(
        "flex items-center",
        isActive ? "text-primary" : isCompleted ? "text-primary/80" : "text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
};

export const StepIndicator = ({ children }: StepIndicatorProps) => {
  return (
    <div className={cn(
      "relative flex h-8 w-8 items-center justify-center rounded-full border bg-background",
      "border-primary text-primary"
    )}>
      {children}
    </div>
  );
}; 