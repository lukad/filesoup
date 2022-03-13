open WebTorrent
open Webapi

let downloadBlobUrl = (name, blobUrl) => {
  let a = Dom.document->Dom.Document.createElement("a")
  Dom.Element.setAttribute(a, "download", name)
  Dom.Element.setAttribute(a, "href", blobUrl)
  switch ReactDOM.querySelector("#root") {
  | Some(root) => {
      root->Dom.Element.appendChild(~child=a)
      a->Dom.Element.asHtmlElement->Js.Option.getExn->Dom.HtmlElement.click
      root->Dom.Element.removeChild(~child=a)->ignore
    }
  | None => ()
  }
}

type leeching = {downloadSpeed: int, received: int, progress: int}
type state = Loading | Leeching(leeching) | NotFound | Done
let initialState = Loading

@scope("JSON") @val
external parseResponse: XHR.response => {"id": string, "magnetUri": string} = "parse"

let formatBytes = (~suffix="", bytes: int) => {
  let bytes = bytes->float_of_int
  let default = (bytes, "B")
  let (num, unit) = if bytes < 1024.0 {
    default
  } else if bytes < 1e6 {
    (bytes /. 1e3, "KB")
  } else if bytes < 1e9 {
    (bytes /. 1e6, "MB")
  } else if bytes < 1e12 {
    (bytes /. 1e9, "GB")
  } else {
    default
  }
  `${num->Js.Float.toFixedWithPrecision(~digits=2)} ${unit}${suffix}`
}

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
    | Some(magnetURI) =>
      {
        let torrent = client->Client.addMagnetURI(~magnetURI, ())

        torrent->Torrent.on(
          #download(
            _ => {
              if torrent.done {
                setState(_ => Done)
              } else {
                setState(_ => Leeching({
                  downloadSpeed: torrent.downloadSpeed->int_of_float,
                  received: torrent.received,
                  progress: (client.progress *. 100.0)->int_of_float,
                }))
              }
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

      Some(() => client->Client.remove(magnetURI))
    | None => None
    }
  }, [magnetURI])

  <div
    className="p-2 sm:p-4 w-96 max-w-full h-96 max-h-full flex flex-col justify-center items-center">
    {switch state {
    | Loading => <span> {"Loading"->React.string} </span>
    | Leeching({downloadSpeed, progress}) =>
      <ProgressBar label="Downloading" detail={downloadSpeed->formatBytes(~suffix="/s")} progress />
    | NotFound => <span> {"Not Found"->React.string} </span>
    | Done => <ProgressBar label="Done" progress={100} />
    }}
  </div>
}
