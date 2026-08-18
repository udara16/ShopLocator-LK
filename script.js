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
    showError("කරුණාකර මුලින්ම ඔබගේ Gemini API Key එක ඇතුළත් කරන්න.");
    return;
  }

  if (!query) return;

  hideError();
  resultsGrid.innerHTML = "";
  loader.classList.remove("hidden");

  const systemInstruction = `You are a Sri Lanka local spot, business, and service directory.
Include local shops, technicians, individual service providers, clinics, restaurants, or workshops matching the exact town/service requested, rather than only large corporate chains.`;

  const prompt = `Find 4 to 8 relevant entries matching this specific search query in Sri Lanka: "${query}".`;

  // Structured output schema
  const responseSchema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        category: { type: "STRING" },
        location: { type: "STRING" },
        contact: { type: "STRING" },
        address: { type: "STRING" },
        description: { type: "STRING" }
      },
      required: ["name", "category", "location", "contact", "address", "description"]
    }
  };

  try {
    // Updated endpoint to gemini-3.6-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.2
        }
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || `API Error (${response.status})`);
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("කිසිදු තොරතුරක් ලැබුනේ නැත. නැවත උත්සාහ කරන්න.");
    }

    const businesses = JSON.parse(rawText);
    renderResults(businesses);

  } catch (err) {
    console.error(err);
    showError(err.message || "දත්ත ලබා ගැනීමේදී දෝෂයක් සිදුවිය.");
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
    resultsGrid.innerHTML = `<p style="text-align: center; color: #94a3b8;">කිසිදු තොරතුරක් හමු නොවීය. වෙනත් නමක් Search කර බලන්න.</p>`;
    return;
  }

  resultsGrid.innerHTML = items.map((item) => {
    const name = escapeHtml(item.name || "Unnamed Service");
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
          ${cleanPhone ? `<a href="tel:${escapeHtml(cleanPhone)}" class="action-btn btn-call">📞 Call Now</a>` : ""}
          <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" class="action-btn btn-map">🗺️ View on Maps</a>
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
