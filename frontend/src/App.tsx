import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute } from './components/PermissionRoute';
import { GuestRoute } from './components/GuestRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmProvider } from './components/ui/ConfirmDialog';
import { PageLoader } from './components/ui/PageLoader';

// ── Lazy-loaded page chunks (Phase 5: Code splitting) ──
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Incidents = lazy(() => import('./pages/Incidents'));
const CreateIncident = lazy(() => import('./pages/CreateIncident'));
const IncidentDetails = lazy(() => import('./pages/IncidentDetails'));
const Procedures = lazy(() => import('./pages/Procedures'));
const ProcedureDetails = lazy(() => import('./pages/ProcedureDetails'));
const CreateProcedure = lazy(() => import('./pages/CreateProcedure'));
const Search = lazy(() => import('./pages/Search'));
const Admin = lazy(() => import('./pages/Admin'));
const Planning = lazy(() => import('./pages/planning/Planning'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const MaintenanceAdmin = lazy(() => import('./pages/admin/MaintenanceAdmin'));

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ToastProvider>
                    <ConfirmProvider>
                        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                            <Routes>

                                <Route element={<GuestRoute />}>
                                    <Route path="/login" element={<Login />} />
                                </Route>
                                <Route element={<ProtectedRoute />}>
                                    <Route element={<Layout />}>
                                        <Route path="/" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary>
                                                    <Dashboard />
                                                </ErrorBoundary>
                                            </Suspense>
                                        } />

                                        <Route element={<PermissionRoute permission="INCIDENT_VIEW" />}>
                                            <Route path="/incidents" element={
                                                <Suspense fallback={<PageLoader />}>
                                                    <ErrorBoundary><Incidents /></ErrorBoundary>
                                                </Suspense>
                                            } />
                                            <Route path="/incidents/:id" element={
                                                <Suspense fallback={<PageLoader />}>
                                                    <ErrorBoundary><IncidentDetails /></ErrorBoundary>
                                                </Suspense>
                                            } />
                                        </Route>
                                        <Route element={<PermissionRoute permission="INCIDENT_CREATE" />}>
                                            <Route path="/incidents/new" element={
                                                <Suspense fallback={<PageLoader />}>
                                                    <ErrorBoundary><CreateIncident /></ErrorBoundary>
                                                </Suspense>
                                            } />
                                        </Route>

                                        <Route element={<PermissionRoute permission="PROCEDURE_VIEW" />}>
                                            <Route path="/procedures" element={
                                                <Suspense fallback={<PageLoader />}>
                                                    <ErrorBoundary><Procedures /></ErrorBoundary>
                                                </Suspense>
                                            } />
                                            <Route path="/procedures/:id" element={
                                                <Suspense fallback={<PageLoader />}>
                                                    <ErrorBoundary><ProcedureDetails /></ErrorBoundary>
                                                </Suspense>
                                            } />
                                        </Route>
                                        <Route element={<PermissionRoute permission="PROCEDURE_CREATE" />}>
                                            <Route path="/procedures/new" element={
                                                <Suspense fallback={<PageLoader />}>
                                                    <ErrorBoundary><CreateProcedure /></ErrorBoundary>
                                                </Suspense>
                                            } />
                                            <Route path="/procedures/:id/edit" element={
                                                <Suspense fallback={<PageLoader />}>
                                                    <ErrorBoundary><CreateProcedure /></ErrorBoundary>
                                                </Suspense>
                                            } />
                                        </Route>
                                        <Route path="/search" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><Search /></ErrorBoundary>
                                            </Suspense>
                                        } />
                                        <Route path="/admin" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><Admin /></ErrorBoundary>
                                            </Suspense>
                                        } />
                                        <Route path="/planning" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><Planning /></ErrorBoundary>
                                            </Suspense>
                                        } />
                                        <Route path="/admin/maintenance" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><MaintenanceAdmin /></ErrorBoundary>
                                            </Suspense>
                                        } />
                                        <Route path="/status" element={
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><StatusPage /></ErrorBoundary>
                                            </Suspense>
                                        } />
                                    </Route>
                                </Route>

                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </Router>
                    </ConfirmProvider>
                </ToastProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
