
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAndUpdateUsers() {
  try {
    // Obtener todos los usuarios
    const users = await prisma.user.findMany();
    
    console.log('\n🔍 USUARIOS EN LA BASE DE DATOS:');
    console.log('================================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. 📧 Email: ${user.email}`);
      console.log(`   👤 Nombre: ${user.nombre_completo || 'No definido'}`);
      console.log(`   💼 Puesto: ${user.puesto || 'No definido'}`);
      console.log(`   🎭 Rol: ${user.rol || 'No definido'}`);
      console.log(`   📅 Creado: ${user.createdAt}`);
      console.log('   -------------------------');
    });
    
    // Buscar específicamente el usuario directores@dynamicfin.mx
    const directorUser = await prisma.user.findUnique({
      where: { email: 'directores@dynamicfin.mx' }
    });
    
    if (directorUser) {
      console.log('\n✅ USUARIO directores@dynamicfin.mx ENCONTRADO:');
      console.log('================================================');
      console.log(`📧 Email: ${directorUser.email}`);
      console.log(`👤 Nombre: ${directorUser.nombre_completo || 'No definido'}`);
      console.log(`💼 Puesto: ${directorUser.puesto || 'No definido'}`);
      console.log(`🎭 Rol: ${directorUser.rol || 'No definido'}`);
      
      // Actualizar contraseña y datos
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const updatedUser = await prisma.user.update({
        where: { email: 'directores@dynamicfin.mx' },
        data: {
          password: hashedPassword,
          nombre_completo: 'Juan Carlos Rodríguez García',
          puesto: 'Director General',
          rol: 'administrador'
        }
      });
      
      console.log('\n🔧 USUARIO ACTUALIZADO CORRECTAMENTE:');
      console.log('=====================================');
      console.log(`📧 Email: ${updatedUser.email}`);
      console.log(`👤 Nombre: ${updatedUser.nombre_completo}`);
      console.log(`💼 Puesto: ${updatedUser.puesto}`);
      console.log(`🎭 Rol: ${updatedUser.rol}`);
      console.log(`🔑 Contraseña: admin123 (actualizada)`);
      
    } else {
      console.log('\n❌ USUARIO directores@dynamicfin.mx NO ENCONTRADO');
      console.log('================================================');
      
      // Crear el usuario
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'directores@dynamicfin.mx',
          password: hashedPassword,
          nombre_completo: 'Juan Carlos Rodríguez García',
          puesto: 'Director General',
          rol: 'administrador'
        }
      });
      
      console.log('\n🆕 USUARIO CREADO CORRECTAMENTE:');
      console.log('=================================');
      console.log(`📧 Email: ${newUser.email}`);
      console.log(`👤 Nombre: ${newUser.nombre_completo}`);
      console.log(`💼 Puesto: ${newUser.puesto}`);
      console.log(`🎭 Rol: ${newUser.rol}`);
      console.log(`🔑 Contraseña: admin123`);
    }
    
    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE');
    console.log('===================================');
    console.log('Ahora puedes usar las credenciales:');
    console.log('📧 Email: directores@dynamicfin.mx');
    console.log('🔑 Password: admin123');
    console.log('🎭 Rol: Administrador');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateUsers();
