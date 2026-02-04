import init, { move_player } from "./wasm/pkg/xcraft.js";

export async function initWasm() {
  await init();
}

export function wasmMove(x, y, key) {
  return move_player(x, y, key);
}
