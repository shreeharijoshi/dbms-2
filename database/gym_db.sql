-- ============================================================
-- IRONCORE GYM MANAGEMENT SYSTEM
-- Database Setup and Sample Data
-- ============================================================

-- DATABASE
CREATE DATABASE IF NOT EXISTS gym_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE gym_db;

-- ============================================================
-- 4. GYM TRAINERS
-- ============================================================

CREATE TABLE IF NOT EXISTS gym_trainers (
    employee_id VARCHAR(20) PRIMARY KEY,
    trainer_name VARCHAR(100),
    dob DATE,
    gender VARCHAR(10),
    height DOUBLE,
    weight DOUBLE,
    speciality VARCHAR(100),
    qualification VARCHAR(100),
    shift VARCHAR(20)
);

INSERT INTO gym_trainers
(employee_id, trainer_name, dob, gender, height, weight, speciality, qualification, shift)
VALUES
('TRN1199401', 'Amit Deshmukh', '1994-05-18', 'Male', 178, 82, 'Strength Training', 'ACE Certified', 'Morning'),
('TRN1199602', 'Sneha Patil', '1996-11-09', 'Female', 165, 58, 'Weight Loss', 'NASM CPT', 'Evening'),
('TRN1199203', 'Rohan Kulkarni', '1992-03-27', 'Male', 181, 86, 'Powerlifting', 'NSCA CSCS', 'Morning'),
('TRN1199504', 'Neha Sharma', '1995-08-14', 'Female', 168, 61, 'Functional Training', 'K11 Fitness Academy', 'Evening'),
('TRN1200105', 'Vikram Singh', '1990-07-21', 'Male', 184, 90, 'Bodybuilding', 'ISSA Certified', 'Morning'),
('TRN1198806', 'Pooja Joshi', '1988-12-03', 'Female', 163, 60, 'Yoga and Mobility', 'RYT 500', 'Evening'),
('TRN1199107', 'Manish Verma', '1991-04-16', 'Male', 177, 79, 'HIIT Training', 'ACE Certified', 'Afternoon');
-- ============================================================
-- 1. MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS members (
    member_id VARCHAR(20) PRIMARY KEY,
    member_name VARCHAR(100),
    gender VARCHAR(10),
    height DOUBLE,
    weight DOUBLE,
    contact VARCHAR(15),
    dob DATE,
    bmi DOUBLE GENERATED ALWAYS AS
        (ROUND(weight / POWER(height / 100, 2), 2)) STORED,
    PT VARCHAR(20),
    member_status VARCHAR(10) NOT NULL DEFAULT 'Active',
    CONSTRAINT fk_members_trainer
        FOREIGN KEY (PT)
        REFERENCES gym_trainers(employee_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

INSERT INTO members
(member_id, member_name, gender, height, weight, contact, dob, PT)
VALUES
('MEM1199901', 'Rahul Sharma', 'Male', 176.3, 84.3, '9876643340', '1999-09-23', NULL),
('MEM1200802', 'Shreehari Joshi', 'Male', 175.0, 69.5, '9766554433', '2008-01-15', NULL),
('MEM1200703', 'Tanishq Kale', 'Male', 169.0, 60.4, '9875743214', '2007-10-30', NULL),
('MEM1200704', 'Aditya Kutwal', 'Male', 172.0, 88.4, '9465890214', '2007-03-03', 'TRN1199401'),

('MEM1200505', 'Arjun Mehta', 'Male', 180.0, 78.5, '9823456712', '2005-06-12', 'TRN1199203'),
('MEM1200606', 'Kavya Nair', 'Female', 162.0, 57.2, '9765432189', '2006-02-28', 'TRN1199602'),
('MEM1200407', 'Vivek Shah', 'Male', 175.5, 91.0, '9898765432', '2004-11-05', 'TRN1199401'),
('MEM1200708', 'Ishita Kulkarni', 'Female', 160.0, 52.8, '9812345678', '2007-07-19', NULL),
('MEM1200309', 'Karan Joshi', 'Male', 182.0, 95.4, '9934567812', '2003-09-14', 'TRN1199504'),
('MEM1200810', 'Ananya Desai', 'Female', 167.0, 64.3, '9876123450', '2008-04-22', NULL),

('MEM1200811', 'Aarav Malhotra', 'Male', 174.0, 72.5, '9812345611', '2008-06-14', NULL),
('MEM1200512', 'Meera Iyer', 'Female', 161.0, 55.8, '9823456712', '2005-09-22', 'TRN1199602'),
('MEM1200313', 'Siddharth Rao', 'Male', 179.0, 87.2, '9834567813', '2003-12-08', 'TRN1199401'),
('MEM1200614', 'Diya Kapoor', 'Female', 165.0, 61.4, '9845678914', '2006-04-17', NULL),
('MEM1200215', 'Nikhil Bansal', 'Male', 181.0, 94.6, '9856789015', '2002-08-29', 'TRN1199504'),
('MEM1200716', 'Riya Menon', 'Female', 158.0, 52.3, '9867890116', '2007-11-03', 'TRN1198806'),
('MEM1200417', 'Yash Thakur', 'Male', 176.0, 81.7, '9878901217', '2004-05-26', NULL),
('MEM1200818', 'Sara Khan', 'Female', 164.0, 59.6, '9889012318', '2008-01-11', 'TRN1199602'),
('MEM1200519', 'Omkar Patil', 'Male', 170.0, 76.8, '9890123419', '2005-07-30', 'TRN1199203'),
('MEM1200620', 'Aditi Joshi', 'Female', 167.0, 63.2, '9901234520', '2006-10-19', NULL),

('MEM1200321', 'Harsh Vardhan', 'Male', 183.0, 89.5, '9912345621', '2003-03-15', 'TRN1200105'),
('MEM1200722', 'Anushka Desai', 'Female', 160.0, 54.7, '9923456722', '2007-05-21', NULL),
('MEM1200123', 'Kunal Verma', 'Male', 177.0, 83.6, '9934567823', '2001-09-07', 'TRN1199401'),
('MEM1200424', 'Isha Kulkarni', 'Female', 163.0, 57.9, '9945678924', '2004-02-13', 'TRN1198806'),
('MEM1200625', 'Ritvik Shah', 'Male', 172.0, 79.3, '9956789025', '2006-12-01', NULL),
('MEM1200226', 'Tanvi Nair', 'Female', 166.0, 62.1, '9967890126', '2002-06-25', 'TRN1199602'),
('MEM1200527', 'Abhishek Sinha', 'Male', 180.0, 91.8, '9978901227', '2005-01-18', 'TRN1199203'),
('MEM1200828', 'Pallavi Rao', 'Female', 159.0, 51.6, '9989012328', '2008-08-09', NULL),
('MEM1200329', 'Rishabh Jain', 'Male', 175.0, 85.9, '9990123429', '2003-10-27', 'TRN1199504'),
('MEM1200430', 'Nandini Shetty', 'Female', 162.0, 58.5, '9801234530', '2004-07-12', 'TRN1198806'),

('MEM1200131', 'Aditya Rao', 'Male', 178.0, 80.4, '9812345631', '2001-04-06', NULL),
('MEM1200532', 'Manya Gupta', 'Female', 165.0, 60.8, '9823456732', '2005-11-24', 'TRN1199602'),
('MEM1200733', 'Dev Patel', 'Male', 171.0, 73.6, '9834567833', '2007-02-16', NULL),
('MEM1200234', 'Sana Mirza', 'Female', 168.0, 67.2, '9845678934', '2002-09-30', 'TRN1198806'),
('MEM1200435', 'Manav Agarwal', 'Male', 182.0, 96.1, '9856789035', '2004-12-05', 'TRN1200105'),
('MEM1200636', 'Shruti Naik', 'Female', 157.0, 53.9, '9867890136', '2006-03-28', NULL),
('MEM1200337', 'Vishal Yadav', 'Male', 176.0, 88.3, '9878901237', '2003-06-11', 'TRN1199401'),
('MEM1200838', 'Kiara Arora', 'Female', 163.0, 56.4, '9889012338', '2008-09-17', 'TRN1199602'),
('MEM1200139', 'Rahul Nambiar', 'Male', 173.0, 77.5, '9890123439', '2001-12-22', NULL),
('MEM1200540', 'Pooja Reddy', 'Female', 160.0, 59.1, '9901234540', '2005-05-09', 'TRN1198806'),

('MEM1200741', 'Aman Khanna', 'Male', 179.0, 84.8, '9912345641', '2007-08-13', 'TRN1199203'),
('MEM1200242', 'Neha Arora', 'Female', 164.0, 61.7, '9923456742', '2002-11-06', NULL),
('MEM1200443', 'Saurabh Mishra', 'Male', 181.0, 92.4, '9934567843', '2004-03-19', 'TRN1200105'),
('MEM1200644', 'Simran Kaur', 'Female', 159.0, 55.2, '9945678944', '2006-07-23', 'TRN1199602'),
('MEM1200345', 'Raj Malhotra', 'Male', 177.0, 86.7, '9956789045', '2003-01-29', NULL),
('MEM1200846', 'Ayesha Khan', 'Female', 166.0, 63.5, '9967890146', '2008-05-16', 'TRN1198806'),
('MEM1200147', 'Varun Deshpande', 'Male', 174.0, 78.9, '9978901247', '2001-08-04', 'TRN1199401'),
('MEM1200548', 'Snehal Patil', 'Female', 162.0, 57.3, '9989012348', '2005-10-12', NULL),
('MEM1200749', 'Akash Joshi', 'Male', 180.0, 90.2, '9990123449', '2007-04-25', 'TRN1199203'),
('MEM1200650', 'Ira Mukherjee', 'Female', 165.0, 60.1, '9801234550', '2006-09-08', NULL);


-- ============================================================
-- 2. MEMBERSHIP PLANS
-- ============================================================

CREATE TABLE IF NOT EXISTS membership_plans (
    plan_id VARCHAR(20) PRIMARY KEY,
    duration INT,
    price DOUBLE,
    group_discount DOUBLE,
    seasonal_discount DOUBLE
);

INSERT INTO membership_plans
(plan_id, duration, price, group_discount, seasonal_discount)
VALUES
('PLN101', 1, 2000, 10.0, 12.5),
('PLN103', 3, 5000, 12.5, 15.0),
('PLN106', 6, 8000, 15.0, 17.5),
('PLN112', 12, 12000, 17.5, 20.0);


-- ============================================================
-- 3. MEMBER MEMBERSHIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS members_plans (
    membership_id VARCHAR(20) PRIMARY KEY,
    member_id VARCHAR(20),
    plan_id VARCHAR(20),
    start_date DATE,
    end_date DATE,
    membership_status VARCHAR(20),

    FOREIGN KEY (member_id) REFERENCES members(member_id),
    FOREIGN KEY (plan_id) REFERENCES membership_plans(plan_id)
);

INSERT INTO members_plans
(membership_id, member_id, plan_id, start_date, end_date, membership_status)
VALUES
('MSH1199901', 'MEM1199901', 'PLN112', '2026-01-01', '2026-12-31', 'Active'),
('MSH1200802', 'MEM1200802', 'PLN103', '2026-05-01', '2026-07-31', 'Expired'),
('MSH1200703', 'MEM1200703', 'PLN106', '2026-04-15', '2026-10-14', 'Active'),
('MSH1200704', 'MEM1200704', 'PLN101', '2026-08-01', '2026-08-31', 'Active'),

('MSH1200505', 'MEM1200505', 'PLN106', '2026-02-01', '2026-07-31', 'Expired'),
('MSH1200606', 'MEM1200606', 'PLN112', '2026-03-01', '2027-02-28', 'Active'),
('MSH1200407', 'MEM1200407', 'PLN103', '2026-06-01', '2026-08-31', 'Expired'),
('MSH1200708', 'MEM1200708', 'PLN101', '2026-08-10', '2026-09-09', 'Active'),
('MSH1200309', 'MEM1200309', 'PLN112', '2026-01-15', '2027-01-14', 'Active'),
('MSH1200810', 'MEM1200810', 'PLN106', '2026-05-15', '2026-11-14', 'Active'),

('MSH1200811', 'MEM1200811', 'PLN103', '2026-06-01', '2026-08-31', 'Expired'),
('MSH1200512', 'MEM1200512', 'PLN112', '2026-01-15', '2027-01-14', 'Active'),
('MSH1200313', 'MEM1200313', 'PLN106', '2026-04-01', '2026-09-30', 'Active'),
('MSH1200614', 'MEM1200614', 'PLN101', '2026-08-05', '2026-09-04', 'Active'),
('MSH1200215', 'MEM1200215', 'PLN112', '2025-12-01', '2026-11-30', 'Active'),
('MSH1200716', 'MEM1200716', 'PLN103', '2026-03-15', '2026-06-14', 'Expired'),
('MSH1200417', 'MEM1200417', 'PLN106', '2026-05-01', '2026-10-31', 'Active'),
('MSH1200818', 'MEM1200818', 'PLN101', '2026-07-20', '2026-08-19', 'Expired'),
('MSH1200519', 'MEM1200519', 'PLN106', '2026-06-15', '2026-12-14', 'Active'),
('MSH1200620', 'MEM1200620', 'PLN103', '2026-04-10', '2026-07-09', 'Expired'),

('MSH1200321', 'MEM1200321', 'PLN112', '2026-02-01', '2027-01-31', 'Active'),
('MSH1200722', 'MEM1200722', 'PLN101', '2026-08-12', '2026-09-11', 'Active'),
('MSH1200123', 'MEM1200123', 'PLN106', '2026-01-10', '2026-07-09', 'Expired'),
('MSH1200424', 'MEM1200424', 'PLN103', '2026-06-01', '2026-08-31', 'Expired'),
('MSH1200625', 'MEM1200625', 'PLN112', '2026-03-01', '2027-02-28', 'Active'),
('MSH1200226', 'MEM1200226', 'PLN106', '2026-05-15', '2026-11-14', 'Active'),
('MSH1200527', 'MEM1200527', 'PLN112', '2026-01-20', '2027-01-19', 'Active'),
('MSH1200828', 'MEM1200828', 'PLN101', '2026-08-15', '2026-09-14', 'Active'),
('MSH1200329', 'MEM1200329', 'PLN103', '2026-04-01', '2026-06-30', 'Expired'),
('MSH1200430', 'MEM1200430', 'PLN106', '2026-07-01', '2026-12-31', 'Active'),

('MSH1200131', 'MEM1200131', 'PLN112', '2026-01-05', '2027-01-04', 'Active'),
('MSH1200532', 'MEM1200532', 'PLN103', '2026-05-01', '2026-07-31', 'Expired'),
('MSH1200733', 'MEM1200733', 'PLN101', '2026-08-01', '2026-08-31', 'Active'),
('MSH1200234', 'MEM1200234', 'PLN106', '2026-02-15', '2026-08-14', 'Expired'),
('MSH1200435', 'MEM1200435', 'PLN112', '2026-04-01', '2027-03-31', 'Active'),
('MSH1200636', 'MEM1200636', 'PLN103', '2026-06-15', '2026-09-14', 'Active'),
('MSH1200337', 'MEM1200337', 'PLN106', '2026-03-01', '2026-08-31', 'Expired'),
('MSH1200838', 'MEM1200838', 'PLN101', '2026-08-10', '2026-09-09', 'Active'),
('MSH1200139', 'MEM1200139', 'PLN112', '2026-02-01', '2027-01-31', 'Active'),
('MSH1200540', 'MEM1200540', 'PLN103', '2026-04-15', '2026-07-14', 'Expired'),

('MSH1200741', 'MEM1200741', 'PLN106', '2026-05-01', '2026-10-31', 'Active'),
('MSH1200242', 'MEM1200242', 'PLN101', '2026-07-25', '2026-08-24', 'Expired'),
('MSH1200443', 'MEM1200443', 'PLN112', '2026-01-15', '2027-01-14', 'Active'),
('MSH1200644', 'MEM1200644', 'PLN103', '2026-06-01', '2026-08-31', 'Active'),
('MSH1200345', 'MEM1200345', 'PLN106', '2026-03-15', '2026-09-14', 'Active'),
('MSH1200846', 'MEM1200846', 'PLN101', '2026-08-18', '2026-09-17', 'Active'),
('MSH1200147', 'MEM1200147', 'PLN112', '2026-02-10', '2027-02-09', 'Active'),
('MSH1200548', 'MEM1200548', 'PLN103', '2026-05-15', '2026-08-14', 'Expired'),
('MSH1200749', 'MEM1200749', 'PLN106', '2026-04-01', '2026-09-30', 'Active'),
('MSH1200650', 'MEM1200650', 'PLN112', '2026-06-01', '2027-05-31', 'Active');

-- ============================================================
-- 5. INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id VARCHAR(20) PRIMARY KEY,
    item_name VARCHAR(100),
    category VARCHAR(50),
    quantity INT,
    cost DOUBLE,
    purchase_date DATE,
    inventory_status VARCHAR(30)
);

INSERT INTO inventory
(inventory_id, item_name, category, quantity, cost, purchase_date, inventory_status)
VALUES
('INV101', 'Olympic Barbell', 'Equipment', 8, 24000, '2024-01-15', 'Working'),
('INV102', 'Adjustable Bench', 'Equipment', 6, 18000, '2024-02-10', 'Working'),
('INV103', 'Wall Mirror', 'Mirror', 12, 36000, '2023-11-20', 'Working'),
('INV104', 'LED Ceiling Lights', 'Lighting', 20, 30000, '2023-12-05', 'Under Maintenance'),
('INV105', 'Dumbbell Set', 'Equipment', 2, 45000, '2024-03-12', 'Working'),
('INV106', 'Treadmill', 'Equipment', 4, 280000, '2024-04-20', 'Working'),
('INV107', 'Exercise Mat', 'Equipment', 25, 25000, '2024-05-05', 'Working'),
('INV108', 'Ceiling Fan', 'Lighting', 8, 32000, '2023-10-15', 'Working'),
('INV109', 'Reception Desk', 'Furniture', 1, 45000, '2023-09-10', 'Working'),
('INV110', 'Storage Rack', 'Furniture', 4, 28000, '2024-01-25', 'Under Maintenance'),
('INV111', 'Kettlebell Set', 'Equipment', 12, 36000, '2024-06-18', 'Working'),
('INV112', 'Cable Crossover Machine', 'Equipment', 1, 145000, '2024-07-05', 'Working'),
('INV113', 'Leg Press Machine', 'Equipment', 1, 175000, '2024-07-22', 'Working'),
('INV114', 'Squat Rack', 'Equipment', 4, 85000, '2024-08-10', 'Working'),
('INV115', 'EZ Curl Bar', 'Equipment', 6, 18000, '2024-08-25', 'Working'),
('INV116', 'Resistance Bands Set', 'Equipment', 20, 12000, '2024-09-14', 'Working'),
('INV117', 'Foam Roller', 'Equipment', 15, 9000, '2024-10-03', 'Working'),
('INV118', 'Skipping Rope', 'Equipment', 20, 6000, '2024-10-20', 'Working'),
('INV119', 'Air Bike', 'Cardio', 2, 110000, '2024-11-12', 'Working'),
('INV120', 'Rowing Machine', 'Cardio', 2, 160000, '2024-12-08', 'Working'),
('INV121', 'Exercise Ball', 'Equipment', 10, 10000, '2025-01-15', 'Working'),
('INV122', 'Weight Plates Set', 'Equipment', 8, 64000, '2025-02-10', 'Working'),
('INV123', 'Lat Pulldown Machine', 'Equipment', 1, 125000, '2025-03-18', 'Working'),
('INV124', 'Preacher Curl Bench', 'Equipment', 2, 30000, '2025-04-06', 'Working'),
('INV125', 'Water Dispenser', 'Appliance', 2, 18000, '2025-05-11', 'Working'),
('INV126', 'Reception Chairs', 'Furniture', 6, 24000, '2025-06-20', 'Working'),
('INV127', 'Locker Unit', 'Furniture', 4, 72000, '2025-07-15', 'Working'),
('INV128', 'Bluetooth Speakers', 'Electronics', 2, 28000, '2025-08-09', 'Working'),
('INV129', 'Air Conditioner', 'Appliance', 3, 165000, '2025-09-17', 'Under Maintenance'),
('INV130', 'First Aid Kit', 'Safety', 5, 7500, '2025-10-05', 'Working');


-- ============================================================
-- 6. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    payment_id VARCHAR(20) PRIMARY KEY,
    member_id VARCHAR(20),
    plan_id VARCHAR(20),
    amount DOUBLE,
    payment_date DATE,
    payment_mode ENUM('Cash', 'Card', 'UPI', 'Bank Transfer'),

    FOREIGN KEY (member_id) REFERENCES members(member_id),
    FOREIGN KEY (plan_id) REFERENCES membership_plans(plan_id)
);

