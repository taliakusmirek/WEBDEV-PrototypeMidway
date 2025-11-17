// Render nested replies as a thread list
export function renderThread(list = [], usersById = {}) {
  return `<ul class="thread">${list
    .map((node) => renderNode(node, usersById))
    .join("")}</ul>`;
}

function renderNode(node, users) {
  const color = users[node.author]?.avatarColor || "#d8d8d8";
  return `
    <li class="thread__item" data-id="${node.id}">
      <div class="thread__row">
        <div class="avatar avatar--sm" style="background:${color}"></div>
        <div class="thread__content">
          <div class="thread__text">${escapeHtml(node.body || "")}</div>

          <div class="thread__controls">
            <span class="thread__confidence">Confidence: ${
              node.confidence ?? 3
            }/5</span>
            <button class="btn btn--small btn--ghost" data-conf="${
              node.id
            }">Set Confidence</button>
            <button class="btn btn--small btn--ghost" data-upvote="${
              node.id
            }">▲ ${node.upvotes ?? 0}</button>
            <button class="btn btn--small btn--ghost" data-reply="${
              node.id
            }">Reply</button>
            <button class="btn btn--small btn--ghost" data-edit="${
              node.id
            }">Edit</button>
            <button class="btn btn--small btn--ghost" data-delete="${
              node.id
            }">Delete</button>
          </div>

          <div class="replybox" data-replybox="${
            node.id
          }" style="display:none; margin-top:8px;">
            <textarea
              rows="2"
              class="replybox__text"
              placeholder="Write a reply..."
              style="width:100%; padding:6px 8px; border:1px solid var(--border); border-radius:8px;"></textarea>

            <label style="font-size:12px; display:inline-block; margin-top:4px;">
              Confidence:
              <select class="replybox__confidence"
                      style="padding:2px 4px; border-radius:6px; border:1px solid var(--border);">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3" selected>3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>

            <div class="replybox__footer" style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
              <button class="btn btn--small" data-submit-reply="${
                node.id
              }">Post Reply</button>
              <button class="btn btn--small btn--ghost" data-cancel-reply="${
                node.id
              }">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      ${
        node.replies?.length
          ? `<ul class="thread thread--child">
             ${node.replies.map((n) => renderNode(n, users)).join("")}
           </ul>`
          : ""
      }
    </li>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
