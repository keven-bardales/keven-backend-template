import { NotFoundException } from '../../../../shared/domain/exceptions/global-exceptions';
import {
  DeleteUserUseCase,
  DeleteUserRequest,
  DeleteUserResponse,
} from '../../domain/use-cases/delete-user.use-case';
import { UserRepository } from '../../domain/repositories/user.repository';

export class DeleteUserUseCaseImpl extends DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  public async execute(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    this.log('Deleting user', { userId: request.id });

    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(request.id);

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${request.id} not found`);
      }

      // Check if user is active (optional business rule)
      if (existingUser.isActive) {
        this.log('Warning: Deleting an active user', { userId: request.id });
      }

      // Delete the user
      await this.userRepository.delete(request.id);

      this.log('User deleted successfully', { userId: request.id });

      return { success: true };
    } catch (error) {
      this.logError('Failed to delete user', error);

      // If it's already a known exception, re-throw it
      if (error instanceof NotFoundException) {
        throw error;
      }

      // For unexpected errors, return failure
      return { success: false };
    }
  }
}
