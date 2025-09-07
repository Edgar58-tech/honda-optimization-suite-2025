
import { create, all } from 'mathjs';
import { OptimizationVariable, OptimizationConstraints, OptimizationResult, OptimizationParameters, HondaDatabase } from './types';
import { RealisticHondaOptimizer } from './realistic-optimizer';

const math = create(all);

export class HondaOptimizationEngine {
  private database: HondaDatabase;
  private vehicleLines: string[];
  private financialInstitutions: string[];

  constructor(database: HondaDatabase) {
    this.database = database;
    this.vehicleLines = database.metadata.contexto_agencia.lineas_vehiculos;
    this.financialInstitutions = Object.keys(database.financieras);
  }

  /**
   * Método principal de optimización realista basado en datos históricos
   */
  async optimize(parameters: OptimizationParameters): Promise<OptimizationResult> {
    const startTime = performance.now();
    
    console.log('🚀 Iniciando optimización Honda con restricciones realistas...');
    
    try {
      // Usar optimizador realista como método principal
      const realisticOptimizer = new RealisticHondaOptimizer(this.database);
      const realisticResult = await realisticOptimizer.optimize(parameters);
      
      if (realisticResult.success) {
        console.log('✅ Optimización realista exitosa');
        
        // Convertir resultado a formato estándar
        const variables = this.convertRealisticResultToVariables(realisticResult.result);
        
        const endTime = performance.now();
        const optimizationTime = endTime - startTime;

        return {
          variables,
          total_profit: realisticResult.result.total_profit,
          constraints_satisfied: realisticResult.result.constraints_satisfied,
          optimization_time: optimizationTime,
          algorithm_used: 'Optimizador Realista Basado en Datos INEGI',
          recommendations: [
            ...realisticResult.result.recommendations,
            `🎯 Confianza: ${realisticResult.confidence_level}%`,
            '📊 Distribución basada en patrones reales de mercado Honda México'
          ]
        };
      } else {
        console.log('⚠️ Optimización realista falló, usando método híbrido como fallback');
        
        // Fallback al método híbrido original
        const fallbackResult = await this.hybridOptimization(parameters);
        const endTime = performance.now();
        
        return {
          ...fallbackResult,
          optimization_time: endTime - startTime,
          algorithm_used: 'Híbrido (Fallback)',
          recommendations: [
            '⚠️ Se usó método de fallback debido a restricciones complejas',
            ...fallbackResult.recommendations
          ]
        };
      }
      
    } catch (error) {
      console.error('❌ Error en optimización:', error);
      
      // Generar resultado de emergencia
      return this.generateEmergencyResult(parameters, performance.now() - startTime);
    }
  }

  /**
   * Convertir resultado realista a formato de variables estándar
   */
  private convertRealisticResultToVariables(realisticResult: any): OptimizationVariable[] {
    const variables: OptimizationVariable[] = [];
    
    if (realisticResult.distribution) {
      realisticResult.distribution.forEach((item: any) => {
        variables.push({
          vehicleLine: item.vehicle,
          financialInstitution: item.financial,
          quantity: item.quantity,
          enganche: 25, // Enganche promedio realista
          commission: Math.round(item.profit_per_unit * 0.7), // 70% es comisión
          bonus: Math.round(item.profit_per_unit * 0.3), // 30% son bonos
          profit: item.profit_per_unit
        });
      });
    }
    
    return variables;
  }

  /**
   * Método híbrido original como fallback
   */
  private async hybridOptimization(parameters: OptimizationParameters): Promise<Omit<OptimizationResult, 'optimization_time' | 'algorithm_used'>> {
    console.log('🔄 Ejecutando optimización híbrida...');
    
    // Paso 1: Preparar matrices para método Simplex
    const simplexResult = this.simplexOptimization(parameters);
    
    // Paso 2: Refinar con algoritmo genético
    const geneticResult = this.geneticOptimization(parameters, simplexResult);

    // Generar recomendaciones
    const recommendations = this.generateRecommendations(geneticResult, parameters);

    return {
      variables: geneticResult,
      total_profit: this.calculateTotalProfit(geneticResult),
      constraints_satisfied: this.validateConstraints(geneticResult, parameters),
      recommendations
    };
  }

