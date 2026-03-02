'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { useApp, User } from '@/context/AppContext';
import { Users, Mail, Shield, UserCircle, Edit, Trash2, LayoutList, LayoutGrid } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { PageHeader } from '@/components/PageHeader';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CreateUserModal } from '@/components/CreateUserModal';
import { EditUserModal } from '@/components/EditUserModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function GestionUsuarios() {
  const { users, deleteUser, user: currentUser, refreshUsers } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.name ?? '').toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, searchQuery]);

  // Refresh users when visiting this page (ensures new seeded users appear after seed)
  useEffect(() => {
    refreshUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteClick = (userId: string) => {
    // Prevent deleting yourself
    if (userId === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario');
      return;
    }
    setUserToDelete(userId);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete);
      setUserToDelete(null);
      // Reload page to refresh users list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario. Por favor, intenta de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Gestión de Usuarios"
          subtitle="Administra el equipo y sus permisos"
          rightContent={
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as 'list' | 'grid')}
              variant="outline"
              size="lg"
              className="shrink-0 border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm [&_[data-state=on]]:bg-indigo-100 [&_[data-state=on]]:text-indigo-600 hover:[&_[data-state=on]]:bg-indigo-100"
            >
              <ToggleGroupItem value="list" aria-label="Vista lista" title="Vista lista">
                <LayoutList className="w-5 h-5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Vista cuadrícula" title="Vista cuadrícula">
                <LayoutGrid className="w-5 h-5" />
              </ToggleGroupItem>
            </ToggleGroup>
          }
        />

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 md:p-6 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                <h2 className="text-lg md:text-xl text-gray-800">Usuarios del Sistema</h2>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base w-full sm:w-auto shrink-0"
                >
                  Agregar Usuario
                </button>
              )}
            </div>
            <div>
              <input
                type="search"
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                aria-label="Buscar usuarios"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchQuery.trim() ? 'No se encontraron usuarios.' : 'No hay usuarios.'}
            </div>
          ) : viewMode === 'list' ? (
            <section aria-label="Listado de usuarios" className="pt-[17px]">
              <div className="bg-white rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <li key={user.id} className="group">
                      <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 min-w-10 min-h-10 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-sm font-medium">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 shrink-0 ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : user.role === 'team_lead'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {user.role === 'admin' ? (
                              <><Shield className="w-3 h-3" />Administrador</>
                            ) : user.role === 'team_lead' ? (
                              <><Shield className="w-3 h-3" />Líder de Equipo</>
                            ) : (
                              <><UserCircle className="w-3 h-3" />Usuario</>
                            )}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 shrink-0">Activo</span>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setUserToEdit(user)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar usuario"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user.id)}
                              disabled={user.id === currentUser?.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : (
            <section aria-label="Cuadrícula de usuarios" className="w-full px-2.5 pb-2.5">
              <div className="grid w-full gap-4 pb-2.5" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {filteredUsers.map((user) => (
                  <div key={user.id} className="min-w-0 bg-white rounded-lg shadow border border-gray-200 overflow-hidden group flex flex-col">
                    <div className="flex flex-col p-4 flex-1 min-h-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-12 h-12 min-w-12 min-h-12 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-sm font-medium">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 shrink-0 ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'team_lead'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {user.role === 'admin' ? 'Admin' : user.role === 'team_lead' ? 'Líder' : 'Usuario'}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 truncate mb-1">{user.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 self-start">Activo</span>
                    </div>
                    {isAdmin && (
                      <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setUserToEdit(user)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm"
                          title="Editar usuario"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(user.id)}
                          disabled={user.id === currentUser?.id}
                          className="flex-1 flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Spacer between user list and stat cards */}
        <div className="h-16 md:h-24"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
              <span className="text-xl md:text-2xl text-gray-800 font-semibold">
                {users.filter((u) => u.role === 'team_lead').length}
              </span>
            </div>
            <p className="text-sm md:text-base text-gray-600">Líderes de Equipo</p>
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

      <EditUserModal
        isOpen={userToEdit !== null}
        onClose={() => setUserToEdit(null)}
        onSuccess={() => {
          // Reload users after update
          window.location.reload();
        }}
        user={userToEdit}
      />

      <AlertDialog open={userToDelete !== null} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el usuario{' '}
              <strong>{users.find(u => u.id === userToDelete)?.name}</strong> y todas sus asignaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutWithSidebar>
  );
}
