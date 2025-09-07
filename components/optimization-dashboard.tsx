
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Car, 
  DollarSign, 
  Target, 
  Zap,
  BarChart3,
  PieChart,
  Download,
  Upload,
  Settings,
  History,
  FolderOpen,
  Building,
  Building2,
  LogOut,
  User,
  Crown,
  Briefcase,
  Users,
  RefreshCw,
  Rocket,
  CheckCircle,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import { HondaOptimizationEngine } from '@/lib/optimization-engine';
import { dataProcessor } from '@/lib/data-processor';
import { OptimizationResult, OptimizationParameters, HondaDatabase } from '@/lib/types';
import { ParametersForm } from './parameters-form';
import { ResultsVisualization } from './results-visualization';
import { PDFReportGenerator } from './pdf-report-generator';
import { HistoricalAnalysis } from './historical-analysis';
import { SensitivityAnalysis } from './sensitivity-analysis';
import { FileManager } from './file-manager';
import { MonthlyConfig } from './monthly-config';
import { CompanyDataForm } from './company-data-form';
import { BrandPriceUpdater } from './brand-price-updater';
import { DeploymentManager } from './deployment-manager';
import { FinancieraConfig } from './financiera-config';
import { FinancieraPlanesManager } from './financiera-planes-manager';
import { UserManagement } from './user-management';

