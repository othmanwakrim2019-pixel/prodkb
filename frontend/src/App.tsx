import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Forbidden } from './pages/Forbidden';
import { GuestRoute } from './components/GuestRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmProvider } from './components/ui/ConfirmDialog';
import { PageLoader } from './components/ui/PageLoader';
import { APP_PATHS } from './app/route-meta';

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
const MaintenanceAdmin = lazy(() => import('./features/admin/pages/MaintenanceAdminPage'));
const UserProfile = lazy(() => import('./features/auth/pages/UserProfilePage'));
const EquipePage   = lazy(() => import('./features/equipe/pages/EquipePage'));
const MesTachesPage = lazy(() => import('./features/equipe/pages/MesTachesPage'));

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ToastProvider>
                    <ConfirmProvider>
                        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                            <Routes>
                                <Route element={<GuestRoute />}>
                                    <Route path={APP_PATHS.login} element={<Login />} />
                                </Route>

                                <Route path={APP_PATHS.status} element={
                                    <Suspense fallback={<PageLoader />}>
                                        <ErrorBoundary><StatusPage /></ErrorBoundary>
                                    </Suspense>
                                } />

                                <Route element={<Layout />}>
                                    <Route path={APP_PATHS.home} element={
                                        <ProtectedRoute permission="DASHBOARD_VIEW">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><Dashboard /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />

                                    <Route path={APP_PATHS.incidents} element={
                                        <ProtectedRoute permission="INCIDENT_VIEW">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><Incidents /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />
                                    <Route path={`${APP_PATHS.incidents}/:id`} element={
                                        <ProtectedRoute permission="INCIDENT_VIEW">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><IncidentDetails /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />
                                    <Route path={APP_PATHS.incidentNew} element={
                                        <ProtectedRoute permission="INCIDENT_CREATE">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><CreateIncident /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />
                                    <Route path={APP_PATHS.incidentLegacyCreate} element={<Navigate to={APP_PATHS.incidentNew} replace />} />


                                    <Route path={APP_PATHS.procedures} element={
                                        <ProtectedRoute permission="PROCEDURE_VIEW">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><Procedures /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />
                                    <Route path={`${APP_PATHS.procedures}/:id`} element={
                                        <ProtectedRoute permission="PROCEDURE_VIEW">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><ProcedureDetails /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />
                                    <Route path={APP_PATHS.procedureNew} element={
                                        <ProtectedRoute permission="PROCEDURE_CREATE">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><CreateProcedure /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />
                                    <Route path={`${APP_PATHS.procedures}/:id/edit`} element={
                                        <ProtectedRoute permission="PROCEDURE_EDIT">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><CreateProcedure /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />

                                    <Route path={APP_PATHS.search} element={
                                        <ProtectedRoute permission="SEARCH_VIEW">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><Search /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />

                                    <Route path={APP_PATHS.admin} element={
                                        <ProtectedRoute>
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><Admin /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />

                                    <Route path={APP_PATHS.planning} element={
                                        <ProtectedRoute permission="PLANNING_VIEW">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><Planning /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />

                                    <Route path={APP_PATHS.adminMaintenance} element={
                                        <ProtectedRoute permission="MAINTENANCE_MANAGE">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><MaintenanceAdmin /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />

                                    {/* User profile — accessible to all authenticated users */}
                                    <Route path="/profile" element={
                                        <ProtectedRoute>
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><UserProfile /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />

                                    {/* Gestion Équipe — manager board */}
                                    <Route path={APP_PATHS.equipe} element={
                                        <ProtectedRoute permission="EQUIPE_VIEW">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><EquipePage /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />

                                    {/* Mes Tâches — personal operator view (MES_TACHES_VIEW) */}
                                    <Route path={APP_PATHS.mesTaches} element={
                                        <ProtectedRoute permission="MES_TACHES_VIEW">
                                            <Suspense fallback={<PageLoader />}>
                                                <ErrorBoundary><MesTachesPage /></ErrorBoundary>
                                            </Suspense>
                                        </ProtectedRoute>
                                    } />
                                </Route>


                                <Route path={APP_PATHS.forbidden} element={<Forbidden />} />
                                <Route path="*" element={<Navigate to={APP_PATHS.home} />} />
                            </Routes>
                        </Router>
                    </ConfirmProvider>
                </ToastProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
