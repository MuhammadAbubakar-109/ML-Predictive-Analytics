import { Component } from "react";

// Catches unexpected rendering errors so the whole page does not go blank.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="fatal">
        <h1>Something went wrong</h1>
        <p>{String(this.state.error.message || this.state.error)}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload the page</button>
      </div>
    );
  }
}
