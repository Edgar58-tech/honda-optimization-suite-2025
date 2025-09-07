
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ConfigFinanciera } from '@/lib/types';

// GET - Obtener configuración de financieras
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden acceder a esta configuración
    const user = session.user as any;
    if (user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Buscar configuración existente en la base de datos usando Prisma
    const configuraciones = await prisma.financieraConfig.findMany({
      orderBy: { financiera: 'asc' }
    });

    // Organizar datos por financiera
    const configPorFinanciera: Record<string, ConfigFinanciera> = {};
    
    configuraciones.forEach((config) => {
      const planData = JSON.parse(config.configData) as ConfigFinanciera;
      configPorFinanciera[config.financiera] = planData;
    });

    return NextResponse.json({ configuraciones: configPorFinanciera });
  } catch (error) {
    console.error('Error obteniendo configuración de financieras:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Guardar configuración de financieras
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden modificar esta configuración
    const user = session.user as any;
    if (user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { configuraciones } = await request.json() as { configuraciones: Record<string, ConfigFinanciera> };

    // Validar datos recibidos
    if (!configuraciones || typeof configuraciones !== 'object') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Limpiar configuración existente y guardar nueva
    await prisma.$transaction(async (tx) => {
      // Eliminar configuración anterior
      await tx.financieraConfig.deleteMany();

      // Insertar nuevas configuraciones
      for (const [financiera, config] of Object.entries(configuraciones)) {
        await tx.financieraConfig.create({
          data: {
            financiera,
            configData: JSON.stringify(config)
          }
        });
      }
    });

    console.log(`✅ Configuración de financieras guardada por usuario: ${user.email}`);
    
    return NextResponse.json({ 
      message: 'Configuración guardada exitosamente',
      financieras: Object.keys(configuraciones)
    });

  } catch (error) {
    console.error('Error guardando configuración de financieras:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración específica de una financiera
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { financiera, config } = await request.json();

    if (!financiera || !config) {
      return NextResponse.json({ error: 'Financiera y configuración requeridas' }, { status: 400 });
    }

    // Actualizar o insertar configuración específica
    await prisma.financieraConfig.upsert({
      where: { financiera },
      update: {
        configData: JSON.stringify(config),
        updatedAt: new Date()
      },
      create: {
        financiera,
        configData: JSON.stringify(config)
      }
    });

    return NextResponse.json({ 
      message: `Configuración de ${financiera} actualizada exitosamente` 
    });

  } catch (error) {
    console.error('Error actualizando configuración de financiera:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
