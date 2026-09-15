export type SwingInputHandler = (direction: -1 | 1) => void;

export function bindSwingControls(onSwing: SwingInputHandler): () => void {
  const handlePointer = (clientX: number) => {
    const half = window.innerWidth * 0.5;
    const direction: -1 | 1 = clientX < half ? -1 : 1;
    onSwing(direction);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    handlePointer(event.clientX);
  };

  window.addEventListener('pointerdown', onPointerDown, { passive: true });

  return () => {
    window.removeEventListener('pointerdown', onPointerDown);
  };
}