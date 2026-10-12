// ============================================================
// 포켓몬 전국도감 + 능력치 계산기
// ============================================================


// ============================================================
// 성격 데이터
// ============================================================

const NATURE_DATA = {

    "고집 (Adamant)": {
        up: "attack",
        down: "special-attack"
    },

    "조심 (Modest)": {
        up: "special-attack",
        down: "attack"
    },

    "겁쟁이 (Timid)": {
        up: "speed",
        down: "attack"
    },

    "명랑 (Jolly)": {
        up: "speed",
        down: "special-attack"
    },

    "대담 (Bold)": {
        up: "defense",
        down: "attack"
    },

    "장난꾸러기 (Impish)": {
        up: "defense",
        down: "special-attack"
    },

    "차분 (Calm)": {
        up: "special-defense",
        down: "attack"
    },

    "신중 (Careful)": {
        up: "special-defense",
        down: "special-attack"
    },

    "외로움 (Lonely)": {
        up: "attack",
        down: "defense"
    },

    "개구쟁이 (Naughty)": {
        up: "attack",
        down: "special-defense"
    },

    "용감 (Brave)": {
        up: "attack",
        down: "speed"
    },

    "의젓 (Mild)": {
        up: "special-attack",
        down: "defense"
    },

    "덜렁 (Rash)": {
        up: "special-attack",
        down: "special-defense"
    },

    "냉정 (Quiet)": {
        up: "special-attack",
        down: "speed"
    },

    "장난기 (Lax)": {
        up: "defense",
        down: "special-defense"
    },

    "무사태평 (Relaxed)": {
        up: "defense",
        down: "speed"
    },

    "얌전 (Gentle)": {
        up: "special-defense",
        down: "defense"
    },

    "건방 (Sassy)": {
        up: "special-defense",
        down: "speed"
    },

    "성급 (Hasty)": {
        up: "speed",
        down: "defense"
    },

    "천진난만 (Naive)": {
        up: "speed",
        down: "special-defense"
    },

    "노력 (Hardy)": {
        up: null,
        down: null
    },

    "수줍음 (Bashful)": {
        up: null,
        down: null
    },

    "온순 (Docile)": {
        up: null,
        down: null
    },

    "변덕 (Quirky)": {
        up: null,
        down: null
    },

    "진지 (Serious)": {
        up: null,
        down: null
    }

};


// ============================================================
// 능력치
// ============================================================

const STAT_KEYS = [
    "hp",
    "attack",
    "defense",
    "special-attack",
    "special-defense",
    "speed"
];


const STAT_NAMES = {

    hp: "체력 (HP)",

    attack: "공격 (Atk)",

    defense: "방어 (Def)",

    "special-attack": "특수공격 (Sp.Atk)",

    "special-defense": "특수방어 (Sp.Def)",

    speed: "스피드 (Speed)"

};


// ============================================================
// 타입 한국어
// ============================================================

const TYPE_KOREAN = {

    normal: "노말",

    fire: "불꽃",

    water: "물",

    electric: "전기",

    grass: "풀",

    ice: "얼음",

    fighting: "격투",

    poison: "독",

    ground: "땅",

    flying: "비행",

    psychic: "에스퍼",

    bug: "벌레",

    rock: "바위",

    ghost: "고스트",

    dragon: "드래곤",

    dark: "악",

    steel: "강철",

    fairy: "페어리"

};


// ============================================================
// 전역 변수
// ============================================================

let pokemonMap = new Map();

let pokemonDetailsCache = new Map();

let currentPokemonStats = {

    hp: 0,

    attack: 0,

    defense: 0,

    "special-attack": 0,

    "special-defense": 0,

    speed: 0

};

let currentPokemonId = 25;

let currentDexPokemonId = 25;

let chartInstance = null;


// ============================================================
// 시작
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initApp
);


function initApp() {

    populateNatures();

    setupChart();

    setupTabs();

    setupDexEvents();

    setupCalculatorEvents();

    loadAllPokemonNames();

}


// ============================================================
// 탭
// ============================================================

