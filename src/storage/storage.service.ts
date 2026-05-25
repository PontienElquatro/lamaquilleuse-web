// src/storage/storage.service.ts
// Supabase Storage — upload, delete, get URL
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UploadResult {
  url: string;
  key: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket:   string;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL'),
      config.get<string>('SUPABASE_SERVICE_KEY'), // service_role key (côté serveur uniquement)
    );
    this.bucket = config.get<string>('SUPABASE_BUCKET', 'lamaquilleuse');
  }

  // ─── Upload un fichier ────────────────────────────────────────────────
  async upload(file: Express.Multer.File, path: string): Promise<UploadResult> {
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    const key = `${path}.${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, file.buffer, {
        contentType:  file.mimetype,
        upsert:       true,
        cacheControl: '3600',
      });

    if (error) {
      this.logger.error(`Upload failed: ${key}`, error.message);
      throw new Error(`Upload échoué : ${error.message}`);
    }

    const url = this.getPublicUrl(key);
    this.logger.log(`Uploaded: ${key}`);
    return { url, key };
  }

  // ─── Supprimer un fichier ─────────────────────────────────────────────
  async delete(key: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([key]);

    if (error) {
      this.logger.warn(`Delete failed: ${key} — ${error.message}`);
    }
  }

  // ─── URL publique ─────────────────────────────────────────────────────
  getPublicUrl(key: string): string {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(key);
    return data.publicUrl;
  }

  // ─── Déplacer un fichier ──────────────────────────────────────────────
  async move(fromKey: string, toKey: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .move(fromKey, toKey);

    if (error) throw new Error(`Move échoué : ${error.message}`);
  }
}
