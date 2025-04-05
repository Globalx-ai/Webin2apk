import { cn } from "@/lib/utils";

export type Step = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

interface StepperProps {
  steps: Step[];
  currentStep: string;
  className?: string;
}

const Stepper = ({ steps, currentStep, className }: StepperProps) => {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const isStepCompleted = (step: Step) => {
    const currentStepIndex = getCurrentStepIndex();
    const stepIndex = steps.findIndex(s => s.id === step.id);
    return stepIndex < currentStepIndex;
  };

  const isStepActive = (step: Step) => {
    return step.id === currentStep;
  };

  return (
    <div className={cn("mb-8 bg-white rounded-lg p-6 shadow-sm", className)}>
      <h2 className="text-2xl font-semibold mb-6">Create a New Android App</h2>
      <div className="flex flex-col md:flex-row md:items-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col md:flex-row items-center">
            <div className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isStepActive(step) && "bg-blue-600 text-white",
                isStepCompleted(step) && "bg-green-500 text-white",
                !isStepActive(step) && !isStepCompleted(step) && "bg-gray-200 text-gray-600"
              )}>
                <span className="material-icons">{step.icon}</span>
              </div>
              <div className="ml-3">
                <p className={cn(
                  "font-medium",
                  isStepActive(step) ? "text-gray-900" : "text-gray-600"
                )}>
                  {step.title}
                </p>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <>
                <div className="h-12 border-l border-gray-300 mx-5 hidden md:block"></div>
                <div className="my-3 md:hidden"></div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;
