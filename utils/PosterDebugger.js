const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

class PosterDebugger {
  constructor(posterId, enabled = process.env.DEBUG === 'true') {
    this.posterId = posterId;
    this.enabled = enabled;
    this.debugDir = path.join(__dirname, '../uploads/debug');
    this.stepCounter = 1;
    
    if (this.enabled && !fs.existsSync(this.debugDir)) {
      fs.mkdirSync(this.debugDir, { recursive: true });
    }
  }

  log(message) {
    if (this.enabled) {
      console.log(`[DEBUG ${this.posterId}] ${message}`);
    }
  }

  warn(message) {
    if (this.enabled) {
      console.warn(`[WARNING ${this.posterId}] ${message}`);
    }
  }

  error(message) {
    console.error(`[ERROR ${this.posterId}] ${message}`);
    throw new Error(message);
  }

  printSystemStats() {
    if (!this.enabled) return;
    this.log(`Node Version: ${process.version}`);
    this.log(`Sharp Version: ${require('sharp/package.json').version}`);
    const memUsage = process.memoryUsage();
    this.log(`Memory Available (Heap Total): ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`);
  }

  async logDimensions(name, bufferOrPath) {
    if (!this.enabled) return null;
    try {
      const meta = await sharp(bufferOrPath).metadata();
      this.log(`${name} dimensions: ${meta.width}x${meta.height}`);
      if (meta.width === 0 || meta.height === 0 || meta.channels < 3) {
        this.error(`${name} est vide, transparent ou invalide.`);
      }
      return meta;
    } catch (err) {
      this.error(`Impossible de lire les métadonnées pour ${name}: ${err.message}`);
    }
  }

  checkFileExists(name, filePath) {
    if (!fs.existsSync(filePath)) {
      this.error(`Fichier introuvable pour ${name} : ${filePath}`);
    } else {
      this.log(`Fichier trouvé pour ${name} : ${filePath}`);
    }
  }

  async saveIntermediateStep(stepName, buffer) {
    if (!this.enabled) return;
    const prefix = String(this.stepCounter++).padStart(2, '0');
    const filename = `${prefix}-${stepName}`;
    const outputPath = path.join(this.debugDir, `${this.posterId}-${filename}`);
    
    if (Buffer.isBuffer(buffer)) {
      await sharp(buffer).png().toFile(outputPath);
    } else if (typeof buffer === 'string' && buffer.startsWith('<svg')) {
      fs.writeFileSync(outputPath.replace('.png', '.svg'), buffer);
    } else {
      await sharp(buffer).png().toFile(outputPath); // assuming it's a file path
    }
    this.log(`Sauvegarde étape intermédiaire: ${filename}`);
  }

  logComposite(composites, baseWidth, baseHeight) {
    if (!this.enabled) return;
    this.log(`Nombre total de calques (overlays): ${composites.length}`);
    if (composites.length === 0) {
      this.error('Aucun overlay ajouté dans le composite.');
    }
    
    composites.forEach((comp, index) => {
      this.log(`--- Calque ${index + 1} ---`);
      this.log(`Ordre: ${index}`);
      this.log(`Position X (left): ${comp.left || 0}`);
      this.log(`Position Y (top): ${comp.top || 0}`);
      
      if (comp.input && Buffer.isBuffer(comp.input)) {
        this.log(`Type: Buffer (size: ${comp.input.length} bytes)`);
      } else {
        this.log(`Type: FilePath (${comp.input})`);
      }
      
      this.log(`Opacity (explicit override): ${comp.blend || 'default/1'}`);
      
      if (comp.left < 0 || comp.left > baseWidth || comp.top < 0 || comp.top > baseHeight) {
        this.warn(`Calque ${index + 1} sort du canvas (left: ${comp.left}, top: ${comp.top}, canvas: ${baseWidth}x${baseHeight})`);
      }
    });
  }

  async checkFinalPng(filePath) {
    if (!this.enabled) return;
    try {
      const stats = fs.statSync(filePath);
      const meta = await sharp(filePath).metadata();
      this.log(`--- PNG Final ---`);
      this.log(`Largeur: ${meta.width}`);
      this.log(`Hauteur: ${meta.height}`);
      this.log(`Taille: ${Math.round(stats.size / 1024)} KB`);
      this.log(`Nombre de canaux (couleurs/alpha): ${meta.channels}`);
    } catch (err) {
      this.error(`Impossible d'analyser le PNG final: ${err.message}`);
    }
  }
}

module.exports = PosterDebugger;
