import { Component, type ErrorInfo, type ReactNode } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

interface Props {
  children: ReactNode;
  /** Optional label shown in the fallback so users know what broke. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/runtime errors in its subtree and shows a readable message
 * instead of letting the whole app go white. Reset re-mounts the children.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <ExclamationTriangleIcon className="h-6 w-6" />
          <h2 className="text-lg font-extrabold">
            {this.props.label ?? "Something went wrong"}
          </h2>
        </div>
        <p className="mt-2 text-base font-semibold text-red-600">{error.message}</p>
        {error.stack && (
          <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-white/70 p-3 text-xs text-red-700 whitespace-pre-wrap">
            {error.stack}
          </pre>
        )}
        <button
          onClick={this.reset}
          className="mt-4 rounded-xl bg-secondary px-4 py-2 text-base font-bold text-white hover:bg-secondary/90"
        >
          Try again
        </button>
      </div>
    );
  }
}
