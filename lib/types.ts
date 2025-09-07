
// Tipos de datos para la aplicación de optimización Honda

export interface VehicleLine {
  id: string;
  name: string;
  models: string[];
  price_range: {
    min: number;
    max: number;
  };
}

export interface FinancialInstitution {
  id: string;
  name: string;
  bonos_especiales: Record<string, any>;
  planes_financiamiento: Record<string, any>;
  condiciones_especiales: Record<string, any>;
}

export interface OptimizationVariable {
  vehicleLine: string;
  financialInstitution: string;
  quantity: number;
  enganche: number;
  commission: number;
  bonus: number;
  profit: number;
}

export interface OptimizationConstraints {
  total_volume: number;
  min_engagement_rate: number;
  penetration_requirements: Record<string, number>;
  max_per_line: Record<string, number>;
}

export interface OptimizationResult {
  variables: OptimizationVariable[];
  total_profit: number;
  constraints_satisfied: boolean;
  optimization_time: number;
  algorithm_used: string;
  recommendations: string[];
}

export interface DashboardMetrics {
  total_profit: number;
  volume_distribution: Record<string, number>;
  engagement_rates: Record<string, number>;
  bonus_utilization: number;
  penetration_rates: Record<string, number>;
}

export interface HondaDatabase {
  metadata: {
    fecha_creacion: string;
    vigencia: string;
    contexto_agencia: {
      lineas_vehiculos: string[];
      ventas_mensuales: number;
      precio_promedio: number;
    };
  };
  financieras: Record<string, FinancialInstitution>;
}

export interface OptimizationParameters {
  vehicle_prices: Record<string, number>;
  vehicle_volumes: Record<string, number>;  // Volumen por línea de vehículo
  monthly_volume: number;  // Calculado automáticamente como suma de vehicle_volumes
  salespeople_count: number;
  engagement_preferences: Record<string, number>;
  bonus_weights: Record<string, number>;
}

export interface SensitivityAnalysis {
  parameter: string;
  base_value: number;
  variations: {
    value: number;
    profit_impact: number;
    distribution_impact: Record<string, number>;
  }[];
}

export interface HistoricalRecord {
  id: string;
  date: string;
  parameters: OptimizationParameters;
  result: OptimizationResult;
  notes: string;
}

// NUEVA ESTRUCTURA - Planes Financieros con sistema integrado de líneas/versiones/excepciones
export interface PlanFinanciera {
  id: string;
  nombre: string;
  // NUEVO: Múltiples líneas y versiones que aplican a este plan
  lineas_aplicables: string[]; // ["", "CR-V", "Pilot"] - vacío = todos
  versiones_aplicables: string[]; // ["", "LX", "EX"] - vacío = todos  
  // NUEVO: Hasta 3 excepciones (líneas/versiones que NO aplican)
  excepciones: ExcepcionPlan[];
  // Parámetros financieros
  participacion_financiera: number;
  comision_apertura: number;
  pago_distribuidor: number;
  enganche_minimo: number;
  enganche_maximo: number;
  bono_subsidio: number;
  es_generico: boolean;
}

export interface ExcepcionPlan {
  id: string;
  linea: string; // Línea que NO aplica a este plan
  version?: string; // Versión específica que NO aplica (opcional)
}

// DEPRECATED: Esta interfaz será eliminada
export interface Excepcion {
  id: string;
  linea: string;
  version?: string;
  plan_alternativo_id: string;
}

export interface ConfigFinanciera {
  nombre: string;
  planes: PlanFinanciera[];
  // ELIMINADO: excepciones separadas - ahora cada plan maneja sus propias excepciones
}

export interface CalculoFinanciamiento {
  financiera: string;
  plan: PlanFinanciera;
  precio_lista: number;
  enganche: number;
  saldo_financiar: number;
  comision_apertura: number;
  pago_distribuidor: number;
  costo_incentivos_distribuidor: number;
  utilidad_total: number;
}
