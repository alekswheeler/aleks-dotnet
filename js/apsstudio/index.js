const svgNamespace = "http://www.w3.org/2000/svg";
const pageStates = new WeakMap();

const resources = [
    { name: "Prensa A", y: 60 },
    { name: "Torno CNC", y: 111 },
    { name: "Embalagem", y: 162 }
];

const grid = { x: 112, width: 443 };
const hour = value => grid.x + value / 10 * grid.width;

const schedules = {
    base: [
        { resource: 0, start: 0, end: 3, id: "OP-104", locked: true },
        { resource: 0, start: 3.5, end: 6.5, id: "OP-208" },
        { resource: 1, start: .4, end: 2.9, id: "OP-322" },
        { resource: 1, start: 6.5, end: 7.8, id: "OP-208" },
        { resource: 2, start: 3.1, end: 5.1, id: "OP-541" }
    ],
    urgent: [
        { resource: 0, start: 0, end: 3, id: "OP-104", locked: true },
        { resource: 0, start: 3.5, end: 6.5, id: "OP-208" },
        { resource: 1, start: .4, end: 2.9, id: "OP-322" },
        { resource: 1, start: 6.5, end: 7.8, id: "OP-208" },
        { resource: 2, start: 3.1, end: 5.1, id: "OP-541" },
        { resource: 0, start: 1.8, end: 4, id: "URGENTE", urgent: true, request: true }
    ],
    repaired: [
        { resource: 0, start: 0, end: 3, id: "OP-104", locked: true },
        { resource: 0, start: 3.25, end: 5.25, id: "URGENTE", urgent: true },
        { resource: 0, start: 5.5, end: 8.5, id: "OP-208", moved: true },
        { resource: 1, start: .4, end: 2.9, id: "OP-322" },
        { resource: 1, start: 8.5, end: 9.8, id: "OP-208", moved: true },
        { resource: 2, start: 3.1, end: 5.1, id: "OP-541" }
    ]
};

const messages = {
    base: "O plano contém uma operação firmada. Ela será preservada ao avaliar a nova demanda.",
    urgent: "A nova demanda ainda aguarda encaixe. A janela solicitada coincide com o compromisso protegido.",
    repaired: "Nesta proposta ilustrativa, a operação firmada é preservada e duas operações são reorganizadas para encaixar a nova demanda."
};

function createSvgElement(name, attributes = {}, text = "") {
    const element = document.createElementNS(svgNamespace, name);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, String(value));
    }
    if (text) element.textContent = text;
    return element;
}

