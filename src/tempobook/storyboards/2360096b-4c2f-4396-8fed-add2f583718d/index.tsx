import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import UploadModal from "@/components/UploadModal";
import { Upload, Youtube, FileAudio } from "lucide-react";

export default function FunctionalUploadDemo() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <div className="bg-white min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Functional Upload System Demo
          </h1>
          <p className="text-gray-600 mb-8">
            This demonstrates the working upload functionality with real file
            processing and YouTube transcription.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <FileAudio className="w-8 h-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold">Audio File Upload</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Supports MP3, M4A, WAV files up to 100MB</li>
              <li>• Real OpenAI Whisper API transcription</li>
              <li>• Drag & drop or click to browse</li>
              <li>• Progress tracking during upload</li>
            </ul>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <Youtube className="w-8 h-8 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold">YouTube URL Processing</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Extracts video information automatically</li>
              <li>• Attempts to get real auto-captions</li>
              <li>• Falls back to structured demo content</li>
              <li>• Works with public YouTube videos</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <Upload className="w-5 h-5 mr-2" />
            Try Upload System
          </Button>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">What happens after upload:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-600 mb-2">1. Processing</h4>
              <p className="text-gray-600">
                Files are transcribed using OpenAI Whisper API or YouTube
                captions are extracted
              </p>
            </div>
            <div>
              <h4 className="font-medium text-green-600 mb-2">
                2. AI Generation
              </h4>
              <p className="text-gray-600">
                Summary, chapters, and keywords are generated using GPT models
              </p>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 mb-2">3. Editor</h4>
              <p className="text-gray-600">
                Content opens in the editor where you can refine and export
              </p>
            </div>
          </div>
        </div>

        <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
      </div>
    </div>
  );
}
