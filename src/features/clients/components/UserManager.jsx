// src/features/users/components/UserManager.jsx
import React, { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import { Plus, Search, Trash2, Edit2, X, Users, Lock } from 'lucide-react';

export const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [tiposDoc, setTiposDoc] = useState([]);
    const [search, setSearch] = useState('');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        nombre_usuario: '', apellido_usuario: '', id_tipo_documento: 1,
        documento: '', telefono: '', contrasena: '', id_rol: 2
    });

    const loadData = async () => {
        try {
            const [uRes, rRes, tdRes] = await Promise.all([
                userService.getAll(),
                userService.getRoles(),
                userService.getTiposDocumento()
            ]);
            setUsers(uRes);
            setRoles(rRes);
            setTiposDoc(tdRes);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await userService.update(editing.id_usuario, form);
            } else {
                await userService.create(form);
            }
            setIsOpenModal(false);
            setEditing(null);
            loadData();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Desea eliminar este usuario?')) {
            try {
                await userService.delete(id);
                loadData();
            } catch (err) { alert(err.message); }
        }
    };

    const handleToggleStatus = async (usr) => {
        try {
            await userService.updateStatus(usr.id_usuario, !usr.estado);
            loadData();
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-[#2D1B69]">Gestión de Usuarios</h1>
                    <p className="text-xs text-[#8B7BAD]">Administración de cuentas de acceso para Administradores y Empleados</p>
                </div>
                <button
                    onClick={() => { setEditing(null); setForm({ nombre_usuario: '', apellido_usuario: '', id_tipo_documento: 1, documento: '', telefono: '', contrasena: '', id_rol: 2 }); setIsOpenModal(true); }}
                    className="px-4 py-2.5 rounded-xl font-black text-white text-sm bg-[#ED498C] hover:opacity-95 shadow-md shadow-[#ED498C]/20 flex items-center gap-2 cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Nuevo
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center gap-3">
                <Search className="w-4 h-4 text-[#8B7BAD]" />
                <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full text-sm outline-none text-[#2D1B69]"
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
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">CREADO</th>
                            <th className="p-4 text-xs font-bold text-[#8B7BAD] text-right">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#BA9CDB]/15">
                        {users.filter(u => u.nombre_usuario.toLowerCase().includes(search.toLowerCase())).map(usr => (
                            <tr key={usr.id_usuario} className="hover:bg-[#FAF8FD]">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#ED498C]/15 text-[#ED498C] font-black flex items-center justify-center text-xs">
                                        {usr.nombre_usuario.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-[#2D1B69]">{usr.nombre_usuario} {usr.apellido_usuario}</p>
                                        <p className="text-xs text-[#8B7BAD] font-mono">{usr.tipo_documento}: {usr.documento}</p>
                                    </div>
                                </td>
                                <td className="p-4 text-sm font-mono text-[#2D1B69]">{usr.telefono || 'N/A'}</td>
                                <td className="p-4">
                                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#F3C8F2]/30 text-[#6B21A8] border border-[#BA9CDB]/30">
                                        {usr.nombre_rol}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button onClick={() => handleToggleStatus(usr)} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${usr.estado ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${usr.estado ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </td>
                                <td className="p-4 text-xs text-[#8B7BAD]">{new Date(usr.fecha_creacion).toLocaleDateString()}</td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => { setEditing(usr); setForm(usr); setIsOpenModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(usr.id_usuario)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
                            <h2 className="text-lg font-black text-[#2D1B69]">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <button onClick={() => setIsOpenModal(false)} className="text-[#8B7BAD] hover:text-[#2D1B69]"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Nombre</label>
                                    <input type="text" required value={form.nombre_usuario} onChange={e => setForm({ ...form, nombre_usuario: e.target.value })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Apellido</label>
                                    <input type="text" required value={form.apellido_usuario} onChange={e => setForm({ ...form, apellido_usuario: e.target.value })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Tipo de Documento</label>
                                    <select value={form.id_tipo_documento} onChange={e => setForm({ ...form, id_tipo_documento: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none">
                                        {tiposDoc.map(td => <option key={td.id_tipo_documento} value={td.id_tipo_documento}>{td.descripcion}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Documento</label>
                                    <input type="text" required value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm font-mono text-[#2D1B69] outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Teléfono</label>
                                    <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm font-mono text-[#2D1B69] outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Rol del Sistema</label>
                                    <select value={form.id_rol} onChange={e => setForm({ ...form, id_rol: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none">
                                        {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
                                    </select>
                                </div>
                            </div>
                            {!editing && (
                                <div>
                                    <label className="text-xs font-bold text-[#2D1B69]">Contraseña (Hash o Texto)</label>
                                    <input type="password" required value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} className="w-full px-3 py-2 bg-[#F8F5FD] border border-[#BA9CDB]/22 rounded-xl text-sm text-[#2D1B69] outline-none" />
                                </div>
                            )}
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