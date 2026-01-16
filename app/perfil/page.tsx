'use client'

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { Avatar } from '@/components/Avatar';
import { User, Mail, Shield, UserCircle, Calendar, Edit, Save, X } from 'lucide-react';
import { api } from '@/services/api';
import { DateDisplay } from '@/components/DateDisplay';

export default function PerfilPage() {
  const { user } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });
  const [userDetails, setUserDetails] = useState<{
    created_at?: string;
    avatar?: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      });
      // Fetch user details from API
      fetchUserDetails();
    }
  }, [user]);

  const fetchUserDetails = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        const me = await api.getMe();
      setUserDetails({
        created_at: me.created_at,
        avatar: me.avatar,
      });
      setFormData(prev => ({
        ...prev,
        avatar: me.avatar || '',
      }));
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || userDetails?.avatar || '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update user via API
      await api.updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar || undefined,
      });

      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      
      // Reload page to update user context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. El tamaño máximo es 5MB');
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          avatar: base64String,
        }));
        setError(null);
      };
      reader.onerror = () => {
        setError('Error al leer el archivo');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error al procesar la imagen');
      console.error('File processing error:', err);
    }
  };

  if (!user) return null;

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl text-gray-800 mb-2 pr-12 md:pr-16">Mi Perfil</h1>
          <p className="text-sm md:text-base text-gray-600">Gestiona tu información personal</p>
        </div>

        <div className="max-w-3xl">
          {/* Profile Header Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-shrink-0">
                <Avatar 
                  name={user.name} 
                  size="xl" 
                  src={formData.avatar || userDetails?.avatar || user.avatar} 
                />
              </div>
              
              <div className="flex-1 w-full md:w-auto text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen de Perfil
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          id="avatar"
                          name="avatar"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        {formData.avatar && formData.avatar.startsWith('data:image') && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-2">Vista previa:</p>
                            <img
                              src={formData.avatar}
                              alt="Vista previa"
                              className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Selecciona una imagen desde tu computadora (máximo 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl md:text-3xl text-gray-800 mb-2">{user.name}</h2>
                    <p className="text-gray-600 mb-4">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-4 h-4" />
                            Administrador
                          </>
                        ) : (
                          <>
                            <UserCircle className="w-4 h-4" />
                            Usuario
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {success}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span className="hidden sm:inline">Guardar</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Cancelar</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Editar Perfil</span>
                    <span className="sm:hidden">Editar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Información Personal</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-800">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Rol</p>
                    <p className="text-sm text-gray-800">
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </p>
                  </div>
                </div>
                {userDetails?.created_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Miembro desde</p>
                      <p className="text-sm text-gray-800">
                        <DateDisplay date={userDetails.created_at} format="date" />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Permisos</h3>
              </div>
              <div className="space-y-2">
                {user.role === 'admin' ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Gestión completa de usuarios</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Acceso a todas las tareas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Configuración del sistema</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Vista de métricas y reportes</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Ver y gestionar mis tareas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Crear y editar issues</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Comentar en issues</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Ver proyectos asignados</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
