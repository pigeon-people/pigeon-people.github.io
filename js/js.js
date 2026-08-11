// pigeon generating

const world = document.getElementById("world");

let pigeons = [];


async function loadPigeons() {

    const response = await fetch("js/pigeons.json");

    pigeons = await response.json();

}


function randomCell(used) {

    while (true) {

        const cell = Math.floor(Math.random() * 450);

        if (!used.has(cell)) {

            used.add(cell);

            return cell;

        }

    }

}


function assignCells() {

    const used = new Set();

    pigeons.forEach(pigeon => {

        pigeon.cell = randomCell(used);

    });

}


function renderWorld() {

    world.innerHTML = "";

    const landscape = window.matchMedia("(orientation: landscape)").matches;

    const cols = landscape ? 30 : 15;
    const rows = landscape ? 15 : 30;

    pigeons.forEach(pigeon => {

        const col = pigeon.cell % cols;
        const row = Math.floor(pigeon.cell / cols);

        const div = document.createElement("div");

        div.className = "pigeon";

        div.dataset.pigeon = pigeon.id;

        div.style.left = `${(col / cols) * 100}%`;

        div.style.top = `${(row / rows) * 100}%`;

        div.style.width = `${100 / cols}%`;

        div.style.height = `${100 / rows}%`;

        const img = document.createElement("img");

        img.src = pigeon.image;

        img.alt = pigeon.id;

        img.draggable = false;

        div.appendChild(img);

        world.appendChild(div);

    });

}


async function init() {

    await loadPigeons();

    assignCells();

    renderWorld();

    // Check whether the URL contains a pigeon ID

    const id = window.location.hash.substring(1);

    if (id) {

        const pigeon = pigeons.find(p => p.id === id);

        if (pigeon) {

            openPigeon(pigeon.id);

        }

    }

}


init();


let lastOrientation = window.matchMedia("(orientation: landscape)").matches;


window.addEventListener("resize", () => {

    const landscape = window.matchMedia("(orientation: landscape)").matches;

    if (landscape !== lastOrientation) {

        lastOrientation = landscape;

        renderWorld();

    }

});



// world


let dragging = false;

let pointerDown = false;

let startX = 0;
let startY = 0;

let startScrollX = 0;
let startScrollY = 0;

const DRAG_THRESHOLD = 5;


window.addEventListener("load", () => {

    window.scrollTo({

        left: window.innerWidth * 2,

        top: window.innerHeight * 2,

        behavior: "instant"

    });

});


world.addEventListener("pointerdown", (e) => {

    pointerDown = true;

    dragging = false;

    startX = e.clientX;

    startY = e.clientY;

    startScrollX = window.scrollX;

    startScrollY = window.scrollY;

});


world.addEventListener("pointermove", (e) => {

    if (!pointerDown) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragging) {

        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

        dragging = true;

        world.setPointerCapture(e.pointerId);

        world.style.cursor = "grabbing";

    }

    window.scrollTo(

        startScrollX - dx,
        startScrollY - dy

    );

});


function stopDragging() {

    pointerDown = false;

    dragging = false;

    world.style.cursor = "grab";

}


world.addEventListener("pointerup", stopDragging);

world.addEventListener("pointercancel", stopDragging);



// darkmode


const darkModeToggle = document.getElementById("darkmode-toggle");


darkModeToggle.addEventListener("click", () => {

    const root = document.documentElement;

    if (root.style.filter === "invert(1)") {

        root.style.filter = "";

    } else {

        root.style.filter = "invert(1)";

    }

});



// modal


const modal = document.getElementById("modal");

const modalImage = document.querySelector("#image img");

const modalContent = document.getElementById("cont");


async function loadMarkdown(path) {

    const response = await fetch(path);

    const text = await response.text();

    return text;

}


function parseMarkdown(text) {

    const parts = text.split("---");

    if (parts.length < 3) {

        return {

            metadata: {},

            body: text

        };

    }

    const metadata = {};

    parts[1]

        .trim()

        .split("\n")

        .forEach(line => {

            const index = line.indexOf(":");

            if (index === -1) return;

            const key = line.slice(0, index).trim();

            const value = line.slice(index + 1).trim();

            metadata[key] = value;

        });

    return {

        metadata,

        body: parts.slice(2).join("---").trim()

    };

}


async function openPigeon(id) {

    const pigeon = pigeons.find(p => p.id === id);

    if (!pigeon) return;


    modal.style.display = "block";

    modalImage.src = pigeon.image;

    modalImage.alt = pigeon.id;


    const markdown = await loadMarkdown(pigeon.text);

    const parsed = parseMarkdown(markdown);


    modalContent.innerHTML = `

        <h3>${parsed.metadata.subtitle.toUpperCase()}</h3>

        <h2>${parsed.metadata.title.toUpperCase()}</h2>

        <div class="sub">

            ${parsed.metadata.date} • ${parsed.metadata.place} • ${parsed.metadata.language}

        </div>

        <hr>

        ${marked.parse(parsed.body)}

    `;


    modalContent.querySelectorAll("p").forEach(p => {

        const html = p.innerHTML;

        const match = html.match(/^<strong>(.+?):<\/strong>\s*(.*)$/);

        if (!match) return;

        p.innerHTML = `<span>${match[1]}:</span> ${match[2]}`;

    });


    modalContent.querySelectorAll("a").forEach(link => {

        link.target = "_blank";

        link.rel = "noopener noreferrer";

    });


    // Put the pigeon ID in the URL

    history.replaceState(null, "", `#${pigeon.id}`);

}


world.addEventListener("click", (e) => {

    const pigeon = e.target.closest(".pigeon");

    if (!pigeon) return;

    openPigeon(pigeon.dataset.pigeon);

});

window.addEventListener("hashchange", () => {

    const id = window.location.hash.substring(1);

    if (!id) return;

    const pigeon = pigeons.find(p => p.id === id);

    if (pigeon) {
        openPigeon(pigeon.id);
    }

});



// close modal with Escape


const headerCheck = document.getElementById("headerCheck");


document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

        modal.style.display = "none";

        headerCheck.checked = false;

        // Remove pigeon ID from URL

        history.replaceState(

            null,

            "",

            window.location.pathname + window.location.search

        );

    }

});



// close modal with exit button


const exitBtn = document.getElementById("exit");


exitBtn.addEventListener("click", () => {

    modal.style.display = "none";

    // Remove pigeon ID from URL

    history.replaceState(

        null,

        "",

        window.location.pathname + window.location.search

    );

});