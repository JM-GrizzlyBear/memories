// A tiny signal so separate parts of the page (like the header badge)
// hear that a friendship changed somewhere else
const EVENT = "memories:friendship-changed";

export function announceFriendshipChange() {
  window.dispatchEvent(new Event(EVENT));
}

export function onFriendshipChange(listener: () => void) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
