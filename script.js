// script.js
import { gen1Pokemon } from './data/gen1.js';
import { gen2Pokemon } from './data/gen2.js';
import { gen3Pokemon } from './data/gen3.js';
import { gen4Pokemon } from './data/gen4.js';
import { gen5Pokemon } from './data/gen5.js';
import { gen6Pokemon } from './data/gen6.js';
import { gen7Pokemon } from './data/gen7.js';
import { gen8Pokemon } from './data/gen8.js';
import { gen9Pokemon } from './data/gen9.js';

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
    "개난쟁 (Naughty)": { up: "attack", down: "special-defense" },
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
    "hp": "체력 (HP)",
    "attack": "공격 (Atk)",
    "defense": "방어 (Def)",
    "special-attack": "특수공격 (Sp.Atk)",
    "special-defense": "특수방어 (Sp.Def)",
    "speed": "스피드 (Speed)"
};

let pokemonMap = new Map();
let currentPokemonStats = { hp: 35, attack: 55, defense: 40, "special-attack": 50, "special-defense": 50, speed: 90 };
let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    const genFilter = document.getElementById('genFilter');
    const searchInput = document.getElementById('searchInput');
    const pokemonSelect = document.getElementById('pokemonSelect');
    const natureSelect = document.getElementById('natureSelect');
    const levelInput = document.getElementById('levelInput');
    const levelValue = document.getElementById('levelValue');
    const ivInput = document.getElementById('ivInput');
    const evInput = document.getElementById('evInput');

    populateNatures(natureSelect);
    setupChart();

    // 로컬 세대별 파일 로드
    loadLocalPokemonData();

    // 이벤트 리스너 등록
    if (genFilter) genFilter.addEventListener('change', filterPokemonList);
    if (searchInput) searchInput.addEventListener('input', filterPokemonList);
    if (pokemonSelect) pokemonSelect.addEventListener('change', () => onPokemonSelect(pokemonSelect.value));
    if (natureSelect) natureSelect.addEventListener('change', updateCalculations);
    
    if (levelInput) {
        levelInput.addEventListener('input', (e) => {
            if (levelValue) levelValue.textContent = e.target.value;
            updateCalculations();
        });
    }
    
    if (ivInput) ivInput.addEventListener('input', updateCalculations);
    if (evInput) evInput.addEventListener('input', updateCalculations);

    // 초기화 시 첫 번째 선택 (기본: 피카츄 #25)
    if (pokemonMap.has(25)) {
        if (pokemonSelect) pokemonSelect.value = "25";
        onPokemonSelect(25);
    } else if (pokemonMap.size > 0) {
        const firstId = pokemonMap.keys().next().value;
        if (pokemonSelect) pokemonSelect.value = firstId;
        onPokemonSelect(firstId);
    }
}

// 로컬 gen1.js ~ gen9.js 데이터 통합
function loadLocalPokemonData() {
    const genDataMap = {
        1: gen1Pokemon,
        2: gen2Pokemon,
        3: gen3Pokemon,
        4: gen4Pokemon,
        5: gen5Pokemon,
        6: gen6Pokemon,
        7: gen7Pokemon,
        8: gen8Pokemon,
        9: gen9Pokemon
    };

    pokemonMap.clear();

    for (let gen in genDataMap) {
        if (Array.isArray(genDataMap[gen])) {
            genDataMap[gen].forEach(item => {
                if (item && item.id) {
                    pokemonMap.set(item.id, {
                        ...item,
                        gen: parseInt(gen, 10)
                    });
                }
            });
        }
    }

    const statusEl = document.getElementById('loadingStatus');
    if (statusEl) {
        statusEl.textContent = `✅ 로딩 완료 (${pokemonMap.size}종)`;
        statusEl.className = "text-xs text-green-600 font-bold";
    }

    filterPokemonList();
}

function populateNatures(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    for (let nature in NATURE_DATA) {
        const opt = document.createElement('option');
        opt.value = nature;
        opt.textContent = nature;
        selectEl.appendChild(opt);
    }
}

