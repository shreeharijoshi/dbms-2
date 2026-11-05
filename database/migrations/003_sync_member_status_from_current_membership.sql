-- Mark a member active only while they have a currently valid Active membership.
ALTER TABLE members
    MODIFY COLUMN member_status VARCHAR(10) NOT NULL DEFAULT 'Inactive';

UPDATE members AS m
SET member_status = CASE WHEN EXISTS (
    SELECT 1
    FROM members_plans AS active_membership
    WHERE active_membership.member_id = m.member_id
      AND LOWER(active_membership.membership_status) = 'active'
      AND (active_membership.start_date IS NULL OR active_membership.start_date <= CURRENT_DATE)
      AND (active_membership.end_date IS NULL OR active_membership.end_date >= CURRENT_DATE)
) THEN 'Active' ELSE 'Inactive' END;
