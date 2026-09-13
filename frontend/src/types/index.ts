export interface BoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  confidence: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface ValidationResult {
  is_valid: boolean;
  state_code?: string;
  state_name?: string;
  rto_code?: string;
  series?: string;
  vehicle_number?: string;
  format_type?: string;
  validation_notes: string[];
}

export interface PipelineStage {
  id: string;
  title: string;
  stage_number: number;
  description: string;
  algorithm?: string;
  parameters: Record<string, any>;
  metrics?: Record<string, any>;
  image_url?: string;
  base64_preview?: string;
}

export interface RecognitionResult {
  id: string;
  user_id?: string;
  plate_text_raw?: string;
  plate_text_normalized?: string;
  plate_number?: string;
  overall_confidence: number;
  confidence?: number;
  detector_confidence: number;
  ocr_confidence: number;
  processing_status: 'SUCCESS' | 'NO_PLATE' | 'LOW_CONFIDENCE' | 'OCR_FAILED' | 'INVALID_FORMAT' | 'PROCESSING_ERROR';
  processing_duration_ms: number;
  processing_time_ms?: number;
  source_type: 'IMAGE' | 'VIDEO' | 'WEBCAM';
  original_filename?: string;
  original_image_url?: string;
  plate_crop_url?: string;
  enhanced_plate_url?: string;
  pipeline_stages: PipelineStage[];
  validation?: ValidationResult;
  is_valid_format?: boolean;
  vehicle_type?: string;
  engine_used?: string;
  state_code?: string;
  bounding_box?: BoundingBox;
  extra_metadata?: Record<string, any>;
  created_at: string;
}

export interface RecognitionListItem {
  id: string;
  plate_text_raw?: string;
  plate_text_normalized?: string;
  overall_confidence: number;
  processing_status: string;
  processing_duration_ms: number;
  source_type: string;
  original_filename?: string;
  original_image_url?: string;
  plate_crop_url?: string;
  state_name?: string;
  created_at: string;
}

export interface DailyMetric {
  date: string;
  total_scans: number;
  successful_scans: number;
  failed_scans: number;
}

export interface StateStat {
  state_code: string;
  state_name: string;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface PerformanceMetrics {
  avg_processing_time_ms: number;
  avg_detector_confidence: number;
  avg_ocr_confidence: number;
  avg_overall_confidence: number;
}

export interface AnalyticsOverview {
  total_recognitions: number;
  today_recognitions: number;
  success_rate_percentage: number;
  daily_trends: DailyMetric[];
  state_distribution: StateStat[];
  status_breakdown: StatusDistribution[];
  performance: PerformanceMetrics;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}
