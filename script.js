// ---- Firebase (v10 modular) - all in this module file ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  onSnapshot, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// TODO: put your real config here
const firebaseConfig = {
    apiKey: "AIzaSyAcOs3hyYea3BM55R5GB-F0hObDbxgNrqA",
    authDomain: "study-web-8cd99.firebaseapp.com",
    databaseURL: "https://study-web-8cd99-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "study-web-8cd99",
    storageBucket: "study-web-8cd99.firebasestorage.app",
    messagingSenderId: "320613093347",
    appId: "1:320613093347:web:5bb57a0b5c83fdc0e09ad6",
    measurementId: "G-TNZD8GNJFT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- App state ----------
const defaultAvatar =
  // tiny inline SVG avatar (no external URL needed)
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#7289da"/><stop offset="1" stop-color="#5865f2"/>
      </linearGradient></defs>
      <rect width="80" height="80" rx="40" fill="url(#g)"/>
      <circle cx="40" cy="30" r="14" fill="white" opacity=".9"/>
      <rect x="18" y="50" width="44" height="16" rx="8" fill="white" opacity=".9"/>
    </svg>`
  );

function genName() { return "User" + Math.floor(1000 + Math.random() * 9000); }
const displayName = localStorage.getItem("displayName") || (() => {
  const n = genName(); localStorage.setItem("displayName", n); return n;
})();

// ---------- DOM ----------
const channelList = document.getElementById("channelList");
const channelTitle = document.getElementById("channelTitle");
const messagesEl = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const avatarImg = document.getElementById("avatarImg");
const displayNameSpan = document.getElementById("displayName");

avatarImg.src = defaultAvatar;
displayNameSpan.textContent = displayName;

let currentChannel = "chat";
let unsubscribeMessages = null;

// ---------- Helpers ----------
function clearMessages() { messagesEl.innerHTML = ""; }
function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

function renderMessage(msg) {
  const wrap = document.createElement("div");
  wrap.className = "message";

  const avatar = document.createElement("img");
  avatar.className = "avatar";
  avatar.src = msg.avatar || defaultAvatar;
  avatar.alt = "Avatar";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const meta = document.createElement("div");
  meta.className = "meta";
  const ts = msg.timestamp?.toDate ? msg.timestamp.toDate() : null;
  meta.textContent = `${msg.username || "User"} • ${ts ? ts.toLocaleString() : "sending..."}`;

  const text = document.createElement("div");
  text.className = "text";
  text.textContent = msg.text || "";

  bubble.appendChild(meta);
  bubble.appendChild(text);

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);

  return wrap;
}

// ---------- Firestore wiring ----------
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  messageInput.value = "";

  try {
    await addDoc(collection(db, "channels", currentChannel, "messages"), {
      username: displayName,
      avatar: defaultAvatar,
      text,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to send:", err);
  }
}

function subscribeToChannel(channelName) {
  if (unsubscribeMessages) {
    unsubscribeMessages(); // stop previous listener
    unsubscribeMessages = null;
  }
  clearMessages();

  const q = query(
    collection(db, "channels", channelName, "messages"),
    orderBy("timestamp")
  );

  unsubscribeMessages = onSnapshot(q, (snap) => {
    clearMessages();
    snap.forEach((doc) => {
      const msg = doc.data();
      messagesEl.appendChild(renderMessage(msg));
    });
    scrollToBottom();
  }, (err) => {
    console.error("Snapshot error:", err);
  });
}

// ---------- UI events ----------
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

channelList.querySelectorAll("li").forEach((li) => {
  li.addEventListener("click", () => {
    channelList.querySelector(".active")?.classList.remove("active");
    li.classList.add("active");
    currentChannel = li.dataset.channel;
    channelTitle.textContent = `# ${li.textContent.replace("# ","")}`;
    subscribeToChannel(currentChannel);
  });
});

// initial subscribe
subscribeToChannel(currentChannel);
