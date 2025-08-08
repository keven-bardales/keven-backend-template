import { NotFoundException } from '../../../../shared/domain/exceptions/global-exceptions';
import {
  GetUserByIdUseCase,
  GetUserByIdRequest,
  GetUserByIdResponse,
} from '../../domain/use-cases/get-user-by-id.use-case';
import { UserRepository } from '../../domain/repositories/user.repository';

export class GetUserByIdUseCaseImpl extends GetUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  public async execute(request: GetUserByIdRequest): Promise<GetUserByIdResponse> {
    this.log('Getting user by ID', { userId: request.id });

    try {
      const user = await this.userRepository.findById(request.id);

      if (!user) {
        throw new NotFoundException(`User with ID ${request.id} not found`);
      }

      this.log('User retrieved successfully', { userId: user.id });

      return { user };
    } catch (error) {
      this.logError('Failed to get user by ID', error);
      throw error;
    }
  }
}
