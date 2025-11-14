// Render nested replies as a thread list
export function renderThread(list = [], usersById = {}){
  return `<ul class="thread">${list.map(node => renderNode(node, usersById)).join('')}</ul>`;
}

function renderNode(node, users){
  const color = (users[node.author]?.avatarColor) || '#d8d8d8';
  return `
    <li class="thread__item" data-id="${node.id}">
      <div class="thread__row">
        <div class="avatar avatar--sm" style="background:${color}"></div>
        <div class="thread__content">
          <div class="thread__text">${escapeHtml(node.body || '')}</div>
          <div class="thread__controls">
            <button class="btn btn--small btn--ghost" data-upvote="${node.id}">▲ ${node.upvotes ?? 0}</button>
            <button class="btn btn--small btn--ghost" data-reply="${node.id}">Reply</button>
            <button class="btn btn--small btn--ghost" data-edit="${node.id}">Edit</button>
            <button class="btn btn--small btn--ghost" data-delete="${node.id}">Delete</button>
          </div>
        </div>
      </div>
      ${node.replies?.length ? `<ul class="thread thread--child">${node.replies.map(n => renderNode(n, users)).join('')}</ul>` : ''}
    </li>`;
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\"/g,'&quot;')
    .replace(/'/g,'&#039;');
}
