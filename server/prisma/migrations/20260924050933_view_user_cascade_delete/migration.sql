-- DropForeignKey
ALTER TABLE `View` DROP FOREIGN KEY `View_userId_fkey`;

-- AddForeignKey
ALTER TABLE `View` ADD CONSTRAINT `View_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
