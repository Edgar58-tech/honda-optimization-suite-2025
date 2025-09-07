
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  TrendingUp, 
  Calendar, 
  Search,
  Trash2,
  Eye,
  Download,
  BarChart3,
  DollarSign,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { dataProcessor } from '@/lib/data-processor';
import { HistoricalRecord } from '@/lib/types';

const COLORS = ['#60B5FF', '#FF9149', '#FF9898', '#FF90BB', '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'];

export function HistoricalAnalysis() {
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HistoricalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<HistoricalRecord | null>(null);

  useEffect(() => {
    loadHistoricalData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter(record => 
        record.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(record.date).toLocaleDateString().includes(searchTerm) ||
        record.result.algorithm_used.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, records]);

  const loadHistoricalData = () => {
    const historicalRecords = dataProcessor.getHistoricalData();
    setRecords(historicalRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const deleteRecord = (recordId: string) => {
    const updatedRecords = records.filter(r => r.id !== recordId);
    localStorage.setItem('honda_optimization_history', JSON.stringify(updatedRecords));
    setRecords(updatedRecords);
  };

  const clearAllHistory = () => {
    dataProcessor.clearHistoricalData();
    setRecords([]);
    setSelectedRecord(null);
  };

  const exportRecord = (record: HistoricalRecord) => {
    const dataStr = JSON.stringify(record, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `honda_optimization_${record.id}.json`;
    a.click();
  };

  // Calcular estadísticas para gráficos
  const chartData = records
    .slice(0, 20) // Últimos 20 registros
    .reverse()
    .map((record, index) => ({
      index: index + 1,
      date: new Date(record.date).toLocaleDateString('es-MX', { 
        month: 'short', 
        day: 'numeric' 
      }),
      profit: Math.round(record.result.total_profit),
      volume: record.parameters.monthly_volume,
      avg_profit_per_unit: Math.round(record.result.total_profit / record.parameters.monthly_volume),
      optimization_time: Math.round(record.result.optimization_time)
    }));

  // Análisis por financiera
  const financialAnalysis = records.reduce((acc, record) => {
    record.result.variables.forEach(variable => {
      if (!acc[variable.financialInstitution]) {
        acc[variable.financialInstitution] = { total_quantity: 0, total_profit: 0, count: 0 };
      }
      acc[variable.financialInstitution].total_quantity += variable.quantity;
      acc[variable.financialInstitution].total_profit += variable.profit * variable.quantity;
      acc[variable.financialInstitution].count += 1;
    });
    return acc;
  }, {} as Record<string, { total_quantity: number; total_profit: number; count: number }>);

  const financialChartData = Object.entries(financialAnalysis).map(([name, data]) => ({
    name,
    quantity: data.total_quantity,
    profit: Math.round(data.total_profit),
    avg_profit: Math.round(data.total_profit / data.total_quantity)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              Análisis Histórico ({records.length} registros)
            </CardTitle>

            {records.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={clearAllHistory}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar Todo
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        {records.length > 0 && (
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por notas, fecha o algoritmo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {records.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <History className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No hay datos históricos
            </h3>
            <p className="text-gray-500">
              Ejecuta algunas optimizaciones para ver el análisis histórico aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Gráficos de Tendencias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolución de Utilidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Evolución de Utilidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                    >
                      <XAxis 
                        dataKey="date"
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        label={{
                          value: 'Fecha',
                          position: 'insideBottom',
                          offset: -15,
                          style: { textAnchor: 'middle', fontSize: 11 }
                        }}
                      />
                      <YAxis 
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        label={{ 
                          value: 'Utilidad ($)', 
                          angle: -90, 
                          position: 'insideLeft', 
                          style: { textAnchor: 'middle', fontSize: 11 }
                        }}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Utilidad Total']}
                        labelStyle={{ fontSize: '11px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke={COLORS[0]} 
                        fill={COLORS[0]} 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Análisis por Financiera */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  Distribución por Financiera
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={financialChartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                    >
                      <XAxis 
                        dataKey="name"
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        label={{
                          value: 'Financiera',
                          position: 'insideBottom',
                          offset: -15,
                          style: { textAnchor: 'middle', fontSize: 11 }
                        }}
                      />
                      <YAxis 
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        label={{ 
                          value: 'Volumen Total', 
                          angle: -90, 
                          position: 'insideLeft', 
                          style: { textAnchor: 'middle', fontSize: 11 }
                        }}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'quantity') return [`${value} unidades`, 'Volumen Total'];
                          if (name === 'profit') return [`$${value.toLocaleString()}`, 'Utilidad Total'];
                          return [value, name];
                        }}
                        labelStyle={{ fontSize: '11px' }}
                      />
                      <Legend 
                        verticalAlign="top"
                        height={36}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                      <Bar 
                        dataKey="quantity" 
                        fill={COLORS[1]}
                        name="quantity"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Registros */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Optimizaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {new Date(record.date).toLocaleDateString('es-MX')}
                          </Badge>
                          <Badge className="text-xs">
                            {record.result.algorithm_used}
                          </Badge>
                        </div>
                        
                        <p className="font-medium mb-2">{record.notes}</p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Utilidad Total</p>
                            <p className="font-semibold text-green-600">
                              ${record.result.total_profit.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Volumen</p>
                            <p className="font-semibold">{record.parameters.monthly_volume} unidades</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Tiempo</p>
                            <p className="font-semibold">{Math.round(record.result.optimization_time)}ms</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Restricciones</p>
                            <Badge 
                              variant={record.result.constraints_satisfied ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {record.result.constraints_satisfied ? 'Cumplidas' : 'Parciales'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => setSelectedRecord(record)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Ver
                        </Button>
                        <Button 
                          onClick={() => exportRecord(record)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Exportar
                        </Button>
                        <Button 
                          onClick={() => deleteRecord(record.id)}
                          size="sm"
                          variant="ghost"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredRecords.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No se encontraron registros que coincidan con "{searchTerm}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal de Detalles del Registro */}
          {selectedRecord && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Detalles del Registro</CardTitle>
                  <Button 
                    onClick={() => setSelectedRecord(null)}
                    variant="ghost"
                    size="sm"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold text-green-600">
                          ${selectedRecord.result.total_profit.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">Utilidad Total</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <Target className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedRecord.parameters.monthly_volume}
                        </p>
                        <p className="text-sm text-gray-500">Unidades</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <Calendar className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                        <p className="text-lg font-bold text-purple-600">
                          {new Date(selectedRecord.date).toLocaleDateString('es-MX')}
                        </p>
                        <p className="text-sm text-gray-500">Fecha</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Variables de Optimización</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Vehículo</th>
                            <th className="text-left p-2">Financiera</th>
                            <th className="text-right p-2">Cantidad</th>
                            <th className="text-right p-2">Utilidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRecord.result.variables
                            .filter(v => v.quantity > 0)
                            .map((variable, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{variable.vehicleLine}</td>
                              <td className="p-2">{variable.financialInstitution}</td>
                              <td className="p-2 text-right">{variable.quantity}</td>
                              <td className="p-2 text-right">
                                ${Math.round(variable.profit * variable.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {selectedRecord.result.recommendations.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Recomendaciones</h4>
                        <div className="space-y-2">
                          {selectedRecord.result.recommendations.map((recommendation, index) => (
                            <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                              {recommendation}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
