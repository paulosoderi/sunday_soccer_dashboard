
function renderAchievements(player){
  const el=document.getElementById("playerAchievements");
  if(!el) return;

  el.innerHTML = ACHIEVEMENTS.map(a=>{
    const val = a.value(player) || 0;
    const pct = Math.min(100, Math.round((val / a.target) * 100));
    const unlocked = val >= a.target;

    return `
      <div class="ach ${unlocked?"unlocked":"locked"}"
          onclick="showAchievement(
              '${a.title}',
              '${a.desc}',
              '${a.icon}',
              '${a.target}',
              '${val}',
              '${pct}',
              '${a.rarity}',
              '${a.target_desc}',
              '${unlocked?"unlocked":"locked"}'
            )">
        <img src="${a.icon}" alt="">
        <div class="ach-title">${a.title}</div>
        <div class="ach-bar">
          <div style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join("");
}



function showAchievement(
  title,
  desc,
  icon,
  target,
  current,
  progress,
  rarity,
  target_desc,
  islocked // "locked" | "unlocked"
) {
  const overlay = document.getElementById("achModalOverlay");
  const modal   = overlay?.querySelector(".ach-modal");

  if (!overlay || !modal) return;

  const titleEl   = document.getElementById("achModalTitle");
  const bodyEl    = document.getElementById("achModalBody");
  const iconEl    = document.getElementById("achModalIcon");
  const progressEl= document.getElementById("achModalProgress");
  const targetEl  = document.getElementById("achModalTarget");
  const barWrapEl = document.getElementById("progressBarModel");
  const barEl     = document.getElementById("progressModal");

  // ----- content -----
  titleEl.textContent = title;
  bodyEl.textContent  = desc;
  iconEl.src          = icon;
  targetEl.textContent = target_desc;

  // ----- progress -----
  const val = current ?? 0;
  const pct = target ? Math.min(100, Math.round((val / target) * 100)) : 0;

  progressEl.textContent = `Progress: ${val}/${target}`;
  if (barEl) barEl.style.width = `${pct}%`;

  // ----- reset state -----
  modal.classList.remove("locked", "unlocked", "bronze", "silver", "gold");

  // ----- apply state -----
  modal.classList.add(islocked); // ONLY on modal

  if (rarity && islocked === "unlocked") {
    modal.classList.add(rarity);
  }

  overlay.style.display = "flex";
}

function closeAchievementModal() {
  const overlay = document.getElementById("achModalOverlay");
  if (overlay) overlay.style.display = "none";
}