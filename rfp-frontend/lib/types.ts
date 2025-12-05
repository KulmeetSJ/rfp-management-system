// lib/types.ts

export type RfpSummary = {
    id: number;
    title: string;
    raw_input?: string;
    created_at?: string;
  };
  
  export type Vendor = {
    id: number;
    name: string;
    email: string;
    createdAt: string;
  };
  
  export type ProposalView = {
    id: number;
    vendor: {
      id: number;
      name: string;
      email: string;
    };
    raw_email_text: string;
    extracted_json: unknown;
    created_at: string;
  };
  
  export type VendorScore = {
    vendorId: number;
    vendorName: string;
    score: number;
    summary: string;
  };
  
  export type Recommendation = {
    vendorId: number;
    vendorName: string;
    reason: string;
  };
  
  export type Analysis = {
    vendor_scores: VendorScore[];
    recommendation: Recommendation;
  };
  
  export type AnalysisResponse = {
    rfp: {
      id: number;
      title: string;
    };
    proposals: ProposalView[];
    analysis: Analysis;
  };

  type StructuredRfp = {
    title: string;
    original_text?: string;
    budget?: number;
    delivery_within_days?: number;
    payment_terms?: string;
    warranty?: string;
    items?: { name: string; quantity: number; specs?: string }[];
  };

  export type CreateRfpResponse = {
    id: number;
    raw_input: string;
    structured_json: StructuredRfp;
    created_at: string;
  };