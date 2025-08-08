import {
  NotFoundException,
  ConflictException,
} from '../../../../shared/domain/exceptions/global-exceptions';
import {
  UpdateUserUseCase,
  UpdateUserRequest,
  UpdateUserResponse,
} from '../../domain/use-cases/update-user.use-case';
import { UserRepository } from '../../domain/repositories/user.repository';

export class UpdateUserUseCaseImpl extends UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  public async execute(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    this.log('Updating user', { userId: request.id });

    try {
      // Find existing user
      const existingUser = await this.userRepository.findById(request.id);

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${request.id} not found`);
      }

      // Check if email is being updated and if it conflicts
      if (request.email && request.email !== existingUser.email.getValue()) {
        await this.ensureEmailNotTaken(request.email, request.id);
      }

      // Prepare update data
      const updateData: any = {};
      let hasChanges = false;

      if (request.email !== undefined && request.email !== existingUser.email.getValue()) {
        updateData.email = request.email;
        hasChanges = true;
      }

      if (request.firstName !== undefined && request.firstName !== existingUser.firstName) {
        updateData.firstName = request.firstName;
        hasChanges = true;
      }

      if (request.lastName !== undefined && request.lastName !== existingUser.lastName) {
        updateData.lastName = request.lastName;
        hasChanges = true;
      }

      if (request.isActive !== undefined && request.isActive !== existingUser.isActive) {
        updateData.isActive = request.isActive;
        hasChanges = true;
      }

      if (
        request.mustChangePassword !== undefined &&
        request.mustChangePassword !== existingUser.mustChangePassword
      ) {
        updateData.mustChangePassword = request.mustChangePassword;
        hasChanges = true;
      }

      // If no changes, return existing user
      if (!hasChanges) {
        this.log('No changes detected for user', { userId: request.id });
        return { user: existingUser };
      }

      // Update user
      const updatedUser = await this.userRepository.update(request.id, updateData);

      this.log('User updated successfully', {
        userId: updatedUser.id,
        changes: Object.keys(updateData),
      });

      return { user: updatedUser };
    } catch (error) {
      this.logError('Failed to update user', error);
      throw error;
    }
  }

  private async ensureEmailNotTaken(email: string, currentUserId: string): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser && existingUser.id !== currentUserId) {
      throw new ConflictException('Email is already taken by another user');
    }
  }
}
