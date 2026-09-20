/*
  Warnings:

  - You are about to drop the column `keterangan` on the `SuratJalan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SuratJalan" DROP COLUMN "keterangan",
ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "catatan" TEXT,
ADD COLUMN     "referensiPO" TEXT;
