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
import { DailySalesPage } from "../features/daily-sales/pages/DailySalesPage"
import { DashboardPage } from "../features/dashboard/pages/DashboardPage"
import { EntryDetailsPage } from "../features/entries/pages/EntryDetailsPage"
import { EditClientPage } from "../features/clients/pages/EditClientPage"
import { NewClientPage } from "../features/clients/pages/NewClientPage"
import { PaymentConfirmedPage } from "../features/payments/pages/PaymentConfirmedPage"
import { ReceivePaymentPage } from "../features/payments/pages/ReceivePaymentPage"
import { RefundCreditPage } from "../features/payments/pages/RefundCreditPage"
import { EditProductPage } from "../features/products/pages/EditProductPage"
import { NewProductPage } from "../features/products/pages/NewProductPage"
import { ProductsPage } from "../features/products/pages/ProductsPage"
import { NewSalePage } from "../features/sales/pages/NewSalePage"
import { SaleConfirmedPage } from "../features/sales/pages/SaleConfirmedPage"
import { useOnlineStatus } from "../hooks/useOnlineStatus"
import { ProtectedRoute } from "./ProtectedRoute"

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
              <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
                <Route path="/empresas" element={<CanteensPage />} />
              </Route>
              <Route element={<CanteenGate />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/clientes" element={<ClientsPage />} />
                <Route path="/clientes/novo" element={<NewClientPage />} />
                <Route path="/clientes/:id" element={<ClientReportPage />} />
                <Route path="/clientes/:id/editar" element={<EditClientPage />} />
                <Route path="/clientes/:id/devolver-credito" element={<RefundCreditPage />} />
                <Route path="/pagamento" element={<ReceivePaymentPage />} />
                <Route path="/pagamento/confirmado" element={<PaymentConfirmedPage />} />
                <Route path="/produtos" element={<ProductsPage />} />
                <Route path="/produtos/novo" element={<NewProductPage />} />
                <Route path="/produtos/:id/editar" element={<EditProductPage />} />
                <Route path="/venda" element={<NewSalePage />} />
                <Route path="/venda/confirmada" element={<SaleConfirmedPage />} />
                <Route path="/lancamentos/:id" element={<EntryDetailsPage />} />
                <Route path="/vendas-do-dia" element={<DailySalesPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
