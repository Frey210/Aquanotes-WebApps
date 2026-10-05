export type Role = "user" | "admin";
export type Connectivity = "online" | "stale" | "offline" | "never_seen";
export type OperationalMode = "active" | "maintenance" | "inactive";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Device {
  id: number;
  uid: string;
  name: string | null;
  user_id: number | null;
  status: string | null;
  last_seen: string | null;
  connection_interval: number | null;
}

export interface DeviceThresholds {
  device_id: number;
  device_name: string;
  temp_min: number | null;
  temp_max: number | null;
  ph_min: number | null;
  ph_max: number | null;
  do_min: number | null;
  tds_max: number | null;
  ammonia_max: number | null;
  salinitas_min: number | null;
  salinitas_max: number | null;
}

export interface DeviceStatus {
  online: number;
  offline: number;
  maintenance: number;
  devices: Device[];
}

export interface SensorReading {
  suhu: number | null;
  ph: number | null;
  do: number | null;
  tds: number | null;
  ammonia: number | null;
  salinitas: number | null;
  timestamp: string | null;
}

export interface MonitoringDevice {
  id: number;
  name: string;
  latest_data: SensorReading | null;
  historical_data: SensorReading[];
}

export interface MonitoringResponse {
  kolam_list: Array<{ id: number; nama: string; devices: MonitoringDevice[] }>;
  current_kolam_id: number | null;
  current_device_id: number | null;
}

export interface Tambak {
  id: number;
  name: string;
  country: string;
  province: string;
  city: string;
  district: string;
  village: string;
  address: string;
  cultivation_type: string;
}

export interface Kolam {
  id: number;
  nama: string;
  komoditas: string;
}

export interface NotificationItem {
  id: number;
  device_id: number;
  device_name: string;
  message: string;
  parameter: string;
  threshold_value: number;
  current_value: number;
  is_read: boolean;
  timestamp: string;
}

export interface AdminSummary {
  total: number;
  online: number;
  stale: number;
  offline: number;
  never_seen: number;
  maintenance: number;
  inactive: number;
  scheduled_deactivation: number;
  pending_maintenance: number;
  unassigned: number;
  active_alerts: number;
}

export interface FleetDevice {
  id: number;
  uid: string;
  name: string | null;
  user_id: number | null;
  user_name: string | null;
  tambak_name: string | null;
  kolam_name: string | null;
  connectivity_status: Connectivity;
  operational_mode: OperationalMode;
  last_seen: string | null;
  connection_interval: number;
  deactivation_scheduled_at: string | null;
  mqtt_credential_status: "unprovisioned" | "ready" | "active" | "error";
  current_firmware_version: string | null;
  power_profile: "portable" | "panel";
}

export interface MqttCredential extends FleetDevice {
  mqtt_password: string;
  secrets_h: string;
}

export interface FleetDevicePage {
  items: FleetDevice[];
  page: number;
  page_size: number;
  total: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  email_verified: boolean;
  created_at: string;
  last_login: string | null;
  device_count: number;
  tambak_count: number;
}

export interface AdminUserPage {
  items: AdminUser[];
  page: number;
  page_size: number;
  total: number;
  all_users: number;
  verified: number;
  unverified: number;
}

export interface AdminParameterSummary {
  parameter: Exclude<keyof SensorReading, "timestamp">;
  label: string;
  unit: string;
  devices_with_data: number;
  devices_with_limits: number;
  needs_attention: number;
  average: number | null;
  minimum: number | null;
  maximum: number | null;
}

export interface AdminSensorDevice extends FleetDevice {
  latest_data: SensorReading | null;
  historical_data: SensorReading[];
  attention_parameters: string[];
}

export interface AdminSensorOverview {
  generated_at: string;
  parameters: AdminParameterSummary[];
  devices: AdminSensorDevice[];
}

export interface MaintenanceRequest {
  id: number;
  device_id: number;
  device_name: string;
  user_name: string;
  status: "requested" | "in_progress" | "completed" | "cancelled";
  technician_name: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export type OtaReleaseStatus = "draft" | "ready" | "retired";
export type OtaAssignmentState =
  | "assigned"
  | "deferred"
  | "downloading"
  | "downloaded"
  | "rebooting"
  | "pending_verify"
  | "success"
  | "failed"
  | "rolled_back"
  | "cancelled";

export interface FirmwareRelease {
  id: number;
  version: string;
  status: OtaReleaseStatus;
  sha256: string;
  size_bytes: number;
  signing_key_id: string | null;
  release_notes: string | null;
  created_by: number;
  created_at: string;
}

export interface OtaAssignment {
  id: number;
  device_id: number;
  device_uid: string;
  release_id: number;
  version: string;
  from_version: string | null;
  state: OtaAssignmentState;
  progress: number | null;
  attempt_count: number;
  last_error_code: string | null;
  last_error_detail: string | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  last_report_at: string | null;
  is_rollback: boolean;
  mandatory: boolean;
}

export interface OtaAssignmentBatch {
  items: OtaAssignment[];
  publish_failures: number[];
}
