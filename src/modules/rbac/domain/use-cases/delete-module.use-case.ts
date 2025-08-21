export interface DeleteModuleRequest {
  id: string;
}

export interface DeleteModuleResponse {
  success: boolean;
}

export abstract class DeleteModuleUseCase {
  abstract execute(request: DeleteModuleRequest): Promise<DeleteModuleResponse>;
}
