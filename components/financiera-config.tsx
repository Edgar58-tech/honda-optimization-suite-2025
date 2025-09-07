

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Building2,
  CreditCard, 
  DollarSign, 
  Percent, 
  Plus,
  Copy,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  X,
  Car,
  Target,
  Settings
} from 'lucide-react';
import { PlanFinanciera, ConfigFinanciera, ExcepcionPlan } from '@/lib/types';
import { FinancieraPlanesManager } from './financiera-planes-manager';
import toast from 'react-hot-toast';

interface FinancieraConfigProps {
  onConfigChange?: (configs: Record<string, ConfigFinanciera>) => void;
}

// Líneas y versiones de vehículos Honda
const vehicleLines = ['CR-V', 'Civic', 'Accord', 'Pilot', 'Passport', 'Odyssey', 'Ridgeline', 'HR-V', 'Insight'];

const vehicleVersions: Record<string, string[]> = {
  'CR-V': ['LX', 'EX', 'EX-L', 'Touring'],
  'Civic': ['LX', 'Sport', 'EX', 'Sport Touring', 'Si', 'Type R'],
  'Accord': ['LX', 'Sport', 'EX-L', 'Touring', 'Hybrid'],
  'Pilot': ['LX', 'EX', 'EX-L', 'Touring', 'Black Edition'],
  'Passport': ['Sport', 'EX-L', 'Touring', 'Elite'],
  'Odyssey': ['LX', 'EX', 'EX-L', 'Touring', 'Elite'],
  'Ridgeline': ['Sport', 'RTL', 'RTL-E', 'Black Edition'],
  'HR-V': ['LX', 'Sport', 'EX-L'],
  'Insight': ['LX', 'EX', 'Touring']
};

const financieras = ['BBVA', 'Banorte', 'Santander'];

