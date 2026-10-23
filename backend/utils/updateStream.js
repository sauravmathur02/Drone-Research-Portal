class UpdateStream {
  constructor() {
    this.clients = new Set();
  }

  addClient(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);
    this.clients.add(res);

    req.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(eventType, payload) {
    const message = `data: ${JSON.stringify({
      type: eventType,
      payload,
      timestamp: new Date().toISOString()
    })}\n\n`;

    for (const client of this.clients) {
      client.write(message);
    }
  }
}

module.exports = new UpdateStream();
