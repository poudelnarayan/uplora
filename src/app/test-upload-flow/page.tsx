"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function TestUploadFlow() {
  const { isSignedIn } = useUser();
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testUploadFlow = async () => {
    if (!isSignedIn) {
      alert("Please sign in first");
      return;
    }

    setIsLoading(true);
    const results: any = {};

    try {
      // Test 1: Init
      console.log("Testing init...");
      const initResponse = await fetch("/api/s3/multipart/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          filename: "test-video.mp4", 
          contentType: "video/mp4" 
        })
      });

      results.init = {
        status: initResponse.status,
        ok: initResponse.ok,
        statusText: initResponse.statusText
      };

      if (initResponse.ok) {
        const initData = await initResponse.json();
        results.init.data = initData;
        console.log("Init successful:", initData);

        // Test 2: Sign
        console.log("Testing sign...");
        const signResponse = await fetch("/api/s3/multipart/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            key: initData.key, 
            uploadId: initData.uploadId, 
            partNumber: 1 
          })
        });

        results.sign = {
          status: signResponse.status,
          ok: signResponse.ok,
          statusText: signResponse.statusText
        };

        if (signResponse.ok) {
          const signData = await signResponse.json();
          results.sign.data = {
            hasUrl: !!signData.url,
            urlLength: signData.url?.length || 0
          };
          console.log("Sign successful:", signData);

          // Test 3: Debug endpoint
          console.log("Testing debug endpoint...");
          const debugResponse = await fetch("/api/debug-multipart-sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              key: initData.key, 
              uploadId: initData.uploadId, 
              partNumber: 1 
            })
          });

          results.debug = {
            status: debugResponse.status,
            ok: debugResponse.ok,
            statusText: debugResponse.statusText
          };

          if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            results.debug.data = debugData;
            console.log("Debug successful:", debugData);
          }
        }
      }

    } catch (error) {
      console.error("Test failed:", error);
      results.error = error instanceof Error ? error.message : "Unknown error";
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Flow Test</h1>
      
      <button
        onClick={testUploadFlow}
        disabled={isLoading || !isSignedIn}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {isLoading ? "Testing..." : "Test Upload Flow"}
      </button>

      {testResults && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      {!isSignedIn && (
        <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
          Please sign in to test the upload flow.
        </div>
      )}
    </div>
  );
}
