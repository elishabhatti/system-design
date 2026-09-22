-- AlterTable
ALTER TABLE `Video` ADD COLUMN `isProcessed` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `VideoQuality` (
    `id` VARCHAR(191) NOT NULL,
    `videoId` VARCHAR(191) NOT NULL,
    `resolution` VARCHAR(191) NOT NULL,
    `filepath` VARCHAR(191) NOT NULL,
    `filesize` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VideoQuality_videoId_idx`(`videoId`),
    UNIQUE INDEX `VideoQuality_videoId_resolution_key`(`videoId`, `resolution`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Like_userId_idx` ON `Like`(`userId`);

-- CreateIndex
CREATE INDEX `Notification_read_idx` ON `Notification`(`read`);

-- CreateIndex
CREATE INDEX `Subscription_subscriberId_idx` ON `Subscription`(`subscriberId`);

-- CreateIndex
CREATE INDEX `Video_category_idx` ON `Video`(`category`);

-- CreateIndex
CREATE INDEX `Video_uploadedAt_idx` ON `Video`(`uploadedAt`);

-- CreateIndex
CREATE INDEX `View_userId_idx` ON `View`(`userId`);

-- AddForeignKey
ALTER TABLE `VideoQuality` ADD CONSTRAINT `VideoQuality_videoId_fkey` FOREIGN KEY (`videoId`) REFERENCES `Video`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Comment` RENAME INDEX `Comment_userId_fkey` TO `Comment_userId_idx`;

-- RenameIndex
ALTER TABLE `Notification` RENAME INDEX `Notification_userId_fkey` TO `Notification_userId_idx`;

-- RenameIndex
ALTER TABLE `Subscription` RENAME INDEX `Subscription_channelId_fkey` TO `Subscription_channelId_idx`;

-- RenameIndex
ALTER TABLE `Video` RENAME INDEX `Video_userId_fkey` TO `Video_userId_idx`;

-- RenameIndex
ALTER TABLE `View` RENAME INDEX `View_videoId_fkey` TO `View_videoId_idx`;
