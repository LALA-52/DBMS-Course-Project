# Pharmacy Prescription and Medicine Stock Management System
## DBMS Course Project &bull; Presentation-III Live Demonstration

### 1. Project Overview
This project is a full-stack Database Management System (DBMS) designed for academic evaluation (Presentation-III). It demonstrates real relational database management, SQL schema enforcement, transaction handling (ACID properties), and CRUD operations against a live MySQL database.

Unlike a generic frontend mockup, every action in the dashboard directly issues SQL statements (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, and `START TRANSACTION...COMMIT`) via a Node.js/Express REST API and displays immediate database updates on the user interface.

---

### 2. Core DBMS Features
- **Live MySQL Integration**: Connects to local MySQL Server instance via connection pooling.
- **Full CRUD Operations**:
  - **CREATE / INSERT**: Add new medicines, patients, and prescriptions with SQL data-type validation.
  - **READ / VIEW**: Retrieve and display live database records with sorting and search filters.
  - **DELETE**: Delete records with confirmation modals and foreign key constraint error handling.
- **ACID Transaction & Stock Reduction**:
  - When a prescription is issued, the backend runs a database transaction:
    1. Validates that the requested quantity is available in `medicines`.
    2. Inserts the prescription row into `prescriptions`.
    3. Decrements the stock in `medicines` (`UPDATE medicines SET quantity = quantity - ?`).
    4. Commits the transaction or rolls back on insufficient stock or error.
- **Dedicated DBMS Operations Console**:
  - A special Presentation-III evaluation page with 3 clearly separated sections:
    - **Section A**: INSERT Record into any selected table with live SQL query preview and generated AUTO_INCREMENT ID.
    - **Section B**: DELETE Record from any selected table with safety confirmation.
    - **Section C**: VIEW Records with raw SQL query inspection and instant refresh.
- **Connection Health Monitor**:
  - Top header displays real-time MySQL connection state (Connected / Disconnected with host, port, and database name).

---

### 3. Technologies Used
- **Database**: MySQL 9.x / 26.x
- **Backend**: Node.js, Express.js, `mysql2/promise` (connection pooling), `dotenv`, `cors`
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React (clean icons)
- **API Architecture**: RESTful API with structured JSON responses and error codes

---

### 4. Database Schema (`pharmacy_management`)

#### Tables:
1. **`medicines`**:
   - `medicine_id`: `INT PRIMARY KEY AUTO_INCREMENT`
   - `medicine_name`: `VARCHAR(100) NOT NULL`
   - `category`: `VARCHAR(50)`
   - `manufacturer`: `VARCHAR(100)`
   - `batch_number`: `VARCHAR(50)`
   - `expiry_date`: `DATE`
   - `quantity`: `INT NOT NULL DEFAULT 0`
   - `unit_price`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00`
   - `created_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

2. **`patients`**:
   - `patient_id`: `INT PRIMARY KEY AUTO_INCREMENT`
   - `patient_name`: `VARCHAR(100) NOT NULL`
   - `age`: `INT`
   - `gender`: `VARCHAR(20)`
   - `phone`: `VARCHAR(20)`
   - `created_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

3. **`prescriptions`**:
   - `prescription_id`: `INT PRIMARY KEY AUTO_INCREMENT`
   - `patient_id`: `INT NOT NULL` (Foreign Key &rarr; `patients(patient_id)`)
   - `medicine_id`: `INT NOT NULL` (Foreign Key &rarr; `medicines(medicine_id)`)
   - `prescription_date`: `DATE NOT NULL`
   - `dosage`: `VARCHAR(100)`
   - `quantity`: `INT NOT NULL DEFAULT 1`
   - `doctor_name`: `VARCHAR(100)`
   - `created_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

### 5. Setup & Installation

#### Step 1: Database Initialization
1. Ensure your MySQL Server is running.
2. In MySQL Workbench or MySQL command line, run the script:
   ```sql
   source /path/to/Pharmacy/database/pharmacy_management.sql;
   ```
   *Alternatively, configure your `backend/.env` password first and run:*
   ```bash
   cd backend
   npm run init-db
   ```

#### Step 2: Backend Configuration
1. Open `backend/.env`.
2. Enter your MySQL root password and port:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_actual_mysql_password
   DB_NAME=pharmacy_management
   DB_PORT=2250
   ```
   *(Note: If your MySQL runs on default port 3306, set `DB_PORT=3306`)*

3. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
   Backend URL: `http://localhost:5000`

