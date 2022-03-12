let copy: string => unit = %raw(`(content) => navigator.clipboard.writeText(content)`)

@react.component
let make = (~content) => {
  <div className="flex flex-col w-auto p-2 sm:p-4">
    <Button onClick={_ => copy(content)}>
      <Heroicons.Outline.ClipboardIcon className="h-6" /> {"Copy Download Link"->React.string}
    </Button>
  </div>
}
