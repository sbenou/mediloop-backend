
import { toast as sonnerToast, type Toast, type ToasterToast } from "sonner";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToastProps = Toast & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
};

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToastProps;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToastProps>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToastProps["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToastProps["id"];
    };

interface State {
  toasts: ToastProps[];
}

const toastState: State = { toasts: [] };

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

function dispatch(action: Action) {
  switch (action.type) {
    case "ADD_TOAST":
      toastState.toasts = [action.toast, ...toastState.toasts].slice(0, TOAST_LIMIT);
      break;
      
    case "UPDATE_TOAST":
      toastState.toasts = toastState.toasts.map((t) =>
        t.id === action.toast.id ? { ...t, ...action.toast } : t
      );
      break;
      
    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        toastState.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      toastState.toasts = toastState.toasts.map((t) =>
        t.id === toastId || toastId === undefined
          ? {
              ...t,
              open: false,
            }
          : t
      );
      break;
    }
    
    case "REMOVE_TOAST": {
      const { toastId } = action;

      if (toastId === undefined) {
        toastState.toasts = [];
      } else {
        toastState.toasts = toastState.toasts.filter((t) => t.id !== toastId);
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
  const id = genId();
  const toastOptions = { id, variant, ...props };
  
  // Use sonner toast
  sonnerToast(props.title as string, {
    id,
    description: props.description,
    action: props.action,
    ...props,
  });

  dispatch({
    type: "ADD_TOAST",
    toast: toastOptions,
  });

  return id;
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
