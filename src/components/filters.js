export function renderFilters(root, store){
  const keywords = store?.filters?.keywords || [];
  const form = document.createElement('form');
  form.className = 'filter__form';
  form.action = '#';
  form.method = 'get';

  const group = document.createElement('div');
  group.className = 'filter__group';
  const subtitle = document.createElement('span');
  subtitle.className = 'filter__subtitle';
  subtitle.textContent = 'Keywords';
  group.appendChild(subtitle);

  keywords.forEach(k => {
    const label = document.createElement('label');
    label.className = 'filter__option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = k.key;
    label.appendChild(input);
    const span = document.createElement('span');
    span.textContent = k.label;
    label.appendChild(span);
    group.appendChild(label);
  });

  const actions = document.createElement('div');
  actions.className = 'filter__actions';
  const apply = document.createElement('button');
  apply.type = 'submit';
  apply.className = 'btn btn--small';
  apply.textContent = 'Apply';
  const reset = document.createElement('button');
  reset.type = 'reset';
  reset.className = 'btn btn--small btn--ghost';
  reset.textContent = 'Reset';
  actions.appendChild(apply);
  actions.appendChild(reset);

  const note = document.createElement('div');
  note.className = 'filter__note';
  note.textContent = 'Filter for better analysis of posts';

  form.appendChild(group);
  form.appendChild(actions);
  form.appendChild(note);

  // Replace previous content except the title
  root.querySelectorAll(':scope > *:not(.filter__title)')?.forEach(n => n.remove());
  root.appendChild(form);

  // Submit/Reset dispatch events so main.js can filter
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const detail = getFilterState(form);
    root.dispatchEvent(new CustomEvent('filters:apply', { detail }));
  });
  form.addEventListener('reset', ()=>{
    // allow browser to reset first
    setTimeout(()=>{
      root.dispatchEvent(new CustomEvent('filters:reset'));
    },0);
  });
}

export function getFilterState(form){
  const data = new FormData(form);
  return {
    top: data.has('top'),
    professor: data.has('professor'),
    ta: data.has('ta')
  };
}