function setupTabs() {

    const tabDex =
        document.getElementById("tabDex");

    const tabCalculator =
        document.getElementById("tabCalculator");

    const dexView =
        document.getElementById("dexView");

    const calculatorView =
        document.getElementById("calculatorView");


    tabDex.addEventListener(
        "click",
        () => {

            dexView.classList.remove("hidden");

            calculatorView.classList.add("hidden");


            tabDex.classList.add("active");

            tabCalculator.classList.remove("active");

        }
    );


    tabCalculator.addEventListener(
        "click",
        () => {

            dexView.classList.add("hidden");

            calculatorView.classList.remove("hidden");


            tabCalculator.classList.add("active");

            updateCalculations();

        }
    );

}


// ============================================================
// 전국도감 이벤트
// ============================================================

function setupDexEvents() {

    document
        .getElementById("dexSearchInput")
        .addEventListener(
            "input",
            filterDex
        );


    document
        .getElementById("dexGenFilter")
        .addEventListener(
            "change",
            filterDex
        );


    document
        .getElementById("dexResetBtn")
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById("dexSearchInput")
                    .value = "";

                document
                    .getElementById("dexGenFilter")
                    .value = "all";

                filterDex();

            }
        );


    document
        .getElementById("dexGrid")
        .addEventListener(
            "click",
            event => {

                const card =
                    event.target.closest(
                        "[data-pokemon-id]"
                    );

                if (!card) return;


                const id =
                    Number(card.dataset.pokemonId);


                showDexDetail(id);

            }
        );


    document
        .getElementById("openCalculatorBtn")
        .addEventListener(
            "click",
            () => {

                if (!currentDexPokemonId) {
                    return;
                }


                showCalculatorForPokemon(
                    currentDexPokemonId
                );

            }
        );

}


// ============================================================
// 전국도감 필터
// ============================================================

function filterDex() {

    const query =
        document
            .getElementById("dexSearchInput")
            .value
            .trim()
            .toLowerCase();


    const generation =
        document
            .getElementById("dexGenFilter")
            .value;


    let list =
        Array.from(
            pokemonMap.values()
        );


    if (generation !== "all") {

        list =
            list.filter(
                pokemon =>
                    String(pokemon.gen)
                    === generation
            );

    }


    if (query !== "") {

        list =
            list.filter(
                pokemon =>

                    pokemon.name
                        .toLowerCase()
                        .includes(query)

                    ||

                    String(pokemon.id)
                        .includes(query)
            );

    }


    renderDexGrid(list);

}


// ============================================================
// 도감 카드 출력
// ============================================================

function renderDexGrid(list) {

    const grid =
        document.getElementById("dexGrid");


    const count =
        document.getElementById("dexShownCount");


    count.textContent =
        list.length.toLocaleString();


    grid.innerHTML = "";


    if (list.length === 0) {

        grid.innerHTML = `

            <div class="col-span-full
                        bg-white
                        border
                        border-slate-200
                        rounded-xl
                        p-10
                        text-center
                        text-slate-500">

                검색 결과가 없습니다.

            </div>

        `;

        return;

    }


    const fragment =
        document.createDocumentFragment();


    list.forEach(
        pokemon => {

            const card =
                document.createElement("button");


            card.type = "button";


            card.dataset.pokemonId =
                pokemon.id;


            card.className =

                "pokemon-card " +

                "bg-white " +

                "border " +

                "border-slate-200 " +

                "rounded-xl " +

                "p-3 " +

                "text-center " +

                "cursor-pointer";


            card.innerHTML = `

                <div
                    class="text-xs font-black text-slate-400"
                >

                    #${String(pokemon.id).padStart(4, "0")}

                </div>


                <img

                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png"

                    alt="${escapeHtml(pokemon.name)}"

                    loading="lazy"

                    class="w-28 h-28 mx-auto object-contain"

                    onerror="
                        this.src =
                        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png'
                    "

                >


                <div
                    class="font-black text-slate-800 text-sm truncate"
                >

                    ${escapeHtml(pokemon.name)}

                </div>


                <div
                    class="text-[11px] text-slate-400 mt-1"
                >

                    ${getGenerationLabel(pokemon.gen)}

                </div>

            `;


            fragment.appendChild(card);

        }
    );


    grid.appendChild(fragment);

}


// ============================================================
// 포켓몬 상세정보
// ============================================================

