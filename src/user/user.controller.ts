import {
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Res,
  HttpException,
  HttpStatus,
  Body,
} from '@nestjs/common';
import axios from 'axios';

import { Response } from 'express';

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { CreateUserDto } from './create-user.dto';

import { UserService } from './user.service';
import { User } from './user.model';

import * as nodemailer from 'nodemailer';

@Controller('api/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.createUser(createUserDto);

      // Send a welcome email to the user
      await this.sendWelcomeEmail(user.email);

      // Emit a RabbitMQ event (replace with your RabbitMQ logic)
      this.emitRabbitMqEvent(user);

      // Return a success message or the created user
      return { message: 'User created successfully', user };
    } catch (error) {
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':userId')
  async getUser(@Param('userId') userId: string) {
    try {
      // Make an HTTP GET request to the external API
      const response = await axios.get(`https://reqres.in/api/users/${userId}`);

      if (response.status === 200) {
        return response?.data?.data; 
      } else {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get(':userId/avatar')
  async getUserAvatar(@Param('userId') userId: string, @Res() res: Response) {
    try {
      // Generatin a unique filename based on userId
      const hash = crypto.createHash('md5').update(userId).digest('hex');
      const filename = `${hash}.jpg`; // Assuming the image is in JPEG format

      // Defininig the path to the directory where avatar images are stored
      const avatarDir = path.join(__dirname, '../../avatars');

      const avatarPath = path.join(avatarDir, filename);
      if (fs.existsSync(avatarPath)) {
        const fileContent = fs.readFileSync(avatarPath);
        const base64Image = fileContent.toString('base64');
        res.set('Content-Type', 'image/jpeg');
        res.send(base64Image);
      } else {
        res.status(404).send('Avatar not found');
      }
    } catch (error) {
      console.error('Error retrieving user avatar:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  @Delete(':userId/avatar')
  async deleteUserAvatar(@Param('userId') userId: string) {
    try {
      const hash = crypto.createHash('md5').update(userId).digest('hex');
      const filename = `${hash}.jpg`; // Assuming the image is in JPEG format

      const avatarDir = path.join(__dirname, '../../avatars');
      const avatarPath = path.join(avatarDir, filename);

      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);

        await this.userService.removeAvatar(userId);

        return { message: 'Avatar deleted successfully' };
      } else {
        throw new Error('Avatar not found');
      }
    } catch (error) {
      console.error('Error deleting user avatar:', error);
      throw new HttpException(
        'Failed to delete user avatar',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async sendWelcomeEmail(email: string) {
    try {

      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'youremail@gmail.com', 
          pass: 'yourpassword',        
        },
      });
      

      const mailOptions = {
        from: 'your@email.com', // Replace with your email
        to: email,
        subject: 'Welcome to Our Application',
        text: 'Thank you for joining our application!',
      };

      const info = await transporter.sendMail(mailOptions);

      console.log(`Email sent to: ${email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  private emitRabbitMqEvent(user: User) {
    const message = {
      type: 'user_created',
      user,
    };

    this.rabbitMqService.sendMessage('user_events', message);
  }
}