INSERT INTO payments
(payment_id, member_id, plan_id, amount, payment_date, payment_mode)
VALUES
('PAY202601', 'MEM1199901', 'PLN112', 12000, '2026-01-01', 'UPI'),
('PAY202602', 'MEM1200802', 'PLN103', 5000, '2026-05-01', 'Card'),
('PAY202603', 'MEM1200703', 'PLN106', 8000, '2026-04-15', 'Cash'),
('PAY202604', 'MEM1200704', 'PLN101', 2000, '2026-08-01', 'UPI'),

('PAY202605', 'MEM1200505', 'PLN106', 8000, '2026-02-01', 'Card'),
('PAY202606', 'MEM1200606', 'PLN112', 12000, '2026-03-01', 'UPI'),
('PAY202607', 'MEM1200407', 'PLN103', 5000, '2026-06-01', 'Cash'),
('PAY202608', 'MEM1200708', 'PLN101', 2000, '2026-08-10', 'UPI'),
('PAY202609', 'MEM1200309', 'PLN112', 12000, '2026-01-15', 'Bank Transfer'),
('PAY202610', 'MEM1200810', 'PLN106', 8000, '2026-05-15', 'Card'),

('PAY202611', 'MEM1200811', 'PLN103', 5000, '2026-06-01', 'UPI'),
('PAY202612', 'MEM1200512', 'PLN112', 12000, '2026-01-15', 'Card'),
('PAY202613', 'MEM1200313', 'PLN106', 8000, '2026-04-01', 'Bank Transfer'),
('PAY202614', 'MEM1200614', 'PLN101', 2000, '2026-08-05', 'UPI'),
('PAY202615', 'MEM1200215', 'PLN112', 12000, '2025-12-01', 'Card'),
('PAY202616', 'MEM1200716', 'PLN103', 5000, '2026-03-15', 'Cash'),
('PAY202617', 'MEM1200417', 'PLN106', 8000, '2026-05-01', 'UPI'),
('PAY202618', 'MEM1200818', 'PLN101', 2000, '2026-07-20', 'Cash'),
('PAY202619', 'MEM1200519', 'PLN106', 8000, '2026-06-15', 'Card'),
('PAY202620', 'MEM1200620', 'PLN103', 5000, '2026-04-10', 'UPI'),