async function showDexDetail(id) {

    currentDexPokemonId = id;


    document
        .querySelectorAll(".pokemon-card.selected")
        .forEach(
            card =>
                card.classList.remove("selected")
        );


    const selected =
        document.querySelector(
            `[data-pokemon-id="${id}"]`
        );


    if (selected) {

        selected.classList.add(
            "selected"
        );

    }


    const detail =
        document.getElementById(
            "dexDetailContent"
        );


    const target =
        pokemonMap.get(id);


    if (!target) return;


    detail.innerHTML = `

        <div class="text-center py-10">

            <div class="text-slate-400 font-bold">

                ${escapeHtml(target.name)}
                정보를 불러오는 중...

            </div>

        </div>

    `;


    try {

        const result =
            await fetchPokemonFullData(id);


        renderDexDetail(result);

    }

    catch (error) {

        console.error(error);


        detail.innerHTML = `

            <div
                class="text-center py-10 text-red-500 font-bold"
            >

                상세정보를 불러오지 못했습니다.

            </div>

        `;

    }

}


// ============================================================
// 상세 데이터 가져오기
// ============================================================

async function fetchPokemonFullData(id) {

    if (
        pokemonDetailsCache.has(id)
    ) {

        return pokemonDetailsCache.get(id);

    }


    const [

        pokemonResponse,

        speciesResponse

    ] = await Promise.all([

        fetch(
            `https://pokeapi.co/api/v2/pokemon/${id}`
        ),

        fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${id}`
        )

    ]);


    if (
        !pokemonResponse.ok
        ||
        !speciesResponse.ok
    ) {

        throw new Error(
            "PokeAPI 요청 실패"
        );

    }


    const pokemon =
        await pokemonResponse.json();


    const species =
        await speciesResponse.json();


    const result = {

        data: pokemon,

        species: species

    };


    pokemonDetailsCache.set(
        id,
        result
    );


    return result;

}


// ============================================================
// 상세정보 화면
// ============================================================

function renderDexDetail({
    data,
    species
}) {

    const koreanName =
        pokemonMap.get(data.id)?.name
        ||
        data.name;


    // 타입

    const types =
        data.types
            .sort(
                (a, b) =>
                    a.slot - b.slot
            )
            .map(
                type => `

                    <span class="type-badge">

                        ${
                            TYPE_KOREAN[
                                type.type.name
                            ]
                            ||
                            type.type.name
                        }

                    </span>

                `
            )
            .join(" ");


    // 특성

    const abilities =
        data.abilities
            .map(
                ability => {

                    const hidden =
                        ability.is_hidden
                        ? " (숨겨진 특성)"
                        : "";


                    return `

                        <span class="font-bold">

                            ${ability.ability.name}

                        </span>

                        <span class="text-xs text-slate-500">

                            ${hidden}

                        </span>

                    `;

                }
            )
            .join(", ");


    // 스탯

    const stats =
        data.stats
            .map(
                stat => {

                    const key =
                        stat.stat.name;


                    const value =
                        stat.base_stat;


                    const width =
                        Math.min(
                            (value / 180) * 100,
                            100
                        );


                    return `

                        <div
                            class="grid grid-cols-[110px_45px_1fr]
                                   items-center
                                   gap-2"
                        >

                            <div
                                class="text-xs font-bold text-slate-600"
                            >

                                ${STAT_NAMES[key]}

                            </div>


                            <div
                                class="text-xs font-black text-right"
                            >

                                ${value}

                            </div>


                            <div class="stat-bar">

                                <div
                                    class="stat-fill bg-red-500"
                                    style="width:${width}%"
                                >
                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    const total =
        data.stats.reduce(
            (sum, stat) =>
                sum + stat.base_stat,
            0
        );


    // 도감 설명

    let flavorText =
        "도감 설명이 없습니다.";


    const koreanEntry =
        species.flavor_text_entries.find(
            entry =>
                entry.language.name === "ko"
        );


    if (koreanEntry) {

        flavorText =
            cleanFlavorText(
                koreanEntry.flavor_text
            );

    }


    const artwork =
        data
            .sprites
            .other
            ?.["official-artwork"]
            ?.front_default
        ||
        data.sprites.front_default;


    document
        .getElementById(
            "dexDetailContent"
        )
        .innerHTML = `

        <div
            class="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >


            <!-- 이미지 -->

            <div
                class="bg-slate-50
                       rounded-2xl
                       border
                       border-slate-200
                       p-5
                       text-center"
            >

                <div
                    class="text-sm
                           font-black
                           text-slate-400"
                >

                    #${String(data.id).padStart(4, "0")}

                </div>


                <img

                    src="${artwork}"

                    alt="${escapeHtml(koreanName)}"

                    class="w-64 h-64 object-contain mx-auto"

                >


                <h3
                    class="text-2xl
                           font-black
                           text-slate-800"
                >

                    ${escapeHtml(koreanName)}

                </h3>


                <div class="mt-3">

                    ${types}

                </div>


                <div
                    class="mt-4
                           text-sm
                           text-slate-600"
                >

                    <div>

                        <b>키</b>

                        ${(data.height / 10).toFixed(1)}
                        m

                    </div>


                    <div class="mt-1">

                        <b>몸무게</b>

                        ${(data.weight / 10).toFixed(1)}
                        kg

                    </div>

                </div>

            </div>


            <!-- 상세 -->

            <div
                class="lg:col-span-2 space-y-5"
            >


                <!-- 종족값 -->

                <div>

                    <h3
                        class="font-black text-lg mb-3"
                    >

                        📊 종족값

                    </h3>


                    <div
                        class="space-y-3
                               bg-slate-50
                               border
                               border-slate-200
                               rounded-xl
                               p-4"
                    >

                        ${stats}


                        <div
                            class="pt-3
                                   mt-2
                                   border-t
                                   border-slate-200
                                   flex
                                   justify-between
                                   font-black"
                        >

                            <span>
                                종족값 합계
                            </span>

                            <span>
                                ${total}
                            </span>

                        </div>

                    </div>

                </div>


                <!-- 특성 / 세대 -->

                <div
                    class="grid
                           grid-cols-1
                           md:grid-cols-2
                           gap-4"
                >

                    <div
                        class="bg-slate-50
                               border
                               border-slate-200
                               rounded-xl
                               p-4"
                    >

                        <h3 class="font-black mb-2">
                            🧬 특성
                        </h3>

                        <p class="text-sm">
                            ${abilities}
                        </p>

                    </div>


                    <div
                        class="bg-slate-50
                               border
                               border-slate-200
                               rounded-xl
                               p-4"
                    >

                        <h3 class="font-black mb-2">
                            📕 세대
                        </h3>

                        <p class="text-sm">

                            ${getGenerationLabel(
                                getGeneration(data.id)
                            )}

                        </p>

                    </div>

                </div>


                <!-- 도감 설명 -->

                <div
                    class="bg-slate-50
                           border
                           border-slate-200
                           rounded-xl
                           p-4"
                >

                    <h3 class="font-black mb-2">
                        📖 도감 설명
                    </h3>

                    <p
                        class="text-sm
                               leading-6
                               text-slate-700"
                    >

                        ${escapeHtml(
                            flavorText
                        )}

                    </p>

                </div>


                <!-- 추가 정보 -->

                <div
                    class="bg-slate-50
                           border
                           border-slate-200
                           rounded-xl
                           p-4"
                >

                    <h3 class="font-black mb-2">
                        🔄 진화
                    </h3>

                    <p class="text-sm text-slate-600">

                        진화 트리는 다음 단계에서
                        추가할 예정입니다.

                    </p>

                </div>

            </div>

        </div>

    `;


    document
        .getElementById("dexDetail")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


// ============================================================
// 도감 설명 정리
// ============================================================

function cleanFlavorText(text) {

    return text

        .replace(/\f/g, " ")

        .replace(/\n/g, " ")

        .replace(/\s+/g, " ")

        .trim();

}


// ============================================================
// 세대
// ============================================================

function getGeneration(id) {

    if (id <= 151) return 1;

    if (id <= 251) return 2;

    if (id <= 386) return 3;

    if (id <= 493) return 4;

    if (id <= 649) return 5;

    if (id <= 721) return 6;

    if (id <= 809) return 7;

    if (id <= 905) return 8;

    return 9;

}


function getGenerationLabel(gen) {

    const names = {

        1: "1세대 · 관동",

        2: "2세대 · 성도",

        3: "3세대 · 호연",

        4: "4세대 · 신오",

        5: "5세대 · 하나",

        6: "6세대 · 칼로스",

        7: "7세대 · 알로라",

        8: "8세대 · 가라르 / 히스이",

        9: "9세대 · 팔데아"

    };


    return names[gen]
        || `${gen}세대`;

}


// ============================================================
// 포켓몬 이름 데이터
// ============================================================

async function loadAllPokemonNames() {

    const dexStatus =
        document.getElementById(
            "dexStatus"
        );


    const calculatorStatus =
        document.getElementById(
            "loadingStatus"
        );


    try {

        const response =
            await fetch(
                "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv"
            );


        if (!response.ok) {

            throw new Error(
                "이름 데이터 로딩 실패"
            );

        }


        const text =
            await response.text();


        const lines =
            text.split("\n");


        for (
            let i = 1;
            i < lines.length;
            i++
        ) {

            const line =
                lines[i].trim();


            if (!line) continue;


            const parts =
                line.split(",");


            const id =
                parseInt(
                    parts[0],
                    10
                );


            const languageId =
                parseInt(
                    parts[1],
                    10
                );


            const name =
                parts
                    .slice(2)
                    .join(",")
                    .replace(/\r/g, "")
                    .trim();


            // 한국어

            if (
                languageId === 3
                &&
                id >= 1
                &&
                id <= 1025
            ) {

                pokemonMap.set(
                    id,
                    {

                        id: id,

                        name: name,

                        gen:
                            getGeneration(id)

                    }
                );

            }

        }


        dexStatus.textContent =
            `✅ ${pokemonMap.size.toLocaleString()}종 로딩 완료`;


        dexStatus.className =
            "text-xs font-bold text-green-600";


        calculatorStatus.textContent =
            `✅ ${pokemonMap.size.toLocaleString()}종 로딩 완료`;


        calculatorStatus.className =
            "text-xs text-green-600 font-bold";


        document
            .getElementById(
                "dexTotalCount"
            )
            .textContent =
            pokemonMap.size.toLocaleString();


        filterDex();

        filterPokemonList();


        // 기본 포켓몬

        showDexDetail(25);

        fetchPokemonStats(25);

    }

    catch (error) {

        console.error(error);


        dexStatus.textContent =
            "❌ 도감 데이터 로딩 실패";


        dexStatus.className =
            "text-xs font-bold text-red-600";


        calculatorStatus.textContent =
            "❌ 데이터 로딩 실패";


        calculatorStatus.className =
            "text-xs text-red-600 font-bold";

    }

}


// ============================================================
// 계산기로 이동
// ============================================================

function showCalculatorForPokemon(id) {

    currentPokemonId =
        Number(id);


    document
        .getElementById(
            "pokemonSelect"
        )
        .value =
        String(id);


    fetchPokemonStats(id);


    document
        .getElementById(
            "tabCalculator"
        )
        .click();


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ============================================================
// 성격
// ============================================================

function populateNatures() {

    const select =
        document.getElementById(
            "natureSelect"
        );


    select.innerHTML = "";


    for (
        const nature in NATURE_DATA
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            nature;


        option.textContent =
            nature;


        select.appendChild(
            option
        );

    }

}


// ============================================================
// 계산기 이벤트
// ============================================================

function setupCalculatorEvents() {

    document
        .getElementById("genFilter")
        .addEventListener(
            "change",
            filterPokemonList
        );


    document
        .getElementById("searchInput")
        .addEventListener(
            "input",
            filterPokemonList
        );


    document
        .getElementById("pokemonSelect")
        .addEventListener(
            "change",
            event =>
                fetchPokemonStats(
                    event.target.value
                )
        );


    document
        .getElementById("natureSelect")
        .addEventListener(
            "change",
            updateCalculations
        );


    document
        .getElementById("levelInput")
        .addEventListener(
            "input",
            event => {

                document
                    .getElementById(
                        "levelValue"
                    )
                    .textContent =
                    event.target.value;


                updateCalculations();

            }
        );


    document
        .getElementById("ivInput")
        .addEventListener(
            "input",
            updateCalculations
        );


    document
        .getElementById("evInput")
        .addEventListener(
            "input",
            updateCalculations
        );


    document
        .getElementById("backToDexBtn")
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "tabDex"
                    )
                    .click();

            }
        );

}


// ============================================================
// 계산기 포켓몬 필터
// ============================================================

function filterPokemonList() {

    const generation =
        document
            .getElementById(
                "genFilter"
            )
            .value;


    const query =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .trim()
            .toLowerCase();


    const select =
        document.getElementById(
            "pokemonSelect"
        );


    let list =
        Array.from(
            pokemonMap.values()
        );


    if (
        generation !== "all"
    ) {

        list =
            list.filter(
                pokemon =>
                    pokemon.gen
                    ===
                    parseInt(
                        generation,
                        10
                    )
            );

    }


    if (query !== "") {

        list =
            list.filter(
                pokemon =>

                    pokemon.name
                        .toLowerCase()
                        .includes(query)

                    ||

                    String(pokemon.id)
                        .includes(query)
            );

    }


    select.innerHTML = "";


    if (list.length === 0) {

        select.innerHTML = `

            <option disabled selected>

                검색 결과가 없습니다.

            </option>

        `;

        return;

    }


    list.forEach(
        pokemon => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                pokemon.id;


            option.textContent =

                `#${String(
                    pokemon.id
                ).padStart(4, "0")}

                [${pokemon.gen}세대]

                -

                ${pokemon.name}`;


            select.appendChild(
                option
            );

        }
    );


    if (
        list.some(
            pokemon =>
                pokemon.id
                ===
                currentPokemonId
        )
    ) {

        select.value =
            currentPokemonId;

    }

}


