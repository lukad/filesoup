@send external click: Dom.element => unit = "click"

@react.component
let make = (~onFiles: Webapi.FileList.t => unit) => {
  let (dragOver, setDragOver) = React.useState(() => false)

  let fileInput = React.useRef(Js.Nullable.null)

  let onChange = (e: ReactEvent.Form.t) => ReactEvent.Form.target(e)["files"]->onFiles

  let onDragEnter = ReactEvent.Mouse.preventDefault
  let onDragOver = e => {
    e->ReactEvent.Mouse.preventDefault
    setDragOver(_ => true)
  }
  let onDragLeave = _ => setDragOver(_ => false)
  let onDrop = e => {
    e->ReactEvent.Mouse.preventDefault
    Obj.magic(e)["dataTransfer"]["files"]->onFiles
  }

  let onClick = _ => {
    switch fileInput.current->Js.Nullable.toOption {
    | Some(input) => input->click
    | None => ()
    }
  }

  let class = if dragOver {
    "border-gray-400"
  } else {
    ""
  }

  <div
    className={`select-none w-full h-full p-2 sm:p-4 flex justify-center items-center`}
    onClick
    onDragEnter
    onDragOver
    onDragLeave
    onDrop
    onDragEnd={onDragLeave}>
    <div
      className={`border-4 border-dashed rounded p-2 sm:p-4 w-96 max-w-full h-96 max-h-full flex gap-2 justify-center items-center ${class}`}>
      <Heroicons.Outline.UploadIcon className="h-6" />
      {"Drag a file here"->React.string}
      <input
        type_="file" ref={ReactDOM.Ref.domRef(fileInput)} className="hidden" onChange={onChange}
      />
    </div>
  </div>
}