('PAY202621', 'MEM1200321', 'PLN112', 12000, '2026-02-01', 'Bank Transfer'),
('PAY202622', 'MEM1200722', 'PLN101', 2000, '2026-08-12', 'UPI'),
('PAY202623', 'MEM1200123', 'PLN106', 8000, '2026-01-10', 'Card'),
('PAY202624', 'MEM1200424', 'PLN103', 5000, '2026-06-01', 'Cash'),
('PAY202625', 'MEM1200625', 'PLN112', 12000, '2026-03-01', 'UPI'),
('PAY202626', 'MEM1200226', 'PLN106', 8000, '2026-05-15', 'Card'),
('PAY202627', 'MEM1200527', 'PLN112', 12000, '2026-01-20', 'Bank Transfer'),
('PAY202628', 'MEM1200828', 'PLN101', 2000, '2026-08-15', 'UPI'),
('PAY202629', 'MEM1200329', 'PLN103', 5000, '2026-04-01', 'Cash'),
('PAY202630', 'MEM1200430', 'PLN106', 8000, '2026-07-01', 'Card'),

('PAY202631', 'MEM1200131', 'PLN112', 12000, '2026-01-05', 'UPI'),
('PAY202632', 'MEM1200532', 'PLN103', 5000, '2026-05-01', 'Cash'),
('PAY202633', 'MEM1200733', 'PLN101', 2000, '2026-08-01', 'UPI'),
('PAY202634', 'MEM1200234', 'PLN106', 8000, '2026-02-15', 'Card'),
('PAY202635', 'MEM1200435', 'PLN112', 12000, '2026-04-01', 'Bank Transfer'),
('PAY202636', 'MEM1200636', 'PLN103', 5000, '2026-06-15', 'UPI'),
('PAY202637', 'MEM1200337', 'PLN106', 8000, '2026-03-01', 'Cash'),
('PAY202638', 'MEM1200838', 'PLN101', 2000, '2026-08-10', 'UPI'),
('PAY202639', 'MEM1200139', 'PLN112', 12000, '2026-02-01', 'Card'),
('PAY202640', 'MEM1200540', 'PLN103', 5000, '2026-04-15', 'Cash'),