// ============================================================
// 포켓몬 스탯 가져오기
// ============================================================

async function fetchPokemonStats(
    idValue
) {

    const id =
        parseInt(
            idValue,
            10
        );


    if (
        !id
        ||
        !pokemonMap.has(id)
    ) {

        return;

    }


    currentPokemonId =
        id;


    const target =
        pokemonMap.get(id);


    const nameElement =
        document.getElementById(
            "pokemonName"
        );


    const spriteElement =
        document.getElementById(
            "pokemonSprite"
        );


    nameElement.textContent =

        `${target.name}
        (#${String(id).padStart(4, "0")})
        - 스탯 로딩중...`;


    try {

        const result =
            await fetchPokemonFullData(
                id
            );


        const data =
            result.data;


        const stats = {};


        data.stats.forEach(
            stat => {

                stats[
                    stat.stat.name
                ] =
                    stat.base_stat;

            }
        );


        currentPokemonStats =
            stats;


        const artwork =
            data
                .sprites
                .other
                ?.["official-artwork"]
                ?.front_default;


        if (artwork) {

            spriteElement.src =
                artwork;

        }


        nameElement.textContent =

            `${target.name}
            (#${String(id).padStart(4, "0")})`;


        updateCalculations();

    }

    catch (error) {

        console.error(error);


        nameElement.textContent =
            `${target.name}
            (API 오류 발생)`;

    }

}


