import { Router } from "express"
import { rateLimit } from "express-rate-limit"
import { env } from "../configs/env"
import { SessionsController } from "../controllers/sessions-controller"

export const sessionsRoutes = Router()
const controller = new SessionsController()

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => env.NODE_ENV === "test",
  message: { message: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." },
})

sessionsRoutes.post("/", loginLimit, controller.create)
