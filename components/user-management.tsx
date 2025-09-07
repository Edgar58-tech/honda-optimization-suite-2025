
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Users, 
  Crown,
  Briefcase,
  User,
  Mail,
  Key,
  Building,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Usuario {
  id: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  nombre_completo?: string;
  puesto?: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  // Formulario para nuevo/editar usuario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    firstName: '',
    lastName: '',
    nombre_completo: '',
    puesto: '',
    role: 'GENERAL'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    try {
      // Validaciones
      if (!formData.email) {
        toast.error('El email es obligatorio');
        return;
      }

      if (!editingUser && !formData.password) {
        toast.error('La contraseña es obligatoria para nuevos usuarios');
        return;
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }

      const userData = {
        email: formData.email,
        name: formData.name || null,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        nombre_completo: formData.nombre_completo || null,
        puesto: formData.puesto || null,
        role: formData.role
      };

      if (formData.password) {
        (userData as any).password = formData.password;
      }

      const url = editingUser ? '/api/users' : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser ? { id: editingUser.id, ...userData } : userData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(`Usuario ${editingUser ? 'actualizado' : 'creado'} exitosamente`);
        setIsDialogOpen(false);
        resetForm();
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Error al guardar usuario');
    }
  };

  const handleEditUser = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      confirmPassword: '',
      name: user.name || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      nombre_completo: user.nombre_completo || '',
      puesto: user.puesto || '',
      role: user.role
    });
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (confirm(`¿Está seguro de eliminar al usuario "${userEmail}"?`)) {
      try {
        const response = await fetch(`/api/users?id=${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Usuario eliminado exitosamente');
          loadUsers();
        } else {
          toast.error('Error al eliminar usuario');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Error al eliminar usuario');
      }
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      firstName: '',
      lastName: '',
      nombre_completo: '',
      puesto: '',
      role: 'GENERAL'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'VENTAS':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'default' as const;
      case 'VENTAS':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando usuarios...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              👥 Gestión de Usuarios
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="usuario@email.com"
                      disabled={editingUser !== null}
                    />
                  </div>

                  <div>
                    <Label>Contraseña {!editingUser && '*'}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder={editingUser ? "Dejar vacío para mantener actual" : "Contraseña"}
                    />
                  </div>

                  <div>
                    <Label>Confirmar Contraseña</Label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="Confirmar contraseña"
                    />
                  </div>

                  <div>
                    <Label>Rol</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({...formData, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMINISTRADOR">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            Administrador
                          </div>
                        </SelectItem>
                        <SelectItem value="VENTAS">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Ventas
                          </div>
                        </SelectItem>
                        <SelectItem value="GENERAL">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            General
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Nombre Completo</Label>
                    <Input
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                      placeholder="Juan Pérez García"
                    />
                  </div>

                  <div>
                    <Label>Puesto</Label>
                    <Input
                      value={formData.puesto}
                      onChange={(e) => setFormData({...formData, puesto: e.target.value})}
                      placeholder="Gerente de Ventas"
                    />
                  </div>

                  <div>
                    <Label>Nombre (Legacy)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Juan"
                    />
                  </div>

                  <div>
                    <Label>Apellido (Legacy)</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveUser}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingUser ? 'Actualizar' : 'Crear'} Usuario
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay usuarios configurados</p>
                <p className="text-sm">Haz clic en "Nuevo Usuario" para comenzar</p>
              </div>
            ) : (
              users.map((user) => (
                <Card key={user.id} className="border-l-4 border-l-blue-400">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {user.nombre_completo || user.name || user.email}
                            </h3>
                            {user.puesto && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {user.puesto}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                          <Badge 
                            variant={getRoleBadgeVariant(user.role)}
                            className="flex items-center gap-1"
                          >
                            {getRoleIcon(user.role)}
                            {user.role}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          Creado: {new Date(user.createdAt).toLocaleDateString('es-MX')}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
