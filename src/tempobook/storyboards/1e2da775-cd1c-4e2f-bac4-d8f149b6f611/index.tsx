import ErrorHandler, { errorMessages } from "@/components/ErrorHandler";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorHandlingDemo() {
  const [currentError, setCurrentError] = useState(
    errorMessages.fileTooLarge(),
  );

  const errorExamples = [
    { label: "File Too Large", error: errorMessages.fileTooLarge() },
    { label: "Invalid Format", error: errorMessages.invalidFormat() },
    { label: "Network Error", error: errorMessages.networkError() },
    { label: "Rate Limit", error: errorMessages.rateLimitError() },
    { label: "Whisper Failure", error: errorMessages.whisperFailure() },
    { label: "GPT-4 Error", error: errorMessages.gpt4Error() },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 bg-white border-b">
        <h2 className="text-lg font-semibold mb-3">Error Handling Examples</h2>
        <div className="flex flex-wrap gap-2">
          {errorExamples.map((example) => (
            <Button
              key={example.label}
              variant={
                currentError.type === example.error.type ? "default" : "outline"
              }
              size="sm"
              onClick={() => setCurrentError(example.error)}
            >
              {example.label}
            </Button>
          ))}
        </div>
      </div>

      <ErrorHandler
        error={currentError}
        onRetry={() => console.log("Retry clicked")}
        onResume={() => console.log("Resume clicked")}
        onContactSupport={() => console.log("Contact support clicked")}
        onDismiss={() => console.log("Dismiss clicked")}
      />
    </div>
  );
}
