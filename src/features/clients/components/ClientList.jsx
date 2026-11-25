import React, { useEffect, useState, useCallback } from 'react';
import { clientService } from '../services/clientService';
import { Search, Trash2, Edit2, X, Users, UserCheck, UserX } from 'lucide-react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FeedbackToast from '../../../components/ui/FeedbackToast';

export const ClientList = () => {
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [nombreCliente, setNombreCliente] = useState('');
    const [documento, setDocumento] = useState('');
    const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', variant: 'danger', confirmLabel: 'Confirmar', onConfirm: null });
    const [toast, setToast] = useState(null);

    const loadData = useCallback(async () => {
        try {
            const data = await clientService.getAll();
            setClients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error al cargar clientes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenEditModal = (client) => {
        setEditing(client);
        setNombreCliente(client.nombre_cliente || '');
        setDocumento(client.documento || (client.id_cliente ? `10${String(client.id_cliente).padStart(8, '0')}` : ''));
        setIsOpenModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = nombreCliente.trim();
        if (!trimmed) {
            setToast({ type: 'warning', message: 'El nombre del cliente no puede estar vacío.' });
            return;
        }

        try {
            if (editing) {
                await clientService.update(editing.id_cliente, {
                    nombre_cliente: trimmed,
                    documento: documento.trim() || null
                });
                setToast({ type: 'success', message: `Cliente "${trimmed}" actualizado exitosamente.` });
            }
            setIsOpenModal(false);
            setEditing(null);
            setNombreCliente('');
            setDocumento('');
            loadData();
        } catch (err) {
            setToast({ type: 'error', message: err.message || 'Error al actualizar cliente' });
        }
    };

    const handleDelete = (client) => {
        setConfirmState({
            open: true,
            title: '¿Eliminar cliente?',
            message: `¿Estás seguro de que deseas eliminar al cliente "${client.nombre_cliente}"? Si tiene pedidos o compras asociadas no podrá ser eliminado.`,
            variant: 'danger',
            confirmLabel: 'Eliminar',
            onConfirm: async () => {
                try {
                    await clientService.delete(client.id_cliente);
                    setConfirmState({ open: false, title: '', message: '', onConfirm: null });
                    setToast({ type: 'success', message: `Cliente "${client.nombre_cliente}" eliminado exitosamente.` });
                    loadData();
                } catch (err) {
                    setConfirmState({ open: false, title: '', message: '', onConfirm: null });
                    setToast({ type: 'error', message: err.message || 'Error al eliminar cliente' });
                }
            }
        });
    };

    const handleToggleStatus = (client) => {
        const nuevoEstado = !client.estado;
        setConfirmState({
            open: true,
            title: nuevoEstado ? '¿Activar cliente?' : '¿Desactivar cliente?',
            message: `¿Estás seguro de que deseas ${nuevoEstado ? 'activar' : 'desactivar'} al cliente "${client.nombre_cliente}"?`,
            variant: nuevoEstado ? 'primary' : 'warning',
            confirmLabel: nuevoEstado ? 'Activar' : 'Desactivar',
            onConfirm: async () => {
                try {
                    await clientService.updateStatus(client.id_cliente, nuevoEstado);
                    setConfirmState({ open: false, title: '', message: '', onConfirm: null });
                    setToast({ type: 'success', message: `Estado del cliente "${client.nombre_cliente}" actualizado correctamente.` });
                    loadData();
                } catch (err) {
                    setConfirmState({ open: false, title: '', message: '', onConfirm: null });
                    setToast({ type: 'error', message: err.message || 'Error al actualizar estado del cliente' });
                }
            }
        });
    };

    const safeClients = Array.isArray(clients) ? clients : [];
    const totalClients = safeClients.length;
    const activeClients = safeClients.filter(c => Boolean(c.estado)).length;
    const inactiveClients = safeClients.filter(c => !c.estado).length;

    const filtered = safeClients.filter(c => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        const name = (c.nombre_cliente || '').toLowerCase();
        const doc = (c.documento ? String(c.documento) : (c.id_cliente ? `10${String(c.id_cliente).padStart(8, '0')}` : '')).toLowerCase();
        return name.includes(q) || doc.includes(q);
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-[#2D1B69]">Clientes</h1>
                    <p className="text-xs text-[#8B7BAD]">Gestión integral de clientes y compradores registrados</p>
                </div>
            </div>

            {/* Tarjetas de Métricas Dinámicas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#8B7BAD] font-bold">Total Clientes</p>
                        <h3 className="text-xl font-black text-[#2D1B69]">{totalClients}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6B21A8] flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#8B7BAD] font-bold">Clientes Activos</p>
                        <h3 className="text-xl font-black text-[#2D1B69]">{activeClients}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <UserCheck className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#8B7BAD] font-bold">Clientes Inactivos</p>
                        <h3 className="text-xl font-black text-[#2D1B69]">{inactiveClients}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                        <UserX className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Buscador */}
            <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center gap-3">
                <Search className="w-4 h-4 text-[#8B7BAD]" />
                <input
                    type="text"
                    placeholder="Buscar cliente por nombre o documento..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full text-sm outline-none text-[#2D1B69] placeholder:text-[#8B7BAD]"
                />
            </div>

            {/* Tabla de Clientes */}
            <div className="bg-white rounded-xl border border-[#BA9CDB]/22 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8F5FD] border-b border-[#BA9CDB]/22">
                        <tr>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">CLIENTE</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">DOCUMENTO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">ESTADO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD] text-right">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#BA9CDB]/15">
                        {loading && safeClients.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-xs text-[#8B7BAD]">
                                    Cargando clientes...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-xs text-[#8B7BAD]">
                                    No se encontraron clientes
                                </td>
                            </tr>
                        ) : (
                            filtered.map(client => (
                                <tr key={client.id_cliente} className="hover:bg-[#FAF8FD] transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#ED498C]/15 text-[#ED498C] font-black flex items-center justify-center text-xs">
                                            {client.nombre_cliente ? client.nombre_cliente.substring(0, 2).toUpperCase() : 'CL'}
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm text-[#2D1B69] block">{client.nombre_cliente}</span>
                                            <span className="text-[11px] text-[#8B7BAD]">ID: #{client.id_cliente}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono text-xs font-bold text-[#2D1B69] bg-[#F8F5FD] px-2.5 py-1 rounded-lg border border-[#BA9CDB]/20">
                                            {client.documento ? `CC: ${client.documento}` : (client.id_cliente ? `CC: 10${String(client.id_cliente).padStart(8, '0')}` : 'No registrado')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleToggleStatus(client)}
                                            title={client.estado ? 'Desactivar cliente' : 'Activar cliente'}
                                            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${client.estado ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${client.estado ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleOpenEditModal(client)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client)}
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

            {/* Modal de Edición de Cliente */}
            {isOpenModal && editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white border border-[#BA9CDB]/22 w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-[#BA9CDB]/22">
                            <div>
                                <h2 className="text-lg font-black text-[#2D1B69]">Editar Cliente</h2>
                                <p className="text-xs text-[#8B7BAD]">Modifica los datos del cliente registrado</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsOpenModal(false);
                                    setEditing(null);
                                }}
                                className="text-[#8B7BAD] hover:text-[#2D1B69] cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[#2D1B69]">Nombre Completo del Cliente <span className="text-[#ED498C]">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Juan Pérez"
                                    value={nombreCliente}
                                    onChange={e => setNombreCliente(e.target.value)}
                                    className="w-full px-3 py-2 mt-1 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#2D1B69]">Documento de Identidad (Cédula)</label>
                                <input
                                    type="text"
                                    placeholder="Ej. 1098234567"
                                    value={documento}
                                    onChange={e => setDocumento(e.target.value)}
                                    className="w-full px-3 py-2 mt-1 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm font-mono text-[#2D1B69] outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-[#BA9CDB]/22">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOpenModal(false);
                                        setEditing(null);
                                    }}
                                    className="px-4 py-2 rounded-xl text-sm font-bold bg-[#F3F0F9] text-[#2D1B69] hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl text-sm font-black bg-[#ED498C] text-white shadow-md shadow-[#ED498C]/20 hover:opacity-95 transition-opacity cursor-pointer"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Diálogo de Confirmación */}
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                confirmLabel={confirmState.confirmLabel}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState({ open: false, title: '', message: '', variant: 'danger', confirmLabel: 'Confirmar', onConfirm: null })}
            />

            {/* Notificaciones Toast */}
            <FeedbackToast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
};
