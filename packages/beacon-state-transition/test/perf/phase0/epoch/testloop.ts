function useALotOfMemory(mb: number): void {
  const set = new Set<Buffer>();
  for (let i = 0; i < mb; i++) {
    const hex = String(i).padStart(4, "0").repeat(1e6);
    const buff = Buffer.from(hex, "hex");
    set.add(buff);
  }
}

let j = 0;
const heapUsed = process.memoryUsage().heapUsed;

for (let i = 0; i < 5; i++) {
  useALotOfMemory(400);
  console.log(j++, (process.memoryUsage().heapUsed - heapUsed) / 1e6, "MB");
}
