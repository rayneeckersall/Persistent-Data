// ---------- HELPERS ----------
function getDreamIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// For tag buttons (new + existing)
function wireTagButton(btn) {
  btn.addEventListener("click", () => {
    btn.classList.toggle("selected");
  });
}

// ---------- MAIN DOM LOADED ----------
document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitBtn");
  const latestContainer = document.getElementById("latestEntries");
  const addCustomTagBtn = document.getElementById("addCustomTag");
  const addBtn = document.getElementById("addDreamBtn");
  const detailCard = document.getElementById("dreamDetail");
  const deleteBtn = document.getElementById("deleteDreamBtn");
  const editBtn = document.getElementById("editDreamBtn");

  const confirmModal = document.getElementById("confirmModal");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  // Wire up any existing tag pills (on new.html)
  document.querySelectorAll(".tags-row .tag-pill").forEach(wireTagButton);

  // Current dream ID from URL, if any
  const editingId = getDreamIdFromUrl();

  // ----- HOME PAGE: + button -----
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      window.location.href = "new.html";
    });
  }

  // ----- ADD DREAM PAGE: tag toggles -----
  if (addCustomTagBtn) {
    addCustomTagBtn.addEventListener("click", () => {
      const input = document.getElementById("customTag");
      const value = input.value.trim();
      if (!value) return;

      const newTag = document.createElement("button");
      newTag.type = "button";
      newTag.className = "tag-pill selected";
      newTag.textContent = value;
      wireTagButton(newTag);

      const tagsRow = document.querySelector(".tags-row");
      if (tagsRow) {
        tagsRow.appendChild(newTag);
      }
      input.value = "";
    });
  }

  // ----- ADD / EDIT DREAM PAGE: pre-fill if editing -----
  if (submitBtn) {
    if (editingId) {
      // We are on new.html?id=... → EDIT MODE
      populateFormForEdit(editingId);
      submitBtn.textContent = "Save Changes";
    }

    submitBtn.addEventListener("click", async () => {
      const title = document.getElementById("title").value.trim();
      const story = document.getElementById("story").value.trim();
      const emotionLevel = Number(document.getElementById("emotion").value);

      if (!title || !story) {
        alert("Please add a title and story for your dream.");
        return;
      }

      const tags = [...document.querySelectorAll(".tag-pill.selected")].map(
        (tag) => tag.innerText
      );

      const recurringInput = document.querySelector(
        "input[name='recurring']:checked"
      );
      const nightmareInput = document.querySelector(
        "input[name='nightmare']:checked"
      );

      const recurring = recurringInput ? recurringInput.value === "true" : false;
      const nightmare = nightmareInput ? nightmareInput.value === "true" : false;

      const dream = { title, story, tags, emotionLevel, recurring, nightmare };

      // NEW: choose POST vs PUT based on edit mode
      const url = editingId ? `/api/dreams/${editingId}` : "/api/dreams";
      const method = editingId ? "PUT" : "POST";

      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dream),
        });

        if (res.ok) {
          window.location.href = "index.html";
        } else {
          alert("Error saving dream.");
        }
      } catch (err) {
        console.error(err);
        alert("Error saving dream.");
      }
    });
  }

  // ----- HOME PAGE: load list -----
  if (latestContainer) {
    loadDreams();
  }

  // ----- DETAIL PAGE: load + edit + delete (with modal) -----
  if (detailCard) {
    loadDreamDetail();
  }

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const id = getDreamIdFromUrl();
      if (!id) return;
      window.location.href = `new.html?id=${id}`;
    });
  }

  if (deleteBtn && confirmModal && cancelDeleteBtn && confirmDeleteBtn) {
    let deleteId = getDreamIdFromUrl();

    deleteBtn.addEventListener("click", () => {
      deleteId = getDreamIdFromUrl();
      if (!deleteId) return;
      confirmModal.classList.remove("hidden");
    });

    cancelDeleteBtn.addEventListener("click", () => {
      confirmModal.classList.add("hidden");
    });

    confirmDeleteBtn.addEventListener("click", async () => {
      if (!deleteId) return;

      try {
        const res = await fetch(`/api/dreams/${deleteId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          console.error("Failed to delete dream", res.status);
          alert("Error deleting dream.");
          return;
        }

        confirmModal.classList.add("hidden");
        window.location.href = "index.html";
      } catch (err) {
        console.error("Error deleting dream", err);
        alert("Error deleting dream.");
      }
    });
  }
});

// ---------- HOME: fetch and render dreams ----------
async function loadDreams() {
  try {
    const res = await fetch("/api/dreams");
    const dreams = await res.json();

    const container = document.getElementById("latestEntries");
    if (!container) return;

    container.innerHTML = "";

    dreams.forEach((dream) => {
      const card = document.createElement("div");
      card.className = "dream-card";
      card.innerHTML = `
        <h3>${dream.title}</h3>
        <p>${new Date(dream.createdAt).toLocaleDateString()}</p>
      `;

      card.addEventListener("click", () => {
        window.location.href = `dream.html?id=${dream._id}`;
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading dreams", err);
  }
}

// ---------- DETAIL PAGE: load dream data ----------
async function loadDreamDetail() {
  const id = getDreamIdFromUrl();
  if (!id) return;

  try {
    const res = await fetch(`/api/dreams/${id}`);
    if (!res.ok) {
      console.error("Failed to fetch dream", res.status);
      return;
    }

    const dream = await res.json();

    const titleEl = document.getElementById("detailTitle");
    const dateEl = document.getElementById("detailDate");
    const tagsEl = document.getElementById("detailTags");
    const emotionEl = document.getElementById("detailEmotion");
    const flagsEl = document.getElementById("detailFlags");
    const storyEl = document.getElementById("detailStory");

    if (!titleEl) return;

    titleEl.textContent = dream.title;
    dateEl.textContent = new Date(dream.createdAt).toLocaleDateString();

    // tags
    tagsEl.innerHTML = "";
    (dream.tags || []).forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "detail-chip";
      pill.textContent = tag;
      tagsEl.appendChild(pill);
    });

    // emotion
    const level = dream.emotionLevel || 0;
    const label =
      level <= 1
        ? "Very relaxed"
        : level === 2
        ? "Relaxed"
        : level === 3
        ? "Neutral"
        : level === 4
        ? "Strong"
        : "Very intense";

    emotionEl.textContent = `${label} (${level}/5)`;

    // flags (recurring / nightmare)
    const bits = [];
    bits.push(dream.recurring ? "Recurring dream" : "One-time dream");
    bits.push(dream.nightmare ? "Nightmare" : "Not a nightmare");
    flagsEl.textContent = bits.join(" • ");

    storyEl.textContent = dream.story;
  } catch (err) {
    console.error("Error loading dream detail", err);
  }
}

// ---------- EDIT MODE: pre-fill new.html form ----------
async function populateFormForEdit(id) {
  try {
    const res = await fetch(`/api/dreams/${id}`);
    if (!res.ok) {
      console.error("Failed to fetch dream for editing", res.status);
      return;
    }

    const dream = await res.json();

    // Basic fields
    const titleInput = document.getElementById("title");
    const storyInput = document.getElementById("story");
    const emotionInput = document.getElementById("emotion");

    if (titleInput) titleInput.value = dream.title || "";
    if (storyInput) storyInput.value = dream.story || "";
    if (emotionInput && dream.emotionLevel) {
      emotionInput.value = dream.emotionLevel;
    }

    // Tags
    const allTags = dream.tags || [];
    const tagsRow = document.querySelector(".tags-row");

    if (tagsRow) {
      // First, clear "selected" class from existing tag pills
      tagsRow.querySelectorAll(".tag-pill").forEach((btn) => {
        btn.classList.remove("selected");
      });

      // Mark any default tags that match
      tagsRow.querySelectorAll(".tag-pill").forEach((btn) => {
        if (allTags.includes(btn.textContent.trim())) {
          btn.classList.add("selected");
        }
      });

      // Add extra tags that don't already exist as buttons
      const defaultTagTexts = [...tagsRow.querySelectorAll(".tag-pill")].map(
        (b) => b.textContent.trim()
      );

      allTags.forEach((tag) => {
        if (!defaultTagTexts.includes(tag)) {
          const newTag = document.createElement("button");
          newTag.type = "button";
          newTag.className = "tag-pill selected";
          newTag.textContent = tag;
          wireTagButton(newTag);
          tagsRow.appendChild(newTag);
        }
      });
    }

    // Recurring / Nightmare radios
    const recurringRadios = document.querySelectorAll("input[name='recurring']");
    recurringRadios.forEach((r) => {
      r.checked = dream.recurring ? r.value === "true" : r.value === "false";
    });

    const nightmareRadios = document.querySelectorAll("input[name='nightmare']");
    nightmareRadios.forEach((r) => {
      r.checked = dream.nightmare ? r.value === "true" : r.value === "false";
    });
  } catch (err) {
    console.error("Error populating form for edit", err);
  }
}

// ---------- DAY → NIGHT SCROLL ANIMATION ----------
window.addEventListener("scroll", () => {
  const max = document.body.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  document.documentElement.style.setProperty(
    "--scroll-progress",
    progress.toString()
  );
});
