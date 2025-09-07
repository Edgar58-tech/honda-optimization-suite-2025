
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Trash2,
  Download,
  Eye,
  Zap
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { dataProcessor } from '@/lib/data-processor';

interface ProcessedFile {
  id: string;
  name: string;
  size: number;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  results?: any;
  error?: string;
}

export function PDFProcessor() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: ProcessedFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}_${file.name}`,
      name: file.name,
      size: file.size,
      status: 'processing' as const,
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(true);

    // Procesar archivos uno por uno
    for (const file of acceptedFiles) {
      const fileId = `${Date.now()}_${file.name}`;
      
      try {
        // Simular progreso de procesamiento
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, progress }
              : f
          ));
        }

        // Procesar archivo con el data processor
        const result = await dataProcessor.processPDFFile(file);
        
        setFiles(prev => prev.map(f => 
          f.id === fileId
            ? {
                ...f, 
                status: result.success ? 'completed' : 'error',
                results: result.success ? result.data : undefined,
                error: result.success ? undefined : result.error
              }
            : f
        ));

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileId
            ? {
                ...f, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Error desconocido'
              }
            : f
        ));
      }
    }

    setIsProcessing(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;
  const processingFiles = files.filter(f => f.status === 'processing').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            Procesador de PDFs Honda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Carga archivos PDF de planes comerciales para extraer automáticamente datos de 
            comisiones, bonos y condiciones financieras.
          </p>

          {/* Estadísticas rápidas */}
          {files.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{files.length}</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Completados</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{completedFiles}</p>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Procesando</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{processingFiles}</p>
              </div>

              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Errores</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{errorFiles}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zona de Carga */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            
            {isDragActive ? (
              <p className="text-lg text-blue-600 font-medium">
                Suelta los archivos aquí...
              </p>
            ) : (
              <div>
                <p className="text-lg text-gray-600 font-medium mb-2">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Soporta archivos PDF, DOC y DOCX hasta 10MB cada uno
                </p>
                <Button variant="outline" className="mx-auto">
                  Seleccionar Archivos
                </Button>
              </div>
            )}
          </div>

          {isProcessing && (
            <Alert className="mt-4">
              <Zap className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Procesando archivos... Por favor espera mientras extraemos los datos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Lista de Archivos Procesados */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Archivos Procesados</CardTitle>
              <Button 
                onClick={clearAllFiles} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpiar Todo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === 'processing' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Zap className="h-3 w-3 animate-spin" />
                          Procesando
                        </Badge>
                      )}

                      {file.status === 'completed' && (
                        <Badge className="bg-green-500 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completado
                        </Badge>
                      )}

                      {file.status === 'error' && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Error
                        </Badge>
                      )}

                      <Button 
                        onClick={() => removeFile(file.id)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {file.status === 'processing' && (
                    <Progress value={file.progress} className="h-2" />
                  )}

                  {file.status === 'error' && file.error && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                      Error: {file.error}
                    </div>
                  )}

                  {file.status === 'completed' && file.results && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Tipo</p>
                          <p>{file.results.type || 'Documento Honda'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Financiera</p>
                          <p>{file.results.financiera || 'No identificada'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Planes Detectados</p>
                          <p>{file.results.planes_detectados?.length || 0}</p>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Ver Detalles
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          Exportar Datos
                        </Button>
                      </div>

                      {file.results.planes_detectados && file.results.planes_detectados.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Planes encontrados:</p>
                          <div className="flex flex-wrap gap-1">
                            {file.results.planes_detectados.map((plan: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {plan}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de Ayuda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Qué datos se extraen?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Información de Planes</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tasas de interés por enganche</li>
                <li>• Comisiones y incentivos</li>
                <li>• Plazos de financiamiento</li>
                <li>• Condiciones especiales</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Bonos Especiales</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bonos por modelo y año</li>
                <li>• Incentivos por volumen</li>
                <li>• Programas de lealtad</li>
                <li>• Fechas de vigencia</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
