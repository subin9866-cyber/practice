let apiKey = "";
let chatInput;
let sendButton;
let saveKeyButton;
let apiKeyInput;
let statusText;
let replyText;

let pet = {
  name: "Mong",
  mood: "curious",
  action: "idle",
  friendship: 30,
  energy: 70,
  color: "#ff9fb2",
  reply: "안녕! 나는 말을 먹고 자라는 생명체야."
};

let chats = [];
let t = 0;
let isLoading = false;

const MODEL_NAME = "gemini-3.5-flash";

const SYSTEM_PROMPT = `
너는 "Prompt Pet"이라는 작은 AI 생명체다.
사용자가 말을 걸면 그 말을 먹고 감정과 행동이 변한다.

반드시 JSON만 출력한다.
마크다운, 설명문, 코드블록은 절대 쓰지 않는다.

규칙:
- reply는 한국어로 짧고 귀엽게 말한다.
- mood는 happy, sad, angry, curious, sleepy, excited 중 하나다.
- action은 idle, jump, shake, sleep, dance, glow 중 하나다.
- friendship은 0부터 100 사이 숫자다.
- energy는 0부터 100 사이 숫자다.
- color는 CSS hex color 형식이다. 예: "#ff99aa"
`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description: "사용자에게 보여줄 짧은 한국어 답변"
    },
    mood: {
      type: "string",
      enum: ["happy", "sad", "angry", "curious", "sleepy", "excited"]
    },
    action: {
      type: "string",
      enum: ["idle", "jump", "shake", "sleep", "dance", "glow"]
    },
    friendship: {
      type: "integer",
      minimum: 0,
      maximum: 100
    },
    energy: {
      type: "integer",
      minimum: 0,
      maximum: 100
    },
    color: {
      type: "string",
      description: "CSS hex color. Example: #ff99aa"
    }
  },
  required: ["reply", "mood", "action", "friendship", "energy", "color"]
};

function setup() {
  const canvas = createCanvas(520, 520);
  canvas.parent("canvasArea");

  chatInput = document.getElementById("chatInput");
  sendButton = document.getElementById("sendButton");
  saveKeyButton = document.getElementById("saveKeyButton");
  apiKeyInput = document.getElementById("apiKeyInput");
  statusText = document.getElementById("statusText");
  replyText = document.getElementById("replyText");

  const savedKey = localStorage.getItem("gemini_api_key");
  if (savedKey) {
    apiKey = savedKey;
    apiKeyInput.value = savedKey;
    statusText.textContent = "API Key가 저장되어 있어요. 말을 걸어보세요.";
  }

  saveKeyButton.addEventListener("click", saveApiKey);
  sendButton.addEventListener("click", sendMessage);

  chatInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  });
}

function draw() {
  t += 0.03;

  drawBackground();
  drawStats();
  drawPet();
  drawSpeechBubble();
}

function drawBackground() {
  background(245, 238, 220);

  noStroke();

  if (pet.mood === "happy") {
    fill(255, 230, 120, 90);
  } else if (pet.mood === "sad") {
    fill(80, 130, 220, 60);
  } else if (pet.mood === "angry") {
    fill(255, 80, 60, 70);
  } else if (pet.mood === "sleepy") {
    fill(140, 120, 210, 70);
  } else if (pet.mood === "excited") {
    fill(255, 170, 50, 80);
  } else {
    fill(120, 190, 180, 70);
  }

  for (let i = 0; i < 12; i++) {
    const x = (i * 47 + frameCount * 0.4) % width;
    const y = 70 + sin(t + i) * 28 + i * 28;
    ellipse(x, y, 70, 70);
  }

  fill(255, 255, 255, 120);
  ellipse(width * 0.5, height * 0.53, 360, 280);
}

function drawStats() {
  drawBar(32, 28, "friendship", pet.friendship, "#ff7aa2");
  drawBar(32, 62, "energy", pet.energy, "#66c7ff");
}

function drawBar(x, y, label, value, colorValue) {
  stroke(30);
  strokeWeight(2);
  fill(255);
  rect(x, y, 170, 18, 8);

  noStroke();
  fill(colorValue);
  const w = map(value, 0, 100, 0, 166);
  rect(x + 2, y + 2, w, 14, 6);

  noStroke();
  fill(30);
  textSize(13);
  textAlign(LEFT, CENTER);
  text(label + " " + value, x + 180, y + 9);
}

function drawPet() {
  push();
  translate(width / 2, height / 2 + 35);

  let yOffset = 0;
  let xOffset = 0;
  let scaleValue = 1;

  if (pet.action === "jump") {
    yOffset = -abs(sin(t * 4)) * 55;
  } else if (pet.action === "shake") {
    xOffset = sin(t * 18) * 12;
  } else if (pet.action === "sleep") {
    yOffset = sin(t) * 4;
  } else if (pet.action === "dance") {
    rotate(sin(t * 5) * 0.16);
    yOffset = sin(t * 8) * 8;
  } else if (pet.action === "glow") {
    scaleValue = 1 + sin(t * 4) * 0.04;
  }

  translate(xOffset, yOffset);
  scale(scaleValue);

  if (pet.action === "glow") {
    noStroke();
    fill(redColor(pet.color), greenColor(pet.color), blueColor(pet.color), 60);
    ellipse(0, 0, 240 + sin(t * 5) * 24, 240 + sin(t * 5) * 24);
  }

  drawBody();
  drawFace();
  drawFeet();

  pop();

  if (pet.mood === "sleepy" || pet.action === "sleep") {
    drawSleepMarks();
  }
}

