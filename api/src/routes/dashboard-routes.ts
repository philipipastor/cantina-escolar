import { Router } from "express"
import { Role } from "@prisma/client"
import { DashboardController } from "../controllers/dashboard-controller"
import { authorize } from "../middlewares/authorize"
import { ensureAuthenticated } from "../middlewares/ensure-authenticated"

export const dashboardRoutes = Router()
const controller = new DashboardController()

dashboardRoutes.get("/", ensureAuthenticated, authorize(Role.ADMIN), controller.overview)
