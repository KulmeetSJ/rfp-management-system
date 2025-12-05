// components/RfpCreator.tsx
"use client";

import { useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

type StructuredRfp = {
  title: string;
  original_text?: string;
  budget?: number;
  delivery_within_days?: number;
  payment_terms?: string;
  warranty?: string;
  items?: { name: string; quantity: number; specs?: string }[];
};

export default function RfpCreator() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [structuredRfp, setStructuredRfp] = useState<StructuredRfp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRfp = async () => {
    setError(null);
    setStructuredRfp(null);

    if (!text.trim()) {
      setError("Please describe what you want to buy.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/rfps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ natural_text: text }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error || `Request failed with status ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();

      // We expect backend to return { id, raw_input, structured_json }
      const structured: StructuredRfp = data.structured_json || data;
      setStructuredRfp(structured);
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
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-slate-700 mb-1">
          Describe your procurement need
        </span>
        <textarea
          className="w-full min-h-[150px] border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white"
          placeholder="Example: I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <button
        onClick={handleCreateRfp}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium cursor-pointer bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Creating RFP..." : "Create RFP"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {structuredRfp && (
        <div className="mt-4 border border-slate-200 rounded-2xl bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            Structured RFP (from backend)
          </h2>
          <pre className="text-xs text-slate-700 whitespace-pre-wrap">
            {JSON.stringify(structuredRfp, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}