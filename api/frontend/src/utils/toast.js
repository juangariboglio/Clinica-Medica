export const toastError = (message) => {
  // For simplicity, we'll use alert. In a real app, we might use a toast library.
  alert(`Error: ${message}`);
};

export const toastSuccess = (message) => {
  alert(`Éxito: ${message}`);
};