// ============================================================
// 능력치 계산
// ============================================================

function calcHP(
    base,
    iv,
    ev,
    level
) {

    if (base === 0) {
        return 0;
    }


    return Math.floor(

        (
            (
                2 * base
                +
                iv
                +
                Math.floor(ev / 4)
            )
            *
            level
        )
        /
        100

    )
    +
    level
    +
    10;

}


function calcStat(
    base,
    iv,
    ev,
    level,
    multiplier
) {

    if (base === 0) {
        return 0;
    }


    const baseValue =

        Math.floor(

            (
                (
                    2 * base
                    +
                    iv
                    +
                    Math.floor(ev / 4)
                )
                *
                level
            )
            /
            100

        )
        +
        5;


    return Math.floor(
        baseValue * multiplier
    );

}


// ============================================================
// 계산기 업데이트
// ============================================================

function updateCalculations() {

    const level =
        parseInt(
            document
                .getElementById(
                    "levelInput"
                )
                .value,
            10
        )
        ||
        50;


    const iv =
        Math.max(
            0,
            Math.min(
                31,
                parseInt(
                    document
                        .getElementById(
                            "ivInput"
                        )
                        .value,
                    10
                )
                ||
                0
            )
        );


    const ev =
        Math.max(
            0,
            Math.min(
                252,
                parseInt(
                    document
                        .getElementById(
                            "evInput"
                        )
                        .value,
                    10
                )
                ||
                0
            )
        );


    const natureName =
        document
            .getElementById(
                "natureSelect"
            )
            .value;


    const nature =
        NATURE_DATA[
            natureName
        ];


    if (!nature) {
        return;
    }


    const natureInfo =
        document.getElementById(
            "natureInfo"
        );


    natureInfo.innerHTML = `

        <div
            class="text-red-500 font-semibold"
        >

            🔺 상승:
            ${
                nature.up
                ? STAT_NAMES[nature.up]
                : "없음"
            }

        </div>


        <div
            class="text-blue-500 font-semibold"
        >

            🔻 하락:
            ${
                nature.down
                ? STAT_NAMES[nature.down]
                : "없음"
            }

        </div>

    `;


    const baseValues = [];

    const finalValues = [];


    const tableBody =
        document.getElementById(
            "statsTableBody"
        );


    tableBody.innerHTML = "";


    STAT_KEYS.forEach(
        key => {

            const base =
                currentPokemonStats[key]
                ||
                0;


            let multiplier =
                1;


            let badge =
                "➖";


            let rowClass =
                "";


            if (
                nature.up
                ===
                key
            ) {

                multiplier =
                    1.1;


                badge =
                    "🔺 +10%";


                rowClass =
                    "up-stat";

            }

            else if (
                nature.down
                ===
                key
            ) {

                multiplier =
                    0.9;


                badge =
                    "🔻 -10%";


                rowClass =
                    "down-stat";

            }


            const finalStat =

                key === "hp"

                ?

                calcHP(
                    base,
                    iv,
                    ev,
                    level
                )

                :

                calcStat(
                    base,
                    iv,
                    ev,
                    level,
                    multiplier
                );


            baseValues.push(
                base
            );


            finalValues.push(
                finalStat
            );


            tableBody.innerHTML += `

                <tr
                    class="border-b
                           border-slate-100
                           hover:bg-slate-50"
                >

                    <td
                        class="p-3
                               text-left
                               pl-4
                               font-medium"
                    >

                        ${STAT_NAMES[key]}

                    </td>


                    <td class="p-3">

                        ${base}

                    </td>


                    <td
                        class="p-3
                               ${rowClass}"
                    >

                        ${badge}

                    </td>


                    <td
                        class="p-3
                               font-bold"
                    >

                        ${finalStat}

                    </td>

                </tr>

            `;

        }
    );


    updateChart(
        baseValues,
        finalValues
    );

}