function drawBody() {
  stroke(30);
  strokeWeight(4);
  fill(pet.color);

  beginShape();
  vertex(-95, 35);
  bezierVertex(-120, -60, -60, -130, 0, -115);
  bezierVertex(60, -130, 120, -60, 95, 35);
  bezierVertex(80, 105, -80, 105, -95, 35);
  endShape(CLOSE);

  fill(255, 255, 255, 90);
  noStroke();
  ellipse(-35, -45, 35, 20);
}

function drawFace() {
  stroke(30);
  strokeWeight(4);
  fill(255);

  if (pet.mood === "sleepy" || pet.action === "sleep") {
    noFill();
    arc(-35, -25, 28, 18, 0, PI);
    arc(35, -25, 28, 18, 0, PI);
  } else if (pet.mood === "angry") {
    line(-48, -42, -22, -30);
    line(48, -42, 22, -30);
    fill(30);
    ellipse(-35, -20, 12, 16);
    ellipse(35, -20, 12, 16);
  } else if (pet.mood === "excited") {
    fill(30);
    ellipse(-35, -25, 22, 28);
    ellipse(35, -25, 22, 28);
    fill(255);
    ellipse(-39, -31, 7, 7);
    ellipse(31, -31, 7, 7);
  } else {
    fill(30);
    ellipse(-35, -25, 18, 22);
    ellipse(35, -25, 18, 22);
    fill(255);
    ellipse(-39, -30, 6, 6);
    ellipse(31, -30, 6, 6);
  }

  noFill();
  stroke(30);

  if (pet.mood === "happy" || pet.mood === "excited") {
    arc(0, 8, 50, 34, 0, PI);
  } else if (pet.mood === "sad") {
    arc(0, 28, 46, 30, PI, TWO_PI);
  } else if (pet.mood === "angry") {
    line(-20, 15, 20, 15);
  } else if (pet.mood === "sleepy") {
    line(-15, 13, 15, 13);
  } else {
    ellipse(0, 15, 18, 12);
  }
}

function drawFeet() {
  stroke(30);
  strokeWeight(4);
  fill(255);
  ellipse(-45, 95, 48, 28);
  ellipse(45, 95, 48, 28);
}

function drawSpeechBubble() {
  const bubbleText = pet.reply;

  fill(255);
  stroke(30);
  strokeWeight(3);
  rect(52, 385, 416, 92, 18);

  noStroke();
  fill(30);
  textSize(17);
  textAlign(CENTER, CENTER);
  textWrap(WORD);
  text(bubbleText, 72, 404, 376, 54);

  textSize(13);
  fill(100);
  text("mood: " + pet.mood + " / action: " + pet.action, width / 2, 462);
}

function drawSleepMarks() {
  noStroke();
  fill(30);
  textSize(26);
  textAlign(CENTER, CENTER);
  text("Z", width / 2 + 115, height / 2 - 120 + sin(t * 2) * 5);
  textSize(18);
  text("z", width / 2 + 145, height / 2 - 150 + sin(t * 2 + 1) * 5);
}

function saveApiKey() {
  const value = apiKeyInput.value.trim();

  if (!value) {
    statusText.textContent = "API Key를 먼저 입력해주세요.";
    return;
  }

  apiKey = value;
  localStorage.setItem("gemini_api_key", apiKey);
  statusText.textContent = "API Key 저장 완료. 이제 말을 걸 수 있어요.";
}

async function sendMessage() {
  const userText = chatInput.value.trim();

  if (!apiKey) {
    statusText.textContent = "먼저 Gemini API Key를 저장해주세요.";
    return;
  }

  if (!userText || isLoading) {
    return;
  }

  isLoading = true;
  sendButton.disabled = true;
  chatInput.disabled = true;
  statusText.textContent = "Prompt Pet이 말을 먹는 중...";
  replyText.textContent = "생각하는 중...";

  chatInput.value = "";

  chats.push({
    role: "user",
    parts: [{ text: userText }]
  });

  try {
    const result = await generatePetResponse(chats);

    pet.reply = result.reply;
    pet.mood = result.mood;
    pet.action = result.action;
    pet.friendship = constrain(result.friendship, 0, 100);
    pet.energy = constrain(result.energy, 0, 100);
    pet.color = result.color;

    const modelText = JSON.stringify(result);

    chats.push({
      role: "model",
      parts: [{ text: modelText }]
    });

    if (chats.length > 12) {
      chats = chats.slice(chats.length - 12);
    }

    statusText.textContent = "응답 완료!";
    replyText.textContent = pet.reply;
  } catch (error) {
    console.error(error);
    statusText.textContent = "오류가 났어요. API Key나 인터넷 연결을 확인하세요.";
    replyText.textContent = error.message;
  }

  isLoading = false;
  sendButton.disabled = false;
  chatInput.disabled = false;
  chatInput.focus();
}

async function generatePetResponse(contents) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODEL_NAME +
    ":generateContent";

  const body = {
    systemInstruction: {
      parts: [
        {
          text: SYSTEM_PROMPT
        }
      ]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.9,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Gemini API 오류: " + errorText);
  }

  const data = await response.json();

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini 응답을 읽을 수 없습니다.");
  }

  return JSON.parse(text);
}

function redColor(hex) {
  return parseInt(hex.slice(1, 3), 16);
}

function greenColor(hex) {
  return parseInt(hex.slice(3, 5), 16);
}

function blueColor(hex) {
  return parseInt(hex.slice(5, 7), 16);
}