function renderSchedule(root, step) {
    const svg = root.querySelector("#schedule");
    if (!svg || !schedules[step]) return;

    for (const child of [...svg.children]) {
        if (child.tagName.toLowerCase() !== "title" && child.tagName.toLowerCase() !== "desc") {
            child.remove();
        }
    }

    for (let value = 0; value <= 10; value += 2) {
        const x = hour(value);
        svg.appendChild(createSvgElement("line", { x1: x, y1: 40, x2: x, y2: 200, class: "grid-line" }));
        svg.appendChild(createSvgElement("text", {
            x,
            y: 27,
            fill: "#8494a3",
            "font-size": 10,
            "text-anchor": value === 10 ? "end" : "start"
        }, `${String(8 + value).padStart(2, "0")}:00`));
    }

    for (const resource of resources) {
        svg.appendChild(createSvgElement("text", { x: 5, y: resource.y + 20, fill: "#5b7184", "font-size": 11 }, resource.name));
        svg.appendChild(createSvgElement("rect", { x: grid.x, y: resource.y, width: grid.width, height: 32, rx: 5, fill: "#f0f4f7" }));
    }

    for (const operation of schedules[step]) {
        const y = resources[operation.resource].y + (operation.request ? 33 : 3);
        const x = hour(operation.start);
        const width = hour(operation.end) - x;
        const fill = operation.urgent ? "#ff8a24" : operation.locked ? "#284b69" : "#7ea5c2";
        const group = createSvgElement("g", {
            "data-operation": operation.id,
            "data-locked": operation.locked ? "true" : "false",
            "data-start": operation.start,
            "data-end": operation.end
        });
        const rectAttributes = {
            x,
            y,
            width,
            height: operation.request ? 15 : 26,
            rx: 4,
            fill: operation.request ? "#fff1e3" : fill
        };

        if (operation.request) Object.assign(rectAttributes, { stroke: "#e49a50", "stroke-width": 1, "stroke-dasharray": "4 3" });
        if (operation.moved) Object.assign(rectAttributes, { stroke: "#087e8b", "stroke-width": 1.5 });
        group.appendChild(createSvgElement("rect", rectAttributes));
        group.appendChild(createSvgElement("text", {
            x: x + 7,
            y: y + (operation.request ? 12 : 17),
            fill: operation.request ? "#9b622c" : operation.urgent ? "#10253b" : "#fff",
            "font-size": operation.request ? 8 : 9,
            "font-weight": operation.locked ? 700 : 600
        }, operation.id + (operation.locked ? "  ◆" : "")));

        const description = operation.request
            ? "Janela desejada: solicitação ainda não programada"
            : operation.id + (operation.locked ? " · operação firmada, preservada" : operation.moved ? " · alterada nesta proposta" : "");
        group.appendChild(createSvgElement("title", {}, description));
        svg.appendChild(group);
    }

    if (step === "urgent") {
        svg.appendChild(createSvgElement("text", { x: hour(4.2), y: resources[0].y + 48, fill: "#a76b33", "font-size": 8 }, "Solicitação aguardando janela"));
    }

    const status = root.querySelector("#scheduleStatus");
    const message = root.querySelector("#scheduleMessage");
    const metric = root.querySelector("#changeMetric");
    const label = root.querySelector("#changeLabel");
    if (status) status.dataset.state = step;
    if (message) message.textContent = messages[step];
    if (metric) metric.textContent = step === "repaired" ? "2" : step === "urgent" ? "1" : "0";
    if (label) label.textContent = step === "urgent" ? "demanda aguardando encaixe" : "alterações propostas";

    for (const button of root.querySelectorAll("[data-step]")) {
        button.setAttribute("aria-pressed", String(button.dataset.step === step));
    }
}

export function init(root) {
    if (!root) return;
    destroy(root);

    const controller = new AbortController();
    const { signal } = controller;
    const menuToggle = root.querySelector("#menuToggle");
    const navigation = root.querySelector("#navigation");
    const closeMenu = () => {
        if (!menuToggle || !navigation) return;
        navigation.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir navegação");
    };

    root.querySelectorAll("[data-step]").forEach(button => {
        button.addEventListener("click", () => renderSchedule(root, button.dataset.step), { signal });
    });
    renderSchedule(root, "base");

    if (menuToggle && navigation) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navigation.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.setAttribute("aria-label", isOpen ? "Fechar navegação" : "Abrir navegação");
        }, { signal });

        navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu, { signal }));
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && navigation.classList.contains("open")) {
                closeMenu();
                menuToggle.focus();
            }
        }, { signal });
    }

    const form = root.querySelector("#demoForm");
    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();
            if (!form.reportValidity()) return;

            const name = root.querySelector("#leadName").value.trim();
            const company = root.querySelector("#leadCompany").value.trim();
            const email = root.querySelector("#leadEmail").value.trim();
            const challenge = root.querySelector("#leadChallenge").value.trim();
            const body = [
                "Olá, gostaria de conversar sobre uma demonstração do APS Studio.",
                "",
                `Nome: ${name}`,
                `Empresa: ${company}`,
                `E-mail de contato: ${email}`,
                "",
                "Principal desafio:",
                challenge || "Gostaria de explicar o contexto na conversa."
            ].join("\n");
            const mailLink = document.createElement("a");
            mailLink.href = `mailto:mttursini@gmail.com?subject=${encodeURIComponent(`Demonstração APS Studio — ${company}`)}&body=${encodeURIComponent(body)}`;
            mailLink.click();

            const status = root.querySelector("#formStatus");
            if (status) status.textContent = "Mensagem preparada. Revise e conclua o envio no seu programa de e-mail.";
        }, { signal });
    }

    pageStates.set(root, controller);
}

export function destroy(root) {
    const controller = root && pageStates.get(root);
    if (!controller) return;
    controller.abort();
    pageStates.delete(root);
}