// ============================================================
// 차트
// ============================================================

function setupChart() {

    const canvas =
        document.getElementById(
            "radarChart"
        );


    if (!canvas) {
        return;
    }


    const ctx =
        canvas.getContext("2d");


    chartInstance =
        new Chart(
            ctx,
            {

                type: "radar",

                data: {

                    labels:
                        STAT_KEYS.map(
                            key =>
                                STAT_NAMES[key]
                        ),

                    datasets: [

                        {

                            label:
                                "종족값",

                            data:
                                [
                                    0,
                                    0,
                                    0,
                                    0,
                                    0,
                                    0
                                ],

                            backgroundColor:
                                "rgba(148,163,184,0.2)",

                            borderColor:
                                "#94a3b8"

                        },


                        {

                            label:
                                "최종 능력치",

                            data:
                                [
                                    0,
                                    0,
                                    0,
                                    0,
                                    0,
                                    0
                                ],

                            backgroundColor:
                                "rgba(239,68,68,0.25)",

                            borderColor:
                                "#ef4444"

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        r: {

                            beginAtZero:
                                true

                        }

                    }

                }

            }
        );

}


function updateChart(
    baseValues,
    finalValues
) {

    if (!chartInstance) {
        return;
    }


    chartInstance
        .data
        .datasets[0]
        .data =
        baseValues;


    chartInstance
        .data
        .datasets[1]
        .data =
        finalValues;


    chartInstance.update();

}


// ============================================================
// HTML 보안 처리
// ============================================================

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}
