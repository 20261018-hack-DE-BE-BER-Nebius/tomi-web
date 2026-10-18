export function validateDiagramSource(source: string): boolean {
  return (
    source.length <= 12000 &&
    /^(flowchart|graph)\s+(TD|TB|BT|RL|LR)\b/.test(source.trim()) &&
    !/%%\s*\{|^---|\bclick\s|<\/?(?:script|iframe|img|svg)\b/im.test(source)
  );
}