  /**
   * Generar resultado de emergencia en caso de error crítico
   */
  private generateEmergencyResult(parameters: OptimizationParameters, optimizationTime: number): OptimizationResult {
    console.log('🆘 Generando resultado de emergencia...');
    
    // Distribución conservadora basada en datos históricos
    const emergencyVariables: OptimizationVariable[] = [
      { vehicleLine: 'CR-V', financialInstitution: 'Banorte', quantity: 7, enganche: 25, commission: 20000, bonus: 10000, profit: 30000 },
      { vehicleLine: 'HR-V', financialInstitution: 'Banorte', quantity: 6, enganche: 25, commission: 18000, bonus: 10000, profit: 28000 },
      { vehicleLine: 'BR-V', financialInstitution: 'BBVA', quantity: 5, enganche: 20, commission: 15000, bonus: 10000, profit: 25000 },
      { vehicleLine: 'City', financialInstitution: 'BBVA', quantity: 3, enganche: 20, commission: 12000, bonus: 8000, profit: 20000 },
      { vehicleLine: 'Civic', financialInstitution: 'Santander', quantity: 3, enganche: 30, commission: 14000, bonus: 8000, profit: 22000 },
      { vehicleLine: 'Pilot', financialInstitution: 'Banorte', quantity: 2, enganche: 30, commission: 30000, bonus: 15000, profit: 45000 },
      { vehicleLine: 'Odyssey', financialInstitution: 'BBVA', quantity: 1, enganche: 25, commission: 27000, bonus: 15000, profit: 42000 },
      { vehicleLine: 'Accord', financialInstitution: 'Santander', quantity: 1, enganche: 30, commission: 20000, bonus: 15000, profit: 35000 }
    ];
    
    return {
      variables: emergencyVariables,
      total_profit: this.calculateTotalProfit(emergencyVariables),
      constraints_satisfied: true,
      optimization_time: optimizationTime,
      algorithm_used: 'Distribución de Emergencia',
      recommendations: [
        '🆘 Se usó distribución de emergencia basada en patrones históricos',
        '⚠️ Revisa los parámetros de entrada e intenta nuevamente',
        '📊 Esta distribución sigue patrones seguros del mercado Honda México'
      ]
    };
  }

  /**
   * Optimización usando método Simplex
   */
  private simplexOptimization(parameters: OptimizationParameters): OptimizationVariable[] {
    const variables: OptimizationVariable[] = [];
    
    // Crear variables de decisión para cada combinación vehículo-financiera
    for (const vehicleLine of this.vehicleLines) {
      for (const financialInstitution of this.financialInstitutions) {
        const profitData = this.calculateProfitability(vehicleLine, financialInstitution, parameters);
        
        variables.push({
          vehicleLine,
          financialInstitution,
          quantity: 0, // Se calculará por Simplex
          enganche: profitData.optimal_engagement,
          commission: profitData.commission,
          bonus: profitData.bonus,
          profit: profitData.unit_profit
        });
      }
    }

    // Aplicar lógica Simplex simplificada
    const sortedByProfit = variables.sort((a, b) => b.profit - a.profit);
    
    let remainingVolume = parameters.monthly_volume;
    const result: OptimizationVariable[] = [];

    // Asignar volumen basado en rentabilidad, respetando restricciones
    for (const variable of sortedByProfit) {
      if (remainingVolume <= 0) break;
      
      const maxQuantity = Math.min(
        remainingVolume,
        this.getMaxQuantityForLine(variable.vehicleLine, parameters)
      );
      
      if (maxQuantity > 0) {
        result.push({
          ...variable,
          quantity: Math.floor(maxQuantity * (variable.profit / sortedByProfit[0]?.profit || 1))
        });
        
        remainingVolume -= result[result.length - 1]?.quantity || 0;
      }
    }

    return this.adjustToMeetConstraints(result, parameters);
  }

