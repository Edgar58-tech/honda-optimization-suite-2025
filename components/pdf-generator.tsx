
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Printer, FolderOpen, Info } from 'lucide-react';
import { OptimizationResult, OptimizationParameters } from '@/lib/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface PDFGeneratorProps {
  result: OptimizationResult;
  parameters: OptimizationParameters;
}

export function PDFGenerator({ result, parameters }: PDFGeneratorProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  
  // CRÍTICO: Calcular volumen REAL del resultado de optimización
  const actualVolumeFromResult = useMemo(() => {
    if (result?.variables && Array.isArray(result.variables)) {
      const realVolume = result.variables.reduce((sum, v) => sum + (v.quantity || 0), 0);
      console.log('📄 PDF - Volumen real calculado:', realVolume, 'vs parámetro:', parameters.monthly_volume);
      return realVolume;
    }
    return parameters.monthly_volume;
  }, [result, parameters.monthly_volume]);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      const response = await fetch('/api/company-data');
      if (response.ok) {
        const data = await response.json();
        setCompanyData(data.companyData);
      }
    } catch (error) {
      console.error('Error loading company data for PDF:', error);
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;

    // Mostrar notificación de inicio
    const toastId = toast.loading('📄 Preparando reporte...', { duration: Infinity });

    try {
      // Crear canvas del contenido con mayor calidad
      toast.loading('🖼️ Capturando contenido...', { id: toastId });
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        imageTimeout: 15000
      });

      // Crear PDF con configuración optimizada
      toast.loading('📋 Generando PDF...', { id: toastId });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Añadir imagen al PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Añadir páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generar nombre del archivo con timestamp y marca dinámica
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-MX').replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('es-MX', { hour12: false }).replace(/:/g, '');
      const brandName = companyData?.marca || 'Honda';
      const filename = `${brandName}_Optimization_Report_${dateStr}_${timeStr}.pdf`;

      // Intentar descargar PDF
      toast.loading('💾 Iniciando descarga...', { id: toastId });
      
      try {
        // Generar blob URL para descarga manual como fallback
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        // Intentar descarga automática
        pdf.save(filename);
        
        // Mostrar notificación de éxito con opción de descarga manual
        toast.success(
          <div className="space-y-3">
            <div className="font-semibold">✅ Reporte generado exitosamente</div>
            <div className="text-sm space-y-1">
              <div>📁 Archivo: {filename}</div>
              <div>📂 Ubicación: Carpeta de Descargas</div>
              <div>📏 Tamaño: ~{(pdfBlob.size / 1024).toFixed(0)} KB</div>
            </div>
            <div className="mt-2">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(blobUrl);
                }}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                📥 Descargar manualmente
              </button>
            </div>
          </div>, 
          { 
            id: toastId, 
            duration: 10000,
            style: {
              maxWidth: '450px'
            }
          }
        );
        
        // Limpiar URL después de un tiempo
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60000);
        
      } catch (downloadError) {
        console.error('Error en descarga:', downloadError);
        
        // Fallback: mostrar enlace de descarga manual
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        toast.success(
          <div className="space-y-2">
            <div className="font-semibold">📄 PDF generado</div>
            <div className="text-sm">La descarga automática falló. Usa el botón de abajo:</div>
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
              }}
              className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mt-2"
            >
              📥 Descargar PDF
            </button>
          </div>,
          { 
            id: toastId, 
            duration: 15000,
            style: {
              maxWidth: '400px'
            }
          }
        );
      }

    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error(
        <div className="space-y-1">
          <div className="font-semibold">❌ Error al generar PDF</div>
          <div className="text-sm">Verifica tu conexión e inténtalo nuevamente</div>
        </div>,
        { id: toastId, duration: 4000 }
      );
    }
  };

  const totalUnits = result.variables.reduce((sum, v) => sum + v.quantity, 0);

  // Distribuir por financiera
  const distributionByFinancial = result.variables.reduce((acc, v) => {
    acc[v.financialInstitution] = (acc[v.financialInstitution] || 0) + v.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Distribuir por vehículo
  const distributionByVehicle = result.variables.reduce((acc, v) => {
    acc[v.vehicleLine] = (acc[v.vehicleLine] || 0) + v.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Top vehículos por utilidad
  const topVehiclesByProfit = result.variables
    .map(v => ({
      vehicle: v.vehicleLine,
      financial: v.financialInstitution,
      quantity: v.quantity,
      totalProfit: v.profit * v.quantity
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Información y opciones de descarga */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Información de Descarga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg space-y-3 mb-4">
            <h4 className="font-semibold text-blue-900">📥 ¿Dónde se guardan los archivos?</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span><strong>Ubicación predeterminada:</strong> Carpeta de Descargas de tu navegador</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span><strong>Formato:</strong> {companyData?.marca || 'Honda'}_Optimization_Report_DD-MM-AAAA_HHMMSS.pdf</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span><strong>Tamaño típico:</strong> 2-5 MB según contenido</span>
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
              <p className="text-xs text-blue-700">
                💡 <strong>Tip:</strong> Para cambiar la ubicación de descarga, ve a la configuración de tu navegador 
                (Chrome/Edge: Configuración → Avanzada → Descargas). También puedes usar Ctrl+J para ver tus descargas recientes.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={generatePDF}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Generar Reporte PDF
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Vista Previa de Impresión
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenido del reporte (oculto visualmente pero usado para PDF) */}
      <div ref={reportRef} className="bg-white p-8 space-y-6" style={{ minWidth: '800px' }}>
        {/* Header del reporte */}
        <div className="border-b pb-6">
          {companyData && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {companyData.nombreEmpresa}
                  </h2>
                  <p className="text-sm text-gray-700">{companyData.razonSocial}</p>
                  <p className="text-sm text-gray-600">RFC: {companyData.rfc}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-700">
                    <p>{companyData.calle} {companyData.numero}</p>
                    <p>{companyData.colonia}, {companyData.delegacion}</p>
                    <p>C.P. {companyData.codigoPostal}, {companyData.ciudad}, {companyData.estado}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reporte de Optimización {companyData?.marca || 'Honda'}
            </h1>
            <p className="text-lg text-gray-600">
              Sistema de Distribución Óptima de Vehículos
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Generado el {new Date().toLocaleDateString('es-MX')} a las {new Date().toLocaleTimeString('es-MX')}
            </p>
          </div>
        </div>

        {/* Resumen Ejecutivo */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Resumen Ejecutivo</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Volumen Total</h3>
              <p className="text-2xl font-bold text-blue-600">{totalUnits} unidades</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Utilidad Total Estimada</h3>
              <p className="text-2xl font-bold text-green-600">
                ${result.total_profit.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Algoritmo utilizado:</strong> {result.algorithm_used}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Tiempo de optimización:</strong> {Math.round(result.optimization_time)}ms
            </p>
            <p className="text-sm text-gray-700">
              <strong>Restricciones cumplidas:</strong> {result.constraints_satisfied ? 'Sí' : 'No'}
            </p>
          </div>
        </div>

        {/* Distribución por Financiera */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏦 Distribución por Financiera</h2>
          <div className="space-y-3">
            {Object.entries(distributionByFinancial)
              .sort((a, b) => b[1] - a[1])
              .map(([financial, quantity]) => {
                const percentage = ((quantity / totalUnits) * 100).toFixed(1);
                return (
                  <div key={financial} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-semibold">{financial}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {quantity} unidades ({percentage}%)
                      </span>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Distribución por Vehículo */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">🚗 Distribución por Línea de Vehículo</h2>
          <div className="space-y-2">
            {Object.entries(distributionByVehicle)
              .sort((a, b) => b[1] - a[1])
              .map(([vehicle, quantity]) => {
                const percentage = ((quantity / totalUnits) * 100).toFixed(1);
                return (
                  <div key={vehicle} className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">{vehicle}</span>
                    <div className="text-right">
                      <span className="font-semibold">{quantity} unidades</span>
                      <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Asignaciones Detalladas */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Asignaciones Detalladas</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Línea de Vehículo</th>
                  <th className="border p-2 text-left">Financiera</th>
                  <th className="border p-2 text-center">Cantidad</th>
                  <th className="border p-2 text-center">Enganche</th>
                  <th className="border p-2 text-right">Comisión</th>
                  <th className="border p-2 text-right">Bono</th>
                  <th className="border p-2 text-right">Utilidad Total</th>
                </tr>
              </thead>
              <tbody>
                {result.variables
                  .sort((a, b) => (b.profit * b.quantity) - (a.profit * a.quantity))
                  .map((variable, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border p-2">{variable.vehicleLine}</td>
                      <td className="border p-2">{variable.financialInstitution}</td>
                      <td className="border p-2 text-center font-semibold">{variable.quantity}</td>
                      <td className="border p-2 text-center">{variable.enganche}%</td>
                      <td className="border p-2 text-right">${variable.commission.toLocaleString()}</td>
                      <td className="border p-2 text-right">${variable.bonus.toLocaleString()}</td>
                      <td className="border p-2 text-right font-semibold">
                        ${(variable.profit * variable.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Combinaciones Rentables */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Combinaciones Más Rentables</h2>
          <div className="space-y-2">
            {topVehiclesByProfit.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                <div>
                  <span className="font-semibold">#{index + 1} {item.vehicle}</span>
                  <span className="text-sm text-gray-600 ml-2">con {item.financial}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    ${item.totalProfit.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.quantity} unidades
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendaciones */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Recomendaciones</h2>
          <div className="space-y-2">
            {result.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2 p-2 border-l-4 border-blue-400 bg-blue-50">
                <span className="text-blue-600 font-semibold">{index + 1}.</span>
                <span className="text-blue-900">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Parámetros Utilizados */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Parámetros de Optimización</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Configuración General</h3>
              <ul className="text-sm space-y-1">
                <li><strong>Volumen mensual:</strong> {actualVolumeFromResult} unidades</li>
                <li><strong>Vendedores:</strong> {parameters.salespeople_count}</li>
                <li><strong>Promedio por vendedor:</strong> {actualVolumeFromResult > 0 && parameters.salespeople_count > 0 ? Math.round(actualVolumeFromResult / parameters.salespeople_count * 10) / 10 : 0}</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Pesos de Bonificación</h3>
              <ul className="text-sm space-y-1">
                <li><strong>Comisiones:</strong> {Math.round(parameters.bonus_weights.commission * 100)}%</li>
                <li><strong>Bonos:</strong> {Math.round(parameters.bonus_weights.bonus * 100)}%</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t pt-4 text-xs text-gray-500">
          <p>{companyData?.marca || 'Honda'} Optimization Suite - Sistema de Optimización de Distribución</p>
          <p>Este reporte fue generado automáticamente basado en datos reales de INEGI 2025</p>
        </div>
      </div>
    </div>
  );
}
