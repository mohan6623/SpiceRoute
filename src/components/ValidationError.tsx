import { AlertCircle } from 'lucide-react'

interface ValidationErrorProps {
  message?: string
}

export default function ValidationError({ message }: ValidationErrorProps) {
  if (!message) return null

  return (
    <p className="flex items-center gap-1 mt-1 text-xs text-error animate-fade-in" role="alert">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{message}</span>
    </p>
  )
}
