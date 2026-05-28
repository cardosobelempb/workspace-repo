// shared/module/module.types.ts

export type ClassConstructor<T extends object = object> = new (...args: any[]) => T;

export type ControllerInstance = object;

export type InjectionToken<T = unknown> = ClassConstructor<T & object> | string | symbol;

export type ProviderDefinition<T = unknown> =
  | {
      token: InjectionToken<T>;
      useClass: ClassConstructor<T & object>;
    }
  | {
      token: InjectionToken<T>;
      useValue: T;
    }
  | {
      token: InjectionToken<T>;
      useFactory: (...args: any[]) => T;
      inject?: InjectionToken[];
    };

export type ModuleDefinition = {
  providers: ProviderDefinition[];
  controllers: ClassConstructor[];
};
