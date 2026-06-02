import sharp from 'sharp';

async function checkAndCrop() {
  const metadata = await sharp('public/logo.png').metadata();
  console.log(`Original: ${metadata.width}x${metadata.height}`);

  // The icon is typically on the left and square. Let's crop a square using the height.
  const size = metadata.height;
  
  await sharp('public/logo.png')
    .extract({ left: 0, top: 0, width: size, height: size })
    .toFile('public/icon_logo.png');
    
  console.log('Cropped successfully to icon_logo.png');
}

checkAndCrop();
