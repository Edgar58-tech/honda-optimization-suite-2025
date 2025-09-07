

import { PlanFinanciera, ConfigFinanciera, CalculoFinanciamiento, ExcepcionPlan } from './types';

export class FinancieraService {
  private configuraciones: Record<string, ConfigFinanciera> = {};

  constructor(configuraciones: Record<string, ConfigFinanciera> = {}) {
    this.configuraciones = configuraciones;
  }

  // Actualizar configuraciones
  actualizarConfiguraciones(configuraciones: Record<string, ConfigFinanciera>) {
    this.configuraciones = configuraciones;
  }

  // NUEVA LÓGICA: Buscar plan aplicable con sistema integrado de líneas/versiones/excepciones
  obtenerPlanAplicable(financiera: string, linea: string, version?: string): PlanFinanciera | null {
    const config = this.configuraciones[financiera];
    if (!config) return null;

    // Buscar el mejor plan aplicable
    let mejorPlan: PlanFinanciera | null = null;
    let prioridadMejor = -1;

    for (const plan of config.planes) {
      // Verificar si esta línea/versión está en las excepciones del plan
      if (this.estaEnExcepciones(plan, linea, version)) {
        continue; // Este plan NO aplica para esta línea/versión
      }

      // Verificar si este plan aplica para esta línea/versión
      const prioridad = this.calcularPrioridad(plan, linea, version);
      if (prioridad > prioridadMejor) {
        mejorPlan = plan;
        prioridadMejor = prioridad;
      }
    }

    if (mejorPlan) {
      console.log(`🎯 Plan seleccionado: ${mejorPlan.nombre} (prioridad: ${prioridadMejor}) para ${linea} ${version || ''}`);
    } else {
      console.warn(`⚠️ No se encontró plan aplicable para ${financiera} - ${linea} ${version || ''}`);
    }

    return mejorPlan;
  }

  // Verificar si línea/versión está en excepciones del plan
  private estaEnExcepciones(plan: PlanFinanciera, linea: string, version?: string): boolean {
    for (const excepcion of plan.excepciones) {
      if (excepcion.linea === linea) {
        // Si la excepción no especifica versión, aplica para toda la línea
        if (!excepcion.version) {
          return true;
        }
        // Si especifica versión y coincide
        if (excepcion.version === version) {
          return true;
        }
      }
    }
    return false;
  }

  // Calcular prioridad del plan para línea/versión específica
  private calcularPrioridad(plan: PlanFinanciera, linea: string, version?: string): number {
    for (let i = 0; i < plan.lineas_aplicables.length; i++) {
      const lineaPlan = plan.lineas_aplicables[i];
      const versionPlan = plan.versiones_aplicables[i];

      // Coincidencia exacta: línea y versión específicas (prioridad más alta)
      if (lineaPlan === linea && versionPlan === version) {
        return 100;
      }

      // Coincidencia de línea completa: línea específica, versión vacía
      if (lineaPlan === linea && versionPlan === "") {
        return 50;
      }

      // Plan para todos: línea y versión vacías (prioridad más baja)
      if (lineaPlan === "" && versionPlan === "") {
        return 10;
      }
    }

    return -1; // No aplica
  }

  // Calcular financiamiento completo CORREGIDO
  calcularFinanciamiento(
    financiera: string,
    linea: string,
    version: string,
    precioLista: number,
    enganche: number,
    incentivosCliente?: number, // Ahora opcional, usar del plan si no se especifica
    participacionDistribuidor?: number // Opcional, usar del plan si no se especifica
  ): CalculoFinanciamiento | null {
    const plan = this.obtenerPlanAplicable(financiera, linea, version);
    if (!plan) return null;

    // Validar enganche dentro de rangos
    if (enganche < plan.enganche_minimo || enganche > (plan.enganche_maximo || 99)) {
      console.warn(`Enganche ${enganche}% fuera de rango para ${financiera}: ${plan.enganche_minimo}% - ${plan.enganche_maximo || 99}%`);
    }

    // Usar valores del plan si no se especifican
    const incentivosUsados = incentivosCliente !== undefined ? incentivosCliente : (plan.bono_subsidio || 0);
    const participacionUsada = participacionDistribuidor !== undefined 
      ? participacionDistribuidor 
      : (100 - plan.participacion_financiera) / 100;

    // Cálculos paso a paso CORREGIDOS
    const montoEnganche = precioLista * (enganche / 100);
    const costoIncentivosDistribuidor = incentivosUsados * participacionUsada;
    const precioAjustado = precioLista - incentivosUsados;
    const saldoFinanciar = precioAjustado - montoEnganche;
    
    const comisionApertura = saldoFinanciar * (plan.comision_apertura / 100);
    const pagoDistribuidor = saldoFinanciar * (plan.pago_distribuidor / 100);
    
    // Utilidad real: pago menos costo de incentivos
    const utilidadNeta = pagoDistribuidor - costoIncentivosDistribuidor;

    return {
      financiera,
      plan,
      precio_lista: precioLista,
      enganche: montoEnganche,
      saldo_financiar: saldoFinanciar,
      comision_apertura: comisionApertura,
      pago_distribuidor: pagoDistribuidor,
      costo_incentivos_distribuidor: costoIncentivosDistribuidor,
      utilidad_total: utilidadNeta
    };
  }

