-- Authentication tables for the existing gym_db database.
-- Run this migration once against the existing database. It does not recreate gym_db.

USE gym_db;

CREATE TABLE IF NOT EXISTS auth_accounts (
    account_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Trainer', 'Member') NOT NULL,
    member_id VARCHAR(20) NULL,
    trainer_employee_id VARCHAR(20) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id),
    UNIQUE KEY uq_auth_accounts_email (email),
    UNIQUE KEY uq_auth_accounts_member (member_id),
    UNIQUE KEY uq_auth_accounts_trainer (trainer_employee_id),
    CONSTRAINT fk_auth_accounts_member
        FOREIGN KEY (member_id) REFERENCES members(member_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_auth_accounts_trainer
        FOREIGN KEY (trainer_employee_id) REFERENCES gym_trainers(employee_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_auth_account_identity CHECK (
        (role = 'Admin' AND member_id IS NULL AND trainer_employee_id IS NULL)
        OR (role = 'Trainer' AND member_id IS NULL AND trainer_employee_id IS NOT NULL)
        OR (role = 'Member' AND member_id IS NOT NULL AND trainer_employee_id IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id CHAR(64) NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id),
    KEY ix_auth_sessions_account (account_id),
    KEY ix_auth_sessions_expiry (expires_at),
    CONSTRAINT fk_auth_sessions_account
        FOREIGN KEY (account_id) REFERENCES auth_accounts(account_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
