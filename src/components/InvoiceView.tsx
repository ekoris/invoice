"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { InvoiceData, InvoiceItemData } from "@/lib/types";
import { formatNumberIndo, formatRupiah, formatDateDDMMYYYY, toInputDate } from "@/lib/formatters";
import {
  Edit2,
  Printer,
  ArrowLeft,
  Download,
  Loader2,
  Plus,
  Trash2,
  Save,
  Upload,
  CheckCircle2,
  Check,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { updateInvoice, updateInvoiceStatus } from "@/lib/actions";

interface InvoiceViewProps {
  invoice: InvoiceData;
  showEditIcons?: boolean;
}

export default function InvoiceView({
  invoice: initialInvoice,
}: InvoiceViewProps) {
  const [invoice, setInvoice] = useState<InvoiceData>(initialInvoice);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSig, setIsUploadingSig] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  // Recalculate totals
  const recalculateTotals = (
    items: InvoiceItemData[],
    discount = invoice.discount || 0,
    taxPercent = invoice.taxPercent || 0
  ) => {
    const subtotal = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const taxAmount = (subtotal - discount) * (taxPercent / 100);
    const total = Math.max(0, subtotal - discount + taxAmount);

    setInvoice((prev) => ({
      ...prev,
      items,
      subtotal,
      taxPercent,
      taxAmount,
      discount,
      total,
    }));
    setHasChanges(true);
  };

  const updateField = (field: keyof InvoiceData, value: unknown) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItemData,
    value: string | number
  ) => {
    const updated = [...(invoice.items || [])];
    const item = { ...updated[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      const q = field === "quantity" ? Number(value) : item.quantity;
      const p = field === "unitPrice" ? Number(value) : item.unitPrice;
      item.amount = (Number(q) || 0) * (Number(p) || 0);
    }

    updated[index] = item;
    recalculateTotals(updated);
  };

  const handleAddItem = () => {
    setIsEditing(true);
    const updated = [
      ...(invoice.items || []),
      {
        product: "Item Baru",
        description: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        sortOrder: (invoice.items || []).length,
      },
    ];
    recalculateTotals(updated);
  };

  const handleRemoveItem = (index: number) => {
    if ((invoice.items || []).length <= 1) {
      alert("Invoice harus memiliki minimal satu item produk.");
      return;
    }
    const updated = (invoice.items || []).filter((_, i) => i !== index);
    recalculateTotals(updated);
  };

  // Save changes to database
  const handleSaveInvoice = async () => {
    if (!invoice.id) return;
    setIsSaving(true);
    try {
      await updateInvoice(invoice.id, invoice);
      setHasChanges(false);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan perubahan invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Logo directly
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json();
      if (result.success && result.url) {
        const updatedInvoice = { ...invoice, companyLogo: result.url };
        setInvoice(updatedInvoice);
        if (invoice.id) {
          await updateInvoice(invoice.id, updatedInvoice);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(result.error || "Gagal mengunggah logo.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengunggah logo.");
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = "";
    }
  };

  // Upload Signature directly
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSig(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json();
      if (result.success && result.url) {
        const updatedInvoice = { ...invoice, signatureImage: result.url };
        setInvoice(updatedInvoice);
        if (invoice.id) {
          await updateInvoice(invoice.id, updatedInvoice);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(result.error || "Gagal mengunggah tanda tangan.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengunggah tanda tangan.");
    } finally {
      setIsUploadingSig(false);
      if (e.target) e.target.value = "";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoice.id) {
      alert("Simpan invoice terlebih dahulu sebelum mengunduh PDF.");
      return;
    }

    if (hasChanges) {
      const confirmSave = confirm("Anda memiliki perubahan yang belum disimpan. Simpan sekarang dan unduh PDF?");
      if (confirmSave) {
        await handleSaveInvoice();
      }
    }

    setIsDownloadingPdf(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (!res.ok) {
        throw new Error("Gagal mengunduh file PDF dari server");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeNum = (invoice.invoiceNumber || "INVOICE").replace(/[\/\\]/g, "-");
      a.download = `${safeNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download PDF error:", err);
      window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleStatusChange = async (
    newStatus: "DRAFT" | "TERKIRIM" | "LUNAS" | "JATUH_TEMPO" | "BATAL"
  ) => {
    if (!invoice.id) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateInvoiceStatus(invoice.id, newStatus);
      setInvoice((prev) => ({
        ...prev,
        status: updated.status as "DRAFT" | "TERKIRIM" | "LUNAS" | "JATUH_TEMPO" | "BATAL",
      }));
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui status invoice.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Toast Notification when saved */}
      {saveSuccess && (
        <div className="no-print mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-xs transition-all animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Perubahan invoice berhasil disimpan ke database!</span>
        </div>
      )}

      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Daftar</span>
          </Link>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <StatusBadge status={invoice.status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick status dropdown / actions */}
          <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-1 bg-slate-50 text-xs">
            <button
              onClick={() => handleStatusChange("DRAFT")}
              disabled={isUpdatingStatus || invoice.status === "DRAFT"}
              className={`px-2 py-1 rounded transition-colors ${
                invoice.status === "DRAFT"
                  ? "bg-amber-100 text-amber-800 font-bold"
                  : "hover:bg-white text-slate-600"
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => handleStatusChange("TERKIRIM")}
              disabled={isUpdatingStatus || invoice.status === "TERKIRIM"}
              className={`px-2 py-1 rounded transition-colors ${
                invoice.status === "TERKIRIM"
                  ? "bg-blue-100 text-blue-800 font-bold"
                  : "hover:bg-white text-slate-600"
              }`}
            >
              Terkirim
            </button>
            <button
              onClick={() => handleStatusChange("LUNAS")}
              disabled={isUpdatingStatus || invoice.status === "LUNAS"}
              className={`px-2 py-1 rounded transition-colors ${
                invoice.status === "LUNAS"
                  ? "bg-emerald-100 text-emerald-800 font-bold"
                  : "hover:bg-white text-slate-600"
              }`}
            >
              Lunas
            </button>
            <button
              onClick={() => handleStatusChange("JATUH_TEMPO")}
              disabled={isUpdatingStatus || invoice.status === "JATUH_TEMPO"}
              className={`px-2 py-1 rounded transition-colors ${
                invoice.status === "JATUH_TEMPO"
                  ? "bg-rose-100 text-rose-800 font-bold"
                  : "hover:bg-white text-slate-600"
              }`}
            >
              Jatuh Tempo
            </button>
          </div>

          {/* Toggle Live Edit Mode */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              isEditing
                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? "Mode Edit Aktif" : "Aktifkan Edit Langsung"}</span>
          </button>

          {/* Save Button when changes exist or when editing */}
          {hasChanges && (
            <button
              type="button"
              onClick={handleSaveInvoice}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow transition-all animate-pulse"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          )}

          {/* DEDICATED PDF DOWNLOAD BUTTON */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            title="Download PDF resmi dengan engine PDF presisi tinggi"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
            title="Cetak langsung lewat printer browser"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Invoice Document Paper Container */}
      <div className="print-container bg-white rounded-2xl shadow-md border border-slate-200 p-8 sm:p-12 text-slate-900 transition-all font-sans relative">
        {/* Top Header: Logo on left, Title & Metadata on right */}
        <div className="flex justify-between items-start">
          {/* Logo & Upload Logo button */}
          <div className="flex flex-col items-start space-y-2">
            {invoice.companyLogo ? (
              <div className="relative w-44 h-16 group">
                <Image
                  src={invoice.companyLogo}
                  alt={invoice.companyName}
                  fill
                  className="object-contain object-left"
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <div className="text-xl font-bold text-indigo-700 tracking-tight">
                {invoice.companyName}
              </div>
            )}

            {/* Upload Logo button matching screenshot */}
            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="no-print inline-flex items-center space-x-1.5 px-3 py-1 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs print:hidden cursor-pointer"
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 text-slate-500" />
                  <span>Upload Logo</span>
                </>
              )}
            </button>
          </div>

          {/* Title & Metadata */}
          <div className="flex flex-col items-end">
            <div className="flex items-center mb-4">
              {isEditing ? (
                <input
                  type="text"
                  value={invoice.title || "Invoice"}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="text-3xl font-extrabold text-indigo-600 tracking-tight text-right border-b-2 border-indigo-500 focus:outline-hidden bg-indigo-50/40 px-2 py-0.5 rounded"
                />
              ) : (
                <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight">
                  {invoice.title || "Invoice"}
                </h1>
              )}
            </div>

            <div className="text-sm space-y-1.5 text-slate-800">
              {/* Referensi */}
              <div className="flex justify-between items-center space-x-6">
                <span className="text-slate-700 text-right font-normal">Referensi</span>
                <span className="font-semibold text-slate-900 min-w-[120px] text-right">
                  {isEditing ? (
                    <input
                      type="text"
                      value={invoice.invoiceNumber}
                      onChange={(e) => updateField("invoiceNumber", e.target.value)}
                      className="border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-right w-28 focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <span>{invoice.invoiceNumber}</span>
                  )}
                </span>
              </div>

              {/* Tanggal */}
              <div className="flex justify-between items-center space-x-6">
                <span className="text-slate-700 text-right font-normal">Tanggal</span>
                <span className="font-semibold text-slate-900 min-w-[120px] text-right">
                  {isEditing ? (
                    <input
                      type="date"
                      value={toInputDate(invoice.issueDate)}
                      onChange={(e) =>
                        updateField("issueDate", formatDateDDMMYYYY(e.target.value))
                      }
                      className="border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-right w-32 focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <span>{formatDateDDMMYYYY(invoice.issueDate)}</span>
                  )}
                </span>
              </div>

              {/* Tgl. Jatuh Tempo */}
              <div className="flex justify-between items-center space-x-6">
                <span className="text-slate-700 text-right font-normal">Tgl. Jatuh Tempo</span>
                <span className="font-semibold text-slate-900 min-w-[120px] text-right">
                  {isEditing ? (
                    <input
                      type="date"
                      value={toInputDate(invoice.dueDate)}
                      onChange={(e) =>
                        updateField("dueDate", formatDateDDMMYYYY(e.target.value))
                      }
                      className="border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-right w-32 focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <span>{formatDateDDMMYYYY(invoice.dueDate)}</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Columns: Informasi Perusahaan & Tagihan Kepada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          {/* Informasi Perusahaan */}
          <div>
            <div className="font-bold text-slate-900 text-base pb-1 border-b-2 border-slate-900 mb-3">
              Informasi Perusahaan
            </div>
            <div className="space-y-1.5 text-sm text-slate-700">
              {/* Nama Perusahaan */}
              <div className="font-bold text-indigo-700 text-base">
                {isEditing ? (
                  <input
                    type="text"
                    value={invoice.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    className="w-full border border-indigo-200 rounded px-2 py-0.5 text-sm font-bold text-indigo-700"
                  />
                ) : (
                  <span>{invoice.companyName}</span>
                )}
              </div>

              {/* Alamat Perusahaan */}
              <div>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={invoice.companyAddress || ""}
                    onChange={(e) => updateField("companyAddress", e.target.value)}
                    className="w-full border border-slate-200 rounded px-2 py-0.5 text-xs leading-relaxed"
                  />
                ) : (
                  <span>{invoice.companyAddress}</span>
                )}
              </div>

              {/* Telp Perusahaan */}
              <div>
                {isEditing ? (
                  <div className="flex items-center space-x-1 w-full text-xs">
                    <span className="text-slate-900 font-semibold">Telp:</span>
                    <input
                      type="text"
                      value={invoice.companyPhone || ""}
                      onChange={(e) => updateField("companyPhone", e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 flex-1"
                    />
                  </div>
                ) : (
                  <>
                    <span className="text-slate-900">Telp: </span>
                    <span className="ml-1">{invoice.companyPhone}</span>
                  </>
                )}
              </div>

              {/* Email Perusahaan */}
              <div>
                {isEditing ? (
                  <div className="flex items-center space-x-1 w-full text-xs">
                    <span className="text-slate-900 font-semibold">Email:</span>
                    <input
                      type="email"
                      value={invoice.companyEmail || ""}
                      onChange={(e) => updateField("companyEmail", e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 flex-1"
                    />
                  </div>
                ) : (
                  <>
                    <span className="text-slate-900">Email: </span>
                    <span className="ml-1">{invoice.companyEmail}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tagihan Kepada */}
          <div>
            <div className="font-bold text-slate-900 text-base pb-1 border-b-2 border-slate-900 mb-3">
              Tagihan Kepada
            </div>
            <div className="space-y-1.5 text-sm text-slate-700">
              {/* Nama Klien */}
              <div className="font-bold text-indigo-700 text-base">
                {isEditing ? (
                  <input
                    type="text"
                    value={invoice.clientName}
                    onChange={(e) => updateField("clientName", e.target.value)}
                    className="w-full border border-indigo-200 rounded px-2 py-0.5 text-sm font-bold text-indigo-700"
                  />
                ) : (
                  <span>{invoice.clientName}</span>
                )}
              </div>

              {/* Alamat Klien */}
              <div>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={invoice.clientAddress || ""}
                    onChange={(e) => updateField("clientAddress", e.target.value)}
                    className="w-full border border-slate-200 rounded px-2 py-0.5 text-xs leading-relaxed"
                  />
                ) : (
                  <span>{invoice.clientAddress}</span>
                )}
              </div>

              {/* Telp Klien */}
              <div>
                {isEditing ? (
                  <div className="flex items-center space-x-1 w-full text-xs">
                    <span className="text-slate-900 font-semibold">Telp:</span>
                    <input
                      type="text"
                      value={invoice.clientPhone || ""}
                      onChange={(e) => updateField("clientPhone", e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 flex-1"
                    />
                  </div>
                ) : (
                  <>
                    <span className="text-slate-900">Telp: </span>
                    <span className="ml-1">{invoice.clientPhone}</span>
                  </>
                )}
              </div>

              {/* Email Klien */}
              <div>
                {isEditing ? (
                  <div className="flex items-center space-x-1 w-full text-xs">
                    <span className="text-slate-900 font-semibold">Email:</span>
                    <input
                      type="email"
                      value={invoice.clientEmail || ""}
                      onChange={(e) => updateField("clientEmail", e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 flex-1"
                    />
                  </div>
                ) : (
                  <>
                    <span className="text-slate-900">Email: </span>
                    <span className="ml-1">{invoice.clientEmail}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-8 overflow-hidden rounded-xs border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#242b47] text-white text-xs sm:text-sm font-semibold">
                <th className="py-3 px-4 w-[28%]">Produk</th>
                <th className="py-3 px-4 w-[40%]">Deskripsi</th>
                <th className="py-3 px-4 text-center w-[10%]">Kuantitas</th>
                <th className="py-3 px-4 text-right w-[11%]">Harga</th>
                <th className="py-3 px-4 text-right w-[11%]">Jumlah</th>
                {isEditing && (
                  <th className="no-print py-3 px-2 w-[4%] text-center print:hidden"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <tr key={item.id || index} className="align-top hover:bg-slate-50/50">
                    {/* Produk */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.product}
                          onChange={(e) =>
                            handleItemChange(index, "product", e.target.value)
                          }
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <span>{item.product}</span>
                      )}
                    </td>

                    {/* Deskripsi */}
                    <td className="py-3 px-4 text-slate-600 leading-relaxed text-xs sm:text-sm">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={item.description || ""}
                          onChange={(e) =>
                            handleItemChange(index, "description", e.target.value)
                          }
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <span>{item.description}</span>
                      )}
                    </td>

                    {/* Kuantitas */}
                    <td className="py-3 px-4 text-center font-medium text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          className="w-16 border border-slate-300 rounded px-1 py-1 text-xs font-semibold text-center focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <span>{item.quantity}</span>
                      )}
                    </td>

                    {/* Harga Satuan */}
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, "unitPrice", e.target.value)
                          }
                          className="w-28 border border-slate-300 rounded px-1.5 py-1 text-xs font-medium text-right focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <span>{formatNumberIndo(item.unitPrice)}</span>
                      )}
                    </td>

                    {/* Jumlah (Otomatis: Kuantitas x Harga) */}
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatNumberIndo(item.amount)}
                    </td>

                    {/* Delete row action */}
                    {isEditing && (
                      <td className="no-print py-3 px-2 text-center align-middle print:hidden">
                        {(invoice.items || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada item produk dalam invoice ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Product Button (Shown in edit mode or when user wants to add items) */}
        {isEditing && (
          <div className="no-print mt-3 flex justify-center print:hidden">
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-md text-xs font-semibold transition-colors shadow-2xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Produk</span>
            </button>
          </div>
        )}

        {/* Bottom Section: Notes & Total */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-6">
          {/* Notes / Pesan */}
          <div className="md:col-span-7">
            <div className="font-bold text-indigo-700 text-sm mb-1">
              Pesan
            </div>
            <div className="border border-slate-900 rounded-xs p-3 min-h-[90px] text-xs sm:text-sm text-slate-800 leading-relaxed relative bg-white">
              {isEditing ? (
                <textarea
                  rows={3}
                  value={invoice.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="w-full border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <div>{invoice.notes || "Tidak ada catatan khusus."}</div>
              )}
            </div>
          </div>

          {/* Subtotal & Total */}
          <div className="md:col-span-5 flex flex-col justify-end text-right">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-700 font-semibold">Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {formatRupiah(invoice.subtotal)}
                </span>
              </div>

              {invoice.discount ? (
                <div className="flex justify-between items-center text-sm text-rose-600">
                  <span>Diskon</span>
                  <span>- {formatRupiah(invoice.discount)}</span>
                </div>
              ) : null}

              {invoice.taxAmount ? (
                <div className="flex justify-between items-center text-sm text-slate-700">
                  <span>Pajak ({invoice.taxPercent}%)</span>
                  <span>+ {formatRupiah(invoice.taxAmount)}</span>
                </div>
              ) : null}

              <div className="pt-2 border-t border-slate-300">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black underline tracking-tight text-slate-900">
                    Total
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {formatRupiah(invoice.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature & Closing */}
        <div className="mt-12 flex justify-end">
          <div className="w-60 text-right flex flex-col items-end">
            <div className="text-sm font-semibold text-slate-800 mb-2">
              {isEditing ? (
                <input
                  type="text"
                  value={invoice.signatureTitle || "Hormat Kami,"}
                  onChange={(e) => updateField("signatureTitle", e.target.value)}
                  className="text-right border border-slate-300 rounded px-1 py-0.5 text-xs font-semibold w-28"
                />
              ) : (
                <span>{invoice.signatureTitle || "Hormat Kami,"}</span>
              )}
            </div>

            {/* Signature Image & upload trigger */}
            <input
              type="file"
              ref={sigInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleSignatureUpload}
            />

            {invoice.signatureImage ? (
              <div className="flex flex-col items-end space-y-1">
                <div
                  onClick={() => sigInputRef.current?.click()}
                  className="relative w-40 h-20 my-1 cursor-pointer group"
                  title="Klik untuk mengganti tanda tangan"
                >
                  <Image
                    src={invoice.signatureImage}
                    alt="Tanda Tangan"
                    fill
                    className="object-contain object-right group-hover:opacity-80 transition-opacity"
                    unoptimized
                  />
                  <span className="no-print absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 rounded transition-opacity print:hidden">
                    Ganti TTD
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => sigInputRef.current?.click()}
                  disabled={isUploadingSig}
                  className="no-print text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold print:hidden flex items-center space-x-1 cursor-pointer"
                >
                  {isUploadingSig ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Ganti Tanda Tangan</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => sigInputRef.current?.click()}
                disabled={isUploadingSig}
                className="no-print h-16 w-40 border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/50 rounded-lg flex items-center justify-center text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer print:hidden my-1 space-x-1"
              >
                {isUploadingSig ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Upload TTD</span>
                  </>
                )}
              </button>
            )}

            {/* Signer Name */}
            <div className="text-sm font-bold text-slate-900 mt-1 border-t border-slate-300 pt-1 w-full text-right">
              {isEditing ? (
                <input
                  type="text"
                  value={invoice.signatureName || ""}
                  onChange={(e) => updateField("signatureName", e.target.value)}
                  className="text-right border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold w-full"
                />
              ) : (
                <span>{invoice.signatureName}</span>
              )}
            </div>
          </div>
        </div>

        {/* Floating Save Button Bar at bottom of screen when changes exist */}
        {hasChanges && (
          <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
            <span className="text-xs font-medium text-amber-300">
              ● Ada perubahan yang belum disimpan
            </span>
            <button
              type="button"
              onClick={handleSaveInvoice}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Sekarang</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
