CREATE TABLE `cohort_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cohort_memberships_unique` ON `cohort_memberships` (`cohort_id`,`learner_id`);--> statement-breakpoint
CREATE INDEX `cohort_memberships_learner_idx` ON `cohort_memberships` (`learner_id`);--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` text PRIMARY KEY NOT NULL,
	`organisation` text NOT NULL,
	`name` text NOT NULL,
	`delivery_edition` text DEFAULT 'youth_programme' NOT NULL,
	`manager_role` text DEFAULT 'Programme manager' NOT NULL,
	`measurement_version` text DEFAULT 'BIS-MM-0.1.0' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cohorts_organisation_idx` ON `cohorts` (`organisation`);--> statement-breakpoint
CREATE INDEX `cohorts_status_idx` ON `cohorts` (`status`);--> statement-breakpoint
CREATE TABLE `facilitator_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`cartridge_id` text NOT NULL,
	`indicator_code` text NOT NULL,
	`observed_behaviour` text NOT NULL,
	`context` text NOT NULL,
	`opportunity` text NOT NULL,
	`confidence` text NOT NULL,
	`measurement_version` text DEFAULT 'BIS-MM-0.1.0' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `facilitator_observations_cohort_idx` ON `facilitator_observations` (`cohort_id`,`cartridge_id`);--> statement-breakpoint
CREATE INDEX `facilitator_observations_learner_idx` ON `facilitator_observations` (`learner_id`);--> statement-breakpoint
ALTER TABLE `lab_component_responses` ADD `measurement_version` text DEFAULT 'legacy-unversioned' NOT NULL;--> statement-breakpoint
ALTER TABLE `lab_component_responses` ADD `evidence_class` text DEFAULT 'unclassified' NOT NULL;--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `delivery_edition` text DEFAULT 'youth_programme' NOT NULL;