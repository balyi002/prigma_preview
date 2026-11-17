import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, Users, AlertCircle, X } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import EmployeesTable from '../components/EmployeesTable';
import EmployeeDetailModal from '../components/EmployeeDetailModal';
import Pagination from '../../../components/ui/Pagination';

const ITEMS_PER_PAGE = 5;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await employeeService.getEmployees();
      setEmployees(data || []);
    } catch (err) {
      console.error('Error cargando empleados:', err);
      setErrorMsg('No se pudo cargar la lista de empleados desde la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filtrado de empleados en memoria (por nombre, apellido, documento, teléfono o código EM)
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => {
      const fullName = `${emp.nombre_usuario || ''} ${emp.apellido_usuario || ''}`.toLowerCase();
      const code = `EM${String(emp.id_usuario).padStart(3, '0')}`.toLowerCase();
      const doc = (emp.documento || '').toLowerCase();
      const tel = (emp.telefono || '').toLowerCase();
      const rol = (emp.nombre_rol || '').toLowerCase();

      return (
        fullName.includes(q) ||
        code.includes(q) ||
        doc.includes(q) ||
        tel.includes(q) ||
        rol.includes(q)
      );
    });
  }, [employees, search]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE));
  const pagedEmployees = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // Alternar estado activo / inactivo
  const handleToggleStatus = async (emp) => {
    const newStatus = !(emp.estado === 1 || emp.estado === true);
    try {
      await employeeService.updateEmployeeStatus(emp.id_usuario, newStatus);
      setEmployees((prev) =>
        prev.map((item) =>
          item.id_usuario === emp.id_usuario
            ? { ...item, estado: newStatus ? 1 : 0 }
            : item
        )
      );
    } catch (err) {
      console.error('Error cambiando estado del empleado:', err);
      alert(err.response?.data?.error || 'Error al actualizar el estado del empleado');
    }
  };

  const handleViewEmployee = (emp) => {
    setSelectedEmployee(emp);
    setDetailModalOpen(true);
  };

  // Exportar listado de empleados a CSV
  const handleExportCSV = () => {
    if (!filteredEmployees.length) {
      alert('No hay empleados para exportar.');
      return;
    }

    const headers = ['Código', 'Nombre Completo', 'Documento', 'Rol', 'Teléfono', 'Estado'];
    const rows = filteredEmployees.map((e) => [
      `EM${String(e.id_usuario).padStart(3, '0')}`,
      `"${e.nombre_usuario || ''} ${e.apellido_usuario || ''}"`,
      `"${e.documento || ''}"`,
      `"${e.nombre_rol || 'Empleado'}"`,
      `"${e.telefono || ''}"`,
      e.estado ? 'Activo' : 'Inactivo'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `empleados_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Cabecera idéntica a la captura */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">
            Empleados
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Para crear empleados en escritorio, hazlo desde Gestión de Usuarios.
          </p>
        </div>

        {/* Botón Exportar */}
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl font-bold text-xs border border-border bg-card hover:bg-muted text-foreground flex items-center gap-2 transition-colors cursor-pointer shadow-xs self-start"
        >
          <Download className="w-4 h-4 text-muted-foreground" />
          <span>Exportar</span>
        </button>
      </div>

      {/* Alerta de Error de Servidor si ocurriera */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Buscador de Empleados */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar empleado..."
          className="w-full pl-9.5 pr-10 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabla de Empleados */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm font-bold text-muted-foreground">
          Cargando listado de empleados...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Users className="w-6 h-6" />
          </div>
          <p className="font-bold text-foreground text-sm">No se encontraron empleados</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search
              ? 'No coincide ningún empleado con el término de búsqueda.'
              : 'No hay usuarios registrados en la base de datos.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <EmployeesTable
            employees={pagedEmployees}
            onViewEmployee={handleViewEmployee}
            onToggleStatus={handleToggleStatus}
          />

          {/* Paginación */}
          <div className="flex justify-center pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Modal Ficha Detallada del Empleado */}
      <EmployeeDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
      />
    </div>
  );
}
