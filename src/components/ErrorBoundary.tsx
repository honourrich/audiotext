import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-50 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Something went wrong</CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertTitle>Application Error</AlertTitle>
                <AlertDescription className="mt-2">
                  <p className="font-medium">
                    An unexpected error occurred while rendering this component.
                  </p>
                  {this.state.error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        Show technical details
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono overflow-auto">
                        <p className="font-semibold text-red-600 mb-2">
                          {this.state.error.name}: {this.state.error.message}
                        </p>
                        {this.state.error.stack && (
                          <pre className="whitespace-pre-wrap text-gray-700">
                            {this.state.error.stack}
                          </pre>
                        )}
                      </div>
                    </details>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleReset} className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What you can do:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Try refreshing the page</li>
                  <li>• Check your internet connection</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• If the problem persists, contact support</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;