import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import sharp from 'sharp'

const UPLOAD_BASE = '/var/www/carphacom/shared/uploads/products'
const THUMB_SIZES = { small: 200, medium: 400 }
const MAIN_SIZE = 800
const RECOMMENDED_MIN = 600
const RECOMMENDED_MAX = 1200

// POST - Upload images (single files or a batch)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const folderName = (formData.get('folder') as string) || `upload_${Date.now()}`
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images found' }, { status: 400 })
    }

    // Create target directories
    const targetDir = path.join(UPLOAD_BASE, folderName)
    const thumbSmallDir = path.join(targetDir, 'thumbnails', 'small')
    const thumbMediumDir = path.join(targetDir, 'thumbnails', 'medium')
    await mkdir(targetDir, { recursive: true })
    await mkdir(thumbSmallDir, { recursive: true })
    await mkdir(thumbMediumDir, { recursive: true })

    const results: Array<{
      filename: string
      originalSize: { width: number; height: number }
      optimizedSize: { width: number; height: number }
      thumbnails: { small: string; medium: string }
      mainPath: string
      sizeBytes: number
      warning?: string
    }> = []

    const errors: Array<{ filename: string; error: string }> = []

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const ext = path.extname(filename).toLowerCase()
        const baseName = path.basename(filename, ext)

        // Validate image type
        if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext)) {
          errors.push({ filename: file.name, error: `Unsupported format: ${ext}` })
          continue
        }

        // Get original dimensions
        const metadata = await sharp(buffer).metadata()
        const origWidth = metadata.width || 0
        const origHeight = metadata.height || 0

        let warning: string | undefined
        if (origWidth < RECOMMENDED_MIN || origHeight < RECOMMENDED_MIN) {
          warning = `Small dimensions (${origWidth}x${origHeight}). Recommended minimum ${RECOMMENDED_MIN}x${RECOMMENDED_MIN}px`
        }

        // Optimize main image - resize to max MAIN_SIZE, convert to webp
        const mainImage = sharp(buffer).resize(MAIN_SIZE, MAIN_SIZE, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        const mainBuffer = await mainImage.webp({ quality: 85 }).toBuffer()
        const mainFilename = `${baseName}.webp`
        const mainPath = path.join(targetDir, mainFilename)
        await writeFile(mainPath, mainBuffer)

        const mainMeta = await sharp(mainBuffer).metadata()

        // Generate small thumbnail (200x200)
        const smallThumb = await sharp(buffer)
          .resize(THUMB_SIZES.small, THUMB_SIZES.small, { fit: 'cover', position: 'centre' })
          .webp({ quality: 80 })
          .toBuffer()
        const smallThumbPath = path.join(thumbSmallDir, `${baseName}.webp`)
        await writeFile(smallThumbPath, smallThumb)

        // Generate medium thumbnail (400x400)
        const mediumThumb = await sharp(buffer)
          .resize(THUMB_SIZES.medium, THUMB_SIZES.medium, { fit: 'cover', position: 'centre' })
          .webp({ quality: 82 })
          .toBuffer()
        const mediumThumbPath = path.join(thumbMediumDir, `${baseName}.webp`)
        await writeFile(mediumThumbPath, mediumThumb)

        results.push({
          filename: mainFilename,
          originalSize: { width: origWidth, height: origHeight },
          optimizedSize: { width: mainMeta.width || 0, height: mainMeta.height || 0 },
          thumbnails: {
            small: `/api/uploads/products/${folderName}/thumbnails/small/${baseName}.webp`,
            medium: `/api/uploads/products/${folderName}/thumbnails/medium/${baseName}.webp`,
          },
          mainPath: `/api/uploads/products/${folderName}/${mainFilename}`,
          sizeBytes: mainBuffer.length,
          warning,
        })
      } catch (err: any) {
        errors.push({ filename: file.name, error: err.message || 'Image processing error' })
      }
    }

    return NextResponse.json({
      success: true,
      folder: folderName,
      folderPath: `/uploads/products/${folderName}`,
      uploaded: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
      recommendations: {
        mainImage: `${RECOMMENDED_MIN}-${RECOMMENDED_MAX}px (auto-optimized to max ${MAIN_SIZE}px)`,
        thumbnailSmall: `${THUMB_SIZES.small}x${THUMB_SIZES.small}px (auto-generated)`,
        thumbnailMedium: `${THUMB_SIZES.medium}x${THUMB_SIZES.medium}px (auto-generated)`,
        formats: 'JPG, PNG, WebP, AVIF, GIF',
        tip: 'For optimal thumbnails, use square or 4:3 images of at least 600x600px',
      },
    })
  } catch (error: any) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: error.message || 'Image upload error' }, { status: 500 })
  }
}

// GET - List uploaded image folders
export async function GET(request: NextRequest) {
  try {
    if (!existsSync(UPLOAD_BASE)) {
      return NextResponse.json({ folders: [] })
    }

    const entries = await readdir(UPLOAD_BASE, { withFileTypes: true })
    const folders = []

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('upload_')) {
        const folderPath = path.join(UPLOAD_BASE, entry.name)
        const files = await readdir(folderPath)
        const imageFiles = files.filter(f => !f.startsWith('.') && f !== 'thumbnails')
        const stats = await stat(folderPath)

        folders.push({
          name: entry.name,
          path: `/api/uploads/products/${entry.name}`,
          imageCount: imageFiles.length,
          images: imageFiles.map(f => ({
            filename: f,
            mainPath: `/api/uploads/products/${entry.name}/${f}`,
            thumbnailSmall: `/api/uploads/products/${entry.name}/thumbnails/small/${f}`,
            thumbnailMedium: `/api/uploads/products/${entry.name}/thumbnails/medium/${f}`,
          })),
          createdAt: stats.birthtime.toISOString(),
        })
      }
    }

    folders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ folders })
  } catch (error: any) {
    console.error('List folders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
