import React from 'react';
import { Check, Circle } from 'lucide-react';

const StepNavigator = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="w-full bg-gray-900 rounded-xl p-4 mb-6">
      <h3 className="text-white font-semibold mb-4 text-sm">Todos os Passos:</h3>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isPast = index < currentStep;
          
          return (
            <button
              key={index}
              onClick={() => onStepClick(index)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left
                ${isActive 
                  ? 'bg-purple-600 text-white border-2 border-purple-400 shadow-lg scale-[1.02]' 
                  : isPast
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold
                ${isActive 
                  ? 'bg-purple-400 text-purple-900' 
                  : isPast
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-600 text-gray-300'
                }`}
              >
                {isPast ? <Check size={16} /> : index + 1}
              </div>
              <span className="font-medium text-sm">{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StepNavigator;
