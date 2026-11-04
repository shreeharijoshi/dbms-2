-- Align existing gym_db installations with database/gym_db.sql.
-- Apply once to databases created before these columns were added to the base schema.

ALTER TABLE members
    ADD COLUMN member_status VARCHAR(10) NOT NULL DEFAULT 'Active' AFTER PT;

ALTER TABLE expenses
    ADD COLUMN expense_month VARCHAR(20) NULL AFTER inventory_id;
