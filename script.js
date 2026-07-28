// 성격 데이터
const NATURE_DATA = {
    "고집 (Adamant)": { up: "attack", down: "special-attack" },
    "조심 (Modest)": { up: "special-attack", down: "attack" },
    "겁쟁이 (Timid)": { up: "speed", down: "attack" },
    "명랑 (Jolly)": { up: "speed", down: "special-attack" },
    "대담 (Bold)": { up: "defense", down: "attack" },
    "장난꾸러기 (Impish)": { up: "defense", down: "special-attack" },
    "차분 (Calm)": { up: "special-defense", down: "attack" },
    "신중 (Careful)": { up: "special-defense", down: "special-attack" },
    "외로움 (Lonely)": { up: "attack", down: "defense" },
    "개구쟁이 (Naughty)": { up: "attack", down: "special-defense" },
    "용감 (Brave)": { up: "attack", down: "speed" },
    "의젓 (Mild)": { up: "special-attack", down: "defense" },
    "덜렁 (Rash)": { up: "special-attack", down: "special-defense" },
    "냉정 (Quiet)": { up: "special-attack", down: "speed" },
    "장난기 (Lax)": { up: "defense", down: "special-defense" },
    "무사태평 (Relaxed)": { up: "defense", down: "speed" },
    "얌전 (Gentle)": { up: "special-defense", down: "defense" },
    "건방 (Sassy)": { up: "special-defense", down: "speed" },
    "성급 (Hasty)": { up: "speed", down: "defense" },
    "천진난만 (Naive)": { up: "speed", down: "special-defense" },
    "노력 (Hardy)": { up: null, down: null },
    "수줍음 (Bashful)": { up: null, down: null },
    "온순 (Docile)": { up: null, down: null },
    "변덕 (Quirky)": { up: null, down: null },
    "진지 (Serious)": { up: null, down: null }
};

const STAT_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const STAT_NAMES = {
    "hp": "체력 (HP)", "attack": "공격 (Atk)", "defense": "방어 (Def)",
    "special-attack": "특수공격 (Sp.Atk)", "special-defense": "특수방어 (Sp.Def)", "speed": "스피드 (Speed)"
};

let pokemonMap = new Map();
let currentPokemonStats = { hp: 0, attack: 0, defense: 0, "special-attack": 0, "special-defense": 0, speed: 0 };
let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    populateNatures(document.getElementById('natureSelect'));
    setupChart();
    loadAllPokemonNames();

    document.getElementById('genFilter').addEventListener('change', filterPokemonList);
    document.getElementById('searchInput').addEventListener('input', filterPokemonList);
    document.getElementById('pokemonSelect').addEventListener('change', (e) => fetchPokemonStats(e.target.value));
    document.getElementById('natureSelect').addEventListener('change', updateCalculations);
    
    document.getElementById('levelInput').addEventListener('input', (e) => {
        document.getElementById('levelValue').textContent = e.target.value;
        updateCalculations();
    });
    document.getElementById('ivInput').addEventListener('input', updateCalculations);
    document.getElementById('evInput').addEventListener('input', updateCalculations);
}

// 도감번호로 세대 계산
function getGeneration(id) {
    if (id <= 151) return 1; if (id <= 251) return 2; if (id <= 386) return 3;
    if (id <= 493) return 4; if (id <= 649) return 5; if (id <= 721) return 6;
    if (id <= 809) return 7; if (id <= 905) return 8; return 9;
}

// PokeAPI에서 한국어 번역본 데이터 한 번에 가져오기
async function loadAllPokemonNames() {
    const statusEl = document.getElementById('loadingStatus');
    try {
        const res = await fetch('https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv');
        const text = await res.text();
        const lines = text.split('\n');
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(',');
            const id = parseInt(parts[0]);
            const langId = parseInt(parts[1]); // 3 = Korean
            const name = parts[2];

            if (langId === 3 && id <= 1025) {
                pokemonMap.set(id, { id: id, name: name, gen: getGeneration(id) });
            }
        }
        
        statusEl.textContent = `✅ 1,025종 로딩 완료`;
        statusEl.className = "text-xs text-green-600 font-bold";
        filterPokemonList();

        // 기본 25번(피카츄) 선택
        fetchPokemonStats(25);

    } catch (error) {
        statusEl.textContent = `❌ 이름 데이터 로딩 실패`;
        statusEl.className = "text-xs text-red-600 font-bold";
    }
}

