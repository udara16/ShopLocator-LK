const searchForm = document.getElementById("searchForm");
const queryInput = document.getElementById("queryInput");
const apiKeyInput = document.getElementById("apiKey");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");
const resultsGrid = document.getElementById("resultsGrid");

// LocalStorage එකේ API key එක auto-save කරගැනීම
apiKeyInput.value = localStorage.getItem("gemini_key") || "";
apiKeyInput.addEventListener("input", (e) => {
  localStorage.setItem("gemini_key", e.target.value.trim());
});

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
    Find Sri Lankan local business directory listings for: "${query}".
    Return ONLY a valid JSON array containing objects matching this schema:
    [
      {
        "name": "Shop Name",
        "location": "City/Area",
        "contact": "Phone Number",
        "address": "Address or Website",
        "description": "Short summary"
      }
    ]
    Do not add backticks or markdown wrap. Provide accurate Sri Lankan phone numbers and areas.
  `;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
    resultsGrid.innerHTML = `<p style="text-align: center; color: #94a3b8;">No results found.</p>`;
    return;
  }

  resultsGrid.innerHTML = items.map(item => `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${item.name || "N/A"}</h3>
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
