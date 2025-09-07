
/**
 * Configuración Multi-Tenant para diferentes marcas y agencias
 * Permite tener múltiples instancias con URLs diferentes
 */

export interface TenantConfig {
  id: string;
  name: string;
  brand: string;
  agency: string;
  subdomain: string;
  customDomain?: string;
  database_schema?: string;
  theme_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  features: {
    pdf_export: boolean;
    historical_analysis: boolean;
    multi_year_support: boolean;
    custom_branding: boolean;
  };
}

export interface DeploymentConfig {
  tenant_id: string;
  vercel_deployment: {
    project_name: string;
    subdomain: string;
    custom_domain?: string;
    environment_variables: Record<string, string>;
  };
  database_config: {
    separate_schema: boolean;
    schema_name: string;
  };
}

export class MultiTenantManager {
  private tenants: Record<string, TenantConfig> = {};

  /**
   * Generar configuración de tenant para una marca/agencia específica
   */
  generateTenantConfig(brand: string, agency: string): TenantConfig {
    const tenantId = `${brand.toLowerCase()}_${agency.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Colores por marca
    const brandThemes: Record<string, any> = {
      'Honda': {
        primary: '#DC2626', // Rojo Honda
        secondary: '#1F2937',
        accent: '#3B82F6'
      },
      'Audi': {
        primary: '#000000', // Negro Audi
        secondary: '#DC2626',
        accent: '#6B7280'
      },
      'Toyota': {
        primary: '#DC2626', // Rojo Toyota
        secondary: '#FFFFFF',
        accent: '#1F2937'
      },
      'Volkswagen': {
        primary: '#1E3A8A', // Azul VW
        secondary: '#FFFFFF',
        accent: '#DC2626'
      }
    };

    const config: TenantConfig = {
      id: tenantId,
      name: `${brand} Optimization Suite - ${agency}`,
      brand,
      agency,
      subdomain: `${brand.toLowerCase()}-${agency.toLowerCase().replace(/\s+/g, '-')}`,
      database_schema: tenantId,
      theme_colors: brandThemes[brand] || brandThemes['Honda'],
      features: {
        pdf_export: true,
        historical_analysis: true,
        multi_year_support: brand !== 'Honda', // Honda solo 2025 por ahora
        custom_branding: true
      }
    };

    this.tenants[tenantId] = config;
    return config;
  }

  /**
   * Generar configuración de despliegue para Vercel
   */
  generateDeploymentConfig(tenantConfig: TenantConfig): DeploymentConfig {
    const deploymentConfig: DeploymentConfig = {
      tenant_id: tenantConfig.id,
      vercel_deployment: {
        project_name: `${tenantConfig.brand.toLowerCase()}-optimization-${tenantConfig.agency.toLowerCase().replace(/\s+/g, '-')}`,
        subdomain: `${tenantConfig.subdomain}-optimization`,
        environment_variables: {
          TENANT_ID: tenantConfig.id,
          BRAND_NAME: tenantConfig.brand,
          AGENCY_NAME: tenantConfig.agency,
          PRIMARY_COLOR: tenantConfig.theme_colors.primary,
          SECONDARY_COLOR: tenantConfig.theme_colors.secondary,
          ACCENT_COLOR: tenantConfig.theme_colors.accent,
          MULTI_YEAR_SUPPORT: tenantConfig.features.multi_year_support.toString(),
          DATABASE_SCHEMA: tenantConfig.database_schema || 'default'
        }
      },
      database_config: {
        separate_schema: true,
        schema_name: tenantConfig.database_schema || tenantConfig.id
      }
    };

    return deploymentConfig;
  }

  /**
   * Generar script de despliegue automático
   */
  generateDeploymentScript(tenantConfig: TenantConfig): string {
    const deployConfig = this.generateDeploymentConfig(tenantConfig);
    
    return `#!/bin/bash
# Script de despliegue automático para ${tenantConfig.name}
# Generado automáticamente el ${new Date().toLocaleDateString('es-MX')}

echo "🚀 Iniciando despliegue para ${tenantConfig.name}"

# 1. Instalar Vercel CLI si no está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# 2. Configurar variables de entorno
echo "⚙️ Configurando variables de entorno..."
vercel env add TENANT_ID "${deployConfig.vercel_deployment.environment_variables.TENANT_ID}"
vercel env add BRAND_NAME "${deployConfig.vercel_deployment.environment_variables.BRAND_NAME}"
vercel env add AGENCY_NAME "${deployConfig.vercel_deployment.environment_variables.AGENCY_NAME}"
vercel env add PRIMARY_COLOR "${deployConfig.vercel_deployment.environment_variables.PRIMARY_COLOR}"
vercel env add SECONDARY_COLOR "${deployConfig.vercel_deployment.environment_variables.SECONDARY_COLOR}"
vercel env add ACCENT_COLOR "${deployConfig.vercel_deployment.environment_variables.ACCENT_COLOR}"
vercel env add MULTI_YEAR_SUPPORT "${deployConfig.vercel_deployment.environment_variables.MULTI_YEAR_SUPPORT}"
vercel env add DATABASE_SCHEMA "${deployConfig.vercel_deployment.environment_variables.DATABASE_SCHEMA}"

# 3. Desplegar aplicación
echo "🚀 Desplegando aplicación..."
vercel deploy --prod

echo "✅ Despliegue completado para ${tenantConfig.name}"
echo "🌐 URL: https://${deployConfig.vercel_deployment.subdomain}.vercel.app"
echo "📊 Panel de control: https://vercel.com/dashboard"
`;
  }

  /**
   * Obtener configuración de tenant por ID
   */
  getTenant(tenantId: string): TenantConfig | null {
    return this.tenants[tenantId] || null;
  }

  /**
   * Listar todos los tenants configurados
   */
  getAllTenants(): TenantConfig[] {
    return Object.values(this.tenants);
  }

  /**
   * Generar URLs de acceso para una marca/agencia
   */
  generateAccessUrls(brand: string, agency: string): {
    staging: string;
    production: string;
    custom?: string;
  } {
    const subdomain = `${brand.toLowerCase()}-${agency.toLowerCase().replace(/\s+/g, '-')}`;
    
    return {
      staging: `https://${subdomain}-optimization.vercel.app`,
      production: `https://${subdomain}-optimization.vercel.app`,
      custom: `https://${brand.toLowerCase()}-optimization.${agency.toLowerCase().replace(/\s+/g, '-')}.com` // Opcional
    };
  }
}

// Configuraciones pre-definidas para casos comunes
export const COMMON_TENANT_CONFIGS = {
  honda_principales: [
    { brand: 'Honda', agency: 'Casa Honda Polanco' },
    { brand: 'Honda', agency: 'Casa Honda Santa Fe' },
    { brand: 'Honda', agency: 'Casa Honda Insurgentes' },
    { brand: 'Honda', agency: 'Casa Honda Satelite' }
  ],
  audi_principales: [
    { brand: 'Audi', agency: 'Audi Centro' },
    { brand: 'Audi', agency: 'Audi Polanco' },
    { brand: 'Audi', agency: 'Audi Santa Fe' }
  ],
  toyota_principales: [
    { brand: 'Toyota', agency: 'Toyota Insurgentes' },
    { brand: 'Toyota', agency: 'Toyota Satelite' },
    { brand: 'Toyota', agency: 'Toyota Roma Norte' }
  ]
};

// Instancia singleton
export const multiTenantManager = new MultiTenantManager();
