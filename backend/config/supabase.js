/**
 * Supabase Storage Client
 * Handles file uploads/downloads to Supabase Storage
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('[SUPABASE] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Storage features disabled.');
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })
  : null;

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents';

/**
 * Upload file to Supabase Storage
 * @param {Object} file - Multer file object (buffer, originalname, mimetype)
 * @param {Object} options - Upload options
 * @returns {Promise<{path: string, publicUrl: string, signedUrl: string}>}
 */
async function uploadFile(file, options = {}) {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const bucket = options.bucket || DEFAULT_BUCKET;
  const folder = options.folder || 'uploads';
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const ext = file.originalname ? file.originalname.split('.').pop() : 'bin';
  const fileName = `${folder}/${timestamp}-${randomSuffix}.${ext}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
      cacheControl: '3600',
    });
  
  if (error) throw error;
  
  // Generate signed URL (valid 1 hour) for private buckets
  const { data: signedData } = await supabase.storage
    .from(bucket)
    .createSignedUrl(data.path, 3600);
  
  // Public URL (only works if bucket is public)
  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  
  return {
    path: data.path,
    fullPath: data.fullPath,
    publicUrl: publicData.publicUrl,
    signedUrl: signedData?.signedUrl,
    bucket,
  };
}

/**
 * Delete file from Supabase Storage
 * @param {string} path - Storage path (from uploadFile result)
 * @param {string} bucket - Bucket name
 * @returns {Promise<void>}
 */
async function deleteFile(path, bucket = DEFAULT_BUCKET) {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * Get signed download URL for private file
 * @param {string} path - Storage path
 * @param {number} expiresIn - Seconds (default 3600)
 * @param {string} bucket - Bucket name
 * @returns {Promise<string>} Signed URL
 */
async function getSignedUrl(path, expiresIn = 3600, bucket = DEFAULT_BUCKET) {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Get public URL (only if bucket is public)
 * @param {string} path - Storage path
 * @param {string} bucket - Bucket name
 * @returns {string} Public URL
 */
function getPublicUrl(path, bucket = DEFAULT_BUCKET) {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * List files in bucket/folder
 * @param {string} folder - Folder prefix
 * @param {string} bucket - Bucket name
 * @returns {Promise<Array>}
 */
async function listFiles(folder = '', bucket = DEFAULT_BUCKET) {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data, error } = await supabase.storage.from(bucket).list(folder);
  if (error) throw error;
  return data;
}

module.exports = {
  supabase,
  uploadFile,
  deleteFile,
  getSignedUrl,
  getPublicUrl,
  listFiles,
  DEFAULT_BUCKET,
};