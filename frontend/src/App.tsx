import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute } from './components/PermissionRoute';

import Dashboard from './pages/Dashboard';
import { Incidents } from './pages/Incidents';
import { CreateIncident } from './pages/CreateIncident';
import { IncidentDetails } from './pages/IncidentDetails';
import { Procedures } from './pages/Procedures';
import { ProcedureDetails } from './pages/ProcedureDetails';
import { CreateProcedure } from './pages/CreateProcedure';
import { Search } from './pages/Search';
import { Admin } from './pages/Admin';
import { Planning } from './pages/planning/Planning';

function App() {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Dashboard />} />

                            <Route element={<PermissionRoute permission="INCIDENT_VIEW" />}>
                                <Route path="/incidents" element={<Incidents />} />
                                <Route path="/incidents/:id" element={<IncidentDetails />} />
                            </Route>
                            <Route element={<PermissionRoute permission="INCIDENT_CREATE" />}>
                                <Route path="/incidents/new" element={<CreateIncident />} />
                            </Route>

                            <Route element={<PermissionRoute permission="PROCEDURE_VIEW" />}>
                                <Route path="/procedures" element={<Procedures />} />
                                <Route path="/procedures/:id" element={<ProcedureDetails />} />
                            </Route>
                            <Route element={<PermissionRoute permission="PROCEDURE_CREATE" />}>
                                <Route path="/procedures/new" element={<CreateProcedure />} />
                                <Route path="/procedures/:id/edit" element={<CreateProcedure />} />
                            </Route>
                            <Route path="/search" element={<Search />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/planning" element={<Planning />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
