/**
 * ErrorBoundary — catches render errors and shows recovery UI
 * Wrap at app, page, or component level
 */
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                    <div className="bg-red-50 p-4 rounded-full mb-4">
                        <AlertTriangle className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-slate-600 mb-6 max-w-md">
                        An unexpected error occurred. Try refreshing the page or contact support if the problem persists.
                    </p>
                    {this.state.error && (
                        <pre className="text-xs text-slate-500 bg-slate-100 p-3 rounded-lg mb-4 max-w-lg overflow-auto">
                            {this.state.error.message}
                        </pre>
                    )}
                    <button
                        onClick={this.handleRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
