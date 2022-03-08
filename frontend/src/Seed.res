open WebTorrent
open Webapi

let link = id => {
  let location = Dom.location
  let host = location->Dom.Location.host
  let protocol = location->Dom.Location.protocol
  `${protocol}//${host}/${id}`
}

@scope("JSON") @val
external parseResponse: XHR.response => {"id": string, "magnetUri": string} = "parse"

@react.component
let make = (~client: Client.t) => {
  let (torrent: option<Torrent.t>, setTorrent) = React.useState(() => None)
  let (id, setId) = React.useState(() => "")
  let (processing, setProcessing) = React.useState(() => false)

  let onTorrent = React.useCallback0((t: Torrent.t) => {
    setTorrent(_ => Some(t))
  })

  let onChange = React.useCallback0(form => {
    setProcessing(_ => true)
    let fileList: FileList.t = ReactEvent.Form.target(form)["files"]
    client->Client.seedFileList(~fileList, ~cb=onTorrent, ())->ignore
  })

  React.useEffect1(() => {
    switch torrent {
    | None => ()
    | Some(torrent) => {
        let payload = Js.Dict.empty()
        Js.Dict.set(payload, "magnetUri", Js.Json.string(torrent.magnetURI))
        let body = payload->Js.Json.object_->Js.Json.stringify

        let request = XHR.makeXMLHttpRequest()
        request->XHR.addEventListener("load", () => {
          let response = request->XHR.response->parseResponse
          setId(_ => response["id"])
        })
        request->XHR.open_("POST", "/files")
        request->XHR.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
        request->XHR.send(body)
      }
    }
    None
  }, [torrent])

  <>
    <h1> {"Seed"->React.string} </h1>
    {switch torrent {
    | Some(_t) => <CopyToClipboard content={id->link} />
    | None => <input type_="file" disabled={processing} onChange={onChange} />
    }}
  </>
}