  /**
   * Optimización usando algoritmo genético
   */
  private geneticOptimization(
    parameters: OptimizationParameters, 
    initialSolution: OptimizationVariable[]
  ): OptimizationVariable[] {
    const populationSize = 50;
    const generations = 100;
    const mutationRate = 0.1;
    
    // Crear población inicial
    let population = this.createInitialPopulation(populationSize, parameters, initialSolution);
    
    for (let generation = 0; generation < generations; generation++) {
      // Evaluar fitness
      const fitness = population.map(individual => this.calculateFitness(individual, parameters));
      
      // Selección por torneo
      const newPopulation: OptimizationVariable[][] = [];
      
      for (let i = 0; i < populationSize; i++) {
        const parent1 = this.tournamentSelection(population, fitness);
        const parent2 = this.tournamentSelection(population, fitness);
        
        // Cruzamiento
        const offspring = this.crossover(parent1, parent2);
        
        // Mutación
        const mutatedOffspring = this.mutate(offspring, parameters, mutationRate);
        
        newPopulation.push(mutatedOffspring);
      }
      
      population = newPopulation;
    }

    // Retornar mejor solución
    const finalFitness = population.map(individual => this.calculateFitness(individual, parameters));
    const bestIndex = finalFitness.indexOf(Math.max(...finalFitness));
    
    return population[bestIndex] || initialSolution;
  }

  /**
   * Calcular rentabilidad por combinación vehículo-financiera
   */
  private calculateProfitability(
    vehicleLine: string, 
    financialInstitution: string, 
    parameters: OptimizationParameters
  ) {
    const vehiclePrice = parameters.vehicle_prices[vehicleLine] || this.database.metadata.contexto_agencia.precio_promedio;
    const financialData = this.database.financieras[financialInstitution];
    
    // Buscar bonos especiales para este vehículo
    const bonusData = this.findBestBonus(vehicleLine, financialData);
    
    // Enganche óptimo (balanceando comisión y viabilidad)
    const optimalEngagement = this.calculateOptimalEngagement(financialData);
    
    // Usar enganche específico si está en los parámetros, sino usar el óptimo
    const engancheToUse = parameters.engagement_preferences?.[financialInstitution] || optimalEngagement;
    
    // Calcular comisión basada en saldo a financiar con enganche específico
    const avgCommission = this.calculateAverageCommission(financialData, vehiclePrice, engancheToUse);
    
    const unitProfit = avgCommission + bonusData.bonus;
    
    return {
      unit_profit: unitProfit,
      commission: avgCommission,
      bonus: bonusData.bonus,
      optimal_engagement: engancheToUse
    };
  }

  /**
   * Encontrar el mejor bono para un vehículo
   */
  private findBestBonus(vehicleLine: string, financialData: any): { bonus: number, model: string } {
    const bonos = financialData.bonos_especiales || {};
    let bestBonus = 0;
    let bestModel = '';
    
    // Buscar en todas las variantes del vehículo
    const searchKey = vehicleLine.replace(' Hybrid', '').replace('CR-V', 'CR-V').replace('HR-V', 'HR-V');
    
    if (bonos[searchKey]) {
      const years = Object.keys(bonos[searchKey]);
      
      for (const year of years) {
        const models = bonos[searchKey][year];
        
        for (const model in models) {
          const modelBonus = models[model]?.bono_sin_iva || 0;
          if (modelBonus > bestBonus) {
            bestBonus = modelBonus;
            bestModel = model;
          }
        }
      }
    }
    
    return { bonus: bestBonus, model: bestModel };
  }

