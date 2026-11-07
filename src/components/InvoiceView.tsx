"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { InvoiceData } from "@/lib/types";
import { formatNumberIndo, formatRupiah } from "@/lib/formatters";
import { Edit2, Printer, ArrowLeft, CheckCircle2, Clock, Send, Ban } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { updateInvoiceStatus } from "@/lib/actions";

interface InvoiceViewProps {
  invoice: InvoiceData;
  showEditIcons?: boolean;
  onEditField?: (field: string) => void;
}

export default function InvoiceView({
  invoice: initialInvoice,
  showEditIcons = true,
}: InvoiceViewProps) {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editIconsVisible, setEditIconsVisible] = useState(showEditIcons);

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: "DRAFT" | "TERKIRIM" | "LUNAS" | "JATUH_TEMPO" | "BATAL") => {
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

  // Pencil edit icon matching the screenshot
  const PencilIcon = () => {
    if (!editIconsVisible) return null;
    return (
      <span className="no-print inline-block ml-1 text-amber-500 hover:text-amber-600 transition-colors cursor-pointer print:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5 inline"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
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

        <div className="flex items-center space-x-2">
          {/* Quick status dropdown / actions */}
          <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-1 bg-slate-50 text-xs">
            <button
              onClick={() => handleStatusChange("DRAFT")}
              disabled={isUpdatingStatus || invoice.status === "DRAFT"}
              className={`px-2 py-1 rounded transition-colors ${
                invoice.status === "DRAFT" ? "bg-amber-100 text-amber-800 font-bold" : "hover:bg-white text-slate-600"
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => handleStatusChange("TERKIRIM")}
              disabled={isUpdatingStatus || invoice.status === "TERKIRIM"}
              className={`px-2 py-1 rounded transition-colors ${
                invoice.status === "TERKIRIM" ? "bg-blue-100 text-blue-800 font-bold" : "hover:bg-white text-slate-600"
              }`}
            >
              Terkirim
            </button>
            <button
              onClick={() => handleStatusChange("LUNAS")}
              disabled={isUpdatingStatus || invoice.status === "LUNAS"}
              className={`px-2 py-1 rounded transition-colors ${
                invoice.status === "LUNAS" ? "bg-emerald-100 text-emerald-800 font-bold" : "hover:bg-white text-slate-600"
              }`}
            >
              Lunas
            </button>
            <button
              onClick={() => handleStatusChange("JATUH_TEMPO")}
              disabled={isUpdatingStatus || invoice.status === "JATUH_TEMPO"}
              className={`px-2 py-1 rounded transition-colors ${
                invoice.status === "JATUH_TEMPO" ? "bg-rose-100 text-rose-800 font-bold" : "hover:bg-white text-slate-600"
              }`}
            >
              Jatuh Tempo
            </button>
          </div>

          <button
            type="button"
            onClick={() => setEditIconsVisible(!editIconsVisible)}
            className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium"
          >
            {editIconsVisible ? "Sembunyikan Ikon Edit" : "Tampilkan Ikon Edit"}
          </button>

          {invoice.id && (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Invoice</span>
            </Link>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Invoice Document Paper Container */}
      <div className="print-container bg-white rounded-2xl shadow-md border border-slate-200 p-8 sm:p-12 text-slate-900 transition-all font-sans">
        {/* Top Header: Logo on left, Title & Metadata on right */}
        <div className="flex justify-between items-start">
          {/* Logo */}
          <div className="flex flex-col items-start">
            {invoice.companyLogo ? (
              <div className="relative w-44 h-16">
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
          </div>

          {/* Title & Metadata */}
          <div className="flex flex-col items-end">
            <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight mb-4 flex items-center">
              {invoice.title || "Invoice"}
              <PencilIcon />
            </h1>

            <div className="text-sm space-y-1 text-slate-800">
              <div className="flex justify-between items-center space-x-6">
                <span className="text-slate-700 text-right font-normal">Referensi</span>
                <span className="font-semibold text-slate-900 min-w-[100px] text-right">
                  {invoice.invoiceNumber}
                  <PencilIcon />
                </span>
              </div>
              <div className="flex justify-between items-center space-x-6">
                <span className="text-slate-700 text-right font-normal">Tanggal</span>
                <span className="font-semibold text-slate-900 min-w-[100px] text-right">
                  {invoice.issueDate}
                  <PencilIcon />
                </span>
              </div>
              <div className="flex justify-between items-center space-x-6">
                <span className="text-slate-700 text-right font-normal">Tgl. Jatuh Tempo</span>
                <span className="font-semibold text-slate-900 min-w-[100px] text-right">
                  {invoice.dueDate}
                  <PencilIcon />
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
            <div className="space-y-1 text-sm text-slate-700">
              <div className="font-bold text-indigo-700 text-base">
                {invoice.companyName}
                <PencilIcon />
              </div>
              {invoice.companyAddress && (
                <div>
                  {invoice.companyAddress}
                  <PencilIcon />
                </div>
              )}
              {invoice.companyPhone && (
                <div>
                  <span className="text-slate-900">Telp: </span>
                  {invoice.companyPhone}
                  <PencilIcon />
                </div>
              )}
              {invoice.companyEmail && (
                <div>
                  <span className="text-slate-900">Email: </span>
                  {invoice.companyEmail}
                  <PencilIcon />
                </div>
              )}
            </div>
          </div>

          {/* Tagihan Kepada */}
          <div>
            <div className="font-bold text-slate-900 text-base pb-1 border-b-2 border-slate-900 mb-3">
              Tagihan Kepada
            </div>
            <div className="space-y-1 text-sm text-slate-700">
              <div className="font-bold text-indigo-700 text-base">
                {invoice.clientName}
                <PencilIcon />
              </div>
              {invoice.clientAddress && (
                <div>
                  {invoice.clientAddress}
                  <PencilIcon />
                </div>
              )}
              {invoice.clientPhone && (
                <div>
                  <span className="text-slate-900">Telp: </span>
                  {invoice.clientPhone}
                  <PencilIcon />
                </div>
              )}
              {invoice.clientEmail && (
                <div>
                  <span className="text-slate-900">Email: </span>
                  {invoice.clientEmail}
                  <PencilIcon />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-8 overflow-hidden rounded-xs border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#242b47] text-white text-xs sm:text-sm font-semibold">
                <th className="py-3 px-4 w-[28%]">
                  Produk <PencilIcon />
                </th>
                <th className="py-3 px-4 w-[42%]">
                  Deskripsi <PencilIcon />
                </th>
                <th className="py-3 px-4 text-center w-[10%]">
                  Kuantitas <PencilIcon />
                </th>
                <th className="py-3 px-4 text-right w-[10%]">Harga</th>
                <th className="py-3 px-4 text-right w-[10%]">
                  Jumlah <PencilIcon />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <tr key={item.id || index} className="align-top hover:bg-slate-50/50">
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      {item.product}
                      <PencilIcon />
                    </td>
                    <td className="py-4 px-4 text-slate-600 leading-relaxed text-xs sm:text-sm">
                      {item.description}
                      <PencilIcon />
                    </td>
                    <td className="py-4 px-4 text-center font-medium text-slate-900">
                      {item.quantity}
                      <PencilIcon />
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-slate-900">
                      {formatNumberIndo(item.unitPrice)}
                      <PencilIcon />
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-slate-900">
                      {formatNumberIndo(item.amount)}
                      <PencilIcon />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada item produk dalam invoice ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Product Button (Shown in edit/preview interactive mode) */}
        {invoice.id && (
          <div className="no-print mt-3 flex justify-center">
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-md text-xs font-semibold transition-colors"
            >
              <span>+ Tambah Produk</span>
            </Link>
          </div>
        )}

        {/* Bottom Section: Notes & Total */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-6">
          {/* Notes / Pesan */}
          <div className="md:col-span-7">
            <div className="font-bold text-indigo-700 text-sm mb-1 flex items-center">
              Pesan
              <PencilIcon />
            </div>
            <div className="border border-slate-900 rounded-xs p-3 min-h-[90px] text-xs sm:text-sm text-slate-800 leading-relaxed relative bg-white">
              {invoice.notes || "Tidak ada catatan khusus."}
              <div className="absolute right-2 bottom-2">
                <PencilIcon />
              </div>
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
          <div className="w-56 text-right flex flex-col items-end">
            <div className="text-sm font-semibold text-slate-800 mb-2 flex items-center">
              {invoice.signatureTitle || "Hormat Kami,"}
              <PencilIcon />
            </div>

            {invoice.signatureImage ? (
              <div className="relative w-40 h-20 my-1">
                <Image
                  src={invoice.signatureImage}
                  alt="Tanda Tangan"
                  fill
                  className="object-contain object-right"
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center text-xs text-slate-400 italic">
                (Tanda Tangan Digital)
              </div>
            )}

            {invoice.signatureName && (
              <div className="text-sm font-bold text-slate-900 mt-1 border-t border-slate-300 pt-1 w-full text-right">
                {invoice.signatureName}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
