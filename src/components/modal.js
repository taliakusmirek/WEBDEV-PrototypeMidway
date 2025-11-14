export function openModal(innerHtml){
  const root = ensureRoot();
  root.innerHTML = `
    <div class="backdrop" role="dialog" aria-modal="true">
      ${innerHtml}
    </div>`;
  document.body.style.overflow = 'hidden';
  root.addEventListener('click', onBackdrop);
  document.addEventListener('keydown', onEsc);
}

export function closeModal(){
  const root = document.getElementById('modal-root');
  if(!root) return;
  root.innerHTML = '';
  document.body.style.overflow = '';
  root.removeEventListener('click', onBackdrop);
  document.removeEventListener('keydown', onEsc);
}

function ensureRoot(){
  let root = document.getElementById('modal-root');
  if(!root){
    root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }
  return root;
}

function onBackdrop(e){
  if(e.target.classList.contains('backdrop')) closeModal();
}
function onEsc(e){ if(e.key === 'Escape') closeModal(); }
