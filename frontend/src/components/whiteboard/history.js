export class HistoryManager {
  constructor(limit = 120) {
    this.undoStack = [];
    this.redoStack = [];
    this.limit = limit;
  }

  push(snapshot) {
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo(current) {
    if (!this.undoStack.length) return null;
    this.redoStack.push(current);
    return this.undoStack.pop();
  }

  redo(current) {
    if (!this.redoStack.length) return null;
    this.undoStack.push(current);
    return this.redoStack.pop();
  }

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  getDepth() {
    return this.undoStack.length;
  }
}
