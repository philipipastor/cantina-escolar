import { Router } from "express"
import { Role } from "@prisma/client"
import { UsersController } from "../controllers/users-controller"
import { authorize } from "../middlewares/authorize"
import { ensureAuthenticated } from "../middlewares/ensure-authenticated"

export const usersRoutes = Router()
const controller = new UsersController()

usersRoutes.use(ensureAuthenticated)
usersRoutes.get("/me", controller.showMe)
usersRoutes.patch("/me/password", controller.changeMyPassword)

usersRoutes.use(authorize(Role.ADMIN))
usersRoutes.get("/", controller.index)
usersRoutes.post("/", controller.create)
usersRoutes.patch("/:id", controller.update)
usersRoutes.patch("/:id/password", controller.resetPassword)
