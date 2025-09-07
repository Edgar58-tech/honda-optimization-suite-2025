
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuarios por defecto
  const users = [
    {
      email: 'directores@dynamicfin.mx',
      password: 'PrivXejc#6',
      firstName: 'Director',
      lastName: 'General',
      role: 'ADMINISTRADOR' as const,
      name: 'Director General'
    },
    {
      email: 'john@doe.com',
      password: 'johndoe123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMINISTRADOR' as const,
      name: 'John Doe'
    },
    {
      email: 'ventas@dynamicfin.mx',
      password: 'ventas123',
      firstName: 'Usuario',
      lastName: 'Ventas',
      role: 'VENTAS' as const,
      name: 'Usuario Ventas'
    },
    {
      email: 'general@dynamicfin.mx',
      password: 'general123',
      firstName: 'Usuario',
      lastName: 'General',
      role: 'GENERAL' as const,
      name: 'Usuario General'
    }
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });

      console.log(`✅ Usuario creado: ${user.email} (${user.role})`);
    } else {
      console.log(`ℹ️ Usuario ya existe: ${userData.email}`);
    }
  }

  // Crear datos de empresa por defecto
  const existingCompany = await prisma.companyData.findFirst();
  
  if (!existingCompany) {
    const companyData = await prisma.companyData.create({
      data: {
        nombreEmpresa: 'Dynamic Financial Solutions',
        razonSocial: 'Dynamic Financial Solutions S.A. de C.V.',
        rfc: 'DFS230915ABC',
        calle: 'Av. Insurgentes Sur',
        numero: '1234',
        colonia: 'Del Valle',
        delegacion: 'Benito Juárez',
        codigoPostal: '03100',
        ciudad: 'Ciudad de México',
        estado: 'CDMX'
      }
    });

    console.log('✅ Datos de empresa creados:', companyData.nombreEmpresa);
  } else {
    console.log('ℹ️ Datos de empresa ya existen');
  }

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
