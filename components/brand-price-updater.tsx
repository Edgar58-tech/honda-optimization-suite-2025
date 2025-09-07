

'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Upload, 
  RefreshCw, 
  Download, 
  Car,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Search
} from 'lucide-react';
import { BrandPriceManager } from '@/lib/brand-price-manager';
import toast from 'react-hot-toast';

interface BrandPriceUpdaterProps {
  currentBrand: string;
  onPricesUpdate: (newPrices: Record<string, number>, newVolumes: Record<string, number>) => void;
}

export function BrandPriceUpdater({ currentBrand, onPricesUpdate }: BrandPriceUpdaterProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchBrand, setSearchBrand] = useState(currentBrand);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWebSearch = async () => {
    if (!searchBrand.trim()) {
      toast.error('Ingresa una marca para buscar');
      return;
    }

    setIsSearching(true);
    try {
      const result = await BrandPriceManager.fetchPricesFromWeb(searchBrand);
      
      if (result.success) {
        const { vehicle_prices, vehicle_volumes } = BrandPriceManager.convertToOptimizationFormat(result.lines);
        onPricesUpdate(vehicle_prices, vehicle_volumes);
        setLastUpdate(`Web - ${result.source}`);
      } else {
        // Usar fallback si está disponible
        if (result.fallback) {
          const { vehicle_prices, vehicle_volumes } = BrandPriceManager.convertToOptimizationFormat(result.fallback.lines);
          onPricesUpdate(vehicle_prices, vehicle_volumes);
          setLastUpdate('Fallback - Honda');
        }
      }
    } catch (error) {
      console.error('Error en búsqueda web:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await BrandPriceManager.uploadPricesFile(file);
      
      if (result.success) {
        // Aplicar solo los cambios del archivo
        toast.success(
          <div>
            <div className="font-semibold">Precios actualizados desde archivo</div>
            <div className="text-xs mt-1">Solo las líneas en el archivo fueron modificadas</div>
          </div>,
          { duration: 4000 }
        );
        setLastUpdate(`Archivo - ${file.name}`);
      }
    } catch (error) {
      console.error('Error subiendo archivo:', error);
    } finally {
      setIsUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Búsqueda Web */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Actualizar Precios desde Web
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="searchBrand" className="sr-only">Marca a buscar</Label>
              <Input
                id="searchBrand"
                value={searchBrand}
                onChange={(e) => setSearchBrand(e.target.value)}
                placeholder="Ingresa la marca (ej: Audi, BMW, Toyota...)"
                className="text-center"
              />
            </div>
            <Button 
              onClick={handleWebSearch}
              disabled={isSearching || !searchBrand.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Precios
                </>
              )}
            </Button>
          </div>

          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              El sistema buscará automáticamente en la página oficial de la marca en México para obtener 
              líneas de vehículos, número de versiones y precios promedio actualizados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Subida de Archivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-500" />
            Archivo de Emergencia (Precios.xls)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar
                </>
              )}
            </Button>
          </div>

          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div><strong>Formato requerido:</strong> Archivo Excel (.xls/.xlsx)</div>
                <div><strong>Columnas necesarias:</strong> Línea, Versión, Precio</div>
                <div><strong>Comportamiento:</strong> Solo actualiza las líneas presentes en el archivo</div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Estado actual */}
      {lastUpdate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <span className="font-medium">Última actualización:</span> {lastUpdate}
              </div>
              <Badge variant="secondary" className="text-xs">
                {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

