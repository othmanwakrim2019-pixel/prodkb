import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const Forbidden = () => {

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
            <div className="bg-red-50 p-6 rounded-full mb-6 shadow-sm border border-red-100">
                <ShieldAlert className="h-16 w-16 text-red-600" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-600 max-w-md mb-8">
                You do not have the required permissions to access this page. If you believe this is a mistake, please contact your administrator.
            </p>
            <Link
                to="/"
                className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
                Return to Dashboard
            </Link>
        </div>
    );
};
