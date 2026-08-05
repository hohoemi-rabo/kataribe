import { createClient } from "@/lib/supabase/client";
import { SECTION_IMAGE_JPEG_QUALITY } from "@/lib/transcribe/client";

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("画像の変換に失敗しました。")),
      "image/jpeg",
      SECTION_IMAGE_JPEG_QUALITY,
    );
  });
}

/** 切り抜き画像を sections バケットに保存し、Storage パスを返す */
export async function uploadSectionImage(
  canvas: HTMLCanvasElement,
): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("セッションが切れています。再ログインしてください。");
  }

  // Storage ポリシーは第1階層フォルダ = 本人の user_id のみ許可
  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const blob = await canvasToBlob(canvas);

  const { error } = await supabase.storage.from("sections").upload(path, blob, {
    contentType: "image/jpeg",
  });
  if (error) {
    throw new Error(`画像の保存に失敗しました: ${error.message}`);
  }
  return path;
}
