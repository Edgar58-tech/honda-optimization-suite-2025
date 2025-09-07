
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Rocket, 
  Globe, 
  Settings, 
  Copy, 
  ExternalLink, 
  Download,
  Plus,
  Car,
  Building,
  Link,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { multiTenantManager, TenantConfig, COMMON_TENANT_CONFIGS } from '@/lib/multi-tenant-config';

export function DeploymentManager() {
  const [selectedBrand, setSelectedBrand] = useState('Honda');
  const [agencyName, setAgencyName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [generatedConfig, setGeneratedConfig] = useState<TenantConfig | null>(null);
  const [deploymentUrls, setDeploymentUrls] = useState<any>(null);
  const [deploymentScript, setDeploymentScript] = useState('');

  const supportedBrands = ['Honda', 'Audi', 'Toyota', 'Volkswagen'];

  const generateConfiguration = () => {
    if (!agencyName.trim()) {
      toast.error('❌ Por favor ingresa el nombre de la agencia');
      return;
    }

    // Generar configuración del tenant
    const config = multiTenantManager.generateTenantConfig(selectedBrand, agencyName.trim());
    
    // Generar URLs de acceso
    const urls = multiTenantManager.generateAccessUrls(selectedBrand, agencyName.trim());
    
    // Generar script de despliegue
    const script = multiTenantManager.generateDeploymentScript(config);

    setGeneratedConfig(config);
    setDeploymentUrls(urls);
    setDeploymentScript(script);

    toast.success(
      <div>
        <div className="font-semibold">✅ Configuración generada</div>
        <div className="text-xs mt-1">Lista para desplegar en Vercel</div>
      </div>,
      { duration: 3000 }
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`📋 ${label} copiado al portapapeles`, { duration: 2000 });
  };

  const downloadDeploymentScript = () => {
    if (!deploymentScript) return;
    
    const blob = new Blob([deploymentScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deploy_${selectedBrand.toLowerCase()}_${agencyName.toLowerCase().replace(/\s+/g, '_')}.sh`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('📥 Script de despliegue descargado', { duration: 3000 });
  };

  const loadPresetConfig = (brand: string, agency: string) => {
    setSelectedBrand(brand);
    setAgencyName(agency);
    toast.success(`🔄 Configuración cargada: ${brand} - ${agency}`, { duration: 2000 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-blue-500" />
            Administrador de Despliegues Multi-Marca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Globe className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">🌐 Multi-Instancia Inteligente</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>✅ <strong>URLs únicas:</strong> Cada marca/agencia tiene su propia URL</div>
                    <div>✅ <strong>Base de datos separada:</strong> Datos aislados por tenant</div>
                    <div>✅ <strong>Branding personalizado:</strong> Colores y logos por marca</div>
                    <div>✅ <strong>Control total:</strong> Acceso completo a Vercel Dashboard</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuraciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-500" />
            Configuraciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Honda */}
            <div>
              <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Honda - Agencias Principales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {COMMON_TENANT_CONFIGS.honda_principales.map((config, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => loadPresetConfig(config.brand, config.agency)}
                    className="text-xs"
                  >
                    {config.agency}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Audi */}
            <div>
              <h4 className="font-semibold text-black mb-2 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Audi - Agencias Principales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {COMMON_TENANT_CONFIGS.audi_principales.map((config, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => loadPresetConfig(config.brand, config.agency)}
                    className="text-xs"
                  >
                    {config.agency}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Toyota */}
            <div>
              <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Toyota - Agencias Principales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {COMMON_TENANT_CONFIGS.toyota_principales.map((config, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => loadPresetConfig(config.brand, config.agency)}
                    className="text-xs"
                  >
                    {config.agency}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración Personalizada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-500" />
            Crear Nueva Instancia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand-select">Marca del Vehículo</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedBrands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="agency-name">Nombre de la Agencia</Label>
              <Input
                id="agency-name"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="ej: Casa Honda Polanco, Audi Centro, etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="custom-domain">Dominio Personalizado (Opcional)</Label>
            <Input
              id="custom-domain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="ej: optimization.honda-polanco.com"
            />
          </div>

          <Button 
            onClick={generateConfiguration}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Generar Configuración de Despliegue
          </Button>
        </CardContent>
      </Card>

      {/* Resultados de Configuración */}
      {generatedConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Configuración Generada: {generatedConfig.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* URLs de Acceso */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Link className="h-4 w-4" />
                URLs de Acceso
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                  <div>
                    <p className="font-medium text-green-800">URL Principal</p>
                    <p className="text-sm text-green-600 font-mono">{deploymentUrls?.production}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(deploymentUrls?.production, 'URL principal')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => window.open(deploymentUrls?.production, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {customDomain && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                    <div>
                      <p className="font-medium text-blue-800">Dominio Personalizado</p>
                      <p className="text-sm text-blue-600 font-mono">https://{customDomain}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(`https://${customDomain}`, 'Dominio personalizado')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Variables de Entorno */}
            <div>
              <h4 className="font-semibold mb-3">⚙️ Variables de Entorno</h4>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div>TENANT_ID: {generatedConfig.id}</div>
                  <div>BRAND_NAME: {generatedConfig.brand}</div>
                  <div>AGENCY_NAME: {generatedConfig.agency}</div>
                  <div>PRIMARY_COLOR: {generatedConfig.theme_colors.primary}</div>
                  <div>SECONDARY_COLOR: {generatedConfig.theme_colors.secondary}</div>
                  <div>MULTI_YEAR_SUPPORT: {generatedConfig.features.multi_year_support.toString()}</div>
                </div>
              </div>
            </div>

            {/* Características */}
            <div>
              <h4 className="font-semibold mb-3">🚀 Características Habilitadas</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Badge variant={generatedConfig.features.pdf_export ? "default" : "secondary"}>
                  📄 Exportación PDF
                </Badge>
                <Badge variant={generatedConfig.features.historical_analysis ? "default" : "secondary"}>
                  📊 Análisis Histórico
                </Badge>
                <Badge variant={generatedConfig.features.multi_year_support ? "default" : "secondary"}>
                  📅 Multi-Año
                </Badge>
                <Badge variant={generatedConfig.features.custom_branding ? "default" : "secondary"}>
                  🎨 Branding Personalizado
                </Badge>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={downloadDeploymentScript}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Script de Despliegue
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => copyToClipboard(JSON.stringify(generatedConfig, null, 2), 'Configuración JSON')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Configuración
              </Button>

              <Button 
                variant="outline"
                onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Vercel Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones de Despliegue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-500" />
            Instrucciones de Despliegue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">📋 Pasos para Desplegar Nueva Instancia</h4>
                  <ol className="text-sm text-yellow-700 mt-2 space-y-1 ml-4">
                    <li>1. Configurar marca y agencia arriba ⬆️</li>
                    <li>2. Hacer clic en "Generar Configuración de Despliegue"</li>
                    <li>3. Descargar el script de despliegue automático</li>
                    <li>4. Ejecutar el script en tu terminal: <code className="bg-yellow-100 px-1 rounded">bash deploy_script.sh</code></li>
                    <li>5. Seguir las instrucciones en pantalla de Vercel CLI</li>
                    <li>6. ¡Listo! Tu nueva instancia estará disponible en la URL generada</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800">✅ Ventajas del Sistema Multi-Instancia</h4>
                  <ul className="text-sm text-green-700 mt-2 space-y-1 ml-4">
                    <li>• Cada marca/agencia tiene su propia aplicación independiente</li>
                    <li>• Los datos no se mezclan entre diferentes instancias</li>
                    <li>• Personalización automática de colores y branding</li>
                    <li>• Control total sobre cada despliegue en tu cuenta de Vercel</li>
                    <li>• URLs fáciles de recordar y compartir</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
