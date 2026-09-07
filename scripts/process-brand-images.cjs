const sharp = require("sharp");
const path = require("path");

const src = "C:/Users/joaol/OneDrive/Área de Trabalho/ImagemQuintoDado";

async function main() {
  await sharp(path.join(src, "LogoQuintoDado.png"))
    .resize(512, 512)
    .png({ quality: 90 })
    .toFile("src/assets/brand/logo-5d.png");

  await sharp(path.join(src, "ImagemMestreQuintao.png"))
    .resize(960, 960)
    .webp({ quality: 85 })
    .toFile("src/assets/brand/mestre-quintao.webp");

  await sharp(path.join(src, "ImagemBH.webp"))
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile("src/assets/presencial-bh/praca-sete.webp");

  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
