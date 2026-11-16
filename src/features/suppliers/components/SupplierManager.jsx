import React, { useEffect, useState, useCallback } from 'react';
import { supplierService } from '../services/supplierService';
import { Plus, Search, Trash2, Edit2, X } from 'lucide-react';

export const SupplierManager = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [tiposDoc, setTiposDoc] = useState([]);
    const [search, setSearch] = useState('');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        nombre_proveedor: '',
        persona_juridica: true,
        id_tipo_documento: 2,
        documento: '',
        contacto_persona: '',
        correo_proveedor: '',
        telefono_proveedor: ''
    });

    const loadData = useCallback(async () => {
        try {
            const [supRes, tdRes] = await Promise.all([
                supplierService.getAll(),
                supplierService.getTiposDocumento()
            ]);
            setSuppliers(Array.isArray(supRes) ? supRes : []);
            setTiposDoc(Array.isArray(tdRes) ? tdRes : []);
        } catch (err) {
            console.error('Error al cargar proveedores:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenCreateModal = () => {
        setEditing(null);
        setForm({
            nombre_proveedor: '',
            persona_juridica: true,
            id_tipo_documento: tiposDoc[0]?.id_tipo_documento || 2,
            documento: '',
            contacto_persona: '',
            correo_proveedor: '',
            telefono_proveedor: ''
        });
        setIsOpenModal(true);
    };

    const handleOpenEditModal = (sup) => {
        setEditing(sup);
        setForm({
            nombre_proveedor: sup.nombre_proveedor || '',
            persona_juridica: Boolean(sup.persona_juridica),
            id_tipo_documento: sup.id_tipo_documento || tiposDoc[0]?.id_tipo_documento || 2,
            documento: sup.documento || '',
            contacto_persona: sup.contacto_persona || '',
            correo_proveedor: sup.correo_proveedor || '',
            telefono_proveedor: sup.telefono_proveedor || ''
        });
        setIsOpenModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nombre_proveedor: form.nombre_proveedor.trim(),
                persona_juridica: Boolean(form.persona_juridica),
                id_tipo_documento: Number(form.id_tipo_documento),
                documento: form.documento.trim(),
                contacto_persona: form.contacto_persona?.trim() || null,
                correo_proveedor: form.correo_proveedor?.trim() || null,
                telefono_proveedor: form.telefono_proveedor?.trim() || null
            };

            if (editing) {
                await supplierService.update(editing.id_proveedor, payload);
            } else {
                await supplierService.create(payload);
            }
            setIsOpenModal(false);
            setEditing(null);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Desea eliminar este proveedor?')) {
            try {
                await supplierService.delete(id);
                loadData();
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const handleToggleStatus = async (sup) => {
        try {
            await supplierService.updateStatus(sup.id_proveedor, !sup.estado);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredSuppliers = (Array.isArray(suppliers) ? suppliers : []).filter(s => {
        const query = search.toLowerCase();
        const name = (s.nombre_proveedor || '').toLowerCase();
        const doc = (s.documento || '').toLowerCase();
        const contact = (s.contacto_persona || '').toLowerCase();
        const phone = (s.telefono_proveedor || '').toLowerCase();
        const email = (s.correo_proveedor || '').toLowerCase();
        return name.includes(query) || doc.includes(query) || contact.includes(query) || phone.includes(query) || email.includes(query);
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-[#2D1B69]">Proveedores</h1>
                    <p className="text-xs text-[#8B7BAD]">Gestión integral de proveedores y aliados comerciales</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-[#ED498C] hover:opacity-95 shadow-md shadow-[#ED498C]/20 flex items-center gap-2 cursor-pointer transition-opacity"
                >
                    <Plus className="w-4 h-4" /> Nuevo Proveedor
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center gap-3">
                <Search className="w-4 h-4 text-[#8B7BAD]" />
                <input
                    type="text"
                    placeholder="Buscar proveedor por nombre, NIT, contacto o teléfono..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full text-sm outline-none text-[#2D1B69] placeholder:text-[#8B7BAD]"
                />
            </div>

            <div className="bg-white rounded-xl border border-[#BA9CDB]/22 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8F5FD] border-b border-[#BA9CDB]/22">
                        <tr>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">PROVEEDOR</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">TIPO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">CONTACTO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">TELÉFONO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">ESTADO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD] text-right">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#BA9CDB]/15">
                        {loading && suppliers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-xs text-[#8B7BAD]">
                                    Cargando proveedores...
                                </td>
                            </tr>
                        ) : filteredSuppliers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-xs text-[#8B7BAD]">
                                    No se encontraron proveedores
                                </td>
                            </tr>
                        ) : (
                            filteredSuppliers.map(sup => (
                                <tr key={sup.id_proveedor} className="hover:bg-[#FAF8FD] transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-sm text-[#2D1B69]">{sup.nombre_proveedor}</p>
                                        <p className="text-xs text-[#8B7BAD] font-mono">
                                            {sup.tipo_documento || 'NIT'}: {sup.documento}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${sup.persona_juridica ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                            {sup.persona_juridica ? 'Jurídica' : 'Natural'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-[#2D1B69]">
                                        <p className="font-medium">{sup.contacto_persona || 'N/A'}</p>
                                        {sup.correo_proveedor && (
                                            <p className="text-xs text-[#8B7BAD]">{sup.correo_proveedor}</p>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm font-mono text-[#2D1B69]">{sup.telefono_proveedor || 'N/A'}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleToggleStatus(sup)}
                                            title={sup.estado ? 'Desactivar proveedor' : 'Activar proveedor'}
                                            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${sup.estado ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${sup.estado ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleOpenEditModal(sup)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(sup.id_proveedor)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isOpenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white border border-[#BA9CDB]/22 w-full max-w-lg rounded-xl p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-[#BA9CDB]/22">
                            <h2 className="text-lg font-black text-[#2D1B69]">
                                {editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                            </h2>
                            <button onClick={() => setIsOpenModal(false)} className="text-[#8B7BAD] hover:text-[#2D1B69] cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-[#2D1B69]">Nombre del Proveedor / Razón Social</label>
                                <input
                                    type="text"
                                    required
                                    value={form.nombre_proveedor}
                                    onChange={e => setForm({ ...form, nombre_proveedor: e.target.value })}
                                    className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Personería</label>
                                    <select
                                        value={form.persona_juridica ? 'true' : 'false'}
                                        onChange={e => setForm({ ...form, persona_juridica: e.target.value === 'true' })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none cursor-pointer"
                                    >
                                        <option value="true">Persona Jurídica</option>
                                        <option value="false">Persona Natural</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Tipo de Documento</label>
                                    <select
                                        value={form.id_tipo_documento}
                                        onChange={e => setForm({ ...form, id_tipo_documento: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none cursor-pointer"
                                    >
                                        {tiposDoc.map(td => (
                                            <option key={td.id_tipo_documento} value={td.id_tipo_documento}>
                                                {td.descripcion}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Documento / NIT</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.documento}
                                        onChange={e => setForm({ ...form, documento: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm font-mono text-[#2D1B69] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Teléfono</label>
                                    <input
                                        type="text"
                                        value={form.telefono_proveedor}
                                        onChange={e => setForm({ ...form, telefono_proveedor: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm font-mono text-[#2D1B69] outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Persona de Contacto</label>
                                    <input
                                        type="text"
                                        value={form.contacto_persona}
                                        onChange={e => setForm({ ...form, contacto_persona: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        value={form.correo_proveedor}
                                        onChange={e => setForm({ ...form, correo_proveedor: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-[#BA9CDB]/22">
                                <button
                                    type="button"
                                    onClick={() => setIsOpenModal(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-bold bg-[#F3F0F9] text-[#2D1B69] hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl text-sm font-black bg-[#ED498C] text-white shadow-md shadow-[#ED498C]/20 hover:opacity-95 transition-opacity cursor-pointer"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
