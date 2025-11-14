import { loadStore, getStore, updateQuestion } from './data/store.js';
import { renderCard } from './components/card.js';
import { renderFilters } from './components/filters.js';
import { openModal, closeModal } from './components/modal.js';
import { renderThread } from './components/thread.js';

window.addEventListener('DOMContentLoaded', async () => {
  let store;
  try {
    store = await loadStore();
    console.log('[store loaded]', store);
  } catch (e) {
    console.error('Failed to load store', e);
    store = { questions: [], users: [] };
  }

  // Update course header from store
  const profEl = document.querySelector('.course__prof');
  const codeEl = document.querySelector('.course__code');
  if (profEl && store?.course?.professor) profEl.textContent = store.course.professor;
  if (codeEl && store?.course?.code) codeEl.textContent = store.course.code;

  // Render filters
  const filterRoot = document.getElementById('filter-root');
  let currentFilters = {};
  let searchTerm = '';
  let currentPage = 1;
  const pageSize = 4;
  let sortMode = 'newest';

  // Restore state from localStorage
  try{
    const saved = JSON.parse(localStorage.getItem('qa_state') || '{}');
    if (saved) {
      currentFilters = saved.filters || {};
      searchTerm = saved.search || '';
      currentPage = saved.page || 1;
      sortMode = saved.sort || 'newest';
    }
  }catch{}
  if (filterRoot) {
    renderFilters(filterRoot, store);
    filterRoot.addEventListener('filters:apply', (e)=>{
      currentFilters = e.detail || {};
      applyFilters(currentFilters, searchTerm);
    });
    filterRoot.addEventListener('filters:reset', ()=>{
      currentFilters = {};
      applyFilters(currentFilters, searchTerm);
    });
  }

  // Prepare lookup
  const usersById = Object.fromEntries((store.users || []).map(u => [u.id, u]));

  // Live search by title
  const searchInput = document.querySelector('.searchbar__input input');
  if (searchInput) {
    if (searchTerm) searchInput.value = searchTerm;
    searchInput.addEventListener('input', (e)=>{
      searchTerm = e.target.value || '';
      applyFilters(currentFilters, searchTerm);
    });
    // Esc clears search
    searchInput.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchTerm = '';
        applyFilters(currentFilters, searchTerm);
      }
    });
  }

  // Sort selection
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect){
    sortSelect.value = sortMode;
    sortSelect.addEventListener('change', ()=>{
      sortMode = sortSelect.value;
      applyFilters(currentFilters, searchTerm);
    });
  }

  // Navbar active switching
  document.querySelectorAll('.nav__links .nav__link').forEach(a => {
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      document.querySelectorAll('.nav__links .nav__link').forEach(n => n.classList.remove('is-active'));
      a.classList.add('is-active');
    });
  });

  // Ask Question modal
  const askBtn = document.getElementById('ask-btn');
  if (askBtn) {
    askBtn.addEventListener('click', ()=>{
      openModal(`
        <div class="modal">
          <div class="modal__header">
            <h3 class="modal__title">Ask a question</h3>
            <button class="modal__close" aria-label="Close">×</button>
          </div>
          <form class="ask-form">
            <label>Title<br><input type="text" name="title" required style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px"></label>
            <label style="margin-top:8px;display:block">Details<br><textarea name="body" rows="4" required style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px"></textarea></label>
            <div class="modal__replyactions" style="margin-top:10px">
              <button class="btn btn--small" type="submit">Post question</button>
            </div>
          </form>
        </div>`);
      const root = document.getElementById('modal-root');
      root.querySelector('.modal__close').addEventListener('click', closeModal);
      root.querySelector('.ask-form').addEventListener('submit', (e)=>{
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const title = String(fd.get('title')||'').trim();
        const body = String(fd.get('body')||'').trim();
        if(!title || !body) return;
        const id = 'q'+Math.random().toString(36).slice(2,7);
        const now = new Date().toISOString();
        const q = { id, title, body, postedAt: now, responders: [], upvotes: 0, badges: [], image: true, replies: [] };
        // append to store
        const s = getStore();
        s.questions.unshift(q);
        closeModal();
        currentPage = 1;
        applyFilters(currentFilters, searchTerm);
      });
    });
  }

  // Render cards
  const cardsRoot = document.getElementById('cards-root');
  if (cardsRoot) {
    applyFilters(currentFilters, searchTerm);

    // Open modal on card click
    cardsRoot.addEventListener('click', (e) => {
      const up = e.target.closest('[data-card-upvote]');
      if (up) {
        const id = up.getAttribute('data-card-upvote');
        updateQuestion(id, q => ({...q, upvotes: (q.upvotes||0)+1}));
        applyFilters(currentFilters, searchTerm);
        return;
      }
      const card = e.target.closest('.card');
      if (!card) return;
      const id = card.getAttribute('data-id');
      const q = (getStore().questions || []).find(x => x.id === id);
      if (!q) return;
      openQuestionModal(q);
    });

    // Keyboard: open card on Enter/Space; Upvote on Enter/Space when pill focused
    cardsRoot.addEventListener('keydown', (e)=>{
      const pill = e.target.closest('[data-card-upvote]');
      if (pill && (e.key === 'Enter' || e.key === ' ')){
        e.preventDefault();
        const id = pill.getAttribute('data-card-upvote');
        updateQuestion(id, q => ({...q, upvotes: (q.upvotes||0)+1}));
        applyFilters(currentFilters, searchTerm);
        return;
      }
      const card = e.target.closest('.card');
      if (card && (e.key === 'Enter' || e.key === ' ')){
        e.preventDefault();
        const id = card.getAttribute('data-id');
        const q = (getStore().questions || []).find(x => x.id === id);
        if (q) openQuestionModal(q);
      }
    });
  }

  function applyFilters(filters, term=''){
    const s = getStore();
    let list = [...(s.questions||[])];
    if (filters.professor) list = list.filter(q => (q.badges||[]).includes('Professor Response'));
    // In this simple demo, 'top' means upvotes > 1
    if (filters.top) list = list.filter(q => (q.upvotes||0) > 1);
    if (filters.ta) {
      // Demo heuristic: questions with at least 1 reply are considered 'TA Response'
      list = list.filter(q => (q.replies||[]).length > 0);
    }
    if (term) {
      const t = term.toLowerCase();
      list = list.filter(q => String(q.title||'').toLowerCase().includes(t));
    }
    // Sorting
    if (sortMode === 'newest'){
      list.sort((a,b)=> new Date(b.postedAt) - new Date(a.postedAt));
    } else if (sortMode === 'oldest'){
      list.sort((a,b)=> new Date(a.postedAt) - new Date(b.postedAt));
    } else if (sortMode === 'top'){
      list.sort((a,b)=> (b.upvotes||0) - (a.upvotes||0));
    }
    // pagination
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const pageItems = list.slice(start, start + pageSize);
    const empty = document.getElementById('empty-state');
    if (pageItems.length){
      if (empty) empty.style.display = 'none';
      cardsRoot.innerHTML = pageItems.map(q => renderCard(q, usersById)).join('');
    } else {
      cardsRoot.innerHTML = '';
      if (empty) empty.style.display = '';
    }
    renderPagination(totalPages);
    // Persist state
    try{
      localStorage.setItem('qa_state', JSON.stringify({ filters, search: term, page: currentPage, sort: sortMode }));
    }catch{}
  }

  function openQuestionModal(question){
    const s = getStore();
    const users = Object.fromEntries((s.users||[]).map(u => [u.id, u]));
    const avatars = (question.responders||[]).slice(0,3).map(uid => {
      const u = users[uid] || { avatarColor: '#d8d8d8' };
      return `<div class="avatar avatar--sm" style="background:${u.avatarColor}"></div>`;
    }).join('');

    const content = `
      <div class="modal">
        <div class="modal__header">
          <h3 class="modal__title">${escapeHtml(question.title)}</h3>
          <button class="modal__close" aria-label="Close">×</button>
        </div>
        <div class="modal__meta">Upvotes: <strong>${question.upvotes ?? 0}</strong></div>
        <div class="modal__body">${escapeHtml(question.body || '')}</div>
        <div class="modal__avatars">${avatars}</div>
        <div class="modal__actions">
          <button class="btn btn--small" data-action="upvote">Upvote</button>
        </div>
        <div class="modal__threads">
          ${renderThread(question.replies || [], users)}
        </div>
        <form class="modal__replyform">
          <textarea rows="3" placeholder="Add a reply..."></textarea>
          <div class="modal__replyactions">
            <button class="btn btn--small" type="submit">Post reply</button>
          </div>
        </form>
      </div>`;

    openModal(content);

    const root = document.getElementById('modal-root');
    root.querySelector('.modal__close').addEventListener('click', closeModal);
    root.querySelector('[data-action="upvote"]').addEventListener('click', ()=>{
      updateQuestion(question.id, q => ({...q, upvotes: (q.upvotes||0)+1}));
      rerenderModal(question.id);
      renderCards();
    });
    root.querySelector('.modal__threads').addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-edit], [data-delete], [data-upvote], [data-reply]');
      if(!btn) return;
      const action = btn.dataset.edit ? 'edit' : btn.dataset.delete ? 'delete' : btn.dataset.upvote ? 'up' : 'reply';
      const cid = btn.dataset.edit || btn.dataset.delete || btn.dataset.upvote || btn.dataset.reply;
      updateQuestion(question.id, q => {
        const copy = q;
        mutateComment(copy.replies||[], cid, action);
        return {...copy};
      });
      rerenderModal(question.id);
    });
    root.querySelector('.modal__replyform').addEventListener('submit', (e)=>{
      e.preventDefault();
      const ta = e.currentTarget.querySelector('textarea');
      const text = ta.value.trim();
      if(!text) return;
      updateQuestion(question.id, q => ({
        ...q,
        replies: [...(q.replies||[]), { id: 'c'+Math.random().toString(36).slice(2,7), author: 'u1', body: text, upvotes:0, replies: [] }]
      }));
      ta.value = '';
      rerenderModal(question.id);
    });
  }

  function rerenderModal(qid){
    const q = (getStore().questions||[]).find(x=>x.id===qid);
    if(!q) return closeModal();
    const users = Object.fromEntries((getStore().users||[]).map(u => [u.id, u]));
    const root = document.getElementById('modal-root');
    root.querySelector('.modal__meta').innerHTML = `Upvotes: <strong>${q.upvotes??0}</strong>`;
    root.querySelector('.modal__threads').innerHTML = renderThread(q.replies||[], users);
  }

  function mutateComment(list, targetId, action){
    for(let i=0;i<list.length;i++){
      const c = list[i];
      if(c.id === targetId){
        if(action==='up') c.upvotes = (c.upvotes||0)+1;
        else if(action==='delete') list.splice(i,1);
        else if(action==='edit') c.body = prompt('Edit comment:', c.body || '') || c.body;
        else if(action==='reply') (c.replies ||= []).push({ id: 'c'+Math.random().toString(36).slice(2,7), author:'u1', body: prompt('Reply:')||'', upvotes:0, replies:[] });
        return true;
      }
      if(c.replies && mutateComment(c.replies, targetId, action)) return true;
    }
    return false;
  }

  function escapeHtml(str){
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/\"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }
});
