import { useState } from "react";

export function useToast(durationMs = 3000) {
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), durationMs);
  };

  return { toastMessage, showToast };
}