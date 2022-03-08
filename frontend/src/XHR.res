type request
type response
@new external makeXMLHttpRequest: unit => request = "XMLHttpRequest"
@send external addEventListener: (request, string, unit => unit) => unit = "addEventListener"
@get external response: request => response = "response"
@get external status: request => int = "status"
@send external open_: (request, string, string) => unit = "open"
@send external send: (request, string) => unit = "send"
@send external setRequestHeader: (request, string, string) => unit = "setRequestHeader"
@send external abort: request => unit = "abort"

@scope("JSON") @val
external parseResponse: response => {"id": string, "magnetUri": string} = "parse"
