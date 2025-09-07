
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Building2, 
  Percent, 
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PlanFinanciera {
  id: string;
  financiera: string;
  nombre: string;
  activo: boolean;
  lineas: string[] | null;
  versiones: string[] | null;
  excepciones: Array<{
    linea: string;
    version: string;
  }>;
  tasa: number;
  plazo: number;
  enganche_minimo: number;
  comision_apertura: number;
  pago_distribuidor: number;
  bono_subsidio: number;
  observaciones?: string;
  prioridad: number;
}

interface FinancieraPlanesManagerProps {
  financieras: string[];
  lineasVehiculos: string[];
  versionesVehiculos: Record<string, string[]>;
  onPlanesChange?: () => void;
}

export function FinancieraPlanesManager({ 
  financieras, 
  lineasVehiculos, 
  versionesVehiculos,
  onPlanesChange 
}: FinancieraPlanesManagerProps) {
  const [planes, setPlanes] = useState<PlanFinanciera[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanFinanciera | null>(null);
  const [selectedFinanciera, setSelectedFinanciera] = useState<string>('');

  // Formulario para nuevo/editar plan
  const [formData, setFormData] = useState({
    financiera: '',
    nombre: '',
    lineas: [] as string[],
    versiones: [] as string[],
    excepciones: [
      { linea: '', version: '' },
      { linea: '', version: '' },
      { linea: '', version: '' }
    ] as Array<{linea: string, version: string}>,
    tasa: 0,
    plazo: 12,
    enganche_minimo: 20,
    comision_apertura: 0,
    pago_distribuidor: 0,
    bono_subsidio: 0,
    observaciones: '',
    prioridad: 1
  });

  useEffect(() => {
    loadPlanes();
  }, []);

  const loadPlanes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/financieras/planes');
      if (response.ok) {
        const data = await response.json();
        setPlanes(data);
      } else {
        toast.error('Error al cargar planes financieros');
      }
    } catch (error) {
      console.error('Error loading planes:', error);
      toast.error('Error al cargar planes');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    try {
      // Validaciones
      if (!formData.financiera || !formData.nombre) {
        toast.error('Financiera y nombre son obligatorios');
        return;
      }

      // Validar lógica de líneas/versiones
      if (!formData.lineas.length && formData.versiones.length) {
        toast.error('No puede tener versiones específicas sin líneas específicas');
        return;
      }

      const planData = {
        ...formData,
        lineas: formData.lineas.length ? formData.lineas : null,
        versiones: formData.versiones.length ? formData.versiones : null,
        excepciones: formData.excepciones
          .filter(ex => ex.linea)
          .map(ex => ({ 
            linea: ex.linea, 
            version: ex.version || '' 
          }))
      };

      const url = editingPlan 
        ? '/api/financieras/planes' 
        : '/api/financieras/planes';
      
      const method = editingPlan ? 'PUT' : 'POST';
      const body = editingPlan 
        ? { id: editingPlan.id, ...planData }
        : planData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(`Plan ${editingPlan ? 'actualizado' : 'creado'} exitosamente`);
        setIsDialogOpen(false);
        resetForm();
        loadPlanes();
        onPlanesChange?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Error al guardar plan');
    }
  };

  const handleEditPlan = (plan: PlanFinanciera) => {
    setEditingPlan(plan);
    setFormData({
      financiera: plan.financiera,
      nombre: plan.nombre,
      lineas: plan.lineas || [],
      versiones: plan.versiones || [],
      excepciones: [
        plan.excepciones[0] || { linea: '', version: '' },
        plan.excepciones[1] || { linea: '', version: '' },
        plan.excepciones[2] || { linea: '', version: '' }
      ],
      tasa: plan.tasa,
      plazo: plan.plazo,
      enganche_minimo: plan.enganche_minimo,
      comision_apertura: plan.comision_apertura,
      pago_distribuidor: plan.pago_distribuidor,
      bono_subsidio: plan.bono_subsidio,
      observaciones: plan.observaciones || '',
      prioridad: plan.prioridad
    });
    setIsDialogOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm('¿Está seguro de eliminar este plan?')) {
      try {
        const response = await fetch(`/api/financieras/planes?id=${planId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Plan eliminado exitosamente');
          loadPlanes();
          onPlanesChange?.();
        } else {
          toast.error('Error al eliminar plan');
        }
      } catch (error) {
        console.error('Error deleting plan:', error);
        toast.error('Error al eliminar plan');
      }
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      financiera: '',
      nombre: '',
      lineas: [],
      versiones: [],
      excepciones: [
        { linea: '', version: '' },
        { linea: '', version: '' },
        { linea: '', version: '' }
      ],
      tasa: 0,
      plazo: 12,
      enganche_minimo: 20,
      comision_apertura: 0,
      pago_distribuidor: 0,
      bono_subsidio: 0,
      observaciones: '',
      prioridad: 1
    });
  };

  const getAplicabilidadText = (plan: PlanFinanciera) => {
    if (!plan.lineas || !plan.lineas.length) {
      return 'Todas las líneas';
    }
    
    if (!plan.versiones || !plan.versiones.length) {
      return `Líneas: ${plan.lineas.join(', ')}`;
    }
    
    return `${plan.lineas.join(', ')} → ${plan.versiones.join(', ')}`;
  };

  const getExcepcionesText = (plan: PlanFinanciera) => {
    if (!plan.excepciones.length) return 'Ninguna';
    
    return plan.excepciones.map(ex => 
      `${ex.linea}${ex.version ? ` → ${ex.version}` : ''}`
    ).join(', ');
  };

  const planesPorFinanciera = planes.reduce((acc, plan) => {
    if (!acc[plan.financiera]) acc[plan.financiera] = [];
    acc[plan.financiera].push(plan);
    return acc;
  }, {} as Record<string, PlanFinanciera[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando planes financieros...</div>
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
              <Building2 className="h-5 w-5 text-purple-500" />
              📋 Gestión de Planes Financieros
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? 'Editar Plan Financiero' : 'Nuevo Plan Financiero'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información Básica */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Información Básica</h3>
                    
                    <div>
                      <Label>Financiera</Label>
                      <Select
                        value={formData.financiera}
                        onValueChange={(value) => setFormData({...formData, financiera: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar financiera" />
                        </SelectTrigger>
                        <SelectContent>
                          {financieras.map(financiera => (
                            <SelectItem key={financiera} value={financiera}>
                              {financiera}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Nombre del Plan</Label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Ej: Plan Estándar 24 meses"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Tasa (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.tasa}
                          onChange={(e) => setFormData({...formData, tasa: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <Label>Plazo (meses)</Label>
                        <Input
                          type="number"
                          value={formData.plazo}
                          onChange={(e) => setFormData({...formData, plazo: parseInt(e.target.value) || 12})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Enganche Mínimo (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.enganche_minimo}
                        onChange={(e) => setFormData({...formData, enganche_minimo: parseFloat(e.target.value) || 0})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Comisión Apertura</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.comision_apertura}
                          onChange={(e) => setFormData({...formData, comision_apertura: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <Label>Pago Distribuidor</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.pago_distribuidor}
                          onChange={(e) => setFormData({...formData, pago_distribuidor: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Bono/Subsidio</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.bono_subsidio}
                        onChange={(e) => setFormData({...formData, bono_subsidio: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  {/* Aplicabilidad y Excepciones */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Aplicabilidad</h3>
                    
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        • <strong>Sin líneas:</strong> Aplica a todos los vehículos<br/>
                        • <strong>Con líneas, sin versiones:</strong> Aplica a toda esa línea<br/>
                        • <strong>Con líneas y versiones:</strong> Solo esa combinación<br/>
                        • <strong>Excepciones:</strong> Líneas/versiones que NO aplican
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label>Líneas Aplicables (dejar vacío = todas)</Label>
                      <Select
                        value="select-multiple"
                        onValueChange={(value) => {
                          if (value !== 'select-multiple') {
                            const newLineas = formData.lineas.includes(value) 
                              ? formData.lineas.filter(l => l !== value)
                              : [...formData.lineas, value];
                            setFormData({...formData, lineas: newLineas, versiones: []});
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            formData.lineas.length ? 
                            `${formData.lineas.length} líneas seleccionadas` : 
                            'Todas las líneas'
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {lineasVehiculos.map(linea => (
                            <SelectItem key={linea} value={linea}>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formData.lineas.includes(linea)}
                                  readOnly
                                />
                                {linea}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.lineas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {formData.lineas.map(linea => (
                            <Badge key={linea} variant="secondary">
                              {linea}
                              <button
                                onClick={() => setFormData({
                                  ...formData, 
                                  lineas: formData.lineas.filter(l => l !== linea),
                                  versiones: []
                                })}
                                className="ml-1 text-xs"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {formData.lineas.length > 0 && (
                      <div>
                        <Label>Versiones Específicas (dejar vacío = toda la línea)</Label>
                        <Select
                          value="select-versions"
                          onValueChange={(value) => {
                            if (value !== 'select-versions') {
                              const newVersiones = formData.versiones.includes(value) 
                                ? formData.versiones.filter(v => v !== value)
                                : [...formData.versiones, value];
                              setFormData({...formData, versiones: newVersiones});
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              formData.versiones.length ? 
                              `${formData.versiones.length} versiones seleccionadas` : 
                              'Todas las versiones de las líneas'
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.lineas.flatMap(linea => 
                              versionesVehiculos[linea] || []
                            ).map(version => (
                              <SelectItem key={version} value={version}>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={formData.versiones.includes(version)}
                                    readOnly
                                  />
                                  {version}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.versiones.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {formData.versiones.map(version => (
                              <Badge key={version} variant="outline">
                                {version}
                                <button
                                  onClick={() => setFormData({
                                    ...formData, 
                                    versiones: formData.versiones.filter(v => v !== version)
                                  })}
                                  className="ml-1 text-xs"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />
                    
                    <h4 className="font-medium">Excepciones (hasta 3)</h4>
                    {formData.excepciones.map((excepcion, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2 p-2 border rounded">
                        <div>
                          <Label className="text-xs">Línea Excepción {index + 1}</Label>
                          <Select
                            value={excepcion.linea || "none"}
                            onValueChange={(value) => {
                              const newExcepciones = [...formData.excepciones];
                              newExcepciones[index] = { 
                                linea: value === "none" ? "" : value, 
                                version: "" 
                              };
                              setFormData({...formData, excepciones: newExcepciones});
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Línea" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin excepción</SelectItem>
                              {lineasVehiculos.map(linea => (
                                <SelectItem key={linea} value={linea}>
                                  {linea}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Versión (opcional)</Label>
                          <Select
                            value={excepcion.version || "all"}
                            onValueChange={(value) => {
                              const newExcepciones = [...formData.excepciones];
                              newExcepciones[index].version = value === "all" ? "" : value;
                              setFormData({...formData, excepciones: newExcepciones});
                            }}
                            disabled={!excepcion.linea}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Versión" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Toda la línea</SelectItem>
                              {excepcion.linea && versionesVehiculos[excepcion.linea]?.map(version => (
                                <SelectItem key={version} value={version}>
                                  {version}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}

                    <div>
                      <Label>Observaciones</Label>
                      <Input
                        value={formData.observaciones}
                        onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                        placeholder="Notas adicionales..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePlan}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingPlan ? 'Actualizar' : 'Crear'} Plan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedFinanciera || financieras[0]} onValueChange={setSelectedFinanciera}>
            <TabsList className="grid w-full grid-cols-3">
              {financieras.map(financiera => (
                <TabsTrigger key={financiera} value={financiera}>
                  {financiera}
                  {planesPorFinanciera[financiera] && (
                    <Badge className="ml-2" variant="secondary">
                      {planesPorFinanciera[financiera].length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {financieras.map(financiera => (
              <TabsContent key={financiera} value={financiera} className="space-y-4">
                {planesPorFinanciera[financiera]?.length ? (
                  <div className="space-y-3">
                    {planesPorFinanciera[financiera].map(plan => (
                      <Card key={plan.id} className="border-l-4 border-l-purple-400">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{plan.nombre}</h3>
                                <Badge variant={plan.activo ? "default" : "secondary"}>
                                  {plan.activo ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Tasa:</span>
                                  <div className="font-medium">{plan.tasa}%</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Plazo:</span>
                                  <div className="font-medium">{plan.plazo} meses</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Enganche:</span>
                                  <div className="font-medium">{plan.enganche_minimo}%</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Bono:</span>
                                  <div className="font-medium">${plan.bono_subsidio.toLocaleString()}</div>
                                </div>
                              </div>

                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-500">Aplicabilidad:</span>
                                  <span className="ml-2 text-blue-600">
                                    {getAplicabilidadText(plan)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Excepciones:</span>
                                  <span className="ml-2 text-red-600">
                                    {getExcepcionesText(plan)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPlan(plan)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePlan(plan.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay planes configurados para {financiera}</p>
                    <p className="text-sm">Haz clic en "Nuevo Plan" para comenzar</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
