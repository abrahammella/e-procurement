# 🔗 Integración con N8N Webhook

## Descripción General

La plataforma E-Procurement envía webhooks a N8N cuando se crean tenders o se suben documentos RFP/PDF. Esto permite iniciar flujos de trabajo automatizados para evaluación con IA.

## 🎯 Implementación Actual

### 1. **Webhook desde la Plataforma (NO desde trigger SQL)**

La decisión fue implementar el webhook desde la API de la plataforma por las siguientes ventajas:
- ✅ Control total del timing
- ✅ Mejor manejo de errores
- ✅ URLs completas del PDF disponibles
- ✅ Logs accesibles
- ✅ Reintentos posibles

### 2. **Eventos que Disparan Webhooks**

#### a) **Creación de Tender**
- **Cuándo**: Al crear exitosamente un tender
- **Endpoint**: `POST /api/tenders`
- **Evento**: `tender_created`

#### b) **Subida de RFP/PDF**
- **Cuándo**: Al actualizar el `rfp_path` de un tender
- **Endpoint**: `PATCH /api/tenders`
- **Evento**: `rfp_uploaded`

## 📦 Estructura del Payload

### Tender Created
```json
{
  "event_type": "tender_created",
  "timestamp": "2025-01-15T10:30:00Z",
  "source": "e-procurement-platform",
  "tender": {
    "id": "uuid",
    "code": "LICIT-2025-001",
    "title": "Compra de Equipos",
    "description": "...",
    "budget_rd": 100000,
    "delivery_max_months": 3,
    "deadline": "2025-02-15",
    "status": "abierta",
    "created_by": "user-uuid",
    "created_at": "2025-01-15T10:30:00Z",
    
    // URLs del RFP (si existe)
    "rfp_path": "rfps/1234567890-document.pdf",
    "rfp_url": "https://vcunfajrzelmjpqxdckk.supabase.co/storage/v1/object/public/docs/rfps/1234567890-document.pdf",
    "rfp_download_url": "https://vcunfajrzelmjpqxdckk.supabase.co/storage/v1/object/public/docs/rfps/1234567890-document.pdf",
    "rfp_direct_link": "https://vcunfajrzelmjpqxdckk.supabase.co/storage/v1/object/public/docs/rfps/1234567890-document.pdf",
    
    // URLs adicionales
    "platform_url": "http://localhost:3000/tenders/uuid",
    "api_url": "http://localhost:3000/api/tenders/uuid"
  },
  "metadata": {
    "has_rfp": true,
    "environment": "development",
    "webhook_version": "2.0"
  }
}
```

### RFP Uploaded
```json
{
  "event_type": "rfp_uploaded",
  "timestamp": "2025-01-15T10:35:00Z",
  "source": "e-procurement-platform",
  "tender_id": "uuid",
  "rfp": {
    "path": "rfps/1234567890-document.pdf",
    "url": "https://vcunfajrzelmjpqxdckk.supabase.co/storage/v1/object/public/docs/rfps/1234567890-document.pdf",
    "download_url": "https://...?download=true",
    "uploaded_at": "2025-01-15T10:35:00Z"
  },
  "tender": {
    // Datos completos del tender
  }
}
```

## 🔧 Headers HTTP

```
Content-Type: application/json
User-Agent: E-Procurement/2.0
X-Tender-ID: uuid
X-Tender-Code: LICIT-2025-001
X-Event-Type: tender_created | rfp_uploaded
```

## 🚀 Configuración en N8N

### 1. **Webhook URL**
```
https://apps.n8n.tevolv.com/webhook/bb9eb21a-d715-4189-9901-788bf44963c9
```

### 2. **Workflow Sugerido**

1. **Webhook Trigger** - Recibe el payload
2. **Set Variables** - Extrae tender ID, RFP URL
3. **HTTP Request** - Descarga el PDF usando la URL
4. **AI Node** - Procesa el PDF con IA
5. **Database Update** - Actualiza evaluación en Supabase
6. **Email/Notification** - Notifica resultados

### 3. **Ejemplo de Procesamiento en N8N**

```javascript
// Extraer URL del PDF
const rfpUrl = $json.tender.rfp_url;
const tenderId = $json.tender.id;

// Descargar PDF
// Procesar con IA
// Guardar resultados
```

## 🐛 Debugging

### Logs en la Plataforma
```bash
# Ver logs del servidor Next.js
npm run dev

# Buscar:
"Sending webhook to N8N:"
"N8N webhook sent successfully"
"Failed to send N8N webhook:"
```

### Verificar en Base de Datos
```sql
-- Ver eventos de webhook
SELECT * FROM events 
WHERE event IN ('webhook_sent', 'webhook_failed')
ORDER BY created_at DESC;

-- Ver tenders recientes con RFP
SELECT id, code, title, rfp_path, created_at 
FROM tenders 
WHERE rfp_path IS NOT NULL
ORDER BY created_at DESC;
```

## 🔄 Reintentos

Si el webhook falla:
1. Se registra en la tabla `events`
2. No se reintenta automáticamente
3. Puede implementarse un job de reintentos

## 🛡️ Seguridad

- Webhook se envía solo por HTTPS
- No incluye información sensible
- URLs de PDF son públicas (bucket público)
- Para PDFs privados, usar signed URLs

## 📝 Notas Importantes

1. **El webhook NO bloquea** la creación del tender
2. **Se ejecuta en background** (no afecta UX)
3. **Si falla**, el tender se crea igual
4. **URLs del PDF** son públicas por diseño
5. **Timing**: ~1-2 segundos después de crear/actualizar

## 🚨 Troubleshooting

### Webhook no llega a N8N
1. Verificar URL correcta
2. Revisar logs del servidor
3. Probar con curl manual
4. Verificar firewall/CORS

### PDF URL no funciona
1. Verificar que el archivo existe en Storage
2. Confirmar que el bucket es público
3. Probar URL directamente en browser

### Payload incompleto
1. Verificar que se incluye rfp_path
2. Revisar estructura en `n8n-webhook.ts`
3. Logs para debug del payload

---

**Última actualización**: Enero 2025
**Versión**: 2.0