# Login as Admin
Write-Host "Logging in as Admin..."
try {
    $adminLogin = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body '{"email":"admin@prodkb.com","password":"password123"}' -ContentType "application/json"
    $adminToken = $adminLogin.token
    $adminHeaders = @{ Authorization = "Bearer $adminToken"; "Content-Type" = "application/json" }
} catch {
    Write-Error "Admin login failed: $($_.Exception.Message)"
    exit 1
}

# 1. Get Permissions
Write-Host "Fetching permissions..."
$permissions = Invoke-RestMethod -Uri "http://localhost:3000/api/permissions" -Headers $adminHeaders
$dashboardPerm = $permissions | Where-Object { $_.code -eq "DASHBOARD_VIEW" }
if (-not $dashboardPerm) { Write-Error "DASHBOARD_VIEW permission not found"; exit 1 }

# 2. Create Restricted Role
Write-Host "Creating DASHBOARD_ONLY role..."
$roleBody = @{
    name = "DASHBOARD_ONLY"
    description = "Can only view dashboard"
    permissionIds = @($dashboardPerm.id)
} | ConvertTo-Json -Depth 10

try {
    # Check if role exists first (idempotency)
    $roles = Invoke-RestMethod -Uri "http://localhost:3000/api/roles" -Headers $adminHeaders
    $existingRole = $roles | Where-Object { $_.name -eq "DASHBOARD_ONLY" }
    
    if ($existingRole) {
        Write-Host "Role DASHBOARD_ONLY already exists, using existing."
    } else {
        $newRole = Invoke-RestMethod -Uri "http://localhost:3000/api/roles" -Method Post -Body $roleBody -ContentType "application/json" -Headers $adminHeaders
        Write-Host "Role created: $($newRole.name)"
    }
} catch {
    Write-Error "Failed to manage role: $($_.Exception.Message)"
    # Continue anyway, maybe user exists
}

# 3. Create Restricted User
Write-Host "Registering Restricted User (dash@prodkb.com)..."
$userBody = @{
    name = "Dash User"
    email = "dash@prodkb.com"
    password = "password123"
    role = "DASHBOARD_ONLY"
} | ConvertTo-Json -Depth 10

try {
    # Check if user exists (mock check via login failure or just try register)
    # Just try register, if conflict (409), ignore
    Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method Post -Body $userBody -ContentType "application/json" -Headers $adminHeaders
    Write-Host "User registered."
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Conflict) {
        Write-Host "User already exists, continuing..."
    } else {
        Write-Error "Failed to register user: $($_.Exception.Message)"
        exit 1
    }
}

# 4. Login as Restricted User
Write-Host "Logging in as Restricted User..."
try {
    $dashLogin = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body '{"email":"dash@prodkb.com","password":"password123"}' -ContentType "application/json"
    $dashToken = $dashLogin.token
    $dashHeaders = @{ Authorization = "Bearer $dashToken"; "Content-Type" = "application/json" }
} catch {
    Write-Error "Restricted user login failed: $($_.Exception.Message)"
    exit 1
}

# 5. Access Dashboard Stats (Should Succeed)
Write-Host "Testing Authorized Access (Dashboard Stats)..."
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/incidents/stats" -Headers $dashHeaders
    Write-Host "Success: Accessed Dashboard Stats."
} catch {
    Write-Error "Failed authorized access: $($_.Exception.Message)"
    exit 1
}

# 6. Access Incidents (Should Fail - 403)
Write-Host "Testing Unauthorized Access (Incidents List)..."
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/incidents" -Headers $dashHeaders
    Write-Error "FAILURE: Unauthorized access allowed to /api/incidents!"
    # exit 1 (Don't exit, check other endpoints)
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Forbidden) {
        Write-Host "SUCCESS: Access denied (403) to /api/incidents."
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# 7. Access Procedures (Should Fail - 403)
Write-Host "Testing Unauthorized Access (Procedures List)..."
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/procedures" -Headers $dashHeaders
    Write-Error "FAILURE: Unauthorized access allowed to /api/procedures!"
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Forbidden) {
        Write-Host "SUCCESS: Access denied (403) to /api/procedures."
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

Write-Host "Verification Complete."
