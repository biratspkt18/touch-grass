// Image storage wrapper — the second vendor seam (with auth.tsx).
//
// API: uploadImage(localUri) → path, getImageUrl(path) → full URL,
// deleteImage(path).
//
// Every image is re-encoded on the phone before upload: resized to at most
// 1080px on the long edge at ~78% JPEG quality (roughly 150–300KB). The
// re-encode also strips EXIF/GPS metadata — these photos are public, so the
// original (and its location tags) must never leave the device.
//
// The database stores only storage *paths* ("<userId>/<timestamp>.jpg");
// full URLs are built from the single base URL in backend config.

import { Image } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { db, IMAGE_BUCKET, IMAGE_BASE_URL } from './backend';
import { getCurrentUser } from './auth';

/** Long-edge cap, px. Plenty for full-width phone rendering. */
const MAX_DIMENSION = 1080;
/** JPEG quality (0–1). */
const JPEG_QUALITY = 0.78;

function getLocalImageSize(
  uri: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) =>
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (e) => reject(new Error(`Could not read image: ${e}`))
    )
  );
}

/**
 * Downscale to MAX_DIMENSION on the long edge and re-encode as JPEG. Always
 * re-encodes — even images that are already small — so metadata is stripped.
 * Returns the URI of the processed temp file.
 */
async function compressForUpload(localUri: string): Promise<string> {
  const { width, height } = await getLocalImageSize(localUri);
  const context = ImageManipulator.manipulate(localUri);
  if (Math.max(width, height) > MAX_DIMENSION) {
    context.resize(
      width >= height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION }
    );
  }
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });
  return result.uri;
}

/**
 * Compress a local photo (file:// URI from the camera or picker) and upload
 * it. Requires a signed-in user. Returns the storage path to persist in the
 * database — never store the full URL.
 */
export async function uploadImage(localUri: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Sign in to upload photos.');

  const compressedUri = await compressForUpload(localUri);
  const bytes = await fetch(compressedUri).then((r) => r.arrayBuffer());

  // Random suffix so multi-photo spots can't collide on a same-millisecond
  // timestamp (upsert is off, so a collision would fail the upload).
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await db.storage.from(IMAGE_BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    // Uploaded files are immutable (timestamped names), so let CDNs and the
    // on-device cache hold them for a year — keeps egress inside free tier.
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

/**
 * Public URL for a stored path. Tolerates legacy rows that stored a full URL
 * by passing them through untouched.
 */
export function getImageUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${IMAGE_BASE_URL}/${path}`;
}

/** Delete a stored image. Policies only allow deleting under your own prefix. */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await db.storage.from(IMAGE_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
