
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlanesFinancieros() {
  console.log('🌱 Seeding planes financieros...');

  // Planes para BBVA
  const planesBBVA = [
    {
      financiera: 'BBVA',
      nombre: 'Plan Estándar BBVA',
      lineas: null, // Todas las líneas
      versiones: null, // Todas las versiones
      excepcion1_linea: null,
      excepcion1_version: null,
      excepcion2_linea: null,
      excepcion2_version: null,
      excepcion3_linea: null,
      excepcion3_version: null,
      tasa: 8.5,
      plazo: 24,
      enganche_minimo: 20,
      comision_apertura: 2.5,
      pago_distribuidor: 16.5,
      bono_subsidio: 24300,
      observaciones: 'Plan base para todos los vehículos',
      prioridad: 1
    },
    {
      financiera: 'BBVA',
      nombre: 'Plan Premium BBVA',
      lineas: JSON.stringify(['Pilot', 'Odyssey']), // Solo líneas premium
      versiones: null,
      excepcion1_linea: null,
      excepcion1_version: null,
      excepcion2_linea: null,
      excepcion2_version: null,
      excepcion3_linea: null,
      excepcion3_version: null,
      tasa: 7.9,
      plazo: 36,
      enganche_minimo: 15,
      comision_apertura: 2.0,
      pago_distribuidor: 18.0,
      bono_subsidio: 35000,
      observaciones: 'Plan especial para vehículos premium',
      prioridad: 2
    }
  ];

  // Planes para Banorte
  const planesBanorte = [
    {
      financiera: 'Banorte',
      nombre: 'Plan Base Banorte',
      lineas: null,
      versiones: null,
      excepcion1_linea: 'Odyssey', // Odyssey no aplica a plan base
      excepcion1_version: null,
      excepcion2_linea: 'Pilot',   // Pilot no aplica a plan base
      excepcion2_version: null,
      excepcion3_linea: null,
      excepcion3_version: null,
      tasa: 9.2,
      plazo: 24,
      enganche_minimo: 10,
      comision_apertura: 5.0,
      pago_distribuidor: 5.0,
      bono_subsidio: 15000,
      observaciones: 'Plan para vehículos compactos y sedanes',
      prioridad: 1
    },
    {
      financiera: 'Banorte',
      nombre: 'Plan SUV Banorte',
      lineas: JSON.stringify(['CR-V', 'HR-V', 'Pilot', 'Passport']),
      versiones: null,
      excepcion1_linea: null,
      excepcion1_version: null,
      excepcion2_linea: null,
      excepcion2_version: null,
      excepcion3_linea: null,
      excepcion3_version: null,
      tasa: 8.8,
      plazo: 30,
      enganche_minimo: 20,
      comision_apertura: 4.0,
      pago_distribuidor: 6.5,
      bono_subsidio: 20000,
      observaciones: 'Plan especializado para SUVs',
      prioridad: 2
    }
  ];

  // Planes para Santander
  const planesSantander = [
    {
      financiera: 'Santander',
      nombre: 'Plan Preferente Santander',
      lineas: null,
      versiones: null,
      excepcion1_linea: null,
      excepcion1_version: null,
      excepcion2_linea: null,
      excepcion2_version: null,
      excepcion3_linea: null,
      excepcion3_version: null,
      tasa: 8.9,
      plazo: 24,
      enganche_minimo: 15,
      comision_apertura: 2.69,
      pago_distribuidor: 2.69,
      bono_subsidio: 12000,
      observaciones: 'Plan general para todos los modelos',
      prioridad: 1
    },
    {
      financiera: 'Santander',
      nombre: 'Plan Híbrido Santander',
      lineas: JSON.stringify(['Accord', 'CR-V', 'Civic']),
      versiones: JSON.stringify(['Hybrid', 'EX-L']), // Solo versiones híbridas o premium
      excepcion1_linea: null,
      excepcion1_version: null,
      excepcion2_linea: null,
      excepcion2_version: null,
      excepcion3_linea: null,
      excepcion3_version: null,
      tasa: 7.5,
      plazo: 36,
      enganche_minimo: 25,
      comision_apertura: 1.5,
      pago_distribuidor: 4.0,
      bono_subsidio: 18000,
      observaciones: 'Plan incentivado para vehículos híbridos',
      prioridad: 3
    }
  ];

  // Insertar todos los planes
  const todosPlanes = [...planesBBVA, ...planesBanorte, ...planesSantander];

  for (const plan of todosPlanes) {
    try {
      await prisma.planFinanciera.create({
        data: plan
      });
      console.log(`✅ Plan creado: ${plan.nombre}`);
    } catch (error) {
      console.error(`❌ Error creando ${plan.nombre}:`, error);
    }
  }

  console.log('🎉 Seed de planes financieros completado!');
}

async function main() {
  try {
    // Limpiar planes existentes
    await prisma.planFinanciera.deleteMany({});
    console.log('🧹 Planes existentes eliminados');

    // Crear nuevos planes
    await seedPlanesFinancieros();
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedPlanesFinancieros };
