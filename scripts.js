import { db } from "./firebase.js";
import {
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const defaultAvatar = "https://i.imgur.com/0y0y0y0.png"; // Replace
const randomUsername = "User" + Math.floor(1000 + Math.random() * 9000);
let currentChannel = "chat";

// Send message
document.getElementById("sendBtn").addEventListener("click", async() => {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (!text) return;

    await addDoc(collection(db, "channels", currentChannel, "messages"), {
        username: randomUsername,
        avatar: defaultAvatar,
        text,
        timestamp: serverTimestamp()
    });

    input.value = "";
});

// Switch channel
document.querySelectorAll(".sidebar li").forEach(li => {
    li.addEventListener("click", () => {
        document.querySelector(".sidebar li.active") ? .classList.remove("active");
        li.classList.add("active");
        currentChannel = li.dataset.channel;
        loadMessages();
    });
});

// Load messages
function loadMessages() {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = "";

    const q = query(
        collection(db, "channels", currentChannel, "messages"),
        orderBy("timestamp")
    );

    onSnapshot(q, snapshot => {
        messagesDiv.innerHTML = "";
        snapshot.forEach(doc => {
            const msg = doc.data();
            const el = document.createElement("div");
            el.classList.add("message");
            el.innerHTML = `
        <img src="${msg.avatar || defaultAvatar}" alt="Avatar">
        <div>
          <strong>${msg.username}</strong>
          <div class="message-content">${msg.text}</div>
        </div>
      `;
            messagesDiv.appendChild(el);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Initial load
loadMessages();