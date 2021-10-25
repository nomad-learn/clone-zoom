const video = document.getElementById("myFace");
const audioBtn = document.getElementById("audio");
const cameraBtn = document.getElementById("camera");
const select = document.getElementById("select");

let myStream;
let isMuted = false;
let isCameraOff = false;

const getCamera = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    console.log(currentCamera);
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
    audio: true,
    video: { facingMode: "user" },
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

getMedia();

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

audioBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
select.addEventListener("input", handleCameraSwitch);
