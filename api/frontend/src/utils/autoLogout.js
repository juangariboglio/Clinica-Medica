export const setupAutoLogout = (onTimeout) => {
  const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes in milliseconds
  let timeoutId;

  const resetTimer = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      onTimeout();
    }, INACTIVITY_LIMIT);
  };

  // Event listeners for user activity
  const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

  const start = () => {
    resetTimer();
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });
  };

  const stop = () => {
    clearTimeout(timeoutId);
    activityEvents.forEach((event) => {
      window.removeEventListener(event, resetTimer);
    });
  };

  // Start the timer immediately
  start();

  // Return an object with a stop method to allow cleanup
  return {
    stop
  };
};