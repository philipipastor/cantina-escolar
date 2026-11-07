import { app } from "./app"
import { env } from "./configs/env"

app.listen(env.PORT, () => {
  console.log(`HTTP server running on http://localhost:${env.PORT}`)
})
