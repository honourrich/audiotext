import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileAudio,
  Scissors,
  Zap,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  Download,
  Upload,
} from "lucide-react";

export default function AudioCompressionDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const compressionSteps = [
    {
      title: "File Size Detection",
      description: "Checking if audio file exceeds 25MB limit",
      icon: <HardDrive className="w-5 h-5" />,
      details: "Original file: 45.2 MB (exceeds 25MB limit)",
    },
    {
      title: "Audio Compression",
      description: "Using FFmpeg to compress audio with optimal settings",
      icon: <Zap className="w-5 h-5" />,
      details:
        "ffmpeg -i input.mp3 -vn -ar 16000 -ac 1 -b:a 64k compressed.mp3",
    },
    {
      title: "Size Verification",
      description: "Checking compressed file size",
      icon: <CheckCircle className="w-5 h-5" />,
      details: "Compressed to: 18.3 MB (under 25MB limit)",
    },
    {
      title: "Duration Analysis",
      description: "Calculating audio duration for chunking strategy",
      icon: <Clock className="w-5 h-5" />,
      details: "Audio duration: 2h 15m 30s (8130 seconds)",
    },
    {
      title: "Chunking Strategy",
      description: "Splitting audio into manageable chunks",
      icon: <Scissors className="w-5 h-5" />,
      details: "Creating 3 chunks of ~45 minutes each",
    },
    {
      title: "Parallel Transcription",
      description: "Processing chunks simultaneously with Whisper API",
      icon: <Cpu className="w-5 h-5" />,
      details: "Transcribing 3 chunks in parallel with retry logic",
    },
    {
      title: "Transcript Assembly",
      description: "Combining chunk transcripts into final result",
      icon: <FileAudio className="w-5 h-5" />,
      details: "Reassembling 3 transcripts with proper spacing",
    },
  ];

  const runDemo = async () => {
    setIsRunning(true);
    setDemoStep(0);

    for (let i = 0; i < compressionSteps.length; i++) {
      setDemoStep(i);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setDemoStep(compressionSteps.length);
    setIsRunning(false);
  };

  const resetDemo = () => {
    setDemoStep(0);
    setIsRunning(false);
  };

  return (
    <div className="bg-white min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Audio Compression & Chunking Pipeline
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Automatic audio preprocessing for files larger than 25MB using
            FFmpeg compression and intelligent chunking for Whisper API
            transcription.
          </p>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={runDemo}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Running Demo
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Start Demo
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetDemo} disabled={isRunning}>
              Reset
            </Button>
          </div>
        </div>

        {/* Technical Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <Zap className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">
                Smart Compression
              </h3>
              <p className="text-sm text-blue-700">
                Automatically compresses audio to 16kHz mono with adaptive
                bitrate (64k-32k)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <Scissors className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-900 mb-2">
                Intelligent Chunking
              </h3>
              <p className="text-sm text-green-700">
                Time-based splitting with optimal chunk sizes for parallel
                processing
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <Cpu className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-900 mb-2">
                Retry Logic
              </h3>
              <p className="text-sm text-purple-700">
                3-attempt retry with exponential backoff for failed chunk
                transcriptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Processing Pipeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileAudio className="w-5 h-5 mr-2" />
              Processing Pipeline Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>
                    {Math.round((demoStep / compressionSteps.length) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(demoStep / compressionSteps.length) * 100}
                  className="h-2"
                />
              </div>

              {/* Processing Steps */}
              <div className="grid gap-4">
                {compressionSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all ${
                      index < demoStep
                        ? "border-green-200 bg-green-50"
                        : index === demoStep
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index < demoStep
                          ? "bg-green-100 text-green-600"
                          : index === demoStep
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {index < demoStep ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : index === demoStep && isRunning ? (
                        <Clock className="w-5 h-5 animate-spin" />
                      ) : (
                        step.icon
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`font-medium ${
                            index < demoStep
                              ? "text-green-800"
                              : index === demoStep
                                ? "text-blue-800"
                                : "text-gray-600"
                          }`}
                        >
                          {step.title}
                        </h4>

                        <Badge
                          className={`${
                            index < demoStep
                              ? "bg-green-100 text-green-800"
                              : index === demoStep && isRunning
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {index < demoStep
                            ? "Completed"
                            : index === demoStep && isRunning
                              ? "Processing"
                              : "Pending"}
                        </Badge>
                      </div>

                      <p
                        className={`text-sm mb-2 ${
                          index < demoStep
                            ? "text-green-700"
                            : index === demoStep
                              ? "text-blue-700"
                              : "text-gray-500"
                        }`}
                      >
                        {step.description}
                      </p>

                      <code
                        className={`text-xs px-2 py-1 rounded ${
                          index < demoStep
                            ? "bg-green-100 text-green-800"
                            : index === demoStep
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {step.details}
                      </code>
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Result */}
              {demoStep >= compressionSteps.length && (
                <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-800">
                        Processing Complete!
                      </h4>
                      <p className="text-sm text-green-700">
                        Successfully transcribed 45.2MB audio file using
                        compression and chunking. Final transcript: 15,847 words
                        with 99.2% accuracy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technical Specifications */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compression Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sample Rate:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">16kHz</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Channels:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    Mono (1)
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bitrate:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    64k-32k adaptive
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">MP3</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Size:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    25MB per chunk
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Error Handling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Automatic retry with exponential backoff</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Graceful degradation for failed chunks</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Temporary file cleanup on completion</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Progress tracking with detailed status</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Resource management and memory optimization</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
