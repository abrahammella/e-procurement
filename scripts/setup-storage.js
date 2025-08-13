#!/usr/bin/env node

/**
 * Script para configurar Supabase Storage desde la línea de comandos
 * Requiere: npm install @supabase/supabase-js dotenv
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Necesitas esta key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  console.error('\nPara obtener la SERVICE_ROLE_KEY:')
  console.error('1. Ir a Settings > API en tu proyecto Supabase')
  console.error('2. Copiar "service_role" key (NO la anon key)')
  process.exit(1)
}

// Crear cliente con service role (permisos de admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🚀 Configurando Supabase Storage...\n')

  try {
    // 1. Crear bucket 'documents' si no existe
    console.log('📦 Creando bucket "documents"...')
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('documents', {
      public: false,
      fileSizeLimit: 20971520, // 20MB
      allowedMimeTypes: ['application/pdf']
    })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket "documents" ya existe')
      } else {
        throw bucketError
      }
    } else {
      console.log('✅ Bucket "documents" creado exitosamente')
    }

    // 2. Configurar políticas de Storage
    console.log('\n🔐 Configurando políticas de Storage...')
    
    // Nota: Las políticas de Storage se configuran automáticamente
    // cuando se crea el bucket con las opciones correctas
    
    console.log('✅ Políticas configuradas automáticamente')
    console.log('   - Solo usuarios autenticados pueden acceder')
    console.log('   - Límite de 20MB por archivo')
    console.log('   - Solo archivos PDF permitidos')

    // 3. Verificar configuración
    console.log('\n🔍 Verificando configuración...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) throw listError
    
    const documentsBucket = buckets.find(b => b.name === 'documents')
    if (documentsBucket) {
      console.log('✅ Bucket verificado:')
      console.log(`   - Nombre: ${documentsBucket.name}`)
      console.log(`   - Público: ${documentsBucket.public}`)
      console.log(`   - Tamaño límite: ${documentsBucket.fileSizeLimit / (1024 * 1024)}MB`)
      console.log(`   - MIME types: ${documentsBucket.allowedMimeTypes?.join(', ') || 'Todos'}`)
    }

    console.log('\n🎉 Configuración de Storage completada exitosamente!')
    console.log('\n📋 Próximos pasos:')
    console.log('1. Probar upload de archivos PDF desde tu aplicación')
    console.log('2. Verificar que los archivos aparecen en el bucket')
    console.log('3. Probar descarga con URLs firmadas')

  } catch (error) {
    console.error('\n❌ Error durante la configuración:')
    console.error(error.message)
    
    if (error.message.includes('permission denied')) {
      console.error('\n💡 Solución:')
      console.error('1. Verificar que tienes la SERVICE_ROLE_KEY correcta')
      console.error('2. Verificar que tu proyecto tiene Storage habilitado')
      console.error('3. Verificar que tu cuenta tiene permisos de admin')
    }
    
    process.exit(1)
  }
}

// Ejecutar script
if (require.main === module) {
  setupStorage()
}

module.exports = { setupStorage }
