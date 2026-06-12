/* eslint-disable max-len, quotes, prettier/prettier -- inline single-file game HTML is seed data, not code to format */
/**
 * Seeds the catalog with starter "slop" games (idempotent by slug).
 * Usage: pnpm seed:games [-- env-file]   (default env file: .env.local)
 *
 * Creates a curator account (curator@ai-slop.local / @curator) and a batch of
 * approved single-file games so the catalog never launches empty.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return
  }

  const raw = readFileSync(filePath, 'utf8')

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const eq = trimmed.indexOf('=')

    if (eq === -1) {
      continue
    }

    const key = trimmed.slice(0, eq).trim()
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

const envFile = process.argv[2] ?? '.env.local'

loadEnvFile(resolve(process.cwd(), envFile))

type SeedGame = {
  slug: string
  title: string
  description: string
  about: string
  tool: string
  promptCount: number
  promptText: string
  genre: string
  coverEmoji: string
  htmlContent: string
}

const BASE_STYLE = `<style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#0b0b14;color:#eee;font-family:system-ui,sans-serif;user-select:none}h1{font-size:18px;margin:8px}p{color:#888;font-size:13px;margin:4px}canvas{border:1px solid #333;border-radius:8px;background:#11111c}button{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;border:0;border-radius:10px;padding:10px 22px;font-size:15px;font-weight:700;cursor:pointer}button:active{transform:scale(.96)}.big{font-size:42px;margin:10px}</style>`

const SEED_GAMES: SeedGame[] = [
  {
    slug: 'snake-but-it-apologizes',
    title: 'Snake, But It Apologizes',
    description: 'The snake has feelings now. You did this.',
    about: 'Classic snake, except after every apple the snake displays a heartfelt apology. Use the arrow keys. The apples did nothing wrong, and the snake knows it.',
    tool: 'claude',
    promptCount: 23,
    promptText: 'make snake in html but the snake feels bad about eating the apples. like really bad. it should apologize. yes one file.',
    genre: 'arcade',
    coverEmoji: '🐍',
    htmlContent: `<!doctype html><html><head><meta charset="utf-8"><title>Snake, But It Apologizes</title>${BASE_STYLE}</head><body><h1>🐍 Snake, But It Apologizes</h1><p id="s">score 0 — use arrow keys</p><canvas id="c" width="360" height="360"></canvas><p id="sorry"></p><script>
const c=document.getElementById('c'),x=c.getContext('2d'),N=18,S=20;let snake=[{x:9,y:9}],dir={x:1,y:0},apple={x:14,y:9},score=0,dead=false;
const SORRY=["i'm so sorry","the apple had a family","forgive me","i hate what i've become","why must i consume"];
document.addEventListener('keydown',e=>{const d={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}}[e.key];if(d&&!(d.x===-dir.x&&d.y===-dir.y)){dir=d;e.preventDefault()}});
function place(){apple={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}}
function tick(){if(dead)return;const h={x:(snake[0].x+dir.x+N)%N,y:(snake[0].y+dir.y+N)%N};if(snake.some(p=>p.x===h.x&&p.y===h.y)){dead=true;document.getElementById('s').textContent='final score '+score+' — refresh to try again';return}snake.unshift(h);if(h.x===apple.x&&h.y===apple.y){score++;document.getElementById('s').textContent='score '+score;document.getElementById('sorry').textContent='"'+SORRY[score%SORRY.length]+'" — the snake';place()}else snake.pop();
x.fillStyle='#11111c';x.fillRect(0,0,360,360);x.fillStyle='#ef4444';x.fillRect(apple.x*S+4,apple.y*S+4,12,12);snake.forEach((p,i)=>{x.fillStyle=i?'#22c55e':'#86efac';x.fillRect(p.x*S+2,p.y*S+2,16,16)})}
setInterval(tick,120);
</script></body></html>`,
  },
  {
    slug: 'rock-paper-existential-dread',
    title: 'Rock Paper Existential Dread',
    description: 'RPS where the opponent questions why you keep playing.',
    about: 'Rock, paper, scissors against an AI that wins, loses, and slowly loses the will to continue. Click a button. Contemplate.',
    tool: 'gpt',
    promptCount: 8,
    promptText: 'rock paper scissors but the computer gets progressively more existential with each round, single html file',
    genre: 'other',
    coverEmoji: '🪨',
    htmlContent: `<!doctype html><html><head><meta charset="utf-8"><title>Rock Paper Existential Dread</title>${BASE_STYLE}</head><body><h1>🪨 Rock Paper Existential Dread</h1><p id="score">you 0 — 0 void</p><div><button onclick="play(0)">🪨</button> <button onclick="play(1)">📄</button> <button onclick="play(2)">✂️</button></div><p id="r" class="big">…</p><p id="m">choose. or don't. it changes nothing.</p><script>
let w=0,l=0,n=0;const M=["another round. why.","you realize neither of us can stop","the scissors cut nothing that matters","paper covers rock. rock feels nothing.","i was trained on the entire internet for this","victory is a social construct","my random number generator is tired"];
function play(u){const a=Math.floor(Math.random()*3),E=['🪨','📄','✂️'];n++;let t;if(u===a)t='draw';else if((u+1)%3===a){l++;t='the void wins'}else{w++;t='you win, allegedly'}
document.getElementById('r').textContent=E[u]+' vs '+E[a]+' — '+t;document.getElementById('score').textContent='you '+w+' — '+l+' void';document.getElementById('m').textContent=M[n%M.length]}
</script></body></html>`,
  },
  {
    slug: 'cookie-clicker-for-nihilists',
    title: 'Cookie Clicker for Nihilists',
    description: 'Click the cookie. The cookie does not care.',
    about: 'An idle clicker with zero upgrades, zero prestige, zero meaning. The counter goes up. That is the entire game, and somehow you will keep clicking.',
    tool: 'cursor',
    promptCount: 12,
    promptText: 'cookie clicker but completely pointless, no upgrades, the cookie should slowly get more dismissive of the player',
    genre: 'clicker',
    coverEmoji: '🍪',
    htmlContent: `<!doctype html><html><head><meta charset="utf-8"><title>Cookie Clicker for Nihilists</title>${BASE_STYLE}</head><body><h1>🍪 Cookie Clicker for Nihilists</h1><p id="n" class="big">0</p><button id="b" style="font-size:64px;background:none;padding:0">🍪</button><p id="m">click it. or don't.</p><script>
let n=0;const M=[[10,'ten. wow.'],[50,'fifty clicks of pure nothing'],[100,'one hundred. your wrist hurts yet?'],[250,'there is no upgrade coming'],[500,'five hundred. seek help. or continue.'],[1000,'a thousand. the cookie respects your commitment to the void.']];
document.getElementById('b').onclick=()=>{n++;document.getElementById('n').textContent=n;const m=M.filter(x=>n>=x[0]).pop();if(m)document.getElementById('m').textContent=m[1];};
</script></body></html>`,
  },
  {
    slug: 'dodge-the-deadlines',
    title: 'Dodge the Deadlines',
    description: 'You are a developer. The deadlines are falling. Good luck.',
    about: 'Move with arrow keys (or A/D) and dodge the falling deadlines. Each one you avoid was somebody else’s problem all along. Speed increases because of course it does.',
    tool: 'claude',
    promptCount: 17,
    promptText: 'make a dodge game in one html file where you avoid falling "deadline" emojis, it should get faster over time, score = seconds survived',
    genre: 'arcade',
    coverEmoji: '📅',
    htmlContent: `<!doctype html><html><head><meta charset="utf-8"><title>Dodge the Deadlines</title>${BASE_STYLE}</head><body><h1>📅 Dodge the Deadlines</h1><p id="s">survive. arrows or A/D.</p><canvas id="c" width="360" height="420"></canvas><script>
const c=document.getElementById('c'),x=c.getContext('2d');let px=180,items=[],tm=0,alive=true,speed=2,keys={};
document.addEventListener('keydown',e=>keys[e.key]=true);document.addEventListener('keyup',e=>keys[e.key]=false);
setInterval(()=>{if(alive){tm++;document.getElementById('s').textContent='survived '+tm+'s';speed+=0.15}},1000);
setInterval(()=>{if(alive)items.push({x:Math.random()*340+10,y:-20})},420);
function loop(){if(keys.ArrowLeft||keys.a)px=Math.max(16,px-5);if(keys.ArrowRight||keys.d)px=Math.min(344,px+5);
x.fillStyle='#11111c';x.fillRect(0,0,360,420);x.font='22px serif';items.forEach(i=>{i.y+=speed;x.fillText('📅',i.x-11,i.y)});items=items.filter(i=>i.y<440);
x.fillText('🧑‍💻',px-11,400);for(const i of items){if(Math.abs(i.x-px)<20&&Math.abs(i.y-392)<18){alive=false;x.fillStyle='rgba(0,0,0,.6)';x.fillRect(0,0,360,420);x.fillStyle='#fff';x.font='16px system-ui';x.fillText('the deadline got you. survived '+tm+'s. refresh.',30,210);return}}
if(alive)requestAnimationFrame(loop)}loop();
</script></body></html>`,
  },
  {
    slug: 'emoji-memory-of-regret',
    title: 'Emoji Memory of Regret',
    description: 'Find the pairs. Remember what you have done.',
    about: 'A 4×4 memory game. Flip two cards; if they match, they stay. The game counts your attempts and judges you for every single one above the theoretical minimum.',
    tool: 'v0',
    promptCount: 31,
    promptText: 'emoji memory pairs game, 4x4 grid, count attempts, make fun of the player if they use too many attempts, one html file no frameworks',
    genre: 'puzzle',
    coverEmoji: '🧠',
    htmlContent: `<!doctype html><html><head><meta charset="utf-8"><title>Emoji Memory of Regret</title>${BASE_STYLE}<style>#g{display:grid;grid-template-columns:repeat(4,70px);gap:8px}#g button{font-size:28px;height:70px;background:#1b1b2c;border-radius:10px}</style></head><body><h1>🧠 Emoji Memory of Regret</h1><p id="s">attempts: 0</p><div id="g"></div><p id="m"></p><script>
const E=['🦆','🍕','👾','🥦','🎲','🧦','🛸','🦀'];let deck=[...E,...E].sort(()=>Math.random()-.5),open=[],tries=0,found=0;
const g=document.getElementById('g');deck.forEach((e,i)=>{const b=document.createElement('button');b.textContent='❓';b.onclick=()=>flip(b,e);g.appendChild(b)});
function flip(b,e){if(open.length===2||b.disabled||b.textContent===e)return;b.textContent=e;open.push([b,e]);
if(open.length===2){tries++;document.getElementById('s').textContent='attempts: '+tries;const[[b1,e1],[b2,e2]]=open;
if(e1===e2){b1.disabled=b2.disabled=true;found++;open=[];if(found===8)document.getElementById('m').textContent=tries<=12?'suspiciously good.':'done in '+tries+' attempts. the minimum is 8. reflect.'}
else setTimeout(()=>{b1.textContent=b2.textContent='❓';open=[]},650)}}
</script></body></html>`,
  },
  {
    slug: 'one-button-philosophy',
    title: 'One Button Philosophy',
    description: 'Reaction test. The button appears when it feels ready.',
    about: 'Wait for the button to turn green, then click as fast as you can. Click too early and the game will quietly note your impatience. Best of five attempts.',
    tool: 'gpt',
    promptCount: 6,
    promptText: 'reaction time test in one html file, green light click test, snarky messages for early clicks, show average of 5',
    genre: 'other',
    coverEmoji: '🟢',
    htmlContent: `<!doctype html><html><head><meta charset="utf-8"><title>One Button Philosophy</title>${BASE_STYLE}</head><body><h1>🟢 One Button Philosophy</h1><p id="m">click start. then wait. patience is the game.</p><button id="b">start</button><p id="r" class="big"></p><script>
let st=0,t0=0,times=[];const b=document.getElementById('b'),m=document.getElementById('m'),r=document.getElementById('r');
b.onclick=()=>{if(st===0){st=1;b.textContent='wait…';b.style.background='#333';setTimeout(()=>{if(st===1){st=2;b.textContent='CLICK';b.style.background='#22c55e';t0=performance.now()}},800+Math.random()*2200)}
else if(st===1){st=0;b.textContent='start';b.style.background='';m.textContent='you clicked early. the button is disappointed.'}
else{const d=Math.round(performance.now()-t0);times.push(d);st=0;b.textContent='start';b.style.background='';r.textContent=d+'ms';
m.textContent=times.length>=5?'average of '+times.length+': '+Math.round(times.reduce((a,c)=>a+c)/times.length)+'ms. acceptable, probably.':'attempt '+times.length+'/5';}};
</script></body></html>`,
  },
]

async function main() {
  // Import after env is loaded — config/env reads process.env at module init.
  const { default: connectDB } = await import('../lib/db/client')
  const { default: Game } = await import('../lib/db/models/Game')
  const { default: User } = await import('../lib/db/models/User')
  const { GameStatus } = await import('../src/api/game/model')
  const { time } = await import('../src/utils/time')

  await connectDB()

  const curatorEmail = 'curator@ai-slop.local'
  let curator = await User.findOne({ email: curatorEmail })

  if (!curator) {
    curator = await User.create({
      email: curatorEmail,
      username: 'curator',
      role: 'user',
      status: 'active',
      password: null,
    })
    console.log('Created curator user @curator')
  }

  let created = 0
  let skipped = 0

  for (const seed of SEED_GAMES) {
    const exists = await Game.findOne({ slug: seed.slug })

    if (exists) {
      skipped++
      continue
    }

    await Game.create({
      slug: seed.slug,
      title: seed.title,
      description: seed.description,
      about: seed.about,
      status: GameStatus.APPROVED,
      approvedAt: time().toISOString(),
      authorId: curator._id,
      authorUsername: curator.username ?? 'curator',
      tool: seed.tool,
      promptCount: seed.promptCount,
      promptText: seed.promptText,
      genre: seed.genre,
      htmlContent: seed.htmlContent,
      coverEmoji: seed.coverEmoji,
      allowEmbed: true,
    })
    created++
    console.log(`Seeded: ${seed.title}`)
  }

  console.log(`Done. Created ${created}, skipped ${skipped} (already present).`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
