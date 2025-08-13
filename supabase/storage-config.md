# Configuración de Supabase Storage

## 1. Crear el Bucket 'documents'

### Desde el Dashboard de Supabase:

1. **Ir a Storage** en tu proyecto
2. **Click en "New bucket"**
3. **Configurar:**
   - **Name**: `documents`
   - **Public bucket**: ❌ **NO** (debe ser privado)
   - **File size limit**: `20MB`
   - **Allowed MIME types**: `application/pdf`

### Configuración Recomendada:

```json
{
  "name": "documents",
  "public": false,
  "file_size_limit": 20971520,
  "allowed_mime_types": ["application/pdf"],
  "owner": "authenticated"
}
```

## 2. Estructura de Directorios

El bucket se organizará automáticamente en:

```
documents/
├── rfps/           # Documentos RFP
│   ├── 1691234567890-solicitud-licitacion.pdf
│   └── 1691234567891-rfp-servicios-ti.pdf
├── proposals/      # Propuestas de suppliers
│   ├── 1691234567892-propuesta-empresa-a.pdf
│   └── 1691234567893-propuesta-empresa-b.pdf
├── invoices/       # Facturas
│   ├── 1691234567894-factura-servicio-1.pdf
│   └── 1691234567895-factura-servicio-2.pdf
├── contracts/      # Contratos
│   ├── 1691234567896-contrato-servicio.pdf
│   └── 1691234567897-acuerdo-nivel-servicio.pdf
└── temp/           # Archivos temporales
    └── 1691234567898-documento-temp.pdf
```

## 3. Políticas de Seguridad

### Políticas Básicas (Recomendadas):

```sql
-- Usuarios autenticados pueden leer archivos
CREATE POLICY "documents_select_auth" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated');

-- Usuarios autenticados pueden subir archivos
CREATE POLICY "documents_insert_auth" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Solo el propietario puede actualizar
CREATE POLICY "documents_update_owner" ON storage.objects
FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Solo el propietario puede eliminar
CREATE POLICY "documents_delete_owner" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### Políticas Avanzadas (Opcionales):

```sql
-- Política por rol específico
CREATE POLICY "documents_admin_full_access" ON storage.objects
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Política por tipo de archivo
CREATE POLICY "documents_rfp_read_all" ON storage.objects
FOR SELECT USING (
  name LIKE 'rfps/%' AND auth.role() = 'authenticated'
);
```

## 4. Verificación de Configuración

### Verificar Bucket:

```sql
-- Verificar que el bucket existe
SELECT * FROM storage.buckets WHERE name = 'documents';

-- Verificar políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;
```

### Verificar Permisos:

```sql
-- Verificar que RLS está activo
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
```

## 5. Testing del Sistema

### Upload de Prueba:

1. **Crear archivo PDF de prueba** (< 1MB)
2. **Usar el componente FileUpload** con `keyPrefix="test"`
3. **Verificar en Dashboard** que aparece en `documents/test/`
4. **Probar descarga** con URL firmada

### Verificar Seguridad:

1. **Usuario no autenticado** no puede acceder
2. **Usuario autenticado** puede subir/descargar
3. **URLs firmadas** expiran correctamente
4. **Políticas RLS** funcionan como esperado

## 6. Monitoreo y Mantenimiento

### Métricas a Monitorear:

- **Uso de almacenamiento** por directorio
- **Archivos más grandes** (> 10MB)
- **Archivos antiguos** (> 30 días)
- **Errores de upload** frecuentes
- **Accesos no autorizados**

### Limpieza Automática:

```sql
-- Función para limpiar archivos temporales antiguos
CREATE OR REPLACE FUNCTION cleanup_temp_files()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE name LIKE 'temp/%' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar diariamente (cron job)
-- SELECT cleanup_temp_files();
```

## 7. Troubleshooting

### Problemas Comunes:

1. **"bucket not found"**
   - Verificar que el bucket `documents` existe
   - Verificar permisos del usuario

2. **"JWT expired"**
   - Verificar que el usuario está autenticado
   - Verificar que el token no ha expirado

3. **"file size too large"**
   - Verificar límite del bucket (20MB)
   - Verificar límite de la función (20MB)

4. **"permission denied"**
   - Verificar políticas RLS
   - Verificar rol del usuario
   - Verificar que las políticas están activas

### Logs Útiles:

```sql
-- Ver logs de storage
SELECT * FROM storage.objects 
WHERE name LIKE '%' 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver errores de políticas
SELECT * FROM pg_stat_user_tables 
WHERE schemaname = 'storage';
```

## 8. Próximos Pasos

1. ✅ **Crear bucket** `documents`
2. ✅ **Aplicar políticas** básicas
3. 🔄 **Probar upload** con archivos pequeños
4. 🔄 **Implementar UI** de gestión de archivos
5. 🔄 **Configurar limpieza** automática
6. 🔄 **Monitorear uso** y performance
