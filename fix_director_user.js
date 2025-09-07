
// Script para corregir credenciales del usuario director
const fetch = require('node-fetch');

async function fixDirectorCredentials() {
  try {
    console.log('🔧 Corrigiendo credenciales del usuario director...\n');
    
    // Datos del usuario director
    const userData = {
      email: 'directores@dynamicfin.mx',
      password: 'admin123',
      nombre_completo: 'Juan Carlos Rodríguez García',
      puesto: 'Director General',
      rol: 'administrador'
    };
    
    console.log('📧 Email:', userData.email);
    console.log('🔑 Nueva contraseña:', userData.password);
    console.log('👤 Nombre:', userData.nombre_completo);
    console.log('💼 Puesto:', userData.puesto);
    console.log('🎭 Rol:', userData.rol);
    console.log('\n🔄 Enviando solicitud...');
    
    // Llamada a la API para crear/actualizar usuario
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ USUARIO ACTUALIZADO CORRECTAMENTE');
      console.log('===================================');
      console.log('🎉 El usuario ha sido creado/actualizado exitosamente');
      console.log('\n📋 CREDENCIALES PARA USAR:');
      console.log('==========================');
      console.log('📧 Email: directores@dynamicfin.mx');
      console.log('🔑 Password: admin123');
      console.log('🎭 Rol: Administrador');
      console.log('\n💡 Ahora puedes hacer login con estas credenciales.');
    } else {
      const error = await response.text();
      console.log('❌ Error al actualizar usuario:', error);
      
      // Intentar con método PUT para actualizar
      console.log('\n🔄 Intentando actualizar usuario existente...');
      const updateResponse = await fetch('http://localhost:3000/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      if (updateResponse.ok) {
        console.log('✅ USUARIO ACTUALIZADO CORRECTAMENTE (PUT)');
        console.log('==========================================');
        console.log('📧 Email: directores@dynamicfin.mx');
        console.log('🔑 Password: admin123');
        console.log('🎭 Rol: Administrador');
      } else {
        const updateError = await updateResponse.text();
        console.log('❌ Error al actualizar (PUT):', updateError);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
    
    console.log('\n💡 SOLUCIÓN ALTERNATIVA:');
    console.log('=========================');
    console.log('Prueba con estas otras credenciales que deben funcionar:');
    console.log('\n🔐 Admin: admin@test.com / 123456');
    console.log('💼 Ventas: ventas@test.com / 123456'); 
    console.log('👤 General: general@test.com / 123456');
    
    console.log('\n🔧 O reinicia la aplicación con:');
    console.log('yarn dev');
  }
}

fixDirectorCredentials();
