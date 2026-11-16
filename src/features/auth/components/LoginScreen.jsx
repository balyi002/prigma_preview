import React, { useState } from 'react';
import { ShoppingBag, Eye, EyeOff, AlertCircle, Sun, Moon, LogIn, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginScreen({ onLoginSuccess, theme, onToggleTheme }) {
  const [documento, setDocumento] = useState('1001000001');
  const [contrasena, setContrasena] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!documento.trim()) {
      setError('Por favor ingresa tu número de documento.');
      return;
    }
    if (!contrasena) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authService.login(documento.trim(), contrasena);
      if (onLoginSuccess) {
        onLoginSuccess(data.usuario);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Error al iniciar sesión.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (doc, pass) => {
    setDocumento(doc);
    setContrasena(pass);
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 bg-background text-foreground relative selection:bg-primary/20">
      {/* Botón de cambio de tema en esquina superior derecha */}
      <div className="fixed top-5 right-5 z-20">
        <button
          onClick={onToggleTheme}
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-purple-600" />
              <span>Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl shadow-primary/5 transition-colors">
        {/* Identidad de marca PRIGMA */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary shadow-lg shadow-primary/25 transform hover:scale-105 transition-transform">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-black text-2xl text-foreground tracking-tight">PRIGMA</h1>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">Variedades Carito · Gestión Integral</p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl p-3.5 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Número de Documento (Cédula / NIT) <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={documento}
              onChange={(e) => {
                setDocumento(e.target.value);
                setError('');
              }}
              placeholder="Ej: 1001000001"
              required
              className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Contraseña <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  setError('');
                }}
                placeholder="Ingresa tu contraseña"
                required
                className="w-full pl-3.5 pr-10 py-2.5 bg-input-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer transition-colors"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl font-black text-white text-sm bg-primary hover:opacity-90 active:scale-[0.99] transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Ingresar al Sistema
              </>
            )}
          </button>
        </form>

        {/* Accesos rápidos de prueba con usuarios de la base de datos */}
        <div className="mt-6 pt-5 border-t border-border">
          <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2.5 text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Credenciales de Prueba (MySQL Railway)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleFillDemo('1001000001', '1234')}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-left font-bold text-foreground transition-colors cursor-pointer"
            >
              <div className="text-[10px] text-primary uppercase">Administrador</div>
              <div className="font-mono text-[11px]">1001000001</div>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('1001000002', '1234')}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-left font-bold text-foreground transition-colors cursor-pointer"
            >
              <div className="text-[10px] text-blue-500 uppercase">Vendedor</div>
              <div className="font-mono text-[11px]">1001000002</div>
            </button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Contraseña rápida de prueba: <code className="font-mono font-bold text-primary">1234</code>
          </p>
        </div>
      </div>
    </div>
  );
}