('PAY202641', 'MEM1200741', 'PLN106', 8000, '2026-05-01', 'UPI'),
('PAY202642', 'MEM1200242', 'PLN101', 2000, '2026-07-25', 'Cash'),
('PAY202643', 'MEM1200443', 'PLN112', 12000, '2026-01-15', 'Bank Transfer'),
('PAY202644', 'MEM1200644', 'PLN103', 5000, '2026-06-01', 'Card'),
('PAY202645', 'MEM1200345', 'PLN106', 8000, '2026-03-15', 'UPI'),
('PAY202646', 'MEM1200846', 'PLN101', 2000, '2026-08-18', 'Cash'),
('PAY202647', 'MEM1200147', 'PLN112', 12000, '2026-02-10', 'Card'),
('PAY202648', 'MEM1200548', 'PLN103', 5000, '2026-05-15', 'UPI'),
('PAY202649', 'MEM1200749', 'PLN106', 8000, '2026-04-01', 'Bank Transfer'),
('PAY202650', 'MEM1200650', 'PLN112', 12000, '2026-06-01', 'UPI');


-- ============================================================
-- 7. MISCELLANEOUS EMPLOYEES
-- ============================================================

CREATE TABLE IF NOT EXISTS miscellaneous_employees (
    employee_id VARCHAR(20) PRIMARY KEY,
    employee_name VARCHAR(100),
    role VARCHAR(50)
);

