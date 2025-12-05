// app/vendors/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Vendor,RfpSummary } from "@/lib/types";
import { createVendor, deleteVendor, listRfps, listVendors, sendRfpToVendors } from "@/lib/api";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rfps, setRfps] = useState<RfpSummary[]>([]);
  const [selectedRfpId, setSelectedRfpId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingRfps, setLoadingRfps] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);

  const fetchVendors = async () => {
    setLoadingVendors(true);
    setError(null);
    try {
      const vendorsData = await listVendors();
      setVendors(vendorsData);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to fetch vendors");
      }
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchRfps = async () => {
    setLoadingRfps(true);
    setError(null);
    try {
      const rfpsData = await listRfps();
      setRfps(rfpsData);
      if (rfpsData.length > 0 && selectedRfpId === null) {
        setSelectedRfpId(rfpsData[0].id);
      }
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to fetch RFPs");
      }
    } finally {
      setLoadingRfps(false);
    }
  };

  useEffect(() => {
    void fetchVendors();
    void fetchRfps();
  }, []);

  const handleCreateVendor = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!name.trim() || !email.trim()) {
      setError("Both name and email are required.");
      return;
    }

    setLoading(true);
    try {
      const created = await createVendor({name,email});

      setVendors((prev) => [created, ...prev]);
      setName("");
      setEmail("");
      setInfo("Vendor created successfully.");
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to create vendor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (id: number) => {
    setError(null);
    setInfo(null);
    try {
      await deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
      setSelectedVendorIds((prev) => prev.filter((vid) => vid !== id));
      setInfo("Vendor deleted.");
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to delete vendor.");
      }
    }
  };

  const toggleVendorSelection = (id: number) => {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((vid) => vid !== id) : [...prev, id]
    );
  };

  const handleSendRfp = async () => {
    setError(null);
    setInfo(null);

    if (!selectedRfpId) {
      setError("Please select an RFP to send.");
      return;
    }

    if (selectedVendorIds.length === 0) {
      setError("Please select at least one vendor.");
      return;
    }

    setSending(true);
    try {
      const body = await sendRfpToVendors(selectedRfpId,selectedVendorIds);

      setInfo(
        `RFP sent to ${body.sent ?? 0} out of ${body.attempted ?? 0} selected vendors.`
      );
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to send RFP.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold mb-1">Vendors</h1>
        <p className="text-sm text-slate-600">
          Manage your vendor master data and send RFPs to selected vendors.
        </p>
      </section>

      {(error || info) && (
        <section>
          {error && (
            <p className="text-sm text-red-500 mb-1">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-emerald-600 mb-1">
              {info}
            </p>
          )}
        </section>
      )}

      {/* New vendor form */}
      <section className="border border-slate-200 rounded-2xl bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          Add a new vendor
        </h2>

        <form onSubmit={handleCreateVendor} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-700">Name</span>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-gray-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Supplies Inc."
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-700">Email</span>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-gray-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@acme.com"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white cursor-pointer transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Add Vendor"}
          </button>
        </form>
      </section>

      {/* RFP selection + send button */}
      <section className="border border-slate-200 rounded-2xl bg-white shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Send RFP to selected vendors
        </h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-600">
              Choose an RFP and select vendors from the table below, then click &quot;Send RFP&quot;.
            </p>
            {loadingRfps && (
              <p className="text-xs text-slate-500">Loading RFPs…</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="w-64 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white cursor-pointer text-gray-500"
              value={selectedRfpId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (!Number.isNaN(id)) setSelectedRfpId(id);
              }}
              disabled={rfps.length === 0}
            >
              <option value="" disabled>
                {rfps.length === 0 ? "No RFPs available" : "Select RFP"}
              </option>
              {rfps.map((rfp) => (
                <option key={rfp.id} value={rfp.id}>
                  {rfp.title || `RFP #${rfp.id}`}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={sending || !selectedRfpId || selectedVendorIds.length === 0}
              onClick={() => void handleSendRfp()}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors cursor-pointer hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send RFP"}
            </button>
          </div>
        </div>
      </section>

      {/* Vendor list */}
      <section className="border border-slate-200 rounded-2xl bg-white shadow-sm p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">Vendor list</h2>
          {loadingVendors && (
            <span className="text-xs text-slate-500">Loading vendors…</span>
          )}
        </div>

        {vendors.length === 0 && !loadingVendors ? (
          <p className="text-sm text-slate-500">
            No vendors yet. Add your first vendor using the form above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2 font-medium text-slate-700">
                    Select
                  </th>
                  <th className="px-3 py-2 font-medium text-slate-700">Name</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Email</th>
                  <th className="px-3 py-2 font-medium text-slate-700">
                    Created
                  </th>
                  <th className="px-3 py-2 font-medium text-slate-700 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => {
                  const selected = selectedVendorIds.includes(vendor.id);
                  return (
                    <tr key={vendor.id} className="border-b border-slate-100 text-gray-500">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          checked={selected}
                          onChange={() => toggleVendorSelection(vendor.id)}
                        />
                      </td>
                      <td className="px-3 py-2">{vendor.name}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {vendor.email}
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-xs">
                        {new Date(vendor.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => void handleDeleteVendor(vendor.id)}
                          className="text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}