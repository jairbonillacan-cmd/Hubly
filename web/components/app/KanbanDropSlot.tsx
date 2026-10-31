export function KanbanDropSlot({ height }: { height: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        flexShrink: 0,
        borderRadius: 12,
        border: "1.5px dashed var(--hb-accent)",
        background: "var(--ui-accent-soft)",
      }}
    />
  );
}
