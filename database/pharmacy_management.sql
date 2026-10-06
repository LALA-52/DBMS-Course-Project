-- =====================================================================
-- Pharmacy Prescription & Medicine Stock Management System
-- DBMS Course Project - Presentation III
-- Database Schema & Initial Seed Data
-- =====================================================================

CREATE DATABASE IF NOT EXISTS pharmacy_management;
USE pharmacy_management;

-- ---------------------------------------------------------------------
-- 1. Table: medicines
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS medicines;
DROP TABLE IF EXISTS patients;

CREATE TABLE medicines (
    medicine_id INT PRIMARY KEY AUTO_INCREMENT,
    medicine_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    manufacturer VARCHAR(100),
    batch_number VARCHAR(50),
    expiry_date DATE,
    quantity INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. Table: patients
-- ---------------------------------------------------------------------
CREATE TABLE patients (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_name VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(20),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 3. Table: prescriptions
-- ---------------------------------------------------------------------
CREATE TABLE prescriptions (
    prescription_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    medicine_id INT NOT NULL,
    prescription_date DATE NOT NULL,
    dosage VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    doctor_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- Seed Data: medicines
-- ---------------------------------------------------------------------
INSERT INTO medicines (medicine_name, category, manufacturer, batch_number, expiry_date, quantity, unit_price) VALUES
('Amoxicillin 500mg', 'Antibiotic', 'GlaxoSmithKline', 'AMX-2024-01', '2027-08-15', 120, 18.50),
('Ibuprofen 400mg', 'Analgesic / NSAID', 'Abbott Healthcare', 'IBU-2024-88', '2026-11-30', 85, 12.00),
('Metformin 850mg', 'Antidiabetic', 'Sun Pharma', 'MET-2024-19', '2027-05-20', 15, 8.75),
('Atorvastatin 20mg', 'Cardiovascular', 'Cipla Ltd', 'ATV-2024-04', '2027-12-10', 9, 22.00),
('Azithromycin 500mg', 'Antibiotic', 'Pfizer', 'AZT-2024-77', '2026-09-18', 45, 35.00),
('Cetirizine 10mg', 'Antihistamine', 'Dr. Reddys', 'CTZ-2024-32', '2028-03-25', 180, 5.50),
('Omeprazole 20mg', 'Antacid / PPI', 'AstraZeneca', 'OMP-2024-11', '2027-01-14', 6, 15.25),
('Pantoprazole 40mg', 'Antacid / PPI', 'Torrent Pharma', 'PAN-2024-90', '2027-07-22', 75, 16.50),
('Ciprofloxacin 500mg', 'Antibiotic', 'Bayer', 'CIP-2024-43', '2026-10-05', 4, 28.00),
('Montelukast 10mg', 'Respiratory', 'Lupin Ltd', 'MNT-2024-65', '2028-02-18', 60, 24.50);

-- ---------------------------------------------------------------------
-- Seed Data: patients
-- ---------------------------------------------------------------------
INSERT INTO patients (patient_name, age, gender, phone) VALUES
('John Doe', 42, 'Male', '+1-555-0143'),
('Sarah Jenkins', 29, 'Female', '+1-555-0188'),
('Robert Chen', 65, 'Male', '+1-555-0192'),
('Emily Watson', 34, 'Female', '+1-555-0105'),
('Michael Brown', 51, 'Male', '+1-555-0164'),
('Amina Al-Mansoor', 38, 'Female', '+1-555-0131'),
('David Miller', 72, 'Male', '+1-555-0177');

-- ---------------------------------------------------------------------
-- Seed Data: prescriptions
-- ---------------------------------------------------------------------
INSERT INTO prescriptions (patient_id, medicine_id, prescription_date, dosage, quantity, doctor_name) VALUES
(1, 1, '2026-09-20', '1 capsule twice daily after meals', 14, 'Dr. Alice Carter (MD, Internal Med)'),
(2, 6, '2026-09-22', '1 tablet at bedtime', 10, 'Dr. Alice Carter (MD, Internal Med)'),
(3, 3, '2026-09-25', '1 tablet daily with morning meal', 30, 'Dr. Marcus Vance (Endocrinologist)'),
(3, 4, '2026-09-25', '1 tablet daily at night', 30, 'Dr. Gregory House (Cardiologist)'),
(4, 2, '2026-09-28', '1 tablet as needed for pain (max 3/day)', 15, 'Dr. Lisa Cuddy (General Physician)'),
(5, 7, '2026-10-01', '1 capsule before breakfast', 14, 'Dr. James Wilson (Gastroenterologist)'),
(6, 10, '2026-10-03', '1 tablet daily evening', 20, 'Dr. Eric Foreman (Pulmonologist)');

-- ---------------------------------------------------------------------
-- Useful Analytical & Verification Queries (Demonstration Reference)
-- ---------------------------------------------------------------------

-- View all prescriptions with Patient & Medicine details (JOIN)
-- SELECT 
--     pr.prescription_id,
--     p.patient_name,
--     p.phone,
--     m.medicine_name,
--     m.batch_number,
--     pr.prescription_date,
--     pr.dosage,
--     pr.quantity,
--     pr.doctor_name
-- FROM prescriptions pr
-- JOIN patients p ON pr.patient_id = p.patient_id
-- JOIN medicines m ON pr.medicine_id = m.medicine_id
-- ORDER BY pr.prescription_id DESC;

-- Identify Low Stock Medicines (Quantity <= 10)
-- SELECT medicine_id, medicine_name, quantity, unit_price, expiry_date 
-- FROM medicines 
-- WHERE quantity <= 10 
-- ORDER BY quantity ASC;
