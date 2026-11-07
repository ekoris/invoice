"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  InvoiceData,
  InvoiceItemData,
  ClientData,
  CompanyProfileData,
  BankAccountData,
  InvoiceStatus,
} from "@/lib/types";
import { createInvoice, updateInvoice } from "@/lib/actions";
import { formatNumberIndo, formatRupiah, formatDateDDMMYYYY, toInputDate } from "@/lib/formatters";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Upload,
  Eye,
  CheckCircle,
  Building,
  User,
  CreditCard,
  Calendar,
} from "lucide-react";
import InvoiceView from "./InvoiceView";

interface InvoiceFormProps {
  initialInvoice?: InvoiceData;
  companyProfile: CompanyProfileData;
  clients: ClientData[];
  bankAccounts: BankAccountData[];
  isEdit?: boolean;
}

export default function InvoiceForm({
  initialInvoice,
  companyProfile,
  clients,
  bankAccounts,
  isEdit = false,
}: InvoiceFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<InvoiceData>({
    id: initialInvoice?.id,
    invoiceNumber: initialInvoice?.invoiceNumber || "INV/00001",
    title: initialInvoice?.title || "Invoice",
    issueDate: initialInvoice?.issueDate || "",
    dueDate: initialInvoice?.dueDate || "",
    status: initialInvoice?.status || "DRAFT",

    companyName: initialInvoice?.companyName || companyProfile.name,
    companyAddress: initialInvoice?.companyAddress ?? companyProfile.address,
    companyPhone: initialInvoice?.companyPhone ?? companyProfile.phone,
    companyEmail: initialInvoice?.companyEmail ?? companyProfile.email,
    companyLogo: initialInvoice?.companyLogo ?? (companyProfile.logoUrl || "/assets/default-logo.png"),

    clientId: initialInvoice?.clientId || (clients[0]?.id || ""),
    clientName: initialInvoice?.clientName || (clients[0]?.name || ""),
    clientAddress: initialInvoice?.clientAddress ?? (clients[0]?.address || ""),
    clientPhone: initialInvoice?.clientPhone ?? (clients[0]?.phone || ""),
    clientEmail: initialInvoice?.clientEmail ?? (clients[0]?.email || ""),

    items: initialInvoice?.items && initialInvoice.items.length > 0
      ? initialInvoice.items
      : [
          {
            product: "Pembayaran Termin I (DP 30%) - Sistem Site VHS",
            description:
              "Pembayaran uang muka (30%) untuk Lisensi, Kustomisasi, Setup Infrastruktur, Deployment & Maintenance Sistem Site VHS (Ref: Penawaran 001/LNG/XI/2026)",
            quantity: 1,
            unitPrice: 4800000,
            amount: 4800000,
            sortOrder: 0,
          },
        ],

    subtotal: initialInvoice?.subtotal || 4800000,
    taxPercent: initialInvoice?.taxPercent || 0,
    taxAmount: initialInvoice?.taxAmount || 0,
    discount: initialInvoice?.discount || 0,
    total: initialInvoice?.total || 4800000,

    notes: initialInvoice?.notes ?? companyProfile.defaultNotes,
    signatureImage:
      initialInvoice?.signatureImage ?? (companyProfile.signatureUrl || "/assets/default-signature.png"),
    signatureTitle: initialInvoice?.signatureTitle || "Hormat Kami,",
    signatureName: initialInvoice?.signatureName || companyProfile.signerName,
  });

  // Initialize dates safely on mount if not provided
  React.useEffect(() => {
    if (!formData.issueDate) {
      const today = formatDateDDMMYYYY(new Date());
      const due = formatDateDDMMYYYY(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
      setFormData((prev) => ({
        ...prev,
        issueDate: prev.issueDate || today,
        dueDate: prev.dueDate || due,
      }));
    }
  }, [formData.issueDate]);

  // Calculate totals whenever items, discount, or tax change
  const recalculateTotals = (
    items: InvoiceItemData[],
    discount = formData.discount || 0,
    taxPercent = formData.taxPercent || 0
  ) => {
    const subtotal = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const taxAmount = (subtotal - discount) * (taxPercent / 100);
    const total = Math.max(0, subtotal - discount + taxAmount);

    setFormData((prev) => ({
      ...prev,
      items,
      subtotal,
      taxPercent,
      taxAmount,
      discount,
      total,
    }));
  };

  // Item changes
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItemData,
    value: string | number
  ) => {
    const updatedItems = [...formData.items];
    const currentItem = { ...updatedItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      const q = field === "quantity" ? Number(value) : currentItem.quantity;
      const p = field === "unitPrice" ? Number(value) : currentItem.unitPrice;
      currentItem.amount = (Number(q) || 0) * (Number(p) || 0);
    }

    updatedItems[index] = currentItem;
    recalculateTotals(updatedItems);
  };

  const handleAddItem = () => {
    const newItems: InvoiceItemData[] = [
      ...formData.items,
      {
        product: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        sortOrder: formData.items.length,
      },
    ];
    recalculateTotals(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      alert("Invoice setidaknya harus memiliki satu produk.");
      return;
    }
    const updated = formData.items.filter((_, idx) => idx !== index);
    recalculateTotals(updated);
  };

  // Client Selection
  const handleClientSelect = (clientId: string) => {
    if (!clientId) return;
    const selected = clients.find((c) => c.id === clientId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        clientId: selected.id,
        clientName: selected.name,
        clientAddress: selected.address || "",
        clientPhone: selected.phone || "",
        clientEmail: selected.email || "",
      }));
    }
  };

  // Bank Selection helper
  const handleBankPreset = (bank: BankAccountData) => {
    const text = `Kirim ke Rekening ${bank.bankName} a.n ${bank.accountHolder} no. rek ${bank.accountNumber}`;
    setFormData((prev) => ({ ...prev, notes: text }));
  };

  // File Upload Helper (Logo & Signature)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "signature"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (result.success && result.url) {
        if (type === "logo") {
          setFormData((prev) => ({ ...prev, companyLogo: result.url }));
        } else {
          setFormData((prev) => ({ ...prev, signatureImage: result.url }));
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Gagal mengunggah gambar.");
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNumber.trim()) {
      alert("Nomor invoice harus diisi.");
      return;
    }
    if (!formData.clientName.trim()) {
      alert("Nama klien harus diisi.");
      return;
    }
    if (formData.items.some((i) => !i.product.trim())) {
      alert("Semua baris produk harus memiliki nama produk.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && formData.id) {
        await updateInvoice(formData.id, formData);
        router.push(`/invoices/${formData.id}`);
      } else {
        const created = await createInvoice(formData);
        router.push(`/invoices/${created.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan invoice.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEdit ? `Edit Invoice: ${formData.invoiceNumber}` : "Buat Invoice Baru"}
            </h1>
            <p className="text-xs text-slate-500">
              Isi data faktur penagihan secara lengkap. Layout cetak akan otomatis mengikuti standar.
            </p>
          </div>
        </div>

        {/* Tab switch between Editor & Live Preview */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "edit"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Form Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "preview"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lihat Preview Faktur</span>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-xs hover:shadow transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Terbitkan Invoice"}</span>
          </button>
        </div>
      </div>

      {activeTab === "preview" ? (
        <div className="bg-slate-100/60 p-6 rounded-2xl border border-slate-200">
          <div className="text-center mb-4 text-xs font-medium text-slate-500">
            Preview ini adalah tampilan langsung dokumen yang akan dicetak atau dilihat klien:
          </div>
          <InvoiceView invoice={formData} showEditIcons={true} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Header & Referensi */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Informasi Faktur & Status</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Referensi
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNumber: e.target.value })
                  }
                  required
                  placeholder="INV/00001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Faktur
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Invoice"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Faktur
                </label>
                <input
                  type="date"
                  value={toInputDate(formData.issueDate)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      issueDate: formatDateDDMMYYYY(e.target.value),
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tgl. Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={toInputDate(formData.dueDate)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dueDate: formatDateDDMMYYYY(e.target.value),
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4 flex items-center space-x-4 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Status Pembayaran:</span>
                <div className="flex flex-wrap gap-2">
                  {(["DRAFT", "TERKIRIM", "LUNAS", "JATUH_TEMPO", "BATAL"] as InvoiceStatus[]).map(
                    (st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setFormData({ ...formData, status: st })}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                          formData.status === st
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Informasi Perusahaan & Tagihan Kepada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informasi Perusahaan */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>Informasi Perusahaan</span>
                </h2>
                <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "logo")}
                  />
                </label>
              </div>

              {formData.companyLogo && (
                <div className="relative w-36 h-12 border border-slate-200 rounded-lg p-1 bg-slate-50/50">
                  <Image
                    src={formData.companyLogo}
                    alt="Logo"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Perusahaan
                </label>
                <textarea
                  rows={2}
                  value={formData.companyAddress || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, companyAddress: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="text"
                    value={formData.companyPhone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, companyPhone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.companyEmail || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, companyEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Tagihan Kepada (Client) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Tagihan Kepada (Klien)</span>
                </h2>
                {clients.length > 0 && (
                  <select
                    onChange={(e) => handleClientSelect(e.target.value)}
                    value={formData.clientId || ""}
                    className="text-xs border border-indigo-200 bg-indigo-50/50 text-indigo-700 rounded-lg px-2.5 py-1 font-semibold focus:outline-hidden"
                  >
                    <option value="">-- Pilih Klien Tersimpan --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pelanggan / Perusahaan
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  required
                  placeholder="PPA-VHS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Klien
                </label>
                <textarea
                  rows={2}
                  value={formData.clientAddress || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, clientAddress: e.target.value })
                  }
                  placeholder="Mangkalapi, Kec. Kusan Hulu, Tanah Bumbu, Kalimantan Selatan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Telepon Klien
                  </label>
                  <input
                    type="text"
                    value={formData.clientPhone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, clientPhone: e.target.value })
                    }
                    placeholder="085335142363"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Klien
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, clientEmail: e.target.value })
                    }
                    placeholder="email@perusahaan.pelanggan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Daftar Produk / Item Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Item Produk / Layanan
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Baris Produk</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Item #{index + 1}
                    </span>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Produk
                      </label>
                      <input
                        type="text"
                        value={item.product}
                        onChange={(e) =>
                          handleItemChange(index, "product", e.target.value)
                        }
                        required
                        placeholder="Contoh: Pembayaran Termin I (DP 30%) - Sistem Site VHS"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kuantitas
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        required
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Harga Satuan (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, "unitPrice", e.target.value)
                        }
                        required
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jumlah
                      </label>
                      <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 text-right">
                        {formatRupiah(item.amount)}
                      </div>
                    </div>

                    <div className="md:col-span-12">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Deskripsi Rinci
                      </label>
                      <textarea
                        rows={2}
                        value={item.description || ""}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        placeholder="Deskripsi layanan atau rincian pekerjaan..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center space-x-1.5 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Produk</span>
              </button>
            </div>
          </div>

          {/* Section 4: Catatan & Pembayaran vs Subtotal/Total */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Notes / Pesan Rekening */}
            <div className="md:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Pesan / Instruksi Pembayaran</span>
                </h2>
                {bankAccounts.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-slate-500">Preset:</span>
                    {bankAccounts.map((b) => (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => handleBankPreset(b)}
                        className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 px-2 py-0.5 rounded font-medium transition-colors"
                      >
                        {b.bankName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Isi Pesan / Nomor Rekening
                </label>
                <textarea
                  rows={3}
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Kirim ke Rekening BCA a.n Eko Rismaryanto no. rek 4560962725"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Tanda Tangan */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">
                    Tanda Tangan & Penandatangan
                  </label>
                  <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Tanda Tangan</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "signature")}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Kalimat Penutup
                    </label>
                    <input
                      type="text"
                      value={formData.signatureTitle || "Hormat Kami,"}
                      onChange={(e) =>
                        setFormData({ ...formData, signatureTitle: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Nama Penandatangan
                    </label>
                    <input
                      type="text"
                      value={formData.signatureName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, signatureName: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {formData.signatureImage && (
                  <div className="flex items-center space-x-3 pt-1">
                    <div className="relative w-32 h-14 border border-slate-200 rounded-lg p-1 bg-slate-50">
                      <Image
                        src={formData.signatureImage}
                        alt="Signature Preview"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs text-slate-500">Tanda tangan digital aktif</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subtotal & Total Calculations */}
            <div className="md:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Ringkasan Biaya
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(formData.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <label className="text-slate-600 font-medium">Diskon (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.discount || 0}
                    onChange={(e) =>
                      recalculateTotals(
                        formData.items,
                        Number(e.target.value) || 0,
                        formData.taxPercent
                      )
                    }
                    className="w-32 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                  />
                </div>

                <div className="flex justify-between items-center text-sm">
                  <label className="text-slate-600 font-medium">Pajak (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={formData.taxPercent || 0}
                    onChange={(e) =>
                      recalculateTotals(
                        formData.items,
                        formData.discount,
                        Number(e.target.value) || 0
                      )
                    }
                    className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                  />
                </div>

                {formData.taxAmount ? (
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Nominal Pajak</span>
                    <span>+{formatRupiah(formData.taxAmount)}</span>
                  </div>
                ) : null}

                <div className="pt-3 border-t-2 border-slate-900">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-black underline tracking-tight text-slate-900">
                      Total
                    </span>
                    <span className="text-2xl font-black text-indigo-700 tracking-tight">
                      {formatRupiah(formData.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all"
                >
                  {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Terbitkan Invoice"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
