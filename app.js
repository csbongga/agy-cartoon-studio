/**
 * AGY 2D Cartoon Studio & Shorts Theater — Main Application Controller
 */
(function () {
  "use strict";

  const SPEAKER_META = {
    narrator: { label: "🎙️ ผู้บรรยาย", cls: "spk-narrator" },
    boss: { label: "😠 บอส", cls: "spk-boss" },
    hero: { label: "🙋‍♂️ สมชาย", cls: "spk-hero" },
    husband: { label: "💼 สามี", cls: "spk-husband" },
    wife: { label: "👩 ภรรยา", cls: "spk-wife" },
    son: { label: "👦 ลูกชาย", cls: "spk-son" },
    mom: { label: "🧶 คุณแม่", cls: "spk-mom" },
    dad: { label: "👓 คุณพ่อ", cls: "spk-dad" },
    friend_left: { label: "🕺 เพื่อนผมรีเจ้นท์", cls: "spk-friend_left" },
    runner: { label: "🏃‍♂️ หนุ่มนักวิ่ง", cls: "spk-runner" },
    friend_right: { label: "👔 เพื่อนเสื้อสก๊อต", cls: "spk-friend_right" },
    senior: { label: "💪 รุ่นพี่ไอดอล 100%", cls: "spk-senior" },
    junior_tall: { label: "🤩 รุ่นน้องผู้เลื่อมใส", cls: "spk-junior_tall" },
  };

  const POSTED_STORAGE_KEY = "agy_tiktok_posted_eps";
  const TIKTOK_UPLOAD_URL = "https://www.tiktok.com/tiktokstudio/upload";

  let episodes = [];
  let currentEpIndex = 0;
  let fsEpIndex = 0;
  let currentSceneIndex = -1;
  let currentSpeed = 1.0;
  let speakerFilter = "all";
  let searchQuery = "";
  let studioEngine = null;
  let toastTimer = null;
  let activateTabFn = null;
  let ttActiveEpId = null;
  let ttCaptionStyle = "viral";
  let ttDashFilter = "all";

  // ------------------------------------------------------------------
  // Utilities & Audio/Video Sync
  // ------------------------------------------------------------------
  function getPostedMap() {
    try {
      const raw = localStorage.getItem(POSTED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function isEpPosted(epId) {
    const map = getPostedMap();
    return Boolean(map[epId]);
  }

  function setEpPosted(epId, posted) {
    try {
      const map = getPostedMap();
      if (posted) map[epId] = true;
      else delete map[epId];
      localStorage.setItem(POSTED_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // ignore storage quota errors
    }
  }

  function triggerFileDownload(url, filename) {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "video.mp4";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback below
      }
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
  function pauseOtherVideos(exceptId) {
    const mainVid = document.getElementById("main-video");
    const fsVid = document.getElementById("home-fullscreen-video");
    if (mainVid && exceptId !== "main-video" && !mainVid.paused) {
      mainVid.pause();
    }
    if (fsVid && exceptId !== "home-fullscreen-video" && !fsVid.paused) {
      fsVid.pause();
    }
  }

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatClock(sec) {
    const s = Math.max(0, Number(sec) || 0);
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(mins).padStart(2, "0")}:${rem.toFixed(1).padStart(4, "0")}`;
  }

  function getSpeakerInfo(speakerKey) {
    return SPEAKER_META[speakerKey] || SPEAKER_META.narrator;
  }

  // ------------------------------------------------------------------
  // Tab Navigation
  // ------------------------------------------------------------------
  function initTabs() {
    const tabBtns = document.querySelectorAll(".nav-tab");
    const panels = {
      home: document.getElementById("tab-home"),
      theater: document.getElementById("tab-theater"),
      tiktok: document.getElementById("tab-tiktok"),
      studio: document.getElementById("tab-studio"),
      pipeline: document.getElementById("tab-pipeline"),
    };

    function activateTab(tabName) {
      if (!panels[tabName]) return;

      // Never allow theater & home fullscreen videos to play simultaneously
      if (tabName !== "theater") {
        pauseOtherVideos("home-fullscreen-video");
      }
      if (tabName !== "home") {
        const modal = document.getElementById("fullscreen-player-modal");
        if (modal && !modal.hidden) {
          closeFullscreenModal();
        } else {
          pauseOtherVideos("main-video");
        }
      }

      tabBtns.forEach((btn) => {
        const isTarget = btn.dataset.tab === tabName;
        btn.classList.toggle("active", isTarget);
        btn.setAttribute("aria-selected", isTarget ? "true" : "false");
      });
      Object.entries(panels).forEach(([key, panel]) => {
        const active = key === tabName;
        panel.classList.toggle("active", active);
        panel.hidden = !active;
      });
      if (tabName === "studio" && studioEngine) {
        studioEngine.renderFrame();
      }
    }

    activateTabFn = activateTab;

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab;
        activateTab(tabName);
        if (history.replaceState) {
          history.replaceState(null, "", `#${tabName}`);
        }
      });
    });

    const brandHome = document.getElementById("brand-home");
    if (brandHome) {
      brandHome.addEventListener("click", (e) => {
        e.preventDefault();
        activateTab("home");
        if (history.replaceState) {
          history.replaceState(null, "", "#home");
        }
      });
    }

    const hash = window.location.hash.replace("#", "");
    if (panels[hash]) {
      activateTab(hash);
    } else {
      activateTab("home");
    }
  }

  // ------------------------------------------------------------------
  // Tab 1 (Default): Clean Home Video Gallery & Fullscreen Player
  // ------------------------------------------------------------------
  function renderHomeGallery() {
    const grid = document.getElementById("home-gallery-grid");
    if (!grid) return;

    grid.innerHTML = episodes
      .map((ep, idx) => {
        const poster = ep.thumbnail_url || (ep.scenes && ep.scenes[0] && ep.scenes[0].preview_url) || "";
        const dur = Number(ep.total_duration_sec || 0).toFixed(1);
        const posted = isEpPosted(ep.id);
        const postedBadge = posted ? `<span class="poster-posted-badge">✅ โพสต์ TikTok แล้ว</span>` : "";
        return `
          <article
            class="poster-card"
            data-ep-idx="${idx}"
            role="listitem"
            tabindex="0"
            aria-label="เปิดดู ${escapeHtml(ep.short_title || ep.title)} เต็มจอ"
          >
            <div class="poster-media">
              <img src="${escapeHtml(poster)}" alt="${escapeHtml(ep.short_title || ep.title)}" loading="lazy" />
              <div class="poster-gradient-overlay" aria-hidden="true"></div>
              <div class="poster-top-badges">
                <span class="poster-ep-badge">EP.${ep.number}</span>
                <span class="poster-dur-badge">${dur}s</span>
              </div>
              ${postedBadge}
              <div class="poster-center-play" aria-hidden="true">
                <span class="poster-play-circle">▶</span>
              </div>
            </div>
            <div class="poster-body">
              <span class="poster-cat-pill">${escapeHtml(ep.category || "การ์ตูนสั้น")}</span>
              <h2 class="poster-title">${escapeHtml(ep.title || ep.short_title)}</h2>
              <div class="poster-actions">
                <button type="button" class="btn btn-gold poster-cta">
                  ▶️ กดดูวิดีโอเต็มจอ
                </button>
                <button type="button" class="btn btn-tiktok poster-tiktok-btn" data-ep-id="${escapeHtml(ep.id)}">
                  🎵 เตรียมโพสต์ TikTok
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll(".poster-tiktok-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openTikTokModal(btn.dataset.epId);
      });
    });

    grid.querySelectorAll(".poster-card").forEach((card) => {
      const open = () => {
        const idx = Number(card.dataset.epIdx);
        openFullscreenEpisode(idx);
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function openFullscreenEpisode(idx) {
    if (!episodes.length) return;
    fsEpIndex = ((idx % episodes.length) + episodes.length) % episodes.length;
    const ep = episodes[fsEpIndex];

    const modal = document.getElementById("fullscreen-player-modal");
    const fsVideo = document.getElementById("home-fullscreen-video");
    const badge = document.getElementById("fs-ep-badge");
    const title = document.getElementById("fs-ep-title");
    const meta = document.getElementById("fs-ep-meta");
    const dlBtn = document.getElementById("fs-download-mp4");
    if (!modal || !fsVideo) return;

    pauseOtherVideos("home-fullscreen-video");

    const poster = ep.thumbnail_url || (ep.scenes && ep.scenes[0] && ep.scenes[0].preview_url) || "";
    const dur = Number(ep.total_duration_sec || 0).toFixed(1);
    badge.textContent = `EP.${ep.number}`;
    title.textContent = ep.title || ep.short_title;
    meta.textContent = `${ep.category || "การ์ตูนสั้น"} • ${dur}s • ${ep.width || 1080}×${ep.height || 1920}`;

    dlBtn.href = ep.video_url;
    dlBtn.setAttribute("download", `${ep.id}_cartoon.mp4`);

    fsVideo.poster = poster;
    fsVideo.src = ep.video_url;
    modal.hidden = false;
    document.body.style.overflow = "hidden";

    fsVideo.play().catch(() => {});
  }

  function closeFullscreenModal() {
    const modal = document.getElementById("fullscreen-player-modal");
    const fsVideo = document.getElementById("home-fullscreen-video");
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    if (fsVideo) {
      fsVideo.pause();
    }
    if (modal) {
      modal.hidden = true;
    }
    document.body.style.overflow = "";
  }

  function initFullscreenModal() {
    const btnClose = document.getElementById("btn-fs-close");
    const backdrop = document.getElementById("fs-backdrop");
    const btnPrev = document.getElementById("btn-fs-prev");
    const btnNext = document.getElementById("btn-fs-next");
    const btnNative = document.getElementById("btn-fs-native");
    const btnInspect = document.getElementById("btn-fs-inspect-scenes");
    const btnFsTikTok = document.getElementById("fs-open-tiktok");
    const fsVideo = document.getElementById("home-fullscreen-video");

    if (btnClose) btnClose.addEventListener("click", closeFullscreenModal);
    if (backdrop) backdrop.addEventListener("click", closeFullscreenModal);

    if (btnPrev) {
      btnPrev.addEventListener("click", () => openFullscreenEpisode(fsEpIndex - 1));
    }
    if (btnNext) {
      btnNext.addEventListener("click", () => openFullscreenEpisode(fsEpIndex + 1));
    }

    if (btnNative && fsVideo) {
      btnNative.addEventListener("click", () => {
        if (fsVideo.requestFullscreen) {
          fsVideo.requestFullscreen().catch(() => {});
        } else if (fsVideo.webkitRequestFullscreen) {
          fsVideo.webkitRequestFullscreen();
        } else if (fsVideo.webkitEnterFullscreen) {
          fsVideo.webkitEnterFullscreen();
        }
      });
    }

    if (btnInspect) {
      btnInspect.addEventListener("click", () => {
        const targetIdx = fsEpIndex;
        closeFullscreenModal();
        if (activateTabFn) activateTabFn("theater");
        if (history.replaceState) {
          history.replaceState(null, "", "#theater");
        }
        selectEpisode(targetIdx, false);
      });
    }

    if (btnFsTikTok) {
      btnFsTikTok.addEventListener("click", () => {
        const ep = episodes[fsEpIndex];
        closeFullscreenModal();
        if (ep) openTikTokModal(ep.id);
      });
    }

    if (fsVideo) {
      fsVideo.addEventListener("play", () => pauseOtherVideos("home-fullscreen-video"));
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = document.getElementById("fullscreen-player-modal");
        if (modal && !modal.hidden) {
          closeFullscreenModal();
        }
      }
    });
  }

  // ------------------------------------------------------------------
  // Tab 1: Shorts Theater
  // ------------------------------------------------------------------
  function updateGlobalStatsPill() {
    const pill = document.getElementById("stats-pill-text");
    if (!pill || !episodes.length) return;
    const totalScenes = episodes.reduce((acc, ep) => acc + (ep.scenes ? ep.scenes.length : 0), 0);
    const first = episodes[0] || {};
    const res = `${first.width || 1080}x${first.height || 1920} ${first.fps || 30}FPS`;
    pill.textContent = `${episodes.length} ตอนสำเร็จรูป • ${totalScenes} ซีน • ${res}`;
  }

  function renderEpisodeCarousel() {
    const container = document.getElementById("episode-carousel");
    if (!container) return;

    container.innerHTML = episodes
      .map((ep, idx) => {
        const activeCls = idx === currentEpIndex ? "active" : "";
        const dur = Number(ep.total_duration_sec || 0).toFixed(1);
        const sceneCount = ep.scenes ? ep.scenes.length : 0;
        return `
          <button
            type="button"
            class="ep-card ${activeCls}"
            data-ep-idx="${idx}"
            role="listitem"
            aria-pressed="${idx === currentEpIndex ? "true" : "false"}"
          >
            <div class="ep-thumb-wrap">
              <img src="${escapeHtml(ep.thumbnail_url)}" alt="EP.${ep.number}" loading="lazy" />
              <span class="ep-num-badge">EP.${ep.number}</span>
            </div>
            <div class="ep-card-body">
              <div class="ep-card-top">
                <span class="ep-cat-badge">${escapeHtml(ep.category || "การ์ตูนสั้น")}</span>
                <span class="ep-dur-badge">${dur}s</span>
              </div>
              <h3 class="ep-short-title">${escapeHtml(ep.short_title || ep.title)}</h3>
              <div class="ep-scene-count">🎬 ${sceneCount} ซีน • ${ep.width || 1080}×${ep.height || 1920}</div>
            </div>
          </button>
        `;
      })
      .join("");

    container.querySelectorAll(".ep-card").forEach((card) => {
      card.addEventListener("click", () => {
        const idx = Number(card.dataset.epIdx);
        selectEpisode(idx, true);
      });
    });
  }

  function renderStoryboardGrid() {
    const grid = document.getElementById("storyboard-grid");
    const ep = episodes[currentEpIndex];
    if (!grid || !ep) return;

    const q = searchQuery.trim().toLowerCase();
    const filtered = (ep.scenes || []).filter((sc) => {
      if (speakerFilter !== "all" && sc.speaker !== speakerFilter) return false;
      if (!q) return true;
      const haystack = [
        sc.voiceover,
        ...(sc.subtitle_lines || []),
        sc.camera,
        sc.board_mode,
        sc.board_title,
        sc.sfx,
        sc.popup,
        sc.speaker,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-scenes-state">
          ไม่พบซีนที่ตรงกับตัวกรอง "<strong>${escapeHtml(searchQuery || speakerFilter)}</strong>"
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((sc) => {
        const sceneIdx = (ep.scenes || []).indexOf(sc);
        const isActive = sceneIdx === currentSceneIndex;
        const spk = getSpeakerInfo(sc.speaker);
        const startStr = Number(sc.start_sec || 0).toFixed(1);
        const endStr = Number(sc.end_sec || 0).toFixed(1);
        const subsHtml = (sc.subtitle_lines || [])
          .map((line) => `<span class="sub-chip">${escapeHtml(line)}</span>`)
          .join("");
        const popupHtml = sc.popup
          ? `<span class="tech-badge tech-badge-popup">💬 ${escapeHtml(sc.popup)}</span>`
          : "";

        return `
          <article
            class="scene-card ${isActive ? "active-scene" : ""}"
            data-scene-idx="${sceneIdx}"
            tabindex="0"
            role="button"
            aria-label="ข้ามไปซีนที่ ${sc.index}"
          >
            <div class="scene-thumb-box">
              <img src="${escapeHtml(sc.preview_url)}" alt="Scene ${sc.index}" loading="lazy" />
              <span class="scene-num-tag">#${sc.index}</span>
              <div class="scene-play-overlay" aria-hidden="true">
                <span class="play-circle">▶</span>
              </div>
            </div>
            <div class="scene-card-content">
              <div class="scene-card-head">
                <span class="hud-speaker-badge ${spk.cls}">${spk.label}</span>
                <span class="scene-time-range">${startStr}s – ${endStr}s</span>
              </div>
              <div class="scene-voice-tag">
                🎙️ ${escapeHtml(sc.voice || "th-TH-NiwatNeural")} (${escapeHtml(sc.voice_pitch || "+0Hz")}, ${escapeHtml(sc.voice_rate || "+0%")})
              </div>
              <p class="scene-vo-text">${escapeHtml(sc.voiceover)}</p>
              <div class="scene-subs-row">${subsHtml}</div>
              <div class="scene-tech-badges">
                <span class="tech-badge">🎥 ${escapeHtml(sc.camera || "-")}</span>
                <span class="tech-badge">🖼️ ${escapeHtml(sc.board_mode || "-")}</span>
                <span class="tech-badge">🔊 ${escapeHtml(sc.sfx || "-")}</span>
                ${popupHtml}
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll(".scene-card").forEach((card) => {
      const jump = () => {
        const sIdx = Number(card.dataset.sceneIdx);
        jumpToScene(sIdx, true);
      };
      card.addEventListener("click", jump);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          jump();
        }
      });
    });
  }

  function updateTelemetryHud(timeSec) {
    const ep = episodes[currentEpIndex];
    if (!ep || !ep.scenes || !ep.scenes.length) return;

    const scenes = ep.scenes;
    let foundIdx = 0;
    for (let i = 0; i < scenes.length; i++) {
      const sc = scenes[i];
      if (timeSec >= Number(sc.start_sec) && timeSec < Number(sc.end_sec)) {
        foundIdx = i;
        break;
      }
      if (timeSec >= Number(sc.end_sec)) {
        foundIdx = i;
      }
    }

    const sc = scenes[foundIdx];
    const totalDur = Number(ep.total_duration_sec || 0);
    const spk = getSpeakerInfo(sc.speaker);

    document.getElementById("hud-scene-badge").textContent = `Scene ${sc.index} / ${scenes.length}`;
    const spkEl = document.getElementById("hud-speaker-badge");
    spkEl.className = `hud-speaker-badge ${spk.cls}`;
    spkEl.textContent = spk.label;

    document.getElementById("hud-timestamp").textContent = `${formatClock(timeSec)} / ${formatClock(totalDur)}`;
    const pct = totalDur > 0 ? Math.min(100, Math.max(0, (timeSec / totalDur) * 100)) : 0;
    document.getElementById("hud-progress-fill").style.width = `${pct.toFixed(1)}%`;

    document.getElementById("hud-voiceover").textContent = sc.voiceover || "";
    document.getElementById("hud-voice-meta").textContent = `${sc.voice || "-"} (${sc.voice_pitch || "+0Hz"})`;
    document.getElementById("hud-camera-meta").textContent = sc.camera || "-";
    document.getElementById("hud-sfx-meta").textContent = sc.sfx || "-";

    if (foundIdx !== currentSceneIndex) {
      currentSceneIndex = foundIdx;
      const allCards = document.querySelectorAll("#storyboard-grid .scene-card");
      allCards.forEach((card) => {
        const isMatch = Number(card.dataset.sceneIdx) === foundIdx;
        card.classList.toggle("active-scene", isMatch);
        if (isMatch) {
          card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
      });
    }
  }

  function renderSpeakerFilterPills(ep) {
    const container = document.getElementById("speaker-filter-pills");
    if (!container || !ep) return;

    const seen = [];
    (ep.scenes || []).forEach((sc) => {
      const spk = sc.speaker || "narrator";
      if (!seen.includes(spk)) seen.push(spk);
    });

    if (speakerFilter !== "all" && !seen.includes(speakerFilter)) {
      speakerFilter = "all";
    }

    const pills = [
      `<button type="button" class="filter-pill ${speakerFilter === "all" ? "active" : ""}" data-speaker="all">ทั้งหมด</button>`,
      ...seen.map((spkKey) => {
        const meta = getSpeakerInfo(spkKey);
        const activeCls = speakerFilter === spkKey ? "active" : "";
        return `<button type="button" class="filter-pill ${activeCls}" data-speaker="${escapeHtml(spkKey)}">${escapeHtml(meta.label)}</button>`;
      }),
    ];

    container.innerHTML = pills.join("");
    container.querySelectorAll(".filter-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        speakerFilter = pill.dataset.speaker || "all";
        container.querySelectorAll(".filter-pill").forEach((p) => {
          p.classList.toggle("active", p === pill);
        });
        renderStoryboardGrid();
      });
    });
  }

  function selectEpisode(idx, autoPlay = false) {
    if (!episodes.length) return;
    currentEpIndex = ((idx % episodes.length) + episodes.length) % episodes.length;
    currentSceneIndex = -1;
    const ep = episodes[currentEpIndex];

    // Update Carousel active state
    document.querySelectorAll("#episode-carousel .ep-card").forEach((el) => {
      const active = Number(el.dataset.epIdx) === currentEpIndex;
      el.classList.toggle("active", active);
      el.setAttribute("aria-pressed", active ? "true" : "false");
    });

    // Update Storyboard Header
    document.getElementById("sb-ep-category").textContent = ep.category || "การ์ตูนสั้น";
    document.getElementById("sb-ep-resolution").textContent = `${ep.width || 1080}×${ep.height || 1920} • ${ep.fps || 30}FPS`;
    document.getElementById("sb-ep-duration").textContent = `${Number(ep.total_duration_sec || 0).toFixed(1)}s`;
    document.getElementById("sb-ep-title").textContent = ep.title || ep.short_title;
    document.getElementById("video-ep-badge").textContent = `EP.${ep.number}`;

    // Update Download Links
    const mp4Btn = document.getElementById("btn-download-mp4");
    const srtBtn = document.getElementById("btn-download-srt");
    mp4Btn.href = ep.video_url;
    mp4Btn.setAttribute("download", `${ep.id}_cartoon.mp4`);
    srtBtn.href = ep.srt_url;
    srtBtn.setAttribute("download", `${ep.id}_subtitles.srt`);

    // Load Video
    const video = document.getElementById("main-video");
    video.poster = ep.thumbnail_url || "";
    video.src = ep.video_url;
    video.playbackRate = currentSpeed;

    renderSpeakerFilterPills(ep);
    renderStoryboardGrid();
    updateTelemetryHud(0);

    if (autoPlay) {
      video.play().catch(() => {});
    }
  }

  function jumpToScene(sceneIdx, shouldPlay = true) {
    const ep = episodes[currentEpIndex];
    const video = document.getElementById("main-video");
    if (!ep || !ep.scenes || !ep.scenes[sceneIdx] || !video) return;

    const targetTime = Math.max(0, Number(ep.scenes[sceneIdx].start_sec || 0) + 0.02);
    video.currentTime = targetTime;
    updateTelemetryHud(targetTime);
    if (shouldPlay) {
      video.play().catch(() => {});
    }
  }

  function initTheaterControls() {
    const video = document.getElementById("main-video");
    const btnPlayPause = document.getElementById("btn-play-pause");
    const playIcon = document.getElementById("play-pause-icon");
    const playText = document.getElementById("play-pause-text");
    const btnPrev = document.getElementById("btn-prev-scene");
    const btnNext = document.getElementById("btn-next-scene");
    const autoNextToggle = document.getElementById("toggle-auto-next");

    function syncPlayBtn() {
      const paused = video.paused;
      playIcon.textContent = paused ? "▶️" : "⏸️";
      playText.textContent = paused ? "เล่นวิดีโอ" : "พักวิดีโอ";
    }

    btnPlayPause.addEventListener("click", () => {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    video.addEventListener("play", () => {
      pauseOtherVideos("main-video");
      syncPlayBtn();
    });
    video.addEventListener("pause", syncPlayBtn);

    video.addEventListener("timeupdate", () => {
      updateTelemetryHud(video.currentTime);
    });

    video.addEventListener("ended", () => {
      syncPlayBtn();
      if (autoNextToggle && autoNextToggle.checked && episodes.length > 1) {
        const nextIdx = (currentEpIndex + 1) % episodes.length;
        showToast(`กำลังเล่นตอนถัดไป: EP.${episodes[nextIdx].number}`);
        selectEpisode(nextIdx, true);
      }
    });

    btnPrev.addEventListener("click", () => {
      const ep = episodes[currentEpIndex];
      if (!ep || !ep.scenes.length) return;
      const prevIdx = Math.max(0, (currentSceneIndex <= 0 ? 0 : currentSceneIndex - 1));
      jumpToScene(prevIdx, true);
    });

    btnNext.addEventListener("click", () => {
      const ep = episodes[currentEpIndex];
      if (!ep || !ep.scenes.length) return;
      const nextIdx = Math.min(ep.scenes.length - 1, currentSceneIndex + 1);
      jumpToScene(nextIdx, true);
    });

    document.querySelectorAll(".speed-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentSpeed = Number(btn.dataset.speed) || 1.0;
        video.playbackRate = currentSpeed;
        document.querySelectorAll(".speed-btn").forEach((b) => b.classList.toggle("active", b === btn));
      });
    });

    const btnTheaterTikTok = document.getElementById("btn-theater-tiktok");
    if (btnTheaterTikTok) {
      btnTheaterTikTok.addEventListener("click", () => {
        const ep = episodes[currentEpIndex];
        if (ep) openTikTokModal(ep.id);
      });
    }

    // Search & Speaker Filters
    const searchInput = document.getElementById("scene-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        renderStoryboardGrid();
      });
    }

    document.querySelectorAll("#speaker-filter-pills .filter-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        speakerFilter = pill.dataset.speaker || "all";
        document.querySelectorAll("#speaker-filter-pills .filter-pill").forEach((p) => {
          p.classList.toggle("active", p === pill);
        });
        renderStoryboardGrid();
      });
    });
  }

  // ------------------------------------------------------------------
  // TikTok Post Kit & Publishing Dashboard
  // ------------------------------------------------------------------
  const TIKTOK_FALLBACKS = {
    ep1: {
      viral: "เคยไหม?! ห้องประชุมเงียบกริบจนได้ยินเสียงแอร์... แต่ท้องเจ้ากรรมดันร้อง 'โครก!' ดังลั่นห้อง 🤣🍜",
      question: "ใครเคยท้องร้องหรือกลั้นขำสุดชีวิตกลางห้องประชุมบ้าง? รอดมาได้ยังไงคอมเมนต์เล่าหน่อย! 😂👇",
      short: "ท้องร้องกลางห้องประชุม = เกมโอเวอร์โดนบอสเรียกเข้าห้องเย็น! 💀😂",
      hashtags: ["#การ์ตูนสั้น", "#มุกตลก", "#มุกออฟฟิศ", "#ชีวิตพนักงานออฟฟิศ", "#เรื่องฮา", "#TikTokตลก", "#คลายเครียด"],
    },
    ep2: {
      viral: "เมื่อบอสเรียกประชุมด่วนตอน 17:00 น. เวลาเลิกงานพอดีเป๊ะ... เลยเสนอไอเดียประหยัดงบสุดพีคให้ซะเลย! 🕔💡",
      question: "ถ้าบอสเรียกประชุมตอน 5 โมงเย็น คุณจะตอบว่าอะไร? ทีมกลับบ้านตรงเวลาขอมือหน่อย! 🙋‍♂️🔥",
      short: "ไอเดียกู้วิกฤตบริษัท: ปิดไฟ ปิดแอร์ แล้วแยกย้ายกลับบ้านครับบอส! 🏃‍♂️💨",
      hashtags: ["#ประชุม5โมงเย็น", "#มนุษย์เงินเดือน", "#มุกออฟฟิศ", "#การ์ตูนฮา", "#ตลก", "#เลิกงานตรงเวลา", "#TikTokไทย"],
    },
    ep3: {
      viral: "บอสสั่งให้ไปล้างหน้าแก้ง่วงให้สดชื่น... แต่หายไป 1 ชั่วโมง เดินตามไปดูถึงกับช็อก! 🚿😴",
      question: "บ่ายสองโมงทีไรหนังตาหย่อนทุกที มีวิธีแก้ง่วงเด็ดๆ นอกจากการนอนคาอ่างไหมครับ? 🤣☕",
      short: "สั่งให้ไปล้างหน้าแก้ง่วง... ดันนอนแช่อ่างหลับลึกกว่าเดิมอีก! 💦💤",
      hashtags: ["#ง่วงนอนตอนบ่าย", "#มนุษย์ออฟฟิศ", "#การ์ตูนสั้น", "#มุกฮา", "#ตลก60วิ", "#คลายเครียด", "#ขายหัวเราะ"],
    },
    ep4: {
      viral: "สามีช็อกบ้านรกของเกลื่อนพื้น ถามเมียว่าเมื่อไหร่จะทำ? คำตอบเมียทำเอาควันออกหู! 🛋️🤣",
      question: "พ่อบ้านใจกล้าเจอคำตอบนี้เข้าไป ยอมจำนนเลยไหมครับ? แท็กแฟนมาดูด่วน! 😂❤️",
      short: "รออีก 3 วันไม่ได้จะทำความสะอาดนะ... อีก 3 วันคุณก็จะชินไปเอง! 💥😆",
      hashtags: ["#พ่อบ้านใจกล้า", "#มุกครอบครัว", "#คู่รักสายฮา", "#การ์ตูนตลก", "#เรื่องตลก", "#ชีวิตคู่", "#TikTokความบันเทิง"],
    },
    ep5: {
      viral: "ลูกชายดีใจได้เล่นละครโรงเรียนเป็น 'พ่อ'! พ่อกำลังจะสอนบทผู้นำสุดเท่... แต่ลูกบอกจำมาจากพ่อทุกวัน! 🎭👓",
      question: "บท 'คุณพ่อ' ในสายตาลูกชายของคุณเป็นแบบนี้เหมือนกันไหม? พยักหน้าแล้วพูดว่า จ้ะๆ! 🤣👇",
      short: "ไม่ต้องซ้อมฮะพ่อ! แค่พยักหน้าแล้วพูดว่า 'จ้ะๆ' ง่ายจะตาย! 🧶😂",
      hashtags: ["#ละครโรงเรียน", "#พ่อบ้านเกียร์มัว", "#มุกครอบครัว", "#การ์ตูนฮา", "#เรื่องฮาในบ้าน", "#ตลก", "#TikTokตลก"],
    },
    ep6: {
      viral: "คุยโวว่าออกสตาร์ทนำ 100 เมตรแรกไม่เห็นฝุ่น! เพื่อนคิดว่าจะได้เหรียญทอง... ที่ไหนได้ลงแข่งมาราธอน! 🏃‍♂️💨",
      question: "วิ่งมาราธอน 42 กิโล แต่นำแค่ 100 เมตรแรก... ที่เหลืออีก 41 โลจะรอดไหม คอมเมนต์ทายกัน! 🏅🤣",
      short: "พอๆ ไม่ต้องเล่าต่อแล้ว! สปรินต์ 100 เมตรแรกในมาราธอน 42 โล! 😵💦",
      hashtags: ["#นักวิ่งมาราธอน", "#มุกตลก", "#ฮาไม่ไหว", "#การ์ตูนสั้น", "#สายวิ่ง", "#เพื่อนฮา", "#TikTokฮา"],
    },
    ep7: {
      viral: "รุ่นพี่สายชิลสอนน้องใหม่ว่า 'ผมทุ่มเทเต็ม 100%'! พอแจกแจงรายวันปุ๊บ... หัวหน้ายืนฟังข้างหลังเต็มๆ! 💯👓",
      question: "จ.30% + อ.25% + พ.20% + พฤ.15% + ศ.10% = 100% เป๊ะ! สิ้นปีนี้โบนัสหาร 5 ดีไหมครับ? 😂🔥",
      short: "ทุ่มเท 5 วันรวมกัน 100%... ระวังโบนัสสิ้นปีหาร 5 นะเจ้ารุ่นพี่! 💀🤣",
      hashtags: ["#พนักงานดีเด่น", "#มุกออฟฟิศ", "#ชีวิตคนทำงาน", "#การ์ตูนตลก", "#ไอดอลออฟฟิศ", "#ตลก", "#โบนัส"],
    },
    ep8: {
      viral: "สามีง่วงจัดเลยสลับให้ภรรยาขับแทน... แค่เหยียบคันเร่งปุ๊บ สามีตาสว่างหายง่วง 1000%! 🚗💨",
      question: "ใครเคยนั่งรถข้างคนขับซิ่งจนต้องร้อง 'หยึย!!' บ้าง? กดหัวใจแล้วแชร์ให้คนขับดูเลย! 😱😂",
      short: "ทีไม่ขับละก็ไม่หลับนะ! ซิ่งขนาดนี้ใครจะไปกล้าหลับลงล่ะจ๊ะแม่คุณ! 🏎️💥",
      hashtags: ["#สลับคนขับ", "#เมียขับรถ", "#มุกครอบครัว", "#คู่รักสายฮา", "#ตาสว่าง", "#การ์ตูนสั้น", "#TikTokตลก"],
    },
  };

  function getTikTokKit(ep) {
    if (!ep) {
      return {
        coverUrl: "",
        captions: { viral: "", question: "", short: "" },
        hashtags: ["#การ์ตูนสั้น", "#เรื่องฮา"],
      };
    }

    const fb = TIKTOK_FALLBACKS[ep.id] || {
      viral: `${ep.title || ep.short_title} 😂🔥`,
      question: `ดูจบแล้วขำฉากไหนที่สุด? คอมเมนต์บอกกันหน่อย! 👇🤣`,
      short: `${ep.short_title || ep.title} ✨`,
      hashtags: ["#การ์ตูนสั้น", "#เรื่องฮา", "#มุกตลก", "#TikTokตลก", "#AGYStudio"],
    };

    const raw = ep.tiktok || {};
    const rawCaps = raw.captions || {};

    let viral =
      rawCaps.viral ||
      rawCaps.viral_hook ||
      raw.viral_hook ||
      raw.viral_caption ||
      (Array.isArray(rawCaps) ? rawCaps[0] : "") ||
      fb.viral;

    let question =
      rawCaps.question ||
      rawCaps.engagement ||
      rawCaps.engagement_question ||
      raw.engagement_question ||
      (Array.isArray(rawCaps) ? rawCaps[1] : "") ||
      fb.question;

    let short =
      rawCaps.short ||
      rawCaps.short_punchy ||
      raw.short_punchy ||
      (Array.isArray(rawCaps) ? rawCaps[2] : "") ||
      fb.short;

    let hashtags = Array.isArray(raw.hashtags) && raw.hashtags.length ? raw.hashtags : fb.hashtags;
    hashtags = hashtags.map((tag) => {
      const clean = String(tag || "").trim();
      return clean.startsWith("#") ? clean : `#${clean}`;
    });

    const coverUrl =
      raw.cover_url ||
      raw.recommended_cover_url ||
      ep.thumbnail_url ||
      (ep.scenes && ep.scenes[0] && ep.scenes[0].preview_url) ||
      "";

    return {
      coverUrl,
      captions: {
        viral: String(viral),
        question: String(question),
        short: String(short),
      },
      hashtags,
    };
  }

  function buildCaptionWithTags(baseCaption, hashtags, maxTags = 6) {
    const tags = (hashtags || []).slice(0, maxTags).join(" ");
    return tags ? `${baseCaption}\n\n${tags}` : baseCaption;
  }

  function updateTikTokCharCounter() {
    const editor = document.getElementById("tiktok-caption-editor");
    const counter = document.getElementById("tiktok-char-counter");
    if (!editor || !counter) return;
    const len = editor.value.length;
    counter.textContent = `${len} / 2200 ตัวอักษร`;
    counter.classList.toggle("over-limit", len > 2200);

    // Sync active highlight on hashtag chips
    document.querySelectorAll("#tiktok-hashtag-chips .tt-tag-chip").forEach((chip) => {
      const tag = chip.dataset.tag || "";
      chip.classList.toggle("in-caption", Boolean(tag && editor.value.includes(tag)));
    });
  }

  function renderTikTokHashtagChips(hashtags) {
    const wrap = document.getElementById("tiktok-hashtag-chips");
    const editor = document.getElementById("tiktok-caption-editor");
    if (!wrap || !editor) return;

    wrap.innerHTML = hashtags
      .map(
        (tag) => `
          <button type="button" class="tt-tag-chip" data-tag="${escapeHtml(tag)}">
            ${escapeHtml(tag)}
          </button>
        `
      )
      .join("");

    wrap.querySelectorAll(".tt-tag-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const tag = chip.dataset.tag || "";
        if (!tag) return;
        const current = editor.value;
        if (current.includes(tag)) {
          editor.value = current
            .replace(new RegExp(`\\s*${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        } else {
          const sep = current.trim() ? (current.includes("#") ? " " : "\n\n") : "";
          editor.value = `${current.trim()}${sep}${tag}`;
        }
        updateTikTokCharCounter();
      });
    });

    updateTikTokCharCounter();
  }

  function openTikTokModal(epId) {
    const ep = episodes.find((item) => item.id === epId) || episodes[0];
    if (!ep) return;
    ttActiveEpId = ep.id;
    ttCaptionStyle = "viral";

    const kit = getTikTokKit(ep);
    const modal = document.getElementById("tiktok-post-modal");
    if (!modal) return;

    document.getElementById("tt-modal-ep-badge").textContent = `EP.${ep.number}`;
    document.getElementById("tt-modal-title").textContent = `🎵 เตรียมโพสต์: ${ep.short_title || ep.title}`;
    const dur = Number(ep.total_duration_sec || 0).toFixed(1);
    document.getElementById("tt-modal-meta").textContent = `${ep.width || 1080}×${ep.height || 1920} 9:16 • ${dur}s • พร้อมลง TikTok ทันที`;

    const coverImg = document.getElementById("tt-cover-img");
    coverImg.src = kit.coverUrl;
    document.getElementById("tt-cover-dur").textContent = `${dur}s`;

    const dlCover = document.getElementById("btn-tt-download-cover");
    dlCover.href = kit.coverUrl;
    dlCover.setAttribute("download", `AGY_TikTok_Cover_EP${ep.number}.png`);

    const dlMp4 = document.getElementById("btn-tt-download-mp4");
    dlMp4.href = ep.video_url;
    dlMp4.setAttribute("download", `AGY_TikTok_EP${ep.number}.mp4`);

    const postedCb = document.getElementById("tt-posted-checkbox");
    const postedLbl = document.getElementById("tt-posted-label");
    const isPosted = isEpPosted(ep.id);
    postedCb.checked = isPosted;
    postedLbl.textContent = isPosted ? "✅ โพสต์ลง TikTok แล้ว" : "ทำเครื่องหมายว่าโพสต์แล้ว";

    // Reset style pills
    document.querySelectorAll("#tt-style-pills .tt-style-pill").forEach((p) => {
      p.classList.toggle("active", p.dataset.style === ttCaptionStyle);
    });

    const editor = document.getElementById("tiktok-caption-editor");
    editor.value = buildCaptionWithTags(kit.captions[ttCaptionStyle], kit.hashtags);
    renderTikTokHashtagChips(kit.hashtags);

    const banner = document.getElementById("tt-oneclick-banner");
    if (banner) {
      banner.hidden = true;
      banner.textContent = "";
    }

    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeTikTokModal() {
    const modal = document.getElementById("tiktok-post-modal");
    if (modal) modal.hidden = true;
    const fsModal = document.getElementById("fullscreen-player-modal");
    if (!fsModal || fsModal.hidden) {
      document.body.style.overflow = "";
    }
  }

  async function runOneClickTikTokPost(ep, customCaption) {
    if (!ep) return;
    const kit = getTikTokKit(ep);
    const caption = customCaption || buildCaptionWithTags(kit.captions.viral, kit.hashtags);

    await copyTextToClipboard(caption);
    triggerFileDownload(ep.video_url, `AGY_TikTok_EP${ep.number}.mp4`);
    window.open(TIKTOK_UPLOAD_URL, "_blank", "noopener,noreferrer");

    const msg = "✅ คัดลอกแคปชัน & ดาวน์โหลดคลิปแล้ว! ลากไฟล์ .mp4 ลงหน้า TikTok แล้วกด Ctrl+V วางแคปชันได้เลย!";
    const banner = document.getElementById("tt-oneclick-banner");
    if (banner) {
      banner.textContent = msg;
      banner.hidden = false;
    }
    showToast(msg);
  }

  function initTikTokModal() {
    const btnClose = document.getElementById("btn-tt-close");
    const backdrop = document.getElementById("tt-backdrop");
    const editor = document.getElementById("tiktok-caption-editor");
    const postedCb = document.getElementById("tt-posted-checkbox");
    const postedLbl = document.getElementById("tt-posted-label");
    const btnCopy = document.getElementById("btn-tt-copy");
    const btnOneClick = document.getElementById("btn-tt-oneclick");
    const btnShareMobile = document.getElementById("btn-tt-share-mobile");

    if (btnClose) btnClose.addEventListener("click", closeTikTokModal);
    if (backdrop) backdrop.addEventListener("click", closeTikTokModal);

    if (editor) {
      editor.addEventListener("input", updateTikTokCharCounter);
    }

    document.querySelectorAll("#tt-style-pills .tt-style-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const ep = episodes.find((item) => item.id === ttActiveEpId);
        if (!ep || !editor) return;
        ttCaptionStyle = pill.dataset.style || "viral";
        document.querySelectorAll("#tt-style-pills .tt-style-pill").forEach((p) => {
          p.classList.toggle("active", p === pill);
        });
        const kit = getTikTokKit(ep);
        editor.value = buildCaptionWithTags(kit.captions[ttCaptionStyle] || kit.captions.viral, kit.hashtags);
        updateTikTokCharCounter();
      });
    });

    if (postedCb) {
      postedCb.addEventListener("change", () => {
        if (!ttActiveEpId) return;
        setEpPosted(ttActiveEpId, postedCb.checked);
        postedLbl.textContent = postedCb.checked ? "✅ โพสต์ลง TikTok แล้ว" : "ทำเครื่องหมายว่าโพสต์แล้ว";
        renderHomeGallery();
        renderTikTokDashboard();
        showToast(postedCb.checked ? "✅ บันทึกสถานะ: โพสต์ลง TikTok แล้ว!" : "⏳ เปลี่ยนสถานะเป็นรอโพสต์แล้ว");
      });
    }

    if (btnCopy && editor) {
      btnCopy.addEventListener("click", async () => {
        const ok = await copyTextToClipboard(editor.value);
        if (ok) {
          const orig = btnCopy.textContent;
          btnCopy.textContent = "✅ คัดลอกแล้ว!";
          showToast("✅ คัดลอกแคปชัน + แฮชแท็กแล้ว!");
          setTimeout(() => {
            btnCopy.textContent = orig;
          }, 1800);
        } else {
          showToast("คัดลอกอัตโนมัติไม่สำเร็จ กรุณาคลุมดำและกด Ctrl+C");
        }
      });
    }

    if (btnOneClick && editor) {
      btnOneClick.addEventListener("click", () => {
        const ep = episodes.find((item) => item.id === ttActiveEpId);
        if (ep) runOneClickTikTokPost(ep, editor.value);
      });
    }

    if (btnShareMobile && editor) {
      btnShareMobile.addEventListener("click", async () => {
        const ep = episodes.find((item) => item.id === ttActiveEpId);
        if (!ep) return;
        const captionText = editor.value;
        await copyTextToClipboard(captionText);

        const origLabel = btnShareMobile.textContent;
        btnShareMobile.disabled = true;
        btnShareMobile.textContent = "⏳ กำลังเตรียมไฟล์วิดีโอสำหรับแชร์...";

        try {
          const resp = await fetch(ep.video_url);
          if (!resp.ok) throw new Error("Fetch video failed");
          const blob = await resp.blob();
          const videoFile = new File([blob], `AGY_TikTok_${ep.id}.mp4`, { type: "video/mp4" });

          if (navigator.canShare && navigator.canShare({ files: [videoFile] })) {
            await navigator.share({
              title: ep.short_title || ep.title,
              text: captionText,
              files: [videoFile],
            });
            showToast("✅ ส่งต่อไปยังหน้าแชร์มือถือแล้ว!");
          } else {
            triggerFileDownload(ep.video_url, `AGY_TikTok_EP${ep.number}.mp4`);
            window.open(TIKTOK_UPLOAD_URL, "_blank", "noopener,noreferrer");
            showToast("💻 เบราว์เซอร์นี้ไม่รองรับ Share ไฟล์ — คัดลอกแคปชัน & โหลดคลิปให้แทนแล้ว!");
          }
        } catch (err) {
          if (err && err.name === "AbortError") {
            showToast("ยกเลิกการแชร์ไฟล์");
          } else {
            triggerFileDownload(ep.video_url, `AGY_TikTok_EP${ep.number}.mp4`);
            window.open(TIKTOK_UPLOAD_URL, "_blank", "noopener,noreferrer");
            showToast("💻 ดาวน์โหลดคลิป & คัดลอกแคปชันพร้อมเปิดหน้า TikTok Upload แล้ว!");
          }
        } finally {
          btnShareMobile.disabled = false;
          btnShareMobile.textContent = origLabel;
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = document.getElementById("tiktok-post-modal");
        if (modal && !modal.hidden) {
          closeTikTokModal();
        }
      }
    });
  }

  function renderTikTokDashboard() {
    const grid = document.getElementById("tiktok-dashboard-grid");
    const countEl = document.getElementById("tt-posted-count");
    if (!grid) return;

    const postedCount = episodes.filter((ep) => isEpPosted(ep.id)).length;
    if (countEl) {
      countEl.textContent = `${postedCount} / ${episodes.length} ตอน`;
    }

    const filtered = episodes.filter((ep) => {
      const posted = isEpPosted(ep.id);
      if (ttDashFilter === "posted") return posted;
      if (ttDashFilter === "unposted") return !posted;
      return true;
    });

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-scenes-state">
          ไม่มีตอนที่ตรงกับสถานะตัวกรองนี้ 🎉
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((ep) => {
        const kit = getTikTokKit(ep);
        const dur = Number(ep.total_duration_sec || 0).toFixed(1);
        const posted = isEpPosted(ep.id);
        const tagsHtml = kit.hashtags
          .slice(0, 4)
          .map((t) => `<span class="tt-mini-tag">${escapeHtml(t)}</span>`)
          .join("");

        return `
          <article class="tt-dash-card ${posted ? "is-posted" : ""}">
            <div class="tt-dash-top">
              <div class="tt-dash-thumb">
                <img src="${escapeHtml(kit.coverUrl)}" alt="EP.${ep.number}" loading="lazy" />
                <span class="ep-num-badge">EP.${ep.number}</span>
              </div>
              <div class="tt-dash-meta">
                <div class="tt-dash-badges">
                  <span class="ep-cat-badge">${escapeHtml(ep.category || "การ์ตูนสั้น")} • ${dur}s</span>
                  <button
                    type="button"
                    class="tt-status-btn ${posted ? "posted" : ""}"
                    data-toggle-posted="${escapeHtml(ep.id)}"
                  >
                    ${posted ? "✅ โพสต์แล้ว" : "⏳ รอโพสต์"}
                  </button>
                </div>
                <h2 class="tt-dash-title">${escapeHtml(ep.short_title || ep.title)}</h2>
                <p class="tt-dash-hook">${escapeHtml(kit.captions.viral)}</p>
              </div>
            </div>

            <div class="tt-dash-tags">${tagsHtml}</div>

            <div class="tt-dash-actions">
              <button
                type="button"
                class="btn btn-tiktok btn-open-kit"
                data-open-kit="${escapeHtml(ep.id)}"
              >
                🎵 เปิดชุดเครื่องมือโพสต์ TikTok
              </button>
              <button
                type="button"
                class="btn btn-gold"
                data-quick-post="${escapeHtml(ep.id)}"
              >
                🚀 1-Click Post
              </button>
              <a
                href="${escapeHtml(ep.video_url)}"
                download="AGY_TikTok_EP${ep.number}.mp4"
                class="btn btn-outline-accent"
              >
                ⬇️ .MP4
              </a>
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll("[data-open-kit]").forEach((btn) => {
      btn.addEventListener("click", () => openTikTokModal(btn.dataset.openKit));
    });

    grid.querySelectorAll("[data-quick-post]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ep = episodes.find((item) => item.id === btn.dataset.quickPost);
        if (ep) runOneClickTikTokPost(ep);
      });
    });

    grid.querySelectorAll("[data-toggle-posted]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const epId = btn.dataset.togglePosted;
        const nextVal = !isEpPosted(epId);
        setEpPosted(epId, nextVal);
        renderHomeGallery();
        renderTikTokDashboard();
        showToast(nextVal ? "✅ บันทึกสถานะ: โพสต์ลง TikTok แล้ว!" : "⏳ เปลี่ยนสถานะเป็นรอโพสต์แล้ว");
      });
    });
  }

  function initTikTokDashboardFilters() {
    document.querySelectorAll("#tt-dash-filters [data-tt-filter]").forEach((pill) => {
      pill.addEventListener("click", () => {
        ttDashFilter = pill.dataset.ttFilter || "all";
        document.querySelectorAll("#tt-dash-filters [data-tt-filter]").forEach((p) => {
          p.classList.toggle("active", p === pill);
        });
        renderTikTokDashboard();
      });
    });
  }

  // ------------------------------------------------------------------
  // Tab 2: Live 2D Studio Wiring
  // ------------------------------------------------------------------
  function initStudio() {
    const canvas = document.getElementById("studio-canvas");
    if (!canvas || typeof window.StudioCanvasEngine !== "function") return;

    studioEngine = new window.StudioCanvasEngine(canvas);
    studioEngine.start();

    const fields = {
      board_mode: document.getElementById("st-board-mode"),
      board_title: document.getElementById("st-board-title"),
      left_char: document.getElementById("st-left-char"),
      left_expr: document.getElementById("st-left-expr"),
      right_char: document.getElementById("st-right-char"),
      right_expr: document.getElementById("st-right-expr"),
      popup_text: document.getElementById("st-popup-text"),
      popup_style: document.getElementById("st-popup-style"),
      subtitle_text: document.getElementById("st-subtitle"),
      speaker: document.getElementById("st-speaker"),
      sfx: document.getElementById("st-sfx"),
      jitter: document.getElementById("st-jitter"),
      voiceover: document.getElementById("st-voiceover"),
    };
    const jitterValLabel = document.getElementById("st-jitter-val");

    function syncFormFromState(st) {
      Object.entries(fields).forEach(([key, el]) => {
        if (el && st[key] !== undefined) {
          el.value = st[key];
        }
      });
      if (jitterValLabel) {
        jitterValLabel.textContent = Number(st.jitter || 0).toFixed(1);
      }
    }

    function pushFormToEngine() {
      const patch = {};
      Object.entries(fields).forEach(([key, el]) => {
        if (el) patch[key] = key === "jitter" ? Number(el.value) : el.value;
      });
      if (jitterValLabel) {
        jitterValLabel.textContent = Number(patch.jitter || 0).toFixed(1);
      }
      studioEngine.setState(patch);
    }

    Object.values(fields).forEach((el) => {
      if (!el) return;
      el.addEventListener("input", pushFormToEngine);
      el.addEventListener("change", pushFormToEngine);
    });

    syncFormFromState(studioEngine.state);

    // Preset buttons
    document.querySelectorAll(".btn-preset").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.preset;
        const loaded = studioEngine.loadPreset(key);
        if (loaded) {
          syncFormFromState(loaded);
          showToast(`โหลดเทมเพลต ${key.toUpperCase()} เรียบร้อย!`);
        }
      });
    });

    // Animation toggle
    const btnToggleAnim = document.getElementById("btn-studio-toggle-anim");
    const liveDot = document.getElementById("studio-live-dot");
    if (btnToggleAnim) {
      btnToggleAnim.addEventListener("click", () => {
        const playing = studioEngine.togglePlay();
        btnToggleAnim.textContent = playing ? "⏸️ หยุดชั่วคราว" : "▶️ เล่นแอนิเมชันต่อ";
        if (liveDot) liveDot.classList.toggle("paused", !playing);
      });
    }

    // Speak + SFX
    const btnSpeak = document.getElementById("btn-studio-speak");
    if (btnSpeak) {
      btnSpeak.addEventListener("click", () => {
        const spoke = studioEngine.speakThaiScript();
        showToast(spoke ? "🔊 กำลังเล่นเสียงพากย์ + SFX..." : "🔊 เล่นเสียง SFX เรียบร้อย!");
      });
    }

    // Export PNG
    const btnPng = document.getElementById("btn-studio-png");
    if (btnPng) {
      btnPng.addEventListener("click", () => {
        studioEngine.exportPng();
        showToast("📸 บันทึกภาพซีน .PNG สำเร็จ!");
      });
    }

    // Export Storyboard JSON
    const btnJson = document.getElementById("btn-studio-json");
    if (btnJson) {
      btnJson.addEventListener("click", () => {
        studioEngine.exportStoryboardJson();
        showToast("📦 ส่งออกไฟล์ storyboard_custom.json สำเร็จ!");
      });
    }
  }

  // ------------------------------------------------------------------
  // Tab 3: Pipeline Copy Buttons
  // ------------------------------------------------------------------
  function initPipelineCopyButtons() {
    document.querySelectorAll(".btn-copy").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = btn.dataset.copy || "";
        try {
          await navigator.clipboard.writeText(text);
          showToast("📋 คัดลอกคำสั่ง CLI แล้ว!");
        } catch {
          showToast("คัดลอกไม่สำเร็จ กรุณาเลือกข้อความเพื่อคัดลอกเอง");
        }
      });
    });
  }

  // ------------------------------------------------------------------
  // Bootstrap
  // ------------------------------------------------------------------
  async function loadEpisodesData() {
    if (Array.isArray(window.AGY_EPISODES) && window.AGY_EPISODES.length) {
      return window.AGY_EPISODES;
    }
    try {
      const resp = await fetch("data/episodes.json");
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // ignore fallback error
    }
    return [];
  }

  async function init() {
    initTabs();
    initFullscreenModal();
    initTikTokModal();
    initTikTokDashboardFilters();
    initTheaterControls();
    initStudio();
    initPipelineCopyButtons();

    episodes = await loadEpisodesData();
    if (episodes.length) {
      updateGlobalStatsPill();
      renderHomeGallery();
      renderTikTokDashboard();
      renderEpisodeCarousel();
      selectEpisode(0, false);
    } else {
      document.getElementById("sb-ep-title").textContent = "ไม่พบข้อมูลตอน (data/episodes_data.js)";
      document.getElementById("hud-voiceover").textContent = "กรุณาตรวจสอบไฟล์ data/episodes_data.js";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
