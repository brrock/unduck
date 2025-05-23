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

// Custom bangs management
interface CustomBangs {
  [key: string]: BaseBang;
}

interface ExportData {
  customBangs: CustomBangs;
  deletedBangs: string[];
  defaultBang: string;
  version: string;
}

function getCustomBangs(): CustomBangs {
  const customBangsStr = localStorage.getItem("custom-bangs");
  if (!customBangsStr) return {};
  try {
    return JSON.parse(customBangsStr);
  } catch {
    return {};
  }
}

function saveCustomBangs(customBangs: CustomBangs) {
  localStorage.setItem("custom-bangs", JSON.stringify(customBangs));
}

// Deleted bangs management
function getDeletedBangs(): string[] {
  const deletedBangsStr = localStorage.getItem("deleted-bangs");
  if (!deletedBangsStr) return [];
  try {
    return JSON.parse(deletedBangsStr);
  } catch {
    return [];
  }
}

function saveDeletedBangs(deletedBangs: string[]) {
  localStorage.setItem("deleted-bangs", JSON.stringify(deletedBangs));
}

function getAllBangs(): Bang[] {
  const customBangs = getCustomBangs();
  const deletedBangs = getDeletedBangs();
  
  // Filter out the deleted bangs from typedBangs
  const filteredTypedBangs = typedBangs.filter(b => !deletedBangs.includes(b.t));
  
  // Custom bangs override built-in bangs
  return [...filteredTypedBangs.filter(b => !customBangs[b.t]), ...Object.values(customBangs)];
}

