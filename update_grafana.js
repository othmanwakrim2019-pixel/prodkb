const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'grafana/dashboards/prodkb.json');
const dashboard = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

dashboard.panels.forEach(panel => {
    switch (panel.title) {
        case "Backend API":
            panel.description = "Indicates if the main Node.js backend server is online and responding.";
            break;
        case "SLA Worker":
            panel.description = "Indicates if the background worker responsible for SLA enforcement is running.";
            break;
        case "PostgreSQL":
            panel.description = "Database connection status.";
            break;
        case "Redis":
            panel.description = "Redis cache connection status (used for auth, rate limiting).";
            break;
        case "Total Requests (24h)":
            panel.description = "Total number of HTTP requests processed in the last 24 hours.";
            break;
        case "Users & Connections":
            panel.description = "Shows the active authenticated users (sessions) and the raw open TCP HTTP connections.";
            break;
        case "Error Rate (5m)":
            panel.description = "Percentage of requests returning an error (4xx or 5xx). A spike indicates users are experiencing failures.";
            break;
        case "P95 Latency (5m)":
            panel.description = "The time it takes for 95% of requests to complete. Spikes mean users are experiencing slow loads.";
            break;
        case "Req/s (5m avg)":
            panel.description = "Current application traffic volume (Requests per second).";
            break;
        case "DB Queries/s":
            panel.description = "Current database load (Queries per second).";
            break;
    }

    if (panel.type === 'stat' && !panel.fieldConfig?.defaults?.thresholds && panel.title !== "Total Requests (24h)" && panel.title !== "Req/s (5m avg)" && panel.title !== "DB Queries/s") {
        if (!panel.fieldConfig) panel.fieldConfig = { defaults: {} };
        panel.fieldConfig.defaults.thresholds = {
            mode: "absolute",
            steps: [
                { color: "green", value: null },
                { color: "red", value: 80 }
            ]
        };
    }
});

fs.writeFileSync(jsonPath, JSON.stringify(dashboard, null, 4));
console.log('Grafana dashboard updated successfully.');
