type AnalyticsValue = string | number | boolean | null;
type AnalyticsPayload = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: AnalyticsPayload) => void;
    };
  }
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();
  return extension && extension !== fileName.toLowerCase() ? extension : "none";
}

function getSizeBucket(bytes: number) {
  if (bytes < 1_000_000) return "lt_1mb";
  if (bytes < 10_000_000) return "1mb_10mb";
  if (bytes < 100_000_000) return "10mb_100mb";
  if (bytes < 1_000_000_000) return "100mb_1gb";
  return "gte_1gb";
}

export function summarizeFiles(files: FileList | File[]) {
  const items = Array.from(files);
  const totalBytes = items.reduce((sum, file) => sum + file.size, 0);
  const firstFile = items[0];

  return {
    file_count: items.length,
    multiple_files: items.length > 1,
    total_size_bucket: getSizeBucket(totalBytes),
    primary_extension: firstFile ? getFileExtension(firstFile.name) : "none",
  };
}

export function summarizeDownload(fileName: string, bytes: number) {
  return {
    file_size_bucket: getSizeBucket(bytes),
    file_extension: getFileExtension(fileName),
  };
}

export function trackEvent(name: string, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  const tracker = window.umami;

  if (typeof tracker?.track !== "function") {
    return;
  }

  tracker.track(name, payload);
}
