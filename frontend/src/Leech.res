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

type leeching = {downloadSpeed: int, received: int}
type state = Loading | Leeching(leeching) | NotFound
let initialState = Loading

@scope("JSON") @val
external parseResponse: XHR.response => {"id": string, "magnetUri": string} = "parse"

@react.component
let make = (~client: Client.t, ~id: string) => {
  let (state, setState) = React.useState(() => initialState)
  let (magnetURI, setMagnetUri) = React.useState(() => None)

  React.useEffect0(() => {
    let request = XHR.makeXMLHttpRequest()
    request->XHR.addEventListener("load", () => {
      if request->XHR.status == 200 {
        let response = request->XHR.response->parseResponse
        setMagnetUri(_ => Some(response["magnetUri"]))
      } else {
        setState(_ => NotFound)
      }
    })
    request->XHR.open_("GET", `/files/${id}`)
    request->XHR.send("")

    None
  })

  React.useEffect1(() => {
    switch magnetURI {
    | Some(magnetURI) => {
        let torrent = client->Client.addMagnetURI(~magnetURI, ())

        torrent->Torrent.on(
          #download(
            _ => {
              setState(_ => Leeching({
                downloadSpeed: torrent.downloadSpeed,
                received: torrent.received,
              }))
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
      }
    | None => ()
    }
    None
  }, [magnetURI])

  <>
    <h1> {"Leech"->React.string} </h1>
    {switch state {
    | Loading => <span> {"Loading"->React.string} </span>
    | Leeching({downloadSpeed, received}) =>
      <dl>
        <dt> {"Download Speed:"->React.string} </dt>
        <dd> {downloadSpeed->string_of_int->React.string} </dd>
        <dt> {"Received:"->React.string} </dt>
        <dd> {received->string_of_int->React.string} </dd>
      </dl>
    | NotFound => <span> {"Not Found"->React.string} </span>
    }}
  </>
}
