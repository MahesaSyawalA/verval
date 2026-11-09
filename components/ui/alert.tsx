"use client";

import {
  Toast,
  ToastActionButton,
  ToastCloseButton,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastProvider as HeroToastProvider,
  ToastQueue,
  ToastTitle,
  toast,
  toastQueue,
  type ToastVariants,
} from "@heroui/react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  type ComponentProps,
  type ReactNode,
} from "react";

export type AlertStatus = "success" | "warning" | "info" | "error" | "danger";
export type AlertPlacement = NonNullable<ToastVariants["placement"]>;

if (
  typeof globalThis !== "undefined" &&
  typeof globalThis.ResizeObserver === "undefined"
) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const AlertToastProviderContext = createContext(false);

export type AlertToastProviderProps = ComponentProps<typeof HeroToastProvider>;

/**
 * Provider Toast HeroUI dengan posisi default `"top end"` (kanan atas).
 */
export function AlertToastProvider({
  placement = "top end",
  children,
  ...rest
}: AlertToastProviderProps & { children?: ReactNode }) {
  return (
    <AlertToastProviderContext.Provider value={true}>
      {children}
      <HeroToastProvider placement={placement} {...rest} />
    </AlertToastProviderContext.Provider>
  );
}

export interface AlertToastOptions {
  description?: ReactNode;
  indicator?: ReactNode;
  timeout?: number;
  onClose?: () => void;
}

/**
 * Helper imperatif berbasis `toast` bawaan HeroUI untuk menampilkan notifikasi
 * `success`, `warning`, `info`, dan `error` pada `ToastProvider` (`top end`).
 */
export const alertToast = {
  success: (title: ReactNode, options?: AlertToastOptions) =>
    toast.success(title, options),
  warning: (title: ReactNode, options?: AlertToastOptions) =>
    toast.warning(title, options),
  info: (title: ReactNode, options?: AlertToastOptions) =>
    toast.info(title, options),
  error: (title: ReactNode, options?: AlertToastOptions) =>
    toast.danger(title, options),
  danger: (title: ReactNode, options?: AlertToastOptions) =>
    toast.danger(title, options),
  close: (key: string) => toast.close(key),
  clear: () => toast.clear(),
};

export interface AlertProps {
  /** Status notifikasi toast: success, warning, info, atau error. */
  status?: AlertStatus;
  /** Posisi toast HeroUI (default: `"top end"`). */
  placement?: AlertPlacement;
  /** Judul utama toast. */
  title?: ReactNode;
  /** Deskripsi tambahan di bawah judul. */
  description?: ReactNode;
  /** Isi notifikasi (dipakai sebagai judul bila `title` tidak diisi, atau deskripsi bila `title` diisi). */
  children?: ReactNode;
  /** Ikon opsional; secara default memakai ikon bawaan HeroUI `ToastIndicator`. */
  icon?: ReactNode;
  /** Durasi tampil dalam milidetik (`0` = tetap tampil selama komponen terpasang). */
  timeout?: number;
  /** Class tambahan untuk `ToastProvider` fallback bila dirender tanpa provider global. */
  className?: string;
  /** Role aksesibilitas (kompatibilitas prop). */
  role?: string;
}

function closeToastImmediately(key: string) {
  const underlyingQueue = toast.getQueue() as unknown as {
    exitDuration?: number;
    close: (k: string) => void;
  };
  const previousExitDuration = underlyingQueue.exitDuration;
  underlyingQueue.exitDuration = 0;
  try {
    toast.close(key);
  } finally {
    underlyingQueue.exitDuration = previousExitDuration;
  }
}

/**
 * Komponen Alert berbasis HeroUI `Toast` (`placement="top end"`) untuk
 * notifikasi status `success`, `warning`, `info`, dan `error`.
 */
export function Alert({
  status = "info",
  placement = "top end",
  title,
  description,
  children,
  icon,
  timeout = 0,
  className,
}: AlertProps) {
  const hasGlobalProvider = useContext(AlertToastProviderContext);
  const headingContent = title ?? children;
  const bodyContent =
    description ?? (title !== undefined ? children : undefined);

  useLayoutEffect(() => {
    if (
      (headingContent === undefined || headingContent === null || headingContent === "") &&
      (bodyContent === undefined || bodyContent === null || bodyContent === "")
    ) {
      return;
    }

    const message = headingContent ?? bodyContent ?? "";
    const options: AlertToastOptions = {
      description: headingContent !== undefined && headingContent !== null ? bodyContent : undefined,
      indicator: icon,
      timeout,
    };

    let key: string;
    switch (status) {
      case "success":
        key = alertToast.success(message, options);
        break;
      case "warning":
        key = alertToast.warning(message, options);
        break;
      case "error":
      case "danger":
        key = alertToast.error(message, options);
        break;
      case "info":
      default:
        key = alertToast.info(message, options);
        break;
    }

    return () => {
      closeToastImmediately(key);
    };
  }, [status, headingContent, bodyContent, icon, timeout]);

  if (hasGlobalProvider) {
    return null;
  }

  return <HeroToastProvider placement={placement} className={className} />;
}

export {
  Toast,
  ToastActionButton,
  ToastCloseButton,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  HeroToastProvider as ToastProvider,
  ToastQueue,
  ToastTitle,
  toast,
  toastQueue,
};
