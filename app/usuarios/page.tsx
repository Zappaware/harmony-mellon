'use client'

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Users, Mail, Shield, UserCircle, Edit, Trash2 } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { CreateUserModal } from '@/components/CreateUserModal';

export default function GestionUsuarios() {
  const { users } = useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl text-gray-800 mb-2">Gestión de Usuarios</h1>
          <p className="text-sm md:text-base text-gray-600">Administra el equipo y sus permisos</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              <h2 className="text-lg md:text-xl text-gray-800">Usuarios del Sistema</h2>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base w-full md:w-auto"
            >
              Agregar Usuario
            </button>
          </div>

          {/* Mobile: Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium truncate">{user.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {user.role === 'admin' ? (
                      <>
                        <Shield className="w-3 h-3" />
                        Administrador
                      </>
                    ) : (
                      <>
                        <UserCircle className="w-3 h-3" />
                        Usuario
                      </>
                    )}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    Activo
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button className="flex-1 flex items-center justify-center gap-2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm">
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm">
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-800">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 inline-flex ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3" />
                            Administrador
                          </>
                        ) : (
                          <>
                            <UserCircle className="w-3 h-3" />
                            Usuario
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
              <span className="text-xl md:text-2xl text-gray-800 font-semibold">{users.length}</span>
            </div>
            <p className="text-sm md:text-base text-gray-600">Total Usuarios</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              <span className="text-xl md:text-2xl text-gray-800 font-semibold">
                {users.filter((u) => u.role === 'admin').length}
              </span>
            </div>
            <p className="text-sm md:text-base text-gray-600">Administradores</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <UserCircle className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              <span className="text-xl md:text-2xl text-gray-800 font-semibold">
                {users.filter((u) => u.role === 'user').length}
              </span>
            </div>
            <p className="text-sm md:text-base text-gray-600">Usuarios Estándar</p>
          </div>
        </div>
      </div>
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Users will be reloaded automatically via useEffect in AppContext
          window.location.reload();
        }}
      />
    </LayoutWithSidebar>
  );
}
