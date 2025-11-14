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
});

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
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading dreams", err);
  }
}
