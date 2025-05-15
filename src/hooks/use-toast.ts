
// Hooks
import * as React from "react"
import { toast as sonnerToast } from "sonner"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive" | "success"
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastState: State = { toasts: [] }

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function dispatch(action: Action) {
  switch (action.type) {
    case "ADD_TOAST":
      toastState.toasts = [action.toast, ...toastState.toasts].slice(0, TOAST_LIMIT)
      break;
      
    case "UPDATE_TOAST":
      toastState.toasts = toastState.toasts.map((t) =>
        t.id === action.toast.id ? { ...t, ...action.toast } : t
      )
      break;
      
    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        toastState.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      toastState.toasts = toastState.toasts.map((t) =>
        t.id === toastId || toastId === undefined
          ? {
              ...t,
              open: false,
            }
          : t
      )
      break;
    }
    
    case "REMOVE_TOAST": {
      const { toastId } = action

      if (toastId === undefined) {
        toastState.toasts = []
      } else {
        toastState.toasts = toastState.toasts.filter((t) => t.id !== toastId)
      }
      break;
    }
  }
}

function toast({
  variant = "default",
  ...props
}: Omit<ToasterToast, "id"> & {
  variant?: "default" | "destructive" | "success";
}) {
  const id = genId()
  const toastOptions = { id, variant, ...props }
  
  // Use sonner toast
  sonnerToast(props.title as string, {
    id,
    description: props.description,
    action: props.action,
    ...props,
  })

  dispatch({
    type: "ADD_TOAST",
    toast: toastOptions,
  })

  return id
}

function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([])
  
  React.useEffect(() => {
    // Create a function to update the state
    const updateState = () => {
      setToasts([...toastState.toasts])
    }
    
    // Initial update
    updateState()
    
    // Create a mutation observer to watch for changes to toastState.toasts
    const interval = setInterval(updateState, 100)
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval)
  }, [])

  return {
    toast,
    toasts,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast, type ToasterToast }
