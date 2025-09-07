import toast from 'react-hot-toast';

/**
 * Gestor de precios dinamicos por marca
 */
export class BrandPriceManager {
  
  /**
   * Obtener precios desde la pagina web de la marca
   */
  static async fetchPricesFromWeb(marca: string): Promise<any> {
    try {
      console.log('Obteniendo precios de', marca, 'desde pagina web...');
      
      const loadingToast = toast.loading(
        `Buscando precios de ${marca} en pagina oficial Mexico...`,
        { duration: 4000 }
      );

      const response = await fetch(`/api/brand-prices?marca=${encodeURIComponent(marca)}`);
      const data = await response.json();

      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success(
          `Precios de ${marca} obtenidos exitosamente - ${Object.keys(data.lines).length} lineas encontradas`,
          { duration: 3000 }
        );

        return {
          success: true,
          marca: data.marca,
          lines: data.lines,
          source: data.source
        };
      } else {
        toast.error(`No se encontraron datos para ${marca}. Usando Honda como fallback.`);
        return {
          success: false,
          error: data.error,
          fallback: data.fallback
        };
      }

    } catch (error) {
      toast.error(`Error conectando con pagina de ${marca}`);
      console.error('Error obteniendo precios web:', error);
      return { success: false, error: error };
    }
  }

  /**
   * Procesar archivo Excel de precios
   */
  static async uploadPricesFile(file: File): Promise<any> {
    try {
      console.log('Procesando archivo de precios:', file.name);
      
      const loadingToast = toast.loading(
        'Procesando archivo Precios.xls...',
        { duration: 3000 }
      );

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/brand-prices', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success(
          `Archivo procesado exitosamente - ${data.updatedLines?.length || 0} lineas actualizadas`,
          { duration: 4000 }
        );

        return {
          success: true,
          updatedLines: data.updatedLines,
          pricesData: data.pricesData
        };
      } else {
        toast.error(data.error);
        return { success: false, error: data.error };
      }

    } catch (error) {
      toast.error('Error procesando archivo de precios');
      console.error('Error procesando archivo:', error);
      return { success: false, error: error };
    }
  }

  /**
   * Generar estructura de datos compatible con el optimizador
   */
  static convertToOptimizationFormat(brandLines: Record<string, any>): {
    vehicle_prices: Record<string, number>;
    vehicle_volumes: Record<string, number>;
  } {
    const vehicle_prices: Record<string, number> = {};
    const vehicle_volumes: Record<string, number> = {};

    // Distribucion base proporcional al numero de versiones
    const totalVersions = Object.values(brandLines).reduce((sum: number, line: any) => sum + line.versions, 0);

    Object.entries(brandLines).forEach(([lineName, lineData]: [string, any]) => {
      vehicle_prices[lineName] = lineData.avg_price;
      // Volumen proporcional al numero de versiones disponibles
      vehicle_volumes[lineName] = Math.max(1, Math.round((lineData.versions / totalVersions) * 34));
    });

    console.log('Conversion completada:', {
      lines: Object.keys(vehicle_prices).length,
      total_volume: Object.values(vehicle_volumes).reduce((sum, vol) => sum + vol, 0),
      avg_price: Math.round(Object.values(vehicle_prices).reduce((sum, price) => sum + price, 0) / Object.keys(vehicle_prices).length)
    });

    return { vehicle_prices, vehicle_volumes };
  }
}