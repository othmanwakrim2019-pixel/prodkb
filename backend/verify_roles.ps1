$authUrl = "http://127.0.0.1:3000/auth"
$apiUrl = "http://127.0.0.1:3000/api"
$adminEmail = "admin@prodkb.com"
$password = "password123"

# Disable progress bar to speed up
$ProgressPreference = 'SilentlyContinue'

$conn = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet
if (!$conn) {
    write-host "ERROR: Port 3000 is not open on 127.0.0.1. Is the backend running?" -ForegroundColor Red
    exit 1
} else {
    write-host "Port 3000 is open." -ForegroundColor Green
}

try {
    # 1. Login Admin
    write-host "Logging in as Admin..."
    $payload = @{ email = $adminEmail; password = $password }
    $response = Invoke-RestMethod -Uri "$authUrl/login" -Method Post -Body ($payload | ConvertTo-Json) -ContentType "application/json"
    $adminToken = $response.token
    write-host "Admin Token obtained."

    # 2. Fetch Users
    write-host "Fetching users..."
    $users = Invoke-RestMethod -Uri "$apiUrl/users" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
    
    # Debug: Output roles found
    # $users | Select-Object -ExpandProperty role | Select-Object -ExpandProperty name | Group-Object | Format-Table

    $expert = $users | Where-Object { $_.role.name -eq "EXPERT" } | Select-Object -First 1
    $operator = $users | Where-Object { $_.role.name -eq "OPERATOR" } | Select-Object -First 1
    $viewer = $users | Where-Object { $_.role.name -eq "VIEWER" } | Select-Object -First 1

    if ($expert) { write-host "Found Expert: $($expert.email)" } else { write-host "WARNING: No EXPERT user found." }
    if ($operator) { write-host "Found Operator: $($operator.email)" } else { write-host "WARNING: No OPERATOR user found." }
    if ($viewer) { write-host "Found Viewer: $($viewer.email)" } else { write-host "WARNING: No VIEWER user found." }

    # Login other users
    function Get-Token ($email) {
        $p = @{ email = $email; password = "password123" }
        try {
            $r = Invoke-RestMethod -Uri "$authUrl/login" -Method Post -Body ($p | ConvertTo-Json) -ContentType "application/json"
            return $r.token
        } catch {
            write-host "Failed to login $email"
            return $null
        }
    }

    $expertToken = if ($expert) { Get-Token $expert.email } else { $null }
    $operatorToken = if ($operator) { Get-Token $operator.email } else { $null }
    $viewerToken = if ($viewer) { Get-Token $viewer.email } else { $null }

    # 3. Create Incident (as Admin for simplicity, or Operator)
    write-host "Creating Test Incident (Admin)..."
    $incData = @{
        title = "Test Incident for Roles";
        description = "Testing role based access control";
        severity = "Low";
        environment = "PROD";
        systemId = (Invoke-RestMethod -Uri "$apiUrl/systems" -Method Get -Headers @{ Authorization = "Bearer $adminToken" })[0].id
    }
    $incident = Invoke-RestMethod -Uri "$apiUrl/incidents" -Method Post -Body ($incData | ConvertTo-Json) -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" }
    $incId = $incident.id
    write-host "Created Incident ID: $incId"

    # 4. Test Permissions

    # A. Viewer Try Resolve (Should Fail)
    if ($viewerToken) {
        write-host "Testing Viewer Resolve (Expect Failure)..."
        try {
            $update = @{ status = "Resolved" }
            Invoke-RestMethod -Uri "$apiUrl/incidents/$incId" -Method Put -Body ($update | ConvertTo-Json) -ContentType "application/json" -Headers @{ Authorization = "Bearer $viewerToken" }
            write-host "FAILURE: Viewer was able to resolve incident!" -ForegroundColor Red
        } catch {
            if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Forbidden -or $_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::BadRequest) {
                write-host "SUCCESS: Viewer blocked from resolving ($($_.Exception.Response.StatusCode))" -ForegroundColor Green
            } else {
                write-host "unexpected error: $($_.Exception.Message)" 
            }
        }
    }

    # B. Operator/Expert Resolve (Should Succeed)
    if ($operatorToken) {
        write-host "Testing Operator Resolve (Expect Success)..."
        try {
            $update = @{ status = "Resolved" }
            $res = Invoke-RestMethod -Uri "$apiUrl/incidents/$incId" -Method Put -Body ($update | ConvertTo-Json) -ContentType "application/json" -Headers @{ Authorization = "Bearer $operatorToken" }
            write-host "SUCCESS: Operator resolved incident." -ForegroundColor Green
        } catch {
            write-host "FAILURE: Operator failed to resolve: $($_.Exception.Message)" -ForegroundColor Red
             # Print detailed error if possible
             $stream = $_.Exception.Response.GetResponseStream()
             $reader = New-Object System.IO.StreamReader($stream)
             write-host $reader.ReadToEnd()
        }
    }

    # C. Viewer Visibility (Should NOT see incident unless in team)
    # Since we didn't assign team to incident (it's unassigned or Admin's team?), Viewer shouldn't see it if filtering works.
    if ($viewerToken) {
        write-host "Testing Viewer Visibility..."
        $list = Invoke-RestMethod -Uri "$apiUrl/incidents" -Method Get -Headers @{ Authorization = "Bearer $viewerToken" }
        $found = $list.data | Where-Object { $_.id -eq $incId }
        if ($found) {
            write-host "WARNING: Viewer can see the incident (Check Team assignment)" -ForegroundColor Yellow
        } else {
            write-host "SUCCESS: Viewer cannot see incident (Filtered)" -ForegroundColor Green
        }
    }

    # D. Admin Close (Should Succeed)
    write-host "Testing Admin Close (Expect Success)..."
    try {
        $update = @{ status = "Closed" }
        Invoke-RestMethod -Uri "$apiUrl/incidents/$incId" -Method Put -Body ($update | ConvertTo-Json) -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" }
        write-host "SUCCESS: Admin closed incident." -ForegroundColor Green
    } catch {
        write-host "FAILURE: Admin failed to close: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # E. Admin Delete (Should Succeed)
    write-host "Testing Admin Delete (Expect Success)..."
    try {
        Invoke-RestMethod -Uri "$apiUrl/incidents/$incId" -Method Delete -Headers @{ Authorization = "Bearer $adminToken" }
        write-host "SUCCESS: Admin deleted incident." -ForegroundColor Green
    } catch {
         write-host "FAILURE: Admin failed to delete: $($_.Exception.Message)" -ForegroundColor Red
    }

} catch {
    write-host "Script Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        write-host $reader.ReadToEnd()
    }
}
