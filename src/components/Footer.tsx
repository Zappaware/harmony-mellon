'use client'

import React, { useState, useEffect } from 'react';
import { Mail, Clock, Languages } from 'lucide-react';

interface Parametros {
  nombreOrganizacion: string;
  emailContacto: string;
  zonaHoraria: string;
  idioma: string;
}

const defaultParametros: Parametros = {
  nombreOrganizacion: 'Mi Empresa S.A.',
  emailContacto: 'contacto@empresa.com',
  zonaHoraria: 'UTC-3 (Buenos Aires)',
  idioma: 'Español'
};

export function Footer() {
  const [parametros, setParametros] = useState<Parametros>(defaultParametros);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load parametros from localStorage
    const stored = localStorage.getItem('parametrosGenerales');
    if (stored) {
      try {
        setParametros(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading parametros:', e);
      }
    }

    // Listen for storage changes (when updated in configuracion page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'parametrosGenerales' && e.newValue) {
        try {
          setParametros(JSON.parse(e.newValue));
        } catch (e) {
          console.error('Error parsing parametros:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event (same-tab updates)
    const handleCustomStorage = () => {
      const stored = localStorage.getItem('parametrosGenerales');
      if (stored) {
        try {
          setParametros(JSON.parse(stored));
        } catch (e) {
          console.error('Error loading parametros:', e);
        }
      }
    };

    window.addEventListener('parametrosUpdated', handleCustomStorage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('parametrosUpdated', handleCustomStorage);
    };
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{parametros.nombreOrganizacion}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-gray-400" />
              <a 
                href={`mailto:${parametros.emailContacto}`}
                className="hover:text-indigo-600 transition-colors"
              >
                {parametros.emailContacto}
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{parametros.zonaHoraria}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-gray-400" />
              <span>{parametros.idioma}</span>
            </div>
          </div>
          <div className="text-gray-500 text-xs">
            © {new Date().getFullYear()} {parametros.nombreOrganizacion}. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
