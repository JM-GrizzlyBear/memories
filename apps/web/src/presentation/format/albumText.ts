// "1 memory", "12 memories"
export function memoryCountText(count: number) {
  return `${count} ${count === 1 ? "memory" : "memories"}`;
}
