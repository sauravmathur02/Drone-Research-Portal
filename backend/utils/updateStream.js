const clients = new Set();

function addClient(response) {
  clients.add(response);

  return () => {
    clients.delete(response);
  };
}

function writeEvent(response, eventName, payload) {
  response.write(`event: ${eventName}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastUpdate(update) {
  clients.forEach((response) => writeEvent(response, 'update', update));
}

setInterval(() => {
  clients.forEach((response) => response.write(': heartbeat\n\n'));
}, 30000).unref();

module.exports = {
  addClient,
  broadcastUpdate,
  writeEvent,
};
