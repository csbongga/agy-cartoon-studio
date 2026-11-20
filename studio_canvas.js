/**
 * AGY 2D Cartoon Studio — Live HTML5 Canvas 2D Engine & Audio Synth
 * Renders 540x960 (9:16) animated comic scenes at 30 FPS in the browser.
 */
(function (global) {
  "use strict";

  const CANVAS_W = 540;
  const CANVAS_H = 960;
  const TARGET_FPS = 30;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  // Authentic palette matching character_engine.py
  const PAL = {
    outline: "#231815",
    skin: "#F6C098",
    skinShadow: "#E4A57B",
    shirtWhite: "#F4F4F6",
    redTie: "#D32F2F",
    redAlert: "#D93829",
    blush: "#E57373",
    sweat: "#4FC3F7",
    wallMeeting: "#DCE3EA",
    woodFrame: "#8B5A2B",
    whiteboard: "#F7F5EE",
    chartBlue: "#2B5B84",
    tableDark: "#4A332D",
    chalkboard: "#183A2C",
    goldText: "#F4A922",
    deskWood: "#C88A4B",
    subGold: "#FFD54F",
    subStroke: "#140F0F",
    bossSuit: "#3B5998",
    bossSuitLight: "#4A6FE3",
    yellowShirt: "#FFF176",
    pinkTie: "#EC407A",
    pantsDark: "#262930",
    tileBg: "#E0F2F1",
    tileGrid: "#B2DFDB",
    silver: "#B0BEC5",
    water: "#4FC3F7",
    ragePink: "#FF4D79",
    creamWall: "#F4EFE6",
    ep4Floor: "#EAEFF5",
    sofa: "#DCE775",
    sofaLight: "#E6EE9C",
    pillow: "#80DEEA",
    husbandTie: "#C62828",
    tealPants: "#1B5E5A",
    briefcase: "#8D6E63",
    wifeOrange: "#E69A28",
    wifePink: "#EC407A",
    blueCloud: "#BBDEFB",
    blueBorder: "#90CAF9",
  };

  const PRESETS = {
    ep1: {
      board_mode: "chart_crisis",
      board_title: "ประชุมด่วน! ซีเรียส 100%",
      left_char: "boss",
      left_expr: "angry_point",
      right_char: "somchai",
      right_expr: "holding_laugh",
      popup_text: "โครก!!",
      popup_style: "shout",
      subtitle_text: "จู่ๆ ท้องก็ดันร้อง โครก!\nดังลั่นห้องประชุม",
      voiceover: "จู่ๆ ท้องเจ้ากรรมก็ดันร้อง โครก! ดังลั่นห้อง จนบอสหยุดพูดแล้วหันมามองตาขวาง",
      speaker: "narrator",
      sfx: "stomach_growl",
      jitter: 4.5,
    },
    ep2: {
      board_mode: "rules_board",
      board_title: "ไอเดียกู้วิกฤตบริษัท!",
      left_char: "boss",
      left_expr: "fuming",
      right_char: "somchai",
      right_expr: "idea_hand",
      popup_text: "เลิกประชุมกลับบ้านเลยครับ!",
      popup_style: "clock_17",
      subtitle_text: "บอสครับ! ผมมีไอเดีย!\nปิดไฟ ปิดแอร์ กลับบ้านเลยครับ!",
      voiceover: "เราเลยตัดสินใจยกมือตอบเสียงดังฟังชัด... บอสครับ! เลิกประชุมแล้วกลับบ้านตอนนี้เลยครับ!",
      speaker: "hero",
      sfx: "pop_alert",
      jitter: 3.0,
    },
    ep3: {
      board_mode: "restroom_sink",
      board_title: "ห้องน้ำชาย — ผ่านไป 1 ชม.",
      left_char: "boss",
      left_expr: "shock",
      right_char: "somchai",
      right_expr: "sleep_sink",
      popup_text: "1 ชั่วโมงผ่านไป...",
      popup_style: "banner_1hr",
      subtitle_text: "สมชายก้มเอาหน้าจุ่มอ่าง!\nเปิดน้ำใส่หัวแล้วหลับต่อเฉยเลย!",
      voiceover: "พอมองเข้าไปใกล้ๆ... โอ้โห สมชายก้มเอาหน้าจุ่มอ่างล้างหน้า เปิดน้ำไหลใส่หัว แล้วหลับต่อคาอ่างไปเลยจ้า!",
      speaker: "narrator",
      sfx: "water_splash",
      jitter: 2.5,
    },
    ep4: {
      board_mode: "messy_living_room",
      board_title: "HAVE A BREAK — บ้านหรรษา",
      left_char: "husband",
      left_expr: "fuming",
      right_char: "wife",
      right_expr: "sofa_chill",
      popup_text: "รออีก 3 วัน เดี๋ยวก็ชินเองจ้ะ!",
      popup_style: "speech",
      subtitle_text: "เปล่าทำหรอกจ้ะ...\nอีกสามวัน คุณก็จะชินไปเอง!",
      voiceover: "ภรรยาหันหลังยิ้มอารมณ์ดี แล้วตอบหน้าตาเฉย... เปล่าทำหรอกจ้ะ อีกสามวัน คุณก็จะชินไปเองต่างหากล่ะ!",
      speaker: "wife",
      sfx: "rimshot",
      jitter: 3.5,
    },
    ep5: {
      board_mode: "family_sofa_purple",
      board_title: "ขายหัวเราะ — ละครโรงเรียน",
      left_char: "dad",
      left_expr: "shock",
      right_char: "mom",
      right_expr: "sofa_chill",
      popup_text: "แค่พยักหน้า แล้วพูดว่า จ้ะๆ...",
      popup_style: "speech",
      subtitle_text: "ไม่ต้องหรอกฮะ ผมเห็นพ่อทำทุกวัน\nแค่พยักหน้า แล้วพูดว่า จ้ะๆ...",
      voiceover: "ลูกชายรีบตอบแบบใสซื่อ... ไม่ต้องหรอกฮะ ผมเห็นพ่อทำทุกวัน แค่พยักหน้าแล้วพูดว่า จ้ะๆ แม่สั่งให้ทำอะไรก็ทำตาม แค่นี้ง่ายจะตายไปฮะ!",
      speaker: "son",
      sfx: "rimshot",
      jitter: 3.0,
    },
    ep6: {
      board_mode: "bar_counter_purple",
      board_title: "มาราธอน 42 กิโลเมตร!!",
      left_char: "boss",
      left_expr: "shock",
      right_char: "somchai",
      right_expr: "holding_laugh",
      popup_text: "ร้อยเมตรแรกผมนำ แต่หลังจากนั้น...",
      popup_style: "speech",
      subtitle_text: "\"ไม่ใช่..ไม่ได้.. คือผมวิ่งมาราธอน..\"\n\"ร้อยเมตรแรกผมนำ.. แต่หลังจากนั้น...\"",
      voiceover: "หนุ่มนักวิ่งหัวเราะแหะๆ แล้วรีบแก้ตัว... ไม่ใช่ ไม่ได้เหรียญ คือผมวิ่งมาราธอน ร้อยเมตรแรกผมนำ แต่หลังจากนั้น...",
      speaker: "runner",
      sfx: "rimshot",
      jitter: 3.0,
    },
    ep7: {
      board_mode: "office_idol_purple",
      board_title: "5 วันรวมกัน = 100% พอดี!!",
      left_char: "boss",
      left_expr: "fuming",
      right_char: "somchai",
      right_expr: "idea_hand",
      popup_text: "อังคาร 25% พุธ 20% พฤหัส 15% ศุกร์ 10%!",
      popup_style: "speech",
      subtitle_text: "ทุ่มเท 5 วันรวมกันได้แค่ 100%\nงั้นสิ้นปีนี้ เอาโบนัสไปหาร 5 เหมือนกันนะ!!",
      voiceover: "วันอังคารทำยี่สิบห้าเปอร์เซ็นต์ วันพุธทำยี่สิบ วันพฤหัสทำสิบห้า วันศุกร์ทำสิบเปอร์เซ็นต์ ครบหนึ่งร้อยเปอร์เซ็นต์พอดีเป๊ะ!",
      speaker: "senior",
      sfx: "rimshot",
      jitter: 3.0,
    },
  };

  class StudioCanvasEngine {
    constructor(canvasEl) {
      this.canvas = canvasEl;
      this.ctx = canvasEl ? canvasEl.getContext("2d") : null;
      this.isPlaying = true;
      this.rafId = null;
      this.lastFrameTs = 0;
      this.timeSec = 0;
      this.frameCount = 0;
      this.audioCtx = null;

      this.state = { ...PRESETS.ep1 };
    }

    setState(partial) {
      this.state = { ...this.state, ...partial };
      if (!this.isPlaying) {
        this.renderFrame();
      }
    }

    loadPreset(key) {
      if (PRESETS[key]) {
        this.state = { ...PRESETS[key] };
        if (!this.isPlaying) {
          this.renderFrame();
        }
        return { ...this.state };
      }
      return null;
    }

    start() {
      if (!this.ctx) return;
      if (this.rafId) return;
      this.lastFrameTs = performance.now();
      const tick = (now) => {
        this.rafId = requestAnimationFrame(tick);
        const delta = now - this.lastFrameTs;
        if (delta >= FRAME_INTERVAL) {
          this.lastFrameTs = now - (delta % FRAME_INTERVAL);
          if (this.isPlaying) {
            this.timeSec += FRAME_INTERVAL / 1000;
            this.frameCount += 1;
            this.renderFrame();
          }
        }
      };
      this.rafId = requestAnimationFrame(tick);
    }

    togglePlay() {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        this.lastFrameTs = performance.now();
      }
      return this.isPlaying;
    }

    // ------------------------------------------------------------------
    // Drawing Helpers
    // ------------------------------------------------------------------
    _roundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth = 4) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
    }

    _drawWrappedStrokeText(ctx, text, cx, y, maxWidth, lineHeight, font, fill, stroke, strokeW) {
      ctx.save();
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;

      const rawLines = String(text || "").split(/\n|\//g).map((s) => s.trim()).filter(Boolean);
      const lines = rawLines.length ? rawLines : [""];
      const startY = y - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, i) => {
        const ly = startY + i * lineHeight;
        if (stroke && strokeW > 0) {
          ctx.lineWidth = strokeW;
          ctx.strokeStyle = stroke;
          ctx.strokeText(line, cx, ly, maxWidth);
        }
        ctx.fillStyle = fill;
        ctx.fillText(line, cx, ly, maxWidth);
      });
      ctx.restore();
    }

    // ------------------------------------------------------------------
    // Backgrounds (board_mode)
    // ------------------------------------------------------------------
    _drawBackground(ctx, t) {
      const mode = this.state.board_mode;
      const title = this.state.board_title || "AGY STUDIO";

      if (mode === "chart_crisis") {
        // Wall
        ctx.fillStyle = PAL.wallMeeting;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#C6D0DB";
        ctx.fillRect(0, 620, CANVAS_W, 18);

        // Whiteboard
        this._roundRect(ctx, 42, 66, 456, 330, 12, PAL.woodFrame, PAL.outline, 5);
        this._roundRect(ctx, 56, 80, 428, 302, 6, PAL.whiteboard, PAL.outline, 3);

        // Title Banner on Whiteboard
        this._roundRect(ctx, 78, 92, 384, 52, 10, PAL.redAlert, PAL.outline, 3.5);
        this._drawWrappedStrokeText(ctx, title, 270, 118, 360, 26, "700 22px Kanit, sans-serif", "#FFFFFF", null, 0);

        // Crisis Chart Grid + Red Spike
        ctx.save();
        ctx.strokeStyle = "rgba(43,91,132,0.18)";
        ctx.lineWidth = 2;
        for (let gx = 90; gx <= 450; gx += 45) {
          ctx.beginPath(); ctx.moveTo(gx, 165); ctx.lineTo(gx, 355); ctx.stroke();
        }
        for (let gy = 165; gy <= 355; gy += 38) {
          ctx.beginPath(); ctx.moveTo(90, gy); ctx.lineTo(450, gy); ctx.stroke();
        }

        // Blue bar accents
        ctx.fillStyle = "rgba(43,91,132,0.22)";
        [52, 85, 118, 155].forEach((bh, idx) => {
          ctx.fillRect(108 + idx * 80, 355 - bh, 38, bh);
        });

        // Animated zigzag crisis line
        const pulse = Math.sin(t * 5) * 6;
        ctx.beginPath();
        ctx.moveTo(100, 332);
        ctx.lineTo(175, 292);
        ctx.lineTo(250, 310);
        ctx.lineTo(325, 235);
        ctx.lineTo(405, 184 + pulse);
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = PAL.redAlert;
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = PAL.redAlert;
        ctx.beginPath();
        ctx.arc(405, 184 + pulse, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Conference table foreground
        this._roundRect(ctx, -10, 685, CANVAS_W + 20, 285, 0, PAL.tableDark, PAL.outline, 5);
        ctx.fillStyle = "#382621";
        ctx.fillRect(0, 685, CANVAS_W, 18);
      } else if (mode === "rules_board") {
        ctx.fillStyle = PAL.wallMeeting;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        this._roundRect(ctx, 36, 62, 468, 336, 12, PAL.woodFrame, PAL.outline, 5);
        this._roundRect(ctx, 50, 76, 440, 308, 6, PAL.chalkboard, PAL.outline, 3);

        this._drawWrappedStrokeText(ctx, title, 270, 122, 400, 28, "700 25px Kanit, sans-serif", PAL.goldText, PAL.outline, 3);

        const rules = [
          "1. ห้ามส่งเสียงดังเด็ดขาด!",
          "2. ห้ามสบตาบอสตอน 17:00 น.",
          "3. ห้ามหลุดขำกลางห้องประชุม",
        ];
        ctx.save();
        ctx.font = "600 19px Prompt, sans-serif";
        ctx.fillStyle = "#E8F5E9";
        ctx.textAlign = "left";
        rules.forEach((r, i) => {
          ctx.fillText(r, 82, 186 + i * 52);
        });
        ctx.restore();

        // Wooden Desk
        this._roundRect(ctx, -10, 685, CANVAS_W + 20, 285, 0, PAL.deskWood, PAL.outline, 5);
        ctx.fillStyle = "#A86E36";
        ctx.fillRect(0, 685, CANVAS_W, 18);
      } else if (mode === "office_desk") {
        ctx.fillStyle = "#ECE7DF";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Partition panel
        this._roundRect(ctx, 30, 240, 480, 445, 10, "#D3DCE6", PAL.outline, 4);

        // Top Header Board
        this._roundRect(ctx, 70, 54, 400, 66, 14, PAL.bossSuit, PAL.outline, 4);
        this._drawWrappedStrokeText(ctx, title, 270, 87, 370, 24, "700 22px Kanit, sans-serif", "#FFF176", PAL.outline, 3);

        // Wall Clock (14:00)
        ctx.save();
        ctx.beginPath();
        ctx.arc(448, 178, 42, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(448, 178); ctx.lineTo(448, 149);
        ctx.moveTo(448, 178); ctx.lineTo(470, 188);
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();

        // Office Desk & Props
        this._roundRect(ctx, -10, 675, CANVAS_W + 20, 295, 0, PAL.deskWood, PAL.outline, 5);
        // Laptop on left
        this._roundRect(ctx, 35, 622, 105, 58, 6, "#607D8B", PAL.outline, 3.5);
        // Coffee mug
        this._roundRect(ctx, 430, 636, 36, 40, 6, "#FFFFFF", PAL.outline, 3);
      } else if (mode === "restroom_sink") {
        // Restroom Tiles
        ctx.fillStyle = PAL.tileBg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.strokeStyle = PAL.tileGrid;
        ctx.lineWidth = 2;
        for (let x = 0; x <= CANVAS_W; x += 45) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 690); ctx.stroke();
        }
        for (let y = 0; y <= 690; y += 45) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
        }

        // Restroom Sign
        this._roundRect(ctx, 85, 52, 370, 64, 14, "#00695C", PAL.outline, 4);
        this._drawWrappedStrokeText(ctx, title, 270, 84, 340, 24, "700 22px Kanit, sans-serif", "#FFFFFF", PAL.outline, 2);

        // Mirror
        this._roundRect(ctx, 215, 165, 275, 240, 16, "#E1F5FE", PAL.outline, 5);
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(250, 210); ctx.lineTo(310, 270);
        ctx.moveTo(278, 198); ctx.lineTo(352, 272);
        ctx.stroke();

        // Floor
        ctx.fillStyle = "#D6CFC7";
        ctx.fillRect(0, 688, CANVAS_W, CANVAS_H - 688);
        ctx.strokeStyle = PAL.outline;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 688); ctx.lineTo(CANVAS_W, 688); ctx.stroke();

        // Overflowing Water Puddle on floor
        const puddleW = 145 + Math.sin(t * 4) * 8;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(360, 748, puddleW, 24, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(79, 195, 247, 0.72)";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#0288D1";
        ctx.stroke();
        ctx.restore();

        // Sink & Faucet on right
        this._roundRect(ctx, 265, 560, 215, 86, 26, "#FFFFFF", PAL.outline, 5);
        this._roundRect(ctx, 348, 644, 52, 75, 8, "#ECEFF1", PAL.outline, 4);
        // Faucet
        this._roundRect(ctx, 412, 502, 22, 62, 8, PAL.silver, PAL.outline, 4);
        this._roundRect(ctx, 362, 496, 72, 22, 10, PAL.silver, PAL.outline, 4);

        // Animated Water Stream
        ctx.save();
        ctx.fillStyle = PAL.water;
        const streamOffset = (t * 140) % 24;
        ctx.fillRect(366, 518, 14, 52);
        ctx.fillStyle = "#E1F5FE";
        for (let wy = 520 + streamOffset; wy < 568; wy += 20) {
          ctx.beginPath();
          ctx.arc(373, wy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (mode === "messy_living_room") {
        ctx.fillStyle = PAL.creamWall;
        ctx.fillRect(0, 0, CANVAS_W, 645);
        ctx.fillStyle = PAL.ep4Floor;
        ctx.fillRect(0, 645, CANVAS_W, CANVAS_H - 645);
        ctx.strokeStyle = PAL.outline;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 645); ctx.lineTo(CANVAS_W, 645); ctx.stroke();

        // Wall Frame Poster
        this._roundRect(ctx, 76, 62, 388, 92, 12, "#FFFFFF", PAL.woodFrame, 6);
        this._drawWrappedStrokeText(ctx, title, 270, 108, 350, 24, "700 22px Kanit, sans-serif", "#E65100", null, 0);

        // Sofa on right
        this._roundRect(ctx, 225, 455, 290, 150, 24, PAL.sofa, PAL.outline, 4.5);
        this._roundRect(ctx, 212, 525, 312, 72, 18, PAL.sofaLight, PAL.outline, 4.5);
        // Sofa Pillows
        this._roundRect(ctx, 242, 492, 54, 48, 12, PAL.pillow, PAL.outline, 3.5);
        this._roundRect(ctx, 446, 492, 54, 48, 12, PAL.pillow, PAL.outline, 3.5);

        // Messy floor props (socks, pizza box, toy blocks, crumpled paper)
        this._roundRect(ctx, 56, 678, 86, 48, 6, "#FFCC80", PAL.outline, 3); // pizza box
        this._roundRect(ctx, 178, 704, 34, 34, 6, "#EF5350", PAL.outline, 3); // block
        this._roundRect(ctx, 222, 688, 28, 28, 6, "#42A5F5", PAL.outline, 3); // block
        this._roundRect(ctx, 355, 696, 54, 24, 10, "#EC407A", PAL.outline, 3); // sock
        ctx.beginPath();
        ctx.arc(462, 682, 18, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
      } else if (mode === "family_sofa_purple" || mode === "family_sofa_blue") {
        const isPurple = mode === "family_sofa_purple";
        const grad = ctx.createLinearGradient(0, 0, 0, 680);
        grad.addColorStop(0, isPurple ? "#EDE7F6" : "#E3F2FD");
        grad.addColorStop(1, isPurple ? "#D1C4E9" : "#BBDEFB");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_W, 680);

        // Soft comic sparkles / clouds
        const drift = Math.sin(t * 1.4) * 10;
        [
          [92 + drift, 210, 44],
          [138 + drift, 202, 52],
          [432 - drift, 240, 48],
          [388 - drift, 250, 38],
        ].forEach(([cx, cy, r]) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.65)";
          ctx.fill();
        });

        // Warm living room floor
        ctx.fillStyle = "#F3E5AB";
        ctx.fillRect(0, 665, CANVAS_W, CANVAS_H - 665);
        ctx.strokeStyle = PAL.outline;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 665); ctx.lineTo(CANVAS_W, 665); ctx.stroke();

        // Comic header banner
        this._roundRect(ctx, 56, 56, 428, 68, 16, isPurple ? "#5E35B1" : "#1565C0", PAL.outline, 4.5);
        this._drawWrappedStrokeText(ctx, title, 270, 90, 396, 24, "700 22px Kanit, sans-serif", "#FFD54F", PAL.outline, 3);

        // Plush Family Sofa (Center-Right)
        this._roundRect(ctx, 146, 448, 366, 178, 28, isPurple ? "#FFCC80" : "#DCE775", PAL.outline, 5);
        this._roundRect(ctx, 132, 540, 392, 92, 22, isPurple ? "#FFE0B2" : "#E6EE9C", PAL.outline, 5);
        // Sofa armrest
        this._roundRect(ctx, 128, 504, 48, 120, 18, isPurple ? "#FFB74D" : "#C0CA33", PAL.outline, 4.5);
        this._roundRect(ctx, 476, 504, 48, 120, 18, isPurple ? "#FFB74D" : "#C0CA33", PAL.outline, 4.5);
      } else if (mode === "bar_counter_warm" || mode === "bar_counter_blue" || mode === "bar_counter_purple") {
        const bgMap = {
          bar_counter_warm: ["#FFF3E0", "#FFE0B2", "#E65100"],
          bar_counter_blue: ["#E3F2FD", "#BBDEFB", "#1565C0"],
          bar_counter_purple: ["#EDE7F6", "#D1C4E9", "#5E35B1"],
        };
        const [topC, botC, hdrC] = bgMap[mode];
        const grad = ctx.createLinearGradient(0, 0, 0, 720);
        grad.addColorStop(0, topC);
        grad.addColorStop(1, botC);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_W, 720);

        // Decorative bar shelves in background
        this._roundRect(ctx, 46, 175, 448, 14, 6, "#8D6E63", PAL.outline, 3.5);
        [78, 118, 158, 372, 412, 446].forEach((bx, bi) => {
          const bh = 42 + (bi % 2) * 14;
          const bCol = ["#4FC3F7", "#FFD54F", "#81C784", "#F48FB1", "#FFB74D", "#90CAF9"][bi];
          this._roundRect(ctx, bx, 175 - bh, 24, bh, 6, bCol, PAL.outline, 3);
        });

        // Lower floor behind counter
        ctx.fillStyle = "#4E342E";
        ctx.fillRect(0, 680, CANVAS_W, CANVAS_H - 680);

        // Header banner
        this._roundRect(ctx, 56, 56, 428, 68, 16, hdrC, PAL.outline, 4.5);
        this._drawWrappedStrokeText(ctx, title, 270, 90, 396, 24, "700 22px Kanit, sans-serif", "#FFD54F", PAL.outline, 3);
      } else if (mode === "office_idol_warm" || mode === "office_idol_blue" || mode === "office_idol_purple") {
        const bgMap = {
          office_idol_warm: ["#FFF8E1", "#FFE0B2", "#E65100"],
          office_idol_blue: ["#E3F2FD", "#BBDEFB", "#1565C0"],
          office_idol_purple: ["#F3E5F5", "#CE93D8", "#6A1B9A"],
        };
        const [topC, botC, hdrC] = bgMap[mode];
        const grad = ctx.createLinearGradient(0, 0, 0, 680);
        grad.addColorStop(0, topC);
        grad.addColorStop(1, botC);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_W, 680);

        // Office wall board showing weekly math
        this._roundRect(ctx, 44, 152, 224, 114, 12, "#FFFFFF", PAL.woodFrame, 5);
        this._drawWrappedStrokeText(
          ctx,
          "จ.30% + อ.25%\nพ.20%+พฤ.15%+ศ.10%\n= 100%!!",
          156,
          209,
          204,
          26,
          "700 17px Kanit, sans-serif",
          mode === "office_idol_purple" ? "#C62828" : "#1565C0",
          null,
          0
        );

        // Office Floor
        ctx.fillStyle = "#D7CCC8";
        ctx.fillRect(0, 665, CANVAS_W, CANVAS_H - 665);
        ctx.strokeStyle = PAL.outline;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 665); ctx.lineTo(CANVAS_W, 665); ctx.stroke();

        // Header banner
        this._roundRect(ctx, 56, 56, 428, 68, 16, hdrC, PAL.outline, 4.5);
        this._drawWrappedStrokeText(ctx, title, 270, 90, 396, 24, "700 22px Kanit, sans-serif", "#FFD54F", PAL.outline, 3);
      } else {
        // couple_blue_bg
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        grad.addColorStop(0, "#E3F2FD");
        grad.addColorStop(0.65, "#BBDEFB");
        grad.addColorStop(1, "#90CAF9");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Floating Comic Clouds
        const drift = Math.sin(t * 1.2) * 14;
        [
          [110 + drift, 230, 52],
          [160 + drift, 220, 62],
          [420 - drift, 290, 56],
          [365 - drift, 305, 44],
        ].forEach(([cx, cy, r]) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.78)";
          ctx.fill();
        });

        this._roundRect(ctx, 64, 58, 412, 66, 16, "#1565C0", PAL.outline, 4);
        this._drawWrappedStrokeText(ctx, title, 270, 91, 380, 24, "700 23px Kanit, sans-serif", "#FFD54F", PAL.outline, 3);
      }
    }

    // ------------------------------------------------------------------
    // Characters
    // ------------------------------------------------------------------
    _drawLeftCharacter(ctx, t, blink) {
      const charType = this.state.left_char;
      const expr = this.state.left_expr;
      const bob = Math.sin(t * 3.4) * 3;
      const shakeX = expr === "fuming" ? Math.sin(t * 36) * 2.5 : 0;
      const cx = 138 + shakeX;
      const cy = 530 + bob;

      ctx.save();
      // Suit / Torso colors
      let jacket = PAL.bossSuit;
      let tieColor = PAL.pinkTie;
      let hairColor = "#37474F";
      if (charType === "husband") {
        jacket = "#37474F";
        tieColor = PAL.husbandTie;
        hairColor = "#263238";
      } else if (charType === "dad") {
        jacket = "#42A5F5";
        tieColor = "#1565C0";
        hairColor = "#263238";
      } else if (charType === "somchai" || charType === "son") {
        jacket = charType === "son" ? "#66BB6A" : PAL.yellowShirt;
        tieColor = PAL.pinkTie;
        hairColor = "#1F2937";
      }

      // Briefcase for husband
      if (charType === "husband") {
        this._roundRect(ctx, cx - 96, cy + 72, 68, 52, 8, PAL.briefcase, PAL.outline, 4);
        this._roundRect(ctx, cx - 74, cy + 58, 24, 16, 5, "transparent", PAL.outline, 4);
      }

      // Body
      this._roundRect(ctx, cx - 68, cy - 10, 136, 172, 34, jacket, PAL.outline, 5);
      // Shirt V-neck + Tie
      ctx.beginPath();
      ctx.moveTo(cx - 28, cy - 8);
      ctx.lineTo(cx + 28, cy - 8);
      ctx.lineTo(cx, cy + 68);
      ctx.closePath();
      ctx.fillStyle = PAL.shirtWhite;
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = PAL.outline;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 4);
      ctx.lineTo(cx + 9, cy - 4);
      ctx.lineTo(cx + 13, cy + 66);
      ctx.lineTo(cx, cy + 84);
      ctx.lineTo(cx - 13, cy + 66);
      ctx.closePath();
      ctx.fillStyle = tieColor;
      ctx.fill();
      ctx.stroke();

      // Angry pointing arm
      if (expr === "angry_point" || expr === "fuming") {
        ctx.beginPath();
        ctx.moveTo(cx + 55, cy + 16);
        ctx.lineTo(cx + 132, cy - 6);
        ctx.lineTo(cx + 132, cy + 20);
        ctx.lineTo(cx + 55, cy + 44);
        ctx.closePath();
        ctx.fillStyle = jacket;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();

        // Pointing finger
        ctx.beginPath();
        ctx.arc(cx + 142, cy + 5, 13, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.stroke();
      }

      // Head
      const headY = cy - 78;
      ctx.beginPath();
      ctx.arc(cx, headY, 64, 0, Math.PI * 2);
      ctx.fillStyle = expr === "fuming" ? "#F79B84" : PAL.skin;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = PAL.outline;
      ctx.stroke();

      // Hair
      ctx.beginPath();
      ctx.arc(cx, headY - 12, 62, Math.PI * 1.05, Math.PI * 1.95);
      ctx.lineTo(cx + 38, headY - 40);
      ctx.lineTo(cx, headY - 52);
      ctx.lineTo(cx - 38, headY - 40);
      ctx.closePath();
      ctx.fillStyle = hairColor;
      ctx.fill();
      ctx.stroke();

      // Eyes & Glasses
      const eyeY = headY - 6;
      if (blink) {
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 34, eyeY); ctx.lineTo(cx - 12, eyeY);
        ctx.moveTo(cx + 12, eyeY); ctx.lineTo(cx + 34, eyeY);
        ctx.stroke();
      } else {
        const eyeR = expr === "shock" ? 13 : 9;
        [-22, 22].forEach((ox) => {
          ctx.beginPath();
          ctx.arc(cx + ox, eyeY, eyeR, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = PAL.outline;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cx + ox + 2, eyeY, expr === "shock" ? 3.5 : 4.5, 0, Math.PI * 2);
          ctx.fillStyle = PAL.outline;
          ctx.fill();
        });
      }

      // Boss / Dad glasses
      if (charType === "boss" || charType === "dad") {
        const rimCol = charType === "dad" ? PAL.outline : "#FFFFFF";
        this._roundRect(ctx, cx - 42, eyeY - 15, 36, 28, 7, "transparent", rimCol, 4.5);
        this._roundRect(ctx, cx + 6, eyeY - 15, 36, 28, 7, "transparent", rimCol, 4.5);
        ctx.strokeStyle = rimCol;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cx - 6, eyeY - 2); ctx.lineTo(cx + 6, eyeY - 2); ctx.stroke();
      }

      // Blue Book for Dad
      if (charType === "dad") {
        this._roundRect(ctx, cx - 34, cy + 48, 86, 62, 8, "#1E88E5", PAL.outline, 4);
        this._roundRect(ctx, cx - 22, cy + 56, 62, 12, 4, "#90CAF9", null, 0);
      }

      // Eyebrows
      ctx.lineWidth = 5;
      ctx.strokeStyle = PAL.outline;
      ctx.beginPath();
      if (expr === "angry_point" || expr === "fuming") {
        ctx.moveTo(cx - 38, eyeY - 24); ctx.lineTo(cx - 10, eyeY - 14);
        ctx.moveTo(cx + 38, eyeY - 24); ctx.lineTo(cx + 10, eyeY - 14);
      } else if (expr === "shock") {
        ctx.moveTo(cx - 38, eyeY - 26); ctx.lineTo(cx - 10, eyeY - 29);
        ctx.moveTo(cx + 38, eyeY - 26); ctx.lineTo(cx + 10, eyeY - 29);
      } else {
        ctx.moveTo(cx - 36, eyeY - 20); ctx.lineTo(cx - 10, eyeY - 20);
        ctx.moveTo(cx + 36, eyeY - 20); ctx.lineTo(cx + 10, eyeY - 20);
      }
      ctx.stroke();

      // Mouth
      const mouthY = headY + 26;
      ctx.beginPath();
      if (expr === "angry_point" || expr === "fuming") {
        ctx.ellipse(cx, mouthY + 4, 18, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#801822";
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.stroke();
      } else if (expr === "shock") {
        ctx.ellipse(cx, mouthY + 6, 14, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#801822";
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.stroke();
      } else {
        ctx.moveTo(cx - 16, mouthY);
        ctx.lineTo(cx + 16, mouthY);
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Fuming steam puffs
      if (expr === "fuming") {
        for (let i = 0; i < 3; i++) {
          const prog = ((t * 1.4 + i * 0.33) % 1);
          const sy = headY - 68 - prog * 68;
          const sx = cx + (i % 2 === 0 ? -34 : 34) + Math.sin(prog * 8) * 8;
          ctx.globalAlpha = 1 - prog;
          ctx.beginPath();
          ctx.arc(sx, sy, 12 + prog * 12, 0, Math.PI * 2);
          ctx.fillStyle = PAL.ragePink;
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = PAL.outline;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    _drawRightCharacter(ctx, t, blink) {
      const charType = this.state.right_char;
      const expr = this.state.right_expr;

      let shirt = PAL.yellowShirt;
      let tie = PAL.pinkTie;
      let isWife = charType === "wife" || charType === "mom";
      if (charType === "mom") {
        shirt = "#F48FB1";
      } else if (isWife) {
        shirt = PAL.wifeOrange;
      } else if (charType === "son") {
        shirt = "#66BB6A";
        tie = "#FFD54F";
      } else if (charType === "coworker") {
        shirt = "#E3F2FD";
        tie = PAL.chartBlue;
      }

      ctx.save();

      // Special Pose: Sleep in Sink
      if (expr === "sleep_sink") {
        const bob = Math.sin(t * 2.4) * 3;
        const sx = 372;
        const sy = 548 + bob;
        // Leaning torso
        this._roundRect(ctx, sx - 44, sy + 18, 118, 120, 28, shirt, PAL.outline, 5);
        // Head dipped into sink
        ctx.beginPath();
        ctx.arc(sx, sy - 6, 54, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        // Hair on top
        ctx.beginPath();
        ctx.arc(sx + 6, sy - 16, 52, Math.PI * 0.9, Math.PI * 2.05);
        ctx.fillStyle = "#1F2937";
        ctx.fill();
        ctx.stroke();
        // Water droplets splashing off head
        for (let i = 0; i < 4; i++) {
          const p = (t * 2 + i * 0.25) % 1;
          ctx.beginPath();
          ctx.arc(sx - 40 + i * 24, sy - 58 + p * 38, 5, 0, Math.PI * 2);
          ctx.fillStyle = PAL.water;
          ctx.fill();
        }
        ctx.restore();
        return;
      }

      // Special Pose: Sleep on Desk
      if (expr === "sleep_desk") {
        const bob = Math.sin(t * 2.1) * 4;
        const dx = 365;
        const dy = 634 + bob;
        this._roundRect(ctx, dx - 72, dy - 16, 152, 74, 24, shirt, PAL.outline, 5);
        ctx.beginPath();
        ctx.arc(dx - 24, dy - 22, 54, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        // Closed peaceful eyes
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(dx - 40, dy - 16, 10, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // Special Pose: Sofa Chill
      if (expr === "sofa_chill") {
        const bob = Math.sin(t * 2.8) * 2.5;
        const fx = 376;
        const fy = 492 + bob;
        // Reclining body
        this._roundRect(ctx, fx - 54, fy - 12, 118, 66, 24, isWife ? PAL.wifePink : shirt, PAL.outline, 4.5);
        // Head
        ctx.beginPath();
        ctx.arc(fx - 64, fy - 24, 48, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        // Hair
        ctx.beginPath();
        ctx.arc(fx - 68, fy - 34, 48, Math.PI * 0.9, Math.PI * 2.05);
        ctx.fillStyle = "#212121";
        ctx.fill();
        ctx.stroke();
        // Chill eyes + smirk
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(fx - 86, fy - 24); ctx.lineTo(fx - 70, fy - 24);
        ctx.moveTo(fx - 58, fy - 24); ctx.lineTo(fx - 42, fy - 24);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fx - 62, fy - 4, 12, 0.1, Math.PI - 0.3);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // Standard standing / sitting characters (holding_laugh, idea_hand, turn_laugh)
      const bob = Math.sin(t * 3.8 + 1) * 3;
      const trem = expr === "holding_laugh" ? Math.sin(t * 34) * 2 : 0;
      const cx = 388 + trem;
      const cy = 540 + bob;

      // Body
      this._roundRect(ctx, cx - 64, cy - 8, 128, 168, 32, shirt, PAL.outline, 5);
      if (isWife) {
        // Pink apron / overalls
        this._roundRect(ctx, cx - 44, cy + 16, 88, 144, 14, PAL.wifePink, PAL.outline, 4);
      } else {
        // Tie
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 4);
        ctx.lineTo(cx + 8, cy - 4);
        ctx.lineTo(cx + 11, cy + 62);
        ctx.lineTo(cx, cy + 78);
        ctx.lineTo(cx - 11, cy + 62);
        ctx.closePath();
        ctx.fillStyle = tie;
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
      }

      // Raised Idea Hand + Lightbulb
      if (expr === "idea_hand") {
        this._roundRect(ctx, cx - 84, cy - 72, 24, 88, 12, shirt, PAL.outline, 4);
        ctx.beginPath();
        ctx.arc(cx - 72, cy - 82, 14, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.stroke();

        // Glowing Lightbulb
        const glow = 0.6 + Math.sin(t * 8) * 0.3;
        ctx.save();
        ctx.globalAlpha = glow;
        ctx.beginPath();
        ctx.arc(cx - 72, cy - 134, 24, 0, Math.PI * 2);
        ctx.fillStyle = "#FFF59D";
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(cx - 72, cy - 134, 15, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD54F";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
      }

      // Head
      const headY = cy - 72;
      ctx.beginPath();
      ctx.arc(cx, headY, 60, 0, Math.PI * 2);
      ctx.fillStyle = PAL.skin;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = PAL.outline;
      ctx.stroke();

      // Hair
      ctx.beginPath();
      if (isWife) {
        ctx.arc(cx, headY - 8, 63, Math.PI * 0.88, Math.PI * 2.12);
      } else {
        ctx.arc(cx, headY - 14, 60, Math.PI * 1.0, Math.PI * 2.0);
        ctx.lineTo(cx + 28, headY - 46);
        ctx.lineTo(cx, headY - 62);
        ctx.lineTo(cx - 28, headY - 46);
        ctx.closePath();
      }
      ctx.fillStyle = "#212121";
      ctx.fill();
      ctx.stroke();

      // Blush if holding laugh or turn_laugh
      if (expr === "holding_laugh" || expr === "turn_laugh") {
        ctx.fillStyle = "rgba(229, 115, 115, 0.55)";
        ctx.beginPath(); ctx.ellipse(cx - 30, headY + 12, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 30, headY + 12, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Eyes
      const eyeY = headY - 6;
      if (expr === "turn_laugh") {
        ctx.lineWidth = 4;
        ctx.strokeStyle = PAL.outline;
        ctx.beginPath();
        ctx.arc(cx - 18, eyeY, 10, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 20, eyeY, 10, Math.PI, 0);
        ctx.stroke();
      } else if (blink) {
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 32, eyeY); ctx.lineTo(cx - 10, eyeY);
        ctx.moveTo(cx + 10, eyeY); ctx.lineTo(cx + 32, eyeY);
        ctx.stroke();
      } else {
        [-20, 20].forEach((ox) => {
          ctx.beginPath();
          ctx.arc(cx + ox, eyeY, 9, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = PAL.outline;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cx + ox - 2, eyeY, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = PAL.outline;
          ctx.fill();
        });
      }

      // Mouth
      const mouthY = headY + 24;
      ctx.lineWidth = 4;
      ctx.strokeStyle = PAL.outline;
      ctx.beginPath();
      if (expr === "holding_laugh") {
        // Wavy clenched mouth
        ctx.moveTo(cx - 18, mouthY);
        ctx.quadraticCurveTo(cx - 8, mouthY - 6, cx, mouthY);
        ctx.quadraticCurveTo(cx + 8, mouthY + 6, cx + 18, mouthY);
        ctx.stroke();
        // Sweat drop
        ctx.beginPath();
        ctx.arc(cx + 46, headY - 18, 7, 0, Math.PI * 2);
        ctx.fillStyle = PAL.sweat;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (expr === "turn_laugh") {
        ctx.arc(cx + 4, mouthY - 2, 16, 0, Math.PI);
        ctx.closePath();
        ctx.fillStyle = "#EC407A";
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.arc(cx, mouthY - 4, 14, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ------------------------------------------------------------------
    // Popups & Golden Subtitles
    // ------------------------------------------------------------------
    _drawPopup(ctx, t) {
      const text = (this.state.popup_text || "").trim();
      const style = this.state.popup_style;

      if (style === "zzz") {
        for (let i = 0; i < 3; i++) {
          const p = (t * 0.7 + i * 0.33) % 1;
          const zx = 360 + i * 26 + Math.sin(p * 6) * 8;
          const zy = 460 - p * 120;
          ctx.save();
          ctx.globalAlpha = 1 - p * 0.7;
          this._drawWrappedStrokeText(ctx, i % 2 === 0 ? "Z" : "z", zx, zy, 80, 30, `800 ${26 + i * 6}px Kanit, sans-serif`, "#80DEEA", PAL.outline, 5);
          ctx.restore();
        }
        if (!text) return;
      }

      if (style === "banner_1hr") {
        this._roundRect(ctx, 74, 188, 392, 62, 16, "#1E293B", PAL.subGold, 4);
        this._drawWrappedStrokeText(
          ctx,
          text || "⏳ 1 ชั่วโมงผ่านไป...",
          270,
          219,
          360,
          26,
          "700 24px Kanit, sans-serif",
          PAL.subGold,
          PAL.outline,
          4
        );
        return;
      }

      if (style === "clock_17") {
        const ring = Math.sin(t * 24) * 4;
        ctx.save();
        ctx.translate(270 + ring, 224);
        ctx.beginPath();
        ctx.arc(0, 0, 44, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = PAL.redAlert;
        ctx.stroke();
        this._drawWrappedStrokeText(ctx, "17:00", 0, 2, 76, 20, "800 22px Kanit, sans-serif", PAL.redAlert, null, 0);
        ctx.restore();
        if (!text) return;
      }

      if (!text) return;

      if (style === "shout") {
        const cx = 270;
        const cy = 264;
        const scale = 1 + Math.sin(t * 14) * 0.04;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.beginPath();
        const spikes = 16;
        for (let i = 0; i < spikes * 2; i++) {
          const angle = (i * Math.PI) / spikes;
          const rx = i % 2 === 0 ? 154 : 122;
          const ry = i % 2 === 0 ? 64 : 46;
          const px = Math.cos(angle) * rx;
          const py = Math.sin(angle) * ry;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = "#FFF59D";
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        this._drawWrappedStrokeText(ctx, text, 0, 0, 230, 26, "800 25px Kanit, sans-serif", PAL.redAlert, "#FFFFFF", 4);
        ctx.restore();
      } else {
        // Classic comic speech bubble
        this._roundRect(ctx, 118, 228, 304, 72, 24, "#FFFFFF", PAL.outline, 4.5);
        ctx.beginPath();
        ctx.moveTo(255, 300);
        ctx.lineTo(276, 326);
        ctx.lineTo(292, 300);
        ctx.closePath();
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        this._drawWrappedStrokeText(ctx, text, 270, 264, 280, 24, "700 20px Prompt, sans-serif", PAL.outline, null, 0);
      }
    }

    _drawSubtitles(ctx) {
      const sub = (this.state.subtitle_text || "").trim();
      if (!sub) return;
      this._roundRect(ctx, 26, 774, CANVAS_W - 52, 134, 18, "rgba(7, 10, 19, 0.62)", "rgba(255,213,79,0.28)", 2);
      this._drawWrappedStrokeText(
        ctx,
        sub,
        CANVAS_W / 2,
        842,
        CANVAS_W - 84,
        38,
        "800 28px Kanit, Prompt, sans-serif",
        PAL.subGold,
        PAL.subStroke,
        7
      );
    }

    _drawFamilySofaCast(ctx, t, blink) {
      const dadExpr = this.state.left_expr;
      const momExpr = this.state.right_expr;

      // 1) Dad sitting on right side of sofa holding blue book
      {
        const bob = Math.sin(t * 2.5) * 2;
        const shakeX = dadExpr === "fuming" ? Math.sin(t * 34) * 2.5 : 0;
        const dx = 408 + shakeX;
        const dy = 485 + bob;
        ctx.save();
        // Body
        this._roundRect(ctx, dx - 46, dy - 6, 92, 114, 24, "#42A5F5", PAL.outline, 4.5);
        // Blue book
        this._roundRect(ctx, dx - 54, dy + 32, 76, 56, 7, "#1565C0", PAL.outline, 4);
        this._roundRect(ctx, dx - 42, dy + 40, 52, 10, 3, "#90CAF9", null, 0);
        // Head
        const hy = dy - 56;
        ctx.beginPath();
        ctx.arc(dx, hy, 48, 0, Math.PI * 2);
        ctx.fillStyle = dadExpr === "fuming" ? "#F79B84" : PAL.skin;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        // Hair
        ctx.beginPath();
        ctx.arc(dx, hy - 10, 48, Math.PI * 0.98, Math.PI * 2.02);
        ctx.fillStyle = "#263238";
        ctx.fill();
        ctx.stroke();
        // Glasses + Eyes
        const ey = hy - 4;
        if (blink && dadExpr !== "shock") {
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(dx - 26, ey); ctx.lineTo(dx - 10, ey);
          ctx.moveTo(dx + 10, ey); ctx.lineTo(dx + 26, ey);
          ctx.stroke();
        } else {
          [-17, 17].forEach((ox) => {
            ctx.beginPath();
            ctx.arc(dx + ox, ey, dadExpr === "shock" ? 10 : 7.5, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = PAL.outline;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(dx + ox - 1, ey, dadExpr === "shock" ? 2.8 : 3.8, 0, Math.PI * 2);
            ctx.fillStyle = PAL.outline;
            ctx.fill();
          });
        }
        this._roundRect(ctx, dx - 31, ey - 12, 28, 22, 6, "transparent", PAL.outline, 3.5);
        this._roundRect(ctx, dx + 3, ey - 12, 28, 22, 6, "transparent", PAL.outline, 3.5);
        // Mouth
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        if (dadExpr === "shock") {
          ctx.ellipse(dx, hy + 24, 11, 13, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#801822";
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.moveTo(dx - 12, hy + 22);
          ctx.lineTo(dx + 12, hy + 22);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2) Mom sitting center of sofa knitting pink yarn
      {
        const bob = Math.sin(t * 2.8 + 0.8) * 2;
        const mx = 268;
        const my = 492 + bob;
        ctx.save();
        this._roundRect(ctx, mx - 44, my - 4, 88, 110, 24, "#EC407A", PAL.outline, 4.5);
        // Pink yarn ball & needles
        ctx.beginPath();
        ctx.arc(mx - 10, my + 48, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#F48FB1";
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(mx - 36, my + 30); ctx.lineTo(mx + 14, my + 60);
        ctx.moveTo(mx + 18, my + 30); ctx.lineTo(mx - 28, my + 60);
        ctx.stroke();

        const hy = my - 52;
        ctx.beginPath();
        ctx.arc(mx, hy, 45, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.stroke();
        // Hair bun + bangs
        ctx.beginPath();
        ctx.arc(mx, hy - 44, 18, 0, Math.PI * 2);
        ctx.fillStyle = "#212121";
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mx, hy - 8, 45, Math.PI * 0.92, Math.PI * 2.08);
        ctx.fill();
        ctx.stroke();

        // Smug / happy eyes
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        if (momExpr === "turn_laugh") {
          ctx.arc(mx - 15, hy - 4, 8, Math.PI, 0);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(mx + 15, hy - 4, 8, Math.PI, 0);
          ctx.stroke();
        } else {
          ctx.moveTo(mx - 22, hy - 6); ctx.lineTo(mx - 8, hy - 6);
          ctx.moveTo(mx + 8, hy - 6); ctx.lineTo(mx + 22, hy - 6);
          ctx.stroke();
        }
        // Smile
        ctx.beginPath();
        ctx.arc(mx, hy + 12, 12, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }

      // 3) Son on left leaning excitedly onto sofa arm
      {
        const bob = Math.sin(t * 4.5) * 4;
        const sx = 112;
        const sy = 552 + bob;
        ctx.save();
        this._roundRect(ctx, sx - 38, sy - 4, 76, 98, 22, "#66BB6A", PAL.outline, 4.5);
        // Raised excited arm
        this._roundRect(ctx, sx + 26, sy - 42, 18, 56, 9, "#66BB6A", PAL.outline, 4);
        const hy = sy - 46;
        ctx.beginPath();
        ctx.arc(sx, hy, 40, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        // Buzzcut hair
        ctx.beginPath();
        ctx.arc(sx, hy - 8, 40, Math.PI * 1.02, Math.PI * 1.98);
        ctx.fillStyle = "#1F2937";
        ctx.fill();
        ctx.stroke();
        // Big bright eyes
        [-14, 14].forEach((ox) => {
          ctx.beginPath();
          ctx.arc(sx + ox, hy - 4, 7, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sx + ox + 1.5, hy - 4, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = PAL.outline;
          ctx.fill();
        });
        // Happy talking mouth
        ctx.beginPath();
        ctx.arc(sx + 2, hy + 12, 12, 0, Math.PI);
        ctx.closePath();
        ctx.fillStyle = "#EC407A";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
    }

    _drawBarCounterCast(ctx, t, blink) {
      const expr = this.state.left_expr;
      const isCringe = this.state.board_mode === "bar_counter_purple" || expr === "shock" || expr === "fuming";
      const isGold = this.state.board_mode === "bar_counter_blue";

      // 1) Left Friend (Regent Pompadour Hair, Orange Polo)
      {
        const bob = Math.sin(t * 3.1) * 2.5;
        const fx = 104;
        const fy = 524 + bob;
        ctx.save();
        this._roundRect(ctx, fx - 44, fy - 4, 88, 118, 22, "#FB8C00", PAL.outline, 4.5);
        const hy = fy - 54;
        ctx.beginPath();
        ctx.arc(fx, hy, 44, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();

        // Regent Pompadour Hair
        ctx.beginPath();
        ctx.moveTo(fx - 42, hy - 12);
        ctx.quadraticCurveTo(fx - 38, hy - 70, fx + 24, hy - 66);
        ctx.quadraticCurveTo(fx + 56, hy - 56, fx + 44, hy - 22);
        ctx.lineTo(fx - 32, hy - 18);
        ctx.closePath();
        ctx.fillStyle = "#212121";
        ctx.fill();
        ctx.stroke();

        // Eyes & Mouth
        const ey = hy - 4;
        ctx.lineWidth = 3.5;
        if (isCringe) {
          // >< cringe eyes
          ctx.beginPath();
          ctx.moveTo(fx - 22, ey - 6); ctx.lineTo(fx - 10, ey); ctx.lineTo(fx - 22, ey + 6);
          ctx.moveTo(fx + 22, ey - 6); ctx.lineTo(fx + 10, ey); ctx.lineTo(fx + 22, ey + 6);
          ctx.stroke();
        } else if (blink) {
          ctx.beginPath();
          ctx.moveTo(fx - 24, ey); ctx.lineTo(fx - 8, ey);
          ctx.moveTo(fx + 8, ey); ctx.lineTo(fx + 24, ey);
          ctx.stroke();
        } else {
          [-14, 14].forEach((ox) => {
            ctx.beginPath();
            ctx.arc(fx + ox, ey, 6.5, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(fx + ox + 1.5, ey, 3.2, 0, Math.PI * 2);
            ctx.fillStyle = PAL.outline;
            ctx.fill();
          });
        }
        ctx.beginPath();
        ctx.arc(fx, hy + 18, 10, isCringe ? Math.PI : 0.1 * Math.PI, isCringe ? 0 : 0.9 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }

      // 2) Center Runner (Headband + Teal/Blue Sport Tee)
      {
        const bob = Math.sin(t * 3.8 + 0.7) * 3;
        const rx = 270;
        const ry = 516 + bob;
        ctx.save();
        this._roundRect(ctx, rx - 48, ry - 4, 96, 126, 24, "#26A69A", PAL.outline, 4.5);
        // White collar stripe
        this._roundRect(ctx, rx - 18, ry - 4, 36, 14, 6, "#FFFFFF", PAL.outline, 3);

        const hy = ry - 56;
        ctx.beginPath();
        ctx.arc(rx, hy, 46, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();

        // Spiky hair + Red Sport Headband
        ctx.beginPath();
        ctx.arc(rx, hy - 10, 46, Math.PI * 0.96, Math.PI * 2.04);
        ctx.fillStyle = "#1F2937";
        ctx.fill();
        ctx.stroke();
        this._roundRect(ctx, rx - 45, hy - 28, 90, 14, 6, "#EF5350", PAL.outline, 3.5);

        // Eyes
        const ey = hy - 2;
        if (blink) {
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(rx - 24, ey); ctx.lineTo(rx - 8, ey);
          ctx.moveTo(rx + 8, ey); ctx.lineTo(rx + 24, ey);
          ctx.stroke();
        } else {
          [-16, 16].forEach((ox) => {
            ctx.beginPath();
            ctx.arc(rx + ox, ey, 7, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(rx + ox, ey, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = PAL.outline;
            ctx.fill();
          });
        }
        // Sheepish / Proud Smile + Blush
        if (isCringe) {
          ctx.fillStyle = "rgba(229, 115, 115, 0.5)";
          ctx.beginPath(); ctx.ellipse(rx - 26, hy + 12, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(rx + 26, hy + 12, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(rx, hy + 14, 14, 0.05 * Math.PI, 0.95 * Math.PI);
        ctx.fillStyle = "#EC407A";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // 3) Right Friend (Plaid Shirt + Tie)
      {
        const bob = Math.sin(t * 3.3 + 1.4) * 2.5;
        const px = 436;
        const py = 524 + bob;
        ctx.save();
        this._roundRect(ctx, px - 44, py - 4, 88, 118, 22, "#42A5F5", PAL.outline, 4.5);
        // Plaid grid lines on shirt
        ctx.strokeStyle = "rgba(21, 101, 192, 0.45)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px - 20, py); ctx.lineTo(px - 20, py + 100);
        ctx.moveTo(px + 20, py); ctx.lineTo(px + 20, py + 100);
        ctx.moveTo(px - 40, py + 32); ctx.lineTo(px + 40, py + 32);
        ctx.moveTo(px - 40, py + 66); ctx.lineTo(px + 40, py + 66);
        ctx.stroke();
        // Tie
        ctx.beginPath();
        ctx.moveTo(px - 7, py); ctx.lineTo(px + 7, py);
        ctx.lineTo(px + 9, py + 54); ctx.lineTo(px, py + 68); ctx.lineTo(px - 9, py + 54);
        ctx.closePath();
        ctx.fillStyle = "#D32F2F";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();

        const hy = py - 54;
        ctx.beginPath();
        ctx.arc(px, hy, 44, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, hy - 12, 44, Math.PI * 0.98, Math.PI * 2.02);
        ctx.fillStyle = "#37474F";
        ctx.fill();
        ctx.stroke();

        const ey = hy - 4;
        ctx.lineWidth = 3.5;
        if (isCringe) {
          ctx.beginPath();
          ctx.moveTo(px - 22, ey - 6); ctx.lineTo(px - 10, ey); ctx.lineTo(px - 22, ey + 6);
          ctx.moveTo(px + 22, ey - 6); ctx.lineTo(px + 10, ey); ctx.lineTo(px + 22, ey + 6);
          ctx.stroke();
        } else if (isGold) {
          // Starry / wide excited eyes
          [-14, 14].forEach((ox) => {
            ctx.beginPath();
            ctx.arc(px + ox, ey, 8, 0, Math.PI * 2);
            ctx.fillStyle = "#FFF59D";
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(px + ox - 1, ey, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = PAL.outline;
            ctx.fill();
          });
        } else {
          [-14, 14].forEach((ox) => {
            ctx.beginPath();
            ctx.arc(px + ox, ey, 6.5, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(px + ox - 1.5, ey, 3.2, 0, Math.PI * 2);
            ctx.fillStyle = PAL.outline;
            ctx.fill();
          });
        }
        ctx.beginPath();
        ctx.arc(px, hy + 18, 10, isCringe ? Math.PI : 0.1 * Math.PI, isCringe ? 0 : 0.9 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }

      // 4) Foreground Bar Counter + Foamy Mug + Soda Glasses with Straws
      this._roundRect(ctx, -8, 616, CANVAS_W + 16, 26, 8, "#A1887F", PAL.outline, 4.5);
      this._roundRect(ctx, -8, 642, CANVAS_W + 16, 120, 0, "#6D4C41", PAL.outline, 4.5);

      // Foamy Mug (Left)
      this._roundRect(ctx, 74, 560, 44, 58, 8, "#FFB300", PAL.outline, 3.5);
      this._roundRect(ctx, 118, 574, 16, 28, 7, "transparent", PAL.outline, 3.5);
      // Overflowing Foam
      [82, 96, 110].forEach((fx, fi) => {
        ctx.beginPath();
        ctx.arc(fx, 558 - (fi % 2) * 4, 11, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
      });

      // Soda Glasses with Straws (Center & Right)
      [
        [252, "#4FC3F7", "#EF5350"],
        [414, "#81C784", "#FFD54F"],
      ].forEach(([gx, liqCol, strawCol]) => {
        ctx.save();
        ctx.strokeStyle = strawCol;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(gx + 22, 578);
        ctx.lineTo(gx + 34, 536);
        ctx.stroke();
        this._roundRect(ctx, gx, 564, 34, 54, 7, liqCol, PAL.outline, 3.5);
        // Fizz bubbles
        const fy = 594 - ((t * 36) % 24);
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath(); ctx.arc(gx + 12, fy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + 22, fy + 8, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    }

    _drawOfficeIdolCast(ctx, t, blink) {
      const mode = this.state.board_mode;
      const bossVisible = mode === "office_idol_purple" || this.state.left_expr !== "normal";
      const bossAngry = this.state.left_expr === "fuming" || this.state.left_expr === "angry_point";

      // 1) Boss with glasses standing behind the two juniors (back right)
      if (bossVisible) {
        const bx = 434;
        const by = 438 + Math.sin(t * 2.2) * 2;
        ctx.save();
        // Dark suit
        this._roundRect(ctx, bx - 44, by - 4, 88, 134, 22, PAL.bossSuit, PAL.outline, 4.5);
        // White shirt & red tie
        ctx.beginPath();
        ctx.moveTo(bx - 16, by - 2); ctx.lineTo(bx + 16, by - 2); ctx.lineTo(bx, by + 44);
        ctx.closePath();
        ctx.fillStyle = PAL.shirtWhite;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();

        // Boss head
        const hy = by - 50;
        ctx.beginPath();
        ctx.arc(bx, hy, 42, 0, Math.PI * 2);
        ctx.fillStyle = bossAngry ? "#F79B84" : PAL.skin;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.stroke();
        // Hair
        ctx.beginPath();
        ctx.arc(bx, hy - 10, 42, Math.PI * 0.98, Math.PI * 2.02);
        ctx.fillStyle = "#263238";
        ctx.fill();
        ctx.stroke();
        // White-rimmed glare glasses
        const ey = hy - 4;
        this._roundRect(ctx, bx - 30, ey - 10, 26, 20, 5, "rgba(255,255,255,0.88)", PAL.outline, 3.5);
        this._roundRect(ctx, bx + 4, ey - 10, 26, 20, 5, "rgba(255,255,255,0.88)", PAL.outline, 3.5);
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(bx - 4, ey); ctx.lineTo(bx + 4, ey); ctx.stroke();
        // Stern brows
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx - 28, ey - 16); ctx.lineTo(bx - 6, ey - 10);
        ctx.moveTo(bx + 28, ey - 16); ctx.lineTo(bx + 6, ey - 10);
        ctx.stroke();

        // Steam puffs when furious
        if (bossAngry) {
          for (let i = 0; i < 2; i++) {
            const p = (t * 1.5 + i * 0.5) % 1;
            ctx.globalAlpha = 1 - p;
            ctx.beginPath();
            ctx.arc(bx + (i === 0 ? -24 : 24), hy - 48 - p * 40, 10 + p * 8, 0, Math.PI * 2);
            ctx.fillStyle = PAL.ragePink;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = PAL.outline;
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }

      // 2) Dancing / Boasting Senior (Left)
      {
        const sway = Math.sin(t * 6.5) * 8;
        const bob = Math.abs(Math.sin(t * 6.5)) * -6;
        const sx = 122 + sway;
        const sy = 534 + bob;
        ctx.save();
        // Outstretched dancing arms
        const armWave = Math.sin(t * 8) * 16;
        this._roundRect(ctx, sx - 82, sy - 18 + armWave, 42, 22, 10, "#FFF176", PAL.outline, 4);
        this._roundRect(ctx, sx + 40, sy - 24 - armWave, 44, 22, 10, "#FFF176", PAL.outline, 4);

        // Body (Yellow shirt + pink tie)
        this._roundRect(ctx, sx - 48, sy - 8, 96, 134, 26, PAL.yellowShirt, PAL.outline, 4.5);
        ctx.beginPath();
        ctx.moveTo(sx - 7, sy - 4); ctx.lineTo(sx + 7, sy - 4);
        ctx.lineTo(sx + 10, sy + 54); ctx.lineTo(sx, sy + 68); ctx.lineTo(sx - 10, sy + 54);
        ctx.closePath();
        ctx.fillStyle = PAL.pinkTie;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();

        // Head
        const hy = sy - 58;
        ctx.beginPath();
        ctx.arc(sx, hy, 48, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.stroke();
        // Slick hair
        ctx.beginPath();
        ctx.arc(sx, hy - 12, 48, Math.PI * 0.96, Math.PI * 2.04);
        ctx.fillStyle = "#212121";
        ctx.fill();
        ctx.stroke();

        // Happy / dancing eyes
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sx - 16, hy - 4, 8, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx + 16, hy - 4, 8, Math.PI, 0);
        ctx.stroke();
        // Big singing/boasting smile
        ctx.beginPath();
        ctx.arc(sx, hy + 12, 16, 0, Math.PI);
        ctx.closePath();
        ctx.fillStyle = "#EC407A";
        ctx.fill();
        ctx.stroke();

        // Floating music notes ♪ ♫
        const noteY = hy - 66 - ((t * 38) % 34);
        this._drawWrappedStrokeText(ctx, "♪ ♫", sx + 48, noteY, 70, 22, "700 22px Kanit, sans-serif", "#FFD54F", PAL.outline, 3);
        ctx.restore();
      }

      // 3) Two Juniors (Tall Junior & Short Junior)
      [
        { x: 318, y: 536, h: 124, shirt: "#81C784", tie: "#1565C0", r: 42 },
        { x: 424, y: 562, h: 102, shirt: "#4FC3F7", tie: "#D32F2F", r: 38 },
      ].forEach((jr, idx) => {
        const jBob = Math.sin(t * 3 + idx) * 2;
        const jx = jr.x;
        const jy = jr.y + jBob;
        ctx.save();
        this._roundRect(ctx, jx - 38, jy - 4, 76, jr.h, 22, jr.shirt, PAL.outline, 4.5);
        const hy = jy - 46;
        ctx.beginPath();
        ctx.arc(jx, hy, jr.r, 0, Math.PI * 2);
        ctx.fillStyle = PAL.skin;
        ctx.fill();
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = PAL.outline;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(jx, hy - 10, jr.r, Math.PI * 0.98, Math.PI * 2.02);
        ctx.fillStyle = "#1F2937";
        ctx.fill();
        ctx.stroke();

        // Eyes (sweating wide eyes when boss behind, starry when warm)
        const ey = hy - 4;
        [-13, 13].forEach((ox) => {
          ctx.beginPath();
          ctx.arc(jx + ox, ey, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = mode === "office_idol_warm" ? "#FFF59D" : "#FFFFFF";
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(jx + ox + (bossVisible ? 2 : 0), ey, 3, 0, Math.PI * 2);
          ctx.fillStyle = PAL.outline;
          ctx.fill();
        });

        // Sweat drop if Boss is behind
        if (bossVisible) {
          ctx.beginPath();
          ctx.arc(jx - jr.r + 4, hy - 14, 6, 0, Math.PI * 2);
          ctx.fillStyle = PAL.sweat;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    renderFrame() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const t = this.timeSec;
      const jitter = Number(this.state.jitter) || 0;
      const blink = (t % 3.2) > 3.06;

      ctx.save();
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      if (jitter > 0 && this.isPlaying) {
        const jx = (Math.random() - 0.5) * jitter * 1.4;
        const jy = (Math.random() - 0.5) * jitter * 1.4;
        ctx.translate(jx, jy);
      }

      this._drawBackground(ctx, t);
      if (this.state.board_mode === "family_sofa_purple" || this.state.board_mode === "family_sofa_blue") {
        this._drawFamilySofaCast(ctx, t, blink);
      } else if (
        this.state.board_mode === "bar_counter_warm" ||
        this.state.board_mode === "bar_counter_blue" ||
        this.state.board_mode === "bar_counter_purple"
      ) {
        this._drawBarCounterCast(ctx, t, blink);
      } else if (
        this.state.board_mode === "office_idol_warm" ||
        this.state.board_mode === "office_idol_blue" ||
        this.state.board_mode === "office_idol_purple"
      ) {
        this._drawOfficeIdolCast(ctx, t, blink);
      } else {
        this._drawLeftCharacter(ctx, t, blink);
        this._drawRightCharacter(ctx, t, blink);
      }
      this._drawPopup(ctx, t);
      ctx.restore();

      // Keep subtitle steady above camera jitter
      this._drawSubtitles(ctx);
    }

    // ------------------------------------------------------------------
    // Web Audio API Synthesized SFX + Web Speech API Thai Voiceover
    // ------------------------------------------------------------------
    _getAudioCtx() {
      if (!this.audioCtx) {
        const Ctor = global.AudioContext || global.webkitAudioContext;
        if (Ctor) this.audioCtx = new Ctor();
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    }

    playSynthesizedSfx(sfxType) {
      const ac = this._getAudioCtx();
      if (!ac) return;
      const now = ac.currentTime;

      if (sfxType === "rimshot") {
        // Ba-Dum-Tss!
        const kick = (time, freq) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, time);
          osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
          gain.gain.setValueAtTime(0.45, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.14);
          osc.connect(gain).connect(ac.destination);
          osc.start(time);
          osc.stop(time + 0.15);
        };
        kick(now, 160);
        kick(now + 0.16, 130);

        // Hi-hat crash ("Tss")
        const bufSize = ac.sampleRate * 0.4;
        const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ac.createBufferSource();
        noise.buffer = buf;
        const filter = ac.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 4200;
        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.28, now + 0.34);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.74);
        noise.connect(filter).connect(gain).connect(ac.destination);
        noise.start(now + 0.34);
      } else if (sfxType === "boing") {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.36);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
        osc.connect(gain).connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.44);
      } else if (sfxType === "pop_alert") {
        [660, 990].forEach((freq, idx) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.11);
          gain.gain.setValueAtTime(0.25, now + idx * 0.11);
          gain.gain.exponentialRampToValueAtTime(0.008, now + idx * 0.11 + 0.18);
          osc.connect(gain).connect(ac.destination);
          osc.start(now + idx * 0.11);
          osc.stop(now + idx * 0.11 + 0.2);
        });
      } else if (sfxType === "water_splash") {
        const bufSize = ac.sampleRate * 0.65;
        const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ac.createBufferSource();
        noise.buffer = buf;
        const filter = ac.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.linearRampToValueAtTime(650, now + 0.6);
        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
        noise.connect(filter).connect(gain).connect(ac.destination);
        noise.start(now);
      } else {
        // stomach_growl
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(68, now + 0.45);
        const filter = ac.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 340;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(filter).connect(gain).connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.52);
      }
    }

    speakThaiScript() {
      const sfx = this.state.sfx || "rimshot";
      this.playSynthesizedSfx(sfx);

      const text = (this.state.voiceover || this.state.subtitle_text || "").trim();
      if (!text || !("speechSynthesis" in global)) {
        return false;
      }

      global.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "th-TH";

      const voices = global.speechSynthesis.getVoices();
      const thVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("th"));
      if (thVoice) utter.voice = thVoice;

      // Match pitch & rate feel per speaker
      const spk = this.state.speaker;
      if (spk === "boss") {
        utter.pitch = 0.78;
        utter.rate = 1.02;
      } else if (spk === "hero") {
        utter.pitch = 1.2;
        utter.rate = 1.08;
      } else if (spk === "husband") {
        utter.pitch = 0.85;
        utter.rate = 1.04;
      } else if (spk === "wife") {
        utter.pitch = 1.28;
        utter.rate = 1.04;
      } else if (spk === "son") {
        utter.pitch = 1.45;
        utter.rate = 1.1;
      } else if (spk === "mom") {
        utter.pitch = 1.22;
        utter.rate = 1.04;
      } else if (spk === "dad") {
        utter.pitch = 0.82;
        utter.rate = 1.04;
      } else if (spk === "friend_left") {
        utter.pitch = 0.9;
        utter.rate = 1.04;
      } else if (spk === "runner") {
        utter.pitch = 1.18;
        utter.rate = 1.08;
      } else if (spk === "friend_right") {
        utter.pitch = 0.78;
        utter.rate = 1.06;
      } else if (spk === "senior") {
        utter.pitch = 1.14;
        utter.rate = 1.06;
      } else if (spk === "junior_tall") {
        utter.pitch = 1.32;
        utter.rate = 1.1;
      } else {
        utter.pitch = 1.0;
        utter.rate = 1.06;
      }

      global.speechSynthesis.speak(utter);
      return true;
    }

    exportPng() {
      if (!this.canvas) return;
      this.renderFrame();
      const dataUrl = this.canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `agy_scene_${this.state.board_mode}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    exportStoryboardJson() {
      const subLines = String(this.state.subtitle_text || "")
        .split(/\n|\//g)
        .map((s) => s.trim())
        .filter(Boolean);

      const voiceMap = {
        narrator: { voice: "th-TH-NiwatNeural", rate: "+10%", pitch: "+0Hz" },
        boss: { voice: "th-TH-NiwatNeural", rate: "+6%", pitch: "-12Hz" },
        hero: { voice: "th-TH-NiwatNeural", rate: "+12%", pitch: "+8Hz" },
        husband: { voice: "th-TH-NiwatNeural", rate: "+6%", pitch: "-8Hz" },
        wife: { voice: "th-TH-PremwadeeNeural", rate: "+6%", pitch: "+2Hz" },
        son: { voice: "th-TH-NiwatNeural", rate: "+12%", pitch: "+18Hz" },
        mom: { voice: "th-TH-PremwadeeNeural", rate: "+6%", pitch: "+0Hz" },
        dad: { voice: "th-TH-NiwatNeural", rate: "+8%", pitch: "-10Hz" },
        friend_left: { voice: "th-TH-NiwatNeural", rate: "+8%", pitch: "-6Hz" },
        runner: { voice: "th-TH-NiwatNeural", rate: "+10%", pitch: "+8Hz" },
        friend_right: { voice: "th-TH-NiwatNeural", rate: "+10%", pitch: "-12Hz" },
        senior: { voice: "th-TH-NiwatNeural", rate: "+10%", pitch: "+6Hz" },
        junior_tall: { voice: "th-TH-NiwatNeural", rate: "+12%", pitch: "+14Hz" },
      };
      const vConf = voiceMap[this.state.speaker] || voiceMap.narrator;

      const payload = {
        project_title: this.state.board_title || "Custom AGY 2D Cartoon Scene",
        width: 1080,
        height: 1920,
        fps: 30,
        scenes: [
          {
            id: "scene_01",
            index: 1,
            speaker: this.state.speaker,
            voice: vConf.voice,
            voice_rate: vConf.rate,
            voice_pitch: vConf.pitch,
            voiceover: this.state.voiceover,
            subtitle_lines: subLines.length ? subLines : ["ซับไตเติลทดสอบ"],
            camera: "wide_meeting",
            board_mode: this.state.board_mode,
            board_title: this.state.board_title,
            hero_expr: this.state.right_expr,
            friend_expr: this.state.right_expr,
            boss_expr: this.state.left_expr,
            jitter: Number(this.state.jitter) || 0,
            popup: this.state.popup_text || null,
            popup_style: this.state.popup_style,
            sfx: this.state.sfx,
          },
        ],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "storyboard_custom.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  global.StudioCanvasEngine = StudioCanvasEngine;
})(window);
