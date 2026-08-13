"use client";

import { motion } from "motion/react";
import { CheckCircle } from "lucide-react";

interface Props {
  currentStep: 'status' | 'compulsory' | 'elective' | 'review' | 'success';
}

export function RegistrationStepper({ currentStep }: Props) {
  const steps = [
    { id: 'status', label: 'Dashboard' },
    { id: 'compulsory', label: 'Core Courses' },
    { id: 'elective', label: 'Electives' },
    { id: 'review', label: 'Review' }
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  // Hidden in success state
  if (currentStep === 'success') return null;

  return (
    <div className="w-full mb-8 relative">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -z-10 -translate-y-1/2"></div>
      
      <div className="flex justify-between max-w-3xl mx-auto px-4 sm:px-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-2 relative">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.2 : 1,
                  backgroundColor: isCompleted || isCurrent ? "rgb(59 130 246)" : "rgb(30 41 59)",
                  borderColor: isCurrent ? "rgb(96 165 250)" : "transparent",
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-colors duration-300 ${
                  isCurrent ? "shadow-glow-blue" : ""
                }`}
              >
                {isCompleted ? (
                  <CheckCircle size={16} className="text-white" />
                ) : (
                  <span className="text-xs font-semibold text-white">{index + 1}</span>
                )}
              </motion.div>
              
              <span className={`text-xs font-medium absolute -bottom-6 w-24 text-center ${
                isCurrent ? "text-blue-400" : isCompleted ? "text-slate-300" : "text-slate-500"
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="max-w-3xl mx-auto h-0.5 bg-blue-500 absolute top-1/2 left-4 sm:left-0 -translate-y-1/2 -z-10 transition-all duration-500" 
        style={{ width: `calc(${Math.max(0, currentIndex / (steps.length - 1)) * 100}% - 2rem)` }}>
      </div>
    </div>
  );
}