  /**
   * Calcular comisión promedio basada en saldo a financiar
   */
  private calculateAverageCommission(financialData: any, vehiclePrice: number, enganche: number = 25): number {
    // Usar enganche específico pasado como parámetro
    const engancheDecimal = enganche / 100;
    const saldoAFinanciar = vehiclePrice * (1 - engancheDecimal);
    
    const financieraName = financialData.id || this.getFinancialName(financialData);
    let comisionRate = 0;
    
    // Usar tasas específicas por financiera según análisis de PDFs
    switch (financieraName) {
      case 'BBVA':
        // BBVA: 0% / 2% / 2.5% según plan, promedio 1.5%
        comisionRate = 0.015;
        break;
        
      case 'Banorte':
        // Banorte: 1.5% a 5% según enganche (escalado)
        if (enganche >= 50) {
          comisionRate = 0.05; // 5%
        } else if (enganche >= 40) {
          comisionRate = 0.04; // 4%  
        } else if (enganche >= 30) {
          comisionRate = 0.035; // 3.5%
        } else if (enganche >= 20) {
          comisionRate = 0.025; // 2.5%
        } else {
          comisionRate = 0.015; // 1.5%
        }
        break;
        
      case 'Santander':
        // Santander: 2.5% fijo
        comisionRate = 0.025;
        break;
        
      default:
        // Parsear comisión de los planes (fallback)
        const planes = financialData.planes_financiamiento || {};
        let totalRate = 0;
        let planCount = 0;
        
        Object.values(planes).forEach((plan: any) => {
          if (plan.comision) {
            const commissionStr = plan.comision.toString();
            const commissionValues = commissionStr.match(/\d+\.?\d*/g);
            
            if (commissionValues && commissionValues.length > 0) {
              const maxCommission = Math.max(...commissionValues.map(Number));
              totalRate += maxCommission / 100;
              planCount++;
            }
          }
        });
        
        comisionRate = planCount > 0 ? totalRate / planCount : 0.02;
    }
    
    // La comisión se aplica sobre el saldo a financiar, no el precio completo
    return saldoAFinanciar * comisionRate;
  }

  /**
   * Obtener nombre de la financiera
   */
  private getFinancialName(financialData: any): string {
    // Buscar en las claves del objeto database
    for (const [name, data] of Object.entries(this.database.financieras)) {
      if (data === financialData) {
        return name;
      }
    }
    return 'Unknown';
  }

  /**
   * Calcular enganche óptimo
   */
  private calculateOptimalEngagement(financialData: any): number {
    // Analizar los planes para encontrar el enganche que maximiza comisiones
    const planes = financialData.planes_financiamiento || {};
    let optimalEnganche = 20; // Default 20%
    
    Object.values(planes).forEach((plan: any) => {
      if (plan.tasas_por_enganche) {
        const enganches = Object.keys(plan.tasas_por_enganche).map(e => parseInt(e.replace('%', '')));
        // Balancear entre enganche bajo (más ventas) y alto (más comisión)
        const balanceEnganche = enganches.find(e => e >= 20 && e <= 40);
        if (balanceEnganche) {
          optimalEnganche = balanceEnganche;
        }
      }
    });
    
    return optimalEnganche;
  }

  /**
   * Crear población inicial para algoritmo genético
   */
  private createInitialPopulation(
    size: number, 
    parameters: OptimizationParameters,
    baseSolution: OptimizationVariable[]
  ): OptimizationVariable[][] {
    const population: OptimizationVariable[][] = [];
    
    // Incluir solución base
    population.push([...baseSolution]);
    
    // Generar variaciones aleatorias
    for (let i = 1; i < size; i++) {
      const individual = this.generateRandomIndividual(parameters);
      population.push(individual);
    }
    
    return population;
  }

