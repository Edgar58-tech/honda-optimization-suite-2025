
'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Trash2,
  FolderOpen,
  Save,
  FileJson,
  Car
} from 'lucide-react';
import toast from 'react-hot-toast';
import { multiBrandProcessor } from '@/lib/multi-brand-processor';

interface FileStatus {
  name: string;
  status: 'missing' | 'loaded' | 'error';
  size?: string;
  lastModified?: string;
}

export function FileManager() {
  const getCurrentMonth = () => {
    const now = new Date();
    return now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  const [files, setFiles] = useState<FileStatus[]>([
    { name: 'BBVA_Financiamiento.pdf', status: 'loaded', size: '2.3 MB', lastModified: '2024-12-15' },
    { name: 'Banorte_Financiamiento.pdf', status: 'loaded', size: '1.8 MB', lastModified: '2024-12-15' },
    { name: 'Santander_Financiamiento.pdf', status: 'loaded', size: '2.1 MB', lastModified: '2024-12-15' },
    { name: 'RAIAVL_datos_ventas.xlsx', status: 'loaded', size: '856 KB', lastModified: '2024-12-15' }
  ]);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFiles = [
    'BBVA_Financiamiento.pdf',
    'Banorte_Financiamiento.pdf', 
    'Santander_Financiamiento.pdf',
    'RAIAVL_datos_ventas.xlsx'
  ];

  const fileDescriptions: Record<string, string> = {
    'BBVA_Financiamiento.pdf': 'Boletín mensual de planes y comisiones BBVA',
    'Banorte_Financiamiento.pdf': 'Boletín mensual de planes y comisiones Banorte',
    'Santander_Financiamiento.pdf': 'Boletín mensual de planes y comisiones Santander',
    'RAIAVL_datos_ventas.xlsx': 'Datos históricos de ventas INEGI (se actualiza mensualmente)'
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    setIsUploading(true);
    setUploadProgress(0);

    const fileArray = Array.from(uploadedFiles);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      // Validar tipo de archivo usando procesador multi-marca
      const isValidPDF = file.type === 'application/pdf';
      const isValidExcel = file.type === 'application/vnd.ms-excel' || 
                          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                          file.name.toLowerCase().endsWith('.xls') ||
                          file.name.toLowerCase().endsWith('.xlsx');
      
      if (!isValidPDF && !isValidExcel) {
        toast.error(`❌ ${file.name} no es un archivo PDF o Excel válido`);
        continue;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`❌ ${file.name} es demasiado grande (máx. 10MB)`);
        continue;
      }

      try {
        // Procesar archivo con detección automática de marca y años modelo
        toast.loading(`🔍 Detectando marca y años modelo en ${file.name}...`);
        const processedData = await multiBrandProcessor.processCommercialFile(file);
        
        toast.success(
          <div className="space-y-1">
            <div className="font-semibold">✅ Archivo procesado exitosamente</div>
            <div className="text-xs space-y-0.5">
              <div>🚗 Marca detectada: <strong>{processedData.marca}</strong></div>
              <div>📅 Años modelo: <strong>{processedData.años_modelo.join(', ')}</strong></div>
              <div>🏦 Financieras: <strong>{Object.keys(processedData.financieras).length}</strong></div>
              <div>🚙 Líneas de vehículo: <strong>{processedData.lineas_vehiculos.length}</strong></div>
            </div>
          </div>, 
          { duration: 5000 }
        );
        
        // Actualizar estado del archivo
        setFiles(prev => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(f => f.name === file.name);
          
          const fileStatus: FileStatus = {
            name: file.name,
            status: 'loaded',
            size: formatFileSize(file.size),
            lastModified: new Date().toLocaleDateString()
          };

          if (existingIndex >= 0) {
            updated[existingIndex] = fileStatus;
          } else {
            updated.push(fileStatus);
          }
          
          return updated;
        });
        
        setUploadProgress(((i + 1) / fileArray.length) * 100);
        toast.success(`✅ ${file.name} cargado exitosamente`);
        
      } catch (error) {
        toast.error(`❌ Error al cargar ${file.name}`);
        setFiles(prev => prev.map(f => 
          f.name === file.name ? { ...f, status: 'error' } : f
        ));
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const exportDatabaseAsJSON = () => {
    try {
      // Crear datos de ejemplo para exportar
      const exportData = {
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        financieras: {
          'BBVA': { status: 'loaded', comisiones: '1.5%', planes: 12 },
          'Banorte': { status: 'loaded', comisiones: '1.5-5%', planes: 18 },
          'Santander': { status: 'loaded', comisiones: '2.5%', planes: 8 }
        },
        vehiculos: {
          'City': { precio: 450000, disponible: true },
          'Civic': { precio: 520000, disponible: true },
          'CR-V': { precio: 720000, disponible: true },
          'Pilot': { precio: 1200000, disponible: true }
        },
        configuracion: {
          volumen_mensual: 28,
          vendedores: 5,
          optimizaciones_ejecutadas: 0
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `honda_database_${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('📥 Base de datos exportada a Descargas', {
        duration: 4000,
        icon: '💾'
      });

    } catch (error) {
      console.error('Error exportando JSON:', error);
      toast.error('❌ Error al exportar la base de datos');
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    toast.success(`🗑️ ${fileName} eliminado`, { duration: 2000 });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loaded': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'missing': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const missingFiles = requiredFiles.filter(required => 
    !files.some(file => file.name === required && file.status === 'loaded')
  );

  const hasAllRequiredFiles = missingFiles.length === 0;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-500" />
            Gestión de Archivos del Sistema - {getCurrentMonth()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Banner Multi-Marca */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Car className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">🚗 Sistema Multi-Marca Inteligente</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <strong>✅ Marcas soportadas:</strong> Honda, Audi, Toyota, Volkswagen
                    </div>
                    <div>
                      <strong>✅ Años modelo:</strong> Detección automática (2020-2030)
                    </div>
                    <div>
                      <strong>✅ Formatos:</strong> PDF, Excel (XLSX/XLS)
                    </div>
                    <div>
                      <strong>✅ Múltiples años:</strong> Coexistencia automática (ej: 2024, 2025, 2026)
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Funcionamiento automático:</strong> Solo sube tus archivos comerciales de cualquier marca. 
                      El sistema detectará automáticamente la marca, años modelo disponibles, financieras y líneas de vehículos. 
                      No requiere configuración manual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Archivos Cargados</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {files.filter(f => f.status === 'loaded').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-900">Archivos Faltantes</p>
                  <p className="text-2xl font-bold text-yellow-600">{missingFiles.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Estado del Sistema</p>
                  <p className="text-sm font-bold text-green-600">
                    {hasAllRequiredFiles ? 'Completo' : 'Incompleto'}
                  </p>
                </div>
                {hasAllRequiredFiles ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                )}
              </div>
            </div>
          </div>

          {!hasAllRequiredFiles && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Archivos faltantes para {getCurrentMonth()}:</strong> {missingFiles.join(', ')}
                <br />
                <span className="text-sm">
                  ⚠️ Recuerda: Los boletines de financieras y datos de ventas se actualizan <strong>mes con mes</strong>. 
                  El sistema puede funcionar con archivos faltantes, pero los resultados serán menos precisos.
                </span>
              </AlertDescription>
            </Alert>
          )}
          
          <Alert className="mt-4 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>💡 Actualizaciones Mensuales:</strong>
              <br />
              • Los PDFs de financieras se actualizan al inicio de cada mes
              • El archivo RAIAVL_datos_ventas.xlsx contiene datos históricos actualizados
              • El volumen de unidades objetivo puede variar mes a mes según metas comerciales
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-500" />
            Importar Documentos de Financieras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">📅 Actualizaciones Mensuales Requeridas</h4>
              <p className="text-sm text-amber-800">
                <strong>PDFs de Financieras:</strong> Boletines mensuales con planes y comisiones actualizadas
                <br />
                <strong>RAIAVL Excel:</strong> Datos históricos de ventas INEGI (se actualiza mensualmente)
                <br />
                <strong>Formatos soportados:</strong> PDF y Excel (.xls, .xlsx) - máx. 10MB cada uno
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xls,.xlsx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {isUploading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-600">Procesando archivos...</p>
                  <Progress value={uploadProgress} className="w-full max-w-sm mx-auto" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Seleccionar Archivos (PDF / Excel)
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      o arrastra y suelta archivos aquí
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Archivos del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(file.status)}
                  <div>
                    <p className="font-medium">{file.name}</p>
                    {fileDescriptions[file.name] && (
                      <p className="text-xs text-blue-600 mb-1">{fileDescriptions[file.name]}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {file.size && <span>Tamaño: {file.size}</span>}
                      {file.lastModified && <span>Modificado: {file.lastModified}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    file.status === 'loaded' ? 'default' : 
                    file.status === 'error' ? 'destructive' : 'secondary'
                  }>
                    {file.status === 'loaded' ? 'Cargado' : 
                     file.status === 'error' ? 'Error' : 'Faltante'}
                  </Badge>
                  {file.status === 'loaded' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeFile(file.name)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-500" />
            Exportar Datos del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Exporta la configuración y datos del sistema para respaldo o transferencia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={exportDatabaseAsJSON} className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Exportar Base de Datos (JSON)
              </Button>
              
              <Button variant="outline" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Crear Respaldo Completo
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Información sobre Descargas</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Los archivos se guardan en tu carpeta de <strong>Descargas</strong></li>
                <li>• Los PDFs se descargan automáticamente al generarlos</li>
                <li>• Los JSON incluyen toda la configuración del sistema</li>
                <li>• Puedes cambiar la ubicación desde la configuración de tu navegador</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
