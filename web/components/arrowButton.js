import { ICONS } from "../assets/icons.js";

export class ArrowButton {
  constructor(config, dom) {
    this.CONFIG = config;
    this.dom = dom;
    this.isRotated = false;
    this.element = null;
    this.arrowElement = null;
    this.callback = null;
    this.styleElement = null;
    this.injectStyles();
  }

  injectStyles() {
    if (this.styleElement) return;

    this.styleElement = document.createElement("style");
    this.styleElement.textContent = `
      .aligner-icon-circle[data-id="arrowButton"] {
        margin: 0 4px !important;
        transition: transform 0.2s ease;
      }
      .aligner-icon-circle[data-id="arrowButton"]:hover {
        transform: scale(1.1);
      }
      .aligner-icon-circle[data-id="arrowButton"] .aligner-icon-bg {
        transition: background-color 0.2s ease, box-shadow 0.2s ease;
      }
      .aligner-icon-circle[data-id="arrowButton"]:hover .aligner-icon-bg {
        background-color: rgb(45, 45, 45) !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4) !important;
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  create(size) {
    const buttonWrapper = this.dom.createElement(
      "div",
      "aligner-icon aligner-icon-circle"
    );
    buttonWrapper.dataset.id = "arrowButton";
    buttonWrapper.dataset.type = "action";
    buttonWrapper.style.width = `${size}px`;
    buttonWrapper.style.height = `${size}px`;
    buttonWrapper.style.pointerEvents = "auto";
    buttonWrapper.style.cursor = "pointer";
    buttonWrapper.style.display = "flex";
    buttonWrapper.style.alignItems = "center";
    buttonWrapper.style.justifyContent = "center";
    buttonWrapper.style.position = "relative";

    const bg = this.dom.createElement("div", "aligner-icon-bg");
    bg.style.backgroundColor = "rgb(39, 39, 39)";
    bg.style.width = "100%";
    bg.style.height = "100%";
    bg.style.borderRadius = "50%";
    bg.style.display = "flex";
    bg.style.alignItems = "center";
    bg.style.justifyContent = "center";
    bg.style.position = "absolute";
    bg.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";

    const arrowContainer = this.dom.createElement("div");
    arrowContainer.style.width = "40%";
    arrowContainer.style.height = "40%";
    arrowContainer.style.display = "flex";
    arrowContainer.style.alignItems = "center";
    arrowContainer.style.justifyContent = "center";
    arrowContainer.style.position = "absolute";
    arrowContainer.innerHTML = ICONS.arrow;

    const svg = arrowContainer.querySelector("svg");
    if (svg) {
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.transition = "transform 0.3s ease";
      svg.style.position = "absolute";
      svg.style.left = "50%";
      svg.style.top = "50%";
      svg.style.transform = "translate(-50%, -50%)";
    }

    bg.appendChild(arrowContainer);
    buttonWrapper.appendChild(bg);
    this.element = buttonWrapper;
    this.arrowElement = svg;

    buttonWrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();

      if (this.callback) {
        this.callback(this.isRotated);
      }
    });

    return buttonWrapper;
  }

  toggle() {
    this.isRotated = !this.isRotated;
    if (this.arrowElement) {
      this.arrowElement.style.transform = this.isRotated
        ? "translate(-50%, -50%) rotate(180deg)"
        : "translate(-50%, -50%)";
    }
  }

  setCallback(callback) {
    this.callback = callback;
  }

  removeStyles() {
    if (this.styleElement) {
      document.head.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }
}
