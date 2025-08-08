import { TokenType } from './tokens';

export interface DependencyDescriptor {
  implementation: new (...args: any[]) => any;
  dependencies?: TokenType[];
  isSingleton?: boolean;
}

export class DependencyContainer {
  private readonly dependencies = new Map<TokenType, DependencyDescriptor>();
  private readonly singletonInstances = new Map<TokenType, any>();

  public registerClass<T>(
    token: TokenType,
    implementation: new (...args: any[]) => T,
    options?: {
      dependencies?: TokenType[];
      isSingleton?: boolean;
    }
  ): void {
    this.dependencies.set(token, {
      implementation,
      dependencies: options?.dependencies || [],
      isSingleton: options?.isSingleton ?? true,
    });
  }

  public registerValue<T>(token: TokenType, value: T): void {
    this.singletonInstances.set(token, value);
  }

  public resolve<T>(token: TokenType): T {
    if (this.singletonInstances.has(token)) {
      return this.singletonInstances.get(token) as T;
    }

    const descriptor = this.dependencies.get(token);
    if (!descriptor) {
      throw new Error(`Dependency not found for token: ${token.toString()}`);
    }

    const resolvedDependencies = descriptor.dependencies?.map(dep => this.resolve(dep)) || [];
    const instance = new descriptor.implementation(...resolvedDependencies);

    if (descriptor.isSingleton) {
      this.singletonInstances.set(token, instance);
    }

    return instance as T;
  }

  public has(token: TokenType): boolean {
    return this.dependencies.has(token) || this.singletonInstances.has(token);
  }

  public clear(): void {
    this.dependencies.clear();
    this.singletonInstances.clear();
  }

  public getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};

    for (const [token, descriptor] of this.dependencies) {
      const tokenName = token.toString();
      graph[tokenName] = descriptor.dependencies?.map(dep => dep.toString()) || [];
    }

    return graph;
  }

  public validateDependencies(): void {
    const visited = new Set<TokenType>();
    const visiting = new Set<TokenType>();

    const visit = (token: TokenType) => {
      if (visiting.has(token)) {
        throw new Error(`Circular dependency detected: ${token.toString()}`);
      }

      if (visited.has(token)) {
        return;
      }

      visiting.add(token);

      const descriptor = this.dependencies.get(token);
      if (descriptor?.dependencies) {
        for (const dependency of descriptor.dependencies) {
          if (!this.has(dependency)) {
            throw new Error(`Missing dependency: ${dependency.toString()} for ${token.toString()}`);
          }
          visit(dependency);
        }
      }

      visiting.delete(token);
      visited.add(token);
    };

    for (const token of this.dependencies.keys()) {
      visit(token);
    }
  }
}
