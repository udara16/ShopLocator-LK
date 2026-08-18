const searchForm = document.getElementById("searchForm");
const queryInput = document.getElementById("queryInput");
const apiKeyInput = document.getElementById("apiKey");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");
const resultsGrid = document.getElementById("resultsGrid");

// Save & load API key from local storage
apiKeyInput.value = localStorage.getItem("gemini_key") || "";
apiKeyInput.addEventListener("input", (e) => {
  localStorage.setItem("gemini_key", e.target.value.trim());
});

function setQuery(text) {
  queryInput.value = text;
  searchForm.dispatchEvent(new Event("submit"));
}

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = queryInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showError("Please enter your Gemini API Key first.");
    return;
  }

  if (!query) return;

  hideError();
  resultsGrid.innerHTML = "";
  loader.classList.remove("hidden");

  // General Prompt designed to handle any type of Sri Lankan business/service
  const prompt = `
    You are a general Sri Lankan business and service directory locator.
    Perform a live search to find verified listings in Sri Lanka matching: "${query}".
    
    This could be ANY business type (e.g., medical clinics, restaurants, technicians, hardware shops, lawyers, repair services, travel agents, retail stores).
    
    Extract and return ONLY a valid JSON array of objects with the exact schema below:
    [
      {
        "name": "Business / Service / Professional Name",
        "category": "Category or Industry (e.g., Healthcare, Automobile, Dining, Tech)",
        "location": "City, District, or Town in Sri Lanka",
        "contact": "Local Phone Number(s) or Hotline",
        "address": "Full physical address, landmark, or web link",
        "description": "Brief description of the services offered, specialties, or opening hours"
      }
    ]
    
    Rules:
    - Only return verified, real Sri Lankan details.
    - Return strictly raw JSON. Do not include markdown code ticks (\`\`\`json).
  `;

  try {
    const url = `const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "API request failed");
    }

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    text = text.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();

    const businesses = JSON.parse(text);
    renderResults(businesses);

  } catch (err) {
    showError("Error: " + err.message);
  } finally {
    loader.classList.add("hidden");
  }
});

function renderResults(items) {
  if (!items || items.length === 0) {
    resultsGrid.innerHTML = `<p style="text-align: center; color: #94a3b8;">No listings found. Try a different search term.</p>`;
    return;
  }

  resultsGrid.innerHTML = items.map(item => `
    <div class="card">
      <div class="card-header">
        <div>
          <span class="card-title">${item.name || "N/A"}</span>
          ${item.category ? `<span class="card-category">${item.category}</span>` : ""}
        </div>
        <span class="card-badge">📍 ${item.location || "Sri Lanka"}</span>
      </div>
      <p class="card-desc">${item.description || ""}</p>
      <div class="card-meta">
        <span>📞 <strong>Contact:</strong> ${item.contact || "N/A"}</span>
        <span>🏢 <strong>Address:</strong> ${item.address || "N/A"}</span>
      </div>
    </div>
  `).join("");
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}