INSERT INTO miscellaneous_employees
(employee_id, employee_name, role)
VALUES
('EMP1199301', 'Suresh Jadhav', 'Cleaner'),
('EMP1199801', 'Priya Mehta', 'Receptionist'),
('EMP1199001', 'Rakesh Pawar', 'Security Guard'),
('EMP1199501', 'Anita Kulkarni', 'Maintenance Staff'),
('EMP1198505', 'Mahesh Pawar', 'Cleaner'),
('EMP1199206', 'Riya Shah', 'Receptionist'),
('EMP1198907', 'Vijay More', 'Security Guard'),
('EMP1199708', 'Nitin Chavan', 'Maintenance Staff');


-- ============================================================
-- 8. EXPENSES
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
    expense_id VARCHAR(20) PRIMARY KEY,
    expense_type ENUM('Salary', 'Maintenance'),
    trainer_id VARCHAR(20),
    misc_employee_id VARCHAR(20),
    inventory_id VARCHAR(20),
    expense_month VARCHAR(20),
    amount DOUBLE,
    bonus DOUBLE,
    payment_date DATE,
    payment_mode ENUM('Cash', 'Card', 'UPI', 'Bank Transfer'),
    remarks VARCHAR(100),

    FOREIGN KEY (trainer_id) REFERENCES gym_trainers(employee_id),
    FOREIGN KEY (misc_employee_id) REFERENCES miscellaneous_employees(employee_id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id)
);

