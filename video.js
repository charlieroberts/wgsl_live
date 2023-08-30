const Video = {
  async start() {
    const video = document.createElement('video');
    document.body.appendChild( video )

    if (navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      video.srcObject = stream
      Video.srcObject = stream
      Video.element = video
      await video.play()
    }
  }
}

export default Video
