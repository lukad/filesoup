open WebTorrent
open Webapi

module CommonState = {
  type t = {torrents: array<Torrent.t>}
}

let downloadBlobUrl = (filename, blobUrl) => {
  let a = Dom.document->Dom.Document.createElement("a")
  Dom.Element.setAttribute(a, "download", filename)
  Dom.Element.setAttribute(a, "href", blobUrl)

  let root = ReactDOM.querySelector("#root")
  root->Belt.Option.map(Dom.Element.appendChild(~child=a))->ignore
  a->Dom.Element.asHtmlElement->Belt.Option.map(Dom.HtmlElement.click)->ignore
  root->Belt.Option.map(Dom.Element.removeChild(~child=a))->ignore
  Js.Console.log(a)
}

type state = option<Torrent.t>

let link = (t: Torrent.t) => `http://localhost:1234/${t.magnetURI->Base64.btoa}`

@react.component
let make = (~client: Client.t) => {
  let (torrent: option<Torrent.t>, setTorrent) = React.useState(() => None)

  let cb = React.useCallback0((t: Torrent.t) => {
    // Js.Console.log("callback fired")

    // Js.Console.log(t.magnetURI->Base64.btoa)
    setTorrent(_ => Some(t))
  })

  React.useEffect1(() => {
    Js.Console.log(torrent)
    None
  }, [torrent])

  <>
    <h1> {"Seed"->React.string} </h1>
    {switch torrent {
    | Some(t) => <CopyToClipboard content={t->link} />
    | None =>
      <input
        type_="file"
        onChange={form => {
          let fileList: FileList.t = ReactEvent.Form.target(form)["files"]
          client
          ->Client.seedFileList(~fileList, ~cb, ())
          ->Torrent.on(#upload(bytes => Js.Console.log(bytes)))

          // torrent->Torrent.on
        }}
      />
    }}
  </>
}
