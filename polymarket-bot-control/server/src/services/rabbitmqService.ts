import amqp from 'amqplib/callback_api';

export class RabbitMQService {
  private getUrl(): string {
    const url = process.env.RABBITMQ_URL;
    if (!url) {
      console.error('RABBITMQ_URL environment variable is not set');
      throw new Error('RABBITMQ_URL environment variable is required');
    }
    return url;
  }

  async sendCommand(command: string, data?: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const url = this.getUrl();
      console.log(`Connect to RabbitMQ at ${url}`);
      amqp.connect(url, (error0, connection) => {
        if (error0) {
          console.error('Failed to connect to RabbitMQ:', error0);
          resolve(false);
          return;
        }

        connection.createChannel((error1, channel) => {
          if (error1) {
            console.error('Failed to create channel:', error1);
            connection.close();
            resolve(false);
            return;
          }

          const queue = 'notification';
          const message = {
            command,
            ...data,
            timestamp: Date.now()
          };

          channel.assertQueue(queue, { durable: true }, (error2) => {
            if (error2) {
              console.error('Failed to assert queue:', error2);
              connection.close();
              resolve(false);
              return;
            }

            const messageBuffer = Buffer.from(JSON.stringify(message));
            
            const sent = channel.sendToQueue(queue, messageBuffer, {
              persistent: true
            });

            if (sent) {
              console.log(`Command sent successfully: ${command}`);
              resolve(true);
            } else {
              console.error('Failed to send command to queue');
              resolve(false);
            }

            setTimeout(() => {
              connection.close();
            }, 500);
          });
        });
      });
    });
  }

  async restartPolymarketMM(): Promise<boolean> {
    return await this.sendCommand('restart');
  }

  async getServiceStatus(): Promise<{ status: string; lastCheck: number }> {
    // For now, we'll simulate service status
    // In a real implementation, you might check if the service is responding
    // by monitoring the markets topic or having a health check mechanism
    return {
      status: 'running', // could be 'running', 'stopped', 'error', 'unknown'
      lastCheck: Date.now()
    };
  }
}

export const rabbitmqService = new RabbitMQService();