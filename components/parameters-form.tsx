
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, DollarSign, Users, Percent, RotateCcw, Edit3, Save, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { OptimizationParameters, VehicleLine } from '@/lib/types';
import toast from 'react-hot-toast';

interface ParametersFormProps {
  initialParameters: OptimizationParameters;
  vehicleLines: VehicleLine[];
  financialInstitutions: string[];
  onChange: (parameters: OptimizationParameters) => void;
}

export function ParametersForm({
  initialParameters,
  vehicleLines,
  financialInstitutions,
  onChange
}: ParametersFormProps) {
  const [parameters, setParameters] = useState<OptimizationParameters>(initialParameters);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [tempVolume, setTempVolume] = useState<string>('0');

  // CORRIGIDO: Sincronización controlada por referencia sin loops
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Solo sincronizar en el mount inicial
    if (!isInitialized) {
      console.log('🔄 ParametersForm - Inicialización única');
      setParameters(initialParameters);
      setIsInitialized(true);
    }
  }, []); // Solo en mount inicial

  // CORRIGIDO: Callback onChange con debounce y control de cambios
  useEffect(() => {
    if (!isInitialized) return; // No ejecutar hasta que esté inicializado
    
    const timeoutId = setTimeout(() => {
      console.log('📡 Enviando cambios a parent component');
      onChange(parameters);
    }, 300); // Debounce más largo para evitar loops

    return () => clearTimeout(timeoutId);
  }, [
    parameters.monthly_volume, 
    parameters.salespeople_count, 
    parameters.vehicle_volumes,
    parameters.vehicle_prices,
    parameters.engagement_preferences,
    parameters.bonus_weights,
    isInitialized
  ]); // Dependencias específicas sin onChange

  const updateParameter = (key: keyof OptimizationParameters, value: any) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateVehiclePrice = (vehicleName: string, price: number) => {
    setParameters(prev => ({
      ...prev,
      vehicle_prices: {
        ...prev.vehicle_prices,
        [vehicleName]: price
      }
    }));
  };

  const updateVehicleVolume = (vehicleName: string, volume: number) => {
    const safeVolume = Math.max(0, Math.min(50, volume)); // Limitar entre 0 y 50
    
    setParameters(prev => {
      const newVehicleVolumes = {
        ...prev.vehicle_volumes,
        [vehicleName]: safeVolume
      };
      
      // Calcular automáticamente el volumen total
      const newMonthlyVolume = Object.values(newVehicleVolumes).reduce((sum, vol) => sum + vol, 0);
      
      console.log('🚗 Volumen actualizado:', {
        vehiculo: vehicleName,
        volumen: safeVolume,
        total: newMonthlyVolume
      });
      
      return {
        ...prev,
        vehicle_volumes: newVehicleVolumes,
        monthly_volume: newMonthlyVolume
      };
    });
  };

  // Función para iniciar edición de un vehículo específico
  const startEditingVehicle = (vehicleName: string) => {
    setEditingVehicle(vehicleName);
    setTempVolume((parameters.vehicle_volumes[vehicleName] || 0).toString());
  };

  // Función para guardar edición de vehículo
  const saveVehicleEdit = (vehicleName: string) => {
    const newVolume = parseInt(tempVolume) || 0;
    if (newVolume >= 0 && newVolume <= 50) {
      updateVehicleVolume(vehicleName, newVolume);
      setEditingVehicle(null);
      toast.success(
        <div>
          <div className="font-semibold">🚗 {vehicleName} actualizado</div>
          <div className="text-xs mt-1">{newVolume} unidades asignadas</div>
        </div>, 
        { duration: 3000 }
      );
    } else {
      toast.error('❌ El volumen debe estar entre 0 y 50 unidades');
    }
  };

  // Función para cancelar edición
  const cancelVehicleEdit = () => {
    setEditingVehicle(null);
    setTempVolume('0');
  };

  // Función para redistribuir automáticamente
  const redistributeVehicles = () => {
    const targetVolume = parameters.monthly_volume;
    const availableVehicles = vehicleLines.filter(v => v.name);
    
    if (availableVehicles.length === 0 || targetVolume === 0) return;

    // Distribución proporcional basada en precios
    const totalPrice = availableVehicles.reduce((sum, v) => 
      sum + (parameters.vehicle_prices[v.name] || v.price_range.min), 0
    );

    const newVehicleVolumes: Record<string, number> = {};
    let remainingVolume = targetVolume;

    availableVehicles.forEach((vehicle, index) => {
      const vehiclePrice = parameters.vehicle_prices[vehicle.name] || vehicle.price_range.min;
      const proportion = vehiclePrice / totalPrice;
      
      if (index === availableVehicles.length - 1) {
        // Último vehículo recibe el volumen restante
        newVehicleVolumes[vehicle.name] = remainingVolume;
      } else {
        const allocatedVolume = Math.round(targetVolume * proportion);
        newVehicleVolumes[vehicle.name] = allocatedVolume;
        remainingVolume -= allocatedVolume;
      }
    });

    setParameters(prev => ({
      ...prev,
      vehicle_volumes: newVehicleVolumes
    }));

    toast.success(
      <div>
        <div className="font-semibold">🎯 Redistribución automática completada</div>
        <div className="text-xs mt-1">Volúmenes asignados por precio relativo</div>
      </div>, 
      { duration: 4000 }
    );
  };

  const updateEngagementPreference = (financiera: string, preference: number) => {
    setParameters(prev => ({
      ...prev,
      engagement_preferences: {
        ...prev.engagement_preferences,
        [financiera]: preference
      }
    }));
  };

  const updateBonusWeight = (type: string, weight: number) => {
    setParameters(prev => ({
      ...prev,
      bonus_weights: {
        ...prev.bonus_weights,
        [type]: weight / 100
      }
    }));
  };

  const resetToDefaults = () => {
    setParameters(initialParameters);
  };

  const totalBonusWeight = Object.values(parameters.bonus_weights).reduce((sum, w) => sum + w, 0);

  return (
    <div className="space-y-6">
      {/* Volúmenes por Línea de Vehículo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5 text-blue-500" />
              📊 Volumen de Ventas por Línea
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={redistributeVehicles} size="sm" variant="outline" className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Auto-Redistribuir
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            ✏️ <strong>Edición manual:</strong> Haz clic en cualquier número para ajustar unidades por línea.
            <br />
            💡 <strong>Tip:</strong> Útil cuando una línea no tiene inventario y necesitas reasignar a otra.
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicleLines.map((vehicle) => (
              <div key={vehicle.id} className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  {vehicle.name}
                  <Badge variant="outline" className="text-xs">
                    {vehicle.models.length} modelos
                  </Badge>
                </Label>
                
                {editingVehicle === vehicle.name ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={tempVolume}
                        onChange={(e) => setTempVolume(e.target.value)}
                        className="w-full text-center font-medium"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveVehicleEdit(vehicle.name);
                          } else if (e.key === 'Escape') {
                            cancelVehicleEdit();
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => saveVehicleEdit(vehicle.name)}
                        className="bg-green-600 hover:bg-green-700 px-2"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelVehicleEdit}
                        className="px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600">
                      Enter=guardar • Escape=cancelar
                    </p>
                  </div>
                ) : (
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => startEditingVehicle(vehicle.name)}
                  >
                    <div className="w-full p-3 border border-gray-200 rounded-lg text-center font-medium hover:border-blue-300 hover:bg-blue-50 transition-colors group-hover:shadow-sm">
                      <span className="text-lg">
                        {parameters.vehicle_volumes[vehicle.name] || 0}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">unidades</span>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 className="h-3 w-3 text-blue-500" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 text-center">
                  {parameters.vehicle_volumes[vehicle.name] > 0 && parameters.monthly_volume > 0 
                    ? `${((parameters.vehicle_volumes[vehicle.name] / parameters.monthly_volume) * 100).toFixed(1)}% del total`
                    : 'Sin asignar'
                  }
                </div>
              </div>
            ))}
          </div>
          
          {/* Alerta de desincronización */}
          {initialParameters.monthly_volume !== parameters.monthly_volume && (
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>⚠️ DESINCRONIZACIÓN DETECTADA</strong>
                <br />
                <div className="text-sm mt-1">
                  • Volumen configurado arriba: <strong>{initialParameters.monthly_volume} unidades</strong>
                  <br />
                  • Volumen calculado por líneas: <strong>{parameters.monthly_volume} unidades</strong>
                  <br />
                  💡 Usa <strong>"Auto-Redistribuir"</strong> para sincronizar automáticamente
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  initialParameters.monthly_volume !== parameters.monthly_volume 
                    ? 'text-amber-600' 
                    : 'text-blue-600'
                }`}>
                  {parameters.monthly_volume}
                </div>
                <div className="text-sm text-blue-800 font-medium">
                  🎯 Volumen Total
                </div>
                {initialParameters.monthly_volume !== parameters.monthly_volume && (
                  <div className="text-xs text-amber-600 mt-1">
                    Configurado: {initialParameters.monthly_volume}
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {parameters.salespeople_count}
                </div>
                <div className="text-sm text-green-800 font-medium">
                  👥 Vendedores
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {parameters.monthly_volume > 0 && parameters.salespeople_count > 0
                    ? Math.round(parameters.monthly_volume / parameters.salespeople_count * 10) / 10
                    : 0
                  }
                </div>
                <div className="text-sm text-purple-800 font-medium">
                  📈 Unidades/Vendedor
                </div>
              </div>
            </div>
          </div>

          {parameters.monthly_volume === 0 && (
            <div className="mt-3 text-center text-gray-500 italic">
              Ingresa el volumen esperado para cada línea de vehículo
            </div>
          )}

          {parameters.monthly_volume > 50 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <span>⚠️</span>
                <span className="text-sm font-medium">
                  Volumen alto detectado: {parameters.monthly_volume} unidades. Verifica si es correcto.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parámetros del Equipo de Ventas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-green-500" />
            Configuración del Equipo de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salespeople_count">Número de Vendedores</Label>
            <Input
              id="salespeople_count"
              type="number"
              min="1"
              max="20"
              value={parameters.salespeople_count}
              onChange={(e) => updateParameter('salespeople_count', parseInt(e.target.value) || 6)}
              className="text-center font-semibold"
            />
            <p className="text-xs text-gray-500">Vendedores activos en el equipo</p>
          </div>

          <div className="space-y-2">
            <Label>Carga de Trabajo</Label>
            <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded text-center">
              <span className="font-semibold text-xl text-gray-700">
                {parameters.monthly_volume > 0 && parameters.salespeople_count > 0
                  ? Math.round(parameters.monthly_volume / parameters.salespeople_count * 10) / 10
                  : 0
                }
              </span>
              <p className="text-xs text-gray-600 mt-1">unidades por vendedor</p>
              {parameters.monthly_volume > 0 && parameters.salespeople_count > 0 && (
                <p className="text-xs text-gray-500">
                  {parameters.monthly_volume / parameters.salespeople_count > 6 
                    ? '📈 Carga alta' 
                    : parameters.monthly_volume / parameters.salespeople_count < 3
                    ? '📉 Carga baja'
                    : '✅ Carga balanceada'
                  }
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Precios por Línea de Vehículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-green-500" />
            Precios por Línea de Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicleLines.map((vehicle) => (
              <div key={vehicle.id} className="space-y-2">
                <Label htmlFor={`price_${vehicle.id}`}>
                  {vehicle.name}
                  <Badge variant="outline" className="ml-2">
                    {vehicle.models.length} modelos
                  </Badge>
                </Label>
                <Input
                  id={`price_${vehicle.id}`}
                  type="number"
                  min="100000"
                  max="3000000"
                  step="10000"
                  value={parameters.vehicle_prices[vehicle.name] || 0}
                  onChange={(e) => updateVehiclePrice(vehicle.name, parseInt(e.target.value) || 0)}
                  className="font-medium"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>${vehicle.price_range.min.toLocaleString()}</span>
                  <span>${vehicle.price_range.max.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preferencias de Enganche por Financiera */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Percent className="h-5 w-5 text-purple-500" />
            Preferencias de Enganche por Financiera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {financialInstitutions.map((financiera) => (
              <div key={financiera} className="space-y-3">
                <Label>{financiera}</Label>
                <div className="space-y-2">
                  <Slider
                    value={[parameters.engagement_preferences[financiera] || 25]}
                    onValueChange={(value) => updateEngagementPreference(financiera, value[0])}
                    max={50}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">5%</span>
                    <Badge variant="secondary" className="font-semibold">
                      {parameters.engagement_preferences[financiera] || 25}%
                    </Badge>
                    <span className="text-sm text-gray-500">50%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pesos de Bonificación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-orange-500" />
            Pesos de Bonificación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Peso de Comisiones</Label>
              <div className="space-y-2">
                <Slider
                  value={[parameters.bonus_weights.commission * 100]}
                  onValueChange={(value) => updateBonusWeight('commission', value[0])}
                  max={100}
                  min={0}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">0%</span>
                  <Badge variant="secondary" className="font-semibold">
                    {Math.round(parameters.bonus_weights.commission * 100)}%
                  </Badge>
                  <span className="text-sm text-gray-500">100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Peso de Bonos</Label>
              <div className="space-y-2">
                <Slider
                  value={[parameters.bonus_weights.bonus * 100]}
                  onValueChange={(value) => updateBonusWeight('bonus', value[0])}
                  max={100}
                  min={0}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">0%</span>
                  <Badge variant="secondary" className="font-semibold">
                    {Math.round(parameters.bonus_weights.bonus * 100)}%
                  </Badge>
                  <span className="text-sm text-gray-500">100%</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total de pesos:</span>
            <Badge 
              variant={Math.abs(totalBonusWeight - 1) < 0.01 ? "default" : "destructive"}
              className="font-semibold"
            >
              {Math.round(totalBonusWeight * 100)}%
            </Badge>
          </div>

          {Math.abs(totalBonusWeight - 1) >= 0.01 && (
            <p className="text-sm text-amber-600 mt-2">
              ⚠️ Los pesos deberían sumar 100% para un balance óptimo
            </p>
          )}
        </CardContent>
      </Card>

      {/* Botón de Reset */}
      <div className="flex justify-center">
        <Button onClick={resetToDefaults} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Restaurar Valores por Defecto
        </Button>
      </div>
    </div>
  );
}
