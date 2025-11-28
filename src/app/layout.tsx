import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { AlertProvider } from '@/contexts/AlertContext';
import DynamicTitle from '@/components/DynamicTitle';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Class Optima - Sistema de Gestión Escolar',
  description: 'Sistema completo de gestión escolar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeProvider>
          <ConfigProvider>
            <DynamicTitle />
            <AlertProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </AlertProvider>
          </ConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
