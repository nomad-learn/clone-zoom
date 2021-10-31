const video = document.getElementById("myFace");
const audioBtn = document.getElementById("audio");
const cameraBtn = document.getElementById("camera");
const select = document.getElementById("select");
const form = document.getElementById("join");
const videoContainer = document.getElementById("myStream");
const roomNameEl = document.getElementById("roomName");
const notification = document.getElementById("notification");

const socket = io();

let myStream;
let isMuted = false;
let isCameraOff = false;
let isEnter = false;
let myPeerConnection;
let room;

form.hidden = false;
videoContainer.hidden = true;

const createNofi = (msg) => {
  notification.innerText = msg;
  notification.classList.toggle("show");
  setTimeout(() => {
    notification.classList.toggle("show");
  }, 2000);
};

const getCamera = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];

    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.label = camera.label;
      if (currentCamera.label === camera.lable) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (error) {
    console.log(error);
  }
};

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: false,
    video: true,
  };
  const cameraConstrains = {
    audio: true,
    video: { deviceId },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : initialConstrains
    );
    if (!deviceId) {
      await getCamera();
    }
    video.srcObject = myStream;
  } catch (error) {
    console.log(error);
  }
}

const startMedia = async () => {
  form.hidden = true;
  videoContainer.hidden = false;
  await getMedia();
  makeConnection();
};

const handleMuteClick = () => {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (isMuted) {
    isMuted = false;
    audioBtn.innerText = "🔊";
  } else {
    isMuted = true;
    audioBtn.innerText = "🔈";
  }
};

const handleCameraClick = () => {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (isCameraOff) {
    isCameraOff = false;
    cameraBtn.innerText = "🙆‍♂️";
  } else {
    isCameraOff = true;
    cameraBtn.innerText = "🤦‍♂️";
  }
};

const handleCameraSwitch = async () => {
  getMedia(select.value);
};

const handleJoin = async (e) => {
  e.preventDefault();
  const input = form.querySelector("input");
  const value = input.value;
  await startMedia();
  socket.emit("join", value);
  room = value;
  roomNameEl.innerText = value;
  input.value = "";
};

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleAddTrack);
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
}

function handleIce(data) {
  socket.emit("ice", data.candidate, room);
}
function handleAddTrack(data) {
  console.log(data.streams[0]);
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.streams[0];
}

audioBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
select.addEventListener("input", handleCameraSwitch);
form.addEventListener("submit", handleJoin);

// my browser
socket.on("hello", async (msg) => {
  createNofi(msg);
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, room);
});

socket.on("bye", (msg) => {
  createNofi(msg);
});

// another browser
socket.on("offer", async (offer) => {
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, room);
});

// my browser
socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

getMedia();
