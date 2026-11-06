export const getClientId = () => {
  let clientId = localStorage.getItem('clientId');

  if (!clientId) {
    clientId = crypto.randomUUID();

    localStorage.setItem('clientId', clientId);
  }

  return clientId;
};
