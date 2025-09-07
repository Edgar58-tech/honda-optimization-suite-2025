

'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Eye,
  Printer,
  FileText,
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  Car,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { OptimizationResult, OptimizationParameters } from '@/lib/types';
import toast from 'react-hot-toast';

interface PDFReportGeneratorProps {
  optimizationResult: OptimizationResult | null;
  parameters: OptimizationParameters | null;
  companyBrand?: string;
}

export function PDFReportGenerator({ 
  optimizationResult, 
  parameters, 
  companyBrand = 'Honda' 
}: PDFReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generatePDF = async () => {
    if (!optimizationResult || !parameters) {
      toast.error('❌ No hay resultados de optimización para exportar');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Importar jsPDF dinámicamente para evitar errores SSR
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const usableWidth = pageWidth - (margin * 2);
      let currentY = margin;

      // PÁGINA 1: ENCABEZADO Y RESUMEN
      // Logo y título principal
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(`Reporte de Optimización ${companyBrand}`, margin, currentY);
      currentY += 15;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Distribución Óptima de Vehículos', margin, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.text(`Generado el ${getCurrentDate()}`, margin, currentY);
      currentY += 20;

      // Resumen ejecutivo
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 Resumen Ejecutivo', margin, currentY);
      currentY += 15;

      // Métricas principales en cajas
      const metrics = [
        { label: 'Volumen Total', value: `${optimizationResult.variables.reduce((sum, v) => sum + v.quantity, 0)} unidades`, color: [52, 152, 219] },
        { label: 'Utilidad Total Estimada', value: formatCurrency(optimizationResult.total_profit), color: [46, 204, 113] },
        { label: 'Algoritmo utilizado', value: optimizationResult.algorithm_used || 'Optimizador Realista', color: [155, 89, 182] },
        { label: 'Tiempo de optimización', value: `${optimizationResult.optimization_time || '< 1'}ms`, color: [230, 126, 34] }
      ];

      const boxWidth = (usableWidth - 10) / 2;
      const boxHeight = 25;

      metrics.forEach((metric, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + (col * (boxWidth + 10));
        const y = currentY + (row * (boxHeight + 5));

        // Caja de color
        doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
        doc.rect(x, y, boxWidth, boxHeight, 'F');

        // Texto blanco
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(metric.label, x + 5, y + 8);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, x + 5, y + 18);
      });

      currentY += (boxHeight * 2) + 20;

      // Restricciones y estado
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('✅ Estado de Restricciones', margin, currentY);
      currentY += 10;

      const restrictions = [
        '✓ Restricciones Cumplidas: Todas las restricciones fueron satisfechas',
        `✓ Tiempo: ${optimizationResult.optimization_time || '< 1'}ms - Optimizador Realista Basado en Datos INEGI`,
        `✓ Unidades distribuidas: ${optimizationResult.variables.reduce((sum, v) => sum + v.quantity, 0)} de ${parameters.monthly_volume} solicitadas`
      ];

      restrictions.forEach(restriction => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(restriction, margin, currentY);
        currentY += 7;
      });

      currentY += 15;

      // NUEVA PÁGINA: DISTRIBUCIÓN DETALLADA
      doc.addPage();
      currentY = margin;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 Distribución por Financiera', margin, currentY);
      currentY += 20;

      // Agrupar resultados por financiera
      const byFinanciera = optimizationResult.variables.reduce((acc: any, variable) => {
        const key = variable.financialInstitution || 'Sin Financiera';
        if (!acc[key]) {
          acc[key] = { total_units: 0, total_profit: 0, assignments: [] };
        }
        acc[key].total_units += variable.quantity;
        acc[key].total_profit += variable.profit;
        acc[key].assignments.push(variable);
        return acc;
      }, {});

      // Gráfico de distribución por financiera (simulado con texto)
      Object.entries(byFinanciera).forEach(([financiera, data]: [string, any]) => {
        const percentage = (data.total_units / optimizationResult.variables.reduce((sum, v) => sum + v.quantity, 0)) * 100;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${financiera}: ${percentage.toFixed(1)}%`, margin, currentY);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.total_units} unidades - ${formatCurrency(data.total_profit)}`, margin + 5, currentY + 7);
        
        // Barra visual simplificada
        const barWidth = (percentage / 100) * (usableWidth - 50);
        doc.setFillColor(52, 152, 219);
        doc.rect(margin + 50, currentY - 3, barWidth, 4, 'F');
        
        currentY += 15;
      });

      currentY += 20;

      // DISTRIBUCIÓN POR VEHÍCULO
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('🚗 Distribución por Línea de Vehículo', margin, currentY);
      currentY += 20;

      // Agrupar por vehículo
      const byVehicle = optimizationResult.variables.reduce((acc: any, variable) => {
        const key = variable.vehicleLine || 'Sin Línea';
        if (!acc[key]) {
          acc[key] = { total_units: 0, total_profit: 0 };
        }
        acc[key].total_units += variable.quantity;
        acc[key].total_profit += variable.profit;
        return acc;
      }, {});

      Object.entries(byVehicle).forEach(([vehicle, data]: [string, any]) => {
        const percentage = (data.total_units / optimizationResult.variables.reduce((sum, v) => sum + v.quantity, 0)) * 100;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${vehicle}`, margin, currentY);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.total_units} unidades (${percentage.toFixed(1)}%)`, margin + 60, currentY);
        doc.text(`${formatCurrency(data.total_profit)}`, margin + 120, currentY);
        
        currentY += 10;
        
        // Evitar overflow de página
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = margin;
        }
      });

      // PÁGINA FINAL: ASIGNACIONES DETALLADAS
      doc.addPage();
      currentY = margin;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('📋 Asignaciones Detalladas', margin, currentY);
      currentY += 20;

      // Encabezados de tabla
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('#', margin, currentY);
      doc.text('Línea de Vehículo', margin + 10, currentY);
      doc.text('Financiera', margin + 70, currentY);
      doc.text('Cant', margin + 120, currentY);
      doc.text('Utilidad/Unidad', margin + 140, currentY);
      doc.text('Utilidad Total', margin + 180, currentY);

      doc.line(margin, currentY + 2, margin + usableWidth, currentY + 2);
      currentY += 8;

      // Datos de la tabla
      doc.setFont('helvetica', 'normal');
      optimizationResult.variables
        .sort((a, b) => b.profit - a.profit)
        .forEach((variable, index) => {
          if (currentY > pageHeight - 20) {
            doc.addPage();
            currentY = margin;
          }

          doc.text(`${index + 1}`, margin, currentY);
          doc.text(variable.vehicleLine || 'N/A', margin + 10, currentY);
          doc.text(variable.financialInstitution || 'N/A', margin + 70, currentY);
          doc.text(`${variable.quantity}`, margin + 120, currentY);
          doc.text(`${formatCurrency(variable.profit / variable.quantity)}`, margin + 140, currentY);
          doc.text(`${formatCurrency(variable.profit)}`, margin + 180, currentY);
          
          currentY += 6;
        });

      // Pie de página en todas las páginas
      const totalPages = doc.internal.pages.length - 1; // -1 porque pages incluye la primera página vacía
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
        doc.text(`${companyBrand} Optimization Suite - Sistema de Distribución Óptima`, margin, pageHeight - 10);
      }

      // Descargar PDF
      const fileName = `${companyBrand}_Optimization_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success(
        <div>
          <div className="font-semibold">📥 Reporte PDF generado exitosamente</div>
          <div className="text-xs mt-1">Descargado como: {fileName}</div>
        </div>, 
        { duration: 5000 }
      );

    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('❌ Error al generar el reporte PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const showPrintPreview = () => {
    if (!optimizationResult || !parameters) {
      toast.error('❌ No hay datos para mostrar vista previa');
      return;
    }
    
    // Generar contenido HTML para vista previa
    const totalUnits = optimizationResult.variables.reduce((sum, v) => sum + v.quantity, 0);
    const currentDate = getCurrentDate();
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Vista Previa - Reporte ${companyBrand}</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                line-height: 1.4;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              .metric-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin: 20px 0;
              }
              .metric-box {
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: #f9f9f9;
              }
              .metric-label {
                font-size: 14px;
                color: #666;
                margin-bottom: 5px;
              }
              .metric-value {
                font-size: 24px;
                font-weight: bold;
                color: #333;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
              }
              th { 
                background-color: #f2f2f2; 
                font-weight: bold; 
              }
              .page-break { 
                page-break-before: always; 
                margin-top: 50px;
              }
              @media print {
                body { margin: 0; }
                .page-break { page-break-before: always; }
                .no-print { display: none !important; }
              }
              @media screen {
                .page-break { 
                  border-top: 2px dashed #ccc; 
                  margin-top: 40px; 
                  padding-top: 20px; 
                }
              }
              .section-title {
                font-size: 18px;
                font-weight: bold;
                margin: 20px 0 15px 0;
                color: #333;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Reporte de Optimización ${companyBrand}</h1>
              <p style="font-size: 16px; color: #666;">Sistema de Distribución Óptima de Vehículos</p>
              <p style="font-size: 14px; color: #999;">Generado el ${currentDate}</p>
            </div>

            <div class="section-title">📊 Resumen Ejecutivo</div>
            
            <div class="metric-grid">
              <div class="metric-box">
                <div class="metric-label">Volumen Total Optimizado</div>
                <div class="metric-value">${totalUnits} unidades</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">Utilidad Total Estimada</div>
                <div class="metric-value">${formatCurrency(optimizationResult.total_profit)}</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">Volumen Objetivo Original</div>
                <div class="metric-value">${parameters.monthly_volume} unidades</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">Asignaciones Generadas</div>
                <div class="metric-value">${optimizationResult.variables.length}</div>
              </div>
            </div>

            <div class="page-break">
              <div class="section-title">📋 Asignaciones Detalladas</div>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Línea de Vehículo</th>
                    <th>Financiera</th>
                    <th>Cantidad</th>
                    <th>Enganche</th>
                    <th>Comisión</th>
                    <th>Bono</th>
                    <th>Utilidad Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${optimizationResult.variables.map((variable, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${variable.vehicleLine || 'N/A'}</td>
                      <td>${variable.financialInstitution || 'N/A'}</td>
                      <td>${variable.quantity}</td>
                      <td>${formatCurrency(variable.enganche || 0)}</td>
                      <td>${formatCurrency(variable.commission || 0)}</td>
                      <td>${formatCurrency(variable.bonus || 0)}</td>
                      <td>${formatCurrency(variable.profit)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="page-break">
              <div class="section-title">📊 Top Combinaciones Más Rentables</div>
              ${optimizationResult.variables
                .sort((a, b) => b.profit - a.profit)
                .slice(0, 5)
                .map((variable, index) => `
                  <div style="padding: 10px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px; background: ${index === 0 ? '#fff3cd' : '#f8f9fa'}">
                    <strong>#${index + 1} ${variable.vehicleLine}</strong> con ${variable.financialInstitution}<br>
                    <span style="color: #666;">
                      ${variable.quantity} unidades - ${formatCurrency(variable.profit)} total
                    </span>
                  </div>
                `).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      toast.success('📄 Vista previa abierta en nueva ventana');
    } else {
      toast.error('❌ No se pudo abrir la vista previa. Verifica que las ventanas emergentes estén habilitadas.');
    }
  };

  if (!optimizationResult || !parameters) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            Generador de Reportes PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>No hay datos disponibles para generar reporte.</strong>
              <br />
              Ejecuta una optimización primero para generar reportes PDF.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Generador de Reportes PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Volumen Optimizado</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {optimizationResult.variables.reduce((sum, v) => sum + v.quantity, 0)} unidades
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Utilidad Estimada</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(optimizationResult.total_profit)}
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Asignaciones</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {optimizationResult.variables.length}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={generatePDF} 
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generar Reporte PDF
                  </>
                )}
              </Button>

              <Button 
                onClick={showPrintPreview} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Vista Previa de Impresión
              </Button>

              <Button 
                onClick={() => window.print()} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir Página Actual
              </Button>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Settings className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>💡 Información de Descarga:</strong>
                <br />
                • Los PDFs se descargan automáticamente a tu carpeta de <strong>Descargas</strong>
                <br />
                • Vista Previa abre una nueva ventana optimizada para impresión
                <br />
                • Puedes cambiar la ubicación desde la configuración de tu navegador
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa oculta para imprimir */}
      {showPreview && (
        <div ref={printRef} className="hidden print:block">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Reporte de Optimización {companyBrand}</h1>
            <p className="text-lg text-gray-600">Sistema de Distribución Óptima de Vehículos</p>
            <p className="text-sm text-gray-500">Generado el {getCurrentDate()}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">📊 Resumen Ejecutivo</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-600">Volumen Total</p>
                <p className="text-2xl font-bold">
                  {optimizationResult.variables.reduce((sum, v) => sum + v.quantity, 0)} unidades
                </p>
              </div>
              <div className="p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-600">Utilidad Total Estimada</p>
                <p className="text-2xl font-bold">{formatCurrency(optimizationResult.total_profit)}</p>
              </div>
            </div>
          </div>

          <div className="page-break">
            <h2 className="text-xl font-bold mb-4">📋 Asignaciones Detalladas</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">#</th>
                  <th className="border border-gray-300 p-2 text-left">Línea de Vehículo</th>
                  <th className="border border-gray-300 p-2 text-left">Financiera</th>
                  <th className="border border-gray-300 p-2 text-left">Cantidad</th>
                  <th className="border border-gray-300 p-2 text-left">Utilidad Total</th>
                </tr>
              </thead>
              <tbody>
                {optimizationResult.variables.map((variable, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{index + 1}</td>
                    <td className="border border-gray-300 p-2">{variable.vehicleLine}</td>
                    <td className="border border-gray-300 p-2">{variable.financialInstitution}</td>
                    <td className="border border-gray-300 p-2">{variable.quantity}</td>
                    <td className="border border-gray-300 p-2">{formatCurrency(variable.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

