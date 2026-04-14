export interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Map {
  id: number;
  project_id: number;
  name: string;
  description: string;
  file_path: string | null;
  file_type: string | null;
  calibration_pos_x: number;
  calibration_pos_y: number;
  calibration_pos_z: number;
  calibration_rot_x: number;
  calibration_rot_y: number;
  calibration_rot_z: number;
  calibration_scale: number;
  created_at: string;
}

export interface Widget {
  id: number;
  map_id: number;
  name: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  data_key: string;
  created_at: string;
}

export interface DataEntry {
  id: number;
  widget_id: number;
  value: string;
  timestamp: string;
}