// 🔍 완벽 검색 및 세대 필터 모듈
function filterPokemonList() {
    const genFilterEl = document.getElementById('genFilter');
    const searchInputEl = document.getElementById('searchInput');
    const selectEl = document.getElementById('pokemonSelect');

    const selectedGen = genFilterEl ? genFilterEl.value : 'all';
    const query = searchInputEl ? searchInputEl.value.trim().toLowerCase() : '';

    let list = Array.from(pokemonMap.values());

    // 1. 세대 필터
    if (selectedGen !== 'all') {
        const genNum = parseInt(selectedGen, 10);
        list = list.filter(p => p.gen === genNum);
    }

    // 2. 검색어 필터 (한글, 영문, 도감번호)
    if (query !== '') {
        list = list.filter(p => {
            const koName = (p.name || '').toLowerCase();
            const enName = (p.enName || '').toLowerCase();
            const idStr = String(p.id);

            return koName.includes(query) || 
                   enName.includes(query) || 
                   idStr.includes(query);
        });
    }

    renderSelectOptions(list, selectEl);
}

function renderSelectOptions(list, selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = '';

    if (list.length === 0) {
        const opt = document.createElement('option');
        opt.disabled = true;
        opt.selected = true;
        opt.textContent = "🔍 검색 결과가 없습니다.";
        selectEl.appendChild(opt);
        return;
    }

    list.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `#${String(p.id).padStart(4, '0')} [${p.gen}세대] - ${p.name} (${p.enName})`;
        selectEl.appendChild(opt);
    });

    selectEl.value = list[0].id;
    onPokemonSelect(list[0].id);
}

function onPokemonSelect(idVal) {
    const id = parseInt(idVal, 10);
    if (!id || !pokemonMap.has(id)) return;

    const target = pokemonMap.get(id);
    if (target && target.stats) {
        currentPokemonStats = target.stats;
    }

    const spriteEl = document.getElementById('pokemonSprite');
    const nameEl = document.getElementById('pokemonName');

    if (spriteEl) {
        spriteEl.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    }
    if (nameEl) {
        nameEl.textContent = `${target.name} (#${String(id).padStart(4, '0')})`;
    }

    updateCalculations();
}

function calcHP(base, iv, ev, level) {
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

function calcStat(base, iv, ev, level, mult) {
    const baseCalc = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
    return Math.floor(baseCalc * mult);
}

function updateCalculations() {
    const levelInput = document.getElementById('levelInput');
    const ivInput = document.getElementById('ivInput');
    const evInput = document.getElementById('evInput');
    const natureSelect = document.getElementById('natureSelect');

    const level = parseInt(levelInput ? levelInput.value : 50, 10) || 50;
    const iv = parseInt(ivInput ? ivInput.value : 0, 10) || 0;
    const ev = parseInt(evInput ? evInput.value : 0, 10) || 0;
    const natureKey = natureSelect ? natureSelect.value : '';
    const nature = NATURE_DATA[natureKey];

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
        let mult = 1.0;
        let badge = '➖';
        let rowClass = '';

        if (nature.up === key) {
            mult = 1.1;
            badge = '🔺 (+10%)';
            rowClass = 'up-stat';
        } else if (nature.down === key) {
            mult = 0.9;
            badge = '🔻 (-10%)';
            rowClass = 'down-stat';
        }

        let finalStat = (key === 'hp') 
            ? calcHP(base, iv, ev, level) 
            : calcStat(base, iv, ev, level, mult);

        baseValues.push(base);
        finalValues.push(finalStat);

        if (tableBody) {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 hover:bg-slate-50';
            tr.innerHTML = `
                <td class="p-3 text-left pl-4 font-medium text-slate-700">${STAT_NAMES[key]}</td>
                <td class="p-3 text-slate-600">${base}</td>
                <td class="p-3 ${rowClass}">${badge}</td>
                <td class="p-3 font-bold text-slate-900">${finalStat}</td>
            `;
            tableBody.appendChild(tr);
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
                {
                    label: '종족값 (Base)',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(148, 163, 184, 0.2)',
                    borderColor: '#94a3b8',
                    pointBackgroundColor: '#94a3b8'
                },
                {
                    label: '최종 능력치',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(239, 68, 68, 0.25)',
                    borderColor: '#ef4444',
                    pointBackgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: { beginAtZero: true }
            }
        }
    });
}

function updateChart(baseValues, finalValues) {
    if (!chartInstance) return;
    chartInstance.data.datasets[0].data = baseValues;
    chartInstance.data.datasets[1].data = finalValues;
    chartInstance.update();
}