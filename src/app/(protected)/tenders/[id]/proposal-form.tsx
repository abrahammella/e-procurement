'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2, Upload, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'

// Zod schema for form validation (string inputs)
const proposalFormInputSchema = z.object({
  amount_rd: z.string().min(1, 'El monto es requerido'),
  delivery_months: z.string().min(1, 'Los meses de entrega son requeridos'),
})

// Zod schema para transformar a números
const proposalFormSchema = z.object({
  amount_rd: z.string()
    .min(1, 'El monto es requerido')
    .transform((val) => parseFloat(val.replace(/,/g, '')))
    .refine((val) => !isNaN(val) && val > 0, 'El monto debe ser mayor a 0'),
  delivery_months: z.string()
    .min(1, 'Los meses de entrega son requeridos')
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val) && val > 0 && Number.isInteger(val), 'Debe ser un número entero positivo'),
})

type ProposalFormInput = z.infer<typeof proposalFormInputSchema>
type ProposalFormValues = z.infer<typeof proposalFormSchema>

interface ProposalFormProps {
  tenderId: string
}

export default function ProposalForm({ tenderId }: ProposalFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<ProposalFormInput>({
    resolver: zodResolver(proposalFormInputSchema),
    defaultValues: {
      amount_rd: '',
      delivery_months: '',
    },
  })

  // Formatear moneda mientras se escribe
  const formatCurrency = (value: string) => {
    // Remover todo excepto números
    const numbers = value.replace(/[^\d]/g, '')
    
    if (numbers === '') return ''
    
    // Formatear con comas
    return new Intl.NumberFormat('en-US').format(parseInt(numbers))
  }

  // Manejar envío del formulario
  async function onSubmit(values: ProposalFormInput) {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un archivo PDF',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      // Transform the values using the schema
      const transformedValues = proposalFormSchema.parse(values)

      // Crear FormData para envío multipart
      const formData = new FormData()
      formData.append('tender_id', tenderId)
      formData.append('amount_rd', transformedValues.amount_rd.toString())
      formData.append('delivery_months', transformedValues.delivery_months.toString())
      formData.append('file', selectedFile)

      const response = await fetch('/api/proposals', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar propuesta')
      }

      toast({
        title: 'Propuesta enviada',
        description: 'Tu propuesta ha sido enviada exitosamente',
      })

      // Cerrar dialog y resetear formulario
      setIsOpen(false)
      form.reset()
      setSelectedFile(null)
      
      // Refrescar la página para mostrar el estado actualizado
      router.refresh()

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al enviar propuesta',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos PDF',
        variant: 'destructive',
      })
      event.target.value = ''
      return
    }

    // Validar tamaño (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'El archivo no puede exceder 20MB',
        variant: 'destructive',
      })
      event.target.value = ''
      return
    }

    setSelectedFile(file)
  }

  // Manejar cierre del dialog
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset form cuando se cierra
      form.reset()
      setSelectedFile(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Send className="mr-2 h-4 w-4" />
          Postular
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Propuesta</DialogTitle>
          <DialogDescription>
            Completa los datos de tu propuesta para esta licitación
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount_rd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto de la Propuesta (RD$)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="1,000,000"
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value)
                        field.onChange(formatted)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delivery_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiempo de Entrega (meses)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="6"
                      min="1"
                      step="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="proposal-file">Documento de Propuesta (PDF)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="proposal-file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Solo archivos PDF, máximo 20MB
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !selectedFile}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Propuesta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}