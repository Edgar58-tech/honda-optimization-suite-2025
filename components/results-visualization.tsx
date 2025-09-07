
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Clock,
  Award,
  BarChart3,
  PieChart,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { OptimizationResult, OptimizationParameters } from '@/lib/types';
import { PDFGenerator } from './pdf-generator';

interface ResultsVisualizationProps {
  result: OptimizationResult;
  parameters: OptimizationParameters;
}

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'];

export function ResultsVisualization({ result, parameters }: ResultsVisualizationProps) {
  const {
    distributionByFinancial,
    distributionByVehicle,
    profitabilityData,
    engagementAnalysis,
    totalMetrics
  } = useMemo(() => {
    // CRÍTICO: Calcular el total REAL de unidades desde el resultado PRIMERO
    const actualTotalUnits = result.variables.reduce((sum, v) => sum + v.quantity, 0);
    console.log('📊 TOTAL REAL DE UNIDADES:', actualTotalUnits, 'vs parámetro:', parameters.monthly_volume);
    
    // Distribución por financiera
    const financialDist = result.variables.reduce((acc, v) => {
      acc[v.financialInstitution] = (acc[v.financialInstitution] || 0) + v.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    const distributionByFinancial = Object.entries(financialDist).map(([name, quantity]) => ({
      name,
      quantity,
      percentage: actualTotalUnits > 0 ? Math.round((quantity / actualTotalUnits) * 100) : 0
    }));

    // Distribución por vehículo
    const vehicleDist = result.variables.reduce((acc, v) => {
      acc[v.vehicleLine] = (acc[v.vehicleLine] || 0) + v.quantity;
      return acc;
    }, {} as Record<string, number>);

    const distributionByVehicle = Object.entries(vehicleDist).map(([name, quantity]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      fullName: name,
      quantity,
      percentage: actualTotalUnits > 0 ? Math.round((quantity / actualTotalUnits) * 100) : 0
    }));

    // Análisis de rentabilidad
    const profitabilityData = result.variables.map(v => ({
      combination: `${v.vehicleLine.substring(0, 8)} - ${v.financialInstitution}`,
      vehicleLine: v.vehicleLine,
      financialInstitution: v.financialInstitution,
      quantity: v.quantity,
      unitProfit: Math.round(v.profit),
      totalProfit: Math.round(v.profit * v.quantity),
      commission: Math.round(v.commission),
      bonus: Math.round(v.bonus),
      enganche: v.enganche
    })).filter(item => item.quantity > 0)
      .sort((a, b) => b.totalProfit - a.totalProfit);

    // Análisis de enganches
    const engagementAnalysis = result.variables.reduce((acc, v) => {
      if (v.quantity > 0) {
        acc.totalWeightedEngagement += v.enganche * v.quantity;
        acc.totalQuantity += v.quantity;
        
        const range = v.enganche < 20 ? '<20%' : 
                     v.enganche < 30 ? '20-30%' :
                     v.enganche < 40 ? '30-40%' : '40%+';
        
        acc.ranges[range] = (acc.ranges[range] || 0) + v.quantity;
      }
      return acc;
    }, {
      totalWeightedEngagement: 0,
      totalQuantity: 0,
      ranges: {} as Record<string, number>
    });

    const avgEngagement = Math.round(engagementAnalysis.totalWeightedEngagement / engagementAnalysis.totalQuantity);
    
    const engagementRanges = Object.entries(engagementAnalysis.ranges).map(([range, quantity]) => ({
      range,
      quantity,
      percentage: actualTotalUnits > 0 ? Math.round((quantity / actualTotalUnits) * 100) : 0
    }));

    // Métricas totales
    const totalCommissions = result.variables.reduce((sum, v) => sum + (v.commission * v.quantity), 0);
    const totalBonuses = result.variables.reduce((sum, v) => sum + (v.bonus * v.quantity), 0);
    
    const totalMetrics = {
      totalProfit: Math.round(result.total_profit),
      totalCommissions: Math.round(totalCommissions),
      totalBonuses: Math.round(totalBonuses),
      avgEngagement,
      profitPerUnit: actualTotalUnits > 0 ? Math.round(result.total_profit / actualTotalUnits) : 0,
      optimizationTime: Math.round(result.optimization_time),
      actualTotalUnits: actualTotalUnits // NUEVO: Total real calculado
    };

    return {
      distributionByFinancial,
      distributionByVehicle,
      profitabilityData,
      engagementAnalysis: engagementRanges,
      totalMetrics
    };
  }, [result, parameters]);

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Utilidad Total</p>
                <p className="text-2xl font-bold">${totalMetrics.totalProfit.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                ${totalMetrics.profitPerUnit.toLocaleString()}/unidad
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Comisiones</p>
                <p className="text-2xl font-bold">${totalMetrics.totalCommissions.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-200" />
            </div>
            <div className="mt-2">
              <Progress 
                value={(totalMetrics.totalCommissions / totalMetrics.totalProfit) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Bonos</p>
                <p className="text-2xl font-bold">${totalMetrics.totalBonuses.toLocaleString()}</p>
              </div>
              <Award className="h-8 w-8 text-purple-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {Math.round((totalMetrics.totalBonuses / totalMetrics.totalProfit) * 100)}% del total
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Enganche Promedio</p>
                <p className="text-2xl font-bold">{totalMetrics.avgEngagement}%</p>
              </div>
              <Target className="h-8 w-8 text-orange-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Optimizado para comisiones
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de Restricciones y Tiempo */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {result.constraints_satisfied ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-medium">
                  Restricciones {result.constraints_satisfied ? 'Cumplidas' : 'Parciales'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {totalMetrics.optimizationTime}ms - {result.algorithm_used}
                </span>
              </div>
            </div>

            <Badge variant="outline" className="font-medium">
              {totalMetrics.actualTotalUnits} unidades distribuidas
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Financiera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Distribución por Financiera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={distributionByFinancial}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="quantity"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    labelLine={false}
                  >
                    {distributionByFinancial.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value} unidades`, 
                      'Cantidad'
                    ]}
                    labelStyle={{ fontSize: '11px' }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución por Vehículo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              Distribución por Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={distributionByVehicle}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                >
                  <XAxis 
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    label={{ 
                      value: 'Unidades', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { textAnchor: 'middle', fontSize: 11 }
                    }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value} unidades`, 'Cantidad']}
                    labelFormatter={(label: string) => {
                      const item = distributionByVehicle.find(d => d.name === label);
                      return item?.fullName || label;
                    }}
                    labelStyle={{ fontSize: '11px' }}
                  />
                  <Bar 
                    dataKey="quantity" 
                    fill={COLORS[1]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Rentabilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Top 10 Combinaciones Más Rentables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profitabilityData.slice(0, 10).map((item, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium text-sm">
                        {item.vehicleLine} - {item.financialInstitution}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Cantidad</p>
                        <p className="font-semibold">{item.quantity} unidades</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Utilidad/Unidad</p>
                        <p className="font-semibold">${item.unitProfit.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Utilidad Total</p>
                        <p className="font-semibold text-green-600">${item.totalProfit.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Enganche</p>
                        <p className="font-semibold">{item.enganche}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <p className="text-gray-500">Comisión</p>
                      <p className="font-medium">${item.commission.toLocaleString()}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-500">Bono</p>
                      <p className="font-medium">${item.bonus.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <Progress 
                  value={(item.totalProfit / profitabilityData[0].totalProfit) * 100}
                  className="mt-3 h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análisis de Enganches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Distribución de Enganches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={engagementAnalysis}
                margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
              >
                <XAxis 
                  dataKey="range"
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{
                    value: 'Rango de Enganche',
                    position: 'insideBottom',
                    offset: -15,
                    style: { textAnchor: 'middle', fontSize: 11 }
                  }}
                />
                <YAxis 
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ 
                    value: 'Unidades', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { textAnchor: 'middle', fontSize: 11 }
                  }}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value} unidades`, 'Cantidad']}
                  labelStyle={{ fontSize: '11px' }}
                />
                <Bar 
                  dataKey="quantity" 
                  fill={COLORS[3]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      {result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              Recomendaciones del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-blue-800 flex-1">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generador de PDF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Exportar Reporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Genera un reporte completo en PDF con todos los resultados de la optimización, 
            gráficos y recomendaciones para presentar o archivar.
          </p>
          <PDFGenerator result={result} parameters={parameters} />
        </CardContent>
      </Card>
    </div>
  );
}
