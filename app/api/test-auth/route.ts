
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Verificar usuarios en la base de datos
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        nombre_completo: true,
        puesto: true
      }
    });

    return NextResponse.json({
      success: true,
      userCount: users.length,
      users: users
    });
  } catch (error) {
    console.error('Error en test-auth:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error accessing database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 401 });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Contraseña incorrecta'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nombre_completo: user.nombre_completo,
        puesto: user.puesto
      }
    });
  } catch (error) {
    console.error('Error en test-auth POST:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error en autenticación',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
