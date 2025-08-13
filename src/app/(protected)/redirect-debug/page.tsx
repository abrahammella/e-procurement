'use client'

import { AuthenticatedRouteGuard } from '@/components/auth/RouteGuard'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Building2, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

function RedirectDebugPageContent() {
  const { user, profile, userRole, handlePostLoginRedirect } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testResults, setTestResults] = useState<any>({})

  useEffect(() => {
    // Collect debug information
    const info = {
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      searchParams: searchParams.toString(),
      redirectParam: searchParams.get('redirect'),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
      timestamp: new Date().toISOString()
    }
    setDebugInfo(info)
  }, [searchParams])

  const testRedirect = async (testPath: string) => {
    try {
      console.log(`🧪 Testing redirect for: ${testPath}`)
      const result = await handlePostLoginRedirect(testPath)
      setTestResults((prev: any) => ({
        ...prev,
        [testPath]: { success: true, redirectPath: result, timestamp: new Date().toISOString() }
      }))
      console.log(`✅ Test result for ${testPath}:`, result)
    } catch (error: any) {
      console.error(`❌ Test error for ${testPath}:`, error)
      setTestResults((prev: any) => ({
        ...prev,
        [testPath]: { success: false, error: error.message, timestamp: new Date().toISOString() }
      }))
    }
  }

  const runAllTests = async () => {
    console.log('🧪 Running all redirect tests...')
    await testRedirect('/admin')
    await testRedirect('/supplier')
    await testRedirect('/dashboard')
    await testRedirect('/nonexistent')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900">Debug de Redirección</h1>
          <p className="text-xl text-gray-600 mt-2">
            Página para probar y debuggear el sistema de redirección
          </p>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Email:</span>
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">ID:</span>
                <span className="text-gray-600 text-sm">{user?.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Estado:</span>
                <Badge variant="default">Autenticado</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Perfil del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Nombre:</span>
                <span className="text-gray-600">{profile?.full_name || 'No definido'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Rol:</span>
                <Badge variant="outline">{userRole || 'No definido'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Teléfono:</span>
                <span className="text-gray-600">{profile?.phone || 'No definido'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Información de Debug
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {Object.entries(debugInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span className="text-gray-600 break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Pruebas de Redirección
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => testRedirect('/admin')} variant="outline">
                Probar /admin
              </Button>
              <Button onClick={() => testRedirect('/supplier')} variant="outline">
                Probar /supplier
              </Button>
              <Button onClick={() => testRedirect('/dashboard')} variant="outline">
                Probar /dashboard
              </Button>
              <Button onClick={() => testRedirect('/nonexistent')} variant="outline">
                Probar /nonexistent
              </Button>
              <Button onClick={runAllTests} className="bg-blue-600 hover:bg-blue-700">
                Ejecutar Todas las Pruebas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Resultados de las Pruebas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(testResults).map(([testPath, result]: [string, any]) => (
                  <div key={testPath} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Prueba: {testPath}</span>
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {result.success ? (
                        <p>✅ Redirigiría a: <code className="bg-gray-100 px-2 py-1 rounded">{result.redirectPath}</code></p>
                      ) : (
                        <p>❌ Error: {result.error}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Timestamp: {result.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="text-center space-y-4">
          <Button onClick={() => router.push('/dashboard')} variant="outline" size="lg">
            Volver al Dashboard
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => router.push('/admin')} 
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Shield className="h-5 w-5 mr-2" />
              Panel de Admin
            </Button>
            
            <Button 
              onClick={() => router.push('/supplier')} 
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              <Building2 className="h-5 w-5 mr-2" />
              Panel de Supplier
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RedirectDebugPage() {
  return (
    <AuthenticatedRouteGuard>
      <RedirectDebugPageContent />
    </AuthenticatedRouteGuard>
  )
}
