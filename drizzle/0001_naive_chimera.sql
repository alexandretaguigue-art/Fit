CREATE TABLE `nutritionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targets` json NOT NULL,
	`week` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nutritionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sportPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programName` varchar(256) NOT NULL,
	`goalStatement` text,
	`weeks` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sportPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`age` int NOT NULL,
	`sex` enum('homme','femme','autre') NOT NULL,
	`weight` int NOT NULL,
	`height` int NOT NULL,
	`goal` varchar(64) NOT NULL,
	`activity` varchar(64) NOT NULL,
	`sports` json NOT NULL,
	`diet` varchar(64),
	`mealsPerDay` int NOT NULL DEFAULT 5,
	`level` varchar(32) NOT NULL,
	`sessionsPerWeek` int NOT NULL DEFAULT 4,
	`targetWeight` int,
	`timeline` int DEFAULT 12,
	`avoid` text,
	`foodPrefs` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;