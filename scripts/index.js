const videoWrapper = document.querySelector(".video-wrapper");
const video = document.querySelector("#video");

function initWebcam() {
    navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

    navigator.getUserMedia(
        { video: true },
        (stream) => (video.srcObject = stream),
        (error) => console.log(error)
    );
}

function handleVideoPlay() {
    const canvas = faceapi.createCanvasFromMedia(video);
    const context = canvas.getContext("2d");
    const size = { width: videoWrapper.clientWidth, height: videoWrapper.clientHeight };
    faceapi.matchDimensions(canvas, size);
    videoWrapper.append(canvas);

    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

        const resizedDetections = faceapi.resizeResults(detections, size);

        context.clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        resizedDetections.forEach((detection) => {
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: Math.round(detection.age) + " year old " + detection.gender,
            });
            drawBox.draw(canvas);
        });
    }, 100);
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    faceapi.nets.ageGenderNet.loadFromUri("/models"),
]).then(() => {
    initWebcam();
    video.addEventListener("play", handleVideoPlay);
});