export function OptimizationDashboard() {
  const [database, setDatabase] = useState<HondaDatabase | null>(null);
  const [parameters, setParameters] = useState<OptimizationParameters | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState('parameters');
  const [stats, setStats] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Solo para forzar re-renderizado cuando sea necesario
  const [companyBrand, setCompanyBrand] = useState<string>('Honda'); // NUEVA: Marca de la empresa
  
  // Session y usuario
  const { data: session } = useSession() || {};
  const user = session?.user as any;

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
    loadCompanyBrand();
  }, []);

  // Cargar marca de la empresa
  const loadCompanyBrand = async () => {
    try {
      const response = await fetch('/api/company-data');
      if (response.ok) {
        const data = await response.json();
        if (data.companyData?.marca) {
          setCompanyBrand(data.companyData.marca);
          // Actualizar título del documento dinámicamente
          document.title = `${data.companyData.marca} Optimization Suite`;
          console.log('🏢 Marca cargada:', data.companyData.marca);
        }
      }
    } catch (error) {
      console.log('⚠️ No se pudo cargar la marca, usando Honda por defecto');
      document.title = 'Honda Optimization Suite';
    }
  };

  // SIMPLIFICADO: Solo log cuando parameters cambie
  useEffect(() => {
    if (parameters) {
      console.log('🔄 Parámetros actualizados:', {
        volumen: parameters.monthly_volume,
        vendedores: parameters.salespeople_count
      });
    }
  }, [parameters]);

  const loadInitialData = async () => {
    try {
      const db = await dataProcessor.loadHondaDatabase();
      const defaultParams = dataProcessor.getDefaultParameters();
      const generalStats = dataProcessor.getGeneralStats();
      
      setDatabase(db);
      setParameters(defaultParams);
      setStats(generalStats);
      
      console.log('📊 DATOS INICIALIZADOS:', {
        volumen: defaultParams.monthly_volume,
        vendedores: defaultParams.salespeople_count
      });
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  };

  // Función para crear optimización con parámetros específicos
  const runOptimizationWithParams = async (overrideParams?: Partial<OptimizationParameters>) => {
    if (!database || !parameters) return;

    setIsOptimizing(true);
    
    try {
      // CRÍTICO: Usar parámetros override si se proporcionan, sino usar los actuales
      const baseParams = overrideParams ? { ...parameters, ...overrideParams } : { ...parameters };
      
      // Verificación de estado CRÍTICA
      const vehicleVolumeSum = Object.values(baseParams.vehicle_volumes || {}).reduce((sum, vol) => sum + (vol as number), 0);
      
      console.log('🔍 VERIFICACIÓN PRE-OPTIMIZACIÓN:', {
        base_monthly_volume: baseParams.monthly_volume,
        calculated_vehicle_sum: vehicleVolumeSum,
        override_applied: !!overrideParams,
        parameters_used: baseParams
      });
      
      // Si hay desincronización, CORREGIR inmediatamente
      if (baseParams.monthly_volume !== vehicleVolumeSum) {
        console.log('⚠️ DESINCRONIZACIÓN DETECTADA - Corrigiendo automáticamente...');
        
        // Forzar re-distribución de vehículos
        const targetVolume = baseParams.monthly_volume;
        const scaleFactor = targetVolume / vehicleVolumeSum;
        
        const correctedVehicleVolumes: Record<string, number> = {};
        for (const [vehicle, volume] of Object.entries(baseParams.vehicle_volumes || {})) {
          correctedVehicleVolumes[vehicle] = Math.round((volume as number) * scaleFactor);
        }
        
        // Ajustar diferencias
        const correctedSum = Object.values(correctedVehicleVolumes).reduce((sum, vol) => sum + vol, 0);
        const difference = targetVolume - correctedSum;
        
        if (difference !== 0) {
          const sortedVehicles = Object.keys(correctedVehicleVolumes)
            .sort((a, b) => correctedVehicleVolumes[b] - correctedVehicleVolumes[a]);
          
          for (let i = 0; i < Math.abs(difference) && i < sortedVehicles.length; i++) {
            const vehicle = sortedVehicles[i];
            if (difference > 0) {
              correctedVehicleVolumes[vehicle]++;
            } else if (correctedVehicleVolumes[vehicle] > 0) {
              correctedVehicleVolumes[vehicle]--;
            }
          }
        }
        
        // Actualizar parámetros corregidos
        baseParams.vehicle_volumes = correctedVehicleVolumes;
        
        console.log('✅ CORRECCIÓN AUTOMÁTICA APLICADA:', {
          target: targetVolume,
          corrected_sum: Object.values(correctedVehicleVolumes).reduce((sum, vol) => sum + vol, 0),
          corrected_volumes: correctedVehicleVolumes
        });
      }
      
      // Log de parámetros FINALES para debugging
      console.log('🚀 Iniciando optimización con parámetros FINALES:', {
        monthly_volume: baseParams.monthly_volume,
        salespeople_count: baseParams.salespeople_count,
        vehicle_volumes: baseParams.vehicle_volumes,
        total_vehicles: Object.values(baseParams.vehicle_volumes).reduce((sum, vol) => sum + (vol as number), 0)
      });

      const engine = new HondaOptimizationEngine(database);
      const result = await engine.optimize(baseParams);
      
      // Verificar que el resultado usa los parámetros correctos
      console.log('✅ Optimización completada:', {
        parameters_used: {
          volume: baseParams.monthly_volume,
          salespeople: baseParams.salespeople_count
        },
        result_summary: {
          total_profit: result.total_profit,
          total_units: result.variables.reduce((sum, v) => sum + v.quantity, 0),
          algorithm_used: result.algorithm_used
        }
      });
      
      setOptimizationResult(result);
      
      // Actualizar el estado con los parámetros finales usados
      setParameters(baseParams);
      
      // Guardar en histórico
      dataProcessor.saveHistoricalData({
        date: new Date().toISOString(),
        parameters: baseParams,
        result: result,
        notes: `Optimización con ${baseParams.monthly_volume} unidades y ${baseParams.salespeople_count} vendedores - ${new Date().toLocaleDateString()}`
      });

      // Actualizar estadísticas
      const updatedStats = dataProcessor.getGeneralStats();
      setStats(updatedStats);
      
      setActiveTab('results');
    } catch (error) {
      console.error('❌ Error en optimización:', error);
      // Mostrar error al usuario
      alert(`Error en la optimización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Función regular de optimización
  const runOptimization = async () => {
    await runOptimizationWithParams();
  };

  const handleParametersChange = (newParameters: OptimizationParameters) => {
    setParameters(newParameters);
  };

  const handleVolumeChange = (newVolume: number, autoOptimize: boolean = false) => {
    if (!parameters || newVolume === parameters.monthly_volume) return;
    
    // Calcular el factor de escala basado en el cambio de volumen
    const currentTotal = Object.values(parameters.vehicle_volumes).reduce((sum, vol) => sum + vol, 0);
    if (currentTotal === 0) return;
    
    const scaleFactor = newVolume / currentTotal;
    
    // Actualizar volúmenes de vehículos proporcionalmente
    const updatedVehicleVolumes: Record<string, number> = {};
    Object.keys(parameters.vehicle_volumes).forEach(vehicle => {
      const scaledVolume = Math.round(parameters.vehicle_volumes[vehicle] * scaleFactor);
      updatedVehicleVolumes[vehicle] = Math.max(0, scaledVolume);
    });
    
    // Ajustar para que la suma sea exactamente el nuevo volumen
    const newTotal = Object.values(updatedVehicleVolumes).reduce((sum, vol) => sum + vol, 0);
    const difference = newVolume - newTotal;
    
    if (difference !== 0) {
      const sortedVehicles = Object.keys(updatedVehicleVolumes)
        .sort((a, b) => updatedVehicleVolumes[b] - updatedVehicleVolumes[a]);
      
      for (let i = 0; i < Math.abs(difference) && i < sortedVehicles.length; i++) {
        const vehicle = sortedVehicles[i];
        if (difference > 0) {
          updatedVehicleVolumes[vehicle]++;
        } else if (updatedVehicleVolumes[vehicle] > 0) {
          updatedVehicleVolumes[vehicle]--;
        }
      }
    }

    const updatedParameters = { 
      ...parameters, 
      monthly_volume: newVolume,
      vehicle_volumes: updatedVehicleVolumes
    };
    
    console.log('📊 Volumen actualizado:', { anterior: currentTotal, nuevo: newVolume });
    
    // CORREGIDO: Una sola actualización para evitar loops
    setParameters(updatedParameters);
    
    if (autoOptimize) {
      setTimeout(() => runOptimizationWithParams(updatedParameters), 100);
    } else {
      setOptimizationResult(null);
    }
  };

  const handleSalespeopleChange = (newCount: number, autoOptimize: boolean = false) => {
    if (!parameters || newCount === parameters.salespeople_count) return;
    
    const updatedParameters = { ...parameters, salespeople_count: newCount };
    
    console.log('👥 Equipo actualizado:', { anterior: parameters.salespeople_count, nuevo: newCount });
    
    // CORREGIDO: Una sola actualización para evitar loops
    setParameters(updatedParameters);
    
    if (autoOptimize) {
      setTimeout(() => runOptimizationWithParams(updatedParameters), 100);
    } else {
      setOptimizationResult(null);
    }
  };

  // Función para actualizar precios por marca
  const handlePricesUpdate = (newPrices: Record<string, number>, newVolumes: Record<string, number>) => {
    if (parameters) {
      const updatedParameters = {
        ...parameters,
        vehicle_prices: newPrices,
        vehicle_volumes: newVolumes,
        monthly_volume: Object.values(newVolumes).reduce((sum, vol) => sum + vol, 0)
      };
      
      setParameters(updatedParameters);

      setRefreshKey(prev => prev + 1);
      
      console.log('💰 Precios actualizados:', {
        lines: Object.keys(newPrices).length,
        total_volume: updatedParameters.monthly_volume,
        avg_price: Math.round(Object.values(newPrices).reduce((sum, price) => sum + price, 0) / Object.keys(newPrices).length)
      });

      // Limpiar resultado anterior para forzar nueva optimización
      setOptimizationResult(null);
    }
  };

  // Función para refrescar marca desde empresa
  const handleBrandRefresh = () => {
    loadCompanyBrand();
  };

  const handleLogout = async () => {
    const confirmLogout = confirm('¿Estás seguro que deseas cerrar sesión?');
    if (confirmLogout) {
      await signOut({ callbackUrl: '/auth/signin' });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'VENTAS':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'GENERAL':
        return <Users className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'Administrador';
      case 'VENTAS':
        return 'Ventas';
      case 'GENERAL':
        return 'General';
      default:
        return 'Usuario';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8 relative">
          {/* Usuario y logout - esquina superior derecha */}
          <div className="absolute top-0 right-0 flex items-center gap-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    {getRoleIcon(user?.role)}
                    <span className="font-medium text-sm text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {getRoleLabel(user?.role)} • {user?.email}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {companyBrand} Optimization Suite
          </h1>
          <p className="text-xl text-gray-600">
            Sistema de optimización de utilidades para distribución de vehículos
          </p>
          {parameters && (
            <div key={`header-${refreshKey}-${parameters.monthly_volume}-${parameters.salespeople_count}`} className="mt-2 flex justify-center items-center gap-2">
              <Badge variant="outline" className="text-sm px-3 py-1">
                📅 Mes: {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
              </Badge>
              <Badge key={`volume-display-${parameters.monthly_volume}`} variant="default" className="text-sm px-3 py-1">
                🚗 {parameters.monthly_volume} unidades objetivo
              </Badge>
              <Badge key={`salespeople-display-${parameters.salespeople_count}`} variant="secondary" className="text-sm px-3 py-1">
                👥 {parameters.salespeople_count} vendedores
              </Badge>
              {!optimizationResult && (
                <Badge variant="destructive" className="text-xs px-2 py-1 animate-pulse">
                  ⚠️ Requiere nueva optimización
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Optimizaciones</p>
                  <p className="text-2xl font-bold">{stats?.total_optimizations || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Utilidad Promedio</p>
                  <p className="text-2xl font-bold">${(stats?.avg_profit || 0).toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Financiera Top</p>
                  <p className="text-lg font-bold">{stats?.most_used_financial || 'N/A'}</p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Vehículo Top</p>
                  <p className="text-sm font-bold">{stats?.most_profitable_vehicle || 'N/A'}</p>
                </div>
                <Car className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${user?.role === 'ADMINISTRADOR' ? 'grid-cols-11' : 'grid-cols-7'}`}>
            <TabsTrigger 
              value="parameters" 
              className="flex items-center gap-2"
              onClick={() => setActiveTab('parameters')}
            >
              <Settings className="h-4 w-4" />
              Parámetros
            </TabsTrigger>
            <TabsTrigger value="prices" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Precios
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Resultados
            </TabsTrigger>
            <TabsTrigger 
              value="sensitivity" 
              className="flex items-center gap-2"
              onClick={() => setActiveTab('sensitivity')}
            >
              <BarChart3 className="h-4 w-4" />
              Sensibilidad
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Archivos
            </TabsTrigger>
            <TabsTrigger value="historical" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            {user?.role === 'ADMINISTRADOR' && (
              <>
                <TabsTrigger value="company" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Empresa
                </TabsTrigger>
                <TabsTrigger value="financieras" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Financieras
                </TabsTrigger>
                <TabsTrigger value="deployment" className="flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Despliegue
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="space-y-4">
            {/* Configuración Mensual */}
            {parameters && (
              <MonthlyConfig 
                key={`monthly-config-${refreshKey}-${parameters.monthly_volume}-${parameters.salespeople_count}`}
                currentVolume={parameters.monthly_volume}
                currentSalespeople={parameters.salespeople_count}
                onVolumeChange={handleVolumeChange}
                onSalespeopleChange={handleSalespeopleChange}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración Avanzada de Parámetros
                </CardTitle>
                <CardDescription>
                  Ajusta los parámetros detallados de optimización (precios, enganches, bonificaciones)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parameters && (
                  <ParametersForm 
                    initialParameters={parameters}
                    vehicleLines={dataProcessor.getVehicleLines()}
                    financialInstitutions={dataProcessor.getFinancialInstitutions()}
                    onChange={handleParametersChange}
                  />
                )}
                
                {/* Alerta de parámetros modificados */}
                {parameters && !optimizationResult && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          ⚠️ PARÁMETROS MODIFICADOS - Nueva optimización requerida
                        </span>
                      </div>
                      <div className="text-xs text-red-600 font-mono space-y-1">
                        <div>Volumen: {parameters.monthly_volume} unidades</div>
                        <div>Suma vehículos: {Object.values(parameters.vehicle_volumes || {}).reduce((sum, vol) => sum + (vol as number), 0)} unidades</div>
                        <div>Vendedores: {parameters.salespeople_count}</div>
                      </div>
                    </div>
                    <p className="text-xs text-red-700 mt-2 p-2 bg-red-100 rounded">
                      <strong>CRÍTICO:</strong> Los valores han cambiado. Los resultados anteriores NO reflejan los nuevos parámetros.
                      <br />
                      <strong>Acción requerida:</strong> Clic en "Ejecutar Optimización" para actualizar.
                      <br />
                      <strong>🔧 SOLUCIÓN ALTERNATIVA:</strong> Usa los botones con auto-optimización en la configuración mensual.
                    </p>
                  </div>
                )}

                {/* Alerta de resultados obsoletos */}
                {parameters && optimizationResult && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          ✅ RESULTADOS ACTUALIZADOS
                        </span>
                      </div>
                      <div className="text-xs text-green-600 font-mono">
                        Optimizado para: {parameters.monthly_volume} unidades
                      </div>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Los resultados reflejan los parámetros actuales. Cambia valores arriba para nueva optimización.
                    </p>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={runOptimization}
                    disabled={isOptimizing || !parameters}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    size="lg"
                  >
                    {isOptimizing ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Optimizando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Ejecutar Optimización
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Gestión de Precios por Marca
                </CardTitle>
                <CardDescription>
                  Actualiza precios desde la página web oficial de {companyBrand} o carga un archivo Precios.xls
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parameters && (
                  <BrandPriceUpdater
                    currentBrand={companyBrand}
                    onPricesUpdate={handlePricesUpdate}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {optimizationResult ? (
              <ResultsVisualization 
                result={optimizationResult}
                parameters={parameters!}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <PieChart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No hay resultados disponibles
                  </h3>
                  <p className="text-gray-500">
                    Ejecuta una optimización para ver los resultados aquí
                  </p>
                  <Button
                    onClick={() => setActiveTab('parameters')}
                    className="mt-4"
                    variant="outline"
                  >
                    Configurar Parámetros
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sensitivity" className="space-y-4">
            {optimizationResult && parameters ? (
              <SensitivityAnalysis 
                baseResult={optimizationResult}
                baseParameters={parameters}
                database={database!}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Análisis de Sensibilidad No Disponible
                  </h3>
                  <p className="text-gray-500">
                    Necesitas ejecutar una optimización primero
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <FileManager />
          </TabsContent>

          <TabsContent value="historical" className="space-y-4">
            <HistoricalAnalysis />
          </TabsContent>

          {user?.role === 'ADMINISTRADOR' && (
            <>
              <TabsContent value="company" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-blue-500" />
                        Configuración de Empresa
                      </CardTitle>
                      <Button
                        onClick={handleBrandRefresh}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar Marca en Sistema
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <Car className="h-4 w-4" />
                        <span>Header actual: <strong>{companyBrand} Optimization Suite</strong></span>
                      </div>
                    </div>
                    <CompanyDataForm onBrandChange={handleBrandRefresh} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Financieras Configuration Tab */}
              <TabsContent value="financieras" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        🏦 Configuración de Financieras
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="planes-manager" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger 
                          value="planes-manager" 
                          className="flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Gestión de Planes (Nuevo)
                        </TabsTrigger>
                        <TabsTrigger 
                          value="config-legacy" 
                          className="flex items-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          Configuración Avanzada (Legacy)
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="planes-manager" className="space-y-4">
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            <strong>🆕 Sistema Moderno de Planes</strong>
                            <br />
                            Gestión completa de planes con lógica compleja:
                            <br />
                            • Aplicabilidad por líneas/versiones: Planes pueden aplicar a todas las líneas, líneas específicas, o combinaciones línea+versión
                            <br />
                            • Sistema de excepciones: Hasta 3 excepciones por plan (líneas/versiones que NO aplican)
                            <br />
                            • Validación inteligente: No permite versiones sin líneas específicas
                          </AlertDescription>
                        </Alert>
                        <FinancieraPlanesManager 
                          financieras={['BBVA', 'Banorte', 'Santander']}
                          lineasVehiculos={['CR-V', 'Civic', 'Accord', 'Pilot', 'Passport', 'Odyssey', 'Ridgeline', 'HR-V', 'Insight']}
                          versionesVehiculos={{
                            'CR-V': ['LX', 'EX', 'EX-L', 'Touring'],
                            'Civic': ['LX', 'Sport', 'EX', 'Sport Touring', 'Si', 'Type R'],
                            'Accord': ['LX', 'Sport', 'EX-L', 'Touring', 'Hybrid'],
                            'Pilot': ['LX', 'EX', 'EX-L', 'Touring', 'Elite'],
                            'Passport': ['Sport', 'EX-L', 'Touring', 'Elite'],
                            'Odyssey': ['LX', 'EX', 'EX-L', 'Touring', 'Elite'],
                            'Ridgeline': ['Sport', 'RTL', 'RTL-E', 'Black Edition'],
                            'HR-V': ['LX', 'Sport', 'EX-L'],
                            'Insight': ['LX', 'EX', 'Touring']
                          }}
                          onPlanesChange={() => {
                            // Recargar datos cuando cambien los planes
                            toast.success('Planes financieros actualizados');
                          }}
                        />
                      </TabsContent>

                      <TabsContent value="config-legacy" className="space-y-4">
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-800">
                            <strong>⚙️ Sistema Legacy</strong>
                            <br />
                            Configuración manual avanzada para casos especiales.
                            <br />
                            <em>Recomendamos usar el sistema moderno de arriba.</em>
                          </AlertDescription>
                        </Alert>
                        <FinancieraConfig
                          onConfigChange={async (config) => {
                            // Guardar configuración en la base de datos
                            try {
                              const response = await fetch('/api/financiera-config', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(config)
                              });
                              if (!response.ok) throw new Error('Error al guardar');
                              toast.success('Configuración de financieras guardada');
                            } catch (error) {
                              toast.error('Error al guardar configuración');
                              throw error;
                            }
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Deployment Manager Tab */}
              <TabsContent value="deployment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-purple-500" />
                        Administrador de Despliegues Multi-Marca
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DeploymentManager />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Users Management Tab */}
              <TabsContent value="users" className="space-y-4">
                <UserManagement />
              </TabsContent>
            </>
          )}

          <TabsContent value="export" className="space-y-4">
            <PDFReportGenerator 
              optimizationResult={optimizationResult}
              parameters={parameters}
              companyBrand={companyBrand}
            />
            
            {/* Backup adicional de datos */}
            <Card>
              <CardHeader>
                <CardTitle>Respaldo de Datos del Sistema</CardTitle>
                <CardDescription>
                  Exporta e importa configuraciones completas del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => {
                      try {
                        const data = dataProcessor.exportData();
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${companyBrand}_optimization_backup_${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        
                        toast.success('📥 Respaldo de sistema descargado exitosamente');
                      } catch (error) {
                        console.error('Error exportando datos:', error);
                        toast.error('❌ Error al crear respaldo del sistema');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exportar Respaldo del Sistema (JSON)
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Importar Respaldo
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">💾 Información del Respaldo</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Incluye:</strong> Configuraciones, parámetros, histórico de optimizaciones</li>
                    <li>• <strong>Formato:</strong> JSON compatible para transferir entre sistemas</li>
                    <li>• <strong>Uso:</strong> Respaldo de seguridad y migración de datos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
