// Load initial store from JSON with a graceful fallback for local file browsing
let memoryStore = null;
const deepClone = (obj) => (typeof structuredClone === 'function') ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));

export async function loadStore(){
  try{
    const res = await fetch('src/data/initialStore.json', {cache:'no-store'});
    if(!res.ok) throw new Error('Failed to load JSON');
    const data = await res.json();
    memoryStore = deepClone(data);
    return memoryStore;
  }catch(err){
    // Fallback data mirrors initialStore.json for offline/file:// viewing
    memoryStore = {
      course: { professor: 'Professor Yun', code: 'CS1101' },
      filters: { keywords: [
        { key: 'top', label: 'Top Questions', type: 'flag' },
        { key: 'professor', label: 'Professor Response', type: 'flag' },
        { key: 'ta', label: 'TA Response', type: 'flag' }
      ] },
      users: [
        { id: 'u1', name: 'Alex', avatarColor: '#f4c431' },
        { id: 'u2', name: 'Brook', avatarColor: '#6ea0ff' },
        { id: 'u3', name: 'Casey', avatarColor: '#6ad58b' },
        { id: 'u4', name: 'Devon', avatarColor: '#d1d1d1' }
      ],
      questions: [
        { id:'q1', title:'Confused about recursion cases', body:'I am confused about base vs recursive cases when implementing a function that counts paths. Where do I stop?', postedAt:'2025-11-13T12:00:00Z', responders:['u1','u2','u3'], upvotes:1, badges:[], image:true,
          replies:[
            { id:'c1', author:'u2', body:'Base case handles smallest input (e.g., n===0). Recursive case reduces the problem.', upvotes:2, replies:[
              { id:'c1-1', author:'u1', body:'Thanks! Any rule of thumb to pick base case?', upvotes:1, replies:[] }
            ]}
          ]
        },
        { id:'q2', title:'Midterm review topics?', body:'What chapters should we focus on for the midterm?', postedAt:'2025-11-13T12:30:00Z', responders:['u2','u3','u4'], upvotes:1, badges:[], image:true,
          replies:[{ id:'c2', author:'u3', body:'Ch 1-5 and dynamic programming intro.', upvotes:1, replies:[] }] },
        { id:'q3', title:'Study group for Assignment 3?', body:'Looking for 2 people to go over Assignment 3 tonight.', postedAt:'2025-11-13T10:00:00Z', responders:['u4','u2','u3'], upvotes:1, badges:[], image:true,
          replies:[] },
        { id:'q4', title:'How does Big‑O notation work?', body:'Can someone explain Big-O formally with examples?', postedAt:'2025-11-13T09:50:00Z', responders:['u1','u3','u2'], upvotes:1, badges:['Professor Response'], image:true,
          replies:[{ id:'c4', author:'u1', body:'It describes upper bound on growth rate of runtime.', upvotes:3, replies:[] }] }
      ]
    };
    return memoryStore;
  }
}

export function getStore(){
  return memoryStore;
}

export function updateQuestion(qid, updater){
  const s = getStore();
  if(!s) return;
  const idx = s.questions.findIndex(q => q.id === qid);
  if(idx >= 0){
    s.questions[idx] = updater(deepClone(s.questions[idx]));
  }
}
