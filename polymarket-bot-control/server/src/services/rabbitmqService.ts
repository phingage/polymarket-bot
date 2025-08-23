import amqp from 'amqplib/callback_api';

interface ServiceStatus {
  timestamp: string;
  status: string;
  websocket_active: boolean;
  monitored_assets: number;
  service: string;
}

export class RabbitMQService {
  private lastHeartbeat: ServiceStatus | null = null;
  private heartbeatListener: any = null;

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

  async startHeartbeatListener(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = this.getUrl();
      console.log(`Starting heartbeat listener on ${url}`);
      
      amqp.connect(url, (error0, connection) => {
        if (error0) {
          console.error('Failed to connect to RabbitMQ for heartbeat:', error0);
          reject(error0);
          return;
        }

        connection.createChannel((error1, channel) => {
          if (error1) {
            console.error('Failed to create heartbeat channel:', error1);
            connection.close();
            reject(error1);
            return;
          }

          const exchange = 'polymarket';
          const routingKey = 'service.heartbeat.polymarket-mm';
          
          channel.assertExchange(exchange, 'topic', { durable: true }, (error2) => {
            if (error2) {
              console.error('Failed to assert exchange:', error2);
              connection.close();
              reject(error2);
              return;
            }

            channel.assertQueue('', { exclusive: true }, (error3, q) => {
              if (error3) {
                console.error('Failed to assert queue:', error3);
                connection.close();
                reject(error3);
                return;
              }

              channel.bindQueue(q.queue, exchange, routingKey, {}, (error4) => {
                if (error4) {
                  console.error('Failed to bind queue:', error4);
                  connection.close();
                  reject(error4);
                  return;
                }

                console.log(`Listening for heartbeats on ${routingKey}`);
                
                channel.consume(q.queue, (msg) => {
                  if (msg) {
                    try {
                      const heartbeat = JSON.parse(msg.content.toString()) as ServiceStatus;
                      this.lastHeartbeat = heartbeat;
                      console.log(`Received heartbeat: ${heartbeat.status}, WebSocket: ${heartbeat.websocket_active}`);
                    } catch (e) {
                      console.error('Error parsing heartbeat message:', e);
                    }
                    channel.ack(msg);
                  }
                }, { noAck: false });
                
                this.heartbeatListener = { connection, channel };
                resolve();
              });
            });
          });
        });
      });
    });
  }

  async getServiceStatus(): Promise<{ status: string; lastCheck: number; websocket_active?: boolean; monitored_assets?: number }> {
    // Start heartbeat listener if not already started
    if (!this.heartbeatListener) {
      try {
        await this.startHeartbeatListener();
      } catch (error) {
        console.error('Failed to start heartbeat listener:', error);
        return {
          status: 'unknown',
          lastCheck: Date.now()
        };
      }
    }

    if (!this.lastHeartbeat) {
      return {
        status: 'unknown',
        lastCheck: Date.now()
      };
    }

    // Check if heartbeat is recent (within last 30 seconds)
    const heartbeatTime = new Date(this.lastHeartbeat.timestamp).getTime();
    const now = Date.now();
    const isRecent = (now - heartbeatTime) < 30000;

    if (!isRecent) {
      return {
        status: 'stopped',
        lastCheck: heartbeatTime
      };
    }

    return {
      status: this.lastHeartbeat.websocket_active ? 'running' : 'idle',
      lastCheck: heartbeatTime,
      websocket_active: this.lastHeartbeat.websocket_active,
      monitored_assets: this.lastHeartbeat.monitored_assets
    };
  }

  async sendStopCommand(): Promise<boolean> {
    return await this.sendCommand('stop');
  }
}

export const rabbitmqService = new RabbitMQService();

// Initialize heartbeat listener when module loads
setTimeout(() => {
  rabbitmqService.getServiceStatus().catch(error => {
    console.error('Failed to initialize heartbeat listener:', error);
  });
}, 1000);