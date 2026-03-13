import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
          <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
              <p className="text-muted-foreground text-sm">
                The application encountered an unexpected error. Don't worry, your data is safe in our local database.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-muted p-4 rounded-lg text-left overflow-auto max-h-40 border border-border">
                <code className="text-[10px] text-destructive font-mono break-all">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
                className="w-full text-xs"
              >
                Clear Cache & Logout
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
