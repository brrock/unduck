import { bangs } from "./bang";
import "./global.css";

// Define interfaces for bang types
interface BaseBang {
  t: string;
  u: string;
  d: string;
  r: number;
  s: string;
}

interface ExtendedBang extends BaseBang {
  c: string;
  sc: string;
}

type Bang = BaseBang | ExtendedBang;

// Assert the type of bangs
const typedBangs = bangs as Bang[];

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}


function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <div class="content-container">
        <h1>Und*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="https://unduck.link?q=%s"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
        <label class="bang-container">
          <p>Default Bang (currently <span class="bang-current"></span>)</p>
          <input class="bang-input" type="text" value="g" />
        </label>
      </div>
      <footer class="footer">
        <a href="https://t3.chat" target="_blank">t3.chat</a>
        •
        <a href="https://x.com/theo" target="_blank">theo</a>
        •
        <a href="https://github.com/t3dotgg/unduck" target="_blank">github</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;
  const bangInput = app.querySelector<HTMLInputElement>(".bang-input")!;
  const bangCurrent = app.querySelector<HTMLSpanElement>(".bang-current")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  // Get default bang from localStorage or cookies
  let savedBang = localStorage.getItem("default-bang") || getCookie("default-bang") || "g";
  bangCurrent.innerText = bangInput.value = savedBang;

  bangInput.addEventListener("input", () => {
    if (!bangInput.value) return;
    // @ts-ignore omg
    if (typedBangs.some((b) => b.t === bangInput.value)) {
      localStorage.setItem("default-bang", bangInput.value);
      setCookie("default-bang", bangInput.value);
      bangInput.setCustomValidity("");
      bangCurrent.innerText = bangInput.value;
    } else {
      bangInput.setCustomValidity("Unknown bang");
    }
  });
}

const LS_DEFAULT_BANG = localStorage.getItem("default-bang") || getCookie("default-bang") || "g";

const defaultBang = typedBangs.find((b) => 
  typeof b === 'object' && b !== null && 't' in b && b.t === LS_DEFAULT_BANG
);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const defaultBangParam = url.searchParams.get("default")?.trim();
  
  // If default bang is provided and valid, save it
  if (defaultBangParam && typedBangs.some(b => b.t === defaultBangParam)) {
    localStorage.setItem("default-bang", defaultBangParam);
    setCookie("default-bang", defaultBangParam);
  }

  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = typedBangs.find((b) => 
    typeof b === 'object' && b !== null && 'u' in b && 't' in b && b.t === bangCandidate
  ) ?? defaultBang;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}

  const searchUrl = selectedBang?.u?.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/")
  );
  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
