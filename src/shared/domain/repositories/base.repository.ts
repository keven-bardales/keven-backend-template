export abstract class BaseRepository<TEntity, TCreateData, TUpdateData> {
  abstract findById(id: string): Promise<TEntity | null>;
  abstract findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: Record<string, any>;
  }): Promise<TEntity[]>;
  abstract create(data: TCreateData): Promise<TEntity>;
  abstract update(id: string, data: TUpdateData): Promise<TEntity>;
  abstract delete(id: string): Promise<void>;
  abstract exists(id: string): Promise<boolean>;
  abstract count(where?: Record<string, any>): Promise<number>;
}
