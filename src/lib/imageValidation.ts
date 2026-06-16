export const validatePhotoFile = async (dataUrl: string) => {
  return new Promise<{isValid: boolean; message: string; severity: "reprovada" | "atencao"}>((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve({ isValid: true, message: "", severity: "atencao" });
        
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let brightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        brightness += (data[i] + data[i+1] + data[i+2]) / 3;
      }
      brightness /= (data.length / 4);

      if (img.width < 800 || img.height < 800) {
        resolve({ isValid: false, message: "Foto pequena demais. Envie uma imagem de maior qualidade.", severity: "reprovada" });
      } else if (brightness < 50) {
        resolve({ isValid: false, message: "Foto muito escura. Envie uma imagem com melhor iluminação.", severity: "reprovada" });
      } else {
        resolve({ isValid: true, message: "Foto aprovada!", severity: "atencao" });
      }
    };
  });
};
