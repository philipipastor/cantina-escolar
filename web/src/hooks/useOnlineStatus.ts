import { useSyncExternalStore } from "react"

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

// Diz se o navegador está conectado e atualiza a tela sozinho quando a conexão cai ou volta.
export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, () => navigator.onLine)
}
