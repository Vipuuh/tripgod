// api/cron-cleanup-media.js
// Vercel Serverless Cron Function to purge temporary outgoing WhatsApp media files older than retention threshold (e.g. 7 days)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://xiqirxnnwljwtkabeukr.supabase.co";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_AhBs9zs5xpkeR0obLfXaXQ_dQlTPdRI";

const RETENTION_DAYS = 7; // Auto-delete temporary attachments older than 7 days

const getSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  } catch (err) {
    console.error("Supabase init error in cleanup cron:", err);
    return null;
  }
};

export default async function handler(req, res) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client unavailable' });
    }

    // List files in whatsapp_temp directory inside media bucket
    const { data: files, error: listErr } = await supabase.storage
      .from('media')
      .list('whatsapp_temp', { limit: 200 });

    if (listErr) {
      console.warn("Storage list warning (folder may not exist yet):", listErr.message);
      return res.status(200).json({ status: 'no_files_or_bucket_empty', files_deleted: 0 });
    }

    if (!files || files.length === 0) {
      return res.status(200).json({ status: 'clean', files_deleted: 0 });
    }

    const now = Date.now();
    const thresholdMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const filesToDelete = [];

    for (const file of files) {
      if (file.created_at) {
        const fileAge = now - new Date(file.created_at).getTime();
        if (fileAge > thresholdMs) {
          filesToDelete.push(`whatsapp_temp/${file.name}`);
        }
      }
    }

    if (filesToDelete.length > 0) {
      const { data: removed, error: removeErr } = await supabase.storage
        .from('media')
        .remove(filesToDelete);

      if (removeErr) {
        console.error("Error purging expired media:", removeErr);
        return res.status(500).json({ error: removeErr.message });
      }

      console.log(`Cron cleanup successfully deleted ${filesToDelete.length} expired temporary WhatsApp media files.`);
      return res.status(200).json({
        status: 'success',
        retention_days: RETENTION_DAYS,
        files_deleted: filesToDelete.length,
        deleted_paths: filesToDelete
      });
    }

    return res.status(200).json({ status: 'success', files_deleted: 0, message: 'No expired files found' });
  } catch (err) {
    console.error("Error in cron cleanup media API:", err);
    return res.status(500).json({ error: err.message });
  }
}
