import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Garante que o id nunca é undefined ou vazio e é sempre uma string para evitar erros
        const safeId = id ? id.toString() : `toast-${Date.now()}-${Math.random()}`
        
        // Garante uma duração padrão se não fornecida
        const toastProps = {
          ...props,
          duration: props.duration || 5000 // 5 segundos por padrão
        };
        
        // Converter descrição para string se for um objeto
        const safeDescription = description ? 
          (typeof description === 'string' ? description : JSON.stringify(description)) : 
          '';
        
        return (
          <Toast key={safeId} {...toastProps}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {safeDescription && (
                <ToastDescription>{safeDescription}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
