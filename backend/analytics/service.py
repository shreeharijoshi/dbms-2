import os

from sqlalchemy import text
from sqlalchemy.orm import Session


def _rows(db: Session, sql: str, params=None):
    return [dict(row) for row in db.execute(text(sql), params or {}).mappings().all()]


def _one(db: Session, sql: str, params=None):
    return dict(db.execute(text(sql), params or {}).mappings().one())


def _threshold():
    try:
        return max(0, int(os.getenv("INVENTORY_LOW_STOCK_THRESHOLD", "5")))
    except ValueError:
        return 5


def dashboard(db: Session, months: int):
    threshold = _threshold()
    summary = _one(db, """
        SELECT (SELECT COUNT(*) FROM members) AS total_members,
               (SELECT COUNT(*) FROM members AS m WHERE EXISTS (
                   SELECT 1 FROM members_plans AS ms
                   WHERE ms.member_id = m.member_id AND LOWER(ms.membership_status) = 'active'
                     AND (ms.start_date IS NULL OR ms.start_date <= CURRENT_DATE)
                     AND (ms.end_date IS NULL OR ms.end_date >= CURRENT_DATE)
               )) AS active_members,
               (SELECT COUNT(*) FROM members AS m WHERE NOT EXISTS (
                   SELECT 1 FROM members_plans AS ms
                   WHERE ms.member_id = m.member_id AND LOWER(ms.membership_status) = 'active'
                     AND (ms.start_date IS NULL OR ms.start_date <= CURRENT_DATE)
                     AND (ms.end_date IS NULL OR ms.end_date >= CURRENT_DATE)
               )) AS inactive_members,
               (SELECT COUNT(*) FROM gym_trainers) AS total_trainers,
               (SELECT COUNT(*) FROM membership_plans) AS total_plans,
               (SELECT COALESCE(SUM(amount), 0) FROM payments) AS total_revenue,
               (SELECT COALESCE(SUM(COALESCE(amount, 0) + COALESCE(bonus, 0)), 0) FROM expenses) AS total_expenses,
               (SELECT COALESCE(SUM(amount), 0) FROM payments) -
                 (SELECT COALESCE(SUM(COALESCE(amount, 0) + COALESCE(bonus, 0)), 0) FROM expenses) AS net_profit,
               (SELECT COUNT(*) FROM members_plans WHERE LOWER(membership_status) = 'active'
                 AND end_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)) AS expiring_memberships,
               (SELECT COUNT(*) FROM inventory WHERE quantity <= :threshold) AS low_stock_items
    """, {"threshold": threshold})

    revenue = _rows(db, """SELECT DATE_FORMAT(payment_date, '%Y-%m') AS month,
        COALESCE(SUM(amount), 0) AS total FROM payments
        WHERE payment_date >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL :month_offset MONTH)
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m') ORDER BY month""", {"month_offset": months - 1})
    expenses = _rows(db, """SELECT DATE_FORMAT(payment_date, '%Y-%m') AS month,
        COALESCE(SUM(COALESCE(amount, 0) + COALESCE(bonus, 0)), 0) AS total FROM expenses
        WHERE payment_date >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL :month_offset MONTH)
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m') ORDER BY month""", {"month_offset": months - 1})
    modes = _rows(db, """SELECT COALESCE(payment_mode, 'Unspecified') AS label,
        COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM payments
        GROUP BY payment_mode ORDER BY total DESC""")
    membership_status = _rows(db, """SELECT CASE
        WHEN LOWER(membership_status) = 'active' AND end_date < CURRENT_DATE THEN 'Expired'
        WHEN LOWER(membership_status) = 'active' THEN 'Active'
        ELSE COALESCE(membership_status, 'Unspecified') END AS label, COUNT(*) AS count
        FROM members_plans GROUP BY label ORDER BY label""")
    expiring = _rows(db, """SELECT ms.membership_id, ms.member_id, m.member_name,
        ms.plan_id, ms.end_date, DATEDIFF(ms.end_date, CURRENT_DATE) AS days_remaining
        FROM members_plans ms JOIN members m ON m.member_id = ms.member_id
        WHERE LOWER(ms.membership_status) = 'active'
          AND ms.end_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
        ORDER BY ms.end_date, m.member_name""")
    by_plan = _rows(db, """SELECT mp.plan_id AS label, COUNT(ms.membership_id) AS count
        FROM membership_plans mp LEFT JOIN members_plans ms ON ms.plan_id = mp.plan_id
        GROUP BY mp.plan_id ORDER BY count DESC, mp.plan_id""")
    subscriptions = _rows(db, """SELECT DATE_FORMAT(start_date, '%Y-%m') AS month, COUNT(*) AS count
        FROM members_plans WHERE start_date >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL :month_offset MONTH)
        GROUP BY DATE_FORMAT(start_date, '%Y-%m') ORDER BY month""", {"month_offset": months - 1})
    genders = _rows(db, """SELECT COALESCE(NULLIF(TRIM(gender), ''), 'Unknown') AS label, COUNT(*) AS count
        FROM members GROUP BY label ORDER BY count DESC""")
    trainers = _rows(db, """SELECT COALESCE(t.trainer_name, 'Unassigned') AS label,
        COUNT(m.member_id) AS count FROM members m LEFT JOIN gym_trainers t ON t.employee_id = m.PT
        GROUP BY t.employee_id, t.trainer_name ORDER BY count DESC, label""")
    inventory_categories = _rows(db, """SELECT COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS label,
        COUNT(*) AS count FROM inventory GROUP BY label ORDER BY count DESC, label""")
    low_stock = _rows(db, """SELECT inventory_id, item_name, category, quantity, cost
        FROM inventory WHERE quantity <= :threshold ORDER BY quantity, item_name""", {"threshold": threshold})

    def index(series, key, value):
        return {str(row[key]): float(row[value] or 0) for row in series}

    rev, exp = index(revenue, "month", "total"), index(expenses, "month", "total")
    months_sorted = sorted(set(rev) | set(exp))
    financial = [{"month": month, "revenue": rev.get(month, 0), "expenses": exp.get(month, 0),
                  "profit": rev.get(month, 0) - exp.get(month, 0)} for month in months_sorted]
    inventory = _one(db, """SELECT COUNT(*) AS total_items, COALESCE(SUM(quantity), 0) AS total_quantity,
        COALESCE(SUM(CASE WHEN quantity <= :threshold THEN 1 ELSE 0 END), 0) AS low_stock_items,
        COALESCE(SUM(cost * quantity), 0) AS recorded_stock_cost FROM inventory""", {"threshold": threshold})
    return {
        "summary": summary,
        "financial": financial,
        "payment_modes": modes,
        "memberships": {"status": membership_status, "by_plan": by_plan,
                        "subscriptions_by_month": subscriptions, "expiring": expiring},
        "members": {"by_gender": genders, "by_trainer": trainers,
                    "registration_timeline": {"available": False,
                     "reason": "The members table has no registration or created date."}},
        "inventory": {**inventory, "low_stock_threshold": threshold,
                       "by_category": inventory_categories, "low_stock": low_stock,
                       "purchase_expenditure_note": "Recorded stock cost is cost × current quantity; it is an inventory valuation, not period cash expenditure, and is excluded from expenses and profit."},
        "calculation_notes": {
            "revenue": "Sum of recorded payments.amount, counted once per payment.",
            "expenses": "Sum of expenses.amount plus expenses.bonus, counted once per expense.",
            "profit": "Recorded payments less recorded expenses including bonuses; inventory cost is excluded.",
            "active_members": "Members with a current subscription whose membership_status is Active; start and end dates are respected.",
        },
    }


