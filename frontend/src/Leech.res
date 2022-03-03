open WebTorrent
open Webapi

let downloadBlobUrl = (name, blobUrl) => {
  let a = Dom.document->Dom.Document.createElement("a")
  Dom.Element.setAttribute(a, "download", name)
  Dom.Element.setAttribute(a, "href", blobUrl)
  let root = ReactDOM.querySelector("#root")

  root->Belt.Option.map(Dom.Element.appendChild(~child=a))->ignore
  a->Dom.Element.asHtmlElement->Belt.Option.map(Dom.HtmlElement.click)->ignore
  root->Belt.Option.map(Dom.Element.removeChild(~child=a))->ignore
}

type state = {downloadSpeed: int, received: int}
let initialState = {downloadSpeed: 0, received: 0}

@react.component
let make = (~client: Client.t, ~magnetURI: string) => {
  let (state, setState) = React.useState(() => initialState)

  React.useEffect0(() => {
    let torrent = client->Client.addMagnetURI(~magnetURI, ())
    torrent->Torrent.on(
      #download(
        _ => {
          setState(_ => {
            downloadSpeed: torrent.downloadSpeed,
            received: torrent.received,
          })
        },
      ),
    )
    torrent->Torrent.on(
      #done(
        () => {
          torrent.files
          ->Js.Array2.unsafe_get(0)
          ->WebTorrent.TorrentFile.blobURL((_, blobUrl) => {
            downloadBlobUrl(torrent.name, blobUrl)
          })
          ->ignore
        },
      ),
    )
    None
  })

  <>
    <h1> {"Leech"->React.string} </h1>
    <dl>
      <dt> {"Download Speed:"->React.string} </dt>
      <dd> {state.downloadSpeed->string_of_int->React.string} </dd>
      <dt> {"Received:"->React.string} </dt>
      <dd> {state.received->string_of_int->React.string} </dd>
    </dl>
  </>
}
