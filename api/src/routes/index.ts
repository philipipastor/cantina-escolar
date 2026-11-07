import { Router } from "express"
import { canteensRoutes } from "./canteens-routes"
import { dashboardRoutes } from "./dashboard-routes"
import { sessionsRoutes } from "./sessions-routes"
import { usersRoutes } from "./users-routes"

export const routes = Router()
routes.use("/sessions", sessionsRoutes)
routes.use("/users", usersRoutes)
routes.use("/dashboard", dashboardRoutes)
routes.use("/canteens", canteensRoutes)
