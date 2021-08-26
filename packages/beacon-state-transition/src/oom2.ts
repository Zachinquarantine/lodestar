void (async function f() {
  let i = 0;
  const heapUsed = process.memoryUsage().heapUsed;

  while (true) {
    // 1e7 =~ 120MB
    // 1e8 =~ 1200MB
    const arr: number[] = [];
    for (let i = 0; i < 1e8; i++) {
      arr.push(i);
    }

    // @ts-ignore
    new WeakRef(arr);

    // @ts-ignore
    global.gc();
    console.log(i++, (process.memoryUsage().heapUsed - heapUsed) / 1e6, "MB");

    await new Promise((r) => setTimeout(r, 0));
  }
})();
