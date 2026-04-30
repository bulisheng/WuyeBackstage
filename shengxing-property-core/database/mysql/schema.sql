-- Global registry schema
-- The environment default schema keeps only registry and admin metadata.
-- Community business data is partitioned by tenant schema, one schema per community.

CREATE TABLE IF NOT EXISTS `cloudbase-d9g78eneac709f5a5`.`communities` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	code VARCHAR(64) NOT NULL,
	name VARCHAR(120) NOT NULL,
	schema_name VARCHAR(64) NOT NULL DEFAULT '',
	address VARCHAR(255) DEFAULT '',
	phone VARCHAR(32) DEFAULT '',
	active TINYINT(1) NOT NULL DEFAULT 1,
	sort INT NOT NULL DEFAULT 100,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_communities_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cloudbase-d9g78eneac709f5a5`.`admin_users` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	username VARCHAR(80) NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	role ENUM('super_admin','admin','finance','customer_service','repairman') NOT NULL DEFAULT 'admin',
	community_id BIGINT UNSIGNED DEFAULT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	last_login_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_admin_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cloudbase-d9g78eneac709f5a5`.`community_modules` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	community_id BIGINT UNSIGNED NOT NULL,
	module_key VARCHAR(64) NOT NULL,
	module_name VARCHAR(120) NOT NULL,
	enabled TINYINT(1) NOT NULL DEFAULT 1,
	sort INT NOT NULL DEFAULT 0,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_community_modules (community_id, module_key),
	KEY idx_community_modules_community_enabled (community_id, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cloudbase-d9g78eneac709f5a5`.`admin_community_permissions` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	admin_id BIGINT UNSIGNED NOT NULL,
	community_id BIGINT UNSIGNED NOT NULL,
	role ENUM('super_admin','admin','finance','customer_service','repairman') NOT NULL DEFAULT 'admin',
	permissions_json TEXT DEFAULT '',
	active TINYINT(1) NOT NULL DEFAULT 1,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_admin_community_permissions (admin_id, community_id),
	KEY idx_admin_community_permissions_community (community_id),
	KEY idx_admin_community_permissions_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cloudbase-d9g78eneac709f5a5`.`admin_audit_logs` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	admin_id BIGINT UNSIGNED DEFAULT NULL,
	username VARCHAR(80) DEFAULT '',
	role ENUM('super_admin','admin','finance','customer_service','repairman') NOT NULL DEFAULT 'admin',
	community_id BIGINT UNSIGNED DEFAULT NULL,
	community_name VARCHAR(120) DEFAULT '',
	route VARCHAR(120) NOT NULL,
	module_key VARCHAR(64) DEFAULT '',
	action_key VARCHAR(64) DEFAULT '',
	status ENUM('success','failed') NOT NULL DEFAULT 'success',
	message VARCHAR(255) DEFAULT '',
	params_json LONGTEXT,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_admin_audit_logs_admin (admin_id),
	KEY idx_admin_audit_logs_community (community_id),
	KEY idx_admin_audit_logs_route (route),
	KEY idx_admin_audit_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `cloudbase-d9g78eneac709f5a5`.`communities` (code, name, schema_name, sort, active)
VALUES
	('rzb-001', '荣尊堡', 'rzb', 1, 1),
	('oljd-001', '欧陆经典', 'oljd', 2, 1)
ON DUPLICATE KEY UPDATE
	name = VALUES(name),
	schema_name = VALUES(schema_name),
	sort = VALUES(sort),
	active = VALUES(active);

CREATE SCHEMA IF NOT EXISTS `rzb`;
CREATE SCHEMA IF NOT EXISTS `oljd`;

-- Tenant schema template for each community.
-- The runtime init in `cloudfunctions/sxmini/index.js` applies the same DDL to each tenant schema.

CREATE TABLE IF NOT EXISTS `rzb`.`owners` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	openid VARCHAR(128) DEFAULT '',
	community_id BIGINT UNSIGNED NOT NULL,
	community_name VARCHAR(120) NOT NULL,
	name VARCHAR(80) NOT NULL,
	mobile VARCHAR(32) NOT NULL,
	house VARCHAR(120) NOT NULL,
	audit_status ENUM('pending','approved','rejected','disabled') NOT NULL DEFAULT 'pending',
	audit_remark VARCHAR(255) DEFAULT '',
	session_token VARCHAR(128) DEFAULT '',
	last_login_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_owners_mobile (mobile),
	KEY idx_owners_status (audit_status),
	KEY idx_owners_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`auth_codes` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	openid VARCHAR(128) DEFAULT '',
	mobile VARCHAR(32) NOT NULL,
	code VARCHAR(12) NOT NULL,
	used TINYINT(1) NOT NULL DEFAULT 0,
	expires_at DATETIME NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	used_at DATETIME NULL,
	PRIMARY KEY (id),
	KEY idx_auth_codes_mobile (mobile),
	KEY idx_auth_codes_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`login_sessions` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	openid VARCHAR(128) DEFAULT '',
	community_id BIGINT UNSIGNED NOT NULL,
	community_name VARCHAR(120) NOT NULL,
	mobile VARCHAR(32) NOT NULL,
	session_token VARCHAR(128) NOT NULL,
	last_login_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_login_sessions_openid_community (openid, community_id),
	KEY idx_login_sessions_mobile (mobile),
	KEY idx_login_sessions_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`owner_houses` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	owner_id BIGINT UNSIGNED NOT NULL,
	community_id BIGINT UNSIGNED DEFAULT NULL,
	community_name VARCHAR(120) DEFAULT '',
	house VARCHAR(120) NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_owner_houses_owner_house (owner_id, house),
	KEY idx_owner_houses_owner (owner_id),
	KEY idx_owner_houses_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`tasks` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	community_id BIGINT UNSIGNED NOT NULL,
	type VARCHAR(60) NOT NULL,
	title VARCHAR(160) NOT NULL,
	content TEXT,
	category VARCHAR(80) DEFAULT '',
	user_id BIGINT UNSIGNED DEFAULT NULL,
	house_id BIGINT UNSIGNED DEFAULT NULL,
	status ENUM('pending','assigned','processing','completed','confirmed','rated','closed','timeout','escalated','cancelled') NOT NULL DEFAULT 'pending',
	priority TINYINT NOT NULL DEFAULT 0,
	assigned_to BIGINT UNSIGNED DEFAULT NULL,
	appointment_time DATETIME NULL,
	deadline DATETIME NULL,
	sla_status VARCHAR(40) DEFAULT '',
	is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	completed_at DATETIME NULL,
	confirmed_at DATETIME NULL,
	closed_at DATETIME NULL,
	PRIMARY KEY (id),
	KEY idx_tasks_community_type (community_id, type),
	KEY idx_tasks_status (status),
	KEY idx_tasks_assigned_to (assigned_to),
	KEY idx_tasks_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`task_logs` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	task_id BIGINT UNSIGNED NOT NULL,
	community_id BIGINT UNSIGNED NOT NULL,
	operator_id BIGINT UNSIGNED DEFAULT NULL,
	operator_type VARCHAR(20) NOT NULL DEFAULT 'system',
	action VARCHAR(60) NOT NULL,
	from_status VARCHAR(40) DEFAULT '',
	to_status VARCHAR(40) DEFAULT '',
	content TEXT,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_task_logs_task (task_id),
	KEY idx_task_logs_community (community_id),
	KEY idx_task_logs_operator (operator_id),
	KEY idx_task_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`task_images` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	task_id BIGINT UNSIGNED NOT NULL,
	community_id BIGINT UNSIGNED NOT NULL,
	url VARCHAR(255) NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_task_images_task (task_id),
	KEY idx_task_images_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`bills` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	community_id BIGINT UNSIGNED NOT NULL,
	house_id BIGINT UNSIGNED DEFAULT NULL,
	user_id BIGINT UNSIGNED DEFAULT NULL,
	owner_name VARCHAR(80) DEFAULT '',
	house VARCHAR(120) DEFAULT '',
	bill_no VARCHAR(80) NOT NULL,
	title VARCHAR(160) NOT NULL,
	bill_type VARCHAR(60) NOT NULL DEFAULT '物业费',
	amount DECIMAL(10,2) NOT NULL DEFAULT 0,
	status ENUM('pending','paid','overdue','cancelled','refunded') NOT NULL DEFAULT 'pending',
	due_date DATE NULL,
	paid_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_bills_bill_no (bill_no),
	KEY idx_bills_community_status (community_id, status),
	KEY idx_bills_user (user_id),
	KEY idx_bills_house (house_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`bill_items` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	bill_id BIGINT UNSIGNED NOT NULL,
	community_id BIGINT UNSIGNED NOT NULL,
	name VARCHAR(120) NOT NULL,
	amount DECIMAL(10,2) NOT NULL DEFAULT 0,
	remark VARCHAR(255) DEFAULT '',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_bill_items_bill (bill_id),
	KEY idx_bill_items_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`payments` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	community_id BIGINT UNSIGNED NOT NULL,
	user_id BIGINT UNSIGNED DEFAULT NULL,
	house_id BIGINT UNSIGNED DEFAULT NULL,
	bill_id BIGINT UNSIGNED NOT NULL,
	payment_no VARCHAR(80) NOT NULL,
	amount DECIMAL(10,2) NOT NULL DEFAULT 0,
	channel ENUM('wechat','cash','system') NOT NULL DEFAULT 'wechat',
	status ENUM('pending','success','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
	transaction_id VARCHAR(120) DEFAULT '',
	paid_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_payments_payment_no (payment_no),
	KEY idx_payments_bill (bill_id),
	KEY idx_payments_community_status (community_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`bill_reminders` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	community_id BIGINT UNSIGNED NOT NULL,
	bill_id BIGINT UNSIGNED NOT NULL,
	user_id BIGINT UNSIGNED DEFAULT NULL,
	channel ENUM('wechat','sms','dingtalk','phone_task','system') NOT NULL DEFAULT 'system',
	title VARCHAR(160) NOT NULL,
	content TEXT,
	status ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
	sent_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_bill_reminders_bill (bill_id),
	KEY idx_bill_reminders_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`repairs` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	community_id BIGINT UNSIGNED DEFAULT NULL,
	community_name VARCHAR(120) DEFAULT '',
	owner_id BIGINT UNSIGNED DEFAULT NULL,
	house VARCHAR(120) DEFAULT '',
	contact VARCHAR(80) DEFAULT '',
	phone VARCHAR(32) DEFAULT '',
	title VARCHAR(160) NOT NULL,
	type VARCHAR(60) DEFAULT '',
	description TEXT,
	status ENUM('pending','assigned','processing','completed','closed') NOT NULL DEFAULT 'pending',
	assignee VARCHAR(80) DEFAULT '',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_repairs_status (status),
	KEY idx_repairs_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`fee_bills` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	community_id BIGINT UNSIGNED DEFAULT NULL,
	community_name VARCHAR(120) DEFAULT '',
	owner_id BIGINT UNSIGNED DEFAULT NULL,
	owner_name VARCHAR(80) DEFAULT '',
	house VARCHAR(120) DEFAULT '',
	bill_no VARCHAR(80) NOT NULL,
	bill_type VARCHAR(60) NOT NULL DEFAULT '物业费',
	amount DECIMAL(10,2) NOT NULL DEFAULT 0,
	status ENUM('unpaid','paid','overdue','void') NOT NULL DEFAULT 'unpaid',
	due_date DATE NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_fee_bills_bill_no (bill_no),
	KEY idx_fee_bills_status (status),
	KEY idx_fee_bills_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`complaints` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	community_id BIGINT UNSIGNED DEFAULT NULL,
	community_name VARCHAR(120) DEFAULT '',
	owner_id BIGINT UNSIGNED DEFAULT NULL,
	contact VARCHAR(80) DEFAULT '',
	phone VARCHAR(32) DEFAULT '',
	title VARCHAR(160) NOT NULL,
	content TEXT,
	status ENUM('pending','processing','completed','closed') NOT NULL DEFAULT 'pending',
	assignee VARCHAR(80) DEFAULT '',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_complaints_status (status),
	KEY idx_complaints_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`service_orders` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	community_id BIGINT UNSIGNED DEFAULT NULL,
	community_name VARCHAR(120) DEFAULT '',
	owner_id BIGINT UNSIGNED DEFAULT NULL,
	service_type VARCHAR(80) NOT NULL,
	contact VARCHAR(80) DEFAULT '',
	phone VARCHAR(32) DEFAULT '',
	remark TEXT,
	status ENUM('pending','processing','completed','closed') NOT NULL DEFAULT 'pending',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_service_orders_status (status),
	KEY idx_service_orders_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rzb`.`notice_configs` (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	_openid VARCHAR(64) DEFAULT '' NOT NULL,
	community_id BIGINT UNSIGNED DEFAULT NULL,
	community_name VARCHAR(120) DEFAULT '',
	scene VARCHAR(80) NOT NULL,
	channel ENUM('wechat','dingtalk','sms','system') NOT NULL DEFAULT 'system',
	template_name VARCHAR(120) NOT NULL,
	enabled TINYINT(1) NOT NULL DEFAULT 1,
	robot_name VARCHAR(120) DEFAULT '',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_notice_configs_scene (scene),
	KEY idx_notice_configs_community (community_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Apply the same tenant table set to `oljd` (or let `sxmini` create it during init).
