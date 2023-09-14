import { Injectable, NotFoundException  } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.model';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { name, email } = createUserDto;

      // Check if a user with the same email already exists
      const existingUser = await this.userModel.findOne({ email }).exec();
      if (existingUser) {
        // You can throw an exception or handle the case where the email is already in use
        throw new Error('Email already in use');
      }

      // Create a new user instance
      const user = new this.userModel({ name, email });

      // Save the user to the database
      return await user.save();
    } catch (error) {
      // Handle any errors (e.g., database connection issues or validation failures)
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUser(userId: string): Promise<User> {
    return await this.userModel.findById(userId).exec();
  }

  async getUserByEmail(email: string): Promise<User> {
    return await this.userModel.findOne({ email }).exec();
  }

  async updateUserAvatar(userId: string, avatarData: string): Promise<User> {
    return await this.userModel.findByIdAndUpdate(
      userId,
      { avatar: avatarData },
      { new: true },
    );
  }

  async removeAvatar(userId: string): Promise<void> {
    try {
      // Find the user by userId
      const user = await this.userModel.findOne({ _id: userId }).exec();

      // If the user does not exist, throw a NotFoundException
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Remove the avatar information from the user document (assuming you have an 'avatar' field in your User model)
      user.avatar = null; // Set the 'avatar' field to null or remove it based on your schema

      // Save the updated user document
      await user.save();
    } catch (error) {
      // Handle any errors (e.g., database connection issues)
      throw new Error(`Failed to remove avatar: ${error.message}`);
    }
  }
}
