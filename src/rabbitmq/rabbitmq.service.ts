// rabbitmq/rabbitmq.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import {  connect, Channel, Connection, ConfirmChannel, Message } from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit {
  private connection: Connection;
  private channel: ConfirmChannel;

  async onModuleInit() {
    await this.connectToRabbitMQ();
  }

  async connectToRabbitMQ() {
    try {
      this.connection = await connect('amqp://localhost'); // Replace with your RabbitMQ server URL
      this.channel = await this.connection.createConfirmChannel();
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  async sendMessage(queueName: string, message: any) {
    try {
      await this.channel.assertQueue(queueName, { durable: false });
      const sent = this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));

      if (sent) {
        console.log(`Message sent to RabbitMQ queue '${queueName}':`, message);
      } else {
        console.error('Failed to send message to RabbitMQ:', message);
      }
    } catch (error) {
      console.error('Error sending message to RabbitMQ:', error);
    }
  }

  async closeConnection() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