export function FinancieraConfig({ onConfigChange }: FinancieraConfigProps) {
  // Estados principales
  const [configuraciones, setConfiguraciones] = useState<Record<string, ConfigFinanciera>>({});
  const [financieraActiva, setFinancieraActiva] = useState<string>('BBVA');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Cargar configuraciones al montar
  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  // Valores precargados por financiera basados en análisis
  const getPrecargaFinanciera = (financiera: string) => {
    const precargas: Record<string, any> = {
      'BBVA': {
        participacion_financiera: 70,
        comision_apertura: 2.5,
        pago_distribuidor: 16.5,
        enganche_minimo: 20,
        enganche_maximo: 50,
        bono_subsidio: 24300 // Promedio de bonos BBVA del análisis
      },
      'Banorte': {
        participacion_financiera: 75,
        comision_apertura: 5.0,
        pago_distribuidor: 5.0,
        enganche_minimo: 10,
        enganche_maximo: 60,
        bono_subsidio: 15000 // Subsidios variables según análisis
      },
      'Santander': {
        participacion_financiera: 65,
        comision_apertura: 2.69,
        pago_distribuidor: 2.69,
        enganche_minimo: 15,
        enganche_maximo: 55,
        bono_subsidio: 12000 // Incentivos promedio Santander
      }
    };

    return precargas[financiera] || {
      participacion_financiera: 70,
      comision_apertura: 3.0,
      pago_distribuidor: 4.0,
      enganche_minimo: 20,
      enganche_maximo: 60,
      bono_subsidio: 10000
    };
  };

  // Cargar configuraciones desde API
  const cargarConfiguraciones = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/financiera-config');
      if (response.ok) {
        const data = await response.json();
        if (data.configuraciones && Object.keys(data.configuraciones).length > 0) {
          setConfiguraciones(data.configuraciones);
        } else {
          // Crear configuraciones iniciales
          inicializarConfiguraciones();
        }
      } else {
        inicializarConfiguraciones();
      }
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
      inicializarConfiguraciones();
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar configuraciones vacías
  const inicializarConfiguraciones = () => {
    const configsIniciales: Record<string, ConfigFinanciera> = {};
    
    financieras.forEach(financiera => {
      const valoresPrecargados = getPrecargaFinanciera(financiera);
      configsIniciales[financiera] = {
        nombre: financiera,
        planes: [{
          id: `${financiera}-plan-base`,
          nombre: `Plan Base ${financiera}`,
          lineas_aplicables: [""], // Vacío = todos los vehículos
          versiones_aplicables: [""], // Vacío = todas las versiones
          excepciones: [], // Sin excepciones inicialmente
          participacion_financiera: valoresPrecargados.participacion_financiera,
          comision_apertura: valoresPrecargados.comision_apertura,
          pago_distribuidor: valoresPrecargados.pago_distribuidor,
          enganche_minimo: valoresPrecargados.enganche_minimo,
          enganche_maximo: valoresPrecargados.enganche_maximo,
          bono_subsidio: valoresPrecargados.bono_subsidio,
          es_generico: true
        }]
      };
    });

    setConfiguraciones(configsIniciales);
  };

  // Duplicar plan existente
  const duplicarPlan = (financiera: string, planId: string) => {
    const config = configuraciones[financiera];
    const planOriginal = config.planes.find(p => p.id === planId);
    
    if (!planOriginal) return;

    const nuevoPlan: PlanFinanciera = {
      ...planOriginal,
      id: `${financiera}-plan-${Date.now()}`,
      nombre: `${planOriginal.nombre} (Copia)`,
      es_generico: false
    };

    setConfiguraciones(prev => ({
      ...prev,
      [financiera]: {
        ...prev[financiera],
        planes: [...prev[financiera].planes, nuevoPlan]
      }
    }));

    setHasChanges(true);
    toast.success('Plan duplicado exitosamente');
  };

  // Agregar nuevo plan
  const agregarPlan = (financiera: string) => {
    const valoresPrecargados = getPrecargaFinanciera(financiera);
    
    const nuevoPlan: PlanFinanciera = {
      id: `${financiera}-plan-${Date.now()}`,
      nombre: `Nuevo Plan ${financiera}`,
      lineas_aplicables: [""], // Por defecto: todos
      versiones_aplicables: [""], // Por defecto: todas
      excepciones: [],
      participacion_financiera: valoresPrecargados.participacion_financiera,
      comision_apertura: valoresPrecargados.comision_apertura,
      pago_distribuidor: valoresPrecargados.pago_distribuidor,
      enganche_minimo: valoresPrecargados.enganche_minimo,
      enganche_maximo: valoresPrecargados.enganche_maximo,
      bono_subsidio: valoresPrecargados.bono_subsidio,
      es_generico: false
    };

    setConfiguraciones(prev => ({
      ...prev,
      [financiera]: {
        ...prev[financiera],
        planes: [...prev[financiera].planes, nuevoPlan]
      }
    }));

    setHasChanges(true);
    toast.success('Nuevo plan agregado');
  };

  // Actualizar plan
  const actualizarPlan = (financiera: string, planId: string, campo: string, valor: any) => {
    setConfiguraciones(prev => ({
      ...prev,
      [financiera]: {
        ...prev[financiera],
        planes: prev[financiera].planes.map(plan => 
          plan.id === planId 
            ? { ...plan, [campo]: valor }
            : plan
        )
      }
    }));

    setHasChanges(true);
  };

  // Eliminar plan
  const eliminarPlan = (financiera: string, planId: string) => {
    setConfiguraciones(prev => ({
      ...prev,
      [financiera]: {
        ...prev[financiera],
        planes: prev[financiera].planes.filter(plan => plan.id !== planId)
      }
    }));

    setHasChanges(true);
    toast.success('Plan eliminado');
  };

  // Agregar línea aplicable
  const agregarLineaAplicable = (financiera: string, planId: string) => {
    const config = configuraciones[financiera];
    const plan = config.planes.find(p => p.id === planId);
    if (!plan) return;

    const nuevasLineas = [...plan.lineas_aplicables, ""];
    actualizarPlan(financiera, planId, 'lineas_aplicables', nuevasLineas);
  };

  // Actualizar línea aplicable
  const actualizarLineaAplicable = (financiera: string, planId: string, index: number, valor: string) => {
    const config = configuraciones[financiera];
    const plan = config.planes.find(p => p.id === planId);
    if (!plan) return;

    const nuevasLineas = [...plan.lineas_aplicables];
    nuevasLineas[index] = valor;

    // Validación: si línea es vacía, versión correspondiente debe ser vacía
    const nuevasVersiones = [...plan.versiones_aplicables];
    if (valor === "" && nuevasVersiones[index] !== "") {
      nuevasVersiones[index] = "";
      actualizarPlan(financiera, planId, 'versiones_aplicables', nuevasVersiones);
    }

    actualizarPlan(financiera, planId, 'lineas_aplicables', nuevasLineas);
  };

  // Actualizar versión aplicable
  const actualizarVersionAplicable = (financiera: string, planId: string, index: number, valor: string) => {
    const config = configuraciones[financiera];
    const plan = config.planes.find(p => p.id === planId);
    if (!plan) return;

    // Validación: no puede haber versión con valor si línea está vacía
    if (plan.lineas_aplicables[index] === "" && valor !== "") {
      toast.error('No puedes especificar versión si la línea está vacía');
      return;
    }

    const nuevasVersiones = [...plan.versiones_aplicables];
    nuevasVersiones[index] = valor;
    actualizarPlan(financiera, planId, 'versiones_aplicables', nuevasVersiones);
  };

  // Eliminar línea/versión aplicable
  const eliminarLineaVersion = (financiera: string, planId: string, index: number) => {
    const config = configuraciones[financiera];
    const plan = config.planes.find(p => p.id === planId);
    if (!plan || plan.lineas_aplicables.length <= 1) return;

    const nuevasLineas = plan.lineas_aplicables.filter((_, i) => i !== index);
    const nuevasVersiones = plan.versiones_aplicables.filter((_, i) => i !== index);
    
    actualizarPlan(financiera, planId, 'lineas_aplicables', nuevasLineas);
    actualizarPlan(financiera, planId, 'versiones_aplicables', nuevasVersiones);
  };

  // Agregar excepción
  const agregarExcepcion = (financiera: string, planId: string) => {
    const config = configuraciones[financiera];
    const plan = config.planes.find(p => p.id === planId);
    if (!plan || plan.excepciones.length >= 3) return;

    const nuevaExcepcion: ExcepcionPlan = {
      id: `exc-${Date.now()}`,
      linea: "",
      version: ""
    };

    const nuevasExcepciones = [...plan.excepciones, nuevaExcepcion];
    actualizarPlan(financiera, planId, 'excepciones', nuevasExcepciones);
  };

  // Actualizar excepción
  const actualizarExcepcion = (financiera: string, planId: string, excIndex: number, campo: string, valor: string) => {
    const config = configuraciones[financiera];
    const plan = config.planes.find(p => p.id === planId);
    if (!plan) return;

    const nuevasExcepciones = [...plan.excepciones];
    nuevasExcepciones[excIndex] = { ...nuevasExcepciones[excIndex], [campo]: valor };

    // Validación: si línea está vacía, versión debe estar vacía
    if (campo === 'linea' && valor === "") {
      nuevasExcepciones[excIndex].version = "";
    }

    // Validación: no puede haber versión con valor si línea está vacía  
    if (campo === 'version' && valor !== "" && nuevasExcepciones[excIndex].linea === "") {
      toast.error('No puedes especificar versión si la línea está vacía');
      return;
    }

    actualizarPlan(financiera, planId, 'excepciones', nuevasExcepciones);
  };

  // Eliminar excepción
  const eliminarExcepcion = (financiera: string, planId: string, excIndex: number) => {
    const config = configuraciones[financiera];
    const plan = config.planes.find(p => p.id === planId);
    if (!plan) return;

    const nuevasExcepciones = plan.excepciones.filter((_, i) => i !== excIndex);
    actualizarPlan(financiera, planId, 'excepciones', nuevasExcepciones);
  };

  // Guardar configuraciones
  const guardarConfiguracion = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/financiera-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configuraciones }),
      });

      if (response.ok) {
        setHasChanges(false);
        toast.success('Configuración guardada exitosamente');
        if (onConfigChange) {
          onConfigChange(configuraciones);
        }
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm text-gray-600">Cargando configuraciones financieras...</p>
        </div>
      </div>
    );
  }

  const configActual = configuraciones[financieraActiva];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <CardTitle>Configuración de Financieras</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Cambios sin guardar
                </Badge>
              )}
              <Button 
                onClick={guardarConfiguracion}
                disabled={!hasChanges || isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sistema de pestañas principal: Configuración vs Gestión de Planes */}
      <Tabs defaultValue="gestion-planes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gestion-planes" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gestión de Planes (Nuevo)
          </TabsTrigger>
          <TabsTrigger value="config-avanzada" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Configuración Avanzada (Legacy)
          </TabsTrigger>
        </TabsList>

        {/* Nueva pestaña de gestión de planes */}
        <TabsContent value="gestion-planes">
          <FinancieraPlanesManager
            financieras={financieras}
            lineasVehiculos={vehicleLines}
            versionesVehiculos={vehicleVersions}
            onPlanesChange={() => {
              // Recargar configuraciones cuando cambian los planes
              cargarConfiguraciones();
            }}
          />
        </TabsContent>

        {/* Pestaña de configuración legacy */}
        <TabsContent value="config-avanzada">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Configuración Legacy por Financiera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={financieraActiva} onValueChange={setFinancieraActiva}>
                <TabsList className="grid w-full grid-cols-3">
                  {financieras.map((financiera) => (
                    <TabsTrigger key={financiera} value={financiera} className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {financiera}
                      {configuraciones[financiera] && (
                        <Badge variant="secondary" className="ml-1">
                          {configuraciones[financiera].planes.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {financieras.map((financiera) => (
                  <TabsContent key={financiera} value={financiera} className="mt-4">
                    <FinancieraContent
                      financiera={financiera}
                      config={configuraciones[financiera]}
                      onDuplicarPlan={duplicarPlan}
                      onAgregarPlan={agregarPlan}
                      onActualizarPlan={actualizarPlan}
                      onEliminarPlan={eliminarPlan}
                      onAgregarLineaAplicable={agregarLineaAplicable}
                      onActualizarLineaAplicable={actualizarLineaAplicable}
                      onActualizarVersionAplicable={actualizarVersionAplicable}
                      onEliminarLineaVersion={eliminarLineaVersion}
                      onAgregarExcepcion={agregarExcepcion}
                      onActualizarExcepcion={actualizarExcepcion}
                      onEliminarExcepcion={eliminarExcepcion}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para el contenido de cada financiera
interface FinancieraContentProps {
  financiera: string;
  config: ConfigFinanciera;
  onDuplicarPlan: (financiera: string, planId: string) => void;
  onAgregarPlan: (financiera: string) => void;
  onActualizarPlan: (financiera: string, planId: string, campo: string, valor: any) => void;
  onEliminarPlan: (financiera: string, planId: string) => void;
  onAgregarLineaAplicable: (financiera: string, planId: string) => void;
  onActualizarLineaAplicable: (financiera: string, planId: string, index: number, valor: string) => void;
  onActualizarVersionAplicable: (financiera: string, planId: string, index: number, valor: string) => void;
  onEliminarLineaVersion: (financiera: string, planId: string, index: number) => void;
  onAgregarExcepcion: (financiera: string, planId: string) => void;
  onActualizarExcepcion: (financiera: string, planId: string, excIndex: number, campo: string, valor: string) => void;
  onEliminarExcepcion: (financiera: string, planId: string, excIndex: number) => void;
}

function FinancieraContent({
  financiera,
  config,
  onDuplicarPlan,
  onAgregarPlan,
  onActualizarPlan,
  onEliminarPlan,
  onAgregarLineaAplicable,
  onActualizarLineaAplicable,
  onActualizarVersionAplicable,
  onEliminarLineaVersion,
  onAgregarExcepcion,
  onActualizarExcepcion,
  onEliminarExcepcion
}: FinancieraContentProps) {
  if (!config) {
    return <div>No hay configuración disponible para {financiera}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Botón Agregar Plan */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Planes de {financiera}</h3>
        <Button
          onClick={() => onAgregarPlan(financiera)}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {/* Lista de Planes */}
      <div className="space-y-4">
        {config.planes.map((plan) => (
          <PlanCard
            key={plan.id}
            financiera={financiera}
            plan={plan}
            onDuplicar={onDuplicarPlan}
            onActualizar={onActualizarPlan}
            onEliminar={onEliminarPlan}
            onAgregarLineaAplicable={onAgregarLineaAplicable}
            onActualizarLineaAplicable={onActualizarLineaAplicable}
            onActualizarVersionAplicable={onActualizarVersionAplicable}
            onEliminarLineaVersion={onEliminarLineaVersion}
            onAgregarExcepcion={onAgregarExcepcion}
            onActualizarExcepcion={onActualizarExcepcion}
            onEliminarExcepcion={onEliminarExcepcion}
          />
        ))}
      </div>
    </div>
  );
}

// Componente para cada plan individual
interface PlanCardProps {
  financiera: string;
  plan: PlanFinanciera;
  onDuplicar: (financiera: string, planId: string) => void;
  onActualizar: (financiera: string, planId: string, campo: string, valor: any) => void;
  onEliminar: (financiera: string, planId: string) => void;
  onAgregarLineaAplicable: (financiera: string, planId: string) => void;
  onActualizarLineaAplicable: (financiera: string, planId: string, index: number, valor: string) => void;
  onActualizarVersionAplicable: (financiera: string, planId: string, index: number, valor: string) => void;
  onEliminarLineaVersion: (financiera: string, planId: string, index: number) => void;
  onAgregarExcepcion: (financiera: string, planId: string) => void;
  onActualizarExcepcion: (financiera: string, planId: string, excIndex: number, campo: string, valor: string) => void;
  onEliminarExcepcion: (financiera: string, planId: string, excIndex: number) => void;
}

function PlanCard({
  financiera,
  plan,
  onDuplicar,
  onActualizar,
  onEliminar,
  onAgregarLineaAplicable,
  onActualizarLineaAplicable,
  onActualizarVersionAplicable,
  onEliminarLineaVersion,
  onAgregarExcepcion,
  onActualizarExcepcion,
  onEliminarExcepcion
}: PlanCardProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <Input
              value={plan.nombre}
              onChange={(e) => onActualizar(financiera, plan.id, 'nombre', e.target.value)}
              className="font-semibold text-lg border-none p-0 h-auto focus-visible:ring-0"
            />
            {plan.es_generico && (
              <Badge variant="secondary">Plan Base</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onDuplicar(financiera, plan.id)}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4" />
            </Button>
            {!plan.es_generico && (
              <Button
                onClick={() => onEliminar(financiera, plan.id)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Líneas y Versiones Aplicables */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Líneas y Versiones Aplicables</Label>
            <Button
              onClick={() => onAgregarLineaAplicable(financiera, plan.id)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar
            </Button>
          </div>
          
          <div className="space-y-2">
            {plan.lineas_aplicables.map((linea, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={linea}
                  onValueChange={(valor) => onActualizarLineaAplicable(financiera, plan.id, index, valor)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Línea" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las líneas</SelectItem>
                    {vehicleLines.map((line) => (
                      <SelectItem key={line} value={line}>
                        {line}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={plan.versiones_aplicables[index] || ""}
                  onValueChange={(valor) => onActualizarVersionAplicable(financiera, plan.id, index, valor)}
                  disabled={linea === ""}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Versión" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las versiones</SelectItem>
                    {linea && vehicleVersions[linea]?.map((version) => (
                      <SelectItem key={version} value={version}>
                        {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {plan.lineas_aplicables.length > 1 && (
                  <Button
                    onClick={() => onEliminarLineaVersion(financiera, plan.id, index)}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}

                <div className="text-xs text-gray-500 flex items-center">
                  <Car className="h-3 w-3 mr-1" />
                  {linea === "" ? "Todos los vehículos" : 
                   plan.versiones_aplicables[index] === "" ? `Toda la línea ${linea}` : 
                   `${linea} ${plan.versiones_aplicables[index]}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Excepciones */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Excepciones (Líneas que NO aplican)</Label>
            <Button
              onClick={() => onAgregarExcepcion(financiera, plan.id)}
              variant="outline"
              size="sm"
              disabled={plan.excepciones.length >= 3}
            >
              <Plus className="h-3 w-3 mr-1" />
              Excepción ({plan.excepciones.length}/3)
            </Button>
          </div>

          {plan.excepciones.length > 0 ? (
            <div className="space-y-2">
              {plan.excepciones.map((excepcion, excIndex) => (
                <div key={excepcion.id} className="flex items-center gap-2 p-2 border rounded">
                  <Select
                    value={excepcion.linea}
                    onValueChange={(valor) => onActualizarExcepcion(financiera, plan.id, excIndex, 'linea', valor)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Línea" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seleccionar línea</SelectItem>
                      {vehicleLines.map((line) => (
                        <SelectItem key={line} value={line}>
                          {line}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={excepcion.version || ""}
                    onValueChange={(valor) => onActualizarExcepcion(financiera, plan.id, excIndex, 'version', valor)}
                    disabled={excepcion.linea === ""}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Versión" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toda la línea</SelectItem>
                      {excepcion.linea && vehicleVersions[excepcion.linea]?.map((version) => (
                        <SelectItem key={version} value={version}>
                          {version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => onEliminarExcepcion(financiera, plan.id, excIndex)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>

                  <div className="text-xs text-red-600 flex items-center">
                    <X className="h-3 w-3 mr-1" />
                    NO aplica: {excepcion.linea === "" ? "Sin definir" : 
                              excepcion.version === "" ? `Toda línea ${excepcion.linea}` : 
                              `${excepcion.linea} ${excepcion.version}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Sin excepciones - Este plan aplica para todas las líneas/versiones especificadas</p>
          )}
        </div>

        <Separator />

        {/* Parámetros Financieros */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <Label className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              Part. Financiera
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              value={plan.participacion_financiera}
              onChange={(e) => onActualizar(financiera, plan.id, 'participacion_financiera', parseFloat(e.target.value))}
            />
            <div className="text-xs text-gray-500">{plan.participacion_financiera}%</div>
          </div>

          <div>
            <Label>Com. Apertura</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={plan.comision_apertura}
              onChange={(e) => onActualizar(financiera, plan.id, 'comision_apertura', parseFloat(e.target.value))}
            />
            <div className="text-xs text-gray-500">{plan.comision_apertura}%</div>
          </div>

          <div>
            <Label>Pago Dist.</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={plan.pago_distribuidor}
              onChange={(e) => onActualizar(financiera, plan.id, 'pago_distribuidor', parseFloat(e.target.value))}
            />
            <div className="text-xs text-gray-500">{plan.pago_distribuidor}%</div>
          </div>

          <div>
            <Label>Enganche Mín.</Label>
            <Input
              type="number"
              min="0"
              max="99"
              step="1"
              value={plan.enganche_minimo}
              onChange={(e) => onActualizar(financiera, plan.id, 'enganche_minimo', parseFloat(e.target.value))}
            />
            <div className="text-xs text-gray-500">{plan.enganche_minimo}%</div>
          </div>

          <div>
            <Label>Enganche Máx.</Label>
            <Input
              type="number"
              min="0"
              max="99"
              step="1"
              value={plan.enganche_maximo}
              onChange={(e) => onActualizar(financiera, plan.id, 'enganche_maximo', parseFloat(e.target.value))}
            />
            <div className="text-xs text-gray-500">{plan.enganche_maximo}%</div>
          </div>

          <div>
            <Label className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Bono/Subsidio
            </Label>
            <Input
              type="number"
              min="0"
              step="100"
              value={plan.bono_subsidio}
              onChange={(e) => onActualizar(financiera, plan.id, 'bono_subsidio', parseFloat(e.target.value) || 0)}
            />
            <div className="text-xs text-gray-500">
              ${plan.bono_subsidio?.toLocaleString('es-MX') || '0'}
            </div>
          </div>
        </div>

        {/* Vista previa de cálculo */}
        <div className="bg-blue-50 p-3 rounded-lg border">
          <div className="text-sm font-medium text-blue-800 mb-2">Vista Previa (Vehículo $400,000) - Cálculo Real</div>
          {(() => {
            const precioLista = 400000;
            const bonoBruto = plan.bono_subsidio || 0;
            const participacionDistribuidor = (100 - plan.participacion_financiera) / 100;
            const costoBonoDistribuidor = bonoBruto * participacionDistribuidor;
            const precioAjustado = precioLista - bonoBruto;
            const enganches = precioLista * plan.enganche_minimo / 100;
            const saldoFinanciar = precioAjustado - enganches;
            const comisionApertura = saldoFinanciar * plan.comision_apertura / 100;
            const pagoDistribuidor = saldoFinanciar * plan.pago_distribuidor / 100;
            const utilidadReal = pagoDistribuidor - costoBonoDistribuidor;

            return (
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <span className="text-gray-600">Precio Lista:</span>
                  <div className="font-medium">${precioLista.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Bono Cliente:</span>
                  <div className="font-medium text-red-600">-${bonoBruto.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Costo Distribuidor:</span>
                  <div className="font-medium text-orange-600">${costoBonoDistribuidor.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Saldo a Financiar:</span>
                  <div className="font-medium">${saldoFinanciar.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Pago Distribuidor:</span>
                  <div className="font-medium text-blue-600">${pagoDistribuidor.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Utilidad REAL:</span>
                  <div className="font-medium text-green-600">${utilidadReal.toLocaleString()}</div>
                </div>
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