function exportSettings() {
  const data: ExportData = {
    customBangs: getCustomBangs(),
    deletedBangs: getDeletedBangs(),
    defaultBang: localStorage.getItem("default-bang") || "g",
    version: "1.0"
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `unduck-settings-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function importSettings(file: File): Promise<string> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as ExportData;
    
    // Validate the imported data
    if (!data.version || !data.customBangs) {
      throw new Error("Invalid file format");
    }
    
    // Import custom bangs
    saveCustomBangs(data.customBangs);
    
    // Import deleted bangs if present
    if (data.deletedBangs) {
      saveDeletedBangs(data.deletedBangs);
    }
    
    // Import default bang if present
    if (data.defaultBang) {
      localStorage.setItem("default-bang", data.defaultBang);
    }
    
    return "Settings imported successfully";
  } catch (error) {
    throw new Error("Failed to import settings: " + (error as Error).message);
  }
}

function noSearchDefaultPageRender() {
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
      <div class="content-container">
        <h1>Und*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="https://unduck-chi.vercel.app/?q=%s"
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
        
        <div class="bang-manager">
          <button class="toggle-manager-btn">Manage Bangs</button>
          <div class="manager-content" style="display: none;">
            <div class="search-container">
              <input 
                type="text" 
                class="search-input" 
                placeholder="Search bangs..."
              />
            </div>
            <div class="bangs-list"></div>
            <div class="bang-actions">
              <button class="add-bang-btn">Add New Bang</button>
              <button class="export-btn">Export Settings</button>
              <input type="file" id="import-input" accept=".json" style="display: none;" />
              <button class="import-btn">Import Settings</button>
            </div>
            <div class="add-bang-form" style="display: none;">
              <h3>Add New Bang</h3>
              <input type="text" class="new-bang-t" placeholder="Bang trigger (e.g. 'g')" />
              <input type="text" class="new-bang-s" placeholder="Name (e.g. 'Google')" />
              <input type="text" class="new-bang-d" placeholder="Domain (e.g. 'google.com')" />
              <input type="text" class="new-bang-u" placeholder="URL (use {{{s}}} for search term)" />
              <div class="form-buttons">
                <button class="save-new-bang">Save</button>
                <button class="cancel-new-bang">Cancel</button>
              </div>
            </div>
          </div>
        </div>
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

  // Get default bang from localStorage
  let savedBang = localStorage.getItem("default-bang") || "g";
  bangCurrent.innerText = bangInput.value = savedBang;

  bangInput.addEventListener("input", () => {
    if (!bangInput.value) return;
    // @ts-ignore omg
    if (typedBangs.some((b) => b.t === bangInput.value)) {
      localStorage.setItem("default-bang", bangInput.value);
      bangInput.setCustomValidity("");
      bangCurrent.innerText = bangInput.value;
    } else {
      bangInput.setCustomValidity("Unknown bang");
    }
  });

  // Bang manager functionality
  const toggleManagerBtn = app.querySelector<HTMLButtonElement>(".toggle-manager-btn")!;
  const managerContent = app.querySelector<HTMLDivElement>(".manager-content")!;
  const searchInput = app.querySelector<HTMLInputElement>(".search-input")!;
  const bangsList = app.querySelector<HTMLDivElement>(".bangs-list")!;
  const addBangBtn = app.querySelector<HTMLButtonElement>(".add-bang-btn")!;
  const addBangForm = app.querySelector<HTMLDivElement>(".add-bang-form")!;

  toggleManagerBtn.addEventListener("click", () => {
    const isVisible = managerContent.style.display !== "none";
    managerContent.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      renderBangsList();
    }
  });

  function renderBangsList(searchTerm = "") {
    const allBangs = getAllBangs();
    const customBangs = getCustomBangs();
    const filteredBangs = searchTerm
      ? allBangs.filter(b => 
          b.t.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.s.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.d.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : allBangs;

    bangsList.innerHTML = filteredBangs
      .map(b => {
        const isCustomBang = !!customBangs[b.t];
        const builtInBang = typedBangs.find(tb => tb.t === b.t);
        const isModified = isCustomBang && builtInBang;
        return `
          <div class="bang-item">
            <div class="bang-info">
              <strong>!${b.t}</strong> - ${b.s}
              <span class="bang-domain">${b.d}</span>
              ${isModified ? '<span class="modified-badge">Modified</span>' : ''}
              ${isCustomBang && !builtInBang ? '<span class="custom-badge">Custom</span>' : ''}
            </div>
            <div class="bang-actions">
              <button class="edit-bang" data-bang="${b.t}">
                Edit
              </button>
              <button class="delete-bang" data-bang="${b.t}">
                ${isCustomBang ? 'Delete' : 'Hide'}
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    // Update event listeners for delete buttons
    bangsList.querySelectorAll(".delete-bang").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const bangT = ((e.target as Element).closest('.delete-bang') as HTMLElement)?.dataset.bang;
        if (!bangT) return;
        
        const isCustomBang = !!customBangs[bangT];
        const actionWord = isCustomBang ? "delete" : "hide";
        
        if (confirm(`Are you sure you want to ${actionWord} the !${bangT} bang?`)) {
          // If it's a custom bang, delete it from customBangs
          if (isCustomBang) {
            delete customBangs[bangT];
            saveCustomBangs(customBangs);
          } 
          // If it's a built-in bang, add it to the deletedBangs list
          else {
            const deletedBangs = getDeletedBangs();
            if (!deletedBangs.includes(bangT)) {
              deletedBangs.push(bangT);
              saveDeletedBangs(deletedBangs);
            }
          }

          // If the deleted bang was the default, reset to "g"
          if (bangT === bangInput.value) {
            bangInput.value = "g";
            bangCurrent.innerText = "g";
            localStorage.setItem("default-bang", "g");
          }

          renderBangsList(searchInput.value);
        }
      });
    });

    // Update event listeners for edit buttons
    bangsList.querySelectorAll(".edit-bang").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const bangT = ((e.target as Element).closest('.edit-bang') as HTMLElement)?.dataset.bang;
        if (!bangT) return;
        
        const customBangs = getCustomBangs();
        const bang = customBangs[bangT] || typedBangs.find(b => b.t === bangT);
        if (!bang) return;

        // Show edit form
        const editForm = document.createElement('div');
        editForm.className = 'edit-bang-form';
        editForm.innerHTML = `
          <h3>Edit Bang !${bangT}</h3>
          <input type="text" class="edit-bang-t" placeholder="Bang trigger (e.g. 'g')" value="${bang.t}" />
          <input type="text" class="edit-bang-s" placeholder="Name (e.g. 'Google')" value="${bang.s}" />
          <input type="text" class="edit-bang-d" placeholder="Domain (e.g. 'google.com')" value="${bang.d}" />
          <input type="text" class="edit-bang-u" placeholder="URL (use {{{s}}} for search term)" value="${bang.u}" />
          <div class="form-buttons">
            <button class="save-edit-bang">Save</button>
            <button class="cancel-edit-bang">Cancel</button>
            ${customBangs[bangT] ? `
            <button class="reset-bang">Reset to Default</button>
            ` : ''}
          </div>
        `;

        // Replace the bang item with the edit form
        const bangItem = (e.target as Element).closest('.bang-item') as HTMLElement;
        bangItem.style.display = 'none';
        bangItem.insertAdjacentElement('afterend', editForm);

        // Add event listeners for the edit form buttons
        const saveEditBtn = editForm.querySelector('.save-edit-bang')!;
        const cancelEditBtn = editForm.querySelector('.cancel-edit-bang')!;
        const resetBtn = editForm.querySelector('.reset-bang');

        saveEditBtn.addEventListener('click', () => {
          const newT = (editForm.querySelector('.edit-bang-t') as HTMLInputElement).value.trim();
          const newS = (editForm.querySelector('.edit-bang-s') as HTMLInputElement).value.trim();
          const newD = (editForm.querySelector('.edit-bang-d') as HTMLInputElement).value.trim();
          const newU = (editForm.querySelector('.edit-bang-u') as HTMLInputElement).value.trim();

          if (!newT || !newS || !newD || !newU) {
            alert("All fields are required");
            return;
          }

          // Delete old bang if trigger changed
          if (newT !== bangT) {
            delete customBangs[bangT];
          }

          // Save updated bang
          customBangs[newT] = {
            t: newT,
            s: newS,
            d: newD,
            u: newU,
            r: 0
          };
          saveCustomBangs(customBangs);
          
          // Update default bang if it was edited
          if (bangT === bangInput.value) {
            bangInput.value = newT;
            bangCurrent.innerText = newT;
            localStorage.setItem("default-bang", newT);
          }

          editForm.remove();
          bangItem.style.display = '';
          renderBangsList(searchInput.value);
        });

        cancelEditBtn.addEventListener('click', () => {
          bangItem.style.display = '';
          editForm.remove();
        });

        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to reset !${bangT} to its default settings?`)) {
              delete customBangs[bangT];
              saveCustomBangs(customBangs);
              editForm.remove();
              bangItem.style.display = '';
              renderBangsList(searchInput.value);
            }
          });
        }
      });
    });
  }

  searchInput.addEventListener("input", (e) => {
    renderBangsList((e.target as HTMLInputElement).value);
  });

  addBangBtn.addEventListener("click", () => {
    addBangForm.style.display = addBangForm.style.display === "none" ? "block" : "none";
  });

  const saveNewBangBtn = app.querySelector<HTMLButtonElement>(".save-new-bang")!;
  const cancelNewBangBtn = app.querySelector<HTMLButtonElement>(".cancel-new-bang")!;

  saveNewBangBtn.addEventListener("click", () => {
    const t = (app.querySelector<HTMLInputElement>(".new-bang-t")!).value.trim();
    const s = (app.querySelector<HTMLInputElement>(".new-bang-s")!).value.trim();
    const d = (app.querySelector<HTMLInputElement>(".new-bang-d")!).value.trim();
    const u = (app.querySelector<HTMLInputElement>(".new-bang-u")!).value.trim();

    if (!t || !s || !d || !u) {
      alert("All fields are required");
      return;
    }

    const customBangs = getCustomBangs();
    customBangs[t] = {
      t,
      s,
      d,
      u,
      r: 0
    };
    saveCustomBangs(customBangs);
    
    // Clear form
    (app.querySelector<HTMLInputElement>(".new-bang-t")!).value = "";
    (app.querySelector<HTMLInputElement>(".new-bang-s")!).value = "";
    (app.querySelector<HTMLInputElement>(".new-bang-d")!).value = "";
    (app.querySelector<HTMLInputElement>(".new-bang-u")!).value = "";
    
    addBangForm.style.display = "none";
    renderBangsList(searchInput.value);
  });

  cancelNewBangBtn.addEventListener("click", () => {
    addBangForm.style.display = "none";
  });

  // Add event listeners for import/export
  const exportBtn = app.querySelector<HTMLButtonElement>(".export-btn")!;
  const importBtn = app.querySelector<HTMLButtonElement>(".import-btn")!;
  const importInput = app.querySelector<HTMLInputElement>("#import-input")!;

  exportBtn.addEventListener("click", () => {
    exportSettings();
  });

  importBtn.addEventListener("click", () => {
    importInput.click();
  });

  importInput.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const message = await importSettings(file);
      alert(message);
      // Reset the input
      importInput.value = "";
      // Refresh the UI
      renderBangsList(searchInput.value);
      // Update the default bang display
      const savedBang = localStorage.getItem("default-bang") || "g";
      bangCurrent.innerText = bangInput.value = savedBang;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to import settings");
    }
  });

  // Initial render
  renderBangsList();
}

const LS_DEFAULT_BANG = localStorage.getItem("default-bang") || "g";

const defaultBang = typedBangs.find((b) => 
  typeof b === 'object' && b !== null && 't' in b && b.t === LS_DEFAULT_BANG
);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const defaultBangParam = url.searchParams.get("default")?.trim();
  
  // If default bang is provided and valid, save it
  if (defaultBangParam && getAllBangs().some(b => b.t === defaultBangParam)) {
    localStorage.setItem("default-bang", defaultBangParam);
  }

  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = getAllBangs().find((b) => 
    typeof b === 'object' && b !== null && 'u' in b && 't' in b && b.t === bangCandidate
  ) ?? defaultBang;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  let searchUrl;
  if (cleanQuery === "" && selectedBang?.d) {
    // If there's no search term, just go to the domain
    searchUrl = `https://${selectedBang.d}`;
  } else {
    // Otherwise use the normal URL template with the search term
    searchUrl = selectedBang?.u?.replace(
      "{{{s}}}",
      encodeURIComponent(cleanQuery).replace(/%2F/g, "/")
    );
  }
  
  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
