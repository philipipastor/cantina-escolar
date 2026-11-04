-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('PURCHASE', 'PAYMENT', 'OPENING_BALANCE', 'CREDIT_REFUND', 'REVERSAL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'PIX', 'CARD');

-- CreateEnum
CREATE TYPE "ConsumerType" AS ENUM ('CHILD', 'ACCOUNT_HOLDER', 'UNIDENTIFIED');

-- CreateTable
CREATE TABLE "Canteen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Canteen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "canteenId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "canteenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "canteenId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "canteenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "canteenId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "referenceDate" DATE NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "PaymentMethod",
    "consumerType" "ConsumerType",
    "childId" TEXT,
    "description" TEXT,
    "reason" TEXT,
    "reversesId" TEXT,
    "redoneFromId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "canteenId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Client_canteenId_name_idx" ON "Client"("canteenId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Client_id_canteenId_key" ON "Client"("id", "canteenId");

-- CreateIndex
CREATE INDEX "Child_canteenId_name_idx" ON "Child"("canteenId", "name");

-- CreateIndex
CREATE INDEX "Child_clientId_idx" ON "Child"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Child_id_clientId_key" ON "Child"("id", "clientId");

-- CreateIndex
CREATE INDEX "Product_canteenId_name_idx" ON "Product"("canteenId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_id_canteenId_key" ON "Product"("id", "canteenId");

-- CreateIndex
CREATE INDEX "Entry_clientId_referenceDate_idx" ON "Entry"("clientId", "referenceDate");

-- CreateIndex
CREATE INDEX "Entry_canteenId_referenceDate_idx" ON "Entry"("canteenId", "referenceDate");

-- CreateIndex
CREATE INDEX "Entry_canteenId_type_recordedAt_idx" ON "Entry"("canteenId", "type", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_id_clientId_key" ON "Entry"("id", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_id_canteenId_key" ON "Entry"("id", "canteenId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_reversesId_clientId_key" ON "Entry"("reversesId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_redoneFromId_canteenId_key" ON "Entry"("redoneFromId", "canteenId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_canteenId_idempotencyKey_key" ON "Entry"("canteenId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "PurchaseItem_entryId_idx" ON "PurchaseItem"("entryId");

-- CreateIndex
CREATE INDEX "PurchaseItem_productId_idx" ON "PurchaseItem"("productId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_clientId_canteenId_fkey" FOREIGN KEY ("clientId", "canteenId") REFERENCES "Client"("id", "canteenId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_clientId_canteenId_fkey" FOREIGN KEY ("clientId", "canteenId") REFERENCES "Client"("id", "canteenId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_childId_clientId_fkey" FOREIGN KEY ("childId", "clientId") REFERENCES "Child"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_reversesId_clientId_fkey" FOREIGN KEY ("reversesId", "clientId") REFERENCES "Entry"("id", "clientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_redoneFromId_canteenId_fkey" FOREIGN KEY ("redoneFromId", "canteenId") REFERENCES "Entry"("id", "canteenId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_entryId_canteenId_fkey" FOREIGN KEY ("entryId", "canteenId") REFERENCES "Entry"("id", "canteenId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_canteenId_fkey" FOREIGN KEY ("productId", "canteenId") REFERENCES "Product"("id", "canteenId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Regras garantidas pelo próprio banco (não geradas pelo Prisma)
-- ---------------------------------------------------------------------------

-- Busca por nome sem diferenciar acentos ("Joao" encontra "João").
CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE "User" ADD CONSTRAINT "User_role_canteen_check" CHECK (
  ("role" = 'ADMIN' AND "canteenId" IS NULL)
  OR ("role" = 'EMPLOYEE' AND "canteenId" IS NOT NULL)
);

ALTER TABLE "Product" ADD CONSTRAINT "Product_price_positive_check" CHECK ("priceCents" > 0);

ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_positive_values_check" CHECK (
  "quantity" > 0 AND "unitPriceCents" > 0
);

-- O sinal do valor precisa combinar com o tipo do lançamento.
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_amount_sign_check" CHECK (
  ("type" = 'PURCHASE' AND "amountCents" < 0)
  OR ("type" = 'PAYMENT' AND "amountCents" > 0)
  OR ("type" = 'CREDIT_REFUND' AND "amountCents" < 0)
  OR ("type" IN ('OPENING_BALANCE', 'REVERSAL') AND "amountCents" <> 0)
);

ALTER TABLE "Entry" ADD CONSTRAINT "Entry_payment_method_check" CHECK (
  ("type" IN ('PAYMENT', 'CREDIT_REFUND')) = ("paymentMethod" IS NOT NULL)
);

ALTER TABLE "Entry" ADD CONSTRAINT "Entry_consumer_check" CHECK (
  ("type" = 'PURCHASE') = ("consumerType" IS NOT NULL)
  AND ("consumerType" IS NOT DISTINCT FROM 'CHILD'::"ConsumerType") = ("childId" IS NOT NULL)
);

ALTER TABLE "Entry" ADD CONSTRAINT "Entry_reversal_check" CHECK (
  ("type" = 'REVERSAL') = ("reversesId" IS NOT NULL)
  AND ("type" <> 'REVERSAL' OR ("reason" IS NOT NULL AND "redoneFromId" IS NULL))
);

ALTER TABLE "Entry" ADD CONSTRAINT "Entry_opening_balance_check" CHECK (
  "type" <> 'OPENING_BALANCE' OR "description" IS NOT NULL
);

-- Lançamentos nunca são alterados nem apagados: erros se corrigem com estorno.
CREATE FUNCTION prevent_entry_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Lançamentos financeiros não podem ser alterados nem apagados; use um estorno.'
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Entry_immutable"
  BEFORE UPDATE OR DELETE ON "Entry"
  FOR EACH ROW EXECUTE FUNCTION prevent_entry_change();

CREATE TRIGGER "PurchaseItem_immutable"
  BEFORE UPDATE OR DELETE ON "PurchaseItem"
  FOR EACH ROW EXECUTE FUNCTION prevent_entry_change();
