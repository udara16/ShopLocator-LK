const searchForm = document.getElementById("searchForm");
const queryInput = document.getElementById("queryInput");
const apiKeyInput = document.getElementById("apiKey");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");
const resultsGrid = document.getElementById("resultsGrid");

// Load & save API key in localStorage
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

  const prompt = `
    You are a general Sri Lankan business and service directory locator.
    Perform a live search to find verified listings in Sri Lanka matching: "${query}".
    
    This could be ANY business type (e.g., medical clinics, restaurants, technicians, hardware shops, lawyers, repair services, travel agents, retail stores).
    
    Extract and return ONLY a valid JSON array of objects with the exact schema below:
    [
      {
        "name": "Business / Service / Professional Name",
        "category": "Industry (e.g., Healthcare, Automobile, Dining, Tech)",
        "location": "City, District, or Town in Sri Lanka",
        "contact": "Local Phone Number(s) or Hotline",
        "address": "Full physical address, landmark, or street",
        "description": "Brief description of services, specialties, or opening hours"
      }
    ]
    
    Rules:
    - Only return verified, real Sri Lankan business details.
    - Return strictly raw JSON. Do not include markdown code block ticks (\`\`\`json).
  `;

  try {
    const url = `const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "API request failed");
    }

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Clean up code block markers
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    // Extract outer array boundaries
    const arrayStart = text.indexOf("[");
    const arrayEnd = text.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd !== -1) {
      text = text.substring(arrayStart, arrayEnd + 1);
    }

    const businesses = JSON.parse(text);
    renderResults(businesses);

  } catch (err) {
    showError("Error: " + err.message);
  } finally {
    loader.classList.add("hidden");
  }
});

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function renderResults(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    resultsGrid.innerHTML = `<p style="text-align: center; color: #94a3b8;">No listings found. Try adjusting your search keywords.</p>`;
    return;
  }

  resultsGrid.innerHTML = items.map((item) => {
    const name = escapeHtml(item.name || "Unnamed Listing");
    const category = escapeHtml(item.category || "");
    const location = escapeHtml(item.location || "Sri Lanka");
    const address = escapeHtml(item.address || "");
    const contact = escapeHtml(item.contact || "");
    const description = escapeHtml(item.description || "");

    const mapQuery = encodeURIComponent(`${item.name || ''} ${item.address || ''} ${item.location || 'Sri Lanka'}`.trim());
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

    const cleanPhone = (item.contact || "").replace(/[^0-9+]/g, "");

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <span class="card-title">${name}</span>
            ${category ? `<span class="card-category">${category}</span>` : ""}
          </div>
          <span class="card-badge">📍 ${location}</span>
        </div>

        <p class="card-desc">${description}</p>

        <div class="card-meta">
          ${contact ? `<span>📞 <strong>Contact:</strong> ${contact}</span>` : ""}
          ${address ? `<span>🏢 <strong>Address:</strong> ${address}</span>` : ""}
        </div>

        <div class="card-actions">
          ${cleanPhone ? `<a href="tel:${cleanPhone}" class="action-btn btn-call">📞 Call Now</a>` : ""}
          <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="action-btn btn-map">🗺️ View on Maps</a>
        </div>
      </div>
    `;
  }).join("");
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}
