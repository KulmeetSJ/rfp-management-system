// app/comparison/page.tsx
"use client";

import { useEffect, useState } from "react";
import { RfpSummary, AnalysisResponse, Vendor } from "@/lib/types";
import { createProposal, getRfpAnalysis, listRfps, listVendors } from "@/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;


export default function ComparisonPage() {
  const [rfps, setRfps] = useState<RfpSummary[]>([]);
  const [selectedRfpId, setSelectedRfpId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loadingRfps, setLoadingRfps] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [rawEmailText, setRawEmailText] = useState("");
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [proposalInfo, setProposalInfo] = useState<string | null>(null);

  // Fetch RFP list
  useEffect(() => {
    const fetchRfps = async () => {
      setLoadingRfps(true);
      setError(null);
      try {
        const rfpsData = await listRfps();
        setRfps(rfpsData);
        if (rfpsData.length > 0 && selectedRfpId === null) {
          setSelectedRfpId(rfpsData[0].id);
        }
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) setError(err.message);
        else setError("Failed to fetch RFP list");
      } finally {
        setLoadingRfps(false);
      }
    };

    void fetchRfps();
  }, [selectedRfpId]);

  // Fetch vendors (for add-proposal form)
  useEffect(() => {
    const fetchVendors = async () => {
      setLoadingVendors(true);
      try {
        const vendorsData = await listVendors();
        setVendors(vendorsData);
        if (vendorsData.length > 0 && selectedVendorId === null) {
          setSelectedVendorId(vendorsData[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingVendors(false);
      }
    };

    void fetchVendors();
  }, [selectedVendorId]);

  // Fetch analysis when selectedRfpId changes
  useEffect(() => {
    if (!selectedRfpId) return;

    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      setError(null);
      setAnalysis(null);
      try {
        const rfpAnalysisResponse = await getRfpAnalysis(selectedRfpId)

        setAnalysis(rfpAnalysisResponse);
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) setError(err.message);
        else setError("Failed to fetch analysis");
      } finally {
        setLoadingAnalysis(false);
      }
    };

    void fetchAnalysis();
  }, [selectedRfpId]);

  const handleSelectChange = (value: string) => {
    const id = Number(value);
    if (!Number.isNaN(id)) {
      setSelectedRfpId(id);
    }
  };

  const handleCreateProposal = async () => {
    setError(null);
    setProposalInfo(null);

    if (!selectedRfpId) {
      setError("Please select an RFP first.");
      return;
    }
    if (!selectedVendorId) {
      setError("Please select a vendor.");
      return;
    }
    if (!rawEmailText.trim()) {
      setError("Please paste the vendor email text.");
      return;
    }

    setCreatingProposal(true);
    try {
      await createProposal({
        rfpId: selectedRfpId,
        vendorId: selectedVendorId,
        rawText: rawEmailText,
      });

      setProposalInfo("Proposal created and parsed successfully.");
      setRawEmailText("");

      // Refresh analysis to include this new proposal
      if (selectedRfpId) {
        const rfpAnalysisResponse2 = await getRfpAnalysis(selectedRfpId);

        setAnalysis(rfpAnalysisResponse2);
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError("Failed to create proposal.");
    } finally {
      setCreatingProposal(false);
    }
  };

  const selectedRfp = rfps.find((r) => r.id === selectedRfpId) ?? null;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold mb-1">Proposal Comparison</h1>
        <p className="text-sm text-slate-600">
          Select an RFP to see all vendor proposals and an AI-generated recommendation.
        </p>
      </section>

      {/* RFP selector */}
      <section className="border border-slate-200 rounded-2xl bg-white shadow-sm p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">
              Choose RFP
            </p>
            {loadingRfps ? (
              <p className="text-xs text-slate-500">Loading RFPs…</p>
            ) : rfps.length === 0 ? (
              <p className="text-xs text-slate-500">
                No RFPs found. Create one on the &quot;Create RFP&quot; page first.
              </p>
            ) : null}
          </div>
          <div>
            <select
              className="w-full md:w-80 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white cursor-pointer text-gray-500"
              value={selectedRfpId ?? ""}
              onChange={(e) => handleSelectChange(e.target.value)}
              disabled={rfps.length === 0}
            >
              {rfps.map((rfp) => (
                <option key={rfp.id} value={rfp.id}>
                  {rfp.title || `RFP #${rfp.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && (
        <section className="border border-red-200 rounded-2xl bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </section>
      )}

      {/* Add proposal from vendor email */}
      <section className="border border-slate-200 rounded-2xl bg-white shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Add Proposal from Vendor Email
        </h2>
        <p className="text-xs text-slate-600">
          After a vendor replies to your RFP by email, paste their email content here
          to create a structured proposal for this RFP.
        </p>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <label className="block text-xs mb-1 text-slate-700">
              Vendor
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white cursor-pointer text-gray-500"
              value={selectedVendorId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (!Number.isNaN(id)) setSelectedVendorId(id);
              }}
              disabled={loadingVendors || vendors.length === 0}
            >
              <option value="" disabled>
                {vendors.length === 0 ? "No vendors available" : "Select vendor"}
              </option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-700">
            Vendor email text
          </label>
          <textarea
            className="w-full min-h-[120px] border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white text-gray-500"
            placeholder="Paste the full email content from the vendor here..."
            value={rawEmailText}
            onChange={(e) => setRawEmailText(e.target.value)}
          />
        </div>

        {proposalInfo && (
          <p className="text-xs text-emerald-600">{proposalInfo}</p>
        )}

        <button
          type="button"
          disabled={creatingProposal}
          onClick={() => void handleCreateProposal()}
          className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white cursor-pointer transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creatingProposal ? "Creating Proposal..." : "Add Proposal"}
        </button>
      </section>

      {/* Analysis / loading state */}
      {loadingAnalysis && (
        <section className="border border-slate-200 rounded-2xl bg-white p-4">
          <p className="text-sm text-slate-600">Analyzing proposals with AI…</p>
        </section>
      )}

      {analysis && !loadingAnalysis && (
        <>
          {/* AI Recommendation */}
          <section className="border border-slate-200 rounded-2xl bg-white shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">
              AI Recommendation
            </h2>
            <p className="text-sm text-slate-700">
              Recommended vendor:{" "}
              <span className="font-semibold">
                {analysis.analysis.recommendation.vendorName}
              </span>
            </p>
            <p className="text-sm text-slate-700">
              {analysis.analysis.recommendation.reason}
            </p>
          </section>

          {/* Vendor Scores */}
          <section className="border border-slate-200 rounded-2xl bg-white shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Vendor Scores
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 font-medium text-slate-700">
                      Vendor
                    </th>
                    <th className="px-3 py-2 font-medium text-slate-700">
                      Score
                    </th>
                    <th className="px-3 py-2 font-medium text-slate-700">
                      Summary
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.analysis.vendor_scores.map((vs) => (
                    <tr key={vs.vendorId} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{vs.vendorName}</td>
                      <td className="px-3 py-2 font-semibold text-slate-700">
                        {vs.score.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {vs.summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Raw Proposals */}
          <section className="border border-slate-200 rounded-2xl bg-white shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Raw Proposals
            </h2>
            {analysis.proposals.length === 0 ? (
              <p className="text-sm text-slate-500">
                No proposals for this RFP yet.
              </p>
            ) : (
              <div className="space-y-3">
                {analysis.proposals.map((p) => (
                  <div
                    key={p.id}
                    className="border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-600">
                          {p.vendor.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.vendor.email}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>
                    <details className="text-xs text-slate-700">
                      <summary className="cursor-pointer mb-1">
                        Raw email text
                      </summary>
                      <pre className="whitespace-pre-wrap">
                        {p.raw_email_text}
                      </pre>
                    </details>
                    <details className="text-xs text-slate-700 mt-1">
                      <summary className="cursor-pointer mb-1">
                        Extracted JSON
                      </summary>
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(p.extracted_json, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}