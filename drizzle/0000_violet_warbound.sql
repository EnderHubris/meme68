CREATE TABLE `meme_of_the_day` (
	`id` varchar(36) NOT NULL,
	`mid` varchar(256),
	`updatedAt` timestamp,
	CONSTRAINT `meme_of_the_day_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memes` (
	`mid` varchar(256) NOT NULL,
	`file_ext` varchar(8) NOT NULL,
	`likes` bigint unsigned DEFAULT 0,
	`tagString` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `memes_mid` PRIMARY KEY(`mid`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` varchar(36) NOT NULL,
	`uid` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL DEFAULT (now() + interval 3 week),
	CONSTRAINT `sessions_sid` PRIMARY KEY(`sid`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`username` varchar(50) NOT NULL,
	`email` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`admin` boolean NOT NULL DEFAULT false,
	`liked_memes` json NOT NULL DEFAULT (json_array()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `username` UNIQUE(`username`),
	CONSTRAINT `email` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_uid_users_id_fk` FOREIGN KEY (`uid`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;