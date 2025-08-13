import { AuthDebug } from '@/components/debug/AuthDebug'

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Página de Debug
          </h1>
          <p className="text-gray-600">
            Usa esta página para diagnosticar problemas de autenticación y redirección
          </p>
        </div>
        
        <AuthDebug />
        
        <div className="mt-8 text-center">
          <a 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Intentar ir al Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
