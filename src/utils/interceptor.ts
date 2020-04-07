export class Interceptor {
  constructor(
    private before?: () => void | undefined,
    private after?: () => void | undefined,
  ) {}

  call<T>(callback: () => T): T {
    if (this.before) this.before()
    const callbackResult = callback()
    if (this.after) this.after()
    return callbackResult
  }

  dispose() {
    this.before = undefined
    this.after = undefined
  }
}