REPORTS = {
    "daily-revenue": ("Daily revenue", "Recorded payments grouped by payment date", """SELECT payment_date AS date, COUNT(*) AS payment_count, COALESCE(SUM(amount),0) AS revenue FROM payments WHERE (:date_from IS NULL OR payment_date >= :date_from) AND (:date_to IS NULL OR payment_date <= :date_to) GROUP BY payment_date ORDER BY payment_date"""),
    "monthly-revenue": ("Monthly revenue", "Recorded payments grouped by month", """SELECT DATE_FORMAT(payment_date,'%Y-%m') AS month, COUNT(*) AS payment_count, COALESCE(SUM(amount),0) AS revenue FROM payments WHERE (:date_from IS NULL OR payment_date >= :date_from) AND (:date_to IS NULL OR payment_date <= :date_to) GROUP BY DATE_FORMAT(payment_date,'%Y-%m') ORDER BY month"""),
    "monthly-expenses": ("Monthly expenses", "Expense amount plus bonus, grouped by payment month", """SELECT DATE_FORMAT(payment_date,'%Y-%m') AS month, COUNT(*) AS expense_count, COALESCE(SUM(COALESCE(amount,0)+COALESCE(bonus,0)),0) AS expenses FROM expenses WHERE (:date_from IS NULL OR payment_date >= :date_from) AND (:date_to IS NULL OR payment_date <= :date_to) GROUP BY DATE_FORMAT(payment_date,'%Y-%m') ORDER BY month"""),
    "profit-loss": ("Profit and loss", "Recorded payment revenue less expenses including bonuses", """SELECT activity_month AS month, SUM(revenue) AS revenue, SUM(expenses) AS expenses, SUM(revenue)-SUM(expenses) AS profit FROM (SELECT DATE_FORMAT(payment_date,'%Y-%m') AS activity_month, SUM(amount) AS revenue, 0 AS expenses FROM payments WHERE (:date_from IS NULL OR payment_date >= :date_from) AND (:date_to IS NULL OR payment_date <= :date_to) GROUP BY DATE_FORMAT(payment_date,'%Y-%m') UNION ALL SELECT DATE_FORMAT(payment_date,'%Y-%m') AS activity_month, 0 AS revenue, SUM(COALESCE(amount,0)+COALESCE(bonus,0)) AS expenses FROM expenses WHERE (:date_from IS NULL OR payment_date >= :date_from) AND (:date_to IS NULL OR payment_date <= :date_to) GROUP BY DATE_FORMAT(payment_date,'%Y-%m')) movements GROUP BY activity_month ORDER BY activity_month"""),
    "memberships": ("Membership report", "Subscription counts by plan and effective status; active rows past end date are reported expired", """SELECT mp.plan_id, CASE WHEN LOWER(ms.membership_status)='active' AND ms.end_date<CURRENT_DATE THEN 'Expired' WHEN LOWER(ms.membership_status)='active' THEN 'Active' ELSE COALESCE(ms.membership_status,'Unspecified') END AS status, COUNT(*) AS subscriptions, SUM(CASE WHEN ms.end_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY) AND LOWER(ms.membership_status)='active' THEN 1 ELSE 0 END) AS expiring_within_seven_days FROM members_plans ms LEFT JOIN membership_plans mp ON mp.plan_id=ms.plan_id WHERE (:date_from IS NULL OR ms.start_date >= :date_from) AND (:date_to IS NULL OR ms.start_date <= :date_to) GROUP BY mp.plan_id,status ORDER BY mp.plan_id,status"""),
    "payment-modes": ("Payment mode report", "Payments grouped by stored payment mode", """SELECT COALESCE(payment_mode,'Unspecified') AS payment_mode, COUNT(*) AS payment_count, COALESCE(SUM(amount),0) AS revenue FROM payments WHERE (:date_from IS NULL OR payment_date >= :date_from) AND (:date_to IS NULL OR payment_date <= :date_to) GROUP BY payment_mode ORDER BY revenue DESC"""),
    "trainer-expenses": ("Trainer expense report", "Expense records explicitly linked to trainers; amount includes bonus", """SELECT e.trainer_id, COALESCE(t.trainer_name,'Unknown trainer') AS trainer_name, COUNT(*) AS expense_count, COALESCE(SUM(COALESCE(e.amount,0)+COALESCE(e.bonus,0)),0) AS expenses FROM expenses e LEFT JOIN gym_trainers t ON t.employee_id=e.trainer_id WHERE e.trainer_id IS NOT NULL AND (:date_from IS NULL OR e.payment_date >= :date_from) AND (:date_to IS NULL OR e.payment_date <= :date_to) GROUP BY e.trainer_id,t.trainer_name ORDER BY expenses DESC"""),
    "inventory-expenses": ("Inventory-linked expense report", "Expense records linked to inventory; stock purchase cost is not inferred from inventory records", """SELECT e.inventory_id, COALESCE(i.item_name,'Unknown inventory item') AS item_name, COUNT(*) AS expense_count, COALESCE(SUM(COALESCE(e.amount,0)+COALESCE(e.bonus,0)),0) AS expenses FROM expenses e LEFT JOIN inventory i ON i.inventory_id=e.inventory_id WHERE e.inventory_id IS NOT NULL AND (:date_from IS NULL OR e.payment_date >= :date_from) AND (:date_to IS NULL OR e.payment_date <= :date_to) GROUP BY e.inventory_id,i.item_name ORDER BY expenses DESC"""),
}


def report(db: Session, report_type: str, date_from, date_to):
    title, description, query = REPORTS[report_type]
    rows = _rows(db, query, {"date_from": date_from, "date_to": date_to})
    return {"report_type": report_type, "title": title, "description": description,
            "date_from": date_from, "date_to": date_to, "rows": rows}
