
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Building, 
  Save, 
  FileText, 
  MapPin, 
  Hash,
  AlertTriangle,
  CheckCircle,
  Car,
  CreditCard,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CompanyData {
  id?: string;
  nombreEmpresa: string;
  razonSocial: string;
  marca: string;
  rfc: string;
  calle: string;
  numero: string;
  colonia: string;
  delegacion: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
  // Nuevos campos para financieras
  tieneFinancieraMarca: boolean;
  puedeUsarOtrasFinancieras: boolean;
  nombreFinancieraMarca?: string;
}

interface CompanyDataFormProps {
  onBrandChange?: () => void;
}

export function CompanyDataForm({ onBrandChange }: CompanyDataFormProps = {}) {
  const [companyData, setCompanyData] = useState<CompanyData>({
    nombreEmpresa: '',
    razonSocial: '',
    marca: 'Honda',
    rfc: '',
    calle: '',
    numero: '',
    colonia: '',
    delegacion: '',
    codigoPostal: '',
    ciudad: '',
    estado: '',
    // Nuevos campos para financieras
    tieneFinancieraMarca: false,
    puedeUsarOtrasFinancieras: true,
    nombreFinancieraMarca: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/company-data');
      if (response.ok) {
        const data = await response.json();
        if (data.companyData) {
          setCompanyData(data.companyData);
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      toast.error('Error cargando datos de la empresa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanyData, value: string | boolean) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const previousBrand = companyData.marca;
    
    try {
      const response = await fetch('/api/company-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (response.ok) {
        const result = await response.json();
        setCompanyData(result.companyData);
        
        // Si cambió la marca, notificar al componente padre
        if (result.companyData.marca !== previousBrand && onBrandChange) {
          onBrandChange();
        }
        
        toast.success(
          <div>
            <div className="font-semibold">✅ Datos guardados exitosamente</div>
            <div className="text-xs mt-1">
              {result.companyData.marca !== previousBrand 
                ? '🔄 Header actualizado automáticamente' 
                : 'Los cambios se reflejarán en los reportes PDF'
              }
            </div>
          </div>,
          { duration: 4000 }
        );
      } else {
        throw new Error('Error saving company data');
      }
    } catch (error) {
      console.error('Error saving company data:', error);
      toast.error('Error guardando los datos de la empresa');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm text-gray-600">Cargando datos de la empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-500" />
            Datos de la Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Información para Reportes PDF</h4>
                <p className="text-sm text-blue-800">
                  Esta información aparecerá en el encabezado de todos los reportes PDF generados 
                  por el sistema de optimización. Asegúrate de que los datos estén actualizados y correctos.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información de la Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombreEmpresa" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Nombre de la Empresa
              </Label>
              <Input
                id="nombreEmpresa"
                value={companyData.nombreEmpresa}
                onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                placeholder="Dynamic Financial Solutions"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón Social</Label>
              <Input
                id="razonSocial"
                value={companyData.razonSocial}
                onChange={(e) => handleInputChange('razonSocial', e.target.value)}
                placeholder="Dynamic Financial Solutions S.A. de C.V."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Marca de Vehículos
              </Label>
              <Input
                id="marca"
                value={companyData.marca}
                onChange={(e) => handleInputChange('marca', e.target.value)}
                placeholder="Honda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfc" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                RFC
              </Label>
              <Input
                id="rfc"
                value={companyData.rfc}
                onChange={(e) => handleInputChange('rfc', e.target.value)}
                placeholder="DFS230915ABC"
                maxLength={13}
              />
            </div>
          </div>

          <Separator />

          {/* Dirección */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Dirección Fiscal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="calle">Calle</Label>
                <Input
                  id="calle"
                  value={companyData.calle}
                  onChange={(e) => handleInputChange('calle', e.target.value)}
                  placeholder="Av. Insurgentes Sur"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={companyData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  placeholder="1234"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="colonia">Colonia</Label>
                <Input
                  id="colonia"
                  value={companyData.colonia}
                  onChange={(e) => handleInputChange('colonia', e.target.value)}
                  placeholder="Del Valle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delegacion">Delegación/Municipio</Label>
                <Input
                  id="delegacion"
                  value={companyData.delegacion}
                  onChange={(e) => handleInputChange('delegacion', e.target.value)}
                  placeholder="Benito Juárez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigoPostal">Código Postal</Label>
                <Input
                  id="codigoPostal"
                  value={companyData.codigoPostal}
                  onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
                  placeholder="03100"
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={companyData.ciudad}
                  onChange={(e) => handleInputChange('ciudad', e.target.value)}
                  placeholder="Ciudad de México"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={companyData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  placeholder="CDMX"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configuración de Financieras */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Configuración de Financieras
            </h3>
            
            <div className="space-y-4">
              {/* Checkbox: Tiene financiera de la marca */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="tieneFinancieraMarca"
                  checked={companyData.tieneFinancieraMarca}
                  onCheckedChange={(checked) => {
                    handleInputChange('tieneFinancieraMarca', checked as boolean);
                    // Si se desmarca, también desmarcar el segundo checkbox
                    if (!checked) {
                      handleInputChange('puedeUsarOtrasFinancieras', false);
                    }
                  }}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor="tieneFinancieraMarca"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4 text-purple-600" />
                    ¿Tiene financiera de la marca?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Marcar si la empresa cuenta con financiera propia de la marca (ej: Honda Financial)
                  </p>
                </div>
              </div>

              {/* Campo condicional: Nombre de la financiera */}
              {companyData.tieneFinancieraMarca && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="nombreFinancieraMarca" className="text-sm">
                    Nombre de la Financiera de Marca
                  </Label>
                  <Input
                    id="nombreFinancieraMarca"
                    value={companyData.nombreFinancieraMarca || ''}
                    onChange={(e) => handleInputChange('nombreFinancieraMarca', e.target.value)}
                    placeholder="Honda Financial Services"
                    className="max-w-md"
                  />
                </div>
              )}

              {/* Checkbox condicional: Puede usar otras financieras */}
              {companyData.tieneFinancieraMarca && (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="puedeUsarOtrasFinancieras"
                    checked={companyData.puedeUsarOtrasFinancieras}
                    onCheckedChange={(checked) => handleInputChange('puedeUsarOtrasFinancieras', checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label 
                      htmlFor="puedeUsarOtrasFinancieras"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      ¿Puede utilizar otras financieras?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Marcar si la política permite usar financieras externas además de la de marca
                    </p>
                  </div>
                </div>
              )}

              {/* Información sobre el uso futuro */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-900 mb-1">Desarrollo Futuro</h4>
                    <p className="text-sm text-purple-800">
                      Esta configuración se utilizará en futuras versiones para:
                    </p>
                    <ul className="text-sm text-purple-800 mt-2 space-y-1">
                      <li>• Priorizar automáticamente la financiera de marca en optimizaciones</li>
                      <li>• Restringir opciones según políticas empresariales</li>
                      <li>• Calcular comisiones específicas de financiera propia vs externas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Botón de guardado */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>

          {/* Información adicional */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-1">Información Importante</h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Los cambios se aplicarán inmediatamente a todos los reportes PDF nuevos</li>
                  <li>• Esta información es visible solo para usuarios con rol de Administrador</li>
                  <li>• Asegúrate de que los datos fiscales sean correctos y actuales</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
