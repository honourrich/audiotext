import React, { useState, useEffect } from "react";
import ProcessingStatus, {
  createDefaultProcessingStages,
  ProcessingStage,
} from "@/components/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProcessingStatusDemo() {
  const [stages, setStages] = useState<ProcessingStage[]>(
    createDefaultProcessingStages(),
  );
  const [currentStage, setCurrentStage] = useState<string>("");
  const [overallProgress, setOverallProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("4-6 minutes");

  const simulateProcessing = async () => {
    setIsProcessing(true);
    setStages(createDefaultProcessingStages());
    setOverallProgress(0);

    const stageOrder = [
      "upload",
      "transcribe",
      "summary",
      "chapters",
      "keywords",
      "finalize",
    ];
    const stageWeights = {
      upload: 20,
      transcribe: 40,
      summary: 15,
      chapters: 10,
      keywords: 10,
      finalize: 5,
    };
    const timeEstimates = [
      "3-4 minutes",
      "2-3 minutes",
      "1-2 minutes",
      "30-45 seconds",
      "15-30 seconds",
      "5-10 seconds",
    ];

    for (let i = 0; i < stageOrder.length; i++) {
      const stageId = stageOrder[i];
      setCurrentStage(stageId);
      setEstimatedTime(timeEstimates[i]);

      // Update stage to processing
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === stageId
            ? { ...stage, status: "processing" as const, progress: 0 }
            : stage,
        ),
      );

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setStages((prev) =>
          prev.map((stage) =>
            stage.id === stageId ? { ...stage, progress } : stage,
          ),
        );

        // Calculate overall progress
        const completedWeight = stageOrder
          .slice(0, i)
          .reduce(
            (sum, id) => sum + stageWeights[id as keyof typeof stageWeights],
            0,
          );
        const currentWeight =
          stageWeights[stageId as keyof typeof stageWeights];
        const totalProgress =
          completedWeight + (currentWeight * progress) / 100;
        setOverallProgress(Math.round(totalProgress));

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Mark stage as completed
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === stageId
            ? { ...stage, status: "completed" as const, progress: 100 }
            : stage,
        ),
      );
    }

    setCurrentStage("");
    setOverallProgress(100);
    setEstimatedTime("");
    setIsProcessing(false);
  };

  const simulateError = () => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === "summary"
          ? { ...stage, status: "error" as const, progress: 0 }
          : stage,
      ),
    );
    setCurrentStage("");
    setIsProcessing(false);
  };

  const reset = () => {
    setStages(createDefaultProcessingStages());
    setCurrentStage("");
    setOverallProgress(0);
    setIsProcessing(false);
    setEstimatedTime("4-6 minutes");
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Processing Status System Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={simulateProcessing} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Start Processing"}
              </Button>
              <Button
                variant="destructive"
                onClick={simulateError}
                disabled={isProcessing}
              >
                Simulate Error
              </Button>
              <Button variant="outline" onClick={reset}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <ProcessingStatus
          stages={stages}
          currentStage={currentStage}
          overallProgress={overallProgress}
          canCancel={isProcessing}
          onCancel={() => {
            setIsProcessing(false);
            setCurrentStage("");
          }}
          estimatedTimeRemaining={estimatedTime}
        />
      </div>
    </div>
  );
}
