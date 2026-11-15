export type LocalVideo = {
  id: string;
  title: string;
  createdAt: string;
  blob: Blob;
  notes: string;
};
const videoExtensions = /\.(mp4|m4v|mov|webm|ogv|ogg|avi|mkv|3gp|3g2)$/i;
/** Some phone/file providers omit MIME metadata. Never infer a different container. */
export function isVideoFile(file: Pick<File, "type" | "name">): boolean {
  return file.type.toLowerCase().startsWith("video/") ||
    ((!file.type || file.type === "application/octet-stream") && videoExtensions.test(file.name));
}
export function videoFilename(video: Pick<LocalVideo, "title" | "blob">): string {
  const original = "name" in video.blob && typeof video.blob.name === "string" ? video.blob.name : "";
  const originalExtension = original.match(videoExtensions)?.[0];
  const mime = video.blob.type.toLowerCase().split(";")[0].trim();
  const extensions: Record<string, string> = {"video/mp4":".mp4", "video/x-m4v":".m4v", "video/quicktime":".mov", "video/webm":".webm", "video/ogg":".ogv", "video/x-msvideo":".avi", "video/x-matroska":".mkv", "video/3gpp":".3gp", "video/3gpp2":".3g2"};
  const title = video.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").trim().replace(/[. ]+$/, "").slice(0, 120) || "practice-clip";
  return title.replace(videoExtensions, "") + (originalExtension || extensions[mime] || "");
}
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("baseline-video-journal", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("videos", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function listVideos(): Promise<LocalVideo[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("videos", "readonly");
    const request = tx.objectStore("videos").getAll();
    request.onsuccess = () =>
      resolve(
        request.result.sort((a: LocalVideo, b: LocalVideo) =>
          b.createdAt.localeCompare(a.createdAt),
        ),
      );
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function saveVideo(video: LocalVideo) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").put(video);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
