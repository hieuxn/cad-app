export class GeneratorHelper {
  static * iterate<T>(array: T[]): Generator<T> {
    for (const item of array) {
      yield item;
    }
  }

  static * convert<T>(item: T): Generator<T> {
    yield item;
  }
}