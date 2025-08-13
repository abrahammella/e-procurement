# Supabase Migrations

Este directorio contiene las migraciones de base de datos para el sistema E-Procurement.

## Migraciones Disponibles

### 20250813_core.sql
**Fecha**: 13 de Agosto, 2025  
**Descripción**: Esquema base del sistema E-Procurement

#### Tablas Creadas:
1. **suppliers** - Proveedores del sistema
2. **tenders** - Concursos y licitaciones
3. **rfp_docs** - Documentos RFP y metadatos
4. **proposals** - Propuestas de proveedores
5. **approvals** - Sistema de aprobaciones por comités
6. **service_orders** - Órdenes de servicio/PO
7. **invoices** - Facturas de proveedores
8. **events** - Log de auditoría del sistema

#### Características:
- **Row Level Security (RLS)** habilitado en todas las tablas
- **Políticas de seguridad** por rol (admin/supplier)
- **Referencias entre tablas** con integridad referencial
- **Índices optimizados** para consultas frecuentes
- **Campos JSONB** para metadatos flexibles
- **Timestamps automáticos** para auditoría

#### Extensiones Requeridas:
- `uuid-ossp` - Generación de UUIDs
- `pgcrypto` - Funciones criptográficas

## Cómo Aplicar las Migraciones

### Opción 1: SQL Editor de Supabase
1. Ir al SQL Editor en tu proyecto de Supabase
2. Copiar y pegar el contenido del archivo de migración
3. Ejecutar el script completo

### Opción 2: Supabase CLI
```bash
# Si tienes Supabase CLI instalado
supabase db push
```

### Opción 3: Migración Manual
```bash
# Conectar a tu base de datos PostgreSQL
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# Ejecutar la migración
\i supabase/migrations/20250813_core.sql
```

## Verificación Post-Migración

Después de aplicar la migración, verifica que:

1. **Todas las tablas se crearon correctamente**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

2. **Las políticas RLS están activas**:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

3. **Los índices se crearon**:
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

## Notas Importantes

- **Esta migración asume** que la tabla `profiles` ya existe
- **Las políticas RLS** están configuradas para usuarios autenticados
- **Los roles de usuario** deben estar en `profiles.role`
- **El campo `supplier_id`** en profiles debe referenciar a `suppliers.id`

## Próximos Pasos

Después de aplicar esta migración:
1. **Crear datos de prueba** para las tablas principales
2. **Configurar Supabase Storage** para archivos PDF
3. **Implementar la lógica de negocio** en el frontend
4. **Configurar webhooks** para n8n (futuro)

## Soporte

Si encuentras problemas con la migración:
1. Verificar que tienes permisos de administrador en la base de datos
2. Revisar los logs de Supabase para errores específicos
3. Verificar que las extensiones están disponibles en tu instancia
