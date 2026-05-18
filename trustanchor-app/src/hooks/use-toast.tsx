import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"

type Variant = "success" | "error"

interface Toast {
  id: number
  message: string
  variant: Variant
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (opts: { message: string; variant?: Variant }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    ({
      message,
      variant = "error",
    }: {
      message: string
      variant?: Variant
    }) => {
      const id = ++nextId
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
    </ToastContext.Provider>
  )
}

//eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
