
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Area,
  AreaChart,
  ComposedChart,
  Cell
} from 'recharts';
import { OptimizationResult, OptimizationParameters, HondaDatabase, SensitivityAnalysis as SensitivityType } from '@/lib/types';
import { HondaOptimizationEngine } from '@/lib/optimization-engine';

interface SensitivityAnalysisProps {
  baseResult: OptimizationResult;
  baseParameters: OptimizationParameters;
  database: HondaDatabase;
}

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'];

export function SensitivityAnalysis({ baseResult, baseParameters, database }: SensitivityAnalysisProps) {
  const [selectedParameter, setSelectedParameter] = useState('monthly_volume');
  const [analysisData, setAnalysisData] = useState<SensitivityType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysisParameters = [
    { value: 'monthly_volume', label: 'Volumen Mensual', variations: [-8, -4, -2, 0, 2, 4, 8] },
    { value: 'salespeople_count', label: 'Número de Vendedores', variations: [-2, -1, 0, 1, 2] },
    { value: 'vehicle_prices', label: 'Precios de Vehículos', variations: [-20, -10, -5, 0, 5, 10, 20] }, // Porcentaje
    { value: 'engagement_preferences', label: 'Preferencias de Enganche', variations: [-10, -5, 0, 5, 10] } // Porcentaje
  ];

  useEffect(() => {
    if (selectedParameter) {
      runSensitivityAnalysis(selectedParameter);
    }
  }, [selectedParameter]);

  const runSensitivityAnalysis = async (parameter: string) => {
    setIsAnalyzing(true);
    
    try {
      const selectedConfig = analysisParameters.find(p => p.value === parameter);
      if (!selectedConfig) return;

      const engine = new HondaOptimizationEngine(database);
      const analysisResults: SensitivityType[] = [];

      for (const variation of selectedConfig.variations) {
        const modifiedParameters = createModifiedParameters(baseParameters, parameter, variation);
        const result = await engine.optimize(modifiedParameters);
        
        const baseValue = getParameterValue(baseParameters, parameter);
        const newValue = getParameterValue(modifiedParameters, parameter);
        
        // Calcular impacto en distribución
        const distributionImpact = calculateDistributionImpact(baseResult, result);
        
        analysisResults.push({
          parameter: parameter,
          base_value: baseValue,
          variations: [{
            value: newValue,
            profit_impact: result.total_profit - baseResult.total_profit,
            distribution_impact: distributionImpact
          }]
        });
      }

      // Combinar todas las variaciones en un solo análisis
      const combinedAnalysis: SensitivityType = {
        parameter: parameter,
        base_value: getParameterValue(baseParameters, parameter),
        variations: analysisResults.map(a => a.variations[0])
      };

      setAnalysisData([combinedAnalysis]);
      
    } catch (error) {
      console.error('Error en análisis de sensibilidad:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createModifiedParameters = (
    baseParams: OptimizationParameters, 
    parameter: string, 
    variation: number
  ): OptimizationParameters => {
    const modified = JSON.parse(JSON.stringify(baseParams)); // Deep copy

    switch (parameter) {
      case 'monthly_volume':
        const newVolume = Math.max(1, baseParams.monthly_volume + variation);
        modified.monthly_volume = newVolume;
        
        // CRÍTICO: Actualizar también los volúmenes de vehículos proporcionalmente
        if (baseParams.vehicle_volumes && Object.keys(baseParams.vehicle_volumes).length > 0) {
          const currentTotal = Object.values(baseParams.vehicle_volumes).reduce((sum, vol) => sum + vol, 0);
          const scaleFactor = newVolume / currentTotal;
          
          const updatedVehicleVolumes: Record<string, number> = {};
          Object.keys(baseParams.vehicle_volumes).forEach(vehicle => {
            updatedVehicleVolumes[vehicle] = Math.max(0, Math.round(baseParams.vehicle_volumes[vehicle] * scaleFactor));
          });
          
          // Ajustar para que la suma sea exacta
          const adjustedTotal = Object.values(updatedVehicleVolumes).reduce((sum, vol) => sum + vol, 0);
          const difference = newVolume - adjustedTotal;
          
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
          
          modified.vehicle_volumes = updatedVehicleVolumes;
        }
        break;
        
      case 'salespeople_count':
        modified.salespeople_count = Math.max(1, baseParams.salespeople_count + variation);
        break;
        
      case 'vehicle_prices':
        modified.vehicle_prices = Object.keys(baseParams.vehicle_prices).reduce((acc, vehicle) => {
          acc[vehicle] = Math.round(baseParams.vehicle_prices[vehicle] * (1 + variation / 100));
          return acc;
        }, {} as Record<string, number>);
        break;
        
      case 'engagement_preferences':
        modified.engagement_preferences = Object.keys(baseParams.engagement_preferences).reduce((acc, financial) => {
          acc[financial] = Math.max(5, Math.min(50, baseParams.engagement_preferences[financial] + variation));
          return acc;
        }, {} as Record<string, number>);
        break;
    }

    console.log(`🔧 Parámetros modificados para ${parameter} (variación: ${variation}):`, {
      parameter,
      variation,
      original_volume: baseParams.monthly_volume,
      modified_volume: modified.monthly_volume,
      original_salespeople: baseParams.salespeople_count,
      modified_salespeople: modified.salespeople_count,
      vehicle_volumes_sum: modified.vehicle_volumes ? Object.values(modified.vehicle_volumes).reduce((sum, vol) => (sum as number) + (vol as number), 0) : 0
    });

    return modified;
  };

  const getParameterValue = (params: OptimizationParameters, parameter: string): number => {
    switch (parameter) {
      case 'monthly_volume':
        return params.monthly_volume;
      case 'salespeople_count':
        return params.salespeople_count;
      case 'vehicle_prices':
        return Object.values(params.vehicle_prices).reduce((sum, price) => sum + price, 0) / Object.values(params.vehicle_prices).length;
      case 'engagement_preferences':
        return Object.values(params.engagement_preferences).reduce((sum, pref) => sum + pref, 0) / Object.values(params.engagement_preferences).length;
      default:
        return 0;
    }
  };

  const calculateDistributionImpact = (baseResult: OptimizationResult, newResult: OptimizationResult) => {
    const baseDistribution = baseResult.variables.reduce((acc, v) => {
      acc[v.financialInstitution] = (acc[v.financialInstitution] || 0) + v.quantity;
      return acc;
    }, {} as Record<string, number>);

    const newDistribution = newResult.variables.reduce((acc, v) => {
      acc[v.financialInstitution] = (acc[v.financialInstitution] || 0) + v.quantity;
      return acc;
    }, {} as Record<string, number>);

    const impact: Record<string, number> = {};
    
    Object.keys({ ...baseDistribution, ...newDistribution }).forEach(financial => {
      const basePct = ((baseDistribution[financial] || 0) / baseResult.variables.reduce((sum, v) => sum + v.quantity, 0)) * 100;
      const newPct = ((newDistribution[financial] || 0) / newResult.variables.reduce((sum, v) => sum + v.quantity, 0)) * 100;
      impact[financial] = newPct - basePct;
    });

    return impact;
  };

  const currentAnalysis = analysisData[0];

  const chartData = currentAnalysis?.variations?.map(v => {
    const selectedConfig = analysisParameters.find(p => p.value === selectedParameter);
    let label = '';
    
    if (selectedParameter === 'vehicle_prices') {
      const pctChange = ((v.value - currentAnalysis.base_value) / currentAnalysis.base_value) * 100;
      label = `${pctChange > 0 ? '+' : ''}${Math.round(pctChange)}%`;
    } else if (selectedParameter === 'engagement_preferences') {
      const change = v.value - currentAnalysis.base_value;
      label = `${change > 0 ? '+' : ''}${Math.round(change)}%`;
    } else {
      const change = v.value - currentAnalysis.base_value;
      label = `${change > 0 ? '+' : ''}${change}`;
    }
    
    return {
      label,
      value: v.value,
      profit_change: Math.round(v.profit_impact),
      profit_change_pct: Math.round((v.profit_impact / baseResult.total_profit) * 100 * 10) / 10,
      is_positive: v.profit_impact > 0
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Análisis de Sensibilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Parámetro a Analizar</label>
              <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {analysisParameters.map((param) => (
                    <SelectItem key={param.value} value={param.value}>
                      {param.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              {isAnalyzing ? (
                <>
                  <Zap className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-600">Analizando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Análisis Completo</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valor Base */}
      {currentAnalysis && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Valor Base del Parámetro</p>
                <p className="text-2xl font-bold">
                  {selectedParameter === 'vehicle_prices' 
                    ? `$${Math.round(currentAnalysis.base_value).toLocaleString()}`
                    : selectedParameter === 'engagement_preferences'
                    ? `${Math.round(currentAnalysis.base_value)}%`
                    : Math.round(currentAnalysis.base_value)
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Utilidad Base</p>
                <p className="text-2xl font-bold text-green-600">
                  ${baseResult.total_profit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Impacto */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Impacto en la Utilidad Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                >
                  <XAxis 
                    dataKey="label"
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{
                      value: 'Variación del Parámetro',
                      position: 'insideBottom',
                      offset: -15,
                      style: { textAnchor: 'middle', fontSize: 11 }
                    }}
                  />
                  <YAxis 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ 
                      value: 'Cambio en Utilidad ($)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { textAnchor: 'middle', fontSize: 11 }
                    }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'profit_change') {
                        return [`$${Math.round(value).toLocaleString()}`, 'Cambio en Utilidad'];
                      }
                      if (name === 'profit_change_pct') {
                        return [`${value}%`, '% de Cambio'];
                      }
                      return [value, name];
                    }}
                    labelStyle={{ fontSize: '11px' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm font-medium mb-1">{`Variación: ${label}`}</p>
                            <p className="text-sm text-green-600">
                              Cambio en Utilidad: ${Math.round(data.profit_change).toLocaleString()}
                            </p>
                            <p className="text-sm text-blue-600">
                              % de Cambio: {data.profit_change_pct}%
                            </p>
                            <p className="text-sm text-gray-600">
                              Nuevo Valor: {Math.round(data.value).toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="profit_change" 
                    fill={COLORS[1]}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.is_positive ? COLORS[2] : COLORS[4]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Resultados Detallados */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados Detallados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Variación</th>
                    <th className="text-right p-2">Nuevo Valor</th>
                    <th className="text-right p-2">Cambio en Utilidad</th>
                    <th className="text-right p-2">% de Cambio</th>
                    <th className="text-center p-2">Impacto</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{item.label}</td>
                      <td className="p-2 text-right">
                        {selectedParameter === 'vehicle_prices' 
                          ? `$${Math.round(item.value).toLocaleString()}`
                          : selectedParameter === 'engagement_preferences'
                          ? `${Math.round(item.value)}%`
                          : Math.round(item.value)
                        }
                      </td>
                      <td className={`p-2 text-right font-semibold ${item.is_positive ? 'text-green-600' : 'text-red-600'}`}>
                        ${item.profit_change.toLocaleString()}
                      </td>
                      <td className={`p-2 text-right ${item.is_positive ? 'text-green-600' : 'text-red-600'}`}>
                        {item.profit_change_pct > 0 ? '+' : ''}{item.profit_change_pct}%
                      </td>
                      <td className="p-2 text-center">
                        {item.is_positive ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights y Recomendaciones */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Insights del Análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const maxGain = Math.max(...chartData.map(d => d.profit_change));
                const maxLoss = Math.min(...chartData.map(d => d.profit_change));
                const maxGainItem = chartData.find(d => d.profit_change === maxGain);
                const maxLossItem = chartData.find(d => d.profit_change === maxLoss);
                
                return (
                  <>
                    {maxGainItem && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-green-800">Mayor Oportunidad</p>
                            <p className="text-sm text-green-700">
                              Ajustar el parámetro en {maxGainItem.label} podría generar 
                              ${maxGain.toLocaleString()} adicionales ({maxGainItem.profit_change_pct}% más)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {maxLossItem && maxLoss < 0 && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-start gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-red-800">Mayor Riesgo</p>
                            <p className="text-sm text-red-700">
                              Cambiar el parámetro en {maxLossItem.label} resultaría en 
                              ${Math.abs(maxLoss).toLocaleString()} menos ({Math.abs(maxLossItem.profit_change_pct)}% reducción)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-blue-800">Sensibilidad del Sistema</p>
                          <p className="text-sm text-blue-700">
                            El sistema muestra {maxGain > Math.abs(maxLoss) ? 'alta' : 'moderada'} sensibilidad 
                            a cambios en {analysisParameters.find(p => p.value === selectedParameter)?.label.toLowerCase()}. 
                            Considera estos factores al ajustar la estrategia.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
