/*
  Warnings:

  - You are about to drop the column `city` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `documentDate` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `documentNumber` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `IncomingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `IncomingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `IncomingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `IncomingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `receivedDate` on the `IncomingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `IncomingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `IncomingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `IncomingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `IncomingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceDate` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNumber` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `InvoiceDetail` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `InvoiceDetail` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `InvoiceDetail` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryAddress` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `poNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `OrderDetail` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `OrderDetail` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `OutgoingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `OutgoingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `OutgoingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `OutgoingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `recipient` on the `OutgoingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `OutgoingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `OutgoingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `OutgoingLetter` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `PurchaseDetail` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `PurchaseDetail` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryAddress` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `preparedBy` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `receivedBy` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `receivedDate` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `recipientName` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `senderInfo` on the `SuratJalan` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `SuratJalanDetail` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `SuratJalanDetail` table. All the data in the column will be lost.
  - You are about to drop the column `brand` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `plateNumber` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Vehicle` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nomorSurat]` on the table `IncomingLetter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nomorInvoice]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nomorSurat]` on the table `OutgoingLetter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nomorSurat]` on the table `SuratJalan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId]` on the table `SuratJalan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nomorPolisi]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kategori` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomorSurat` to the `IncomingLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pengirim` to the `IncomingLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perihal` to the `IncomingLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tanggalSurat` to the `IncomingLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `IncomingLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomorInvoice` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Made the column `orderId` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `price` to the `InvoiceDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `InvoiceDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `OrderDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `OrderDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomorSurat` to the `OutgoingLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penerima` to the `OutgoingLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perihal` to the `OutgoingLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `OutgoingLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jumlah` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metode` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `PurchaseDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `PurchaseDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomorSurat` to the `SuratJalan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SuratJalan` table without a default value. This is not possible if the table is not empty.
  - Made the column `orderId` on table `SuratJalan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `jenis` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomorPolisi` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_createdById_fkey";

-- DropForeignKey
ALTER TABLE "IncomingLetter" DROP CONSTRAINT "IncomingLetter_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_createdById_fkey";

-- DropForeignKey
ALTER TABLE "OutgoingLetter" DROP CONSTRAINT "OutgoingLetter_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_createdById_fkey";

-- DropForeignKey
ALTER TABLE "SuratJalan" DROP CONSTRAINT "SuratJalan_createdById_fkey";

-- DropForeignKey
ALTER TABLE "SuratJalan" DROP CONSTRAINT "SuratJalan_orderId_fkey";

-- DropIndex
DROP INDEX "Document_category_idx";

-- DropIndex
DROP INDEX "Document_createdById_idx";

-- DropIndex
DROP INDEX "Document_documentDate_idx";

-- DropIndex
DROP INDEX "IncomingLetter_createdById_idx";

-- DropIndex
DROP INDEX "IncomingLetter_date_idx";

-- DropIndex
DROP INDEX "Invoice_createdById_idx";

-- DropIndex
DROP INDEX "Invoice_customerId_idx";

-- DropIndex
DROP INDEX "Invoice_invoiceDate_idx";

-- DropIndex
DROP INDEX "Invoice_invoiceNumber_key";

-- DropIndex
DROP INDEX "Invoice_orderId_idx";

-- DropIndex
DROP INDEX "InvoiceDetail_invoiceId_idx";

-- DropIndex
DROP INDEX "InvoiceDetail_productId_idx";

-- DropIndex
DROP INDEX "Order_createdById_idx";

-- DropIndex
DROP INDEX "Order_customerId_idx";

-- DropIndex
DROP INDEX "Order_orderDate_idx";

-- DropIndex
DROP INDEX "OrderDetail_orderId_idx";

-- DropIndex
DROP INDEX "OrderDetail_productId_idx";

-- DropIndex
DROP INDEX "OutgoingLetter_createdById_idx";

-- DropIndex
DROP INDEX "OutgoingLetter_date_idx";

-- DropIndex
DROP INDEX "OutgoingLetter_number_key";

-- DropIndex
DROP INDEX "Payment_createdById_idx";

-- DropIndex
DROP INDEX "Payment_invoiceId_idx";

-- DropIndex
DROP INDEX "Payment_paymentDate_idx";

-- DropIndex
DROP INDEX "Purchase_createdById_idx";

-- DropIndex
DROP INDEX "Purchase_purchaseDate_idx";

-- DropIndex
DROP INDEX "Purchase_supplierId_idx";

-- DropIndex
DROP INDEX "PurchaseDetail_productId_idx";

-- DropIndex
DROP INDEX "PurchaseDetail_purchaseId_idx";

-- DropIndex
DROP INDEX "SuratJalan_createdById_idx";

-- DropIndex
DROP INDEX "SuratJalan_date_idx";

-- DropIndex
DROP INDEX "SuratJalan_driverId_idx";

-- DropIndex
DROP INDEX "SuratJalan_number_key";

-- DropIndex
DROP INDEX "SuratJalan_orderId_idx";

-- DropIndex
DROP INDEX "SuratJalan_vehicleId_idx";

-- DropIndex
DROP INDEX "SuratJalanDetail_productId_idx";

-- DropIndex
DROP INDEX "SuratJalanDetail_suratJalanId_idx";

-- DropIndex
DROP INDEX "Vehicle_plateNumber_key";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "city",
DROP COLUMN "contactName";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "category",
DROP COLUMN "createdById",
DROP COLUMN "description",
DROP COLUMN "documentDate",
DROP COLUMN "documentNumber",
DROP COLUMN "title",
ADD COLUMN     "kategori" TEXT NOT NULL,
ADD COLUMN     "keterangan" TEXT,
ADD COLUMN     "nama" TEXT NOT NULL,
ADD COLUMN     "nomorDokumen" TEXT,
ADD COLUMN     "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "IncomingLetter" DROP COLUMN "createdById",
DROP COLUMN "date",
DROP COLUMN "description",
DROP COLUMN "number",
DROP COLUMN "receivedDate",
DROP COLUMN "sender",
DROP COLUMN "status",
DROP COLUMN "subject",
DROP COLUMN "type",
ADD COLUMN     "jenis" "LetterType" NOT NULL DEFAULT 'BIASA',
ADD COLUMN     "keterangan" TEXT,
ADD COLUMN     "nomorSurat" TEXT NOT NULL,
ADD COLUMN     "pengirim" TEXT NOT NULL,
ADD COLUMN     "perihal" TEXT NOT NULL,
ADD COLUMN     "tanggalSurat" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tanggalTerima" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "createdById",
DROP COLUMN "customerId",
DROP COLUMN "discount",
DROP COLUMN "dueDate",
DROP COLUMN "invoiceDate",
DROP COLUMN "invoiceNumber",
DROP COLUMN "notes",
DROP COLUMN "paymentStatus",
DROP COLUMN "tax",
ADD COLUMN     "diskon" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "jatuhTempo" TIMESTAMP(3),
ADD COLUMN     "keterangan" TEXT,
ADD COLUMN     "nomorInvoice" TEXT NOT NULL,
ADD COLUMN     "pajak" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "statusBayar" "PaymentStatus" NOT NULL DEFAULT 'BELUM_DIBAYAR',
ADD COLUMN     "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "orderId" SET NOT NULL,
ALTER COLUMN "subtotal" SET DEFAULT 0,
ALTER COLUMN "total" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "InvoiceDetail" DROP COLUMN "description",
DROP COLUMN "total",
DROP COLUMN "unitPrice",
ADD COLUMN     "price" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(15,2) NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "createdById",
DROP COLUMN "deliveryAddress",
DROP COLUMN "poNumber",
ADD COLUMN     "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "userId" INTEGER,
ALTER COLUMN "orderDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "OrderDetail" DROP COLUMN "notes",
DROP COLUMN "unitPrice",
ADD COLUMN     "price" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(15,2) NOT NULL;

-- AlterTable
ALTER TABLE "OutgoingLetter" DROP COLUMN "createdById",
DROP COLUMN "date",
DROP COLUMN "description",
DROP COLUMN "number",
DROP COLUMN "recipient",
DROP COLUMN "status",
DROP COLUMN "subject",
DROP COLUMN "type",
ADD COLUMN     "jenis" "LetterType" NOT NULL DEFAULT 'BIASA',
ADD COLUMN     "keterangan" TEXT,
ADD COLUMN     "nomorSurat" TEXT NOT NULL,
ADD COLUMN     "penerima" TEXT NOT NULL,
ADD COLUMN     "perihal" TEXT NOT NULL,
ADD COLUMN     "tanggalSurat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "amount",
DROP COLUMN "createdById",
DROP COLUMN "method",
DROP COLUMN "notes",
DROP COLUMN "paymentDate",
DROP COLUMN "reference",
ADD COLUMN     "jumlah" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "keterangan" TEXT,
ADD COLUMN     "metode" TEXT NOT NULL,
ADD COLUMN     "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "createdById",
DROP COLUMN "paymentStatus",
ADD COLUMN     "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "purchaseDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PurchaseDetail" DROP COLUMN "notes",
DROP COLUMN "unitPrice",
ADD COLUMN     "price" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(15,2) NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "city",
DROP COLUMN "contactName";

-- AlterTable
ALTER TABLE "SuratJalan" DROP COLUMN "createdById",
DROP COLUMN "date",
DROP COLUMN "deliveryAddress",
DROP COLUMN "notes",
DROP COLUMN "number",
DROP COLUMN "preparedBy",
DROP COLUMN "receivedBy",
DROP COLUMN "receivedDate",
DROP COLUMN "recipientName",
DROP COLUMN "reference",
DROP COLUMN "senderInfo",
ADD COLUMN     "keterangan" TEXT,
ADD COLUMN     "nomorSurat" TEXT NOT NULL,
ADD COLUMN     "penerima" TEXT,
ADD COLUMN     "tanggalKirim" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tujuan" TEXT,
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "orderId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SuratJalanDetail" DROP COLUMN "notes",
DROP COLUMN "unit",
ADD COLUMN     "keterangan" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "brand",
DROP COLUMN "isActive",
DROP COLUMN "plateNumber",
DROP COLUMN "type",
DROP COLUMN "year",
ADD COLUMN     "aktif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "jenis" TEXT NOT NULL,
ADD COLUMN     "merek" TEXT,
ADD COLUMN     "nomorPolisi" TEXT NOT NULL,
ADD COLUMN     "tahun" INTEGER,
ADD COLUMN     "warna" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "IncomingLetter_nomorSurat_key" ON "IncomingLetter"("nomorSurat");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_nomorInvoice_key" ON "Invoice"("nomorInvoice");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OutgoingLetter_nomorSurat_key" ON "OutgoingLetter"("nomorSurat");

-- CreateIndex
CREATE UNIQUE INDEX "SuratJalan_nomorSurat_key" ON "SuratJalan"("nomorSurat");

-- CreateIndex
CREATE UNIQUE INDEX "SuratJalan_orderId_key" ON "SuratJalan"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_nomorPolisi_key" ON "Vehicle"("nomorPolisi");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratJalan" ADD CONSTRAINT "SuratJalan_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratJalan" ADD CONSTRAINT "SuratJalan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingLetter" ADD CONSTRAINT "IncomingLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutgoingLetter" ADD CONSTRAINT "OutgoingLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
