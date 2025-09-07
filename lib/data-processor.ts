
import { HondaDatabase, OptimizationParameters, VehicleLine, HistoricalRecord } from './types';

/**
 * Procesador de datos Honda para carga y manejo de información
 */
export class HondaDataProcessor {
  private database: HondaDatabase | null = null;
  private vehicleLines: VehicleLine[] = [];

  /**
   * Cargar base de datos Honda
   */
  async loadHondaDatabase(): Promise<HondaDatabase> {
    try {
      const response = await fetch('/data/honda_database.json');
      if (!response.ok) {
        throw new Error('No se pudo cargar la base de datos Honda');
      }
      
      const database = await response.json();
      this.database = database;
      this.processVehicleLines();
      
      return database;
    } catch (error) {
      console.error('Error cargando base de datos Honda:', error);
      throw error;
    }
  }

  /**
   * Procesar líneas de vehículos desde la base de datos
   */
  private processVehicleLines(): void {
    if (!this.database) return;

    const vehicleNames = this.database.metadata.contexto_agencia.lineas_vehiculos;
    
    this.vehicleLines = vehicleNames.map((name, index) => ({
      id: `vehicle_${index + 1}`,
      name,
      models: this.extractModelsForVehicle(name),
      price_range: this.estimatePriceRange(name)
    }));
  }

  /**
   * Extraer modelos disponibles para un vehículo
   */
  private extractModelsForVehicle(vehicleName: string): string[] {
    if (!this.database) return [];
    
    const models: Set<string> = new Set();
    
    // Buscar en bonos especiales de todas las financieras
    Object.values(this.database.financieras).forEach(financiera => {
      const bonos = financiera.bonos_especiales || {};
      const searchKey = vehicleName.replace(' Hybrid', '').replace('CR-V', 'CR-V').replace('HR-V', 'HR-V');
      
      if (bonos[searchKey]) {
        Object.values(bonos[searchKey]).forEach((yearData: any) => {
          Object.keys(yearData).forEach(model => {
            models.add(model);
          });
        });
      }
    });
    
    return Array.from(models);
  }

  /**
   * Estimar rango de precios para un vehículo
   */
  private estimatePriceRange(vehicleName: string): { min: number; max: number } {
    const basePrice = this.database?.metadata.contexto_agencia.precio_promedio || 650000;
    
    // Factores de precio por segmento
    const priceFactors: Record<string, { min: number; max: number }> = {
      'City': { min: 0.4, max: 0.6 },
      'Civic': { min: 0.6, max: 0.8 },
      'BR-V': { min: 0.7, max: 0.9 },
      'HR-V': { min: 0.8, max: 1.0 },
      'CR-V': { min: 1.0, max: 1.4 },
      'Accord': { min: 1.2, max: 1.6 },
      'Pilot': { min: 1.8, max: 2.2 },
      'Odyssey': { min: 2.0, max: 2.4 }
    };
    
    const vehicleKey = vehicleName.replace(' Hybrid', '');
    const factor = priceFactors[vehicleKey] || { min: 0.8, max: 1.2 };
    
    return {
      min: Math.round(basePrice * factor.min),
      max: Math.round(basePrice * factor.max)
    };
  }

  /**
   * Obtener parámetros por defecto
   */
  getDefaultParameters(): OptimizationParameters {
    const vehiclePrices: Record<string, number> = {};
    const vehicleVolumes: Record<string, number> = {};
    
    // Volúmenes basados en datos reales de INEGI (2025)
    // Distribución ajustada a datos históricos de ventas Honda México
    const defaultVolumeDistribution: Record<string, number> = {
      'CR-V': 7,        // 26.6% - Líder en ventas
      'HR-V': 6,        // 22.9% - Segundo lugar  
      'BR-V': 5,        // 16.4% - Tercer lugar
      'City': 3,        // 12.0% - Del segmento "Otros" en datos reales
      'Civic': 3,       // 10.4% - Datos reales
      'Pilot': 2,       // 7.1% - Del segmento "Otros"
      'Odyssey': 1,     // 3.8% - Datos reales
      'Accord': 1,      // 2.3% - Datos reales
      'CR-V Hybrid': 0, // No apareció en datos INEGI 2025
      'Accord Hybrid': 0, // No apareció en datos INEGI 2025  
      'Civic Hybrid': 0   // No apareció en datos INEGI 2025
    };
    
    this.vehicleLines.forEach(vehicle => {
      vehiclePrices[vehicle.name] = Math.round((vehicle.price_range.min + vehicle.price_range.max) / 2);
      vehicleVolumes[vehicle.name] = defaultVolumeDistribution[vehicle.name] || 2;
    });

    // Calcular volumen total automáticamente
    const totalVolume = Object.values(vehicleVolumes).reduce((sum, vol) => sum + vol, 0);

    return {
      vehicle_prices: vehiclePrices,
      vehicle_volumes: vehicleVolumes,
      monthly_volume: totalVolume,  // Calculado automáticamente
      salespeople_count: 6,
      engagement_preferences: {
        'BBVA': 30,
        'Santander': 25,
        'Banorte': 35
      },
      bonus_weights: {
        'commission': 0.7,
        'bonus': 0.3
      }
    };
  }

