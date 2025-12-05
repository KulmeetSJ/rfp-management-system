// lib/api.ts
import { BACKEND_URL } from "./config";
import type {
  RfpSummary,
  Vendor,
  ProposalView, VendorScore, Recommendation, Analysis,
  AnalysisResponse,
  CreateRfpResponse
} from "./types";

// --- RFPs ---

export async function createRfp(naturalText: string): Promise<CreateRfpResponse> {
    const res = await fetch(`${BACKEND_URL}/rfps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ natural_text: naturalText }),
    });
  
    const body = await res.json().catch(() => ({}));
  
    if (!res.ok) {
      throw new Error(body.error ?? "Failed to create RFP");
    }
  
    return body as CreateRfpResponse;
  }

export async function listRfps(): Promise<RfpSummary[]> {
  const res = await fetch(`${BACKEND_URL}/rfps`);
  if (!res.ok) {
    throw new Error(`Failed to fetch RFPs (${res.status})`);
  }
  return (await res.json()) as RfpSummary[];
}

export async function getRfpAnalysis(
  rfpId: number
): Promise<AnalysisResponse> {
  const res = await fetch(`${BACKEND_URL}/rfps/${rfpId}/analysis`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Failed to fetch analysis (${res.status})`);
  }
  return body as AnalysisResponse;
}

// --- Vendors ---

export async function listVendors(): Promise<Vendor[]> {
  const res = await fetch(`${BACKEND_URL}/vendors`);
  if (!res.ok) {
    throw new Error(`Failed to fetch vendors (${res.status})`);
  }
  return (await res.json()) as Vendor[];
}

export async function createVendor(input: {
  name: string;
  email: string;
}): Promise<Vendor> {
  const res = await fetch(`${BACKEND_URL}/vendors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Failed to create vendor (${res.status})`);
  }
  return body as Vendor;
}

export async function deleteVendor(id: number): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/vendors/${id}`, {
    method: "DELETE",
  });

  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to delete vendor (${res.status})`);
  }
}

// --- RFP email send ---

export async function sendRfpToVendors(rfpId: number, vendorIds: number[]) {
  const res = await fetch(`${BACKEND_URL}/rfps/${rfpId}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vendorIds }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Failed to send RFP (${res.status})`);
  }
  return body as { rfpId: number; attempted: number; sent: number };
}

// --- Proposals ---

export async function createProposal(input: {
  rfpId: number;
  vendorId: number;
  rawText: string;
}) {
  const res = await fetch(`${BACKEND_URL}/rfps/${input.rfpId}/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vendorId: input.vendorId,
      rawText: input.rawText,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Failed to create proposal (${res.status})`);
  }
  return body;
}