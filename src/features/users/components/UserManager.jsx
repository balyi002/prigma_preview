import React, { useEffect, useState, useCallback } from 'react';
import { userService } from '../services/userService';
import { Plus, Search, Trash2, Edit2, X } from 'lucide-react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import FeedbackToast from '../../../components/ui/FeedbackToast';

export const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [tiposDoc, setTiposDoc] = useState([]);
    const [search, setSearch] = useState('');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', variant: 'danger', confirmLabel: 'Confirmar', onConfirm: null });
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({
        nombre_usuario: '',
        apellido_usuario: '',
        id_tipo_documento: 1,
        documento: '',
        telefono: '',
        contrasena: '',
        id_rol: 2
    });

    const loadData = useCallback(async () => {
        try {
            const [uRes, rRes, tdRes] = await Promise.all([
                userService.getAll(),
                userService.getRoles(),
                userService.getTiposDocumento()
            ]);
            setUsers(Array.isArray(uRes) ? uRes : []);
            setRoles(Array.isArray(rRes) ? rRes : []);
            setTiposDoc(Array.isArray(tdRes) ? tdRes : []);
        } catch (err) {
            console.error('Error cargando datos de usuarios:', err);
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
            nombre_usuario: '',
            apellido_usuario: '',
            id_tipo_documento: tiposDoc[0]?.id_tipo_documento || 1,
            documento: '',
            telefono: '',
            contrasena: '',
            id_rol: roles[0]?.id_rol || 2
        });
        setIsOpenModal(true);
    };

    const handleOpenEditModal = (usr) => {
        setEditing(usr);
        setForm({
            nombre_usuario: usr.nombre_usuario || '',
            apellido_usuario: usr.apellido_usuario || '',
            id_tipo_documento: usr.id_tipo_documento || tiposDoc[0]?.id_tipo_documento || 1,
            documento: usr.documento || '',
            telefono: usr.telefono || '',
            contrasena: '',
            id_rol: usr.id_rol || roles[0]?.id_rol || 2
        });
        setIsOpenModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                const payload = {
                    nombre_usuario: form.nombre_usuario.trim(),
                    apellido_usuario: form.apellido_usuario.trim(),
                    id_tipo_documento: Number(form.id_tipo_documento),
                    documento: form.documento.trim(),
                    telefono: form.telefono?.trim() || null,
                    id_rol: Number(form.id_rol)
                };
                await userService.update(editing.id_usuario, payload);
                setToast({ type: 'success', message: `Usuario "${payload.nombre_usuario} ${payload.apellido_usuario}" actualizado exitosamente.` });
            } else {
                const payload = {
                    nombre_usuario: form.nombre_usuario.trim(),
                    apellido_usuario: form.apellido_usuario.trim(),
                    id_tipo_documento: Number(form.id_tipo_documento),
                    documento: form.documento.trim(),
                    telefono: form.telefono?.trim() || null,
                    contrasena: form.contrasena,
                    id_rol: Number(form.id_rol)
                };
                await userService.create(payload);
                setToast({ type: 'success', message: `Usuario "${payload.nombre_usuario} ${payload.apellido_usuario}" creado exitosamente.` });
            }
            setIsOpenModal(false);
            setEditing(null);
            loadData();
        } catch (err) {
            setToast({ type: 'error', message: err.message || 'Error al guardar el usuario' });
        }
    };

    const handleDelete = (usr) => {
        setConfirmState({
            open: true,
            title: `¿Eliminar usuario?`,
            message: `¿Estás seguro de que deseas eliminar permanentemente a "${usr.nombre_usuario} ${usr.apellido_usuario}"? Esta acción no se puede deshacer.`,
            variant: 'danger',
            confirmLabel: 'Eliminar',
            onConfirm: async () => {
                try {
                    await userService.delete(usr.id_usuario);
                    setConfirmState({ open: false, title: '', message: '', onConfirm: null });
                    setToast({ type: 'success', message: `Usuario "${usr.nombre_usuario}" eliminado exitosamente.` });
                    loadData();
                } catch (err) {
                    setConfirmState({ open: false, title: '', message: '', onConfirm: null });
                    setToast({ type: 'error', message: err.message || 'Error al eliminar usuario' });
                }
            }
        });
    };

    const handleToggleStatus = (usr) => {
        const nuevoEstado = !usr.estado;
        setConfirmState({
            open: true,
            title: nuevoEstado ? '¿Activar usuario?' : '¿Desactivar usuario?',
            message: `¿Estás seguro de que deseas ${nuevoEstado ? 'activar' : 'desactivar'} el acceso para "${usr.nombre_usuario} ${usr.apellido_usuario}"?`,
            variant: nuevoEstado ? 'primary' : 'danger',
            confirmLabel: nuevoEstado ? 'Activar' : 'Desactivar',
            onConfirm: async () => {
                try {
                    await userService.updateStatus(usr.id_usuario, nuevoEstado);
                    setConfirmState({ open: false, title: '', message: '', onConfirm: null });
                    setToast({ type: 'success', message: `Estado del usuario "${usr.nombre_usuario}" actualizado correctamente.` });
                    loadData();
                } catch (err) {
                    setConfirmState({ open: false, title: '', message: '', onConfirm: null });
                    setToast({ type: 'error', message: err.message || 'Error al cambiar estado del usuario' });
                }
            }
        });
    };

    const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
        const query = search.toLowerCase();
        const fullName = `${u.nombre_usuario || ''} ${u.apellido_usuario || ''}`.toLowerCase();
        const doc = (u.documento || '').toLowerCase();
        const role = (u.nombre_rol || '').toLowerCase();
        const phone = (u.telefono || '').toLowerCase();
        return fullName.includes(query) || doc.includes(query) || role.includes(query) || phone.includes(query);
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-[#2D1B69]">Gestión de Usuarios</h1>
                    <p className="text-xs text-[#8B7BAD]">Administración de cuentas de acceso para Administradores y Empleados</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-[#ED498C] hover:opacity-95 shadow-md shadow-[#ED498C]/20 flex items-center gap-2 cursor-pointer transition-opacity"
                >
                    <Plus className="w-4 h-4" /> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center gap-3">
                <Search className="w-4 h-4 text-[#8B7BAD]" />
                <input
                    type="text"
                    placeholder="Buscar usuario por nombre, documento o rol..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full text-sm outline-none text-[#2D1B69] placeholder:text-[#8B7BAD]"
                />
            </div>

            <div className="bg-white rounded-xl border border-[#BA9CDB]/22 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8F5FD] border-b border-[#BA9CDB]/22">
                        <tr>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">USUARIO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">TELÉFONO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">ROL</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">ESTADO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD] text-right">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#BA9CDB]/15">
                        {loading && users.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-xs text-[#8B7BAD]">
                                    Cargando usuarios...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-xs text-[#8B7BAD]">
                                    No se encontraron usuarios
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(usr => (
                                <tr key={usr.id_usuario} className="hover:bg-[#FAF8FD] transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#ED498C]/15 text-[#ED498C] font-black flex items-center justify-center text-xs">
                                            {usr.nombre_usuario ? usr.nombre_usuario.substring(0, 2).toUpperCase() : 'US'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-[#2D1B69]">{usr.nombre_usuario} {usr.apellido_usuario}</p>
                                            <p className="text-xs text-[#8B7BAD] font-mono">{usr.tipo_documento || 'Doc'}: {usr.documento}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-mono text-[#2D1B69]">{usr.telefono || 'N/A'}</td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#F3C8F2]/30 text-[#6B21A8] border border-[#BA9CDB]/30">
                                            {usr.nombre_rol || 'Sin Rol'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleToggleStatus(usr)}
                                            title={usr.estado ? 'Desactivar usuario' : 'Activar usuario'}
                                            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${usr.estado ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${usr.estado ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleOpenEditModal(usr)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(usr)}
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
                            <h2 className="text-lg font-black text-[#2D1B69]">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <button onClick={() => setIsOpenModal(false)} className="text-[#8B7BAD] hover:text-[#2D1B69] cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.nombre_usuario}
                                        onChange={e => setForm({ ...form, nombre_usuario: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Apellido</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.apellido_usuario}
                                        onChange={e => setForm({ ...form, apellido_usuario: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
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
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Documento</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.documento}
                                        onChange={e => setForm({ ...form, documento: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm font-mono text-[#2D1B69] outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Teléfono</label>
                                    <input
                                        type="text"
                                        value={form.telefono}
                                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm font-mono text-[#2D1B69] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Rol del Sistema</label>
                                    <select
                                        value={form.id_rol}
                                        onChange={e => setForm({ ...form, id_rol: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none cursor-pointer"
                                    >
                                        {roles.map(r => (
                                            <option key={r.id_rol} value={r.id_rol}>
                                                {r.nombre_rol}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {!editing && (
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        value={form.contrasena}
                                        onChange={e => setForm({ ...form, contrasena: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none"
                                    />
                                </div>
                            )}
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
