import { Router } from "express"
import { CreditRefundsController } from "../controllers/credit-refunds-controller"
import { EntriesController } from "../controllers/entries-controller"
import { OpeningBalancesController } from "../controllers/opening-balances-controller"
import { PaymentsController } from "../controllers/payments-controller"
import { PurchasesController } from "../controllers/purchases-controller"

export const entriesRoutes = Router({ mergeParams: true })

const purchases = new PurchasesController()
const payments = new PaymentsController()
const openingBalances = new OpeningBalancesController()
const creditRefunds = new CreditRefundsController()
const entries = new EntriesController()

entriesRoutes.post("/purchases/preview", purchases.preview)
entriesRoutes.post("/purchases", purchases.create)
entriesRoutes.post("/payments", payments.create)
entriesRoutes.post("/opening-balances", openingBalances.create)
entriesRoutes.post("/credit-refunds", creditRefunds.create)

entriesRoutes.get("/entries", entries.index)
entriesRoutes.get("/entries/:id", entries.show)
entriesRoutes.post("/entries/:id/reversal", entries.reverse)
