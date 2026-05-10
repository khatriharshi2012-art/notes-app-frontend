import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeedbackContext } from "./FeedbackContext";

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div>
            <p className="toast-title">{toast.title}</p>
            {toast.message ? <p className="toast-message">{toast.message}</p> : null}
          </div>

          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ options, onClose }) {
  if (!options) {
    return null;
  }

  const {
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    tone = "danger",
    onConfirm,
  } = options;

  return (
    <div className="overlay-shell" role="presentation">
      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="dialog-icon">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>

        <h3 id="confirm-title">{title}</h3>
        <p>{message}</p>

        <div className="dialog-actions">
          <button type="button" className="button button-secondary " onClick={() => onClose(false)}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button button-${tone} btn-red`}
            onClick={() => {
              onConfirm?.();
              onClose(true);
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolverRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message = "", type = "info", duration = 2800 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((prev) => [...prev, { id, title, message, type }]);

      if (duration > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast],
  );

  const confirm = useCallback((options) => {
    setConfirmState(options);

    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
    });
  }, []);

  const handleConfirmClose = useCallback((result) => {
    setConfirmState(null);
    confirmResolverRef.current?.(result);
    confirmResolverRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      confirmResolverRef.current?.(false);
      confirmResolverRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      confirm,
    }),
    [showToast, confirm],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog options={confirmState} onClose={handleConfirmClose} />
    </FeedbackContext.Provider>
  );
}
