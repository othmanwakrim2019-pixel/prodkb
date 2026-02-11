# Running ProdKB with Docker

This guide explains how to run the full application (Frontend, Backend, Database) using Docker.

## Prerequisites
- [Docker Client/Desktop](https://www.docker.com/products/docker-desktop/) installed on your machine.

## Quick Start

1.  **Open a terminal** in the root directory (where `docker-compose.yml` is located).

2.  **Build and Start** the services:
    ```bash
    docker-compose up --build -d
    ```
    - `--build`: Forces rebuilding of images (useful if you changed code).
    - `-d`: Detached mode (runs in background).

3.  **Wait for containers to start.**
    - The backend will automatically wait for the database and run migrations (`npx prisma migrate deploy`).
    - This might take a minute on the first run.

4.  **Access the application at [http://localhost:8080](http://localhost:8080)** (This is the Frontend).
    - Do **NOT** use `localhost:3000` for browsing; that is the Backend API only.
    - **Backend API**: [http://localhost:3000](http://localhost:3000)
    - **API Health Check**: [http://localhost:3000/health](http://localhost:3000/health)
    - **Swagger Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

5.  **Login** with `admin@prodkb.com` / `password123`.

## Login Credentials
The database is automatically seeded with:
- **Admin User**: `admin@prodkb.com` / `password123`
- **Other Users**: Various random users (see seed script).

## Troubleshooting

- **Check Logs**:
    ```bash
    docker-compose logs -f
    ```
    To check specific service logs:
    ```bash
    docker-compose logs -f backend
    ```

- **Container Name Conflict**:
    If you see `Error response from daemon: Conflict. The container name "/prodkb-postgres" is already in use`, run:
    ```bash
    docker-compose down
    ```
    Then try starting again.

- **Stop Services**:
    ```bash
    docker-compose down
    ```

- **Reset Database**:
    If you need to wipe the database and start fresh:
    ```bash
    docker-compose down -v
    ```
    (The `-v` flag removes the named volumes).

## Configuration
Host ports and default credentials are defined in `docker-compose.yml`.
- **Database**: Port 5432, User: `prodkb`, Pass: `prodkb_password`
- **Backend**: Port 3000
- **Frontend**: Port 8080
