const sharp = require('sharp');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const PosterDebugger = require('./PosterDebugger');

class PosterEngine {
  constructor(posterId, template, inputs, photoPath, qrUrl) {
    this.posterId = posterId;
    this.template = template; // from DB, including `layers`
    this.inputs = inputs;
    this.photoPath = photoPath;
    this.qrUrl = qrUrl;
    this.dbg = new PosterDebugger(posterId);
    this.composites = [];
    
    // Create base canvas properties
    this.baseWidth = template.width;
    this.baseHeight = template.height;
    this.baseCanvas = sharp({
      create: {
        width: this.baseWidth,
        height: this.baseHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    });
  }

  async run(outputPath) {
    this.dbg.printSystemStats();
    this.dbg.log(`Démarrage PosterEngine pour: ${this.posterId}`);
    
    // Sort layers by zIndex
    const layers = this.template.layers.sort((a, b) => a.zIndex - b.zIndex);
    
    for (const layer of layers) {
      this.dbg.log(`Processing layer: ${layer.type} (zIndex: ${layer.zIndex})`);
      
      switch (layer.type) {
        case 'BACKGROUND':
        case 'ASSET':
        case 'IMAGE':
          await this.loadAsset(layer);
          break;
        case 'PHOTO':
          await this.loadPhoto(layer);
          break;
        case 'LOGO':
          await this.loadLogo(layer);
          break;
        case 'QRCODE':
          await this.loadQRCode(layer);
          break;
        case 'TEXT':
          await this.loadText(layer);
          break;
        default:
          this.dbg.warn(`Type de calque inconnu: ${layer.type}`);
      }
    }
    
    await this.export(outputPath);
  }

  resolvePath(imgPath) {
    if (!imgPath) return null;
    return imgPath.startsWith('/') ? path.join(__dirname, '..', imgPath) : path.resolve(imgPath);
  }

  async loadAsset(layer) {
    const assetPath = this.resolvePath(layer.imagePath);
    if (!assetPath) {
      this.dbg.warn(`Chemin d'image manquant pour le calque ASSET.`);
      return;
    }
    this.dbg.checkFileExists('Asset', assetPath);
    
    let img = sharp(assetPath);
    if (layer.width && layer.height) {
      img = img.resize(layer.width, layer.height, { fit: layer.fit || 'cover' });
    }
    if (layer.rotation) {
      img = img.rotate(layer.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    }
    
    const buffer = await img.toBuffer();
    await this.dbg.saveIntermediateStep(`asset-${layer.id}.png`, buffer);
    
    this.composites.push({
      input: buffer,
      left: layer.x,
      top: layer.y,
      blend: 'over'
    });
  }

  async loadPhoto(layer) {
    if (!this.photoPath) return;
    this.dbg.checkFileExists('User Photo', this.photoPath);
    
    // We can extract advanced transformations from inputs here later
    const zoom = parseFloat(this.inputs.zoom) || 1.0;
    const rotate = parseFloat(this.inputs.rotate) || layer.rotation || 0.0;
    const offsetX = parseInt(this.inputs.offsetX) || 0;
    const offsetY = parseInt(this.inputs.offsetY) || 0;
    
    const photoMeta = await sharp(this.photoPath).metadata();
    
    const targetW = layer.width || this.baseWidth;
    const targetH = layer.height || this.baseHeight;
    
    const scale = Math.max(targetW / photoMeta.width, targetH / photoMeta.height) * zoom;
    const tw = Math.round(photoMeta.width * scale);
    const th = Math.round(photoMeta.height * scale);
    
    let processed = await sharp(this.photoPath)
      .resize(tw, th)
      .rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
      
    // Calculate center relative to the layer box
    const pm = await sharp(processed).metadata();
    const cx = Math.round((targetW - pm.width) / 2) + offsetX;
    const cy = Math.round((targetH - pm.height) / 2) + offsetY;
    
    await this.dbg.saveIntermediateStep(`photo-${layer.id}.png`, processed);
    
    this.composites.push({
      input: processed,
      left: layer.x + cx,
      top: layer.y + cy,
      blend: 'over'
    });
  }

  async loadLogo(layer) {
    const logoPath = this.resolvePath(layer.imagePath);
    if (!logoPath) return;
    this.dbg.checkFileExists('Logo', logoPath);
    
    let logo = sharp(logoPath);
    if (layer.width && layer.height) {
      logo = logo.resize(layer.width, layer.height, { fit: layer.fit || 'contain', background: {r:0,g:0,b:0,alpha:0} });
    }
    
    const buffer = await logo.toBuffer();
    this.composites.push({
      input: buffer,
      left: layer.x,
      top: layer.y,
      blend: 'over'
    });
  }

  async loadQRCode(layer) {
    if (!this.qrUrl) return;
    
    const size = layer.width || 140;
    const qrBuffer = await QRCode.toBuffer(this.qrUrl, {
      margin: 1,
      width: size,
      color: { dark: '#000000', light: '#FFFFFF' }
    });
    
    this.composites.push({
      input: qrBuffer,
      left: layer.x,
      top: layer.y,
      blend: 'over'
    });
  }

  async loadText(layer) {
    const key = layer.key;
    let textValue = this.inputs[key] || '';
    if (!textValue && key === 'SLOGAN') textValue = 'JE CHOISIS LA VIE';
    if (!textValue) return;

    if (layer.isUppercase) textValue = textValue.toUpperCase();
    
    textValue = textValue
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
      
    let textAnchor = 'middle';
    let xPos = layer.x + (layer.width || 0) / 2;
    if (layer.align === 'left') {
      textAnchor = 'start';
      xPos = layer.x;
    } else if (layer.align === 'right') {
      textAnchor = 'end';
      xPos = layer.x + (layer.width || 0);
    }
    
    const fw = layer.fontWeight || 'bold';
    const fsSize = layer.fontSize || 36;
    const color = layer.color || '#FFFFFF';
    const fontFam = layer.fontFamily || 'Arial';
    
    // We create a full SVG layer
    const svgStr = `
      <svg width="${this.baseWidth}" height="${this.baseHeight}" xmlns="http://www.w3.org/2000/svg">
        <text 
          x="${xPos}" 
          y="${layer.y}" 
          font-family="${fontFam}, Arial, sans-serif" 
          font-size="${fsSize}px" 
          font-weight="${fw}" 
          fill="${color}" 
          text-anchor="${textAnchor}"
          dominant-baseline="middle"
        >${textValue}</text>
      </svg>
    `;
    
    await this.dbg.saveIntermediateStep(`text-${key}-${layer.id}.svg`, svgStr);
    
    this.composites.push({
      input: Buffer.from(svgStr),
      left: 0,
      top: 0,
      blend: 'over'
    });
  }

  async export(outputPath) {
    this.dbg.logComposite(this.composites, this.baseWidth, this.baseHeight);
    
    await this.baseCanvas
      .composite(this.composites)
      .png()
      .toFile(outputPath);
      
    await this.dbg.checkFinalPng(outputPath);
    this.dbg.log(`Poster generated successfully at: ${outputPath}`);
  }
}

module.exports = PosterEngine;
