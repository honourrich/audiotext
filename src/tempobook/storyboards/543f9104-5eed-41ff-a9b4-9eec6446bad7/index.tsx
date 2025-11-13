import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function APITestDemo() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      console.log("Testing API...");
      const { data, error } = await supabase.functions.invoke("test-api", {
        body: {},
      });

      if (error) {
        console.error("API test error:", error);
        setTestResult({ success: false, error: error.message });
      } else {
        console.log("API test result:", data);
        setTestResult(data);
      }
    } catch (err) {
      console.error("Test failed:", err);
      setTestResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>API Configuration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAPI} disabled={loading} className="w-full">
            {loading ? "Testing..." : "Test API Configuration"}
          </Button>

          {testResult && (
            <div className="mt-4 p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>This test checks:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>If the edge function can be called</li>
              <li>If the OpenAI API key is available</li>
              <li>What environment variables are accessible</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