  // Listar planes disponibles para una financiera
  obtenerPlanes(financiera: string): PlanFinanciera[] {
    const config = this.configuraciones[financiera];
    return config ? config.planes : [];
  }

  // Listar financieras disponibles
  obtenerFinancieras(): string[] {
    return Object.keys(this.configuraciones);
  }

  // Comparar múltiples financieras para un vehículo específico
  compararFinancieras(
    linea: string,
    version: string,
    precioLista: number,
    enganche: number
  ): CalculoFinanciamiento[] {
    const resultados: CalculoFinanciamiento[] = [];

    for (const financiera of this.obtenerFinancieras()) {
      const calculo = this.calcularFinanciamiento(financiera, linea, version, precioLista, enganche);
      if (calculo) {
        resultados.push(calculo);
      }
    }

    // Ordenar por utilidad neta descendente
    return resultados.sort((a, b) => b.utilidad_total - a.utilidad_total);
  }

  // Análisis de sensibilidad de enganche para una financiera específica
  analizarSensibilidadEnganche(
    financiera: string,
    linea: string,
    version: string,
    precioLista: number,
    pasos: number = 10
  ): { enganches: number[], utilidades: number[], optimo: { enganche: number, utilidad: number } } {
    const plan = this.obtenerPlanAplicable(financiera, linea, version);
    if (!plan) return { enganches: [], utilidades: [], optimo: { enganche: 0, utilidad: 0 } };

    const enganches: number[] = [];
    const utilidades: number[] = [];
    let mejorEnganche = plan.enganche_minimo;
    let mejorUtilidad = 0;

    // Evaluar desde enganche mínimo hasta máximo
    const enganchemin = plan.enganche_minimo;
    const enganchemax = plan.enganche_maximo || 99;
    const paso = (enganchemax - enganchemin) / pasos;

    for (let i = 0; i <= pasos; i++) {
      const enganche = enganchemin + (i * paso);
      const calculo = this.calcularFinanciamiento(financiera, linea, version, precioLista, enganche);
      
      if (calculo) {
        enganches.push(enganche);
        utilidades.push(calculo.utilidad_total);
        
        if (calculo.utilidad_total > mejorUtilidad) {
          mejorUtilidad = calculo.utilidad_total;
          mejorEnganche = enganche;
        }
      }
    }

    return {
      enganches,
      utilidades,
      optimo: { enganche: mejorEnganche, utilidad: mejorUtilidad }
    };
  }

  // Obtener resumen de configuración
  obtenerResumen(): { 
    financieras: number, 
    planesTotal: number, 
    planePorFinanciera: Record<string, number> 
  } {
    const planePorFinanciera: Record<string, number> = {};
    let planesTotal = 0;

    for (const [financiera, config] of Object.entries(this.configuraciones)) {
      planePorFinanciera[financiera] = config.planes.length;
      planesTotal += config.planes.length;
    }

    return {
      financieras: Object.keys(this.configuraciones).length,
      planesTotal,
      planePorFinanciera
    };
  }

  // Validar configuración
  validarConfiguracion(financiera: string): { esValida: boolean, errores: string[] } {
    const config = this.configuraciones[financiera];
    const errores: string[] = [];

    if (!config) {
      errores.push('No existe configuración para esta financiera');
      return { esValida: false, errores };
    }

    if (config.planes.length === 0) {
      errores.push('La financiera debe tener al menos un plan');
    }

    for (const plan of config.planes) {
      // Validar campos numéricos
      if (plan.participacion_financiera < 0 || plan.participacion_financiera > 100) {
        errores.push(`Plan ${plan.nombre}: Participación financiera debe estar entre 0 y 100`);
      }

      if (plan.enganche_minimo < 0 || plan.enganche_minimo > 100) {
        errores.push(`Plan ${plan.nombre}: Enganche mínimo debe estar entre 0 y 100`);
      }

      if (plan.enganche_maximo < plan.enganche_minimo) {
        errores.push(`Plan ${plan.nombre}: Enganche máximo debe ser mayor al mínimo`);
      }

      // Validar lógica de líneas/versiones
      for (let i = 0; i < plan.lineas_aplicables.length; i++) {
        const linea = plan.lineas_aplicables[i];
        const version = plan.versiones_aplicables[i];

        if (linea === "" && version !== "") {
          errores.push(`Plan ${plan.nombre}: No puede haber versión específica sin línea específica`);
        }
      }

      // Validar excepciones
      for (const excepcion of plan.excepciones) {
        if (excepcion.linea === "" && excepcion.version !== "") {
          errores.push(`Plan ${plan.nombre}: Excepción no puede tener versión sin línea`);
        }
      }
    }

    return {
      esValida: errores.length === 0,
      errores
    };
  }

  // DEPRECATED: Método de compatibilidad
  buscarExcepcion(): any | null {
    console.warn('⚠️ buscarExcepcion está deprecated. Usar nueva lógica integrada.');
    return null;
  }
}

// Instancia global del servicio
export const financieraService = new FinancieraService();

// Hook para usar el servicio en componentes React
export function useFinancieraService() {
  return financieraService;
}
