-- AlterTable
ALTER TABLE `User` MODIFY `bannerUrl` VARCHAR(2000) NULL;

-- AlterTable
ALTER TABLE `Video` MODIFY `status` ENUM('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETING') NOT NULL DEFAULT 'PROCESSING';

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Tag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoTag` (
    `videoId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    INDEX `VideoTag_tagId_idx`(`tagId`),
    PRIMARY KEY (`videoId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VideoTag` ADD CONSTRAINT `VideoTag_videoId_fkey` FOREIGN KEY (`videoId`) REFERENCES `Video`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VideoTag` ADD CONSTRAINT `VideoTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
