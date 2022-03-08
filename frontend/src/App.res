@react.component
let make = () => {
  let client = WebTorrent.Client.make()

  let url = RescriptReactRouter.useUrl()

  switch url.path {
  | list{id} => <Leech client={client} id={id} />
  | _ => <Seed client={client} />
  }
}
