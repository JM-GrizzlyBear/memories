// Sends an event to everyone's open tabs for one user, the moment it happens
export interface RealtimePublisher {
  publish(userId: string, event: string, payload: unknown): void;
}
