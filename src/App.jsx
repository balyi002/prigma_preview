import React, { useState, useEffect } from 'react';
import { LoginScreen, authService } from './features/auth';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import RouterApp from './routes/RouterApp';

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
            <RouterApp
              currentView={currentView}
              onNavigate={setCurrentView}
              currentUser={currentUser}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
