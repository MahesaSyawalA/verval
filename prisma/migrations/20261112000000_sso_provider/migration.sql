-- CreateTable
CREATE TABLE `sso_clients` (
    `id` CHAR(36) NOT NULL,
    `client_id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(255) NULL,
    `launch_url` VARCHAR(500) NOT NULL,
    `client_secret_hash` VARCHAR(255) NULL,
    `redirect_uris` JSON NOT NULL,
    `post_logout_redirect_uris` JSON NOT NULL,
    `allowed_roles` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sso_clients_client_id_key`(`client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sso_auth_codes` (
    `id` CHAR(36) NOT NULL,
    `code_hash` CHAR(64) NOT NULL,
    `client_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `redirect_uri` VARCHAR(500) NOT NULL,
    `code_challenge` VARCHAR(128) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sso_auth_codes_code_hash_key`(`code_hash`),
    INDEX `sso_auth_codes_client_id_idx`(`client_id`),
    INDEX `sso_auth_codes_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sso_refresh_tokens` (
    `id` CHAR(36) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `client_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sso_refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `sso_refresh_tokens_client_id_idx`(`client_id`),
    INDEX `sso_refresh_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sso_auth_codes` ADD CONSTRAINT `sso_auth_codes_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `sso_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sso_auth_codes` ADD CONSTRAINT `sso_auth_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sso_refresh_tokens` ADD CONSTRAINT `sso_refresh_tokens_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `sso_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sso_refresh_tokens` ADD CONSTRAINT `sso_refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

