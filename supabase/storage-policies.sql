-- ========= SUPABASE STORAGE POLICIES =========
-- Ejecutar este script en el SQL Editor de Supabase después de crear el bucket 'documents'

-- 1. Crear el bucket 'documents' si no existe
-- Nota: Esto se debe hacer desde el Dashboard de Supabase Storage
-- Nombre del bucket: 'documents'
-- Público: false (privado)
-- File size limit: 20MB
-- Allowed MIME types: application/pdf

-- 2. Políticas para el bucket 'documents'

-- Política de lectura: usuarios autenticados pueden leer archivos
CREATE POLICY "documents_select_auth" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserción: usuarios autenticados pueden subir archivos
CREATE POLICY "documents_insert_auth" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización: solo el propietario puede actualizar
CREATE POLICY "documents_update_owner" ON storage.objects
FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Política de eliminación: solo el propietario puede eliminar
CREATE POLICY "documents_delete_owner" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Función helper para obtener el propietario del archivo
CREATE OR REPLACE FUNCTION storage.get_file_owner(file_path text)
RETURNS uuid AS $$
BEGIN
  -- Extraer el ID del usuario del path del archivo
  -- Formato esperado: 'rfps/1234567890-nombre.pdf' -> extraer 'rfps'
  RETURN (string_to_array(file_path, '/'))[1]::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Política alternativa usando la función helper (opcional)
-- CREATE POLICY "documents_owner_access" ON storage.objects
-- FOR ALL USING (
--   auth.uid() = storage.get_file_owner(name)
-- );

-- 5. Verificar que las políticas están activas
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies 
-- WHERE tablename = 'objects' 
-- AND schemaname = 'storage'
-- ORDER BY policyname;
