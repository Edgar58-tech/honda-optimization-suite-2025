
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('👥 Seeding usuarios...');

  const users = [
    {
      name: 'Director General',
      email: 'directores@dynamicfin.mx',
      password: 'admin123',
      firstName: 'Director',
      lastName: 'General',
      nombre_completo: 'Juan Carlos Rodríguez García',
      puesto: 'Director General',
      role: 'ADMINISTRADOR'
    },
    {
      name: 'Admin Test',
      email: 'admin@test.com',
      password: '123456',
      firstName: 'Admin',
      lastName: 'Test',
      nombre_completo: 'María Elena Administradora',
      puesto: 'Administrador del Sistema',
      role: 'ADMINISTRADOR'
    },
    {
      name: 'Ventas Test',
      email: 'ventas@test.com',
      password: '123456',
      firstName: 'Ventas',
      lastName: 'Test',
      nombre_completo: 'Carlos Alberto Mendoza',
      puesto: 'Gerente de Ventas',
      role: 'VENTAS'
    },
    {
      name: 'Usuario General',
      email: 'general@test.com',
      password: '123456',
      firstName: 'Usuario',
      lastName: 'General',
      nombre_completo: 'Ana Patricia López',
      puesto: 'Coordinadora General',
      role: 'GENERAL'
    }
  ];

  for (const userData of users) {
    try {
      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  Usuario ya existe: ${userData.email}`);
        continue;
      }

      // Crear el usuario
      await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          nombre_completo: userData.nombre_completo,
          puesto: userData.puesto,
          role: userData.role as any
        }
      });

      console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);
    } catch (error) {
      console.error(`❌ Error creando usuario ${userData.email}:`, error);
    }
  }

  console.log('🎉 Seed de usuarios completado!');
  console.log('\n📧 Credenciales de prueba:');
  console.log('Admin: admin@test.com / 123456');
  console.log('Director: directores@dynamicfin.mx / admin123');
  console.log('Ventas: ventas@test.com / 123456');
  console.log('General: general@test.com / 123456');
}

async function main() {
  try {
    await seedUsers();
  } catch (error) {
    console.error('Error en seed de usuarios:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedUsers };
