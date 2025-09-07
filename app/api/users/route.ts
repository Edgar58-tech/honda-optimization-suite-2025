
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        nombre_completo: true,
        puesto: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validaciones básicas
    if (!data.email || !data.password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' }, 
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' }, 
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Crear el usuario
    const userData = {
      email: data.email,
      password: hashedPassword,
      name: data.name || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      nombre_completo: data.nombre_completo || null,
      puesto: data.puesto || null,
      role: data.role || 'GENERAL'
    };

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        nombre_completo: true,
        puesto: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido para actualizar' }, { status: 400 });
    }

    // Preparar datos de actualización
    const updateData: any = {
      name: data.name || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      nombre_completo: data.nombre_completo || null,
      puesto: data.puesto || null,
      role: data.role || 'GENERAL'
    };

    // Si se proporciona nueva contraseña, hashearla
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        nombre_completo: true,
        puesto: true,
        role: true,
        updatedAt: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
  }
}
