const socket = io();

const welcome = document.getElementById("welcome");
const enterForm = welcome.querySelector("form");
const room = document.getElementById("room");
const messageForm = room.querySelector("form");
const ul = room.querySelector("ul");
const h4 = welcome.querySelector("h4");

room.hidden = true;

let roomName;

const addMessage = (text) => {
  const li = document.createElement("li");
  li.innerText = text;
  ul.appendChild(li);
};

const enterHandler = (_room) => {
  welcome.hidden = true;
  room.hidden = false;

  roomName = _room;
  const h3 = document.createElement("h3");
  h3.innerText = `Welcome ${_room}`;
  room.prepend(h3);
};

enterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = enterForm.querySelectorAll("input");
  socket.emit(
    "enter_room",
    { nickname: inputs[0].value, room: inputs[1].value },
    enterHandler
  );
  inputs.forEach((input) => (input.value = ""));
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = messageForm.querySelector("input");
  const value = input.value;
  socket.emit("message", input.value, roomName, () => {
    addMessage(`you : ${value}`);
  });
  input.value = "";
});

socket.on("welcome", (nickname, count) => {
  addMessage(nickname + " joined" + ` (total user : ${count})`);
});

socket.on("bye", (nickname, count) => {
  addMessage(nickname + " lefted" + ` (total user :${count})`);
});

socket.on("message", addMessage);

socket.on("public", (rooms) => {
  h4.innerText = `${rooms.join(",")}`;
  welcome.appendChild(h4);
});
