// Sends an event to everyone's open tabs for one user, the moment it happens
export interface RealtimePublisher {
  publish(userId: string, event: string, payload: unknown): void;
  // To everyone who's online (for public changes, like who can message someone)
  broadcast(event: string, payload: unknown): void;
}
