export const normalizeSeries = (values: number[], min = 0) => {
  if (values.length === 0) {
    return [];
  }
  const max = Math.max(...values);
  const floor = Math.min(min, ...values);
  const range = Math.max(1, max - floor);
  return values.map((v) => (v - floor) / range);
};

export const buildSmoothPath = (points: { x: number; y: number }[]) => {
  if (!points.length) {
    return "";
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` Q ${controlX} ${current.y}, ${next.x} ${next.y}`;
  }

  return path;
};
