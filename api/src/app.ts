import "express-async-errors"
import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import { env } from "./configs/env"
import { routes } from "./routes"
import { errorHandler } from "./middlewares/error-handler"
import { requireAppHeader } from "./middlewares/require-app-header"

export const app = express()

app.set("trust proxy", env.TRUST_PROXY)
app.use(helmet())
// credentials: permite que o navegador envie o cookie de sessão, só para a origem das telas.
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: "100kb" }))
app.use(requireAppHeader)
app.get("/health", (_request, response) => response.json({ status: "ok" }))
app.use(routes)
app.use((_request, response) => response.status(404).json({ message: "Rota não encontrada" }))
app.use(errorHandler)
