export interface Env {DB:D1Database; BLOBS:KVNamespace;COORDINATOR:DurableObjectNamespace;ASSETS:Fetcher;TINYFISH_API_KEY:string;WEBHOOK_SECRET:string;ADMIN_TOKEN:string;PUBLIC_BASE_URL:string;PAID_CALLS_ENABLED:string;STOP_AT_USD:string;MONITOR_END:string;}
export interface Page {id:string;url:string;name:string;category:string;monitor_id:string|null;schedule:string;created_at:string;expires_at:string|null;public:number;status:string;verified_at:string;fast_until:string|null;}
export interface Result {url:string;final_url:string;title:string;text:string;}
export interface Run {id:string;fetch_monitor_id?:string;is_baseline?:boolean;results:Result[];errors:unknown[];}
export interface Snapshot {id:string;page_id:string;run_id:string;captured_at:string;final_url:string;title:string;raw_text:string;text:string;text_sha:string;shot_sha:string|null;chain_shot_sha:string|null;link:string;shot_status:string;shot_at:string|null;late:number;noise_count:number;}
