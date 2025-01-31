export interface DevelopmentServer {
  /**
   * Start the development server, or restart it if it's already running.
   */
  up(): void;

  /**
   * Stop the development server.
   */
  down(): void;

  /**
   * Check if the server is currently running.
   */
  isRunning(): boolean;
}
