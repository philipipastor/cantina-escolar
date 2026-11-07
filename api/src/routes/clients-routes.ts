import { Router } from "express"
import { ClientsController } from "../controllers/clients-controller"

export const clientsRoutes = Router({ mergeParams: true })
const controller = new ClientsController()

clientsRoutes.get("/", controller.index)
clientsRoutes.post("/", controller.create)
clientsRoutes.get("/:id", controller.show)
clientsRoutes.patch("/:id", controller.update)
clientsRoutes.get("/:id/statement", controller.statement)
clientsRoutes.post("/:id/children", controller.createChild)
clientsRoutes.patch("/:id/children/:childId", controller.updateChild)
