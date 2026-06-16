type ValidationResult = {
  isValid: boolean;
  message: string;
  severity: "reprovada" | "atencao";
};

const loadImage = (dataUrl: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Imagem inválida."));
    img.src = dataUrl;
  });
};

const detectWithBrowserFaceDetector = async (img: HTMLImageElement) => {
  const FaceDetectorCtor = (window as any).FaceDetector;
  if (!FaceDetectorCtor) return null;

  try {
    const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 2 });
    const faces = await detector.detect(img);
    return Array.isArray(faces) ? faces : [];
  } catch {
    return null;
  }
};

const fallbackFaceSignal = (img: HTMLImageElement) => {
  const sampleWidth = 180;
  const sampleHeight = Math.max(180, Math.round((img.height / img.width) * sampleWidth));
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { brightness: 0, skinRatio: 0, centerDetail: 0 };

  ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
  const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
  let brightness = 0;
  let skinPixels = 0;
  let centerDetail = 0;
  let centerSamples = 0;

  for (let y = 0; y < sampleHeight; y += 2) {
    for (let x = 0; x < sampleWidth; x += 2) {
      const i = (y * sampleWidth + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      brightness += (r + g + b) / 3;

      const skinLike =
        r > 55 &&
        g > 35 &&
        b > 20 &&
        max - min > 12 &&
        r > g * 1.04 &&
        r > b * 1.12;
      if (skinLike) skinPixels++;

      const inCenter = x > sampleWidth * 0.25 && x < sampleWidth * 0.75 && y > sampleHeight * 0.12 && y < sampleHeight * 0.78;
      if (inCenter && x + 2 < sampleWidth) {
        const j = (y * sampleWidth + x + 2) * 4;
        centerDetail += Math.abs(r - data[j]) + Math.abs(g - data[j + 1]) + Math.abs(b - data[j + 2]);
        centerSamples++;
      }
    }
  }

  const samples = (sampleWidth / 2) * (sampleHeight / 2);
  return {
    brightness: brightness / samples,
    skinRatio: skinPixels / samples,
    centerDetail: centerSamples ? centerDetail / centerSamples : 0,
  };
};

export const validatePhotoFile = async (dataUrl: string): Promise<ValidationResult> => {
  const img = await loadImage(dataUrl);
  const signal = fallbackFaceSignal(img);

  if (signal.brightness < 42) {
    return {
      isValid: false,
      message: "Foto muito escura. Envie uma imagem mais iluminada, com o rosto visível.",
      severity: "reprovada",
    };
  }

  const detectedFaces = await detectWithBrowserFaceDetector(img);
  if (detectedFaces) {
    if (detectedFaces.length !== 1) {
      return {
        isValid: false,
        message: "Envie uma foto com apenas um rosto visível.",
        severity: "reprovada",
      };
    }

    const box = detectedFaces[0].boundingBox;
    const faceArea = (box.width * box.height) / (img.width * img.height);
    if (faceArea < 0.035) {
      return {
        isValid: false,
        message: "O rosto está pequeno ou distante. Envie uma foto mais próxima do rosto.",
        severity: "reprovada",
      };
    }

    return { isValid: true, message: "Foto aprovada: rosto identificado.", severity: "atencao" };
  }

  if (signal.skinRatio < 0.035 || signal.centerDetail < 9) {
    return {
      isValid: false,
      message: "Não consegui identificar um rosto claro nessa imagem. Envie uma foto frontal, iluminada e com o rosto visível.",
      severity: "reprovada",
    };
  }

  return { isValid: true, message: "Foto aprovada para produção.", severity: "atencao" };
};