#### Step 3: Frontend Setup
1. Open a new terminal:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open your browser at: `http://localhost:3000` (or the Vite URL shown).

---

### 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | MySQL connection status, server uptime, database name |
| `GET` | `/api/dashboard` | Aggregated metrics (`COUNT(*)`, low stock counts, recent prescriptions) |
| `GET` | `/api/medicines` | View all medicines (supports `?search=` filter) |
| `POST` | `/api/medicines` | Insert new medicine into MySQL |
| `DELETE` | `/api/medicines/:id` | Delete medicine by ID from MySQL |
| `GET` | `/api/patients` | View all registered patients |
| `POST` | `/api/patients` | Insert new patient record into MySQL |
| `DELETE` | `/api/patients/:id` | Delete patient by ID |
| `GET` | `/api/prescriptions` | View prescriptions with relational `JOIN` on patients & medicines |
| `POST` | `/api/prescriptions` | Issue prescription with automatic stock decrement transaction |
| `DELETE` | `/api/prescriptions/:id`| Delete prescription record |
| `GET` | `/api/db-ops/records/:table` | View live records from any table |
| `POST` | `/api/db-ops/insert/:table` | Insert record into any table |
| `DELETE` | `/api/db-ops/delete/:table/:id` | Delete record from any table |

---

### 7. Step-by-Step Presentation-III Demonstration Walkthrough

When presenting to evaluators, follow this exact 8-step sequence:

1. **Step 1: System Overview & MySQL Status**
   - Open `http://localhost:3000`.
   - Point out the **MySQL Connected** green badge at the top right showing live connection to `pharmacy_management` database.
   - Show the aggregated database cards: Total Medicines, Total Patients, Total Prescriptions, and Low Stock Alert (all calculated via SQL queries).

2. **Step 2: Navigate to Medicines Page**
   - Click **Medicines** on the sidebar.
   - Show existing records queried live from the `medicines` table.

3. **Step 3: Perform Live INSERT Operation**
   - Click the **+ Add Medicine** button.
   - Click the **Autofill "Paracetamol 500mg"** demo button (or enter):
     - Medicine: `Paracetamol 500mg`
     - Category: `Analgesic`
     - Manufacturer: `Demo Pharma`
     - Batch: `DEMO001`
     - Expiry: `2028-12-31`
     - Quantity: `100`
     - Unit Price: `25.00`
   - Point out the SQL query preview box:
     ```sql
     INSERT INTO medicines (medicine_name, category, manufacturer, batch_number, expiry_date, quantity, unit_price)
     VALUES ('Paracetamol 500mg', 'Analgesic', 'Demo Pharma', 'DEMO001', '2028-12-31', 100, 25.00);
     ```
   - Click **Execute INSERT in MySQL**.

4. **Step 4: Verify Newly Inserted Record**
   - Show the success notification with the generated AUTO_INCREMENT ID.
   - Show the row highlighted in green at the top of the table with the `NEW` badge.
   - Return to the **Dashboard** and show that the "Total Medicines" count has incremented by 1.

5. **Step 5: Perform Live DELETE Operation**
   - Return to the **Medicines** page.
   - Click the red **Trash/Delete** button next to the newly inserted `Paracetamol 500mg` record.
   - Show the confirmation modal.
   - Confirm deletion. Show the success notification with the executed `DELETE FROM medicines WHERE medicine_id = ...` query.

6. **Step 6: Verify Database Refresh**
   - The row disappears immediately from the table.
   - Dashboard count decrements back.

7. **Step 7: Demonstrate ACID Stock Reduction in Prescriptions**
   - Navigate to **Prescriptions**.
   - Click **Create Prescription**.
   - Select a patient and a medicine. Point out the available stock amount.
   - Enter dispense quantity (e.g. 5 units).
   - Show the SQL transaction preview.
   - Click **Commit Prescription & Deduct Stock**.
   - Show that the prescription is inserted AND the medicine inventory stock is reduced by 5 units in MySQL!

8. **Step 8: Dedicated Database Operations Console**
   - Navigate to the **Database Operations** page.
   - Demonstrate:
     - **Section A**: Raw INSERT into any table.
     - **Section B**: Raw DELETE from any table.
     - **Section C**: Raw VIEW with dynamic table selection and SQL statement preview.
