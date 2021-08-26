import {Tree, zeroNode} from "@chainsafe/persistent-merkle-tree";

const tree = new Tree(zeroNode(5));
const g = BigInt(16);

let i = 0;
const heapUsed = process.memoryUsage().heapUsed;

while (true) {
  getBigStateTreeBacked();
  global.gc();
  console.log(i++, (process.memoryUsage().heapUsed - heapUsed) / 1e6, "MB");
}

function getBigStateTreeBacked(): void {
  for (let i = 0; i < 50_000; i++) {
    tree.getSubtree(g);
  }
}
