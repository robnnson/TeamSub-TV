import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);
  private readonly THUMBNAIL_WIDTH = 300;
  private readonly THUMBNAIL_HEIGHT = 200;

  /**
   * Generate a thumbnail for an image file
   */
  async generateImageThumbnail(
    sourcePath: string,
    outputPath: string,
  ): Promise<void> {
    try {
      await sharp(sourcePath)
        .resize(this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      this.logger.log(`Generated thumbnail: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a thumbnail for text content
   * Creates a simple image with the text content preview
   */
  async generateTextThumbnail(
    textContent: string,
    backgroundColor: string,
    outputPath: string,
  ): Promise<void> {
    try {
      // Extract background color from metadata or use default
      const bgColor = backgroundColor || '#FFFFFF';

      // Create SVG with text preview
      const preview = textContent.substring(0, 100);
      const textColor = this.getContrastColor(bgColor);

      const svg = `
        <svg width="${this.THUMBNAIL_WIDTH}" height="${this.THUMBNAIL_HEIGHT}">
          <rect width="100%" height="100%" fill="${bgColor}"/>
          <text
            x="50%"
            y="50%"
            dominant-baseline="middle"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="14"
            fill="${textColor}"
            style="word-wrap: break-word;">
            ${this.escapeXml(preview)}${textContent.length > 100 ? '...' : ''}
          </text>
        </svg>
      `;

      await sharp(Buffer.from(svg))
        .resize(this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT)
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      this.logger.log(`Generated text thumbnail: ${outputPath}`);
    } catch (error) {
      this.logger.error(
        `Failed to generate text thumbnail: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Ensure thumbnail directory exists
   */
  async ensureThumbnailDirectory(): Promise<string> {
    const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), 'media');
    const thumbnailDir = path.join(mediaDir, 'thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });
    return thumbnailDir;
  }

  /**
   * Get contrast color for text (white or black) based on background
   */
  private getContrastColor(hexColor: string): string {
    // Remove # if present
    const color = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Delete a thumbnail file
   */
  async deleteThumbnail(thumbnailPath: string): Promise<void> {
    try {
      const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), 'media');
      const fullPath = path.join(mediaDir, thumbnailPath);
      await fs.unlink(fullPath);
      this.logger.log(`Deleted thumbnail: ${fullPath}`);
    } catch (error) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        this.logger.error(`Failed to delete thumbnail: ${error.message}`);
      }
    }
  }
}
