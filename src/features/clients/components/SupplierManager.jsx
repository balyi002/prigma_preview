// src/features/suppliers/components/SupplierManager.jsx
import React, { useEffect, useState } from 'react';
import { supplierService } from '../services/supplierService';
import { Plus, Search, Trash2, Edit2, X, Truck } from 'lucide-react';

export const SupplierManager = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [search, setSearch] = useState('');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        nombre_proveedor: '', persona_juridica: true, id_tipo_documento: 2,
        documento: '', contacto_persona: '', correo_proveedor: '', telefono_proveedor: ''
    });

    const loadData = () => supplierService.getAll().then(setSuppliers).catch(console.error);

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await supplierService.update(editing.id_proveedor, form);
            } else {
                await supplierService.create(form);
            }
            setIsOpenModal(false);
            setEditing(null);
            loadData();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Desea eliminar este proveedor?')) {
            try {
                await supplierService.delete(id);
                loadData();
            } catch (err) { alert(err.message); }
        }
    };

    const handleToggleStatus = async (sup) => {
        try {
            await supplierService.updateStatus(sup.id_proveedor, !sup.estado);
            loadData();
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-[#2D1B69]">Proveedores</h1>
                    <p className="text-xs text-[#8B7BAD]">Gestión integral de proveedores y aliados comerciales</p>
                </div>
                <button
                    onClick={() => { setEditing(null); setForm({ nombre_proveedor: '', persona_juridica: true, id_tipo_documento: 2, documento: '', contacto_persona: '', correo_proveedor: '', telefono_proveedor: '' }); setIsOpenModal(true); }}
                    className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-[#ED498C] hover:opacity-95 shadow-md shadow-[#ED498C]/20 flex items-center gap-2 cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Nuevo Proveedor
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center gap-3">
                <Search className="w-4 h-4 text-[#8B7BAD]" />
                <input
                    type="text"
                    placeholder="Buscar proveedor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full text-sm outline-none text-[#2D1B69]"
                />
            </div>

            <div className="bg-white rounded-xl border border-[#BA9CDB]/22 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8F5FD] border-b border-[#BA9CDB]/22">
                        <tr>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">PROVEEDOR</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">CONTACTO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">TELÉFONO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">ESTADO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD] text-right">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#BA9CDB]/15">
                        {suppliers.filter(s => s.nombre_proveedor.toLowerCase().includes(search.toLowerCase())).map(sup => (
                            <tr key={sup.id_proveedor} className="hover:bg-[#FAF8FD]">
                                <td className="p-4">
                                    <p className="font-bold text-sm text-[#2D1B69]">{sup.nombre_proveedor}</p>
                                    <p className="text-xs text-[#8B7BAD] font-mono">NIT: {sup.documento}</p>
                                </td>
                                <td className="p-4 text-sm text-[#2D1B69]">{sup.contacto_persona || 'N/A'}</td>
                                <td className="p-4 text-sm font-mono text-[#2D1B69]">{sup.telefono_proveedor || 'N/A'}</td>
                                <td className="p-4">
                                    <button onClick={() => handleToggleStatus(sup)} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${sup.estado ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${sup.estado ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => { setEditing(sup); setForm(sup); setIsOpenModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(sup.id_proveedor)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isOpenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white border border-[#BA9CDB]/22 w-full max-w-lg rounded-xl p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-[#BA9CDB]/22">
                            <h2 className="text-lg font-black text-[#2D1B69]">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                            <button onClick={() => setIsOpenModal(false)} className="text-[#8B7BAD] hover:text-[#2D1B69]"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-[#2D1B69]">Nombre del Proveedor</label>
                                <input type="text" required value={form.nombre_proveedor} onChange={e => setForm({ ...form, nombre_proveedor: e.target.value })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Documento / NIT</label>
                                    <input type="text" required value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm font-mono text-[#2D1B69] outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Teléfono</label>
                                    <input type="text" value={form.telefono_proveedor} onChange={e => setForm({ ...form, telefono_proveedor: e.target.value })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm font-mono text-[#2D1B69] outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Persona de Contacto</label>
                                    <input type="text" value={form.contacto_persona} onChange={e => setForm({ ...form, contacto_persona: e.target.value })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Correo</label>
                                    <input type="email" value={form.correo_proveedor} onChange={e => setForm({ ...form, correo_proveedor: e.target.value })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-[#BA9CDB]/22">
                                <button type="button" onClick={() => setIsOpenModal(false)} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#F3F0F9] text-[#2D1B69]">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-black bg-[#ED498C] text-white shadow-md shadow-[#ED498C]/20">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};