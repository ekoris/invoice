"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CompanyProfileData, BankAccountData } from "@/lib/types";
import {
  updateCompanyProfile,
  createBankAccount,
  deleteBankAccount,
  getBankAccounts,
} from "@/lib/actions";
import { Building2, CreditCard, Upload, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface SettingsManagerProps {
  initialProfile: CompanyProfileData;
  initialBankAccounts: BankAccountData[];
}

export default function SettingsManager({
  initialProfile,
  initialBankAccounts,
}: SettingsManagerProps) {
  const [profile, setProfile] = useState<CompanyProfileData>(initialProfile);
  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>(initialBankAccounts);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Bank Form state
  const [newBank, setNewBank] = useState<BankAccountData>({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    isDefault: false,
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCompanyProfile(profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan profil perusahaan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logoUrl" | "signatureUrl"
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
        setProfile((prev) => ({ ...prev, [field]: result.url }));
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengunggah gambar.");
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.bankName || !newBank.accountNumber || !newBank.accountHolder) {
      alert("Semua field rekening bank harus diisi.");
      return;
    }

    try {
      await createBankAccount(newBank);
      setNewBank({
        bankName: "",
        accountNumber: "",
        accountHolder: "",
        isDefault: false,
      });
      const updated = await getBankAccounts();
      setBankAccounts(updated as BankAccountData[]);
    } catch (e) {
      console.error(e);
      alert("Gagal menambahkan rekening bank.");
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm("Hapus rekening ini?")) return;
    try {
      await deleteBankAccount(id);
      const updated = await getBankAccounts();
      setBankAccounts(updated as BankAccountData[]);
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus rekening bank.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Pengaturan Bisnis & Rekening
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Atur informasi profil perusahaan default dan daftar rekening bank yang muncul di faktur.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Profil perusahaan berhasil diperbarui!</span>
        </div>
      )}

      {/* Profil Perusahaan Form */}
      <form
        onSubmit={handleProfileSubmit}
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6"
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Profil Perusahaan Utama</span>
          </h2>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Profil"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perusahaan
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lengkap
              </label>
              <textarea
                rows={2}
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
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
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Logo Upload */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Logo Perusahaan
                </label>
                <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti File Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "logoUrl")}
                  />
                </label>
              </div>

              {profile.logoUrl && (
                <div className="relative w-44 h-16 border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center">
                  <Image
                    src={profile.logoUrl}
                    alt="Logo"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>

            {/* Signature Upload */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Tanda Tangan Digital
                </label>
                <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti Tanda Tangan</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "signatureUrl")}
                  />
                </label>
              </div>

              {profile.signatureUrl && (
                <div className="relative w-44 h-16 border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center">
                  <Image
                    src={profile.signatureUrl}
                    alt="Tanda Tangan"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Penandatangan
                </label>
                <input
                  type="text"
                  value={profile.signerName}
                  onChange={(e) => setProfile({ ...profile, signerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan Penandatangan
                </label>
                <input
                  type="text"
                  value={profile.signerRole || ""}
                  placeholder="Pemilik, Lingkara Labs"
                  onChange={(e) => setProfile({ ...profile, signerRole: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Template Settings */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Pengaturan Default Footer & Klausul Tagihan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Syarat & Ketentuan Pembayaran (Default)
              </label>
              <textarea
                rows={4}
                value={profile.termsConditions || ""}
                onChange={(e) => setProfile({ ...profile, termsConditions: e.target.value })}
                placeholder="1. Pembayaran ditransfer sesuai nomor rekening..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bantuan & Konfirmasi Kontak (Default)
                </label>
                <input
                  type="text"
                  value={profile.helpContact || ""}
                  onChange={(e) => setProfile({ ...profile, helpContact: e.target.value })}
                  placeholder="WhatsApp: 082377673248 • Email: eko.rismaryanto15@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ucapan Terima Kasih (Default)
                </label>
                <input
                  type="text"
                  value={profile.thankYouNote || ""}
                  onChange={(e) => setProfile({ ...profile, thankYouNote: e.target.value })}
                  placeholder="Terima kasih atas kerja sama dan kepercayaan Anda bermitra dengan Lingkara Labs."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pajak Default (Non-PKP / Catatan Pajak)
                </label>
                <input
                  type="text"
                  value={profile.taxNote || ""}
                  onChange={(e) => setProfile({ ...profile, taxNote: e.target.value })}
                  placeholder="Bukan PKP (Harga tidak dikenakan PPN)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Pesan Pembayaran / Catatan Khusus Default
          </label>
          <textarea
            rows={2}
            value={profile.defaultNotes}
            onChange={(e) => setProfile({ ...profile, defaultNotes: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </form>

      {/* Bank Accounts Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          <span>Daftar Rekening Bank</span>
        </h2>

        {/* Existing Accounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {bankAccounts.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex justify-between items-start"
            >
              <div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  {b.bankName}
                </span>
                <div className="text-base font-extrabold text-slate-900 mt-1">
                  {b.accountNumber}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">a.n {b.accountHolder}</div>
              </div>
              <button
                onClick={() => b.id && handleDeleteBank(b.id)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                title="Hapus Rekening"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Bank Form */}
        <form
          onSubmit={handleAddBank}
          className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/40 space-y-4"
        >
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            + Tambah Rekening Baru
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nama Bank
              </label>
              <input
                type="text"
                placeholder="Contoh: BCA, Mandiri, BNI"
                value={newBank.bankName}
                onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nomor Rekening
              </label>
              <input
                type="text"
                placeholder="Contoh: 4560962725"
                value={newBank.accountNumber}
                onChange={(e) =>
                  setNewBank({ ...newBank, accountNumber: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Atas Nama (Pemilik)
              </label>
              <input
                type="text"
                placeholder="Contoh: Eko Rismaryanto"
                value={newBank.accountHolder}
                onChange={(e) =>
                  setNewBank({ ...newBank, accountHolder: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan Rekening</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
