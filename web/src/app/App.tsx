import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { AppLayout } from "../components/layout/AppLayout"
import { OfflineScreen } from "../components/layout/OfflineScreen"
import { AuthProvider } from "../features/auth/AuthContext"
import { ChangePasswordPage } from "../features/auth/pages/ChangePasswordPage"
import { LoginPage } from "../features/auth/pages/LoginPage"
import { useOnlineStatus } from "../hooks/useOnlineStatus"
import { ProtectedRoute } from "./ProtectedRoute"
import { TemporaryHome } from "./TemporaryHome"

export function App() {
  const isOnline = useOnlineStatus()
  if (!isOnline) return <OfflineScreen />

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/trocar-senha" element={<ChangePasswordPage />} />
            <Route element={<AppLayout />}>
              {/* Tela inicial provisória até o Dashboard ficar pronto. */}
              <Route path="/" element={<TemporaryHome />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
