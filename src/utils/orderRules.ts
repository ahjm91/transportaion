export const validTransitions: Record<string, string[]> = {
  broadcasting: ["accepted", "cancelled"],
  accepted: ["on_the_way", "cancelled"],
  on_the_way: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
};

export const canTransition = (current: string, next: string): boolean => {
  return validTransitions[current]?.includes(next) || false;
};
