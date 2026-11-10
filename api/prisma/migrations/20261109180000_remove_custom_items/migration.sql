-- O item avulso deixou de existir: todo item de compra aponta para um produto cadastrado.
ALTER TABLE "PurchaseItem" ALTER COLUMN "productId" SET NOT NULL;
