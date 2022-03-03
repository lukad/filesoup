module TorrentFile = {
  type t = {
    done: bool,
    name: string,
    path: string,
    length: int,
    downloaded: int,
    progress: float,
  }

  @send external blobURL: (t, (option<string>, string) => unit) => string = "getBlobURL"
}

module TorrentPiece = {
  type t = {length: int}
}

module Torrent = {
  type t = {
    done: bool,
    infoHash: string,
    magnetURI: string,
    torrentFile: Buffer.t,
    torrentFileBlobURL: string,
    files: array<TorrentFile.t>,
    announce: array<string>,
    @as("announce-list") announceList: array<array<string>>,
    pieces: array<TorrentPiece.t>,
    timeRemaining: float,
    received: int,
    downloaded: int,
    uploaded: int,
    downloadSpeed: int,
    uploadSpeed: int,
    progress: float,
    ratio: float,
    pieceLength: int,
    lastPieceLength: int,
    numPeers: int,
    path: string,
    ready: bool,
    paused: bool,
    name: string,
    created: Js.Date.t,
    createdBy: string,
    comment: string,
    maxWebConns: int,
  }

  @send
  external on: (
    t,
    @string [#done(unit => unit) | #upload(int => unit) | #download(int => unit)],
  ) => unit = "on"
}

module TorrentOptions = {
  type t = {x: int}
}

module Client = {
  type t = {
    torrents: array<Torrent.t>,
    downloadSpeed: int,
    uploadSpeed: int,
    progress: float,
    ratio: int,
  }

  @module("webtorrent") @new external make: unit => t = "default"

  @send external on: (t, @string [#torrent(Torrent.t => unit) | #error(string => unit)]) => t = "on"

  @send
  external addMagnetURI: (
    t,
    ~magnetURI: string,
    ~opts: TorrentOptions.t=?,
    ~cb: Torrent.t => unit=?,
    unit,
  ) => Torrent.t = "add"

  @send
  external seedFileList: (
    t,
    ~fileList: Webapi.FileList.t,
    ~cb: Torrent.t => unit=?,
    unit,
  ) => Torrent.t = "seed"
}
