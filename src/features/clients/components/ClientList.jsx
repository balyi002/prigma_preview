// src/features/clients/components/ClientList.jsx
import React, { useEffect, useState } from 'react';
import { clientService } from '../services/clientService';
import { Search, Users, ShoppingBag } from 'lucide-react';

export const ClientList = () => {
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        clientService.getAll().then(setClients).catch(console.error);
    }, []);

    const filtered = clients.filter(c => c.nombre_cliente.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-[#2D1B69]">Clientes</h1>
                    <p className="text-xs text-[#8B7BAD]">Clientes se crean automáticamente desde el POS</p>
                </div>
            </div>

            {/* Tarjetas de Métricas Superiores */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center justify-between">
                    <div><p className="text-xs text-[#8B7BAD] font-bold">Nuevo</p><h3 className="text-xl font-black text-[#2D1B69]">1</h3></div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">N</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center justify-between">
                    <div><p className="text-xs text-[#8B7BAD] font-bold">Ocasional</p><h3 className="text-xl font-black text-[#2D1B69]">1</h3></div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">O</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center justify-between">
                    <div><p className="text-xs text-[#8B7BAD] font-bold">Frecuente</p><h3 className="text-xl font-black text-[#2D1B69]">3</h3></div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">F</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center justify-between">
                    <div><p className="text-xs text-[#8B7BAD] font-bold">Apartado</p><h3 className="text-xl font-black text-[#2D1B69]">0</h3></div>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">A</div>
                </div>
            </div>

            {/* Buscador */}
            <div className="bg-white p-4 rounded-xl border border-[#BA9CDB]/22 shadow-xs flex items-center gap-3">
                <Search className="w-4 h-4 text-[#8B7BAD]" />
                <input
                    type="text"
                    placeholder="Buscar cliente..."
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
                            <th className="p-4 text-xs font-bold text-[#8B7BAD]">ESTADO</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#BA9CDB]/15">
                        {filtered.map(client => (
                            <tr key={client.id_cliente} className="hover:bg-[#FAF8FD] transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#ED498C]/15 text-[#ED498C] font-black flex items-center justify-center text-xs">
                                        {client.nombre_cliente.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-sm text-[#2D1B69]">{client.nombre_cliente}</span>
                                </td>
                                <td className="p-4">
                                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                        {client.estado ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};