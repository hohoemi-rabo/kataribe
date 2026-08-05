/**
 * video 要素の「その瞬間の1フレーム」を実解像度（videoWidth/Height）の
 * canvas として取得する。プリセット切り抜き（04〜06）で共用。
 */
export function captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const { videoWidth, videoHeight } = video;
  if (videoWidth === 0 || videoHeight === 0) {
    throw new Error(
      "フレームを取得できません。キャプチャ映像がまだ再生されていません。",
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("フレームを取得できません。canvas の初期化に失敗しました。");
  }

  context.drawImage(video, 0, 0, videoWidth, videoHeight);
  return canvas;
}
