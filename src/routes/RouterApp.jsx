import React from 'react';

// 1. Módulos de Deiby Rojas
import { RolesPage } from '../features/roles';
import { ProductCategoriesPage } from '../features/product-categories';
import { OrdersPage } from '../features/orders';

// 2. Módulos de Danilo Velásquez
import { UserManager } from '../features/users';
import { SupplierManager } from '../features/suppliers';
import { ClientList } from '../features/clients';

// 3. Módulos de Diego Agudelo
import { ProductsPage } from '../features/products';
import { ServiceCategoriesPage } from '../features/service-categories';
import { EmployeesPage } from '../features/employees';

// 4. Módulos de Anyi Carolina González
import Ventas from '../features/sales/Ventas';
import GestionSeparados from '../features/sales/GestionSeparados';
import Dashboard from '../components/layout/DashboardPlaceholder';

// 5. Módulos de Arlex Barrada (Yojhan Arlex Barrada)
import { PurchasesPage } from '../features/purchases';
import { ServicesPage } from '../features/services';
import { SchedulesPage } from '../features/schedules';

/**
 * Componente unificador de rutas / vistas del sistema PRIGMA.
 * Redirige al módulo correspondiente según la selección del Sidebar
 * sin modificar la lógica interna de los módulos de tus compañeros.
 */
export default function RouterApp({ currentView, onNavigate, currentUser }) {
  switch (currentView) {
    // --- MEDICIÓN Y DESEMPEÑO (Anyi Carolina González) ---
    case 'dashboard':
      return <Dashboard />;

    // --- CONFIGURACIÓN (Deiby Rojas) ---
    case 'roles':
      return <RolesPage />;

    // --- USUARIOS (Danilo Velásquez) ---
    case 'users':
      return <UserManager />;

    // --- COMPRAS ---
    case 'product-categories': // Deiby Rojas
      return <ProductCategoriesPage />;

    case 'products': // Diego Agudelo
      return <ProductsPage />;

    case 'suppliers': // Danilo Velásquez
      return <SupplierManager />;

    case 'purchases': // Arlex Barrada
      return <PurchasesPage currentUser={currentUser} />;

    // --- SERVICIOS ---
    case 'service-categories': // Diego Agudelo
      return <ServiceCategoriesPage />;

    case 'services': // Arlex Barrada
      return <ServicesPage />;

    case 'employees': // Diego Agudelo
      return <EmployeesPage />;

    case 'agenda': // Arlex Barrada
      return <SchedulesPage />;

    // --- VENTAS ---
    case 'orders': // Deiby Rojas
      return <OrdersPage currentUser={currentUser} onNavigatePOS={() => onNavigate('pos')} />;

    case 'pos': // Deiby Rojas (Vista POS integrada en Orders)
      return (
        <OrdersPage
          currentUser={currentUser}
          defaultToPOS={true}
          onNavigateBack={() => onNavigate('orders')}
        />
      );

    case 'sales': // Anyi Carolina González
      return <Ventas />;

    case 'separados': // Anyi Carolina González
      return <GestionSeparados />;

    case 'clients': // Danilo Velásquez
      return <ClientList />;

    // --- VISTA POR DEFECTO ---
    default:
      return <Dashboard />;
  }
}
