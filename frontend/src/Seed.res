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

type state = Waiting | Processing | Seeding(string)
type action = SetProcessing | SetId(string)

let reducer = (_state, action) =>
  switch action {
  | SetProcessing => Processing
  | SetId(id) => Seeding(id)
  }

@react.component
let make = (~client: Client.t) => {
  let (state, dispatch) = React.useReducer(reducer, Waiting)

  let onTorrent = React.useCallback0((t: Torrent.t) => {
    let payload = Js.Dict.empty()
    Js.Dict.set(payload, "magnetUri", Js.Json.string(t.magnetURI))
    let body = payload->Js.Json.object_->Js.Json.stringify

    let request = XHR.makeXMLHttpRequest()
    request->XHR.addEventListener("load", () => {
      let response = request->XHR.response->parseResponse
      dispatch(SetId(response["id"]))
    })
    request->XHR.open_("POST", "/files")
    request->XHR.setRequestHeader("Content-Type", "application/json; charset=UTF-8")
    request->XHR.send(body)
  })

  let onFiles = React.useCallback0(fileList => {
    dispatch(SetProcessing)
    client->Client.seedFileList(~fileList, ~cb=onTorrent, ())->ignore
  })

  <div className="flex w-full h-full justify-center items-center">
    {switch state {
    | Waiting => <FileInput onFiles />
    | Processing => <Spinner />
    | Seeding(id) => <CopyToClipboard content={id->link} />
    }}
  </div>
}
