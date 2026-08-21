-- AlterTable
ALTER TABLE `Video` ADD COLUMN `ageRestricted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `category` VARCHAR(191) NULL DEFAULT 'General',
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `isMadeForKids` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `scheduledFor` DATETIME(3) NULL,
    ADD COLUMN `tags` VARCHAR(191) NULL,
    ADD COLUMN `thumbnailUrl` VARCHAR(191) NULL,
    ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `visibility` VARCHAR(191) NOT NULL DEFAULT 'private';

-- CreateTable
CREATE TABLE `View` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `videoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `View_userId_videoId_key`(`userId`, `videoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `View` ADD CONSTRAINT `View_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `View` ADD CONSTRAINT `View_videoId_fkey` FOREIGN KEY (`videoId`) REFERENCES `Video`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
