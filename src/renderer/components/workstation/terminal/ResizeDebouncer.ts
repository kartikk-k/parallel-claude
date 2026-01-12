/**
 * Resize debouncer - VSCode pattern
 * Debounces resize operations to avoid excessive reflows
 */

class ResizeDebouncer {
  private _timeout: NodeJS.Timeout | null = null;
  private _pendingResize = false;

  constructor(
    private _delay: number,
    private _onResize: () => void
  ) {}

  /**
   * Trigger a resize (debounced)
   */
  trigger(): void {
    this._pendingResize = true;

    if (this._timeout) {
      clearTimeout(this._timeout);
    }

    this._timeout = setTimeout(() => {
      if (this._pendingResize) {
        this._onResize();
        this._pendingResize = false;
      }
      this._timeout = null;
    }, this._delay);
  }

  /**
   * Flush pending resize immediately
   */
  flush(): void {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    if (this._pendingResize) {
      this._onResize();
      this._pendingResize = false;
    }
  }

  /**
   * Cancel pending resize
   */
  cancel(): void {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    this._pendingResize = false;
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.cancel();
  }
}

export default ResizeDebouncer;
