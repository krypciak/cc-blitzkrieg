export class Rectangle {
    constructor(x, y, width, height) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.height = Math.floor(height);
        this.width = Math.floor(width);
    }
}

export class Stack {
  constructor() { this.items = []; }
  push(element) { this.items.push(element); }
  pop() { return this.items.pop(); }
  peek() { return this.items[this.items.length - 1]; }
  shift() { return this.items.shift(); }
  length() { return this.items.length; }
}
