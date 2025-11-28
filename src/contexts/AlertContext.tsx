'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface Alert {
  id: string;
  type: AlertType;
  message: string;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [confirmData, setConfirmData] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const showAlert = useCallback((message: string, type: AlertType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlerts(prev => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    setConfirmData({ message, onConfirm });
  }, []);

  const handleConfirm = () => {
    if (confirmData) {
      confirmData.onConfirm();
      setConfirmData(null);
    }
  };

  const handleCancel = () => {
    setConfirmData(null);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5" />;
      default:
        return <FiInfo className="w-5 h-5" />;
    }
  };

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in ${getAlertStyles(alert.type)}`}
          >
            {getAlertIcon(alert.type)}
            <p className="flex-1 text-sm font-medium">{alert.message}</p>
            <button
              onClick={() => removeAlert(alert.id)}
              className="hover:opacity-70 transition-opacity"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCancel}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Confirmar acción
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {confirmData.message}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}
