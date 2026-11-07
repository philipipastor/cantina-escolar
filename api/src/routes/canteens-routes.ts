import { Router } from "express"
import { Role } from "@prisma/client"
import { CanteensController } from "../controllers/canteens-controller"
import { DashboardController } from "../controllers/dashboard-controller"
import { authorize } from "../middlewares/authorize"
import { ensureAuthenticated } from "../middlewares/ensure-authenticated"
import { ensureCanteenAccess } from "../middlewares/ensure-canteen-access"
import { clientsRoutes } from "./clients-routes"
import { entriesRoutes } from "./entries-routes"
import { productsRoutes } from "./products-routes"

export const canteensRoutes = Router()
const controller = new CanteensController()
const dashboard = new DashboardController()

canteensRoutes.use(ensureAuthenticated)
canteensRoutes.get("/", controller.index)
canteensRoutes.post("/", authorize(Role.ADMIN), controller.create)
canteensRoutes.patch("/:id", authorize(Role.ADMIN), controller.update)

// Tudo abaixo de /canteens/:canteenId é de uma unidade e passa pela checagem de acesso.
const canteenRoutes = Router({ mergeParams: true })
canteenRoutes.use(ensureCanteenAccess)
canteenRoutes.use("/clients", clientsRoutes)
canteenRoutes.use("/products", productsRoutes)
canteenRoutes.use(entriesRoutes)
canteenRoutes.get("/dashboard", dashboard.canteen)
canteenRoutes.get("/daily-review", dashboard.dailyReview)

canteensRoutes.use("/:canteenId", canteenRoutes)