// 포켓몬 종족값 실시간으로 가져오기
async function fetchPokemonStats(idVal) {
    const id = parseInt(idVal, 10);
    if (!id || !pokemonMap.has(id)) return;

    const target = pokemonMap.get(id);
    const nameEl = document.getElementById('pokemonName');
    const spriteEl = document.getElementById('pokemonSprite');
    
    nameEl.textContent = `${target.name} (#${String(id).padStart(4, '0')}) - 스탯 로딩중...`;

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();

        // 종족값 파싱
        const stats = {};
        data.stats.forEach(s => {
            stats[s.stat.name] = s.base_stat;
        });
        
        currentPokemonStats = stats;
        
        // 공식 아트워크 지정
        const imgUrl = data.sprites.other['official-artwork'].front_default;
        if (imgUrl) spriteEl.src = imgUrl;

        nameEl.textContent = `${target.name} (#${String(id).padStart(4, '0')})`;
        updateCalculations();

    } catch (error) {
        nameEl.textContent = `${target.name} (API 오류 발생)`;
    }
}

function populateNatures(selectEl) {
    selectEl.innerHTML = '';
    for (let nature in NATURE_DATA) {
        const opt = document.createElement('option');
        opt.value = nature; opt.textContent = nature;
        selectEl.appendChild(opt);
    }
}

function filterPokemonList() {
    const genFilter = document.getElementById('genFilter').value;
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const selectEl = document.getElementById('pokemonSelect');

    let list = Array.from(pokemonMap.values());

    if (genFilter !== 'all') {
        const genNum = parseInt(genFilter, 10);
        list = list.filter(p => p.gen === genNum);
    }

    if (query !== '') {
        list = list.filter(p => p.name.includes(query) || String(p.id).includes(query));
    }

    selectEl.innerHTML = '';
    if (list.length === 0) {
        selectEl.innerHTML = '<option disabled selected>검색 결과가 없습니다.</option>';
        return;
    }

    list.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `#${String(p.id).padStart(4, '0')} [${p.gen}세대] - ${p.name}`;
        selectEl.appendChild(opt);
    });

    // 필터링 후 첫번째 항목의 스탯 로드
    fetchPokemonStats(list[0].id);
}

function calcHP(base, iv, ev, level) {
    if (base === 0) return 0; // 스탯 미로드 방어코드
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

function calcStat(base, iv, ev, level, mult) {
    if (base === 0) return 0;
    const baseCalc = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
    return Math.floor(baseCalc * mult);
}

function updateCalculations() {
    const levelInput = document.getElementById('levelInput');
    if (!levelInput) return; // 요소를 찾지 못한 경우 대비
    const level = parseInt(levelInput.value) || 50;
    const iv = parseInt(document.getElementById('ivInput').value) || 0;
    const ev = parseInt(document.getElementById('evInput').value) || 0;
    const natureSelect = document.getElementById('natureSelect');
    const nature = NATURE_DATA[natureSelect.value];

    if (!nature) return;

    const upText = nature.up ? STAT_NAMES[nature.up] : '없음';
    const downText = nature.down ? STAT_NAMES[nature.down] : '없음';
    const natureInfoEl = document.getElementById('natureInfo');
    if (natureInfoEl) {
        natureInfoEl.innerHTML = `
            <div class="text-red-500 font-semibold">🔺 상승 (×1.1): ${upText}</div>
            <div class="text-blue-500 font-semibold">🔻 하락 (×0.9): ${downText}</div>
        `;
    }

    const baseValues = [];
    const finalValues = [];
    const tableBody = document.getElementById('statsTableBody');
    if (tableBody) tableBody.innerHTML = '';

    STAT_KEYS.forEach(key => {
        const base = currentPokemonStats[key] || 0;
        let mult = 1.0; let badge = '➖'; let rowClass = '';

        if (nature.up === key) { mult = 1.1; badge = '🔺 (+10%)'; rowClass = 'up-stat'; } 
        else if (nature.down === key) { mult = 0.9; badge = '🔻 (-10%)'; rowClass = 'down-stat'; }

        let finalStat = (key === 'hp') ? calcHP(base, iv, ev, level) : calcStat(base, iv, ev, level, mult);

        baseValues.push(base);
        finalValues.push(finalStat);

        if (tableBody) {
            tableBody.innerHTML += `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="p-3 text-left pl-4 font-medium text-slate-700">${STAT_NAMES[key]}</td>
                    <td class="p-3 text-slate-600">${base}</td>
                    <td class="p-3 ${rowClass}">${badge}</td>
                    <td class="p-3 font-bold text-slate-900">${finalStat}</td>
                </tr>
            `;
        }
    });

    updateChart(baseValues, finalValues);
}

function setupChart() {
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: STAT_KEYS.map(k => STAT_NAMES[k]),
            datasets: [
                { label: '종족값', data: [0,0,0,0,0,0], backgroundColor: 'rgba(148, 163, 184, 0.2)', borderColor: '#94a3b8' },
                { label: '최종 능력치', data: [0,0,0,0,0,0], backgroundColor: 'rgba(239, 68, 68, 0.25)', borderColor: '#ef4444' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true } } }
    });
}

function updateChart(baseValues, finalValues) {
    if (!chartInstance) return;
    chartInstance.data.datasets[0].data = baseValues;
    chartInstance.data.datasets[1].data = finalValues;
    chartInstance.update();
}
