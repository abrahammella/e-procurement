'use client'

import { AuthenticatedRouteGuard } from '@/components/auth/RouteGuard'
import { StorageTest } from '@/components/examples/StorageTest'

function StorageTestPageContent() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Prueba de Supabase Storage</h1>
          <p className="text-gray-600 mt-2">
            Prueba las funciones de upload, generación de URLs firmadas y gestión de archivos PDF
          </p>
        </div>
        
        <StorageTest />
      </div>
    </div>
  )
}

export default function StorageTestPage() {
  return (
    <AuthenticatedRouteGuard>
      <StorageTestPageContent />
    </AuthenticatedRouteGuard>
  )
}