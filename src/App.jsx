import React, { useState, useEffect } from 'react';
import { LoginScreen, authService } from './features/auth';
import { RolesPage } from './features/roles';
import { ProductCategoriesPage } from './features/product-categories';
import { OrdersPage } from './features/orders';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import DashboardPlaceholder from './components/layout/DashboardPlaceholder';
import { AlertCircle } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [currentView, setCurrentView] = useState('dashboard');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('prigma_theme') || 'light';
  });

  // Sincronizar clase .dark en el tag <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('prigma_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = (usuario) => {
    setCurrentUser(usuario);
    setCurrentView('dashboard'); // Redirección directa al Dashboard tras login exitoso
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Si no está autenticado, renderizar LoginScreen con validación
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Mapeo de vistas activas
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPlaceholder />;

      case 'roles':
        return <RolesPage />;

      case 'product-categories':
        return <ProductCategoriesPage />;

      case 'orders':
        return <OrdersPage currentUser={currentUser} />;

      case 'pos':
        return (
          <OrdersPage
            currentUser={currentUser}
            defaultToPOS={true}
            onNavigateBack={() => setCurrentView('orders')}
          />
        );

      default:
        // Placeholder para los módulos correspondientes a los demás compañeros de equipo
        const teamResponsibilityMap = {
          users: 'Danilo Velásquez (Gestión de Usuarios)',
          suppliers: 'Danilo Velásquez (Proveedores)',
          clients: 'Danilo Velásquez (Clientes)',
          products: 'Diego Agudelo (Gestión de Productos)',
          'service-categories': 'Diego Agudelo (Categoría de Servicios)',
          employees: 'Diego Agudelo (Empleados)',
          purchases: 'Yojhan Barrada (Gestión de Compras)',
          services: 'Yojhan Barrada (Gestión de Servicios)',
          agenda: 'Yojhan Barrada (Agenda)',
          sales: 'Anyi Carolina González (Ventas)'
        };

        const responsible = teamResponsibilityMap[currentView] || 'Equipo de desarrollo';

        return (
          <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto my-12 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground capitalize">
                {currentView.replace('-', ' ')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Este módulo se encuentra en desarrollo por <strong>{responsible}</strong>.
              </p>
            </div>
            <button
              onClick={() => setCurrentView('roles')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              Ir a Gestión de Roles
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar Fijo a la Izquierda */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Área de Contenido Principal con Header Superior */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar
          currentView={currentView}
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderCurrentView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
