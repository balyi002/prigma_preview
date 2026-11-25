import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, AlertCircle, Sun, Moon, LogIn, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import FeedbackToast from '../../../components/ui/FeedbackToast';

export default function LoginScreen({ onLoginSuccess, theme, onToggleTheme }) {
  const [documento, setDocumento] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ documento: '', contrasena: '' });
  const [toast, setToast] = useState(null);

  const closeToast = useCallback(() => setToast(null), []);

  const validateDocumento = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Por favor ingresa tu número de documento.';
    if (/\s/.test(trimmed)) return 'El documento no debe contener espacios.';
    if (!/^[a-zA-Z0-9-]{4,20}$/.test(trimmed)) {
      return 'El documento debe tener entre 4 y 20 caracteres alfanuméricos.';
    }
    return '';
  };

  const validateContrasena = (value) => {
    if (!value) return 'Por favor ingresa tu contraseña.';
    if (value.length < 4) return 'La contraseña debe tener al menos 4 caracteres.';
    return '';
  };

  const validateForm = () => {
    const docErr = validateDocumento(documento);
    const passErr = validateContrasena(contrasena);
    setFieldErrors({ documento: docErr, contrasena: passErr });

    if (docErr || passErr) {
      const items = [docErr, passErr].filter(Boolean);
      setToast({
        type: 'warning',
        title: 'Revisa los campos del formulario',
        items,
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = await authService.login(documento.trim(), contrasena);
      if (onLoginSuccess) {
        onLoginSuccess(data.usuario);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK'
          ? 'No fue posible conectar con el servidor. Verifica que la API esté activa.'
          : err.message || 'Error al iniciar sesión.');
      setError(msg);
      setToast({
        type: 'error',
        title: 'Acceso denegado',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
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
              <Moon className="w-4 h-4 text-primary" />
              <span>Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-xl shadow-primary/5 transition-colors">
        {/* Identidad de marca PRIGMA */}
        <div className="flex flex-col items-center mb-7 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20 shadow-lg shadow-primary/15 transform hover:scale-105 transition-transform overflow-hidden p-1.5">
            <img
              src="https://github.com/user-attachments/assets/f6f8df77-3049-4267-8d54-f054466943aa"
              alt="PRIGMA Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-black text-2xl text-foreground tracking-tight">PRIGMA</h1>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">
            Variedades Carito · Gestión Integral
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl p-3.5 flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-documento" className="text-xs font-bold text-foreground block">
              Número de Documento (Cédula / NIT) <span className="text-primary">*</span>
            </label>
            <input
              id="login-documento"
              type="text"
              autoComplete="username"
              value={documento}
              onChange={(e) => {
                const val = e.target.value;
                setDocumento(val);
                setError('');
                if (fieldErrors.documento) {
                  setFieldErrors((prev) => ({ ...prev, documento: validateDocumento(val) }));
                }
              }}
              onBlur={() => {
                if (documento) {
                  setFieldErrors((prev) => ({ ...prev, documento: validateDocumento(documento) }));
                }
              }}
              placeholder="Ingresa tu documento registrado"
              className={`w-full px-3.5 py-2.5 bg-input-background border rounded-xl text-sm font-mono font-medium text-foreground placeholder:font-sans placeholder:text-muted-foreground outline-none focus:ring-2 transition-all ${
                fieldErrors.documento
                  ? 'border-destructive focus:ring-destructive/30'
                  : 'border-border focus:ring-ring'
              }`}
            />
            {fieldErrors.documento && (
              <p className="text-[11px] font-bold text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{fieldErrors.documento}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-contrasena" className="text-xs font-bold text-foreground block">
              Contraseña <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <input
                id="login-contrasena"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => {
                  const val = e.target.value;
                  setContrasena(val);
                  setError('');
                  if (fieldErrors.contrasena) {
                    setFieldErrors((prev) => ({ ...prev, contrasena: validateContrasena(val) }));
                  }
                }}
                onBlur={() => {
                  if (contrasena) {
                    setFieldErrors((prev) => ({ ...prev, contrasena: validateContrasena(contrasena) }));
                  }
                }}
                placeholder="Ingresa tu contraseña"
                className={`w-full pl-3.5 pr-10 py-2.5 bg-input-background border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 transition-all ${
                  fieldErrors.contrasena
                    ? 'border-destructive focus:ring-destructive/30'
                    : 'border-border focus:ring-ring'
                }`}
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
            {fieldErrors.contrasena && (
              <p className="text-[11px] font-bold text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{fieldErrors.contrasena}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl font-black text-primary-foreground text-sm bg-primary hover:opacity-90 active:scale-[0.99] transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] font-semibold text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
          <span>Autenticación verificada con la base de datos del sistema</span>
        </div>
      </div>

      <FeedbackToast toast={toast} onClose={closeToast} />
    </div>
  );
}