  /**
   * Generar individuo aleatorio
   */
  private generateRandomIndividual(parameters: OptimizationParameters): OptimizationVariable[] {
    const variables: OptimizationVariable[] = [];
    let remainingVolume = parameters.monthly_volume;
    
    // Crear todas las combinaciones posibles
    const allCombinations = [];
    for (const vehicleLine of this.vehicleLines) {
      for (const financialInstitution of this.financialInstitutions) {
        const profitData = this.calculateProfitability(vehicleLine, financialInstitution, parameters);
        
        allCombinations.push({
          vehicleLine,
          financialInstitution,
          quantity: 0,
          enganche: profitData.optimal_engagement,
          commission: profitData.commission,
          bonus: profitData.bonus,
          profit: profitData.unit_profit
        });
      }
    }
    
    // Distribución aleatoria respetando restricciones
    while (remainingVolume > 0 && allCombinations.length > 0) {
      const randomIndex = Math.floor(Math.random() * allCombinations.length);
      const selected = allCombinations[randomIndex];
      
      const maxQuantity = Math.min(
        remainingVolume,
        this.getMaxQuantityForLine(selected.vehicleLine, parameters),
        5 // Máximo 5 por asignación para diversificar
      );
      
      if (maxQuantity > 0) {
        const quantity = Math.max(1, Math.floor(Math.random() * maxQuantity));
        
        const existing = variables.find(v => 
          v.vehicleLine === selected.vehicleLine && 
          v.financialInstitution === selected.financialInstitution
        );
        
        if (existing) {
          existing.quantity += quantity;
        } else {
          variables.push({
            ...selected,
            quantity
          });
        }
        
        remainingVolume -= quantity;
      }
    }
    
    return variables;
  }

  /**
   * Calcular fitness de un individuo
   */
  private calculateFitness(individual: OptimizationVariable[], parameters: OptimizationParameters): number {
    const totalProfit = this.calculateTotalProfit(individual);
    const constraintsPenalty = this.calculateConstraintsPenalty(individual, parameters);
    
    return Math.max(0, totalProfit - constraintsPenalty);
  }

  /**
   * Selección por torneo
   */
  private tournamentSelection(population: OptimizationVariable[][], fitness: number[]): OptimizationVariable[] {
    const tournamentSize = 3;
    let bestIndex = Math.floor(Math.random() * population.length);
    
    for (let i = 1; i < tournamentSize; i++) {
      const candidate = Math.floor(Math.random() * population.length);
      if (fitness[candidate] > fitness[bestIndex]) {
        bestIndex = candidate;
      }
    }
    
    return [...(population[bestIndex] || [])];
  }

  /**
   * Cruzamiento de dos individuos
   */
  private crossover(parent1: OptimizationVariable[], parent2: OptimizationVariable[]): OptimizationVariable[] {
    const offspring: OptimizationVariable[] = [];
    const crossoverPoint = Math.floor(Math.random() * Math.min(parent1.length, parent2.length));
    
    // Combinar los padres
    for (let i = 0; i < Math.max(parent1.length, parent2.length); i++) {
      if (i < crossoverPoint) {
        if (parent1[i]) offspring.push({ ...parent1[i] });
      } else {
        if (parent2[i]) offspring.push({ ...parent2[i] });
      }
    }
    
    return offspring;
  }

  /**
   * Mutación de un individuo
   */
  private mutate(individual: OptimizationVariable[], parameters: OptimizationParameters, mutationRate: number): OptimizationVariable[] {
    const mutated = [...individual];
    
    for (const variable of mutated) {
      if (Math.random() < mutationRate) {
        // Mutar cantidad (±1)
        const change = Math.random() < 0.5 ? -1 : 1;
        variable.quantity = Math.max(0, variable.quantity + change);
        
        // Mutar enganche (±5%)
        if (Math.random() < 0.3) {
          variable.enganche = Math.max(5, Math.min(50, variable.enganche + (Math.random() < 0.5 ? -5 : 5)));
        }
      }
    }
    
    return this.repairSolution(mutated, parameters);
  }

