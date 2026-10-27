# Road Complaint System – CEP (Varale, Pune)

> **"Report. Track. Improve Our Roads."**  
> Community Engagement Project (CEP) Prototype for reporting damaged roads, potholes, broken shoulders, and drainage overflow in Varale, Pune.

---

## 📌 Project Overview

The **Road Complaint System** is a modern, simple, and student-friendly web prototype built for citizens and local authorities of **Varale, Pune**. It provides an end-to-end digital lifecycle:
1. Citizens quickly report road hazards with photo evidence and geolocation.
2. The system generates a unique readable Complaint ID (e.g. `CEP-VAR-2026-101`) and saves all data to an SQLite database.
3. Citizens can track complaint progress in real time via an interactive 4-stage visual stepper:
   $$\text{Submitted} \longrightarrow \text{Under Review} \longrightarrow \text{In Progress} \longrightarrow \text{Resolved}$$
4. Local authorities manage the workflow through a dedicated Admin Dashboard with live KPI counters, search/filter tools, status changers, and CSV export.

---

## 🚀 Quick Start (1-Click Run)

### Method 1: Double-Click Batch File (Windows)
Simply double-click:
```cmd
run.bat
```
This automatically launches the server and opens your default browser at `http://127.0.0.1:5000`.

### Method 2: Command Line
```powershell
python app.py
```
Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask
- **Database**: SQLite3 (`complaints.db`)
- **Frontend**: HTML5, Modern CSS3 (Responsive Grid & Flexbox), Vanilla JavaScript (ES6+)
- **Storage**: Local filesystem image storage in `uploads/`

---

## 🎯 Key Features

### 1. Home Page
- **Branding**: Road Complaint System – Varale, Pune CEP.
- **Subtitle**: *“Report. Track. Improve Our Roads.”*
- **Live Metrics**: Total Complaints, Pending Review, In Progress, Roads Resolved.
- **Prominent Action Buttons**: *“Report a Road Problem”* & *“Track Complaint”*.
- **3 Simple Cards**:
  1. *Report Problem*
  2. *Track Complaint*
  3. *Road Safety Guidelines* (Specialized tips for Varale Phata, ZP School, and monsoons).

### 2. Complaint Registration Page
- **Input Fields**:
  - Full Name
  - Mobile Number (10 digits)
  - Road / Area Name (with quick-select buttons for Varale Phata, Talegaon-Chakan Link Road, ZP School Road, Maruti Mandir Chowk, MIDC Sector 3)
  - Problem Type Dropdown (*Pothole*, *Damaged Road*, *Drainage Problem*, *Broken Road*, *Other*)
  - Problem Description
  - Location (with GPS auto-detector button)
  - Road Photo Upload (with live image preview, drag-and-drop, and demo photo generator)
- **Instant Confirmation**: Generates unique Complaint ID, provides 1-click clipboard copy, and direct navigation to track status.

### 3. Complaint Tracking Page
- Search by Complaint ID (e.g., `CEP-VAR-2026-001`).
- Quick-select buttons for testing pre-seeded demo complaints.
- **4-Stage Visual Stepper**:
  - `Submitted` ➔ `Under Review` ➔ `In Progress` ➔ `Resolved`
  - Shows progress bar fill percentage, active step pulsing indicators, and completed checkmarks.
- Displays full complaint details, road photo preview (with zoom lightbox), and official authority remarks.

### 4. Admin Dashboard
- **Key Performance Indicators**:
  - Total Complaints
  - Pending Complaints (Submitted + Under Review)
  - Complaints In Progress
  - Resolved Complaints
- **Interactive Complaint Table**:
  - Complaint ID (with direct tracking link)
  - Citizen Contact
  - Area / Location
  - Problem Type badge
  - Date
  - Photo thumbnail (with lightbox view)
  - Status badge
  - **Inline Status Changer**: Select new status (`Submitted`, `Under Review`, `In Progress`, `Resolved`) to immediately update the SQLite database!
  - **Inspection Modal**: View complete information and record official engineer/contractor notes.
  - **Export CSV**: Download records for project reports and viva presentations.
  - **Reset Demo Data**: Restore default Varale dataset with one click.

---

## 📂 Project Directory Structure

```text
c:\Users\DELL\Desktop\cep/
├── app.py                     # Flask web server & SQLite REST API
├── complaints.db              # SQLite persistent database
├── create_assets.py           # Road hazard SVG illustration generator
├── requirements.txt           # Python dependencies
├── run.bat                    # 1-click Windows launcher
├── README.md                  # Project documentation & CEP guide
├── uploads/                   # Uploaded citizen evidence images
└── static/
    ├── index.html             # Single-page application structure
    ├── css/
    │   └── style.css          # Modern, responsive styling
    ├── js/
    │   └── app.js             # Client logic, routing, API calls
    └── images/                # Sample road hazard illustrations
```

---

## 🎓 College CEP Presentation Tips

- **Real-World Problem**: In Varale (near Talegaon MIDC), heavy industrial vehicle traffic causes severe asphalt degradation and potholes that worsen during monsoons.
- **Citizen Impact**: Direct photo evidence and GPS tracking eliminate bureaucracy.
- **Accountability**: Real-time 4-step status tracking keeps citizens informed and authorities accountable.