  /**
   * Procesar archivo PDF (simulación)
   */
  async processPDFFile(file: File): Promise<{success: boolean, data?: any, error?: string}> {
    return new Promise((resolve) => {
      // Simulación de procesamiento PDF
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            type: 'honda_financial_plan',
            financiera: 'Nueva Financiera',
            planes_detectados: ['Plan A', 'Plan B'],
            bonos_detectados: 5,
            fecha_procesamiento: new Date().toISOString()
          }
        });
      }, 2000);
    });
  }

  /**
   * Guardar datos históricos
   */
  saveHistoricalData(record: Omit<HistoricalRecord, 'id'>): string {
    const records = this.getHistoricalData();
    const newRecord: HistoricalRecord = {
      id: `opt_${Date.now()}`,
      ...record
    };
    
    records.push(newRecord);
    localStorage.setItem('honda_optimization_history', JSON.stringify(records));
    
    return newRecord.id;
  }

  /**
   * Obtener datos históricos
   */
  getHistoricalData(): HistoricalRecord[] {
    try {
      const data = localStorage.getItem('honda_optimization_history');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error cargando datos históricos:', error);
      return [];
    }
  }

  /**
   * Limpiar datos históricos
   */
  clearHistoricalData(): void {
    localStorage.removeItem('honda_optimization_history');
  }

  /**
   * Exportar datos para backup
   */
  exportData(): string {
    const data = {
      historical_records: this.getHistoricalData(),
      export_date: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Importar datos desde backup
   */
  importData(jsonData: string): {success: boolean, imported: number, error?: string} {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.historical_records || !Array.isArray(data.historical_records)) {
        throw new Error('Formato de datos inválido');
      }
      
      const currentRecords = this.getHistoricalData();
      const importedRecords = data.historical_records;
      
      // Evitar duplicados por ID
      const existingIds = new Set(currentRecords.map(r => r.id));
      const newRecords = importedRecords.filter((r: HistoricalRecord) => !existingIds.has(r.id));
      
      const mergedRecords = [...currentRecords, ...newRecords];
      localStorage.setItem('honda_optimization_history', JSON.stringify(mergedRecords));
      
      return {
        success: true,
        imported: newRecords.length
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener estadísticas generales
   */
  getGeneralStats() {
    const records = this.getHistoricalData();
    
    if (records.length === 0) {
      return {
        total_optimizations: 0,
        avg_profit: 0,
        most_used_financial: 'N/A',
        most_profitable_vehicle: 'N/A'
      };
    }

    const totalProfit = records.reduce((sum, r) => sum + r.result.total_profit, 0);
    const avgProfit = totalProfit / records.length;

    // Analizar financiera más usada
    const financialCount: Record<string, number> = {};
    records.forEach(record => {
      record.result.variables.forEach(variable => {
        financialCount[variable.financialInstitution] = 
          (financialCount[variable.financialInstitution] || 0) + variable.quantity;
      });
    });

    const mostUsedFinancial = Object.entries(financialCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Analizar vehículo más rentable
    const vehicleProfit: Record<string, number> = {};
    records.forEach(record => {
      record.result.variables.forEach(variable => {
        vehicleProfit[variable.vehicleLine] = 
          (vehicleProfit[variable.vehicleLine] || 0) + (variable.profit * variable.quantity);
      });
    });

    const mostProfitableVehicle = Object.entries(vehicleProfit)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      total_optimizations: records.length,
      avg_profit: Math.round(avgProfit),
      most_used_financial: mostUsedFinancial,
      most_profitable_vehicle: mostProfitableVehicle
    };
  }

  /**
   * Getters
   */
  getDatabase(): HondaDatabase | null {
    return this.database;
  }

  getVehicleLines(): VehicleLine[] {
    return this.vehicleLines;
  }

  getFinancialInstitutions(): string[] {
    return this.database ? Object.keys(this.database.financieras) : [];
  }
}

// Instancia singleton
export const dataProcessor = new HondaDataProcessor();
