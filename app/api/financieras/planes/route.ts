
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const planes = await prisma.planFinanciera.findMany({
      where: { activo: true },
      orderBy: [
        { financiera: 'asc' },
        { prioridad: 'asc' },
        { nombre: 'asc' }
      ]
    });

    // Transformar los datos para el frontend
    const planesTransformados = planes.map(plan => ({
      ...plan,
      lineas: plan.lineas ? JSON.parse(plan.lineas) : null,
      versiones: plan.versiones ? JSON.parse(plan.versiones) : null,
      excepciones: [
        plan.excepcion1_linea ? {
          linea: plan.excepcion1_linea,
          version: plan.excepcion1_version || ""
        } : null,
        plan.excepcion2_linea ? {
          linea: plan.excepcion2_linea,
          version: plan.excepcion2_version || ""
        } : null,
        plan.excepcion3_linea ? {
          linea: plan.excepcion3_linea,
          version: plan.excepcion3_version || ""
        } : null
      ].filter(Boolean)
    }));

    return NextResponse.json(planesTransformados);
  } catch (error) {
    console.error('Error fetching planes:', error);
    return NextResponse.json({ error: 'Error fetching planes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validaciones básicas
    if (!data.financiera || !data.nombre) {
      return NextResponse.json(
        { error: 'Financiera y nombre son obligatorios' }, 
        { status: 400 }
      );
    }

    // Validar la lógica de líneas/versiones
    if ((!data.lineas || data.lineas.length === 0) && data.versiones && data.versiones.length > 0) {
      return NextResponse.json(
        { error: 'No puede tener versiones específicas sin líneas específicas' }, 
        { status: 400 }
      );
    }

    // Procesar excepciones de forma segura
    const excepciones = Array.isArray(data.excepciones) ? data.excepciones : [];
    
    // Función helper para limpiar valores
    const cleanValue = (value: any, invalidValues = ["", "none", "all"]): string | null => {
      if (!value || invalidValues.includes(value)) return null;
      return value;
    };

    const planData = {
      financiera: data.financiera,
      nombre: data.nombre,
      activo: data.activo ?? true,
      lineas: (data.lineas && data.lineas.length > 0) ? JSON.stringify(data.lineas) : null,
      versiones: (data.versiones && data.versiones.length > 0) ? JSON.stringify(data.versiones) : null,
      excepcion1_linea: cleanValue(excepciones[0]?.linea),
      excepcion1_version: cleanValue(excepciones[0]?.version),
      excepcion2_linea: cleanValue(excepciones[1]?.linea),
      excepcion2_version: cleanValue(excepciones[1]?.version),
      excepcion3_linea: cleanValue(excepciones[2]?.linea),
      excepcion3_version: cleanValue(excepciones[2]?.version),
      tasa: parseFloat(data.tasa) || 0,
      plazo: parseInt(data.plazo) || 12,
      enganche_minimo: parseFloat(data.enganche_minimo) || 0,
      comision_apertura: parseFloat(data.comision_apertura) || 0,
      pago_distribuidor: parseFloat(data.pago_distribuidor) || 0,
      bono_subsidio: parseFloat(data.bono_subsidio || 0),
      observaciones: data.observaciones || null,
      prioridad: parseInt(data.prioridad) || 1
    };

    console.log('📊 Creando plan:', planData);

    const plan = await prisma.planFinanciera.create({
      data: planData
    });

    console.log('✅ Plan creado exitosamente:', plan.id);
    return NextResponse.json(plan);
  } catch (error) {
    console.error('❌ Error creating plan:', error);
    return NextResponse.json({ error: `Error creating plan: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido para actualizar' }, { status: 400 });
    }

    // Validaciones básicas
    if (!data.financiera || !data.nombre) {
      return NextResponse.json(
        { error: 'Financiera y nombre son obligatorios' }, 
        { status: 400 }
      );
    }

    // Validar la lógica de líneas/versiones
    if ((!data.lineas || data.lineas.length === 0) && data.versiones && data.versiones.length > 0) {
      return NextResponse.json(
        { error: 'No puede tener versiones específicas sin líneas específicas' }, 
        { status: 400 }
      );
    }

    // Procesar excepciones de forma segura
    const excepciones = Array.isArray(data.excepciones) ? data.excepciones : [];
    
    // Función helper para limpiar valores
    const cleanValue = (value: any, invalidValues = ["", "none", "all"]): string | null => {
      if (!value || invalidValues.includes(value)) return null;
      return value;
    };

    const planData = {
      financiera: data.financiera,
      nombre: data.nombre,
      activo: data.activo ?? true,
      lineas: (data.lineas && data.lineas.length > 0) ? JSON.stringify(data.lineas) : null,
      versiones: (data.versiones && data.versiones.length > 0) ? JSON.stringify(data.versiones) : null,
      excepcion1_linea: cleanValue(excepciones[0]?.linea),
      excepcion1_version: cleanValue(excepciones[0]?.version),
      excepcion2_linea: cleanValue(excepciones[1]?.linea),
      excepcion2_version: cleanValue(excepciones[1]?.version),
      excepcion3_linea: cleanValue(excepciones[2]?.linea),
      excepcion3_version: cleanValue(excepciones[2]?.version),
      tasa: parseFloat(data.tasa) || 0,
      plazo: parseInt(data.plazo) || 12,
      enganche_minimo: parseFloat(data.enganche_minimo) || 0,
      comision_apertura: parseFloat(data.comision_apertura) || 0,
      pago_distribuidor: parseFloat(data.pago_distribuidor) || 0,
      bono_subsidio: parseFloat(data.bono_subsidio || 0),
      observaciones: data.observaciones || null,
      prioridad: parseInt(data.prioridad) || 1
    };

    console.log('📊 Actualizando plan:', id, planData);

    const plan = await prisma.planFinanciera.update({
      where: { id },
      data: planData
    });

    console.log('✅ Plan actualizado exitosamente:', plan.id);
    return NextResponse.json(plan);
  } catch (error) {
    console.error('❌ Error updating plan:', error);
    return NextResponse.json({ error: `Error updating plan: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.planFinanciera.update({
      where: { id },
      data: { activo: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Error deleting plan' }, { status: 500 });
  }
}
