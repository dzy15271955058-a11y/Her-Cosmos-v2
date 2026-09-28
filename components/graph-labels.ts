type LabelPoint = { id: string; x: number; y: number };

// Keep projected node names readable when the graph rotates nearly edge-on.
export function placeGraphLabels(host: HTMLDivElement | null, points: LabelPoint[], width: number, height: number) {
  if (!host) return;
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  for (const point of points) {
    const label = host.querySelector<HTMLElement>(`[data-id="${point.id}"]`);
    if (!label) continue;
    const w = label.offsetWidth, h = label.offsetHeight;
    const x = Math.max(w / 2 + 8, Math.min(width - w / 2 - 8, point.x));
    let y = point.y;
    for (let attempt = 0; attempt < 32; attempt++) {
      const offset = attempt ? Math.ceil(attempt / 2) * (h + 5) * (attempt % 2 ? -1 : 1) : 0;
      y = Math.max(145 + h / 2, Math.min(height - 65 - h / 2, point.y + offset));
      if (!placed.some(p => Math.abs(x - p.x) < (w + p.w) / 2 + 4 && Math.abs(y - p.y) < (h + p.h) / 2 + 4)) break;
    }
    placed.push({ x, y, w, h });
    label.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`;
  }
}
