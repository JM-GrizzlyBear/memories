export interface LikeRepository {
  // Both are safe to repeat: liking twice still counts once
  add(memoryId: string, userId: string): Promise<void>;
  remove(memoryId: string, userId: string): Promise<void>;
  count(memoryId: string): Promise<number>;
}
