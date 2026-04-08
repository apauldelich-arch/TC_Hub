# [SPEC] Itero-TC-Tracker Constitution

## 1. Vision & ROI
The **Itero-TC-Tracker** is a high-precision compliance dashboard designed to eliminate the manual labor of H&S training management. It transforms static logs into a proactive, visual strategic tool.

## 2. Visual Identity (Inspired by Spend Tracker)
*   **Theme**: Deep Midnight Base (`#0a0a0c`)
*   **Accents**: 
    *   **Primary**: Electric Purple (`#9d50bb`)
    *   **Secondary**: Cyan Mint (`#00f2fe`)
    *   **Status Indicators**: Neon Red (Overdue), Neon Amber (Renewal Warning), Neon Green (Compliant).
*   **Glassmorphism**: 
    *   Sidebar: `backdrop-filter: blur(12px) saturate(180%)`.
    *   Cards: Subtle borders with low-alpha white overlays.

## 3. UI Architecture
### **A. Sidebar (The Command Center)**
*   **Top**: App Logo & Version Status.
*   **Nav Links**:
    *   `Dashboard` (Visual Overview)
    *   `Employee Vault` (Full staff list + Credentials)
    *   `Training Log` (The Multi-Log Engine)
    *   `Horizon Calendar` (Deadlines & Renewals)
*   **Bottom**: "Project Manifesto" (The 'Why' behind the app).

### **B. Main Views**
*   **Employee Vault**: 
    *   Searchable table.
    *   Clicking an employee slides in a "Credential Vault" side-panel (logins for various centers).
*   **Multi-Log Engine**:
    *   Form: `Course Name`, `Date`, `Cost`, `Cert Link`.
    *   `Employee Selector`: Multi-select pillbox (Select All / Specific Team).
*   **Horizon Calendar**: 
    *   Split view: Traditional Calendar vs. "Impending Crisis" list (Sorted by Date).

## 4. Data Schema
*   **Employee**: `id`, `name`, `role`, `vault: { [centerName]: { login, password } }`.
*   **TrainingEvent**: `id`, `employeeIds[]`, `courseName`, `dateCompleted`, `expiryDays` (default 730), `cost`, `docLink`.

## 5. Automation Logic
*   **Multi-Entry**: Splitting a multi-select form into individual database entries to maintain audit trails.
*   **Compliance Monitor**: Background check comparing current date vs. renewal date.
*   **Cost Analytics**: Aggregating spend across teams/timeframes for ROI reporting.

---

**Next: Implementation of `index.css` and the Sidebar Shell.**
