// Micro-interactions and hover animations
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Card lift on hover/focus
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => lift(card));
    card.addEventListener('mouseleave', () => unlift(card));
    card.addEventListener('focusin', () => lift(card));
    card.addEventListener('focusout', () => unlift(card));
  });

  function lift(el){
    el.style.transform = 'translateY(-4px)';
    el.style.boxShadow = '0 4px 8px rgba(0,0,0,.06), 0 14px 28px rgba(0,0,0,.08)';
  }
  function unlift(el){
    el.style.transform = '';
    el.style.boxShadow = '';
  }

  // Button ripple
  document.querySelectorAll('.btn, .fab').forEach(btn => {
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', function(e){
      if (prefersReduced) return;
      const r = document.createElement('span');
      r.className = 'ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = size + 'px';
      r.style.left = (e.clientX - rect.left - size/2) + 'px';
      r.style.top = (e.clientY - rect.top - size/2) + 'px';
      this.appendChild(r);
      setTimeout(() => r.remove(), 500);
    });
  });
})();
