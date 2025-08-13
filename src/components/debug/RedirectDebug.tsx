'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function RedirectDebug() {
  const searchParams = useSearchParams()
  const [currentUrl, setCurrentUrl] = useState('')
  const [decodedRedirect, setDecodedRedirect] = useState('')
  const [isValidPath, setIsValidPath] = useState(false)

  useEffect(() => {
    setCurrentUrl(window.location.href)
    
    const redirectParam = searchParams.get('redirect')
    if (redirectParam) {
      try {
        const decoded = decodeURIComponent(redirectParam)
        setDecodedRedirect(decoded)
        setIsValidPath(decoded.startsWith('/') && !decoded.includes('..'))
      } catch (error) {
        console.error('Error decoding redirect:', error)
        setDecodedRedirect('ERROR_DECODING')
        setIsValidPath(false)
      }
    }
  }, [searchParams])

  const testRedirect = () => {
    const redirectParam = searchParams.get('redirect')
    if (redirectParam) {
      try {
        const decoded = decodeURIComponent(redirectParam)
        console.log('🚀 Testing redirect to:', decoded)
        window.location.href = decoded
      } catch (error) {
        console.error('❌ Error in test redirect:', error)
      }
    }
  }

  const checkUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const allParams = Object.fromEntries(urlParams)
    console.log('🔍 All URL parameters:', allParams)
    console.log('🔍 Redirect parameter:', urlParams.get('redirect'))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">🔍 Debug del Problema de Redirect</h1>
          <p className="text-xl text-gray-600 mt-2">
            Diagnóstico del problema: Login no respeta parámetro redirect
          </p>
        </div>

        {/* Current URL Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-blue-600" />
              Información de la URL Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">🌐 URL Completa:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {currentUrl || 'Cargando...'}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">🔍 Parámetros de Búsqueda:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {searchParams.toString() || 'Sin parámetros'}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Redirect Parameter Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Análisis del Parámetro Redirect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">📝 Parámetro Raw:</h3>
                <Badge variant="outline" className="text-sm">
                  {searchParams.get('redirect') || 'No encontrado'}
                </Badge>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">🔄 Parámetro Decodificado:</h3>
                <Badge variant={decodedRedirect ? "default" : "secondary"} className="text-sm">
                  {decodedRedirect || 'No aplicable'}
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">✅ Validación del Path:</h3>
              <Badge variant={isValidPath ? "default" : "destructive"}>
                {isValidPath ? 'Path Válido' : 'Path Inválido'}
              </Badge>
            </div>
            
            {decodedRedirect && (
              <div>
                <h3 className="font-medium mb-2">🔍 Análisis del Path:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Empieza con /:</span>
                    <Badge variant={decodedRedirect.startsWith('/') ? "default" : "destructive"}>
                      {decodedRedirect.startsWith('/') ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>No contiene ..:</span>
                    <Badge variant={!decodedRedirect.includes('..') ? "default" : "destructive"}>
                      {!decodedRedirect.includes('..') ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Longitud:</span>
                    <Badge variant="outline">{decodedRedirect.length} caracteres</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Testing Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              Acciones de Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={testRedirect} disabled={!decodedRedirect || !isValidPath}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Probar Redirect
              </Button>
              
              <Button onClick={checkUrlParams} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Parámetros
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Probar Redirect:</strong> Intenta navegar directamente al path decodificado</p>
              <p><strong>Verificar Parámetros:</strong> Muestra todos los parámetros en la consola</p>
            </div>
          </CardContent>
        </Card>

        {/* Manual Testing Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🧪 Instrucciones de Testing Manual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Test 1: Acceso Directo a Ruta Protegida</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Cerrar sesión (si estás autenticado)</li>
                <li>Ir directamente a <code className="bg-gray-100 px-1 rounded">/admin</code></li>
                <li>Verificar que redirige a <code className="bg-gray-100 px-1 rounded">/login?redirect=%2Fadmin</code></li>
                <li>Hacer login como admin</li>
                <li>Verificar si va a <code className="bg-gray-100 px-1 rounded">/admin</code> o vuelve al login</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Test 2: Verificar Logs en Consola</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Abrir DevTools del navegador</li>
                <li>Ir a la pestaña Console</li>
                <li>Hacer login y buscar logs de redirect</li>
                <li>Compartir cualquier error o log inesperado</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Última actualización: {new Date().toLocaleString()}</p>
          <p>Revisa la consola del navegador para logs detallados</p>
        </div>
      </div>
    </div>
  )
}
