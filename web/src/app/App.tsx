import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { AppLayout } from "../components/layout/AppLayout"
import { OfflineScreen } from "../components/layout/OfflineScreen"
import { AuthProvider } from "../features/auth/AuthContext"
import { ChangePasswordPage } from "../features/auth/pages/ChangePasswordPage"
import { LoginPage } from "../features/auth/pages/LoginPage"
import { CanteenGate } from "../features/canteens/CanteenContext"
import { CanteensPage } from "../features/canteens/pages/CanteensPage"
import { ClientReportPage } from "../features/clients/pages/ClientReportPage"
import { ClientsPage } from "../features/clients/pages/ClientsPage"
import { EditClientPage } from "../features/clients/pages/EditClientPage"
import { NewClientPage } from "../features/clients/pages/NewClientPage"
import { EditProductPage } from "../features/products/pages/EditProductPage"
import { NewProductPage } from "../features/products/pages/NewProductPage"
import { ProductsPage } from "../features/products/pages/ProductsPage"
import { NewSalePage } from "../features/sales/pages/NewSalePage"
import { SaleConfirmedPage } from "../features/sales/pages/SaleConfirmedPage"
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
              <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
                <Route path="/empresas" element={<CanteensPage />} />
              </Route>
              <Route element={<CanteenGate />}>
                <Route path="/produtos" element={<ProductsPage />} />
                <Route path="/produtos/novo" element={<NewProductPage />} />
                <Route path="/produtos/:id/editar" element={<EditProductPage />} />
                <Route path="/clientes" element={<ClientsPage />} />
                <Route path="/clientes/novo" element={<NewClientPage />} />
                <Route path="/clientes/:id" element={<ClientReportPage />} />
                <Route path="/clientes/:id/editar" element={<EditClientPage />} />
                <Route path="/venda" element={<NewSalePage />} />
                <Route path="/venda/confirmada" element={<SaleConfirmedPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
