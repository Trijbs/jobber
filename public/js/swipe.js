class SwipeHandler {
  constructor(element, { onSwipeLeft, onSwipeRight, onTap } = {}) {
    this.el = element;
    this.onSwipeLeft = onSwipeLeft;
    this.onSwipeRight = onSwipeRight;
    this.onTap = onTap;

    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.isDragging = false;
    this.threshold = 100;

    this.bindEvents();
  }

  bindEvents() {
    // Touch events
    this.el.addEventListener('touchstart', (e) => this.onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    this.el.addEventListener('touchmove', (e) => this.onMove(e.touches[0].clientX), { passive: true });
    this.el.addEventListener('touchend', () => this.onEnd());

    // Mouse events
    this.el.addEventListener('mousedown', (e) => this.onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => { if (this.isDragging) this.onMove(e.clientX); });
    window.addEventListener('mouseup', () => { if (this.isDragging) this.onEnd(); });

    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { this.onSwipeLeft?.(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { this.onSwipeRight?.(); e.preventDefault(); }
    });
  }

  onStart(x, y) {
    this.startX = x;
    this.startY = y;
    this.currentX = x;
    this.isDragging = true;
    this.el.style.transition = 'none';
  }

  onMove(x) {
    if (!this.isDragging) return;
    this.currentX = x;
    const dx = this.currentX - this.startX;
    const rotation = dx * 0.1;
    this.el.style.transform = `translateX(${dx}px) rotate(${rotation}deg)`;

    // Visual feedback
    if (dx > 50) {
      this.el.classList.add('swiping-right');
      this.el.classList.remove('swiping-left');
    } else if (dx < -50) {
      this.el.classList.add('swiping-left');
      this.el.classList.remove('swiping-right');
    } else {
      this.el.classList.remove('swiping-left', 'swiping-right');
    }
  }

  onEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    const dx = this.currentX - this.startX;
    const absDx = Math.abs(dx);

    this.el.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    this.el.classList.remove('swiping-left', 'swiping-right');

    if (absDx < 10 && Math.abs(this.currentX - this.startY) < 10) {
      // Tap
      this.el.style.transform = '';
      this.onTap?.();
    } else if (absDx > this.threshold) {
      // Swipe
      const direction = dx > 0 ? 1 : -1;
      this.el.style.transform = `translateX(${direction * 600}px) rotate(${direction * 30}deg)`;
      this.el.style.opacity = '0';

      setTimeout(() => {
        if (direction === 1) this.onSwipeRight?.();
        else this.onSwipeLeft?.();
      }, 300);
    } else {
      // Snap back
      this.el.style.transform = '';
    }
  }

  destroy() {
    // Events are cleaned up by GC since we use anonymous wrappers
  }
}
