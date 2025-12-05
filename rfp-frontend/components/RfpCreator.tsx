"use client";

import { useState } from "react";
import { BACKEND_URL } from "@/lib/config";
import type { CreateRfpResponse } from "@/lib/types";
import { createRfp } from "@/lib/api";



export default function RfpCreator() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateRfpResponse | null>(null);

  async function submit() {
    setError(null);
    setResult(null);

    if (!text.trim()) {
      setError("Please enter your requirement text.");
      return;
    }

    setLoading(true);
    try {
      const created = await createRfp(text);   
      setResult(created);
      setText("");
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while creating the RFP.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-xl bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold">Create RFP (AI Generated)</h1>

        <span className="block text-sm font-medium text-slate-700 mb-1">
          Describe your procurement need
        </span>

        <textarea
          className="w-full mt-3 min-h-[140px] border p-3 rounded-lg"
          placeholder="Example: I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 cursor-pointer  disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Generating..." : "Create RFP"}
        </button>
      </div>

      {result && (
        <div className="border rounded-xl bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-semibold">Generated RFP</h2>

          <p className="text-sm text-gray-500">
            RFP ID: {result.id} — {new Date(result.created_at).toLocaleString()}
          </p>

          <details className="text-sm">
            <summary className="cursor-pointer mb-1">Original Text</summary>
            <pre className="whitespace-pre-wrap">{result.raw_input}</pre>
          </details>

          <details className="text-sm" open>
            <summary className="cursor-pointer mb-1">Structured JSON</summary>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(result.structured_json, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}