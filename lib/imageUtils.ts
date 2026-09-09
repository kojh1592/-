export const MAX_PHOTOS_PER_POST = 3;

// 업로드 전 브라우저에서 리사이즈·압축해서 Blob으로 반환 (원본 그대로 올리면 용량이 커서 느려짐)
export function compressImageFile(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read fail"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode fail"));
      img.onload = () => {
        const MAX = 1400;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round((h * MAX) / w); w = MAX; }
          else { w = Math.round((w * MAX) / h); h = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("encode fail"))),
          "image/jpeg",
          0.75
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
