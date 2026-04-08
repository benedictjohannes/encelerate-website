CREATE TABLE `oss_cache` (
	`repo_url` text PRIMARY KEY NOT NULL,
	`last_commit_date` text,
	`last_fetch_date` integer NOT NULL
);