INSERT INTO expenses
(expense_id, expense_type, trainer_id, misc_employee_id, inventory_id,
 expense_month, amount, bonus, payment_date, payment_mode, remarks)
VALUES
('EXP202601', 'Salary', 'TRN1199401', NULL, NULL, '2026-01-01', 45000, 5000, '2026-01-31', 'Bank Transfer', 'Monthly salary'),
('EXP202602', 'Salary', 'TRN1199203', NULL, NULL, '2026-01-01', 48000, 7000, '2026-01-31', 'Bank Transfer', 'Monthly salary'),
('EXP202603', 'Maintenance', NULL, NULL, 'INV104', NULL, 3500, NULL, '2026-02-10', 'UPI', 'LED light replacement'),
('EXP202604', 'Maintenance', NULL, NULL, 'INV102', NULL, 2500, NULL, '2026-03-18', 'Cash', 'Bench upholstery repair'),

('EXP202605', 'Salary', 'TRN1199602', NULL, NULL, '2026-05-01', 42000, 3000, '2026-05-31', 'Bank Transfer', 'Monthly salary'),
('EXP202606', 'Salary', 'TRN1199203', NULL, NULL, '2026-05-01', 48000, 5000, '2026-05-31', 'Bank Transfer', 'Monthly salary'),
('EXP202607', 'Salary', 'TRN1200105', NULL, NULL, '2026-05-01', 50000, 6000, '2026-05-31', 'Bank Transfer', 'Monthly salary'),
('EXP202608', 'Salary', 'TRN1198806', NULL, NULL, '2026-05-01', 40000, 2500, '2026-05-31', 'Bank Transfer', 'Monthly salary'),

('EXP202609', 'Salary', NULL, 'EMP1198505', NULL, '2026-05-01', 18000, 1000, '2026-05-31', 'Bank Transfer', 'Monthly salary'),
('EXP202610', 'Salary', NULL, 'EMP1199206', NULL, '2026-05-01', 22000, 1500, '2026-05-31', 'Bank Transfer', 'Monthly salary'),

('EXP202611', 'Maintenance', NULL, NULL, 'INV106', NULL, 7500, NULL, '2026-06-12', 'UPI', 'Treadmill belt replacement'),
('EXP202612', 'Maintenance', NULL, NULL, 'INV110', NULL, 3000, NULL, '2026-06-20', 'Cash', 'Storage rack repair'),
('EXP202613', 'Maintenance', NULL, NULL, 'INV105', NULL, 4500, NULL, '2026-07-05', 'Card', 'Dumbbell handle repair'),
('EXP202614', 'Maintenance', NULL, NULL, 'INV108', NULL, 2200, NULL, '2026-07-18', 'UPI', 'Ceiling fan servicing');

USE gym_db;

-- ============================================================
-- END OF IRONCORE DATABASE SETUP
-- ============================================================