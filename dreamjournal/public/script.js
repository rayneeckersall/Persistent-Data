// Run after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitBtn");
  const latestContainer = document.getElementById("latestEntries");
  const tagButtons = document.querySelectorAll(".tag-pill");
  const addCustomTagBtn = document.getElementById("addCustomTag");

  // ----- ADD DREAM PAGE LOGIC -----
  if (tagButtons.length > 0) {
    // toggle selected state
    tagButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        btn.classList.toggle("selected");
      });
    });
  }

  if (addCustomTagBtn) {
    addCustomTagBtn.addEventListener("click", () => {
      const input = document.getElementById("customTag");
      const value = input.value.trim();
      if (!value) return;

      const newTag = document.createElement("button");
      newTag.type = "button";
      newTag.className = "tag-pill selected";
      newTag.textContent = value;
      newTag.addEventListener("click", () => {
        newTag.classList.toggle("selected");
      });

      document.querySelector(".tags-row").appendChild(newTag);
      input.value = "";
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const title = document.getElementById("title").value.trim();
      const story = document.getElementById("story").value.trim();
      const emotionLevel = Number(document.getElementById("emotion").value);

      if (!title || !story) {
        alert("Please add a title and story for your dream.");
        return;
      }

      const tags = [...document.querySelectorAll(".tag-pill.selected")].map(
        tag => tag.innerText
      );

      const recurring =
        document.querySelector("input[name='recurring']:checked").value ===
        "true";
      const nightmare =
        document.querySelector("input[name='nightmare']:checked").value ===
        "true";

      const dream = { title, story, tags, emotionLevel, recurring, nightmare };

      try {
        const res = await fetch("/api/dreams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dream)
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

  // ----- HOME PAGE LOGIC -----
  if (latestContainer) {
    loadDreams();
  }
   const detailCard = document.getElementById("dreamDetail");
  if (detailCard) {
    loadDreamDetail();
  }

    const deleteBtn = document.getElementById("deleteDreamBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", deleteCurrentDream);
  }

});

// fetch and render dreams on homepage
// fetch and render dreams on homepage
async function loadDreams() {
  try {
    const res = await fetch("/api/dreams");
    const dreams = await res.json();

    const container = document.getElementById("latestEntries");
    container.innerHTML = "";

    dreams.forEach(dream => {
      const card = document.createElement("div");
      card.className = "dream-card";
      card.innerHTML = `
        <h3>${dream.title}</h3>
        <p>${new Date(dream.createdAt).toLocaleDateString()}</p>
      `;

      // make card clickable – go to detail page
      card.addEventListener("click", () => {
        window.location.href = `dream.html?id=${dream._id}`;
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading dreams", err);
  }
}
// ---------- DETAIL PAGE HELPERS ----------

function getDreamIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

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

    if (!titleEl) return; // not on detail page

    titleEl.textContent = dream.title;
    dateEl.textContent = new Date(dream.createdAt).toLocaleDateString();

    // tags
    tagsEl.innerHTML = "";
    (dream.tags || []).forEach(tag => {
      const pill = document.createElement("span");
      pill.className = "tag-pill selected";
      pill.textContent = tag;
      tagsEl.appendChild(pill);
    });

    // emotion text
    const level = dream.emotionLevel || 0;
    const label =
      level <= 1 ? "Very relaxed" :
      level === 2 ? "Relaxed" :
      level === 3 ? "Neutral" :
      level === 4 ? "Strong" :
      "Very intense";

    emotionEl.textContent = `${label} (${level}/5)`;

    // type (recurring / nightmare)
    const bits = [];
    bits.push(dream.recurring ? "Recurring dream" : "One-time dream");
    bits.push(dream.nightmare ? "Nightmare" : "Not a nightmare");
    flagsEl.textContent = bits.join(" • ");

    // story
    storyEl.textContent = dream.story;
  } catch (err) {
    console.error("Error loading dream detail", err);
  }
}

async function deleteCurrentDream() {
  const id = getDreamIdFromUrl();
  if (!id) return;

  const confirmDelete = confirm("Are you sure you want to delete this dream?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/dreams/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      console.error("Failed to delete dream", res.status);
      alert("Error deleting dream.");
      return;
    }

    // back to home after delete
    window.location.href = "index.html";
  } catch (err) {
    console.error("Error deleting dream", err);
    alert("Error deleting dream.");
  }
}


