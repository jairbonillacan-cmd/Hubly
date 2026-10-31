export function KanbanDropSlot({ height }: { height: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        flexShrink: 0,
        borderRadius: 12,
        border: "1.5px dashed #6C77C1",
        background: "var(--ui-accent-soft)",
      }}
    />
  );
}
