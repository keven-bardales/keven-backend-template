import { BaseUseCase } from '../../../../shared/domain/use-cases/base.use-case';
import { UserEntity } from '../entities/user.entity';

export interface GetUserByIdRequest {
  id: string;
}

export interface GetUserByIdResponse {
  user: UserEntity;
}

export abstract class GetUserByIdUseCase extends BaseUseCase<
  GetUserByIdRequest,
  GetUserByIdResponse
> {
  abstract execute(request: GetUserByIdRequest): Promise<GetUserByIdResponse>;
}
