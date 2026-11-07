"use client";

import React, { useState } from "react";
import { ClientData } from "@/lib/types";
import { createClient, updateClient, deleteClient, getClients } from "@/lib/actions";
import { Plus, Edit2, Trash2, Mail, Phone, MapPin, Search } from "lucide-react";

interface ClientsManagerProps {
  initialClients: ClientData[];
}

export default function ClientsManager({ initialClients }: ClientsManagerProps) {
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);

  const [formData, setFormData] = useState<ClientData>({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const refreshData = async () => {
    try {
      const data = await getClients();
      setClients(data as ClientData[]);
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (client?: ClientData) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        address: client.address || "",
        phone: client.phone || "",
        email: client.email || "",
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingClient && editingClient.id) {
        await updateClient(editingClient.id, formData);
      } else {
        await createClient(formData);
      }
      closeModal();
      await refreshData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data pelanggan.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus pelanggan "${name}"?`)) return;
    try {
      await deleteClient(id);
      await refreshData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus pelanggan.");
    }
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Data Pelanggan (Klien)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Simpan data perusahaan / klien agar dapat dipilih otomatis saat membuat faktur baru.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-100 hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, email, no. telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Total: {filtered.length} pelanggan
        </span>
      </div>

      {/* Grid Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openModal(client)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => client.id && handleDelete(client.id, client.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">
                    {client.name}
                  </h3>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {client.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{client.address}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          Belum ada data pelanggan tersimpan.
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              {editingClient ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Perusahaan / Klien *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PPA-VHS"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={3}
                  placeholder="Mangkalapi, Kec. Kusan Hulu, Tanah Bumbu, Kalimantan Selatan"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  placeholder="085335142363"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@perusahaan.pelanggan"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
