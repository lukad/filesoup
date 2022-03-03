open Webapi

@react.component
let make = () => {
  let client = WebTorrent.Client.make()

  let url = RescriptReactRouter.useUrl()

  switch url.path {
  | list{magnetURI} => <Leech client={client} magnetURI={magnetURI->Base64.atob} />
  | _ => <Seed client={client} />
  }
}
