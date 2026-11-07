"use client";

import React, { useState } from "react";
import Link from "next/link";
import { InvoiceData, InvoiceStatus } from "@/lib/types";
import { formatRupiah } from "@/lib/formatters";
import StatusBadge from "./StatusBadge";
import { deleteInvoice, updateInvoiceStatus } from "@/lib/actions";
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

interface InvoiceListProps {
  initialInvoices: InvoiceData[];
}

export default function InvoiceList({ initialInvoices }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<InvoiceData[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filter calculations
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.companyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" || inv.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalCount = invoices.length;
  const totalNominal = invoices.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const lunasCount = invoices.filter((i) => i.status === "LUNAS").length;
  const lunasNominal = invoices
    .filter((i) => i.status === "LUNAS")
    .reduce((acc, curr) => acc + (curr.total || 0), 0);
  const pendingCount = invoices.filter(
    (i) => i.status === "TERKIRIM" || i.status === "DRAFT"
  ).length;
  const overdueCount = invoices.filter((i) => i.status === "JATUH_TEMPO").length;

  // Direct PDF Download
  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`);
      if (!res.ok) throw new Error("Gagal mengunduh file PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeNum = (invoiceNumber || "INVOICE").replace(/[\/\\]/g, "-");
      a.download = `${safeNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      window.open(`/api/invoices/${id}/pdf`, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  // Quick Status changer
  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    try {
      await updateInvoiceStatus(id, status);
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
      );
    } catch (e) {
      console.error(e);
      alert("Gagal mengubah status.");
    }
  };

  // Delete invoice handler
  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Yakin ingin menghapus invoice ${invoiceNumber}?`)) return;
    setDeletingId(id);
    try {
      await deleteInvoice(id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus invoice.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Faktur & Invoice
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola pembuatan, pengiriman, dan status pembayaran invoice bisnis Anda.
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-100 hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Buat Invoice Baru</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoice
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <p className="text-xs text-slate-500 mt-1">
              Nominal: {formatRupiah(totalNominal)}
            </p>
          </div>
        </div>

        {/* Lunas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lunas (Paid)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600">{lunasCount}</span>
            <p className="text-xs text-slate-500 mt-1">
              Diterima: {formatRupiah(lunasNominal)}
            </p>
          </div>
        </div>

        {/* Pending / Terkirim */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Menunggu / Terkirim
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-600">{pendingCount}</span>
            <p className="text-xs text-slate-500 mt-1">Faktur berjalan</p>
          </div>
        </div>

        {/* Jatuh Tempo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jatuh Tempo
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600">{overdueCount}</span>
            <p className="text-xs text-slate-500 mt-1">Perlu ditindaklanjuti</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { key: "ALL", label: "Semua" },
            { key: "DRAFT", label: "Draft" },
            { key: "TERKIRIM", label: "Terkirim" },
            { key: "LUNAS", label: "Lunas" },
            { key: "JATUH_TEMPO", label: "Jatuh Tempo" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === tab.key
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. invoice, klien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">No. Invoice</th>
                <th className="py-3.5 px-6">Klien / Tagihan Kepada</th>
                <th className="py-3.5 px-6">Tanggal & Jatuh Tempo</th>
                <th className="py-3.5 px-6 text-right">Total (Rp)</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Invoice Number */}
                    <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1"
                      >
                        <span>{inv.invoiceNumber}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>

                    {/* Client Info */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">
                        {inv.clientName}
                      </div>
                      {inv.clientEmail && (
                        <div className="text-xs text-slate-500">
                          {inv.clientEmail}
                        </div>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-600">
                      <div>Tgl: {inv.issueDate}</div>
                      <div className="text-slate-400">Tempo: {inv.dueDate}</div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-6 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(inv.total)}
                    </td>

                    {/* Status Badge + Quick Switch */}
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="inline-block relative">
                        <select
                          value={inv.status}
                          onChange={(e) =>
                            inv.id &&
                            handleStatusChange(inv.id, e.target.value as InvoiceStatus)
                          }
                          className="text-xs font-semibold rounded-full px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer focus:outline-hidden"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="TERKIRIM">Terkirim</option>
                          <option value="LUNAS">Lunas</option>
                          <option value="JATUH_TEMPO">Jatuh Tempo</option>
                          <option value="BATAL">Batal</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Lihat Faktur"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Direct PDF Download button */}
                        <button
                          onClick={() => inv.id && handleDownloadPdf(inv.id, inv.invoiceNumber)}
                          disabled={downloadingId === inv.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                          title="Download PDF"
                        >
                          {downloadingId === inv.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        <Link
                          href={`/invoices/${inv.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Faktur"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => inv.id && handleDelete(inv.id, inv.invoiceNumber)}
                          disabled={deletingId === inv.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Hapus Faktur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-slate-600 font-medium">
                        Tidak ada invoice yang sesuai dengan kriteria pencarian.
                      </p>
                      <Link
                        href="/invoices/new"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg"
                      >
                        + Buat Invoice Baru
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
