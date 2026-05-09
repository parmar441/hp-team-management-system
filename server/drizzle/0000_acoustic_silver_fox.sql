CREATE TABLE `area_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`zone` enum('North','South','East','West','Central') NOT NULL,
	`area` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `area_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `area_assignments_user_zone_area_idx` UNIQUE(`user_id`,`zone`,`area`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`user_name` varchar(255) NOT NULL,
	`user_role` varchar(50) NOT NULL,
	`action` enum('create','update','delete') NOT NULL,
	`target_id` int NOT NULL,
	`target_name` varchar(255) NOT NULL,
	`field` varchar(100),
	`old_value` text,
	`new_value` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hotel_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotel_id` int NOT NULL,
	`slot_number` int NOT NULL,
	`team_id` int,
	`room_number` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hotel_slots_id` PRIMARY KEY(`id`),
	CONSTRAINT `hotel_slots_hotel_slot_idx` UNIQUE(`hotel_id`,`slot_number`)
);
--> statement-breakpoint
CREATE TABLE `hotels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`total_slots` int NOT NULL DEFAULT 8,
	`status` enum('upcoming','not_available','available') NOT NULL DEFAULT 'upcoming',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hotels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`gender` enum('M','F') NOT NULL,
	`age_group` enum('Child','Teen','Adult','Senior') NOT NULL,
	`zone` enum('North','South','East','West','Central') NOT NULL,
	`stay` boolean NOT NULL DEFAULT false,
	`is_team_lead` boolean NOT NULL DEFAULT false,
	`area` varchar(255),
	`location` varchar(255),
	`country` varchar(255),
	`category` varchar(255),
	`note` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `people_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`team_id` int NOT NULL,
	`person_id` int NOT NULL,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`zone` enum('North','South','East','West','Central'),
	`created_by_user_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`open_id` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`login_method` varchar(64),
	`role` enum('user','admin','zone_lead','area_lead') NOT NULL DEFAULT 'user',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_signed_in` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_open_id_unique` UNIQUE(`open_id`)
);
--> statement-breakpoint
CREATE TABLE `zone_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`zone` enum('North','South','East','West','Central') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `zone_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `zone_assignments_user_zone_idx` UNIQUE(`user_id`,`zone`)
);
