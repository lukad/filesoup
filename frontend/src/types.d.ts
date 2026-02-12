/// <reference types="webtorrent" />
/// <reference types="node" />

import WebTorrent from "webtorrent";

// add blob function WebTorrent.TorrentFile
declare module "webtorrent" {
  interface TorrentFile {
    async blob(): Promise<Blob>;
  }
}
