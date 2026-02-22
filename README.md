# ProdKB - Production Knowledge Base

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy?remote_url=https://github.com/othmanwakrim2019-pixel/prodkb&branch=dev)
ProdKB is a comprehensive incident management and knowledge base system designed for IT operations teams. It streamlines the process of tracking production incidents and linking them to standard operating procedures (SOPs) for faster resolution.

## Project Overview

In complex IT environments, keeping track of incidents and the specific procedures to resolve them is critical. ProdKB allows teams to:
- **Track Incidents**: Log and monitor production incidents across different environments (PROD, PREPROD, etc.).
- **Manage Knowledge**: Create and maintain a library of Procedures (SOPs) with detailed resolution steps, commands, and know-how.
- **Link Context**: Associate incidents and procedures with specific **Systems** and **Jobs** to enable quick lookup during emergencies.

## Core Features

### 1. Incident Management
- **Dashboard**: View incidents by status (Open, In Progress, Resolved).
- **Tracking**: Record severity, environment, impact, and detection source.
- **Timeline**: Track when an incident started, ended, and was resolved.
- **Logs & Attachments**: Attach raw logs, error messages, or screenshots to an incident for audit trails.
- **Resolution**: Assign identifying users who resolved the issue and link to the relevant Procedure used.

### 2. Knowledge Base (Procedures)
- **SOP Repository**: Store detailed guides including Root Cause, Resolution Steps, Workarounds, and key Commands.
- **Contextual**: Procedures are linked to specific Systems and Jobs.
- **Searchable**: Find procedures by error codes, tags, system, or job code.

### 3. System Registry
- **Systems**: Manage the portfolio of applications/systems supported by the team.
- **Jobs**: Catalog specific batch jobs or processes within those systems.

### 4. User Roles
- **Admin**: Full access to manage Users, Systems, and Jobs.
- **Expert**: Can create and edit Procedures and manage Incidents.
- **Operator**: Primary users who log Incidents and search for Procedures.

## Technology Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: TailwindCSS
- **State/Routing**: React Router, React Hook Form
- **Networking**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite
- **ORM**: Prisma

- **Validation**: Zod
- **Authentication**: JWT & Bcrypt

## Data Model

The core entities in the system are:
- **User**: The actors in the system.
- **System**: The software products being monitored.
- **Job**: Specific processes within a System.
- **Incident**: An operational event requiring attention.
- **Procedure**: The documentation on how to solve a class of Incidents.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd prodkb
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   
   # Setup Environment Variables
   cp .env.example .env
   
   # Initialize Database
   npx prisma migrate dev
   npx prisma db seed # (Optional: seeds initial data)
   
   # Start Server
   npm run dev
   ```

3. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   
   # Start Dev Server
   npm run dev
   ```

The application should now be running (by default, Frontend on `http://localhost:5173` and Backend on `http://localhost:3000`).

## Workflow Example

1. **Setup**: An **Admin** defines the 'Billing System' and its 'Nightly-Invoice-Job'.
2. **Detection**: An **Operator** notices the job failed. They log a new **Incident** in ProdKB, selecting the System and Job.
3. **Investigation**: The Operator searches for existing Procedures for this Job.
4. **Resolution**:
   - *Scenario A*: A relevant Procedure is found. The Operator follows the steps, resolves the incident, updates the status to 'Resolved', and links the Procedure.
   - *Scenario B*: No Procedure exists. An **Expert** investigates, fixes the issue, and creates a new **Procedure** documenting the fix for future reference.

## License

ISC
