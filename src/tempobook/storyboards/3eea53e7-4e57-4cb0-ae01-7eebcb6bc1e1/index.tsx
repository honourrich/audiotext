import ProcessingStatus from "@/components/ProcessingStatus";
import { useState, useEffect } from "react";

export default function ProcessingStatusDemo() {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("upload");
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [error, setError] = useState<string>();

  const stages = [
    {
      id: "upload",
      label: "Uploading audio file...",
      progress: 20,
      status: "pending" as const,
    },
    {
      id: "transcribe",
      label: "Transcribing with AI...",
      progress: 60,
      status: "pending" as const,
    },
    {
      id: "summary",
      label: "Generating summary...",
      progress: 75,
      status: "pending" as const,
    },
    {
      id: "chapters",
      label: "Creating chapters...",
      progress: 85,
      status: "pending" as const,
    },
    {
      id: "keywords",
      label: "Extracting keywords...",
      progress: 95,
      status: "pending" as const,
    },
    {
      id: "finalize",
      label: "Finalizing content...",
      progress: 100,
      status: "pending" as const,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 2, 100);

        // Update current stage based on progress
        if (newProgress <= 20) setCurrentStage("upload");
        else if (newProgress <= 60) setCurrentStage("transcribe");
        else if (newProgress <= 75) setCurrentStage("summary");
        else if (newProgress <= 85) setCurrentStage("chapters");
        else if (newProgress <= 95) setCurrentStage("keywords");
        else setCurrentStage("finalize");

        // Update time remaining
        setTimeRemaining(Math.max(180 - Math.floor(newProgress * 1.8), 0));

        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ProcessingStatus
        currentProgress={progress}
        currentStage={currentStage}
        estimatedTimeRemaining={timeRemaining}
        error={error}
        stages={stages}
        onCancel={() => console.log("Processing cancelled")}
      />
    </div>
  );
}