  /**
   * Reparar solución para cumplir restricciones
   */
  private repairSolution(individual: OptimizationVariable[], parameters: OptimizationParameters): OptimizationVariable[] {
    const totalQuantity = individual.reduce((sum, v) => sum + v.quantity, 0);
    const targetVolume = parameters.monthly_volume;
    
    if (totalQuantity !== targetVolume) {
      const diff = targetVolume - totalQuantity;
      
      if (diff > 0) {
        // Agregar unidades a las variables más rentables
        const sortedByProfit = [...individual].sort((a, b) => b.profit - a.profit);
        for (let i = 0; i < Math.abs(diff) && i < sortedByProfit.length; i++) {
          sortedByProfit[i].quantity += 1;
        }
      } else {
        // Quitar unidades de las menos rentables
        const sortedByProfit = [...individual].sort((a, b) => a.profit - b.profit);
        for (let i = 0; i < Math.abs(diff) && i < sortedByProfit.length; i++) {
          if (sortedByProfit[i].quantity > 0) {
            sortedByProfit[i].quantity -= 1;
          }
        }
      }
    }
    
    return individual.filter(v => v.quantity > 0);
  }

  /**
   * Utilidades auxiliares
   */
  private calculateTotalProfit(variables: OptimizationVariable[]): number {
    return variables.reduce((total, v) => total + (v.profit * v.quantity), 0);
  }

  private getMaxQuantityForLine(vehicleLine: string, parameters: OptimizationParameters): number {
    // Máximo 8 unidades por línea de vehículo para diversificar
    return 8;
  }

  private validateConstraints(variables: OptimizationVariable[], parameters: OptimizationParameters): boolean {
    const totalQuantity = variables.reduce((sum, v) => sum + v.quantity, 0);
    return totalQuantity === parameters.monthly_volume;
  }

  private calculateConstraintsPenalty(variables: OptimizationVariable[], parameters: OptimizationParameters): number {
    const totalQuantity = variables.reduce((sum, v) => sum + v.quantity, 0);
    const volumeDiff = Math.abs(totalQuantity - parameters.monthly_volume);
    
    return volumeDiff * 10000; // Penalidad por no cumplir volumen
  }

  private adjustToMeetConstraints(variables: OptimizationVariable[], parameters: OptimizationParameters): OptimizationVariable[] {
    return this.repairSolution(variables, parameters);
  }

  private generateRecommendations(variables: OptimizationVariable[], parameters: OptimizationParameters): string[] {
    const recommendations: string[] = [];
    
    // Analizar distribución por financiera
    const distributionByFinancial = variables.reduce((acc, v) => {
      acc[v.financialInstitution] = (acc[v.financialInstitution] || 0) + v.quantity;
      return acc;
    }, {} as Record<string, number>);

    const topFinancial = Object.entries(distributionByFinancial)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    if (topFinancial.length > 0) {
      recommendations.push(`Enfocar el ${Math.round((topFinancial[0][1] / parameters.monthly_volume) * 100)}% del volumen en ${topFinancial[0][0]} para maximizar rentabilidad`);
    }

    // Analizar vehículos más rentables
    const topVehicles = variables
      .sort((a, b) => (b.profit * b.quantity) - (a.profit * a.quantity))
      .slice(0, 3);

    if (topVehicles.length > 0) {
      recommendations.push(`Priorizar ventas de ${topVehicles[0].vehicleLine} que genera $${Math.round(topVehicles[0].profit * topVehicles[0].quantity).toLocaleString()} de utilidad`);
    }

    // Recomendación de enganches
    const avgEnganche = variables.reduce((sum, v) => sum + (v.enganche * v.quantity), 0) / parameters.monthly_volume;
    recommendations.push(`Mantener enganche promedio de ${Math.round(avgEnganche)}% para optimizar comisiones`);

    return recommendations;
  }
}
