import "express-async-errors"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import { env } from "./configs/env"
import { routes } from "./routes"
import { errorHandler } from "./middlewares/error-handler"

export const app = express()

app.set("trust proxy", env.TRUST_PROXY)
app.use(helmet())
app.use(cors({ origin: env.WEB_ORIGIN }))
app.use(express.json({ limit: "100kb" }))
app.get("/health", (_request, response) => response.json({ status: "ok" }))
app.use(routes)
app.use((_request, response) => response.status(404).json({ message: "Rota não encontrada" }))
app.use(errorHandler)
