'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useConfig } from '@/contexts/ConfigContext';
import ThemeToggle from '@/components/ThemeToggle';
import LoginSlider from '@/components/LoginSlider';
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi';
import axios from 'axios';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { config } = useConfig();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      await axios.post(`${apiUrl}/auth/recuperar-password`, { email });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Error al enviar el correo de recuperación. Verifica que el email sea correcto.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Left Panel - Banner Slider */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <LoginSlider />
      </div>

      {/* Right Panel - Formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">CO</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {config?.nombre_sistema || 'Class Optima'}
            </h1>
          </div>

          {/* Theme Toggle */}
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors">
            {!success ? (
              <>
                {/* Header */}
                <div className="mb-6">
                  <Link 
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
                  >
                    <FiArrowLeft />
                    Volver al inicio de sesión
                  </Link>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Recuperar contraseña
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Enviando...
                      </>
                    ) : (
                      'Enviar enlace de recuperación'
                    )}
                  </button>
                </form>
              </>
            ) : (
              // Success Message
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Correo enviado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Hemos enviado un enlace de recuperación a <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                  Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  <FiArrowLeft />
                  Volver al inicio de sesión
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            © 2025 {config?.nombre_sistema || 'Class Optima'}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
