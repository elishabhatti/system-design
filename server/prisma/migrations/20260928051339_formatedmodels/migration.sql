/*
  Warnings:

  - You are about to alter the column `visibility` on the `Video` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - A unique constraint covering the columns `[channelName]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Notification_read_idx` ON `Notification`;

-- DropIndex
DROP INDEX `Video_category_idx` ON `Video`;

-- DropIndex
DROP INDEX `Video_uploadedAt_idx` ON `Video`;

-- AlterTable
ALTER TABLE `Video` ADD COLUMN `status` ENUM('UPLOADING', 'PROCESSING', 'READY', 'FAILED') NOT NULL DEFAULT 'PROCESSING',
    MODIFY `filesize` BIGINT NOT NULL,
    MODIFY `visibility` ENUM('private', 'public', 'unlisted') NOT NULL DEFAULT 'private';

-- AlterTable
ALTER TABLE `VideoQuality` MODIFY `filesize` BIGINT NOT NULL;

-- CreateIndex
CREATE INDEX `Comment_videoId_createdAt_idx` ON `Comment`(`videoId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Notification_userId_read_createdAt_idx` ON `Notification`(`userId`, `read`, `createdAt`);

-- CreateIndex
CREATE UNIQUE INDEX `User_channelName_key` ON `User`(`channelName`);

-- CreateIndex
CREATE INDEX `Video_userId_uploadedAt_idx` ON `Video`(`userId`, `uploadedAt`);

-- CreateIndex
CREATE INDEX `Video_visibility_status_uploadedAt_idx` ON `Video`(`visibility`, `status`, `uploadedAt`);

-- CreateIndex
CREATE INDEX `Video_category_uploadedAt_idx` ON `Video`(`category`, `uploadedAt`);

-- RenameIndex
ALTER TABLE `Notification` RENAME INDEX `Notification_senderId_fkey` TO `Notification_senderId_idx`;
