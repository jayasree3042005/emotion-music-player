let model, image = null, webcamStream = null;

const URL = "./model/";

const musicMap = {
  happy: "songs/happy.mp3",
  sad: "songs/sad.mp3",
  angry: "songs/angry.mp3",
  neutral: "songs/neutral.mp3"
};

const emojiMap = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  neutral: "😐"
};

async function loadModel() {
  try {
    model = await tmImage.load(URL + "model.json", URL + "metadata.json");
    console.log("✅ Model loaded successfully");
  } catch (err) {
    console.error("❌ Failed to load model", err);
  }
}
loadModel();

function startCamera() {
  stopCamera();
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      webcamStream = stream;
      const video = document.getElementById("webcam");
      video.srcObject = stream;
      video.style.display = "block";
      document.getElementById("uploadedImage").style.display = "none";
      image = null;
    })
    .catch(err => {
      alert("Camera access denied or not available.");
      console.error(err);
    });
}

function stopCamera() {
  const video = document.getElementById("webcam");
  video.style.display = "none";
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
}

document.getElementById("imageUpload").addEventListener("change", function (event) {
  stopCamera();
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    image = new Image();
    image.src = reader.result;
    image.onload = function () {
      document.getElementById("uploadedImage").src = image.src;
      document.getElementById("uploadedImage").style.display = "block";
      document.getElementById("webcam").style.display = "none";
    };
  };
  reader.readAsDataURL(file);
});

async function predictEmotion() {
  if (!model) {
    alert("Model not yet loaded. Please wait.");
    return;
  }

  let input;
  if (image) {
    input = image;
  } else if (webcamStream) {
    input = document.getElementById("webcam");
  } else {
    alert("Upload an image or start the webcam first.");
    return;
  }

  const prediction = await model.predict(input);
  console.log("🔍 Predictions:", prediction);

  prediction.sort((a, b) => b.probability - a.probability);
  const emotion = prediction[0].className.trim().toLowerCase();

  // Display emotion and emoji
  document.getElementById("result").innerText = `Emotion: ${capitalize(emotion)}`;
  document.getElementById("emoji").innerText = emojiMap[emotion] || "😐";

  // Play corresponding music
  const audio = document.getElementById("player");
  audio.pause();
  audio.src = musicMap[emotion] || "";
  audio.load();
  audio.play().then(() => {
    console.log("🎵 Playing music:", audio.src);
  }).catch(err => {
    console.warn("⚠️ Music autoplay blocked or failed:", err);
  });
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
