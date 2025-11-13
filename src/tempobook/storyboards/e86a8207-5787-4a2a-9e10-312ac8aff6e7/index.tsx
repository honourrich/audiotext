import React, { useState } from "react";
import ErrorHandler, { errorMessages } from "@/components/ErrorHandler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function ErrorHandlingDemo() {
  const { toast } = useToast();
  const [currentError, setCurrentError] = useState<any>(null);

  const showUploadError = () => {
    setCurrentError(errorMessages.fileTooLarge());
  };

  const showFormatError = () => {
    setCurrentError(errorMessages.invalidFormat());
  };

  const showNetworkError = () => {
    setCurrentError(errorMessages.networkError());
  };

  const showAPIError = () => {
    setCurrentError(errorMessages.gpt4Error());
  };

  const showRateLimitError = () => {
    setCurrentError(errorMessages.rateLimitError());
  };

  const showWhisperError = () => {
    setCurrentError(errorMessages.whisperFailure());
  };

  const handleRetry = () => {
    toast({
      title: "Retrying...",
      description: "Attempting to retry the failed operation",
    });
    setCurrentError(null);
  };

  const handleContactSupport = () => {
    toast({
      title: "Support contacted",
      description: "We'll get back to you within 24 hours",
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Error Handling System Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={showUploadError}>
                File Too Large
              </Button>
              <Button variant="outline" onClick={showFormatError}>
                Invalid Format
              </Button>
              <Button variant="outline" onClick={showNetworkError}>
                Network Error
              </Button>
              <Button variant="outline" onClick={showAPIError}>
                API Error
              </Button>
              <Button variant="outline" onClick={showRateLimitError}>
                Rate Limit
              </Button>
              <Button variant="outline" onClick={showWhisperError}>
                Whisper Error
              </Button>
            </div>
          </CardContent>
        </Card>

        {currentError && (
          <ErrorHandler
            error={currentError}
            onRetry={currentError.canRetry ? handleRetry : undefined}
            onDismiss={() => setCurrentError(null)}
            onContactSupport={handleContactSupport}
          />
        )}

        {!currentError && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                Click any button above to see different error handling scenarios
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}