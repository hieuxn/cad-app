export class GeneratorHelper {
  public static * iterate<T>(array: T[]): Generator<T> {
    for (const item of array) {
      yield item;
    }
  }

  public static * convert<T>(item: T): Generator<T> {
    yield item;
  }
}