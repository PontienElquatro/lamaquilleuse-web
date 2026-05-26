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
  private readonly bucket: string;

  constructor(private config: ConfigService) {
    const url    = config.get<string>('SUPABASE_URL');
    const key    = config.get<string>('SUPABASE_SERVICE_KEY');
    this.bucket  = config.get<string>('SUPABASE_BUCKET', 'lamaquilleuse');

    // Désactiver le realtime pour éviter l'erreur WebSocket Node.js 20
    this.supabase = createClient(url, key, {
      auth:     { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 0 } },
      global:   { headers: { 'x-client-info': 'lamaquilleuse-api' } },
    });
  }

  async upload(file: Express.Multer.File, path: string): Promise<UploadResult> {
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    const key = `${path}.${ext}`;
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, file.buffer, { contentType: file.mimetype, upsert: true });
    if (error) throw new Error(`Upload échoué : ${error.message}`);
    return { url: this.getPublicUrl(key), key };
  }

  async delete(key: string): Promise<void> {
    await this.supabase.storage.from(this.bucket).remove([key]);
  }

  getPublicUrl(key: string): string {
    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }
}
