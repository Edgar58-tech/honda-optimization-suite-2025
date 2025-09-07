
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const companyData = await prisma.companyData.findFirst();

    return NextResponse.json({ companyData });

  } catch (error) {
    console.error('Error fetching company data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nombreEmpresa,
      razonSocial,
      marca,
      rfc,
      calle,
      numero,
      colonia,
      delegacion,
      codigoPostal,
      ciudad,
      estado,
      // Nuevos campos
      tieneFinancieraMarca,
      puedeUsarOtrasFinancieras,
      nombreFinancieraMarca
    } = body;

    // Buscar datos existentes
    const existingData = await prisma.companyData.findFirst();

    let companyData;
    if (existingData) {
      // Actualizar datos existentes
      companyData = await prisma.companyData.update({
        where: { id: existingData.id },
        data: {
          nombreEmpresa,
          razonSocial,
          marca,
          rfc,
          calle,
          numero,
          colonia,
          delegacion,
          codigoPostal,
          ciudad,
          estado,
          tieneFinancieraMarca,
          puedeUsarOtrasFinancieras,
          nombreFinancieraMarca
        }
      });
    } else {
      // Crear nuevos datos
      companyData = await prisma.companyData.create({
        data: {
          nombreEmpresa,
          razonSocial,
          marca,
          rfc,
          calle,
          numero,
          colonia,
          delegacion,
          codigoPostal,
          ciudad,
          estado,
          tieneFinancieraMarca,
          puedeUsarOtrasFinancieras,
          nombreFinancieraMarca
        }
      });
    }

    return NextResponse.json({ 
      companyData,
      message: 'Datos de empresa guardados exitosamente' 
    });

  } catch (error) {
    console.error('Error saving company data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
