
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creando usuario administrador en base de datos local...\n');
    
    // Datos del usuario administrador
    const userData = {
      email: 'directores@dynamicfin.mx',
      password: 'PrivXejc#6',
      name: 'Edgardo Ocampo',
      firstName: 'Edgardo',
      lastName: 'Ocampo',
      nombre_completo: 'Edgardo Ocampo',
      puesto: 'Director General',
      role: 'ADMINISTRADOR'
    };
    
    console.log('📧 Email:', userData.email);
    console.log('🔑 Contraseña:', userData.password);
    console.log('👤 Nombre:', userData.name);
    console.log('🎭 Rol:', userData.role);
    console.log('\n🔄 Procesando...');
    
    // Hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    console.log('🔐 Contraseña encriptada correctamente');
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      console.log('⚠️  Usuario ya existe, actualizando contraseña...');
      
      // Actualizar usuario existente
      const updatedUser = await prisma.user.update({
        where: { email: userData.email },
        data: {
          name: userData.name,
          firstName: userData.firstName,
          lastName: userData.lastName,
          nombre_completo: userData.nombre_completo,
          puesto: userData.puesto,
          password: hashedPassword,
          role: userData.role,
          emailVerified: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ USUARIO ACTUALIZADO CORRECTAMENTE');
      console.log('===================================');
      console.log('🆔 ID:', updatedUser.id);
      console.log('📧 Email:', updatedUser.email);
      console.log('👤 Nombre:', updatedUser.name);
      console.log('🎭 Rol:', updatedUser.role);
      
    } else {
      console.log('➕ Creando nuevo usuario...');
      
      // Crear nuevo usuario
      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          firstName: userData.firstName,
          lastName: userData.lastName,
          nombre_completo: userData.nombre_completo,
          puesto: userData.puesto,
          password: hashedPassword,
          role: userData.role,
          emailVerified: new Date(),
        }
      });
      
      console.log('✅ USUARIO CREADO CORRECTAMENTE');
      console.log('===============================');
      console.log('🆔 ID:', newUser.id);
      console.log('📧 Email:', newUser.email);
      console.log('👤 Nombre:', newUser.name);
      console.log('🎭 Rol:', newUser.role);
    }
    
    console.log('\n📋 CREDENCIALES PARA LOGIN:');
    console.log('===========================');
    console.log('📧 Email: directores@dynamicfin.mx');
    console.log('🔑 Password: PrivXejc#6');
    console.log('🎭 Rol: Administrador');
    console.log('\n💡 Ahora ya puedes hacer login en la aplicación.');
    
    // Verificar que el usuario existe
    const verifyUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    console.log('\n✅ VERIFICACIÓN:');
    console.log('================');
    console.log('Usuario en BD:', verifyUser ? 'SÍ' : 'NO');
    if (verifyUser) {
      console.log('✓ Email verified:', verifyUser.emailVerified ? 'SÍ' : 'NO');
      console.log('✓ Role:', verifyUser.role);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 'P2002') {
      console.log('⚠️ El email ya está registrado');
    }
    
    console.log('\n🔧 SOLUCIÓN ALTERNATIVA:');
    console.log('========================');
    console.log('Prueba con estas credenciales de prueba:');
    console.log('📧 admin@test.com / 🔑 123456');
    console.log('📧 ventas@test.com / 🔑 123456');
    
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar
createAdminUser();
