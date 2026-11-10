import { Router } from "express"
import { ProductsController } from "../controllers/products-controller"

export const productsRoutes = Router({ mergeParams: true })
const controller = new ProductsController()

productsRoutes.get("/", controller.index)
productsRoutes.get("/:id", controller.show)
productsRoutes.post("/", controller.create)
productsRoutes.patch("/:id", controller.update)
