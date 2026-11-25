import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Erro inesperado na renderização do painel.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void error;
    void info;
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg0 p-4 text-ink">
          <div className="w-full max-w-md space-y-4 rounded-md border border-signal/40 bg-bg1 p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-sm border border-signal/50 bg-signal/15 text-signal">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              <h1 className="font-display text-lg font-semibold uppercase tracking-wide text-ink">
                Falha na Interface de Telemetria
              </h1>
              <p className="text-xs text-ink-dim">{this.state.errorMessage}</p>
            </div>
            <Button type="button" variant="outline" onClick={this.handleReload} className="mx-auto">
              <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} />
              Recarregar Painel
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
