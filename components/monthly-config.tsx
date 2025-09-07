
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Target, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Edit3,
  Save,
  X,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MonthlyConfigProps {
  currentVolume: number;
  currentSalespeople: number;
  onVolumeChange: (newVolume: number, autoOptimize?: boolean) => void;
  onSalespeopleChange: (newCount: number, autoOptimize?: boolean) => void;
}

export function MonthlyConfig({ 
  currentVolume, 
  currentSalespeople, 
  onVolumeChange, 
  onSalespeopleChange 
}: MonthlyConfigProps) {
  const [isEditingVolume, setIsEditingVolume] = useState(false);
  const [isEditingSalespeople, setIsEditingSalespeople] = useState(false);
  const [tempVolume, setTempVolume] = useState(currentVolume.toString());
  const [tempSalespeople, setTempSalespeople] = useState(currentSalespeople.toString());

  // CRÍTICO: Sincronizar valores temporales INMEDIATAMENTE cuando cambien los props
  useEffect(() => {
    console.log('🔄 MonthlyConfig - Volumen prop cambió de', tempVolume, 'a', currentVolume);
    setTempVolume(currentVolume.toString());
    // Forzar salida del modo de edición para mostrar el nuevo valor
    setIsEditingVolume(false);
  }, [currentVolume]);

  useEffect(() => {
    console.log('🔄 MonthlyConfig - Vendedores prop cambió de', tempSalespeople, 'a', currentSalespeople);
    setTempSalespeople(currentSalespeople.toString());
    // Forzar salida del modo de edición para mostrar el nuevo valor
    setIsEditingSalespeople(false);
  }, [currentSalespeople]);

  const getCurrentMonth = () => {
    const now = new Date();
    return now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  const saveVolume = (autoOptimize: boolean = false) => {
    const newVolume = parseInt(tempVolume);
    if (newVolume > 0 && newVolume <= 200) {
      onVolumeChange(newVolume, autoOptimize);
      setIsEditingVolume(false);
      if (autoOptimize) {
        toast.success(
          <div>
            <div className="font-semibold">🚀 Auto-optimización iniciada con {newVolume} unidades</div>
            <div className="text-xs mt-1">⚡ El sistema ejecutará optimización automáticamente</div>
          </div>, 
          { duration: 3000 }
        );
      } else {
        toast.success(
          <div>
            <div className="font-semibold">🎯 Volumen objetivo actualizado: {newVolume} unidades</div>
            <div className="text-xs mt-1">⚠️ Ejecuta nueva optimización para ver los cambios</div>
          </div>, 
          { duration: 5000 }
        );
      }
    } else {
      toast.error('❌ El volumen debe estar entre 1 y 200 unidades');
    }
  };

  const saveSalespeople = (autoOptimize: boolean = false) => {
    const newCount = parseInt(tempSalespeople);
    if (newCount > 0 && newCount <= 50) {
      onSalespeopleChange(newCount, autoOptimize);
      setIsEditingSalespeople(false);
      if (autoOptimize) {
        toast.success(
          <div>
            <div className="font-semibold">🚀 Auto-optimización iniciada con {newCount} vendedores</div>
            <div className="text-xs mt-1">⚡ El sistema ejecutará optimización automáticamente</div>
          </div>, 
          { duration: 3000 }
        );
      } else {
        toast.success(
          <div>
            <div className="font-semibold">👥 Equipo de ventas actualizado: {newCount} vendedores</div>
            <div className="text-xs mt-1">⚠️ Ejecuta nueva optimización para ver los cambios</div>
          </div>, 
          { duration: 5000 }
        );
      }
    } else {
      toast.error('❌ El número de vendedores debe estar entre 1 y 50');
    }
  };

  const cancelVolumeEdit = () => {
    setTempVolume(currentVolume.toString());
    setIsEditingVolume(false);
  };

  const cancelSalespeopleEdit = () => {
    setTempSalespeople(currentSalespeople.toString());
    setIsEditingSalespeople(false);
  };

  const averagePerSalesperson = Math.round((currentVolume / currentSalespeople) * 10) / 10;
  const isRealisticAverage = averagePerSalesperson >= 3 && averagePerSalesperson <= 15;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Configuración Mensual - {getCurrentMonth()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Volumen Mensual */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <Label className="font-semibold text-blue-900">Volumen Objetivo del Mes</Label>
              </div>
              {!isEditingVolume && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditingVolume(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isEditingVolume ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={tempVolume}
                    onChange={(e) => setTempVolume(e.target.value)}
                    className="w-32"
                    placeholder="Unidades"
                    min="1"
                    max="200"
                  />
                  <span className="text-sm text-gray-600">unidades</span>
                  <Button variant="ghost" size="sm" onClick={cancelVolumeEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => saveVolume(false)} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                  
                  <Button size="sm" onClick={() => saveVolume(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="h-4 w-4 mr-1" />
                    Guardar + Auto-Optimizar
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500">
                  💡 <strong>Auto-Optimizar:</strong> Guarda el volumen y ejecuta optimización automáticamente
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge key={`volume-badge-${currentVolume}-${Date.now()}`} variant="default" className="text-lg px-4 py-2">
                  🚗 {currentVolume} unidades
                </Badge>
                <span className="text-sm text-blue-600">
                  (Este valor cambia mes con mes según metas comerciales)
                </span>
              </div>
            )}
          </div>

          {/* Equipo de Ventas */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <Label className="font-semibold text-green-900">Equipo de Ventas</Label>
              </div>
              {!isEditingSalespeople && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditingSalespeople(true)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isEditingSalespeople ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={tempSalespeople}
                    onChange={(e) => setTempSalespeople(e.target.value)}
                    className="w-32"
                    placeholder="Vendedores"
                    min="1"
                    max="50"
                  />
                  <span className="text-sm text-gray-600">vendedores</span>
                  <Button variant="ghost" size="sm" onClick={cancelSalespeopleEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => saveSalespeople(false)} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                  
                  <Button size="sm" onClick={() => saveSalespeople(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="h-4 w-4 mr-1" />
                    Guardar + Auto-Optimizar
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500">
                  💡 <strong>Auto-Optimizar:</strong> Guarda el equipo y ejecuta optimización automáticamente
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge key={`salespeople-badge-${currentSalespeople}-${Date.now()}`} variant="secondary" className="text-lg px-4 py-2">
                  👥 {currentSalespeople} vendedores
                </Badge>
                <span className="text-sm text-green-600">
                  (Equipo activo para el período)
                </span>
              </div>
            )}
          </div>

          {/* Análisis de Carga de Trabajo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <Label className="font-semibold text-gray-900">Análisis de Carga de Trabajo</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-600">Promedio por vendedor</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averagePerSalesperson} unidades/mes
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-600">Meta semanal</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(averagePerSalesperson / 4 * 10) / 10} unidades/sem
                </p>
              </div>
            </div>

            {isRealisticAverage ? (
              <Alert className="mt-3 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ Carga de trabajo realista</strong><br />
                  El promedio de {averagePerSalesperson} unidades por vendedor está dentro del rango óptimo (3-15 unidades/mes).
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mt-3 border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>⚠️ Revisar carga de trabajo</strong><br />
                  {averagePerSalesperson < 3 
                    ? 'La carga promedio es muy baja. Considera reducir el equipo o aumentar el objetivo.' 
                    : 'La carga promedio es muy alta. Considera aumentar el equipo o reducir el objetivo.'}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Información Adicional */}
          <Alert className="border-blue-200 bg-blue-50">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>💡 Recordatorio:</strong> Estos valores pueden cambiar mes a mes. 
              Asegúrate de actualizarlos al inicio de cada período comercial junto con 
              los archivos de financieras y datos de ventas.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
