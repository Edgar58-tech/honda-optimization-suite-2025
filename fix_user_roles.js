
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log('🔧 Corrigiendo roles de usuarios...\n');
    
    // Obtener todos los usuarios
    const users = await prisma.user.findMany();
    
    console.log('👥 USUARIOS ACTUALES:');
    console.log('=====================');
    
    for (const user of users) {
      console.log(`📧 Email: ${user.email}`);
      console.log(`🎭 Rol actual: "${user.role}"`);
      console.log(`👤 Nombre: ${user.nombre_completo || 'No definido'}`);
      console.log('-------------------');
    }
    
    // Actualizar usuarios específicos con rol ADMINISTRADOR (mayúsculas)
    const adminUsers = [
      'admin@test.com',
      'directores@dynamicfin.mx'
    ];
    
    console.log('\n🔄 ACTUALIZANDO ROLES A "ADMINISTRADOR"...\n');
    
    for (const email of adminUsers) {
      const updatedUser = await prisma.user.updateMany({
        where: { email: email },
        data: { role: 'ADMINISTRADOR' }
      });
      
      if (updatedUser.count > 0) {
        console.log(`✅ ${email} → Rol actualizado a "ADMINISTRADOR"`);
      } else {
        console.log(`❌ ${email} → Usuario no encontrado`);
      }
    }
    
    // Crear usuario admin si no existe
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    });
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      await prisma.user.create({
        data: {
          email: 'admin@test.com',
          password: hashedPassword,
          nombre_completo: 'María Elena Administradora',
          puesto: 'Administrador del Sistema',
          role: 'ADMINISTRADOR'
        }
      });
      
      console.log('✅ Usuario admin@test.com creado con rol ADMINISTRADOR');
    }
    
    // Crear usuario director si no existe  
    const directorUser = await prisma.user.findUnique({
      where: { email: 'directores@dynamicfin.mx' }
    });
    
    if (!directorUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.user.create({
        data: {
          email: 'directores@dynamicfin.mx',
          password: hashedPassword,
          nombre_completo: 'Juan Carlos Rodríguez García',
          puesto: 'Director General',
          role: 'ADMINISTRADOR'
        }
      });
      
      console.log('✅ Usuario directores@dynamicfin.mx creado con rol ADMINISTRADOR');
    }
    
    // Verificar usuarios finales
    const finalUsers = await prisma.user.findMany();
    
    console.log('\n🎉 USUARIOS FINALES:');
    console.log('====================');
    
    for (const user of finalUsers) {
      console.log(`📧 ${user.email}`);
      console.log(`🎭 Rol: "${user.role}"`);
      console.log(`👤 Nombre: ${user.nombre_completo}`);
      console.log(`💼 Puesto: ${user.puesto}`);
      console.log('-------------------');
    }
    
    console.log('\n🔑 CREDENCIALES DE ADMINISTRADOR:');
    console.log('=================================');
    console.log('📧 admin@test.com / 🔑 123456');
    console.log('📧 directores@dynamicfin.mx / 🔑 admin123');
    console.log('\n💡 Ambos usuarios tienen rol "ADMINISTRADOR" y pueden ver:');
    console.log('   ✅ Pestaña Usuarios');
    console.log('   ✅ Pestaña Empresa'); 
    console.log('   ✅ Sistema dual de Financieras');
    console.log('   ✅ Todas las funciones de administrador');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
